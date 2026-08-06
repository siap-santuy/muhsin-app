import { Hono } from "hono";
import type { LoginUseCase } from "../application/use-cases/LoginUseCase";
import type { RefreshTokenUseCase } from "../application/use-cases/RefreshTokenUseCase";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { loginValidator, refreshTokenValidator } from "./validators";

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

export function buildAuthProtectedRoutes(): Hono<{ Variables: AuthVariables }> {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.get("/", async (c) => {
    const user = c.get("user");
    const schoolId = c.get("schoolId");
    return c.json(
      {
        data: { userId: user.userId, role: user.role, schoolId },
        error: null,
        meta: null,
      },
      200
    );
  });

  return app;
}
