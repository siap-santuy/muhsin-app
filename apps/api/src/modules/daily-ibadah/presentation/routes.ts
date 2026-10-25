import { Hono } from "hono";
import { z } from "zod";
import { tilawahSchema } from "@muhsin/shared";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { SubmitDailyIbadahUseCase } from "../application/use-cases/SubmitDailyIbadahUseCase";
import type { SaveDraftDailyIbadahUseCase } from "../application/use-cases/SaveDraftDailyIbadahUseCase";
import type { GetDailyIbadahStatsUseCase } from "../application/use-cases/GetDailyIbadahStatsUseCase";
import type { RequestYaumiyahAccessUseCase } from "../application/use-cases/RequestYaumiyahAccessUseCase";
import type { ApproveYaumiyahAccessUseCase } from "../application/use-cases/ApproveYaumiyahAccessUseCase";
import type { RejectYaumiyahAccessUseCase } from "../application/use-cases/RejectYaumiyahAccessUseCase";
import type { GrantYaumiyahAccessUseCase } from "../application/use-cases/GrantYaumiyahAccessUseCase";
import type { IDailyIbadahRepository } from "../domain/repositories/IDailyIbadahRepository";
import type { IYaumiyahAccessRequestRepository } from "../domain/repositories/IYaumiyahAccessRequestRepository";
import { isWithinDirectWindow, getDaysDiffFromToday } from "../domain/services/YaumiyahWindowService";

const sholatFardhuSchema = z.object({
  subuh: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  dzuhur: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  ashar: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  maghrib: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  isya: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
});

const partialSholatFardhuSchema = z.object({
  subuh: z.enum(["BA", "MA", "BT", "MT", "H", "T"]).optional(),
  dzuhur: z.enum(["BA", "MA", "BT", "MT", "H", "T"]).optional(),
  ashar: z.enum(["BA", "MA", "BT", "MT", "H", "T"]).optional(),
  maghrib: z.enum(["BA", "MA", "BT", "MT", "H", "T"]).optional(),
  isya: z.enum(["BA", "MA", "BT", "MT", "H", "T"]).optional(),
});

const dailyIbadahDraftBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sholatFardhu: partialSholatFardhuSchema.optional().nullable(),
  sholatRawatib: z.array(z.string()).optional().nullable(),
  tahajud: z.boolean().optional(),
  dhuha: z.boolean().optional(),
  puasaSunnah: z.string().optional().nullable(),
  tilawah: tilawahSchema.optional().nullable(),
});

const dailyIbadahSubmitBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sholatFardhu: sholatFardhuSchema.optional().nullable(),
  sholatRawatib: z.array(z.string()).optional().nullable(),
  tahajud: z.boolean().optional(),
  dhuha: z.boolean().optional(),
  puasaSunnah: z.string().optional().nullable(),
  tilawah: tilawahSchema.optional().nullable(),
});

const requestAccessBodySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(5),
});

const directGrantBodySchema = z.object({
  studentId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
  durationHours: z.number().int().min(1).max(168).optional(),
});

const rejectAccessBodySchema = z.object({
  rejectionNote: z.string().optional(),
});

export interface DailyIbadahRoutesDeps {
  repo: IDailyIbadahRepository;
  accessRequestRepo?: IYaumiyahAccessRequestRepository;
  submitUseCase: SubmitDailyIbadahUseCase;
  saveDraftUseCase: SaveDraftDailyIbadahUseCase;
  getStatsUseCase: GetDailyIbadahStatsUseCase;
  requestAccessUseCase?: RequestYaumiyahAccessUseCase;
  approveAccessUseCase?: ApproveYaumiyahAccessUseCase;
  rejectAccessUseCase?: RejectYaumiyahAccessUseCase;
  grantAccessUseCase?: GrantYaumiyahAccessUseCase;
  resolveStudentId?: (user: { userId: string; role: string; schoolId: string }, requestedStudentId?: string) => Promise<string>;
}

export function createDailyIbadahRoutes(deps: DailyIbadahRoutesDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /api/daily-ibadah?date=YYYY-MM-DD&studentId=
  app.get(
    "/",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const targetStudentId = deps.resolveStudentId
        ? await deps.resolveStudentId(user, c.req.query("studentId"))
        : (c.req.query("studentId") ?? user.userId);
      const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);

      const ibadah = await deps.repo.findByStudentAndDate(
        targetStudentId,
        date,
        user.schoolId
      );

      return c.json({ data: ibadah, error: null, meta: null }, 200);
    }
  );

  // GET /api/daily-ibadah/history?studentId=&month=YYYY-MM
  app.get(
    "/history",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const targetStudentId = deps.resolveStudentId
        ? await deps.resolveStudentId(user, c.req.query("studentId"))
        : (c.req.query("studentId") ?? user.userId);
      const month = c.req.query("month") ?? new Date().toISOString().slice(0, 7);

      const history = await deps.repo.findByMonth(
        targetStudentId,
        month,
        user.schoolId
      );

      return c.json({ data: history, error: null, meta: null }, 200);
    }
  );

  // GET /api/daily-ibadah/stats?studentId=&month=YYYY-MM
  app.get(
    "/stats",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const targetStudentId = deps.resolveStudentId
        ? await deps.resolveStudentId(user, c.req.query("studentId"))
        : (c.req.query("studentId") ?? user.userId);
      const month = c.req.query("month") ?? new Date().toISOString().slice(0, 7);

      const stats = await deps.getStatsUseCase.execute({
        studentId: targetStudentId,
        month,
        schoolId: user.schoolId,
      });

      return c.json({ data: stats, error: null, meta: null }, 200);
    }
  );

  // GET /api/daily-ibadah/window-status?date=YYYY-MM-DD
  app.get("/window-status", requireRole("student"), async (c) => {
    const user = c.get("user");
    const date = c.req.query("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", message: "date required" }, meta: null }, 400);
    }

    const diff = getDaysDiffFromToday(date);
    const isDirect = isWithinDirectWindow(date);

    let activeGrant = null;
    let pendingRequest = null;

    if (deps.accessRequestRepo) {
      activeGrant = await deps.accessRequestRepo.findActiveApproved(user.userId, date, user.schoolId);
      pendingRequest = await deps.accessRequestRepo.findPendingOverlap(user.userId, date, date, user.schoolId);
    }

    return c.json(
      {
        data: {
          date,
          diffDays: diff,
          isDirectWindow: isDirect,
          isOpen: isDirect || !!activeGrant,
          activeGrant: activeGrant ? { id: activeGrant.id, expiresAt: activeGrant.expiresAt } : null,
          pendingRequest: pendingRequest ? { id: pendingRequest.id, startDate: pendingRequest.startDate, endDate: pendingRequest.endDate } : null,
        },
        error: null,
        meta: null,
      },
      200
    );
  });

  // POST /api/daily-ibadah/draft
  app.post("/draft", requireRole("student"), async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = dailyIbadahDraftBodySchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
        400
      );
    }

    try {
      const entity = await deps.saveDraftUseCase.execute({
        schoolId: user.schoolId,
        studentId: user.userId,
        ...parsed.data,
      });
      return c.json({ data: entity, error: null, meta: null }, 200);
    } catch (err: any) {
      return c.json(
        { data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null },
        422
      );
    }
  });

  // POST /api/daily-ibadah/submit
  app.post("/submit", requireRole("student"), async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = dailyIbadahSubmitBodySchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
        400
      );
    }

    try {
      const result = await deps.submitUseCase.execute({
        schoolId: user.schoolId,
        studentId: user.userId,
        ...parsed.data,
      });
      return c.json({ data: result, error: null, meta: null }, 200);
    } catch (err: any) {
      return c.json(
        { data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null },
        422
      );
    }
  });

  // POST /api/daily-ibadah/access-requests (Student request)
  app.post("/access-requests", requireRole("student"), async (c) => {
    if (!deps.requestAccessUseCase) {
      return c.json({ data: null, error: { code: "NOT_SUPPORTED", message: "Fitur tidak tersedia" }, meta: null }, 501);
    }
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = requestAccessBodySchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
        400
      );
    }

    try {
      const entity = await deps.requestAccessUseCase.execute({
        schoolId: user.schoolId,
        studentId: user.userId,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        reason: parsed.data.reason,
      });
      return c.json({ data: entity, error: null, meta: null }, 201);
    } catch (err: any) {
      return c.json(
        { data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null },
        422
      );
    }
  });

  // GET /api/daily-ibadah/access-requests (Student list / Teacher-Koor list pending)
  app.get("/access-requests", requireRole("student", "teacher", "koordinator_ttq"), async (c) => {
    if (!deps.accessRequestRepo) {
      return c.json({ data: [], error: null, meta: null }, 200);
    }
    const user = c.get("user");

    if (user.role === "student") {
      const requests = await deps.accessRequestRepo.listByStudent(user.userId, user.schoolId);
      return c.json({ data: requests, error: null, meta: null }, 200);
    }

    // Teacher or Koordinator
    const teacherId = user.role === "teacher" ? user.userId : undefined;
    const statusParam = c.req.query("status") as any;
    const status = statusParam === "all" || statusParam === "approved" || statusParam === "rejected" || statusParam === "pending" ? statusParam : "pending";
    const page = Number(c.req.query("page")) || 1;
    const limit = Number(c.req.query("limit")) || 10;

    const res = await deps.accessRequestRepo.listPaginated(
      user.schoolId,
      { status, page, limit },
      teacherId
    );

    return c.json(
      {
        data: res.data,
        error: null,
        meta: {
          total: res.total,
          page: res.page,
          limit: res.limit,
          totalPages: res.totalPages,
        },
      },
      200
    );
  });

  // PATCH /api/daily-ibadah/access-requests/:id/approve (Teacher/Koor)
  app.patch("/access-requests/:id/approve", requireRole("teacher", "koordinator_ttq"), async (c) => {
    if (!deps.approveAccessUseCase) {
      return c.json({ data: null, error: { code: "NOT_SUPPORTED", message: "Fitur tidak tersedia" }, meta: null }, 501);
    }
    const user = c.get("user");
    const id = c.req.param("id");

    try {
      const entity = await deps.approveAccessUseCase.execute({
        requestId: id,
        schoolId: user.schoolId,
        reviewerId: user.userId,
        reviewerRole: user.role,
      });
      return c.json({ data: entity, error: null, meta: null }, 200);
    } catch (err: any) {
      return c.json(
        { data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null },
        422
      );
    }
  });

  // PATCH /api/daily-ibadah/access-requests/:id/reject (Teacher/Koor)
  app.patch("/access-requests/:id/reject", requireRole("teacher", "koordinator_ttq"), async (c) => {
    if (!deps.rejectAccessUseCase) {
      return c.json({ data: null, error: { code: "NOT_SUPPORTED", message: "Fitur tidak tersedia" }, meta: null }, 501);
    }
    const user = c.get("user");
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const parsed = rejectAccessBodySchema.safeParse(body);

    try {
      const entity = await deps.rejectAccessUseCase.execute({
        requestId: id,
        schoolId: user.schoolId,
        reviewerId: user.userId,
        reviewerRole: user.role,
        rejectionNote: parsed.success ? parsed.data.rejectionNote : undefined,
      });
      return c.json({ data: entity, error: null, meta: null }, 200);
    } catch (err: any) {
      return c.json(
        { data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null },
        422
      );
    }
  });

  // POST /api/daily-ibadah/direct-grant (Teacher/Koor direct grant)
  app.post("/direct-grant", requireRole("teacher", "koordinator_ttq"), async (c) => {
    if (!deps.grantAccessUseCase) {
      return c.json({ data: null, error: { code: "NOT_SUPPORTED", message: "Fitur tidak tersedia" }, meta: null }, 501);
    }
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = directGrantBodySchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
        400
      );
    }

    try {
      const entity = await deps.grantAccessUseCase.execute({
        schoolId: user.schoolId,
        studentId: parsed.data.studentId,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        reason: parsed.data.reason,
        durationHours: parsed.data.durationHours,
        granterId: user.userId,
        granterRole: user.role,
      });
      return c.json({ data: entity, error: null, meta: null }, 201);
    } catch (err: any) {
      return c.json(
        { data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null },
        422
      );
    }
  });

  return app;
}
