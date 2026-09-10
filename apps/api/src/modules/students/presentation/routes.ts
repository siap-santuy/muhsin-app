import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetStudentsUseCase } from "../application/use-cases/GetStudentsUseCase";
import type { GetStudentByIdUseCase } from "../application/use-cases/GetStudentByIdUseCase";
import type { ManageStudentUseCase } from "../../schools/application/use-cases/ManageSchoolUserUseCase";

const legacyStudentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  gender: z.enum(["ikhwan", "akhwat"]).optional().nullable(),
  nisn: z.string().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
});

const legacyStudentUpdateSchema = legacyStudentSchema.partial();

export interface StudentRoutesDeps {
  getStudentsUseCase: GetStudentsUseCase;
  getStudentByIdUseCase: GetStudentByIdUseCase;
  manageStudentUseCase?: ManageStudentUseCase;
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

  app.post("/", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.manageStudentUseCase) {
      return c.json({ data: null, error: { code: "NOT_CONFIGURED", message: "Service tidak tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    const parsed = legacyStudentSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
    }
    try {
      const res = await deps.manageStudentUseCase.create({ schoolId: user.schoolId, ...parsed.data });
      return c.json({ data: res, error: null, meta: null }, 201);
    } catch (err: any) {
      return c.json({ data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null }, 422);
    }
  });

  app.put("/:id", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.manageStudentUseCase) {
      return c.json({ data: null, error: { code: "NOT_CONFIGURED", message: "Service tidak tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    const parsed = legacyStudentUpdateSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
    }
    try {
      await deps.manageStudentUseCase.update(c.req.param("id") ?? "", user.schoolId, parsed.data);
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    } catch (err: any) {
      return c.json({ data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null }, 422);
    }
  });

  app.delete("/:id", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.manageStudentUseCase) {
      return c.json({ data: null, error: { code: "NOT_CONFIGURED", message: "Service tidak tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    await deps.manageStudentUseCase.delete(c.req.param("id") ?? "", user.schoolId);
    return c.json({ data: { success: true }, error: null, meta: null }, 200);
  });

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
