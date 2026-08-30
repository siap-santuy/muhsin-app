import type { IKurikulumRepository } from "../../domain/repositories/IKurikulumRepository";

export class CreateCategoryUseCase {
  constructor(private readonly repo: IKurikulumRepository) {}

  async execute(params: {
    schoolId: string;
    academicPeriodId: string;
    code: string;
    name: string;
  }) {
    return this.repo.createCategory(params);
  }
}
