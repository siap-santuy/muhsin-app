import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetDashboardSummaryUseCase } from "../application/use-cases/GetDashboardSummaryUseCase";
import type { GetKoorStudentActivityUseCase } from "../application/use-cases/GetKoorStudentActivityUseCase";
import type { GetKoorTeacherActivityUseCase } from "../application/use-cases/GetKoorTeacherActivityUseCase";
import type { RecordParentViewUseCase } from "../application/use-cases/RecordParentViewUseCase";
import type { RemindParentUseCase } from "../application/use-cases/RemindParentUseCase";
import type { RemindStudentUseCase } from "../application/use-cases/RemindStudentUseCase";
import { ReminderRateLimitedError, AlreadyFilledError } from "../domain/errors/ActivityErrors";

export interface DashboardRoutesDeps {
  summaryUseCase: GetDashboardSummaryUseCase;
  studentActivityUseCase: GetKoorStudentActivityUseCase;
  teacherActivityUseCase: GetKoorTeacherActivityUseCase;
  recordParentViewUseCase: RecordParentViewUseCase;
  remindParentUseCase: RemindParentUseCase;
  remindStudentUseCase: RemindStudentUseCase;
}

const remindParentSchema = z.object({ studentId: z.string().uuid() });
const remindStudentSchema = z.object({ studentId: z.string().uuid().optional() });

function isSummaryOnly(deps: DashboardRoutesDeps | GetDashboardSummaryUseCase): deps is GetDashboardSummaryUseCase {
  return (deps as DashboardRoutesDeps).summaryUseCase === undefined;
}

export function createDashboardRoutes(deps: DashboardRoutesDeps | GetDashboardSummaryUseCase) {
  const app = new Hono<{ Variables: AuthVariables }>();
  const full: DashboardRoutesDeps | null = isSummaryOnly(deps) ? null : deps;
  const summaryOnly = isSummaryOnly(deps) ? deps : deps.summaryUseCase;

  // GET /dashboard/summary
  app.get("/summary", async (c) => {
    const user = c.get("user");
    const summary = await summaryOnly.execute({
      userId: user.userId,
      role: user.role,
      schoolId: user.schoolId,
    });
    if (full && user.role === "parent") {
      void full.recordParentViewUseCase
        .resolveFirstChild(user.userId, user.schoolId)
        .then((targetId) =>
          targetId
            ? full.recordParentViewUseCase.execute({
                schoolId: user.schoolId,
                parentId: user.userId,
                studentId: targetId,
                source: "dashboard",
              })
            : undefined
        )
        .catch(() => {});
    }
    return c.json({ data: summary, error: null, meta: null }, 200);
  });

  if (!full) return app;

  // GET /dashboard/koor-student-activity?date=&classId=
  app.get("/koor-student-activity", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);
    const classId = c.req.query("classId") ?? undefined;
    const rows = await full.studentActivityUseCase.execute({ schoolId: user.schoolId, date, classId });
    return c.json({ data: rows.map(serializeRow), error: null, meta: null }, 200);
  });

  // GET /dashboard/koor-teacher-activity
  app.get("/koor-teacher-activity", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);
    const rows = await full.teacherActivityUseCase.execute({ schoolId: user.schoolId, date });
    return c.json({ data: rows.map(serializeRow), error: null, meta: null }, 200);
  });

  // POST /dashboard/remind-parent {studentId}
  app.post("/remind-parent", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    const parsed = remindParentSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
    }
    try {
      const res = await full.remindParentUseCase.execute({ schoolId: user.schoolId, studentId: parsed.data.studentId });
      return c.json({ data: res, error: null, meta: null }, 200);
    } catch (err: any) {
      if (err instanceof ReminderRateLimitedError || err?.code === "RATE_LIMITED") {
        return c.json({ data: null, error: { code: "RATE_LIMITED", message: err.message }, meta: null }, 429);
      }
      return c.json({ data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null }, 422);
    }
  });

  // POST /dashboard/remind-student {studentId?}
  app.post("/remind-student", requireRole("parent"), async (c) => {
    const user = c.get("user");
    const parsed = remindStudentSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
    }
    try {
      const res = await full.remindStudentUseCase.execute({
        schoolId: user.schoolId,
        parentId: user.userId,
        studentId: parsed.data.studentId,
      });
      return c.json({ data: res, error: null, meta: null }, 200);
    } catch (err: any) {
      if (err instanceof ReminderRateLimitedError || err?.code === "RATE_LIMITED") {
        return c.json({ data: null, error: { code: "RATE_LIMITED", message: err.message }, meta: null }, 429);
      }
      if (err instanceof AlreadyFilledError || err?.code === "ALREADY_FILLED") {
        return c.json({ data: null, error: { code: "ALREADY_FILLED", message: err.message }, meta: null }, 422);
      }
      return c.json({ data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null }, 422);
    }
  });

  return app;
}

function serializeRow(row: any) {
  const out: any = { ...row };
  if (out.parentLastViewAt instanceof Date) out.parentLastViewAt = out.parentLastViewAt.toISOString();
  if (out.lastAssessmentAt instanceof Date) out.lastAssessmentAt = out.lastAssessmentAt.toISOString();
  return out;
}
