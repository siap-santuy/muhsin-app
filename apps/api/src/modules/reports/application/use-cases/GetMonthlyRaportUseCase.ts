import type { IRaportRepository } from "../../domain/repositories/IRaportRepository";

export class GetMonthlyRaportUseCase {
  constructor(private readonly repo: IRaportRepository) {}

  async execute(studentId: string, month: string, schoolId: string) {
    return this.repo.getMonthlyRaport(studentId, month, schoolId);
  }
}
