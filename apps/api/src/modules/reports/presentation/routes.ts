import { Hono } from "hono";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetMonthlyRaportUseCase } from "../application/use-cases/GetMonthlyRaportUseCase";
import type { GetSemesterRaportUseCase } from "../application/use-cases/GetSemesterRaportUseCase";

export interface RaportRoutesDeps {
  getMonthlyRaportUseCase: GetMonthlyRaportUseCase;
  getSemesterRaportUseCase: GetSemesterRaportUseCase;
}

export function createRaportRoutes(deps: RaportRoutesDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /raport/monthly?studentId=&month=YYYY-MM
  app.get(
    "/monthly",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const targetStudentId = c.req.query("studentId") ?? user.userId;
      const month = c.req.query("month") ?? new Date().toISOString().slice(0, 7);

      const raport = await deps.getMonthlyRaportUseCase.execute(
        targetStudentId,
        month,
        user.schoolId
      );

      return c.json({ data: raport, error: null, meta: null }, 200);
    }
  );

  // GET /raport/semester?studentId=&semester=&tahunAjaran=
  app.get(
    "/semester",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const targetStudentId = c.req.query("studentId") ?? user.userId;
      const semester = c.req.query("semester") ?? "Ganjil";
      const tahunAjaran = c.req.query("tahunAjaran") ?? "2026/2027";

      const raport = await deps.getSemesterRaportUseCase.execute(
        targetStudentId,
        semester,
        tahunAjaran,
        user.schoolId
      );

      return c.json({ data: raport, error: null, meta: null }, 200);
    }
  );

  return app;
}
