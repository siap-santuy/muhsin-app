import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetMunaqosahRequestsUseCase } from "../application/use-cases/GetMunaqosahRequestsUseCase";
import type { GetMyMunaqosahExamsUseCase } from "../application/use-cases/GetMyMunaqosahExamsUseCase";
import type { CreateMunaqosahRequestUseCase } from "../application/use-cases/CreateMunaqosahRequestUseCase";
import type { UpdateMunaqosahStatusUseCase } from "../application/use-cases/UpdateMunaqosahStatusUseCase";
import type { ScheduleMunaqosahUseCase } from "../application/use-cases/ScheduleMunaqosahUseCase";
import type { ManageMunaqosahExaminersUseCase } from "../application/use-cases/ManageMunaqosahExaminersUseCase";
import type { SubmitMunaqosahResultUseCase } from "../application/use-cases/SubmitMunaqosahResultUseCase";
import type { IMunaqosahRepository } from "../domain/repositories/IMunaqosahRepository";

const createRequestBodySchema = z.object({
  studentId: z.string().uuid(),
  juzKe: z.number().int().min(1).max(30).optional(),
  juzList: z.array(z.number().int().min(1).max(30)).optional(),
  periodId: z.string().uuid().optional(),
});

const scheduleBodySchema = z.object({
  periodId: z.string().uuid(),
  examinerTeacherId: z.string().uuid(),
  jadwalTanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jadwalWaktu: z.string().optional(),
});

const examinerBodySchema = z.object({
  teacherId: z.string().uuid(),
  kapasitasSiswa: z.number().int().min(1).max(100),
});

const resultBodySchema = z.object({
  scores: z
    .object({
      tajwid: z.number().min(0).max(100),
      kelancaran: z.number().min(0).max(100),
    })
    .passthrough(),
  hasil: z.enum(["lulus", "tidak_lulus"]),
  catatanPenguji: z.string().optional(),
});

const createPeriodBodySchema = z.object({
  academicPeriodId: z.string().uuid(),
  nama: z.string().min(3),
  tanggalMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tanggalSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["draft", "buka", "tutup"]).optional(),
});

const updatePeriodBodySchema = z.object({
  nama: z.string().min(3).optional(),
  tanggalMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tanggalSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["draft", "buka", "tutup"]).optional(),
  isResultPublished: z.boolean().optional(),
});

const publishPeriodBodySchema = z.object({
  isResultPublished: z.boolean(),
});

export interface MunaqosahRoutesDeps {
  repo: IMunaqosahRepository;
  getRequestsUseCase: GetMunaqosahRequestsUseCase;
  getMyExamsUseCase: GetMyMunaqosahExamsUseCase;
  createRequestUseCase: CreateMunaqosahRequestUseCase;
  updateStatusUseCase: UpdateMunaqosahStatusUseCase;
  scheduleUseCase: ScheduleMunaqosahUseCase;
  examinersUseCase: ManageMunaqosahExaminersUseCase;
  submitResultUseCase: SubmitMunaqosahResultUseCase;
  resolveStudentId?: (user: any, requestedId?: string) => Promise<string>;
}

export function createMunaqosahRoutes(deps: MunaqosahRoutesDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /munaqosah/periods — list periode munaqosah
  app.get(
    "/periods",
    requireRole("koordinator_ttq", "teacher", "student", "parent"),
    async (c) => {
      const user = c.get("user");
      const list = await deps.repo.findPeriods(user.schoolId);
      return c.json({ data: list, error: null, meta: null }, 200);
    }
  );

  // POST /munaqosah/periods — buat periode munaqosah baru (Koordinator)
  app.post(
    "/periods",
    requireRole("koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const body = await c.req.json();
      const parsed = createPeriodBodySchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
          400
        );
      }

      const id = await deps.repo.createPeriod({
        schoolId: user.schoolId,
        academicPeriodId: parsed.data.academicPeriodId,
        nama: parsed.data.nama,
        tanggalMulai: parsed.data.tanggalMulai,
        tanggalSelesai: parsed.data.tanggalSelesai,
        status: parsed.data.status ?? "buka",
      });

      return c.json({ data: { id, message: "Periode munaqosah berhasil dibuat" }, error: null, meta: null }, 201);
    }
  );

  // PATCH /munaqosah/periods/:id — update periode
  app.patch(
    "/periods/:id",
    requireRole("koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const id = c.req.param("id");
      const body = await c.req.json();
      const parsed = updatePeriodBodySchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
          400
        );
      }

      await deps.repo.updatePeriod(id, user.schoolId, parsed.data);
      return c.json({ data: { message: "Periode munaqosah berhasil diperbarui" }, error: null, meta: null }, 200);
    }
  );

  // POST /munaqosah/periods/:id/publish — rilis / sembunyikan nilai ke siswa & ortu
  app.post(
    "/periods/:id/publish",
    requireRole("koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const id = c.req.param("id");
      const body = await c.req.json();
      const parsed = publishPeriodBodySchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
          400
        );
      }

      await deps.repo.updatePeriod(id, user.schoolId, { isResultPublished: parsed.data.isResultPublished });
      const msg = parsed.data.isResultPublished
        ? "Nilai munaqosah resmi dirilis ke siswa dan orang tua"
        : "Publikasi nilai munaqosah ditarik kembali";
      return c.json({ data: { message: msg }, error: null, meta: null }, 200);
    }
  );

  // GET /munaqosah/requests
  app.get(
    "/requests",
    requireRole("koordinator_ttq", "teacher"),
    async (c) => {
      const user = c.get("user");
      const status = c.req.query("status");
      const requests = await deps.getRequestsUseCase.execute(
        user.schoolId,
        status
      );
      return c.json({ data: requests, error: null, meta: null }, 200);
    }
  );

  // GET /munaqosah/my-exams — tugas penguji milik guru login
  app.get(
    "/my-exams",
    requireRole("teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const exams = await deps.getMyExamsUseCase.execute(user.userId, user.schoolId);
      return c.json({ data: exams, error: null, meta: null }, 200);
    }
  );

  // GET /munaqosah/student-eligibility — cek juz yang sudah lulus / pending / siap uji
  app.get(
    "/student-eligibility",
    requireRole("teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const studentId = c.req.query("studentId");
      if (!studentId) {
        return c.json({ data: null, error: { message: "studentId wajib diisi" }, meta: null }, 400);
      }
      const data = await deps.repo.getStudentEligibility(studentId, user.schoolId);
      return c.json({ data, error: null, meta: null }, 200);
    }
  );

  // GET /munaqosah/teacher-loads?periodId=
  app.get(
    "/teacher-loads",
    requireRole("koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const periodId = c.req.query("periodId");
      if (!periodId) {
        return c.json({ data: [], error: null, meta: null }, 200);
      }
      const list = await deps.repo.getTeacherAssignmentCounts(periodId, user.schoolId);
      return c.json({ data: list, error: null, meta: null }, 200);
    }
  );

  // GET /munaqosah/my-schedule — jadwal & riwayat munaqosah untuk santri & orang tua
  app.get(
    "/my-schedule",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      let studentId = user.userId;
      if (deps.resolveStudentId) {
        studentId = await deps.resolveStudentId(user, c.req.query("studentId"));
      } else if (c.req.query("studentId")) {
        studentId = c.req.query("studentId")!;
      }

      const schedule = await deps.repo.findStudentSchedule(studentId, user.schoolId);
      return c.json({ data: schedule, error: null, meta: null }, 200);
    }
  );

  // POST /munaqosah/requests — pengajuan dari guru (bisa multi-juz)
  app.post(
    "/requests",
    requireRole("teacher"),
    async (c) => {
      const user = c.get("user");
      const body = await c.req.json();
      const parsed = createRequestBodySchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
          400
        );
      }

      try {
        const id = await deps.createRequestUseCase.execute({
          schoolId: user.schoolId,
          studentId: parsed.data.studentId,
          teacherId: user.userId,
          juzKe: parsed.data.juzKe,
          juzList: parsed.data.juzList,
          periodId: parsed.data.periodId,
        });

        return c.json({ data: { id, message: "Pengajuan berhasil dibuat" }, error: null, meta: null }, 201);
      } catch (err: any) {
        return c.json(
          { data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null },
          422
        );
      }
    }
  );

  // PATCH /munaqosah/requests/:id/approve
  app.patch(
    "/requests/:id/approve",
    requireRole("koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const id = c.req.param("id") ?? "";

      await deps.updateStatusUseCase.execute({
        id,
        schoolId: user.schoolId,
        status: "disetujui",
      });

      return c.json({ data: { message: "Pengajuan disetujui" }, error: null, meta: null }, 200);
    }
  );

  // PATCH /munaqosah/requests/:id/reject
  app.patch(
    "/requests/:id/reject",
    requireRole("koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const id = c.req.param("id") ?? "";
      const body = await c.req.json().catch(() => ({}));

      await deps.updateStatusUseCase.execute({
        id,
        schoolId: user.schoolId,
        status: "ditolak",
        rejectionNote: body?.rejectionNote,
      });

      return c.json({ data: { message: "Pengajuan ditolak" }, error: null, meta: null }, 200);
    }
  );

  // POST /munaqosah/requests/:id/schedule
  app.post(
    "/requests/:id/schedule",
    requireRole("koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const requestId = c.req.param("id") ?? "";
      const body = await c.req.json();
      const parsed = scheduleBodySchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
          400
        );
      }

      try {
        const assignmentId = await deps.scheduleUseCase.execute({
          requestId,
          periodId: parsed.data.periodId,
          examinerTeacherId: parsed.data.examinerTeacherId,
          jadwalTanggal: parsed.data.jadwalTanggal,
          jadwalWaktu: parsed.data.jadwalWaktu,
          assignedBy: user.userId,
          schoolId: user.schoolId,
        });

        return c.json({ data: { assignmentId, message: "Jadwal dan penguji berhasil ditetapkan" }, error: null, meta: null }, 200);
      } catch (err: any) {
        return c.json(
          { data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null },
          422
        );
      }
    }
  );

  // GET /munaqosah/periods/:periodId/examiners — pool penguji per periode
  app.get(
    "/periods/:periodId/examiners",
    requireRole("koordinator_ttq", "teacher"),
    async (c) => {
      const user = c.get("user");
      const periodId = c.req.param("periodId") ?? "";
      const list = await deps.examinersUseCase.list(periodId, user.schoolId);
      return c.json({ data: list, error: null, meta: null }, 200);
    }
  );

  // POST /munaqosah/periods/:periodId/examiners — tambah/update penguji + kapasitas
  app.post(
    "/periods/:periodId/examiners",
    requireRole("koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const periodId = c.req.param("periodId") ?? "";
      const body = await c.req.json();
      const parsed = examinerBodySchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
          400
        );
      }

      const id = await deps.examinersUseCase.add({
        periodId,
        teacherId: parsed.data.teacherId,
        kapasitasSiswa: parsed.data.kapasitasSiswa,
        assignedBy: user.userId,
        schoolId: user.schoolId,
      });

      return c.json({ data: { id, message: "Penguji berhasil disimpan" }, error: null, meta: null }, 201);
    }
  );

  // DELETE /munaqosah/periods/:periodId/examiners/:teacherId — hapus dari pool
  app.delete(
    "/periods/:periodId/examiners/:teacherId",
    requireRole("koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const periodId = c.req.param("periodId") ?? "";
      const teacherId = c.req.param("teacherId") ?? "";
      await deps.examinersUseCase.remove(periodId, teacherId, user.schoolId);
      return c.json({ data: { message: "Penguji dihapus dari pool" }, error: null, meta: null }, 200);
    }
  );

  // POST /munaqosah/assignments/:id/result — input hasil ujian
  app.post(
    "/assignments/:id/result",
    requireRole("teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const assignmentId = c.req.param("id") ?? "";
      const body = await c.req.json();
      const parsed = resultBodySchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
          400
        );
      }

      try {
        const res = await deps.submitResultUseCase.execute({
          assignmentId,
          scores: parsed.data.scores,
          hasil: parsed.data.hasil,
          catatanPenguji: parsed.data.catatanPenguji,
          actorUserId: user.userId,
          actorRole: user.role,
          schoolId: user.schoolId,
        });

        return c.json({ data: { message: "Hasil munaqosah berhasil disimpan", result: res }, error: null, meta: null }, 200);
      } catch (err: any) {
        return c.json(
          { data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null },
          422
        );
      }
    }
  );

  return app;
}
