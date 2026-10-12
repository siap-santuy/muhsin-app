import type { IHafalanTargetRepository } from "../../domain/repositories/IHafalanTargetRepository";

export class GetHafalanTargetUseCase {
  constructor(private readonly repo: IHafalanTargetRepository) {}

  async execute(params: {
    studentId: string;
    bulan: string;
    schoolId: string;
  }) {
    return this.repo.findByStudentAndMonth(
      params.studentId,
      params.bulan,
      params.schoolId
    );
  }
}
