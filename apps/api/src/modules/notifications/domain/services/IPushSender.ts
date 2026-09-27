import type { PushSubscriptionEntity, PushPayload } from "../entities/PushSubscription";

export interface PushSendResult {
  endpoint: string;
  gone: boolean;
}

export interface IPushSender {
  send(subscription: PushSubscriptionEntity, payload: PushPayload): Promise<PushSendResult>;
}
