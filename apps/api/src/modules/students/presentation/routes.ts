import { Hono } from "hono";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetStudentsUseCase } from "../application/use-cases/GetStudentsUseCase";
import type { GetStudentByIdUseCase } from "../application/use-cases/GetStudentByIdUseCase";

export interface StudentRoutesDeps {
  getStudentsUseCase: GetStudentsUseCase;
  getStudentByIdUseCase: GetStudentByIdUseCase;
}

export function createStudentRoutes(deps: StudentRoutesDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /students — list students (filtered by halaqah for teacher, all for koordinator)
  app.get(
    "/",
    requireRole("teacher", "koordinator_ttq", "parent"),
    async (c) => {
      const user = c.get("user");
      const teacherId = c.req.query("teacherId");
      const date = c.req.query("date");
      const classId = c.req.query("classId");

      const students = await deps.getStudentsUseCase.execute({
        schoolId: user.schoolId,
        teacherId,
        role: user.role,
        userId: user.userId,
        date,
        classId,
      });

      return c.json({ data: students, error: null, meta: null }, 200);
    }
  );

  // GET /students/:id — get student detail
  app.get(
    "/:id",
    requireRole("teacher", "koordinator_ttq", "parent", "student"),
    async (c) => {
      const user = c.get("user");
      const id = c.req.param("id");

      // Student can only see their own profile
      if (user.role === "student" && user.userId !== id) {
        return c.json(
          { data: null, error: { code: "FORBIDDEN", message: "Akses ditolak" }, meta: null },
          403
        );
      }

      try {
        const student = await deps.getStudentByIdUseCase.execute(
          id ?? "",
          user.schoolId
        );
        return c.json({ data: student, error: null, meta: null }, 200);
      } catch (err: any) {
        return c.json(
          { data: null, error: { code: "NOT_FOUND", message: err.message }, meta: null },
          404
        );
      }
    }
  );

  return app;
}
