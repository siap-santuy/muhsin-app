import type { Db } from "../../../db/client";
import { setoranEntries } from "../../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { ISetoranRepository } from "../domain/repositories/ISetoranRepository";
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
      })
      .returning();

    return this.toDomain(rows[0]);
  }

  async findByStudentAndMonth(
    studentId: string,
    subcategoryId: string,
    month: string,
    schoolId: string
  ): Promise<SetoranEntryEntity[]> {
    const rows = await this.db
      .select()
      .from(setoranEntries)
      .where(
        and(
          eq(setoranEntries.studentId, studentId),
          eq(setoranEntries.subcategoryId, subcategoryId),
          eq(setoranEntries.schoolId, schoolId),
          sql`to_char(${setoranEntries.date}, 'YYYY-MM') = ${month}`
        )
      );

    return rows.map((r) => this.toDomain(r));
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
