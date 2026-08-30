import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { requireRole } from "../middleware/rbac.middleware";
import type { AuthVariables } from "../middleware/auth.middleware";

describe("RBAC Middleware", () => {
  it("allows access when user has the allowed role", async () => {
    const app = new Hono<{ Variables: AuthVariables }>();

    app.use("*", async (c, next) => {
      c.set("user", { userId: "1", schoolId: "s-1", role: "teacher" });
      await next();
    });

    app.get("/teacher-only", requireRole("teacher"), (c) =>
      c.json({ ok: true })
    );

    const res = await app.request("/teacher-only");
    expect(res.status).toBe(200);
  });

  it("returns 403 when user role is not allowed", async () => {
    const app = new Hono<{ Variables: AuthVariables }>();

    app.use("*", async (c, next) => {
      c.set("user", { userId: "1", schoolId: "s-1", role: "student" });
      await next();
    });

    app.get("/teacher-only", requireRole("teacher"), (c) =>
      c.json({ ok: true })
    );

    const res = await app.request("/teacher-only");
    expect(res.status).toBe(403);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
