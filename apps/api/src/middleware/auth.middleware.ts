import type { Context, Next } from "hono";
import { TokenService } from "../modules/auth/application/services/TokenService";

export interface AuthUserContext {
  userId: string;
  schoolId: string;
  role: string;
}

export interface AuthVariables {
  user: AuthUserContext;
  schoolId: string;
}

export function authMiddleware(tokenService: TokenService) {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const header = c.req.header("Authorization");
    const token = header?.startsWith("Bearer ")
      ? header.slice("Bearer ".length)
      : null;

    if (!token) {
      return c.json(
        {
          data: null,
          error: { code: "UNAUTHORIZED", message: "Token tidak ditemukan" },
          meta: null,
        },
        401
      );
    }

    try {
      const payload = await tokenService.verifyAccessToken(token);
      c.set("user", {
        userId: payload.sub,
        schoolId: payload.schoolId,
        role: payload.role,
      } satisfies AuthUserContext);
      await next();
    } catch {
      return c.json(
        {
          data: null,
          error: { code: "UNAUTHORIZED", message: "Token tidak valid" },
          meta: null,
        },
        401
      );
    }
  };
}
