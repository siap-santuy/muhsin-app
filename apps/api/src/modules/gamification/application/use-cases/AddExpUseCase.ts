import type { IGamificationRepository } from "../../domain/repositories/IGamificationRepository";
import type { IExpTransactionRepository, ExpSourceType } from "../../domain/repositories/IExpTransactionRepository";
import { ExpCalculator } from "../../domain/services/ExpCalculator";

export interface AddExpInput {
  schoolId: string;
  studentId: string;
  sourceType: ExpSourceType;
  sourceId?: string | null;
  expAmount: number;
  description?: string | null;
}

export class AddExpUseCase {
  constructor(
    private readonly gamificationRepo: IGamificationRepository,
    private readonly expTxRepo: IExpTransactionRepository
  ) {}

  async execute(input: AddExpInput): Promise<{ newTotalExp: number; newLevel: number }> {
    // 1. Log transaction
    await this.expTxRepo.create({
      schoolId: input.schoolId,
      studentId: input.studentId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      expAmount: input.expAmount,
      description: input.description,
    });

    // 2. Fetch current summary
    const current = await this.gamificationRepo.findByStudentId(
      input.studentId,
      input.schoolId
    );

    const prevExp = current?.totalExp ?? 0;
    const newTotalExp = Math.max(0, prevExp + input.expAmount);
    const newLevel = ExpCalculator.calculateLevel(newTotalExp);

    // 3. Upsert gamification summary (level can drop if exp drops below threshold, min 1)
    await this.gamificationRepo.upsert({
      studentId: input.studentId,
      schoolId: input.schoolId,
      level: Math.max(1, newLevel),
      totalExp: newTotalExp,
      currentStreak: current?.currentStreak ?? 0,
      longestStreak: current?.longestStreak ?? 0,
      lastActivityDate: current?.lastActivityDate ?? null,
    });

    return { newTotalExp, newLevel };
  }
}
