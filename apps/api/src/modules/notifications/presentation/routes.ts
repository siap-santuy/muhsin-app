import { Hono } from "hono";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetNotificationsUseCase } from "../application/use-cases/GetNotificationsUseCase";
import type { MarkNotificationReadUseCase } from "../application/use-cases/MarkNotificationReadUseCase";
import type { MarkAllNotificationsReadUseCase } from "../application/use-cases/MarkAllNotificationsReadUseCase";

export interface NotificationRoutesDeps {
  getNotificationsUseCase: GetNotificationsUseCase;
  markNotificationReadUseCase: MarkNotificationReadUseCase;
  markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase;
}

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
      await deps.markNotificationReadUseCase.execute(id, user.userId, user.schoolId);
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    }
  );

  return app;
}
