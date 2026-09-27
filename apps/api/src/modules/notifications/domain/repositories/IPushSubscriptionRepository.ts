import type { PushSubscriptionEntity } from "../entities/PushSubscription";

export interface SavePushSubscriptionInput {
  schoolId: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}

export interface IPushSubscriptionRepository {
  upsert(input: SavePushSubscriptionInput): Promise<PushSubscriptionEntity>;
  removeByEndpoint(endpoint: string, userId: string, schoolId: string): Promise<void>;
  listByUser(userId: string, schoolId: string): Promise<PushSubscriptionEntity[]>;
  deleteByEndpoint(endpoint: string): Promise<void>;
}
