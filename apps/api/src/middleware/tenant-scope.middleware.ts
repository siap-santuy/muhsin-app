import type { Context, Next } from "hono";
import type { AuthVariables } from "./auth.middleware";

export async function tenantScopeMiddleware(
  c: Context<{ Variables: AuthVariables }>,
  next: Next
) {
  const user = c.get("user");

  if (!user) {
    return c.json(
      {
        data: null,
        error: { code: "TENANT_REQUIRED", message: "Konteks tenant tidak ditemukan" },
        meta: null,
      },
      403
    );
  }

  const targetSchoolId =
    c.req.header("X-School-Id") ?? c.req.query("schoolId") ?? user.schoolId;

  if (targetSchoolId !== user.schoolId) {
    return c.json(
      {
        data: null,
        error: {
          code: "TENANT_MISMATCH",
          message: "Akses lintas tenant ditolak",
        },
        meta: null,
      },
      403
    );
  }

  c.set("schoolId", user.schoolId);
  await next();
}
