import { Hono } from "hono";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetGamificationSummaryUseCase } from "../application/use-cases/GetGamificationSummaryUseCase";

export function createGamificationRoutes(
  getSummaryUseCase: GetGamificationSummaryUseCase
) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /api/gamification/summary
  // Akses: student (self), parent (anak), teacher/koordinator
  app.get("/summary", requireRole("student", "parent", "teacher", "koordinator_ttq"), async (c) => {
    const user = c.get("user");
    const targetStudentId = c.req.query("studentId") ?? user.userId;

    const summary = await getSummaryUseCase.execute(
      targetStudentId,
      user.schoolId
    );

    return c.json({ data: summary, error: null, meta: null }, 200);
  });

  return app;
}
