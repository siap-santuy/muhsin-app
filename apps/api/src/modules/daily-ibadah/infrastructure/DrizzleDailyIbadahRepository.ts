import type { Db } from "../../../db/client";
import { dailyIbadah } from "../../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { IDailyIbadahRepository } from "../domain/repositories/IDailyIbadahRepository";
import type { DailyIbadahEntity } from "../domain/entities/DailyIbadah";

export class DrizzleDailyIbadahRepository implements IDailyIbadahRepository {
  constructor(private readonly db: Db) {}

  async findByStudentAndDate(
    studentId: string,
    date: string,
    schoolId: string
  ): Promise<DailyIbadahEntity | null> {
    const rows = await this.db
      .select()
      .from(dailyIbadah)
      .where(
        and(
          eq(dailyIbadah.studentId, studentId),
          eq(dailyIbadah.date, date),
          eq(dailyIbadah.schoolId, schoolId)
        )
      )
      .limit(1);

    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  async save(entity: DailyIbadahEntity): Promise<DailyIbadahEntity> {
    const rows = await this.db
      .insert(dailyIbadah)
      .values({
        id: entity.id,
        schoolId: entity.schoolId,
        studentId: entity.studentId,
        date: entity.date,
        status: entity.status,
        submittedAt: entity.submittedAt,
        tilawah: entity.tilawah as any,
        sholatFardhu: entity.sholatFardhu as any,
        sholatRawatib: entity.sholatRawatib as any,
        tahajud: entity.tahajud,
        dhuha: entity.dhuha,
        puasaSunnah: entity.puasaSunnah,
      })
      .onConflictDoUpdate({
        target: [dailyIbadah.studentId, dailyIbadah.date, dailyIbadah.schoolId],
        set: {
          status: entity.status,
          submittedAt: entity.submittedAt,
          tilawah: entity.tilawah as any,
          sholatFardhu: entity.sholatFardhu as any,
          sholatRawatib: entity.sholatRawatib as any,
          tahajud: entity.tahajud,
          dhuha: entity.dhuha,
          puasaSunnah: entity.puasaSunnah,
          updatedAt: new Date(),
        },
      })
      .returning();

    return this.toDomain(rows[0]);
  }

  async findByMonth(
    studentId: string,
    month: string,
    schoolId: string
  ): Promise<DailyIbadahEntity[]> {
    const rows = await this.db
      .select()
      .from(dailyIbadah)
      .where(
        and(
          eq(dailyIbadah.studentId, studentId),
          eq(dailyIbadah.schoolId, schoolId),
          sql`to_char(${dailyIbadah.date}, 'YYYY-MM') = ${month}`
        )
      );

    return rows.map((r) => this.toDomain(r));
  }

  private toDomain(row: typeof dailyIbadah.$inferSelect): DailyIbadahEntity {
    return {
      id: row.id,
      schoolId: row.schoolId,
      studentId: row.studentId,
      date: row.date,
      status: row.status as "draft" | "submitted",
      submittedAt: row.submittedAt,
      tilawah: row.tilawah as any,
      sholatFardhu: row.sholatFardhu as any,
      sholatRawatib: (row.sholatRawatib as string[]) ?? [],
      tahajud: row.tahajud,
      dhuha: row.dhuha,
      puasaSunnah: row.puasaSunnah as any,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
