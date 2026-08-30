import type { Db } from "../../../db/client";
import {
  assessmentCategories,
  assessmentSubcategories,
} from "../../../db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { IKurikulumRepository } from "../domain/repositories/IKurikulumRepository";
import type { CategoryConfig, GradingScaleItem } from "../domain/entities/Kurikulum";

export class DrizzleKurikulumRepository implements IKurikulumRepository {
  constructor(private readonly db: Db) {}

  async getCategoriesWithSubcategories(
    schoolId: string
  ): Promise<CategoryConfig[]> {
    const cats = await this.db
      .select()
      .from(assessmentCategories)
      .where(
        and(
          eq(assessmentCategories.schoolId, schoolId),
          eq(assessmentCategories.isActive, true)
        )
      )
      .orderBy(asc(assessmentCategories.order));

    const result: CategoryConfig[] = [];

    for (const cat of cats) {
      const subs = await this.db
        .select()
        .from(assessmentSubcategories)
        .where(
          and(
            eq(assessmentSubcategories.categoryId, cat.id),
            eq(assessmentSubcategories.schoolId, schoolId),
            eq(assessmentSubcategories.isActive, true)
          )
        )
        .orderBy(asc(assessmentSubcategories.order));

      result.push({
        id: cat.id,
        code: cat.code,
        name: cat.name,
        subcategories: subs.map((s) => ({
          id: s.id,
          categoryId: s.categoryId,
          code: s.code,
          name: s.name,
          includeInRanking: s.includeInRanking,
          scoreFields: ((s.scoreFields as any[]) ?? []).map((f) => ({
            key: f.key,
            label: f.label,
            min: f.min ?? 0,
            max: f.max ?? 100,
            isLocked: true,
          })),
        })),
      });
    }

    return result;
  }

  async createCategory(params: {
    schoolId: string;
    academicPeriodId: string;
    code: string;
    name: string;
  }): Promise<string> {
    const rows = await this.db
      .insert(assessmentCategories)
      .values({
        schoolId: params.schoolId,
        academicPeriodId: params.academicPeriodId,
        code: params.code,
        name: params.name,
      })
      .returning({ id: assessmentCategories.id });

    return rows[0].id;
  }

  async createSubcategory(params: {
    schoolId: string;
    categoryId: string;
    code: string;
    name: string;
    scoreFields: any[];
    includeInRanking: boolean;
  }): Promise<string> {
    const rows = await this.db
      .insert(assessmentSubcategories)
      .values({
        schoolId: params.schoolId,
        categoryId: params.categoryId,
        code: params.code,
        name: params.name,
        scoreFields: params.scoreFields,
        gradingScale: [],
        includeInRanking: params.includeInRanking,
      })
      .returning({ id: assessmentSubcategories.id });

    return rows[0].id;
  }

  async getGradingScale(_schoolId: string): Promise<GradingScaleItem[]> {
    return [
      { min: 91, max: 100, letter: "A", labelLatin: "Mumtaz", labelArab: "ممتاز" },
      { min: 80, max: 90, letter: "B", labelLatin: "Jayyid Jiddan", labelArab: "جيد جدا" },
      { min: 70, max: 79, letter: "C", labelLatin: "Jayyid", labelArab: "جيد" },
      { min: 51, max: 69, letter: "D", labelLatin: "Maqbul", labelArab: "مقبول" },
      { min: 31, max: 50, letter: "E", labelLatin: "Dhaif", labelArab: "ضعيف" },
    ];
  }
}
