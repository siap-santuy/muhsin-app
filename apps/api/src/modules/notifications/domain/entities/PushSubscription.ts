export interface PushSubscriptionEntity {
  id: string;
  schoolId: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}
