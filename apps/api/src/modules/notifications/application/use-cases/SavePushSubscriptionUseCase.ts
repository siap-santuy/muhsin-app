import { z } from "zod";
import type { IPushSubscriptionRepository, SavePushSubscriptionInput } from "../../domain/repositories/IPushSubscriptionRepository";

export const savePushSubscriptionSchema = z.object({
  schoolId: z.string().min(1),
  userId: z.string().min(1),
  endpoint: z.string().url().max(2000),
  p256dh: z.string().min(1).max(500),
  auth: z.string().min(1).max(500),
  userAgent: z.string().max(500).optional().nullable(),
});

export class SavePushSubscriptionUseCase {
  constructor(private readonly repo: IPushSubscriptionRepository) {}

  async execute(input: SavePushSubscriptionInput) {
    const parsed = savePushSubscriptionSchema.parse(input);
    return this.repo.upsert(parsed);
  }
}
