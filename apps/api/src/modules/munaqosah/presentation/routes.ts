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

const createRequestBodySchema = z.object({
  studentId: z.string().uuid(),
  juzKe: z.number().int().min(1).max(30),
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
  scores: z.record(z.number().min(0).max(100)),
  hasil: z.enum(["lulus", "tidak_lulus"]),
  catatanPenguji: z.string().optional(),
});

export interface MunaqosahRoutesDeps {
  getRequestsUseCase: GetMunaqosahRequestsUseCase;
  getMyExamsUseCase: GetMyMunaqosahExamsUseCase;
  createRequestUseCase: CreateMunaqosahRequestUseCase;
  updateStatusUseCase: UpdateMunaqosahStatusUseCase;
  scheduleUseCase: ScheduleMunaqosahUseCase;
  examinersUseCase: ManageMunaqosahExaminersUseCase;
  submitResultUseCase: SubmitMunaqosahResultUseCase;
}

export function createMunaqosahRoutes(deps: MunaqosahRoutesDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

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

  // POST /munaqosah/requests — pengajuan dari guru
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

      const id = await deps.createRequestUseCase.execute({
        schoolId: user.schoolId,
        studentId: parsed.data.studentId,
        teacherId: user.userId,
        juzKe: parsed.data.juzKe,
      });

      return c.json({ data: { id, message: "Pengajuan berhasil dibuat" }, error: null, meta: null }, 201);
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

      await deps.updateStatusUseCase.execute({
        id,
        schoolId: user.schoolId,
        status: "ditolak",
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

      await deps.submitResultUseCase.execute({
        assignmentId,
        scores: parsed.data.scores,
        hasil: parsed.data.hasil,
        catatanPenguji: parsed.data.catatanPenguji,
        actorUserId: user.userId,
        actorRole: user.role,
        schoolId: user.schoolId,
      });

      return c.json({ data: { message: "Hasil munaqosah berhasil disimpan" }, error: null, meta: null }, 200);
    }
  );

  return app;
}
