import { Hono } from "hono";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import type { GetDashboardSummaryUseCase } from "../application/use-cases/GetDashboardSummaryUseCase";

export function createDashboardRoutes(useCase: GetDashboardSummaryUseCase) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /dashboard/summary
  app.get("/summary", async (c) => {
    const user = c.get("user");
    const summary = await useCase.execute({
      userId: user.userId,
      role: user.role,
      schoolId: user.schoolId,
    });
    return c.json({ data: summary, error: null, meta: null }, 200);
  });

  return app;
}
