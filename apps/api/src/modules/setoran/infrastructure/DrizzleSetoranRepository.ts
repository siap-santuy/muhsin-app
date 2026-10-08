import type { Db } from "../../../db/client";
import { setoranEntries, assessmentCategories, assessmentSubcategories } from "../../../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import type { ISetoranRepository, AssessmentSubcategoryInfo } from "../domain/repositories/ISetoranRepository";
import type { SetoranEntryEntity } from "../domain/entities/SetoranEntry";

export class DrizzleSetoranRepository implements ISetoranRepository {
  constructor(private readonly db: Db) {}

  async create(entity: SetoranEntryEntity): Promise<SetoranEntryEntity> {
    const rows = await this.db
      .insert(setoranEntries)
      .values({
        id: entity.id,
        schoolId: entity.schoolId,
        subcategoryId: entity.subcategoryId,
        studentId: entity.studentId,
        teacherId: entity.teacherId,
        date: entity.date,
        referenceStart: entity.referenceStart as any,
        referenceEnd: entity.referenceEnd as any,
        scores: entity.scores as any,
        keterangan: entity.keterangan,
        substitutedForTeacherId: entity.substitutedForTeacherId,
      })
      .returning();

    return this.toDomain(rows[0]);
  }

  async update(entity: SetoranEntryEntity): Promise<SetoranEntryEntity> {
    const rows = await this.db
      .update(setoranEntries)
      .set({
        subcategoryId: entity.subcategoryId,
        referenceStart: entity.referenceStart as any,
        referenceEnd: entity.referenceEnd as any,
        scores: entity.scores as any,
        keterangan: entity.keterangan,
        updatedAt: entity.updatedAt,
      })
      .where(
        and(
          eq(setoranEntries.id, entity.id),
          eq(setoranEntries.schoolId, entity.schoolId)
        )
      )
      .returning();

    if (!rows[0]) {
      throw new Error("Gagal memperbarui setoran");
    }

    return this.toDomain(rows[0]);
  }

  async findById(id: string, schoolId: string): Promise<SetoranEntryEntity | null> {
    const rows = await this.db
      .select()
      .from(setoranEntries)
      .where(and(eq(setoranEntries.id, id), eq(setoranEntries.schoolId, schoolId)))
      .limit(1);

    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  async findByStudent(
    studentId: string,
    schoolId: string,
    subcategoryId?: string,
    month?: string
  ): Promise<SetoranEntryEntity[]> {
    const conditions = [
      eq(setoranEntries.studentId, studentId),
      eq(setoranEntries.schoolId, schoolId),
    ];

    if (subcategoryId) {
      conditions.push(eq(setoranEntries.subcategoryId, subcategoryId));
    }

    if (month) {
      conditions.push(sql`to_char(${setoranEntries.date}, 'YYYY-MM') = ${month}`);
    }

    const rows = await this.db
      .select({
        id: setoranEntries.id,
        schoolId: setoranEntries.schoolId,
        subcategoryId: setoranEntries.subcategoryId,
        studentId: setoranEntries.studentId,
        teacherId: setoranEntries.teacherId,
        date: setoranEntries.date,
        referenceStart: setoranEntries.referenceStart,
        referenceEnd: setoranEntries.referenceEnd,
        scores: setoranEntries.scores,
        keterangan: setoranEntries.keterangan,
        substitutedForTeacherId: setoranEntries.substitutedForTeacherId,
        createdAt: setoranEntries.createdAt,
        updatedAt: setoranEntries.updatedAt,
        subcategoryCode: assessmentSubcategories.code,
        subcategoryName: assessmentSubcategories.name,
        categoryCode: assessmentCategories.code,
        categoryName: assessmentCategories.name,
      })
      .from(setoranEntries)
      .leftJoin(
        assessmentSubcategories,
        eq(assessmentSubcategories.id, setoranEntries.subcategoryId)
      )
      .leftJoin(
        assessmentCategories,
        eq(assessmentCategories.id, assessmentSubcategories.categoryId)
      )
      .where(and(...conditions))
      .orderBy(desc(setoranEntries.date));

    return rows.map((r) => {
      let status: "setoran" | "sakit" | "izin" | "alpa" = "setoran";
      const ket = (r.keterangan || "").toLowerCase();
      if (ket.includes("[sakit]") || ket.includes("sakit")) status = "sakit";
      else if (ket.includes("[izin]") || ket.includes("izin")) status = "izin";
      else if (ket.includes("[alpa]") || ket.includes("alpha") || ket.includes("alpa")) status = "alpa";

      return {
        id: r.id,
        schoolId: r.schoolId,
        subcategoryId: r.subcategoryId,
        studentId: r.studentId,
        teacherId: r.teacherId,
        date: r.date,
        referenceStart: r.referenceStart as any,
        referenceEnd: r.referenceEnd as any,
        scores: r.scores as Record<string, number>,
        keterangan: r.keterangan,
        status,
        subcategoryCode: r.subcategoryCode ?? undefined,
        subcategoryName: r.subcategoryName ?? undefined,
        categoryCode: r.categoryCode ?? undefined,
        categoryName: r.categoryName ?? undefined,
        substitutedForTeacherId: r.substitutedForTeacherId ?? null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });
  }

  async findByStudentAndMonth(
    studentId: string,
    subcategoryId: string,
    month: string,
    schoolId: string
  ): Promise<SetoranEntryEntity[]> {
    return this.findByStudent(studentId, schoolId, subcategoryId, month);
  }

  async findByClassAndDate(
    _classId: string,
    date: string,
    schoolId: string
  ): Promise<SetoranEntryEntity[]> {
    const rows = await this.db
      .select()
      .from(setoranEntries)
      .where(
        and(
          eq(setoranEntries.schoolId, schoolId),
          eq(setoranEntries.date, date)
        )
      );

    return rows.map((r) => this.toDomain(r));
  }

  async getActiveSubcategories(schoolId: string): Promise<AssessmentSubcategoryInfo[]> {
    const rows = await this.db
      .select({
        id: assessmentSubcategories.id,
        categoryId: assessmentCategories.id,
        categoryCode: assessmentCategories.code,
        categoryName: assessmentCategories.name,
        code: assessmentSubcategories.code,
        name: assessmentSubcategories.name,
        scoreFields: assessmentSubcategories.scoreFields,
        referenceShape: assessmentSubcategories.referenceShape,
      })
      .from(assessmentSubcategories)
      .innerJoin(
        assessmentCategories,
        eq(assessmentCategories.id, assessmentSubcategories.categoryId)
      )
      .where(
        and(
          eq(assessmentSubcategories.schoolId, schoolId),
          eq(assessmentSubcategories.isActive, true)
        )
      );

    return rows.map((r) => ({
      id: r.id,
      categoryId: r.categoryId,
      categoryCode: r.categoryCode,
      categoryName: r.categoryName,
      code: r.code,
      name: r.name,
      scoreFields: r.scoreFields as any,
      referenceShape: r.referenceShape as any,
    }));
  }

  private toDomain(row: typeof setoranEntries.$inferSelect): SetoranEntryEntity {
    return {
      id: row.id,
      schoolId: row.schoolId,
      subcategoryId: row.subcategoryId,
      studentId: row.studentId,
      teacherId: row.teacherId,
      date: row.date,
      referenceStart: row.referenceStart as any,
      referenceEnd: row.referenceEnd as any,
      scores: row.scores as Record<string, number>,
      keterangan: row.keterangan,
      substitutedForTeacherId: (row as any).substitutedForTeacherId ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
