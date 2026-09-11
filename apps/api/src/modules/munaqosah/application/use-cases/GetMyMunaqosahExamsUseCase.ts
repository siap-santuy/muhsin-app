import type { IMunaqosahRepository } from "../../domain/repositories/IMunaqosahRepository";

export class GetMyMunaqosahExamsUseCase {
  constructor(private readonly repo: IMunaqosahRepository) {}

  async execute(examinerTeacherId: string, schoolId: string) {
    return this.repo.findMyExams(examinerTeacherId, schoolId);
  }
}
