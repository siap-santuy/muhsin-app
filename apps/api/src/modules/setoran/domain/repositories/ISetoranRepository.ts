import type { SetoranEntryEntity } from "../entities/SetoranEntry";

export interface AssessmentSubcategoryInfo {
  id: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  code: string;
  name: string;
  scoreFields: Array<{ key: string; label: string; min: number; max: number }>;
  referenceShape: Record<string, any> | null;
}

export interface ISetoranRepository {
  create(entity: SetoranEntryEntity): Promise<SetoranEntryEntity>;
  findById(id: string, schoolId: string): Promise<SetoranEntryEntity | null>;
  findByStudent(
    studentId: string,
    schoolId: string,
    subcategoryId?: string,
    month?: string
  ): Promise<SetoranEntryEntity[]>;
  findByStudentAndMonth(
    studentId: string,
    subcategoryId: string,
    month: string, // YYYY-MM
    schoolId: string
  ): Promise<SetoranEntryEntity[]>;
  findByClassAndDate(
    classId: string,
    date: string,
    schoolId: string
  ): Promise<SetoranEntryEntity[]>;
  getActiveSubcategories(schoolId: string): Promise<AssessmentSubcategoryInfo[]>;
  update(entity: SetoranEntryEntity): Promise<SetoranEntryEntity>;
}
