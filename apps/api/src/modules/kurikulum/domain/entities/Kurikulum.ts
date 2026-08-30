export interface ScoreFieldConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  isLocked?: boolean;
}

export interface SubcategoryConfig {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  includeInRanking: boolean;
  scoreFields: ScoreFieldConfig[];
}

export interface CategoryConfig {
  id: string;
  code: string;
  name: string;
  subcategories: SubcategoryConfig[];
}

export interface GradingScaleItem {
  min: number;
  max: number;
  letter: string;
  labelLatin: string;
  labelArab: string;
}
