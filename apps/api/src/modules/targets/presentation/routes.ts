import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetHafalanTargetUseCase } from "../application/use-cases/GetHafalanTargetUseCase";
import type { SetHafalanTargetUseCase } from "../application/use-cases/SetHafalanTargetUseCase";
import type { GetStudentPositionUseCase } from "../application/use-cases/GetStudentPositionUseCase";

const setTargetBodySchema = z.object({
  bulan: z.string().regex(/^\d{4}-\d{2}$/),
  studentIds: z.array(z.string().uuid()).min(1),
  targetSurahStart: z.string().min(1),
  targetAyatStart: z.string().default("1"),
  targetSurahEnd: z.string().min(1),
  targetAyatEnd: z.string().default("1"),
  catatan: z.string().optional().nullable(),
});

export interface TargetRoutesDeps {
  getTargetUseCase: GetHafalanTargetUseCase;
  setTargetUseCase: SetHafalanTargetUseCase;
  getStudentPositionUseCase?: GetStudentPositionUseCase;
  resolveStudentId?: (
    user: { userId: string; role: string; schoolId: string },
    requestedStudentId?: string
  ) => Promise<string>;
}

export function createTargetRoutes(deps: TargetRoutesDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /hafalan-targets/student-position?studentId= — posisi terakhir & rekomendasi start santri
  app.get(
    "/student-position",
    requireRole("teacher", "koordinator_ttq", "student", "parent"),
    async (c) => {
      const user = c.get("user");
      const targetStudentId = deps.resolveStudentId
        ? await deps.resolveStudentId(user, c.req.query("studentId"))
        : (c.req.query("studentId") ?? user.userId);

      if (!deps.getStudentPositionUseCase) {
        return c.json({ data: null, error: { code: "NOT_CONFIGURED", message: "Service tidak tersedia" }, meta: null }, 500);
      }

      const position = await deps.getStudentPositionUseCase.execute({
        studentId: targetStudentId,
        schoolId: user.schoolId,
      });

      return c.json({ data: position, error: null, meta: null }, 200);
    }
  );

  // GET /hafalan-targets/current?studentId=&month=
  app.get(
    "/current",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const targetStudentId = deps.resolveStudentId
        ? await deps.resolveStudentId(user, c.req.query("studentId"))
        : (c.req.query("studentId") ?? user.userId);

      const bulan = c.req.query("month") ?? new Date().toISOString().slice(0, 7);

      const target = await deps.getTargetUseCase.execute({
        studentId: targetStudentId,
        bulan,
        schoolId: user.schoolId,
      });

      return c.json({ data: target, error: null, meta: null }, 200);
    }
  );

  // POST /hafalan-targets — khusus guru pembimbing atau koordinator (mendukung bulk studentIds)
  app.post(
    "/",
    requireRole("teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const body = await c.req.json();
      const parsed = setTargetBodySchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          {
            data: null,
            error: {
              code: "VALIDATION_ERROR",
              details: parsed.error.format(),
            },
            meta: null,
          },
          400
        );
      }

      try {
        const results = await deps.setTargetUseCase.execute({
          schoolId: user.schoolId,
          teacherId: user.userId,
          bulan: parsed.data.bulan,
          studentIds: parsed.data.studentIds,
          targetSurahStart: parsed.data.targetSurahStart,
          targetAyatStart: parsed.data.targetAyatStart,
          targetSurahEnd: parsed.data.targetSurahEnd,
          targetAyatEnd: parsed.data.targetAyatEnd,
          catatan: parsed.data.catatan,
        });

        return c.json({ data: results, error: null, meta: null }, 200);
      } catch (err: any) {
        return c.json(
          {
            data: null,
            error: { code: "BUSINESS_ERROR", message: err.message },
            meta: null,
          },
          422
        );
      }
    }
  );

  return app;
}
