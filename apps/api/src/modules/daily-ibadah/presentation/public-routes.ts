import { Hono } from "hono";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import type { Db } from "../../../db/client";
import { schools, classes, users, studentClassEnrollment } from "../../../db/schema";
import type { SubmitDailyIbadahUseCase } from "../application/use-cases/SubmitDailyIbadahUseCase";
import type { IDailyIbadahRepository } from "../domain/repositories/IDailyIbadahRepository";

const sholatFardhuSchema = z.object({
  subuh: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  dzuhur: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  ashar: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  maghrib: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
  isya: z.enum(["BA", "MA", "BT", "MT", "H", "T"]),
});

const tilawahSchema = z.object({
  surahStart: z.number().int().min(1).max(114),
  ayatStart: z.number().int().min(1),
  surahEnd: z.number().int().min(1).max(114),
  ayatEnd: z.number().int().min(1),
});

const publicSubmitSchema = z.object({
  studentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sholatFardhu: sholatFardhuSchema.optional().nullable(),
  sholatRawatib: z.array(z.string()).optional().nullable(),
  tahajud: z.boolean().optional(),
  dhuha: z.boolean().optional(),
  puasaSunnah: z.string().optional().nullable(),
  tilawah: tilawahSchema.optional().nullable(),
});

export interface PublicDailyIbadahRoutesDeps {
  db: Db;
  submitUseCase: SubmitDailyIbadahUseCase;
  repo: IDailyIbadahRepository;
}

export function createPublicDailyIbadahRoutes(deps: PublicDailyIbadahRoutesDeps) {
  const app = new Hono();

  async function resolveSchool(slug: string) {
    let rows = await deps.db
      .select({ id: schools.id, slug: schools.slug, name: schools.name })
      .from(schools)
      .where(eq(schools.slug, slug))
      .limit(1);

    if (rows.length === 0) {
      rows = await deps.db
        .select({ id: schools.id, slug: schools.slug, name: schools.name })
        .from(schools)
        .limit(1);
    }

    return rows[0] || null;
  }

  // GET /public/daily-ibadah/:slug/classes
  app.get("/:slug/classes", async (c) => {
    const slug = c.req.param("slug");
    const school = await resolveSchool(slug);
    if (!school) {
      return c.json({ data: null, error: { code: "NOT_FOUND", message: "Sekolah tidak ditemukan" }, meta: null }, 404);
    }

    const list = await deps.db
      .select({
        id: classes.id,
        name: classes.name,
      })
      .from(classes)
      .where(eq(classes.schoolId, school.id))
      .orderBy(asc(classes.name));

    return c.json({ data: list, error: null, meta: null }, 200);
  });

  // GET /public/daily-ibadah/:slug/students?classId=
  app.get("/:slug/students", async (c) => {
    const slug = c.req.param("slug");
    const classId = c.req.query("classId");
    const school = await resolveSchool(slug);
    if (!school) {
      return c.json({ data: null, error: { code: "NOT_FOUND", message: "Sekolah tidak ditemukan" }, meta: null }, 404);
    }

    const conditions = [
      eq(users.schoolId, school.id),
      eq(users.role, "student"),
    ];

    if (classId) {
      conditions.push(eq(studentClassEnrollment.classId, classId));
    }

    const rows = await deps.db
      .select({
        id: users.id,
        name: users.name,
        classId: studentClassEnrollment.classId,
      })
      .from(users)
      .leftJoin(
        studentClassEnrollment,
        and(
          eq(studentClassEnrollment.studentId, users.id),
          eq(studentClassEnrollment.schoolId, school.id)
        )
      )
      .where(and(...conditions))
      .orderBy(asc(users.name));

    return c.json({ data: rows, error: null, meta: null }, 200);
  });

  // GET /public/daily-ibadah/:slug/status?studentId=&date=
  app.get("/:slug/status", async (c) => {
    const slug = c.req.param("slug");
    const studentId = c.req.query("studentId");
    const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);

    if (!studentId) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", message: "studentId diperlukan" }, meta: null }, 400);
    }

    const school = await resolveSchool(slug);
    if (!school) {
      return c.json({ data: null, error: { code: "NOT_FOUND", message: "Sekolah tidak ditemukan" }, meta: null }, 404);
    }

    const record = await deps.repo.findByStudentAndDate(studentId, date, school.id);
    return c.json({
      data: {
        status: record ? record.status : null,
        record: record ? {
          date: record.date,
          status: record.status,
          sholatFardhu: record.sholatFardhu,
          sholatRawatib: record.sholatRawatib,
          tahajud: record.tahajud,
          dhuha: record.dhuha,
          puasaSunnah: record.puasaSunnah,
          tilawah: record.tilawah,
        } : null,
      },
      error: null,
      meta: null,
    }, 200);
  });

  // POST /public/daily-ibadah/:slug/submit
  app.post("/:slug/submit", async (c) => {
    const slug = c.req.param("slug");
    const school = await resolveSchool(slug);
    if (!school) {
      return c.json({ data: null, error: { code: "NOT_FOUND", message: "Sekolah tidak ditemukan" }, meta: null }, 404);
    }

    const body = await c.req.json();
    const parsed = publicSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
        400
      );
    }

    // Verify student belongs to this school
    const [student] = await deps.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(
        and(
          eq(users.id, parsed.data.studentId),
          eq(users.schoolId, school.id),
          eq(users.role, "student")
        )
      )
      .limit(1);

    if (!student) {
      return c.json(
        { data: null, error: { code: "FORBIDDEN", message: "Siswa tidak terdaftar di sekolah ini" }, meta: null },
        403
      );
    }

    try {
      const result = await deps.submitUseCase.execute({
        schoolId: school.id,
        studentId: student.id,
        ...parsed.data,
      });

      return c.json({ data: result, error: null, meta: null }, 200);
    } catch (err: any) {
      return c.json(
        { data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null },
        422
      );
    }
  });

  return app;
}
