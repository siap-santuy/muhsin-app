import type { MonthlyRaportData, SemesterRaportData } from "../entities/Raport";

export interface IRaportRepository {
  getMonthlyRaport(
    studentId: string,
    month: string, // YYYY-MM
    schoolId: string
  ): Promise<MonthlyRaportData>;

  getSemesterRaport(
    studentId: string,
    semester: string,
    tahunAjaran: string,
    schoolId: string
  ): Promise<SemesterRaportData>;
}
