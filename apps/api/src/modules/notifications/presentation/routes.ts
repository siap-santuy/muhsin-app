import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetNotificationsUseCase } from "../application/use-cases/GetNotificationsUseCase";
import type { MarkNotificationReadUseCase } from "../application/use-cases/MarkNotificationReadUseCase";
import type { MarkAllNotificationsReadUseCase } from "../application/use-cases/MarkAllNotificationsReadUseCase";
import type { SavePushSubscriptionUseCase } from "../application/use-cases/SavePushSubscriptionUseCase";
import type { RemovePushSubscriptionUseCase } from "../application/use-cases/RemovePushSubscriptionUseCase";

export interface NotificationRoutesDeps {
  getNotificationsUseCase: GetNotificationsUseCase;
  markNotificationReadUseCase: MarkNotificationReadUseCase;
  markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase;
  savePushSubscriptionUseCase?: SavePushSubscriptionUseCase;
  removePushSubscriptionUseCase?: RemovePushSubscriptionUseCase;
}

const savePushSchema = z.object({
  endpoint: z.string().url().max(2000),
  p256dh: z.string().min(1).max(500),
  auth: z.string().min(1).max(500),
  userAgent: z.string().max(500).optional().nullable(),
});

const removePushSchema = z.object({
  endpoint: z.string().url().max(2000),
});

export function createNotificationRoutes(deps: NotificationRoutesDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /notifications — list for current authenticated user
  app.get(
    "/",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const list = await deps.getNotificationsUseCase.execute(user.userId, user.schoolId);

      const data = list.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        read: item.isRead,
        time: item.createdAt.toISOString(),
      }));

      return c.json({ data, error: null, meta: null }, 200);
    }
  );

  // PATCH /notifications/read-all — mark all notifications as read
  app.patch(
    "/read-all",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      await deps.markAllNotificationsReadUseCase.execute(user.userId, user.schoolId);
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    }
  );

  // PATCH /notifications/:id/read — mark single notification as read
  app.patch(
    "/:id/read",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const id = c.req.param("id");
      if (!id) {
        return c.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "ID not provided" }, meta: null },
          400
        );
      }
      await deps.markNotificationReadUseCase.execute(id, user.userId, user.schoolId);
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    }
  );

  // GET /notifications/push-public-key — VAPID public key untuk subscribe
  app.get(
    "/push-public-key",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      const key = process.env.VAPID_PUBLIC_KEY ?? "";
      if (!key) {
        return c.json({ data: null, error: { code: "NOT_CONFIGURED", message: "Push belum dikonfigurasi" }, meta: null }, 500);
      }
      return c.json({ data: { publicKey: key }, error: null, meta: null }, 200);
    }
  );

  // POST /notifications/push-subscriptions — daftar device milik sendiri
  app.post(
    "/push-subscriptions",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      if (!deps.savePushSubscriptionUseCase) {
        return c.json({ data: null, error: { code: "NOT_CONFIGURED", message: "Service tidak tersedia" }, meta: null }, 500);
      }
      const user = c.get("user");
      const parsed = savePushSchema.safeParse(await c.req.json());
      if (!parsed.success) {
        return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
      }
      const saved = await deps.savePushSubscriptionUseCase.execute({
        schoolId: user.schoolId,
        userId: user.userId,
        ...parsed.data,
      });
      return c.json({ data: { id: saved.id }, error: null, meta: null }, 201);
    }
  );

  // DELETE /notifications/push-subscriptions — hapus device milik sendiri
  app.delete(
    "/push-subscriptions",
    requireRole("student", "parent", "teacher", "koordinator_ttq"),
    async (c) => {
      if (!deps.removePushSubscriptionUseCase) {
        return c.json({ data: null, error: { code: "NOT_CONFIGURED", message: "Service tidak tersedia" }, meta: null }, 500);
      }
      const user = c.get("user");
      const parsed = removePushSchema.safeParse(await c.req.json());
      if (!parsed.success) {
        return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
      }
      await deps.removePushSubscriptionUseCase.execute({
        endpoint: parsed.data.endpoint,
        userId: user.userId,
        schoolId: user.schoolId,
      });
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    }
  );

  return app;
}
