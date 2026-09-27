import webpush from "web-push";
import type { IPushSender, PushSendResult } from "../domain/services/IPushSender";
import type { PushSubscriptionEntity, PushPayload } from "../domain/entities/PushSubscription";

export class WebPushSender implements IPushSender {
  constructor(vapidPublicKey?: string, vapidPrivateKey?: string, vapidSubject?: string) {
    const pub = vapidPublicKey ?? process.env.VAPID_PUBLIC_KEY ?? "";
    const priv = vapidPrivateKey ?? process.env.VAPID_PRIVATE_KEY ?? "";
    const subject = vapidSubject ?? process.env.VAPID_SUBJECT ?? "mailto:admin@muhsin.id";
    if (pub && priv) {
      webpush.setVapidDetails(subject, pub, priv);
    }
  }

  async send(subscription: PushSubscriptionEntity, payload: PushPayload): Promise<PushSendResult> {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify(payload)
      );
      return { endpoint: subscription.endpoint, gone: false };
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 404 || status === 410) {
        return { endpoint: subscription.endpoint, gone: true };
      }
      return { endpoint: subscription.endpoint, gone: false };
    }
  }
}
