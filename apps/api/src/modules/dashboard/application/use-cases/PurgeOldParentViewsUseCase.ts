import type { IActivityRepository } from "../../domain/repositories/IActivityRepository";

export class PurgeOldParentViewsUseCase {
  constructor(private readonly repo: IActivityRepository) {}

  async execute(params: { schoolId?: string; retentionDays?: number }): Promise<{ deleted: number }> {
    const days = params.retentionDays ?? 30;
    const olderThan = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const deleted = await this.repo.purgeOldParentViews(olderThan, params.schoolId);
    return { deleted };
  }
}
