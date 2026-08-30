import type { ISetoranRepository } from "../../domain/repositories/ISetoranRepository";

export class GetSetoranByIdUseCase {
  constructor(private readonly repo: ISetoranRepository) {}

  async execute(id: string, schoolId: string) {
    const entry = await this.repo.findById(id, schoolId);
    if (!entry) throw new Error("Setoran not found");
    return entry;
  }
}
