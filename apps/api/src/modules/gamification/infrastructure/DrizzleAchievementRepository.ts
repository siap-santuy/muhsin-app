import { and, desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  MunaqosahAchievementRecord,
  SetoranEntryForAchievement,
} from "@muhsin/shared";
import {
  assessmentCategories,
  assessmentSubcategories,
} from "../../../db/schema/assessment";
import { setoranEntries } from "../../../db/schema/operational";
import { studentAchievements } from "../../../db/schema/gamification";
import type { IAchievementRepository } from "../domain/repositories/IAchievementRepository";

export class DrizzleAchievementRepository implements IAchievementRepository {
  constructor(private readonly db: NodePgDatabase<any>) {}

  async getStudentSetoranHistory(
    studentId: string,
    schoolId: string
  ): Promise<SetoranEntryForAchievement[]> {
    const rows = await this.db
      .select({
        subcatCode: assessmentSubcategories.code,
        categoryCode: assessmentCategories.code,
        referenceStart: setoranEntries.referenceStart,
        referenceEnd: setoranEntries.referenceEnd,
        date: setoranEntries.date,
      })
      .from(setoranEntries)
      .innerJoin(
        assessmentSubcategories,
        eq(assessmentSubcategories.id, setoranEntries.subcategoryId)
      )
      .leftJoin(
        assessmentCategories,
        eq(assessmentCategories.id, assessmentSubcategories.categoryId)
      )
      .where(
        and(
          eq(setoranEntries.schoolId, schoolId),
          eq(setoranEntries.studentId, studentId)
        )
      )
      .orderBy(desc(setoranEntries.date), desc(setoranEntries.createdAt));

    return rows.map((r) => ({
      subcatCode: r.subcatCode,
      categoryCode: r.categoryCode,
      referenceStart: r.referenceStart as Record<string, any> | null,
      referenceEnd: r.referenceEnd as Record<string, any> | null,
      date: typeof r.date === "string" ? r.date : new Date(r.date).toISOString().slice(0, 10),
    }));
  }

  async getStudentMunaqosahAchievements(
    studentId: string,
    schoolId: string
  ): Promise<MunaqosahAchievementRecord[]> {
    const rows = await this.db
      .select({
        juzKe: studentAchievements.juzKe,
        earnedAt: studentAchievements.earnedAt,
      })
      .from(studentAchievements)
      .where(
        and(
          eq(studentAchievements.schoolId, schoolId),
          eq(studentAchievements.studentId, studentId),
          eq(studentAchievements.achievementType, "munaqosah_juz")
        )
      );

    return rows
      .filter((r) => r.juzKe !== null && r.juzKe !== undefined)
      .map((r) => ({
        juzKe: r.juzKe as number,
        earnedAt: r.earnedAt,
      }));
  }
}
