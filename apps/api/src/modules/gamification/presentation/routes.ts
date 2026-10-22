import { Hono } from "hono";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetGamificationSummaryUseCase } from "../application/use-cases/GetGamificationSummaryUseCase";
import type { GetStudentAchievementsUseCase } from "../application/use-cases/GetStudentAchievementsUseCase";

export function createGamificationRoutes(
  getSummaryUseCase: GetGamificationSummaryUseCase,
  resolveStudentId?: (user: { userId: string; role: string; schoolId: string }, requestedStudentId?: string) => Promise<string>,
  getAchievementsUseCase?: GetStudentAchievementsUseCase
) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /api/gamification/summary
  // Akses: student (self), parent (anak), teacher/koordinator
  app.get("/summary", requireRole("student", "parent", "teacher", "koordinator_ttq"), async (c) => {
    const user = c.get("user");
    const targetStudentId = resolveStudentId
      ? await resolveStudentId(user, c.req.query("studentId"))
      : (c.req.query("studentId") ?? user.userId);

    const summary = await getSummaryUseCase.execute(
      targetStudentId,
      user.schoolId
    );

    return c.json({ data: summary, error: null, meta: null }, 200);
  });

  // GET /api/gamification/achievements
  // Akses: student (self), parent (anak), teacher/koordinator
  app.get("/achievements", requireRole("student", "parent", "teacher", "koordinator_ttq"), async (c) => {
    if (!getAchievementsUseCase) {
      return c.json({ data: null, error: "Achievements service not initialized", meta: null }, 500);
    }

    const user = c.get("user");
    const targetStudentId = resolveStudentId
      ? await resolveStudentId(user, c.req.query("studentId"))
      : (c.req.query("studentId") ?? user.userId);

    const achievements = await getAchievementsUseCase.execute(
      targetStudentId,
      user.schoolId
    );

    return c.json({ data: achievements, error: null, meta: null }, 200);
  });

  return app;
}
