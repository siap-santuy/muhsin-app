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
  getGradingScale(schoolId: string): Promise<GradingScaleItem[]>;
}
