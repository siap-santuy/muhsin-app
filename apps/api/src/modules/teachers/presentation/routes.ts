import { Hono } from "hono";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetTeachersUseCase } from "../application/use-cases/GetTeachersUseCase";

export interface TeacherRoutesDeps {
  getTeachersUseCase: GetTeachersUseCase;
}

export function createTeacherRoutes(deps: TeacherRoutesDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /teachers — list teachers
  app.get(
    "/",
    requireRole("koordinator_ttq", "teacher", "parent", "student"),
    async (c) => {
      const user = c.get("user");
      const teachers = await deps.getTeachersUseCase.execute(user.schoolId);
      return c.json({ data: teachers, error: null, meta: null }, 200);
    }
  );

  return app;
}
