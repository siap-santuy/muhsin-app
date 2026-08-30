import type { IMunaqosahRepository } from "../../domain/repositories/IMunaqosahRepository";
import type { AddExpUseCase } from "../../../gamification/application/use-cases/AddExpUseCase";

export class SubmitMunaqosahResultUseCase {
  constructor(
    private readonly repo: IMunaqosahRepository,
    private readonly addExpUseCase: AddExpUseCase
  ) {}

  async execute(params: {
    assignmentId: string;
    scores: Record<string, number>;
    hasil: "lulus" | "tidak_lulus";
    catatanPenguji?: string;
  }) {
    const info = await this.repo.submitResult(params);

    if (params.hasil === "lulus") {
      // 1. Auto grant achievement badge munaqosah_juz
      await this.repo.grantAchievement({
        schoolId: info.schoolId,
        studentId: info.studentId,
        juzKe: info.juzKe,
        sourceId: params.assignmentId,
      });

      // 2. Beri reward bonus EXP kelulusan (+100 EXP)
      await this.addExpUseCase.execute({
        schoolId: info.schoolId,
        studentId: info.studentId,
        sourceType: "munaqosah",
        sourceId: params.assignmentId,
        expAmount: 100,
        description: `Lulus Munaqosah Ujian Juz ${info.juzKe}`,
      });
    }
  }
}
