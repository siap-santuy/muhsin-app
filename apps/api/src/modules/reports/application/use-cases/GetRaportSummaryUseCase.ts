import type { IRaportRepository } from "../../domain/repositories/IRaportRepository";
import type { RaportSummaryFilter, RaportSummaryItem } from "../../domain/entities/Raport";

export class GetRaportSummaryUseCase {
  constructor(private readonly repo: IRaportRepository) {}

  async execute(filter: RaportSummaryFilter): Promise<RaportSummaryItem[]> {
    return this.repo.getRaportSummary(filter);
  }
}
