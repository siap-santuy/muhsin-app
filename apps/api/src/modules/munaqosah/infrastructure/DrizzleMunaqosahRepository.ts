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
import { eq, and, desc, count } from "drizzle-orm";
import type { IMunaqosahRepository } from "../domain/repositories/IMunaqosahRepository";
import type { MunaqosahRequestItem, MunaqosahExaminerItem } from "../domain/entities/Munaqosah";

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
        studentId: munaqosahRequests.studentId,
        studentName: users.name,
        teacherId: munaqosahRequests.teacherId,
        juzKe: munaqosahRequests.juzKe,
        status: munaqosahRequests.status,
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

      result.push({
        id: r.id,
        studentId: r.studentId,
        studentName: r.studentName,
        className: classRow[0]?.name ?? "VII Abu Bakar",
        teacherId: r.teacherId,
        teacherName: teacher[0]?.name ?? "Ustadz Pembimbing",
        juzKe: r.juzKe,
        status: r.status as any,
        submissionDate: r.createdAt.toISOString().slice(0, 10),
        assignedExaminerName: examinerName,
        examinerTeacherId: assignment[0]?.examinerId ?? null,
        examDate: assignment[0]?.jadwalTanggal ?? null,
        examTime: assignment[0]?.jadwalWaktu ?? null,
        hasil: assignment[0]?.hasil ?? null,
        scores: (assignment[0]?.scores as any) ?? null,
        catatanPenguji: assignment[0]?.catatanPenguji ?? null,
      });
    }

    return result;
  }

  async createRequest(params: {
    schoolId: string;
    studentId: string;
    teacherId: string;
    juzKe: number;
  }): Promise<string> {
    const rows = await this.db
      .insert(munaqosahRequests)
      .values({
        schoolId: params.schoolId,
        studentId: params.studentId,
        teacherId: params.teacherId,
        juzKe: params.juzKe,
        status: "diajukan",
      })
      .returning({ id: munaqosahRequests.id });

    return rows[0].id;
  }

  async updateRequestStatus(
    id: string,
    schoolId: string,
    status: "diajukan" | "disetujui" | "dijadwalkan" | "lulus" | "tidak_lulus" | "ditolak"
  ): Promise<void> {
    await this.db
      .update(munaqosahRequests)
      .set({ status, updatedAt: new Date() })
      .where(
        and(
          eq(munaqosahRequests.id, id),
          eq(munaqosahRequests.schoolId, schoolId)
        )
      );
  }

  async createAssignment(params: {
    requestId: string;
    periodId: string;
    examinerTeacherId: string;
    jadwalTanggal: string;
    jadwalWaktu?: string;
    assignedBy: string;
  }): Promise<string> {
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

    return rows[0].id;
  }

  async getRequestDetail(
    requestId: string,
    schoolId: string
  ): Promise<{ studentId: string; studentName: string; juzKe: number; schoolId: string } | null> {
    const rows = await this.db
      .select({
        studentId: munaqosahRequests.studentId,
        studentName: users.name,
        juzKe: munaqosahRequests.juzKe,
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

    return rows[0] ?? null;
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
        studentId: munaqosahRequests.studentId,
        studentName: users.name,
        teacherId: munaqosahRequests.teacherId,
        juzKe: munaqosahRequests.juzKe,
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

      result.push({
        id: r.id,
        assignmentId: r.assignmentId,
        studentId: r.studentId,
        studentName: r.studentName,
        className: classRow[0]?.name ?? "-",
        teacherId: r.teacherId,
        teacherName: teacher[0]?.name ?? "-",
        juzKe: r.juzKe,
        status: r.status as any,
        submissionDate: r.createdAt.toISOString().slice(0, 10),
        assignedExaminerName: null,
        examinerTeacherId,
        examDate: r.jadwalTanggal,
        examTime: r.jadwalWaktu,
        hasil: r.hasil,
        scores: (r.scores as any) ?? null,
        catatanPenguji: r.catatanPenguji,
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
    scores: Record<string, number>;
    hasil: "lulus" | "tidak_lulus";
    catatanPenguji?: string;
  }): Promise<{ studentId: string; juzKe: number; schoolId: string }> {
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
        schoolId: munaqosahRequests.schoolId,
      });

    return reqRows[0];
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
}
