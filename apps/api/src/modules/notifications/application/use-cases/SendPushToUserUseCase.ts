import type { IPushSubscriptionRepository } from "../../domain/repositories/IPushSubscriptionRepository";
import type { IPushSender } from "../../domain/services/IPushSender";
import type { PushPayload, PushSubscriptionEntity } from "../../domain/entities/PushSubscription";

export class SendPushToUserUseCase {
  constructor(
    private readonly repo: IPushSubscriptionRepository,
    private readonly sender: IPushSender
  ) {}

  async execute(params: { userId: string; schoolId: string; payload: PushPayload }): Promise<{ sent: number; removed: number }> {
    const subs = await this.repo.listByUser(params.userId, params.schoolId);
    let sent = 0;
    let removed = 0;
    await Promise.all(
      subs.map(async (sub: PushSubscriptionEntity) => {
        try {
          const res = await this.sender.send(sub, params.payload);
          if (res.gone) {
            await this.repo.deleteByEndpoint(sub.endpoint);
            removed++;
          } else {
            sent++;
          }
        } catch {
          // best-effort
        }
      })
    );
    return { sent, removed };
  }
}
