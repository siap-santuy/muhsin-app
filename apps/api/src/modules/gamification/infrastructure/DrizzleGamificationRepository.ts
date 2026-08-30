import type { Db } from "../../../db/client";
import { studentGamification } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import type { IGamificationRepository } from "../domain/repositories/IGamificationRepository";
import type { GamificationSummary } from "../domain/entities/Gamification";

export class DrizzleGamificationRepository implements IGamificationRepository {
  constructor(private readonly db: Db) {}

  async findByStudentId(
    studentId: string,
    schoolId: string
  ): Promise<GamificationSummary | null> {
    const rows = await this.db
      .select()
      .from(studentGamification)
      .where(
        and(
          eq(studentGamification.studentId, studentId),
          eq(studentGamification.schoolId, schoolId)
        )
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      studentId: row.studentId,
      schoolId: row.schoolId,
      level: row.level,
      totalExp: row.totalExp,
      currentStreak: row.currentStreak,
      longestStreak: row.longestStreak,
      lastActivityDate: row.lastActivityDate ?? null,
    };
  }

  async upsert(data: GamificationSummary): Promise<void> {
    await this.db
      .insert(studentGamification)
      .values({
        studentId: data.studentId,
        schoolId: data.schoolId,
        level: data.level,
        totalExp: data.totalExp,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        lastActivityDate: data.lastActivityDate,
      })
      .onConflictDoUpdate({
        target: studentGamification.studentId,
        set: {
          level: data.level,
          totalExp: data.totalExp,
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
          lastActivityDate: data.lastActivityDate,
        },
      });
  }
}
