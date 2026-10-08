import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { SubmitDailyIbadahUseCase } from "../application/use-cases/SubmitDailyIbadahUseCase";
import type { SaveDraftDailyIbadahUseCase } from "../application/use-cases/SaveDraftDailyIbadahUseCase";
import type { GetDailyIbadahStatsUseCase } from "../application/use-cases/GetDailyIbadahStatsUseCase";
import type { IDailyIbadahRepository } from "../domain/repositories/IDailyIbadahRepository";

const sholatFardhuSchema = z.object({
  subuh: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  dzuhur: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  ashar: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  maghrib: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  isya: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
});

const tilawahSchema = z.object({
  surahStart: z.number().int().min(1).max(114),
  ayatStart: z.number().int().min(1),
  surahEnd: z.number().int().min(1).max(114),
  ayatEnd: z.number().int().min(1),
});

const dailyIbadahBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sholatFardhu: sholatFardhuSchema.optional().nullable(),
  sholatRawatib: z.array(z.string()).optional().nullable(),
  tahajud: z.boolean().optional(),
  dhuha: z.boolean().optional(),
  puasaSunnah: z.string().optional().nullable(),
  tilawah: tilawahSchema.optional().nullable(),
});

export interface DailyIbadahRoutesDeps {
  repo: IDailyIbadahRepository;
  submitUseCase: SubmitDailyIbadahUseCase;
  saveDraftUseCase: SaveDraftDailyIbadahUseCase;
  getStatsUseCase: GetDailyIbadahStatsUseCase;
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

  // POST /api/daily-ibadah/draft
  app.post("/draft", requireRole("student"), async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = dailyIbadahBodySchema.safeParse(body);

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
    const parsed = dailyIbadahBodySchema.safeParse(body);

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

  return app;
}
