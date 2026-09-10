import type { CategoryConfig, GradingScaleItem } from "../entities/Kurikulum";

export interface IKurikulumRepository {
  getCategoriesWithSubcategories(schoolId: string): Promise<CategoryConfig[]>;
  createCategory(params: {
    schoolId: string;
    academicPeriodId: string;
    code: string;
    name: string;
  }): Promise<string>;
  createSubcategory(params: {
    schoolId: string;
    categoryId: string;
    code: string;
    name: string;
    scoreFields: any[];
    includeInRanking: boolean;
  }): Promise<string>;
  updateCategory(id: string, schoolId: string, data: { code?: string; name?: string }): Promise<void>;
  deleteCategory(id: string, schoolId: string): Promise<void>;
  updateSubcategory(
    id: string,
    schoolId: string,
    data: { code?: string; name?: string; scoreFields?: any[]; includeInRanking?: boolean }
  ): Promise<void>;
  deleteSubcategory(id: string, schoolId: string): Promise<void>;
  getGradingScale(schoolId: string): Promise<GradingScaleItem[]>;
}
