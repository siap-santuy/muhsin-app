import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../../../db/client";
import { schools } from "../../../db/schema";
import { eq } from "drizzle-orm";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { ManageStudentUseCase, ManageTeacherUseCase } from "../application/use-cases/ManageSchoolUserUseCase";
import type { ISchoolAdminRepository } from "../domain/repositories/ISchoolAdminRepository";

export function createPublicSchoolRoutes(db: Db) {
  const app = new Hono();

  // GET /schools/public/:slug
  app.get("/public/:slug", async (c) => {
    const slug = c.req.param("slug");
    let rows = await db
      .select({
        id: schools.id,
        slug: schools.slug,
        name: schools.name,
        jenjang: schools.jenjang,
        address: schools.address,
        logoUrl: schools.logoUrl,
      })
      .from(schools)
      .where(eq(schools.slug, slug))
      .limit(1);

    if (rows.length === 0) {
      // Fallback to first school
      rows = await db
        .select({
          id: schools.id,
          slug: schools.slug,
          name: schools.name,
          jenjang: schools.jenjang,
          address: schools.address,
          logoUrl: schools.logoUrl,
        })
        .from(schools)
        .limit(1);
    }

    if (rows.length === 0) {
      return c.json(
        { data: null, error: { code: "NOT_FOUND", message: "Sekolah tidak ditemukan" }, meta: null },
        404
      );
    }

    return c.json({ data: rows[0], error: null, meta: null }, 200);
  });

  // GET /schools/public
  app.get("/public", async (c) => {
    const slug = c.req.query("slug");
    if (slug) {
      const rows = await db
        .select({
          id: schools.id,
          slug: schools.slug,
          name: schools.name,
          jenjang: schools.jenjang,
          address: schools.address,
          logoUrl: schools.logoUrl,
        })
        .from(schools)
        .where(eq(schools.slug, slug))
        .limit(1);

      if (rows.length > 0) {
        return c.json({ data: rows[0], error: null, meta: null }, 200);
      }
    }

    const rows = await db
      .select({
        id: schools.id,
        slug: schools.slug,
        name: schools.name,
        jenjang: schools.jenjang,
        address: schools.address,
        logoUrl: schools.logoUrl,
      })
      .from(schools)
      .limit(1);

    if (rows.length === 0) {
      return c.json(
        { data: null, error: { code: "NOT_FOUND", message: "Sekolah tidak ditemukan" }, meta: null },
        404
      );
    }

    return c.json({ data: rows[0], error: null, meta: null }, 200);
  });

  return app;
}

const managedStudentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  gender: z.enum(["ikhwan", "akhwat"]).optional().nullable(),
  nisn: z.string().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
});

const updateManagedUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
});

const managedTeacherSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
});

export interface SchoolAdminRoutesDeps {
  adminRepo: ISchoolAdminRepository;
  manageStudentUseCase: ManageStudentUseCase;
  manageTeacherUseCase: ManageTeacherUseCase;
}

export function createSchoolAdminRoutes(deps: SchoolAdminRoutesDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  function handleError(err: any, c: any) {
    const msg = err?.message || "Gagal memproses permintaan";
    const status = msg.includes("sudah") ? 409 : 422;
    return c.json({ data: null, error: { code: "BUSINESS_ERROR", message: msg }, meta: null }, status);
  }

  app.get("/classes", requireRole("koordinator_ttq", "teacher"), async (c) => {
    const user = c.get("user");
    const list = await deps.adminRepo.getClasses(user.schoolId);
    return c.json({ data: list, error: null, meta: null }, 200);
  });

  app.get("/active-period", requireRole("koordinator_ttq", "teacher"), async (c) => {
    const user = c.get("user");
    const period = await deps.adminRepo.getActivePeriod(user.schoolId);
    return c.json({ data: period, error: null, meta: null }, 200);
  });

  app.get("/munaqosah-periods", requireRole("koordinator_ttq", "teacher"), async (c) => {
    const user = c.get("user");
    const list = await deps.adminRepo.getMunaqosahPeriods(user.schoolId);
    return c.json({ data: list, error: null, meta: null }, 200);
  });

  app.post("/students", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    const parsed = managedStudentSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
    }
    try {
      const res = await deps.manageStudentUseCase.create({ schoolId: user.schoolId, ...parsed.data });
      return c.json({ data: res, error: null, meta: null }, 201);
    } catch (err: any) {
      return handleError(err, c);
    }
  });

  app.put("/students/:id", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    const parsed = updateManagedUserSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
    }
    try {
      await deps.manageStudentUseCase.update(c.req.param("id") ?? "", user.schoolId, parsed.data);
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    } catch (err: any) {
      return handleError(err, c);
    }
  });

  app.delete("/students/:id", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    await deps.manageStudentUseCase.delete(c.req.param("id") ?? "", user.schoolId);
    return c.json({ data: { success: true }, error: null, meta: null }, 200);
  });

  app.post("/teachers", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    const parsed = managedTeacherSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
    }
    try {
      const res = await deps.manageTeacherUseCase.create({ schoolId: user.schoolId, ...parsed.data });
      return c.json({ data: res, error: null, meta: null }, 201);
    } catch (err: any) {
      return handleError(err, c);
    }
  });

  app.put("/teachers/:id", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    const parsed = updateManagedUserSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
    }
    try {
      await deps.manageTeacherUseCase.update(c.req.param("id") ?? "", user.schoolId, parsed.data);
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    } catch (err: any) {
      return handleError(err, c);
    }
  });

  app.delete("/teachers/:id", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    await deps.manageTeacherUseCase.delete(c.req.param("id") ?? "", user.schoolId);
    return c.json({ data: { success: true }, error: null, meta: null }, 200);
  });

  return app;
}
