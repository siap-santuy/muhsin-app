import type { IGamificationRepository } from "../../domain/repositories/IGamificationRepository";
import type { GamificationSummary } from "../../domain/entities/Gamification";

export class GetGamificationSummaryUseCase {
  constructor(private readonly gamificationRepo: IGamificationRepository) {}

  async execute(
    studentId: string,
    schoolId: string
  ): Promise<GamificationSummary> {
    const summary = await this.gamificationRepo.findByStudentId(
      studentId,
      schoolId
    );

    return (
      summary ?? {
        studentId,
        schoolId,
        level: 1,
        totalExp: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
      }
    );
  }
}
