import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetTeachersUseCase } from "../application/use-cases/GetTeachersUseCase";
import type { ManageSubstitutionUseCase } from "../application/use-cases/ManageSubstitutionUseCase";
import type { ManageTeacherUseCase } from "../../schools/application/use-cases/ManageSchoolUserUseCase";

const createSubstitutionSchema = z.object({
  absentTeacherId: z.string().uuid(),
  substituteTeacherId: z.string().uuid(),
  classId: z.string().uuid(),
  dateStart: z.string(),
  dateEnd: z.string(),
  reason: z.string().optional().nullable(),
});

const managedTeacherSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
});

const updateManagedTeacherSchema = managedTeacherSchema.partial();

export interface TeacherRoutesDeps {
  getTeachersUseCase: GetTeachersUseCase;
  manageSubstitutionUseCase?: ManageSubstitutionUseCase;
  manageTeacherUseCase?: ManageTeacherUseCase;
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

  app.post("/", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.manageTeacherUseCase) {
      return c.json({ data: null, error: { code: "NOT_CONFIGURED", message: "Service tidak tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    const parsed = managedTeacherSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
    }
    try {
      const res = await deps.manageTeacherUseCase.create({ schoolId: user.schoolId, ...parsed.data });
      return c.json({ data: res, error: null, meta: null }, 201);
    } catch (err: any) {
      return c.json({ data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null }, 422);
    }
  });

  app.put("/:id", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.manageTeacherUseCase) {
      return c.json({ data: null, error: { code: "NOT_CONFIGURED", message: "Service tidak tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    const parsed = updateManagedTeacherSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
    }
    try {
      await deps.manageTeacherUseCase.update(c.req.param("id") ?? "", user.schoolId, parsed.data);
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    } catch (err: any) {
      return c.json({ data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null }, 422);
    }
  });

  app.delete("/:id", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.manageTeacherUseCase) {
      return c.json({ data: null, error: { code: "NOT_CONFIGURED", message: "Service tidak tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    await deps.manageTeacherUseCase.delete(c.req.param("id") ?? "", user.schoolId);
    return c.json({ data: { success: true }, error: null, meta: null }, 200);
  });

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
