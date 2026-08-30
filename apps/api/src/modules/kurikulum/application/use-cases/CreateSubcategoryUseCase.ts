import type { IKurikulumRepository } from "../../domain/repositories/IKurikulumRepository";

export class CreateSubcategoryUseCase {
  constructor(private readonly repo: IKurikulumRepository) {}

  async execute(params: {
    schoolId: string;
    categoryId: string;
    code: string;
    name: string;
    scoreFields: any[];
    includeInRanking: boolean;
  }) {
    return this.repo.createSubcategory(params);
  }
}
