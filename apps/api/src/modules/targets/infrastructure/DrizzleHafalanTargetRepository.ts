import type { Db } from "../../../db/client";
import { hafalanTargets, studentClassEnrollment } from "../../../db/schema";
import { and, eq, inArray } from "drizzle-orm";
import type {
  IHafalanTargetRepository,
  SetHafalanTargetInput,
} from "../domain/repositories/IHafalanTargetRepository";
import type { HafalanTargetEntity } from "../domain/entities/HafalanTarget";

export class DrizzleHafalanTargetRepository implements IHafalanTargetRepository {
  constructor(private readonly db: Db) {}

  async findByStudentAndMonth(
    studentId: string,
    bulan: string,
    schoolId: string
  ): Promise<HafalanTargetEntity | null> {
    const rows = await this.db
      .select()
      .from(hafalanTargets)
      .where(
        and(
          eq(hafalanTargets.schoolId, schoolId),
          eq(hafalanTargets.studentId, studentId),
          eq(hafalanTargets.bulan, bulan)
        )
      )
      .limit(1);

    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findByClassAndMonth(
    classId: string,
    bulan: string,
    schoolId: string
  ): Promise<HafalanTargetEntity[]> {
    const enrollments = await this.db
      .select({ studentId: studentClassEnrollment.studentId })
      .from(studentClassEnrollment)
      .where(
        and(
          eq(studentClassEnrollment.schoolId, schoolId),
          eq(studentClassEnrollment.classId, classId)
        )
      );

    const studentIds = enrollments.map((e) => e.studentId);
    if (studentIds.length === 0) return [];

    const rows = await this.db
      .select()
      .from(hafalanTargets)
      .where(
        and(
          eq(hafalanTargets.schoolId, schoolId),
          eq(hafalanTargets.bulan, bulan),
          inArray(hafalanTargets.studentId, studentIds)
        )
      );

    return rows.map((r) => this.toDomain(r));
  }

  async setTargets(input: SetHafalanTargetInput): Promise<HafalanTargetEntity[]> {
    const results: HafalanTargetEntity[] = [];
    const now = new Date();

    for (const studentId of input.studentIds) {
      const existing = await this.findByStudentAndMonth(
        studentId,
        input.bulan,
        input.schoolId
      );

      if (existing) {
        const [updated] = await this.db
          .update(hafalanTargets)
          .set({
            teacherId: input.teacherId,
            targetSurahStart: input.targetSurahStart,
            targetAyatStart: input.targetAyatStart,
            targetSurahEnd: input.targetSurahEnd,
            targetAyatEnd: input.targetAyatEnd,
            catatan: input.catatan ?? null,
            updatedAt: now,
          })
          .where(eq(hafalanTargets.id, existing.id))
          .returning();

        results.push(this.toDomain(updated));
      } else {
        const [inserted] = await this.db
          .insert(hafalanTargets)
          .values({
            schoolId: input.schoolId,
            studentId,
            teacherId: input.teacherId,
            bulan: input.bulan,
            targetSurahStart: input.targetSurahStart,
            targetAyatStart: input.targetAyatStart,
            targetSurahEnd: input.targetSurahEnd,
            targetAyatEnd: input.targetAyatEnd,
            catatan: input.catatan ?? null,
          })
          .returning();

        results.push(this.toDomain(inserted));
      }
    }

    return results;
  }

  private toDomain(row: typeof hafalanTargets.$inferSelect): HafalanTargetEntity {
    return {
      id: row.id,
      schoolId: row.schoolId,
      studentId: row.studentId,
      teacherId: row.teacherId,
      bulan: row.bulan,
      targetSurahStart: row.targetSurahStart,
      targetAyatStart: row.targetAyatStart,
      targetSurahEnd: row.targetSurahEnd,
      targetAyatEnd: row.targetAyatEnd,
      catatan: row.catatan,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
