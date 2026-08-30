import type { Context, Next } from "hono";
import type { AuthVariables } from "./auth.middleware";

export function requireRole(...allowedRoles: string[]) {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          data: null,
          error: { code: "UNAUTHORIZED", message: "Autentikasi dibutuhkan" },
          meta: null,
        },
        401
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          data: null,
          error: {
            code: "FORBIDDEN",
            message: `Akses ditolak untuk role '${user.role}'`,
          },
          meta: null,
        },
        403
      );
    }

    await next();
  };
}
