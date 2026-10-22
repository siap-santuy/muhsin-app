import {
  calculateStudentAchievements,
  type StudentAchievementsSummary,
} from "@muhsin/shared";
import type { IAchievementRepository } from "../../domain/repositories/IAchievementRepository";

export class GetStudentAchievementsUseCase {
  constructor(private readonly repo: IAchievementRepository) {}

  async execute(
    studentId: string,
    schoolId: string
  ): Promise<StudentAchievementsSummary> {
    if (!studentId) {
      throw new Error("Student ID wajib diisi");
    }
    if (!schoolId) {
      throw new Error("School ID wajib diisi");
    }

    const [setoranRows, munaqosahRows] = await Promise.all([
      this.repo.getStudentSetoranHistory(studentId, schoolId),
      this.repo.getStudentMunaqosahAchievements(studentId, schoolId),
    ]);

    return calculateStudentAchievements(setoranRows, munaqosahRows);
  }
}
