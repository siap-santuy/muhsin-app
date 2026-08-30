import type { ISetoranRepository } from "../../domain/repositories/ISetoranRepository";

export class GetSetoranHistoryUseCase {
  constructor(private readonly repo: ISetoranRepository) {}

  async execute(params: {
    studentId: string;
    schoolId: string;
    subcategoryId?: string;
    month?: string;
  }) {
    return this.repo.findByStudent(
      params.studentId,
      params.schoolId,
      params.subcategoryId,
      params.month
    );
  }
}
