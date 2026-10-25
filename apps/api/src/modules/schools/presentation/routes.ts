import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../../../db/client";
import { schools } from "../../../db/schema";
import { eq } from "drizzle-orm";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { ManageStudentUseCase, ManageTeacherUseCase } from "../application/use-cases/ManageSchoolUserUseCase";
import type { ManageParentUseCase } from "../application/use-cases/ManageParentUseCase";
import type { ResetDefaultPasswordUseCase } from "../application/use-cases/ResetDefaultPasswordUseCase";
import type { ISchoolAdminRepository } from "../domain/repositories/ISchoolAdminRepository";
import type { IPasswordResetRequestRepository } from "../../../modules/auth/domain/repositories/IPasswordResetRequestRepository";

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
  manageParentUseCase?: ManageParentUseCase;
  resetDefaultPasswordUseCase?: ResetDefaultPasswordUseCase;
  passwordResetRequestRepo?: IPasswordResetRequestRepository;
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

  // POST /schools/students/:id/reset-password
  // Reset password santri & orang tua ke default tanggal lahir santri (DDMMYYYY)
  app.post("/students/:id/reset-password", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.resetDefaultPasswordUseCase) {
      return c.json({ data: null, error: { message: "Fitur reset belum tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    const studentId = c.req.param("id") ?? "";
    try {
      const res = await deps.resetDefaultPasswordUseCase.resetStudentAndParent(studentId, user.schoolId);
      return c.json({
        data: res,
        error: null,
        meta: null,
      }, 200);
    } catch (err: any) {
      return handleError(err, c);
    }
  });

  // POST /schools/teachers/:id/reset-password
  // Reset password guru ke default awal 'muhsin123'
  app.post("/teachers/:id/reset-password", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.resetDefaultPasswordUseCase) {
      return c.json({ data: null, error: { message: "Fitur reset belum tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    const teacherId = c.req.param("id") ?? "";
    try {
      const res = await deps.resetDefaultPasswordUseCase.resetTeacher(teacherId, user.schoolId);
      return c.json({
        data: res,
        error: null,
        meta: null,
      }, 200);
    } catch (err: any) {
      return handleError(err, c);
    }
  });

  // GET /schools/parents — Daftar Orang Tua & Relasi Santri
  app.get("/parents", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.manageParentUseCase) {
      return c.json({ data: null, error: { message: "Service belum tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    try {
      const data = await deps.manageParentUseCase.list(user.schoolId);
      return c.json({ data, error: null, meta: null }, 200);
    } catch (err: any) {
      return handleError(err, c);
    }
  });

  // PUT /schools/parents/:id — Update Profil Ortu & Relasi Anak
  app.put("/parents/:id", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.manageParentUseCase) {
      return c.json({ data: null, error: { message: "Service belum tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    const parentId = c.req.param("id") ?? "";
    const body = await c.req.json().catch(() => ({}));
    try {
      await deps.manageParentUseCase.update(parentId, user.schoolId, body);
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    } catch (err: any) {
      return handleError(err, c);
    }
  });

  // POST /schools/parents/:id/reset-password — Reset Password Akun Orang Tua Langsung
  app.post("/parents/:id/reset-password", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.resetDefaultPasswordUseCase) {
      return c.json({ data: null, error: { message: "Fitur reset belum tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    const parentId = c.req.param("id") ?? "";
    try {
      const res = await deps.resetDefaultPasswordUseCase.resetParentDirect(parentId, user.schoolId);
      return c.json({ data: res, error: null, meta: null }, 200);
    } catch (err: any) {
      return handleError(err, c);
    }
  });

  // GET /schools/password-reset-requests — List antrean permintaan reset password
  app.get("/password-reset-requests", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.passwordResetRequestRepo) {
      return c.json({ data: [], error: null, meta: null }, 200);
    }
    const user = c.get("user");
    const list = await deps.passwordResetRequestRepo.listPendingBySchool(user.schoolId);
    return c.json({ data: list, error: null, meta: null }, 200);
  });

  // POST /schools/password-reset-requests/:id/resolve — Eksekusi reset password sesuai role user
  app.post("/password-reset-requests/:id/resolve", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.passwordResetRequestRepo || !deps.resetDefaultPasswordUseCase) {
      return c.json({ data: null, error: { message: "Fitur reset belum tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    const requestId = c.req.param("id");
    const reqItem = await deps.passwordResetRequestRepo.findById(requestId, user.schoolId);
    if (!reqItem) {
      return c.json({ data: null, error: { code: "NOT_FOUND", message: "Permohonan tidak ditemukan" }, meta: null }, 404);
    }
    if (reqItem.status !== "pending") {
      return c.json({ data: null, error: { code: "ALREADY_RESOLVED", message: "Permohonan sudah diproses sebelumnya" }, meta: null }, 400);
    }

    try {
      // Dapatkan data user target
      const targetUser = await deps.adminRepo.findStudentWithParents(reqItem.userId, user.schoolId).catch(() => null);
      let defaultPassword = "muhsin123";
      let studentName = "";

      if (targetUser) {
        // Santri
        const res = await deps.resetDefaultPasswordUseCase.resetStudentAndParent(reqItem.userId, user.schoolId);
        defaultPassword = res.defaultPassword;
        studentName = res.studentName;
      } else {
        const teacher = await deps.adminRepo.findTeacher(reqItem.userId, user.schoolId).catch(() => null);
        if (teacher) {
          // Guru
          const res = await deps.resetDefaultPasswordUseCase.resetTeacher(reqItem.userId, user.schoolId);
          defaultPassword = res.defaultPassword;
          studentName = res.teacherName;
        } else {
          // Orang tua
          const res = await deps.resetDefaultPasswordUseCase.resetParentDirect(reqItem.userId, user.schoolId);
          defaultPassword = res.defaultPassword;
        }
      }

      const now = new Date();
      await deps.passwordResetRequestRepo.update({
        ...reqItem,
        status: "resolved",
        resolvedBy: user.userId,
        resolvedAt: now,
        updatedAt: now,
      });

      return c.json(
        {
          data: {
            success: true,
            defaultPassword,
            userName: studentName,
          },
          error: null,
          meta: null,
        },
        200
      );
    } catch (err: any) {
      return handleError(err, c);
    }
  });

  // POST /schools/password-reset-requests/:id/reject — Tolak permohonan reset password
  app.post("/password-reset-requests/:id/reject", requireRole("koordinator_ttq"), async (c) => {
    if (!deps.passwordResetRequestRepo) {
      return c.json({ data: null, error: { message: "Fitur reset belum tersedia" }, meta: null }, 500);
    }
    const user = c.get("user");
    const requestId = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const reqItem = await deps.passwordResetRequestRepo.findById(requestId, user.schoolId);
    if (!reqItem) {
      return c.json({ data: null, error: { code: "NOT_FOUND", message: "Permohonan tidak ditemukan" }, meta: null }, 404);
    }
    if (reqItem.status !== "pending") {
      return c.json({ data: null, error: { code: "ALREADY_RESOLVED", message: "Permohonan sudah diproses sebelumnya" }, meta: null }, 400);
    }

    const now = new Date();
    await deps.passwordResetRequestRepo.update({
      ...reqItem,
      status: "rejected",
      resolvedBy: user.userId,
      resolvedAt: now,
      rejectionNote: body?.rejectionNote || "Permohonan ditolak oleh Koordinator",
      updatedAt: now,
    });

    return c.json({ data: { success: true }, error: null, meta: null }, 200);
  });

  return app;
}
