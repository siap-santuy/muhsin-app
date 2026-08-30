import type { IMunaqosahRepository } from "../../domain/repositories/IMunaqosahRepository";

export class GetMunaqosahRequestsUseCase {
  constructor(private readonly repo: IMunaqosahRepository) {}

  async execute(schoolId: string, status?: string) {
    return this.repo.findRequests(schoolId, status);
  }
}
