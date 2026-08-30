import { Hono } from "hono";
import type { LoginUseCase } from "../application/use-cases/LoginUseCase";
import type { RefreshTokenUseCase } from "../application/use-cases/RefreshTokenUseCase";
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

export interface AuthRoutesDeps {
  loginUseCase: LoginUseCase;
  refreshTokenUseCase: RefreshTokenUseCase;
}

export function buildAuthRoutes(deps: AuthRoutesDeps): Hono {
  const app = new Hono();

  app.post("/login", loginValidator, async (c) => {
    const input = c.req.valid("json");
    const result = await deps.loginUseCase.execute(input);
    return c.json({ data: result, error: null, meta: null }, 200);
  });

  app.post("/refresh", refreshTokenValidator, async (c) => {
    const input = c.req.valid("json");
    const result = await deps.refreshTokenUseCase.execute(input);
    return c.json({ data: result, error: null, meta: null }, 200);
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
