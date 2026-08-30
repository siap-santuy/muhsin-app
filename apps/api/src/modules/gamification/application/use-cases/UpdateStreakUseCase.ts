import type { IGamificationRepository } from "../../domain/repositories/IGamificationRepository";
import { ExpCalculator } from "../../domain/services/ExpCalculator";

export interface UpdateStreakInput {
  schoolId: string;
  studentId: string;
  today: string; // YYYY-MM-DD
  isComplete: boolean;
}

export class UpdateStreakUseCase {
  constructor(private readonly gamificationRepo: IGamificationRepository) {}

  async execute(
    input: UpdateStreakInput
  ): Promise<{ currentStreak: number; longestStreak: number }> {
    const current = await this.gamificationRepo.findByStudentId(
      input.studentId,
      input.schoolId
    );

    const { currentStreak, longestStreak } = ExpCalculator.evaluateStreak({
      lastActivityDate: current?.lastActivityDate ?? null,
      currentStreak: current?.currentStreak ?? 0,
      longestStreak: current?.longestStreak ?? 0,
      today: input.today,
      isComplete: input.isComplete,
    });

    await this.gamificationRepo.upsert({
      studentId: input.studentId,
      schoolId: input.schoolId,
      level: current?.level ?? 1,
      totalExp: current?.totalExp ?? 0,
      currentStreak,
      longestStreak,
      lastActivityDate: input.isComplete ? input.today : current?.lastActivityDate ?? null,
    });

    return { currentStreak, longestStreak };
  }
}
