import type { IPushSubscriptionRepository } from "../../domain/repositories/IPushSubscriptionRepository";

export class RemovePushSubscriptionUseCase {
  constructor(private readonly repo: IPushSubscriptionRepository) {}

  async execute(params: { endpoint: string; userId: string; schoolId: string }): Promise<void> {
    await this.repo.removeByEndpoint(params.endpoint, params.userId, params.schoolId);
  }
}
