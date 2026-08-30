import type { DailyIbadahEntity } from "../entities/DailyIbadah";

export interface IDailyIbadahRepository {
  findByStudentAndDate(
    studentId: string,
    date: string,
    schoolId: string
  ): Promise<DailyIbadahEntity | null>;
  save(entity: DailyIbadahEntity): Promise<DailyIbadahEntity>;
  findByMonth(
    studentId: string,
    month: string, // YYYY-MM
    schoolId: string
  ): Promise<DailyIbadahEntity[]>;
}
