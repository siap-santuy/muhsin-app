import type { Db } from "../../../db/client";
import {
  assessmentCategories,
  assessmentSubcategories,
} from "../../../db/schema";
import { eq, and, asc } from "drizzle-orm";
import { setoranEntries } from "../../../db/schema";
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

  async updateCategory(id: string, schoolId: string, data: { code?: string; name?: string }): Promise<void> {
    await this.db
      .update(assessmentCategories)
      .set({
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
      })
      .where(and(eq(assessmentCategories.id, id), eq(assessmentCategories.schoolId, schoolId)));
  }

  async deleteCategory(id: string, schoolId: string): Promise<void> {
    const used = await this.db
      .select({ id: assessmentSubcategories.id })
      .from(assessmentSubcategories)
      .innerJoin(setoranEntries, eq(setoranEntries.subcategoryId, assessmentSubcategories.id))
      .where(
        and(
          eq(assessmentSubcategories.categoryId, id),
          eq(assessmentSubcategories.schoolId, schoolId)
        )
      )
      .limit(1);
    if (used.length > 0) {
      throw new Error("Kategori tidak bisa dihapus karena sudah ada nilai tercatat");
    }
    await this.db
      .update(assessmentSubcategories)
      .set({ isActive: false })
      .where(and(eq(assessmentSubcategories.categoryId, id), eq(assessmentSubcategories.schoolId, schoolId)));
    await this.db
      .update(assessmentCategories)
      .set({ isActive: false })
      .where(and(eq(assessmentCategories.id, id), eq(assessmentCategories.schoolId, schoolId)));
  }

  async updateSubcategory(
    id: string,
    schoolId: string,
    data: { code?: string; name?: string; scoreFields?: any[]; includeInRanking?: boolean }
  ): Promise<void> {
    if (data.scoreFields !== undefined) {
      const used = await this.db
        .select({ id: setoranEntries.id })
        .from(setoranEntries)
        .where(and(eq(setoranEntries.subcategoryId, id), eq(setoranEntries.schoolId, schoolId)))
        .limit(1);
      if (used.length > 0) {
        const current = await this.db
          .select({ scoreFields: assessmentSubcategories.scoreFields })
          .from(assessmentSubcategories)
          .where(and(eq(assessmentSubcategories.id, id), eq(assessmentSubcategories.schoolId, schoolId)))
          .limit(1);
        const oldKeys = (((current[0]?.scoreFields as any[]) ?? []).map((f) => f.key)).sort();
        const newKeys = ((data.scoreFields as any[]).map((f) => f.key)).sort();
        if (JSON.stringify(oldKeys) !== JSON.stringify(newKeys)) {
          throw new Error("Field penilaian terkunci karena sudah ada nilai tercatat (hanya label yang boleh diubah)");
        }
      }
    }
    await this.db
      .update(assessmentSubcategories)
      .set({
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.scoreFields !== undefined ? { scoreFields: data.scoreFields } : {}),
        ...(data.includeInRanking !== undefined ? { includeInRanking: data.includeInRanking } : {}),
      })
      .where(and(eq(assessmentSubcategories.id, id), eq(assessmentSubcategories.schoolId, schoolId)));
  }

  async deleteSubcategory(id: string, schoolId: string): Promise<void> {
    const used = await this.db
      .select({ id: setoranEntries.id })
      .from(setoranEntries)
      .where(and(eq(setoranEntries.subcategoryId, id), eq(setoranEntries.schoolId, schoolId)))
      .limit(1);
    if (used.length > 0) {
      throw new Error("Sub-kategori tidak bisa dihapus karena sudah ada nilai tercatat");
    }
    await this.db
      .update(assessmentSubcategories)
      .set({ isActive: false })
      .where(and(eq(assessmentSubcategories.id, id), eq(assessmentSubcategories.schoolId, schoolId)));
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
