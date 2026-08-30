import type { SetoranEntryEntity } from "../entities/SetoranEntry";

export interface ISetoranRepository {
  create(entity: SetoranEntryEntity): Promise<SetoranEntryEntity>;
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
}
