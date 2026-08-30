import type { IKurikulumRepository } from "../../domain/repositories/IKurikulumRepository";

export class GetKurikulumCategoriesUseCase {
  constructor(private readonly repo: IKurikulumRepository) {}

  async execute(schoolId: string) {
    return this.repo.getCategoriesWithSubcategories(schoolId);
  }
}
