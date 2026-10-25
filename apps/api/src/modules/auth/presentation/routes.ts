import { Hono } from "hono";
import type { LoginUseCase } from "../application/use-cases/LoginUseCase";
import type { RefreshTokenUseCase } from "../application/use-cases/RefreshTokenUseCase";
import type { RequestPasswordResetUseCase } from "../application/use-cases/RequestPasswordResetUseCase";
import type { GetProfileUseCase } from "../application/use-cases/GetProfileUseCase";
import type { UpdateProfileUseCase } from "../application/use-cases/UpdateProfileUseCase";
import type { ChangePasswordUseCase } from "../application/use-cases/ChangePasswordUseCase";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import {
  loginValidator,
  refreshTokenValidator,
  updateProfileValidator,
  changePasswordValidator,
} from "./validators";
import { requestPasswordResetSchema } from "@muhsin/shared";
import { rateLimiter } from "../../../middleware/rate-limiter.middleware";
import type Redis from "ioredis";

export interface AuthRoutesDeps {
  loginUseCase: LoginUseCase;
  refreshTokenUseCase: RefreshTokenUseCase;
  requestPasswordResetUseCase?: RequestPasswordResetUseCase;
  redis?: Redis;
}

export function buildAuthRoutes(deps: AuthRoutesDeps): Hono {
  const app = new Hono();

  // Rate limit login: max 5 requests per 60 seconds per IP
  const loginLimiter = rateLimiter({
    windowSeconds: 60,
    maxRequests: 5,
    keyPrefix: "rl:login",
    errorMessage: "Terlalu banyak percobaan login gagal. Silakan tunggu 1 menit sebelum mencoba lagi.",
    redis: deps.redis,
  });

  // Rate limit password reset request: max 3 requests per 300 seconds per IP
  const resetLimiter = rateLimiter({
    windowSeconds: 300,
    maxRequests: 3,
    keyPrefix: "rl:pwd_reset",
    errorMessage: "Terlalu banyak permohonan reset password. Silakan tunggu 5 menit sebelum mencoba lagi.",
    redis: deps.redis,
  });

  app.post("/login", loginLimiter, loginValidator, async (c) => {
    const input = c.req.valid("json");
    const result = await deps.loginUseCase.execute(input);
    return c.json({ data: result, error: null, meta: null }, 200);
  });

  app.post("/refresh", refreshTokenValidator, async (c) => {
    const input = c.req.valid("json");
    const result = await deps.refreshTokenUseCase.execute(input);
    return c.json({ data: result, error: null, meta: null }, 200);
  });

  app.post("/request-password-reset", resetLimiter, async (c) => {
    if (!deps.requestPasswordResetUseCase) {
      return c.json({ data: null, error: { message: "Fitur reset belum tersedia" }, meta: null }, 500);
    }
    const body = await c.req.json().catch(() => ({}));
    const parsed = requestPasswordResetSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ data: null, error: { message: "Username atau email wajib diisi" }, meta: null }, 400);
    }
    try {
      const result = await deps.requestPasswordResetUseCase.execute(parsed.data);
      return c.json({ data: result, error: null, meta: null }, 200);
    } catch (err: any) {
      return c.json({ data: null, error: { message: err?.message || "Permintaan reset gagal" }, meta: null }, 400);
    }
  });

  return app;
}

export interface AuthProtectedRoutesDeps {
  getProfileUseCase: GetProfileUseCase;
  updateProfileUseCase: UpdateProfileUseCase;
  changePasswordUseCase: ChangePasswordUseCase;
}

export function buildAuthProtectedRoutes(
  deps: AuthProtectedRoutesDeps
): Hono<{ Variables: AuthVariables }> {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /users/me
  app.get("/me", async (c) => {
    const user = c.get("user");
    const result = await deps.getProfileUseCase.execute(user.userId, user.schoolId);
    return c.json({ data: result, error: null, meta: null }, 200);
  });

  // PATCH /users/profile
  app.patch("/profile", updateProfileValidator, async (c) => {
    const user = c.get("user");
    const input = c.req.valid("json");
    const result = await deps.updateProfileUseCase.execute(
      user.userId,
      user.schoolId,
      input
    );
    return c.json({ data: result, error: null, meta: null }, 200);
  });

  // PATCH /users/change-password
  app.patch("/change-password", changePasswordValidator, async (c) => {
    const user = c.get("user");
    const input = c.req.valid("json");
    await deps.changePasswordUseCase.execute(
      user.userId,
      user.schoolId,
      input
    );
    return c.json(
      { data: { message: "Password berhasil diubah" }, error: null, meta: null },
      200
    );
  });

  return app;
}
