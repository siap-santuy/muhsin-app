import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetTeachersUseCase } from "../application/use-cases/GetTeachersUseCase";
import type { ManageSubstitutionUseCase } from "../application/use-cases/ManageSubstitutionUseCase";

const createSubstitutionSchema = z.object({
  absentTeacherId: z.string().uuid(),
  substituteTeacherId: z.string().uuid(),
  classId: z.string().uuid(),
  dateStart: z.string(),
  dateEnd: z.string(),
  reason: z.string().optional().nullable(),
});

export interface TeacherRoutesDeps {
  getTeachersUseCase: GetTeachersUseCase;
  manageSubstitutionUseCase?: ManageSubstitutionUseCase;
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

  // GET /teachers/substitutions — list all substitutions (koordinator & teacher)
  app.get(
    "/substitutions",
    requireRole("koordinator_ttq", "teacher"),
    async (c) => {
      if (!deps.manageSubstitutionUseCase) {
        return c.json({ data: [], error: null, meta: null }, 200);
      }
      const user = c.get("user");
      const list = await deps.manageSubstitutionUseCase.list(user.schoolId);
      return c.json({ data: list, error: null, meta: null }, 200);
    }
  );

  // POST /teachers/substitutions — create temporary teacher substitution (koordinator only)
  app.post(
    "/substitutions",
    requireRole("koordinator_ttq"),
    async (c) => {
      if (!deps.manageSubstitutionUseCase) {
        return c.json(
          { data: null, error: { code: "NOT_CONFIGURED", message: "Service not configured" }, meta: null },
          500
        );
      }
      const user = c.get("user");
      const body = await c.req.json();
      const parsed = createSubstitutionSchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
          400
        );
      }

      try {
        const result = await deps.manageSubstitutionUseCase.create({
          schoolId: user.schoolId,
          ...parsed.data,
        });
        return c.json({ data: result, error: null, meta: null }, 201);
      } catch (err: any) {
        return c.json(
          { data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null },
          422
        );
      }
    }
  );

  // DELETE /teachers/substitutions/:id — cancel/delete substitution (koordinator only)
  app.delete(
    "/substitutions/:id",
    requireRole("koordinator_ttq"),
    async (c) => {
      if (!deps.manageSubstitutionUseCase) {
        return c.json(
          { data: null, error: { code: "NOT_CONFIGURED", message: "Service not configured" }, meta: null },
          500
        );
      }
      const user = c.get("user");
      const id = c.req.param("id");

      await deps.manageSubstitutionUseCase.delete(id ?? "", user.schoolId);
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    }
  );

  return app;
}
