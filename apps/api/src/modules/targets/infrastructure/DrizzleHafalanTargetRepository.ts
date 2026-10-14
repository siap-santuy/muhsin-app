import type { Db } from "../../../db/client";
import {
  hafalanTargets,
  studentClassEnrollment,
  setoranEntries,
  assessmentSubcategories,
} from "../../../db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import type {
  IHafalanTargetRepository,
  SetHafalanTargetInput,
  StudentHafalanPosition,
} from "../domain/repositories/IHafalanTargetRepository";
import type { HafalanTargetEntity } from "../domain/entities/HafalanTarget";
import { SURAH_LIST } from "@muhsin/shared";

export class DrizzleHafalanTargetRepository implements IHafalanTargetRepository {
  constructor(private readonly db: Db) {}

  async findStudentLastZiyadahPosition(
    studentId: string,
    schoolId: string
  ): Promise<StudentHafalanPosition> {
    const rows = await this.db
      .select({
        date: setoranEntries.date,
        referenceStart: setoranEntries.referenceStart,
        referenceEnd: setoranEntries.referenceEnd,
        subcatCode: assessmentSubcategories.code,
      })
      .from(setoranEntries)
      .leftJoin(
        assessmentSubcategories,
        eq(assessmentSubcategories.id, setoranEntries.subcategoryId)
      )
      .where(
        and(
          eq(setoranEntries.studentId, studentId),
          eq(setoranEntries.schoolId, schoolId)
        )
      )
      .orderBy(desc(setoranEntries.date), desc(setoranEntries.createdAt));

    // Cari setoran Ziyadah terakhir
    const lastZiyadah = rows.find((r) => {
      const code = (r.subcatCode || "").toUpperCase();
      const isSurah = !!(r.referenceStart && (r.referenceStart as any).surah);
      return code.includes("ZIYADAH") || (!code && isSurah);
    });

    if (!lastZiyadah || !lastZiyadah.referenceStart) {
      // Belum pernah setor Ziyadah, mulai dari An-Naba' ayat 1 (awal Juz 30)
      return {
        lastSurah: null,
        lastSurahNumber: null,
        lastAyat: null,
        lastSetoranDate: null,
        suggestedStartSurah: "An-Naba'",
        suggestedStartSurahNumber: 78,
        suggestedStartAyat: 1,
      };
    }

    const refEnd = (lastZiyadah.referenceEnd as any) || (lastZiyadah.referenceStart as any);
    const surahNumber = Number(refEnd.surahNumber || 78);
    const ayat = Number(refEnd.ayat || 1);
    const surahObj = SURAH_LIST.find((s) => s.no === surahNumber);

    let nextSurahNo = surahNumber;
    let nextAyat = ayat + 1;

    // Jika ayat terakhir sudah selesai di surah tersebut, lanjut ke surah berikutnya
    if (surahObj && nextAyat > surahObj.totalAyat) {
      if (surahNumber < 114) {
        nextSurahNo = surahNumber + 1;
        nextAyat = 1;
      } else {
        // Sudah khatam 114
        nextSurahNo = 114;
        nextAyat = surahObj.totalAyat;
      }
    }

    const nextSurahObj = SURAH_LIST.find((s) => s.no === nextSurahNo);

    return {
      lastSurah: refEnd.surah || surahObj?.nameLatin || null,
      lastSurahNumber: surahNumber,
      lastAyat: ayat,
      lastSetoranDate: lastZiyadah.date,
      suggestedStartSurah: nextSurahObj?.nameLatin || `Surah ${nextSurahNo}`,
      suggestedStartSurahNumber: nextSurahNo,
      suggestedStartAyat: nextAyat,
    };
  }

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
    if (input.studentIds.length === 0) return [];

    const now = new Date();
    const rowsToInsert = input.studentIds.map((studentId) => ({
      schoolId: input.schoolId,
      studentId,
      teacherId: input.teacherId,
      bulan: input.bulan,
      targetSurahStart: input.targetSurahStart,
      targetAyatStart: input.targetAyatStart,
      targetSurahEnd: input.targetSurahEnd,
      targetAyatEnd: input.targetAyatEnd,
      catatan: input.catatan ?? null,
      updatedAt: now,
    }));

    // Atomic batch upsert with ON CONFLICT (studentId, bulan, schoolId) DO UPDATE
    const upserted = await this.db
      .insert(hafalanTargets)
      .values(rowsToInsert)
      .onConflictDoUpdate({
        target: [
          hafalanTargets.studentId,
          hafalanTargets.bulan,
          hafalanTargets.schoolId,
        ],
        set: {
          teacherId: input.teacherId,
          targetSurahStart: input.targetSurahStart,
          targetAyatStart: input.targetAyatStart,
          targetSurahEnd: input.targetSurahEnd,
          targetAyatEnd: input.targetAyatEnd,
          catatan: input.catatan ?? null,
          updatedAt: now,
        },
      })
      .returning();

    return upserted.map((r) => this.toDomain(r));
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
