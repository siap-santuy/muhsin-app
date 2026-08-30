import type { ISetoranRepository } from "../../domain/repositories/ISetoranRepository";

export class GetAssessmentCategoriesUseCase {
  constructor(private readonly repo: ISetoranRepository) {}

  async execute(schoolId: string) {
    return this.repo.getActiveSubcategories(schoolId);
  }
}
