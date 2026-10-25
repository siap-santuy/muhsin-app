import type { Db } from "../../../db/client";
import {
  users,
  classes,
  studentClassEnrollment,
  parentStudentMapping,
  munaqosahPeriods,
  munaqosahExaminers,
  munaqosahRequests,
  munaqosahAssignments,
  studentAchievements,
} from "../../../db/schema";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import type { IMunaqosahRepository } from "../domain/repositories/IMunaqosahRepository";
import type {
  MunaqosahRequestItem,
  MunaqosahExaminerItem,
  MunaqosahPeriodItem,
} from "../domain/entities/Munaqosah";

export class DrizzleMunaqosahRepository implements IMunaqosahRepository {
  constructor(private readonly db: Db) {}

  async findRequests(
    schoolId: string,
    status?: string
  ): Promise<MunaqosahRequestItem[]> {
    const conditions = [eq(munaqosahRequests.schoolId, schoolId)];
    if (status) {
      conditions.push(eq(munaqosahRequests.status, status as any));
    }

    const rows = await this.db
      .select({
        id: munaqosahRequests.id,
        periodId: munaqosahRequests.periodId,
        studentId: munaqosahRequests.studentId,
        studentName: users.name,
        teacherId: munaqosahRequests.teacherId,
        juzKe: munaqosahRequests.juzKe,
        juzList: munaqosahRequests.juzList,
        status: munaqosahRequests.status,
        rejectionNote: munaqosahRequests.rejectionNote,
        createdAt: munaqosahRequests.createdAt,
      })
      .from(munaqosahRequests)
      .innerJoin(users, eq(users.id, munaqosahRequests.studentId))
      .where(and(...conditions))
      .orderBy(desc(munaqosahRequests.createdAt));

    const result: MunaqosahRequestItem[] = [];

    for (const r of rows) {
      // Get teacher name
      const teacher = await this.db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, r.teacherId))
        .limit(1);

      // Get class name
      const classRow = await this.db
        .select({ name: classes.name })
        .from(studentClassEnrollment)
        .innerJoin(classes, eq(classes.id, studentClassEnrollment.classId))
        .where(eq(studentClassEnrollment.studentId, r.studentId))
        .limit(1);

      // Get period info if any
      let periodName: string | null = null;
      let isResultPublished = false;
      if (r.periodId) {
        const p = await this.db
          .select({ nama: munaqosahPeriods.nama, isResultPublished: munaqosahPeriods.isResultPublished })
          .from(munaqosahPeriods)
          .where(eq(munaqosahPeriods.id, r.periodId))
          .limit(1);
        periodName = p[0]?.nama ?? null;
        isResultPublished = p[0]?.isResultPublished ?? false;
      }

      // Get assignment if any
      const assignment = await this.db
        .select({
          id: munaqosahAssignments.id,
          examinerId: munaqosahAssignments.examinerTeacherId,
          jadwalTanggal: munaqosahAssignments.jadwalTanggal,
          jadwalWaktu: munaqosahAssignments.jadwalWaktu,
          hasil: munaqosahAssignments.hasil,
          scores: munaqosahAssignments.scores,
          catatanPenguji: munaqosahAssignments.catatanPenguji,
        })
        .from(munaqosahAssignments)
        .where(eq(munaqosahAssignments.requestId, r.id))
        .limit(1);

      let examinerName = null;
      if (assignment[0]?.examinerId) {
        const ex = await this.db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, assignment[0].examinerId))
          .limit(1);
        examinerName = ex[0]?.name ?? null;
      }

      const rawScores = (assignment[0]?.scores as any) ?? null;

      result.push({
        id: r.id,
        assignmentId: assignment[0]?.id ?? null,
        periodId: r.periodId ?? null,
        periodName,
        studentId: r.studentId,
        studentName: r.studentName,
        className: classRow[0]?.name ?? "-",
        teacherId: r.teacherId,
        teacherName: teacher[0]?.name ?? "-",
        juzKe: r.juzKe,
        juzList: r.juzList ?? [r.juzKe],
        status: r.status as any,
        submissionDate: r.createdAt.toISOString().slice(0, 10),
        assignedExaminerName: examinerName,
        examinerTeacherId: assignment[0]?.examinerId ?? null,
        examDate: assignment[0]?.jadwalTanggal ?? null,
        examTime: assignment[0]?.jadwalWaktu ?? null,
        hasil: assignment[0]?.hasil ?? null,
        scores: rawScores,
        nilaiAkhir: rawScores?.nilaiAkhir ?? null,
        grade: rawScores?.grade ?? null,
        catatanPenguji: assignment[0]?.catatanPenguji ?? null,
        rejectionNote: r.rejectionNote ?? null,
        isResultPublished,
      });
    }

    return result;
  }

  async createRequest(params: {
    schoolId: string;
    studentId: string;
    teacherId: string;
    juzKe: number;
    juzList?: number[];
    periodId?: string;
  }): Promise<string> {
    const list = params.juzList && params.juzList.length > 0 ? params.juzList : [params.juzKe];
    const rows = await this.db
      .insert(munaqosahRequests)
      .values({
        schoolId: params.schoolId,
        periodId: params.periodId ?? null,
        studentId: params.studentId,
        teacherId: params.teacherId,
        juzKe: params.juzKe,
        juzList: list,
        status: "diajukan",
      })
      .returning({ id: munaqosahRequests.id });

    return rows[0].id;
  }

  async findActiveRequestByStudent(
    studentId: string,
    schoolId: string,
    periodId?: string
  ): Promise<MunaqosahRequestItem | null> {
    const conditions = [
      eq(munaqosahRequests.schoolId, schoolId),
      eq(munaqosahRequests.studentId, studentId),
      inArray(munaqosahRequests.status, ["diajukan", "disetujui", "dijadwalkan"]),
    ];

    if (periodId) {
      conditions.push(eq(munaqosahRequests.periodId, periodId));
    }

    const rows = await this.db
      .select({
        id: munaqosahRequests.id,
        status: munaqosahRequests.status,
        juzKe: munaqosahRequests.juzKe,
        juzList: munaqosahRequests.juzList,
      })
      .from(munaqosahRequests)
      .where(and(...conditions))
      .limit(1);

    if (!rows[0]) return null;

    return {
      id: rows[0].id,
      studentId,
      studentName: "",
      className: "",
      teacherId: "",
      teacherName: "",
      juzKe: rows[0].juzKe,
      juzList: rows[0].juzList,
      status: rows[0].status as any,
      submissionDate: "",
    };
  }

  async findPassedJuzByStudent(studentId: string, schoolId: string): Promise<number[]> {
    const rows = await this.db
      .select({
        juzKe: munaqosahRequests.juzKe,
        juzList: munaqosahRequests.juzList,
      })
      .from(munaqosahRequests)
      .where(
        and(
          eq(munaqosahRequests.schoolId, schoolId),
          eq(munaqosahRequests.studentId, studentId),
          eq(munaqosahRequests.status, "lulus")
        )
      );

    const set = new Set<number>();
    for (const r of rows) {
      if (r.juzList && Array.isArray(r.juzList)) {
        r.juzList.forEach((j) => set.add(j));
      } else if (r.juzKe) {
        set.add(r.juzKe);
      }
    }
    return Array.from(set);
  }

  async updateRequestStatus(
    id: string,
    schoolId: string,
    status: "diajukan" | "disetujui" | "dijadwalkan" | "lulus" | "tidak_lulus" | "ditolak",
    rejectionNote?: string
  ): Promise<{ teacherId: string; studentName: string; juzText: string }> {
    const detail = await this.db
      .select({
        teacherId: munaqosahRequests.teacherId,
        studentName: users.name,
        juzKe: munaqosahRequests.juzKe,
        juzList: munaqosahRequests.juzList,
      })
      .from(munaqosahRequests)
      .innerJoin(users, eq(users.id, munaqosahRequests.studentId))
      .where(and(eq(munaqosahRequests.id, id), eq(munaqosahRequests.schoolId, schoolId)))
      .limit(1);

    const updateData: any = { status, updatedAt: new Date() };
    if (rejectionNote !== undefined) {
      updateData.rejectionNote = rejectionNote;
    }

    await this.db
      .update(munaqosahRequests)
      .set(updateData)
      .where(
        and(
          eq(munaqosahRequests.id, id),
          eq(munaqosahRequests.schoolId, schoolId)
        )
      );

    const juzArray = detail[0]?.juzList && detail[0].juzList.length > 0 ? detail[0].juzList : [detail[0]?.juzKe ?? 1];
    return {
      teacherId: detail[0]?.teacherId ?? "",
      studentName: detail[0]?.studentName ?? "Santri",
      juzText: juzArray.join(", "),
    };
  }

  async createAssignment(params: {
    requestId: string;
    periodId: string;
    examinerTeacherId: string;
    jadwalTanggal: string;
    jadwalWaktu?: string;
    assignedBy: string;
  }): Promise<string> {
    // Check if assignment already exists for this requestId (prevent duplicates)
    const existing = await this.db
      .select({ id: munaqosahAssignments.id })
      .from(munaqosahAssignments)
      .where(eq(munaqosahAssignments.requestId, params.requestId))
      .limit(1);

    if (existing[0]) {
      await this.db
        .update(munaqosahAssignments)
        .set({
          periodId: params.periodId,
          examinerTeacherId: params.examinerTeacherId,
          jadwalTanggal: params.jadwalTanggal,
          jadwalWaktu: params.jadwalWaktu ?? null,
          assignedBy: params.assignedBy,
          assignedAt: new Date(),
        })
        .where(eq(munaqosahAssignments.id, existing[0].id));

      // Also link periodId on request
      await this.db
        .update(munaqosahRequests)
        .set({ periodId: params.periodId })
        .where(eq(munaqosahRequests.id, params.requestId));

      return existing[0].id;
    }

    const rows = await this.db
      .insert(munaqosahAssignments)
      .values({
        requestId: params.requestId,
        periodId: params.periodId,
        examinerTeacherId: params.examinerTeacherId,
        jadwalTanggal: params.jadwalTanggal,
        jadwalWaktu: params.jadwalWaktu ?? null,
        assignedBy: params.assignedBy,
      })
      .returning({ id: munaqosahAssignments.id });

    // Link periodId on request
    await this.db
      .update(munaqosahRequests)
      .set({ periodId: params.periodId })
      .where(eq(munaqosahRequests.id, params.requestId));

    return rows[0].id;
  }

  async getRequestDetail(
    requestId: string,
    schoolId: string
  ): Promise<{ studentId: string; studentName: string; juzKe: number; juzList?: number[]; schoolId: string } | null> {
    const rows = await this.db
      .select({
        studentId: munaqosahRequests.studentId,
        studentName: users.name,
        juzKe: munaqosahRequests.juzKe,
        juzList: munaqosahRequests.juzList,
        schoolId: munaqosahRequests.schoolId,
      })
      .from(munaqosahRequests)
      .innerJoin(users, eq(users.id, munaqosahRequests.studentId))
      .where(
        and(
          eq(munaqosahRequests.id, requestId),
          eq(munaqosahRequests.schoolId, schoolId)
        )
      )
      .limit(1);

    if (!rows[0]) return null;

    return {
      studentId: rows[0].studentId,
      studentName: rows[0].studentName,
      juzKe: rows[0].juzKe,
      juzList: rows[0].juzList ?? [rows[0].juzKe],
      schoolId: rows[0].schoolId,
    };
  }

  async findParentIdsByStudent(studentId: string, schoolId: string): Promise<string[]> {
    const rows = await this.db
      .select({ parentId: parentStudentMapping.parentId })
      .from(parentStudentMapping)
      .where(
        and(
          eq(parentStudentMapping.studentId, studentId),
          eq(parentStudentMapping.schoolId, schoolId)
        )
      );

    return rows.map((r) => r.parentId);
  }

  async findMyExams(examinerTeacherId: string, schoolId: string): Promise<MunaqosahRequestItem[]> {
    const rows = await this.db
      .select({
        id: munaqosahRequests.id,
        assignmentId: munaqosahAssignments.id,
        periodId: munaqosahRequests.periodId,
        studentId: munaqosahRequests.studentId,
        studentName: users.name,
        teacherId: munaqosahRequests.teacherId,
        juzKe: munaqosahRequests.juzKe,
        juzList: munaqosahRequests.juzList,
        status: munaqosahRequests.status,
        createdAt: munaqosahRequests.createdAt,
        jadwalTanggal: munaqosahAssignments.jadwalTanggal,
        jadwalWaktu: munaqosahAssignments.jadwalWaktu,
        hasil: munaqosahAssignments.hasil,
        scores: munaqosahAssignments.scores,
        catatanPenguji: munaqosahAssignments.catatanPenguji,
      })
      .from(munaqosahAssignments)
      .innerJoin(munaqosahRequests, eq(munaqosahRequests.id, munaqosahAssignments.requestId))
      .innerJoin(users, eq(users.id, munaqosahRequests.studentId))
      .where(
        and(
          eq(munaqosahAssignments.examinerTeacherId, examinerTeacherId),
          eq(munaqosahRequests.schoolId, schoolId)
        )
      )
      .orderBy(desc(munaqosahAssignments.jadwalTanggal));

    const result: MunaqosahRequestItem[] = [];

    for (const r of rows) {
      const teacher = await this.db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, r.teacherId))
        .limit(1);

      const classRow = await this.db
        .select({ name: classes.name })
        .from(studentClassEnrollment)
        .innerJoin(classes, eq(classes.id, studentClassEnrollment.classId))
        .where(eq(studentClassEnrollment.studentId, r.studentId))
        .limit(1);

      const rawScores = (r.scores as any) ?? null;

      result.push({
        id: r.id,
        assignmentId: r.assignmentId,
        periodId: r.periodId ?? null,
        studentId: r.studentId,
        studentName: r.studentName,
        className: classRow[0]?.name ?? "-",
        teacherId: r.teacherId,
        teacherName: teacher[0]?.name ?? "-",
        juzKe: r.juzKe,
        juzList: r.juzList ?? [r.juzKe],
        status: r.status as any,
        submissionDate: r.createdAt.toISOString().slice(0, 10),
        assignedExaminerName: null,
        examinerTeacherId,
        examDate: r.jadwalTanggal,
        examTime: r.jadwalWaktu,
        hasil: r.hasil,
        scores: rawScores,
        nilaiAkhir: rawScores?.nilaiAkhir ?? null,
        grade: rawScores?.grade ?? null,
        catatanPenguji: r.catatanPenguji,
      });
    }

    return result;
  }

  async findStudentSchedule(studentId: string, schoolId: string): Promise<MunaqosahRequestItem[]> {
    const rows = await this.db
      .select({
        id: munaqosahRequests.id,
        assignmentId: munaqosahAssignments.id,
        periodId: munaqosahRequests.periodId,
        studentId: munaqosahRequests.studentId,
        teacherId: munaqosahRequests.teacherId,
        juzKe: munaqosahRequests.juzKe,
        juzList: munaqosahRequests.juzList,
        status: munaqosahRequests.status,
        createdAt: munaqosahRequests.createdAt,
        jadwalTanggal: munaqosahAssignments.jadwalTanggal,
        jadwalWaktu: munaqosahAssignments.jadwalWaktu,
        examinerTeacherId: munaqosahAssignments.examinerTeacherId,
        hasil: munaqosahAssignments.hasil,
        scores: munaqosahAssignments.scores,
        catatanPenguji: munaqosahAssignments.catatanPenguji,
        periodName: munaqosahPeriods.nama,
        isResultPublished: munaqosahPeriods.isResultPublished,
      })
      .from(munaqosahRequests)
      .leftJoin(munaqosahAssignments, eq(munaqosahAssignments.requestId, munaqosahRequests.id))
      .leftJoin(munaqosahPeriods, eq(munaqosahPeriods.id, munaqosahRequests.periodId))
      .where(
        and(
          eq(munaqosahRequests.studentId, studentId),
          eq(munaqosahRequests.schoolId, schoolId)
        )
      )
      .orderBy(desc(munaqosahRequests.createdAt));

    const result: MunaqosahRequestItem[] = [];

    for (const r of rows) {
      let examinerName = null;
      if (r.examinerTeacherId) {
        const ex = await this.db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, r.examinerTeacherId))
          .limit(1);
        examinerName = ex[0]?.name ?? null;
      }

      const isPublished = Boolean(r.isResultPublished);
      const rawScores = (r.scores as any) ?? null;

      // Jika belum di-publish oleh koordinator: sembunyikan nilai detail dari siswa & ortu
      const visibleScores = isPublished ? rawScores : null;
      const visibleHasil = isPublished ? r.hasil : (r.hasil === "lulus" || r.hasil === "tidak_lulus" ? "menunggu_pengumuman" : r.hasil);
      const visibleCatatan = isPublished ? r.catatanPenguji : null;

      result.push({
        id: r.id,
        assignmentId: r.assignmentId ?? null,
        periodId: r.periodId ?? null,
        periodName: r.periodName ?? null,
        studentId: r.studentId,
        studentName: "",
        className: "",
        teacherId: r.teacherId,
        teacherName: "",
        juzKe: r.juzKe,
        juzList: r.juzList ?? [r.juzKe],
        status: r.status as any,
        submissionDate: r.createdAt.toISOString().slice(0, 10),
        assignedExaminerName: examinerName,
        examinerTeacherId: r.examinerTeacherId ?? null,
        examDate: r.jadwalTanggal ?? null,
        examTime: r.jadwalWaktu ?? null,
        hasil: visibleHasil,
        scores: visibleScores,
        nilaiAkhir: visibleScores?.nilaiAkhir ?? null,
        grade: visibleScores?.grade ?? null,
        catatanPenguji: visibleCatatan,
        isResultPublished: isPublished,
      });
    }

    return result;
  }

  async getAssignmentOwner(
    assignmentId: string,
    schoolId: string
  ): Promise<{ examinerTeacherId: string } | null> {
    const rows = await this.db
      .select({ examinerTeacherId: munaqosahAssignments.examinerTeacherId })
      .from(munaqosahAssignments)
      .innerJoin(munaqosahRequests, eq(munaqosahRequests.id, munaqosahAssignments.requestId))
      .where(
        and(
          eq(munaqosahAssignments.id, assignmentId),
          eq(munaqosahRequests.schoolId, schoolId)
        )
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async findExaminers(periodId: string, schoolId: string): Promise<MunaqosahExaminerItem[]> {
    const rows = await this.db
      .select({
        id: munaqosahExaminers.id,
        periodId: munaqosahExaminers.munaqosahPeriodId,
        teacherId: munaqosahExaminers.teacherId,
        teacherName: users.name,
        kapasitasSiswa: munaqosahExaminers.kapasitasSiswa,
      })
      .from(munaqosahExaminers)
      .innerJoin(users, eq(users.id, munaqosahExaminers.teacherId))
      .innerJoin(munaqosahPeriods, eq(munaqosahPeriods.id, munaqosahExaminers.munaqosahPeriodId))
      .where(
        and(
          eq(munaqosahExaminers.munaqosahPeriodId, periodId),
          eq(munaqosahPeriods.schoolId, schoolId)
        )
      );

    const result: MunaqosahExaminerItem[] = [];
    for (const r of rows) {
      const used = await this.db
        .select({ n: count() })
        .from(munaqosahAssignments)
        .where(
          and(
            eq(munaqosahAssignments.periodId, periodId),
            eq(munaqosahAssignments.examinerTeacherId, r.teacherId)
          )
        );
      result.push({
        id: r.id,
        periodId: r.periodId,
        teacherId: r.teacherId,
        teacherName: r.teacherName,
        kapasitasSiswa: r.kapasitasSiswa,
        terpakai: used[0]?.n ?? 0,
      });
    }
    return result;
  }

  async upsertExaminer(params: {
    periodId: string;
    teacherId: string;
    kapasitasSiswa: number;
    assignedBy: string;
    schoolId: string;
  }): Promise<string> {
    const period = await this.db
      .select({ id: munaqosahPeriods.id })
      .from(munaqosahPeriods)
      .where(
        and(
          eq(munaqosahPeriods.id, params.periodId),
          eq(munaqosahPeriods.schoolId, params.schoolId)
        )
      )
      .limit(1);
    if (!period[0]) throw new Error("Periode munaqosah tidak ditemukan");

    const existing = await this.db
      .select({ id: munaqosahExaminers.id })
      .from(munaqosahExaminers)
      .where(
        and(
          eq(munaqosahExaminers.munaqosahPeriodId, params.periodId),
          eq(munaqosahExaminers.teacherId, params.teacherId)
        )
      )
      .limit(1);

    if (existing[0]) {
      await this.db
        .update(munaqosahExaminers)
        .set({ kapasitasSiswa: params.kapasitasSiswa })
        .where(eq(munaqosahExaminers.id, existing[0].id));
      return existing[0].id;
    }

    const rows = await this.db
      .insert(munaqosahExaminers)
      .values({
        munaqosahPeriodId: params.periodId,
        teacherId: params.teacherId,
        kapasitasSiswa: params.kapasitasSiswa,
        assignedBy: params.assignedBy,
      })
      .returning({ id: munaqosahExaminers.id });
    return rows[0].id;
  }

  async removeExaminer(periodId: string, teacherId: string, schoolId: string): Promise<void> {
    const period = await this.db
      .select({ id: munaqosahPeriods.id })
      .from(munaqosahPeriods)
      .where(
        and(
          eq(munaqosahPeriods.id, periodId),
          eq(munaqosahPeriods.schoolId, schoolId)
        )
      )
      .limit(1);
    if (!period[0]) throw new Error("Periode munaqosah tidak ditemukan");

    await this.db
      .delete(munaqosahExaminers)
      .where(
        and(
          eq(munaqosahExaminers.munaqosahPeriodId, periodId),
          eq(munaqosahExaminers.teacherId, teacherId)
        )
      );
  }

  async checkExaminerCapacity(
    periodId: string,
    examinerTeacherId: string,
    schoolId: string
  ): Promise<{ kapasitas: number; terpakai: number; penuh: boolean } | null> {
    const pool = await this.db
      .select({ kapasitasSiswa: munaqosahExaminers.kapasitasSiswa })
      .from(munaqosahExaminers)
      .innerJoin(munaqosahPeriods, eq(munaqosahPeriods.id, munaqosahExaminers.munaqosahPeriodId))
      .where(
        and(
          eq(munaqosahExaminers.munaqosahPeriodId, periodId),
          eq(munaqosahExaminers.teacherId, examinerTeacherId),
          eq(munaqosahPeriods.schoolId, schoolId)
        )
      )
      .limit(1);
    if (!pool[0]) return null;

    const used = await this.db
      .select({ n: count() })
      .from(munaqosahAssignments)
      .where(
        and(
          eq(munaqosahAssignments.periodId, periodId),
          eq(munaqosahAssignments.examinerTeacherId, examinerTeacherId)
        )
      );
    const terpakai = used[0]?.n ?? 0;
    return { kapasitas: pool[0].kapasitasSiswa, terpakai, penuh: terpakai >= pool[0].kapasitasSiswa };
  }

  async submitResult(params: {
    assignmentId: string;
    scores: Record<string, any>;
    hasil: "lulus" | "tidak_lulus";
    catatanPenguji?: string;
  }): Promise<{ studentId: string; juzKe: number; juzList?: number[]; schoolId: string }> {
    const assignRows = await this.db
      .update(munaqosahAssignments)
      .set({
        scores: params.scores,
        hasil: params.hasil,
        catatanPenguji: params.catatanPenguji ?? null,
        completedAt: new Date(),
      })
      .where(eq(munaqosahAssignments.id, params.assignmentId))
      .returning({ requestId: munaqosahAssignments.requestId });

    const reqRows = await this.db
      .update(munaqosahRequests)
      .set({
        status: params.hasil === "lulus" ? "lulus" : "tidak_lulus",
        updatedAt: new Date(),
      })
      .where(eq(munaqosahRequests.id, assignRows[0].requestId))
      .returning({
        studentId: munaqosahRequests.studentId,
        juzKe: munaqosahRequests.juzKe,
        juzList: munaqosahRequests.juzList,
        schoolId: munaqosahRequests.schoolId,
      });

    return {
      studentId: reqRows[0].studentId,
      juzKe: reqRows[0].juzKe,
      juzList: reqRows[0].juzList ?? [reqRows[0].juzKe],
      schoolId: reqRows[0].schoolId,
    };
  }

  async grantAchievement(params: {
    schoolId: string;
    studentId: string;
    juzKe: number;
    sourceId: string;
  }): Promise<void> {
    await this.db.insert(studentAchievements).values({
      schoolId: params.schoolId,
      studentId: params.studentId,
      achievementType: "munaqosah_juz",
      juzKe: params.juzKe,
      sourceId: params.sourceId,
      earnedAt: new Date(),
    });
  }

  async findPeriods(schoolId: string): Promise<MunaqosahPeriodItem[]> {
    const rows = await this.db
      .select({
        id: munaqosahPeriods.id,
        schoolId: munaqosahPeriods.schoolId,
        academicPeriodId: munaqosahPeriods.academicPeriodId,
        nama: munaqosahPeriods.nama,
        tanggalMulai: munaqosahPeriods.tanggalMulai,
        tanggalSelesai: munaqosahPeriods.tanggalSelesai,
        status: munaqosahPeriods.status,
        isResultPublished: munaqosahPeriods.isResultPublished,
        createdAt: munaqosahPeriods.createdAt,
      })
      .from(munaqosahPeriods)
      .where(eq(munaqosahPeriods.schoolId, schoolId))
      .orderBy(desc(munaqosahPeriods.tanggalMulai));

    return rows.map((r) => ({
      ...r,
      status: r.status as any,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createPeriod(params: {
    schoolId: string;
    academicPeriodId: string;
    nama: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    status?: "draft" | "buka" | "tutup";
  }): Promise<string> {
    const rows = await this.db
      .insert(munaqosahPeriods)
      .values({
        schoolId: params.schoolId,
        academicPeriodId: params.academicPeriodId,
        nama: params.nama,
        tanggalMulai: params.tanggalMulai,
        tanggalSelesai: params.tanggalSelesai,
        status: params.status ?? "buka",
        isResultPublished: false,
      })
      .returning({ id: munaqosahPeriods.id });

    return rows[0].id;
  }

  async updatePeriod(
    periodId: string,
    schoolId: string,
    params: {
      nama?: string;
      tanggalMulai?: string;
      tanggalSelesai?: string;
      status?: "draft" | "buka" | "tutup";
      isResultPublished?: boolean;
    }
  ): Promise<void> {
    const updates: any = {};
    if (params.nama !== undefined) updates.nama = params.nama;
    if (params.tanggalMulai !== undefined) updates.tanggalMulai = params.tanggalMulai;
    if (params.tanggalSelesai !== undefined) updates.tanggalSelesai = params.tanggalSelesai;
    if (params.status !== undefined) updates.status = params.status;
    if (params.isResultPublished !== undefined) updates.isResultPublished = params.isResultPublished;

    await this.db
      .update(munaqosahPeriods)
      .set(updates)
      .where(
        and(
          eq(munaqosahPeriods.id, periodId),
          eq(munaqosahPeriods.schoolId, schoolId)
        )
      );
  }

  async getStudentEligibility(
    studentId: string,
    schoolId: string
  ): Promise<{ passedJuz: number[]; pendingJuz: number[]; memorizedJuz: number[] }> {
    // 1. Passed juz
    const passedJuz = await this.findPassedJuzByStudent(studentId, schoolId);

    // 2. Pending / active request juz
    const activeRows = await this.db
      .select({
        juzKe: munaqosahRequests.juzKe,
        juzList: munaqosahRequests.juzList,
      })
      .from(munaqosahRequests)
      .where(
        and(
          eq(munaqosahRequests.schoolId, schoolId),
          eq(munaqosahRequests.studentId, studentId),
          inArray(munaqosahRequests.status, ["diajukan", "disetujui", "dijadwalkan"])
        )
      );

    const pendingSet = new Set<number>();
    for (const r of activeRows) {
      if (r.juzList && Array.isArray(r.juzList)) {
        r.juzList.forEach((j) => pendingSet.add(j));
      } else if (r.juzKe) {
        pendingSet.add(r.juzKe);
      }
    }

    // 3. Memorized juz from achievements
    const achRows = await this.db
      .select({ juzKe: studentAchievements.juzKe })
      .from(studentAchievements)
      .where(
        and(
          eq(studentAchievements.schoolId, schoolId),
          eq(studentAchievements.studentId, studentId),
          eq(studentAchievements.achievementType, "munaqosah_juz")
        )
      );

    const memorizedSet = new Set<number>(passedJuz);
    achRows.forEach((a) => {
      if (a.juzKe) memorizedSet.add(a.juzKe);
    });

    return {
      passedJuz,
      pendingJuz: Array.from(pendingSet),
      memorizedJuz: Array.from(memorizedSet),
    };
  }

  async getTeacherAssignmentCounts(
    periodId: string,
    schoolId: string
  ): Promise<Array<{ teacherId: string; assignedCount: number }>> {
    const rows = await this.db
      .select({
        teacherId: munaqosahAssignments.examinerTeacherId,
        countVal: count(),
      })
      .from(munaqosahAssignments)
      .innerJoin(munaqosahPeriods, eq(munaqosahPeriods.id, munaqosahAssignments.periodId))
      .where(
        and(
          eq(munaqosahAssignments.periodId, periodId),
          eq(munaqosahPeriods.schoolId, schoolId)
        )
      )
      .groupBy(munaqosahAssignments.examinerTeacherId);

    return rows.map((r) => ({
      teacherId: r.teacherId,
      assignedCount: r.countVal,
    }));
  }
}
