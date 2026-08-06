import { Hono } from "hono";
import Redis from "ioredis";
import { createDb } from "../db/client";
import { DrizzleUserRepository } from "../modules/auth/infrastructure/DrizzleUserRepository";
import { RedisTokenRepository } from "../modules/auth/infrastructure/RedisTokenRepository";
import { TokenService } from "../modules/auth/application/services/TokenService";
import { PasswordHasher } from "../modules/auth/application/services/PasswordHasher";
import { LoginUseCase } from "../modules/auth/application/use-cases/LoginUseCase";
import { RefreshTokenUseCase } from "../modules/auth/application/use-cases/RefreshTokenUseCase";
import { buildAuthRoutes, buildAuthProtectedRoutes } from "../modules/auth/presentation/routes";
import { authMiddleware } from "../middleware/auth.middleware";
import { tenantScopeMiddleware } from "../middleware/tenant-scope.middleware";
import { errorHandler } from "../middleware/error-handler";

export interface ContainerDeps {
  loginUseCase: LoginUseCase;
  refreshTokenUseCase: RefreshTokenUseCase;
  tokenService: TokenService;
}

export function createApp(deps: ContainerDeps): Hono {
  const app = new Hono();
  app.use("*", errorHandler);

  app.route("/auth", buildAuthRoutes(deps));

  app.use("/auth/me", authMiddleware(deps.tokenService), tenantScopeMiddleware);
  app.route("/auth/me", buildAuthProtectedRoutes());

  return app;
}

export function buildContainer() {
  const db = createDb();
  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

  const userRepository = new DrizzleUserRepository(db);
  const tokenRepository = new RedisTokenRepository(redis);

  const tokenService = new TokenService(
    process.env.JWT_SECRET ?? "dev-secret-access-change-me",
    process.env.JWT_REFRESH_SECRET ?? "dev-secret-refresh-change-me",
    Number(process.env.ACCESS_TOKEN_TTL ?? 900),
    Number(process.env.REFRESH_TOKEN_TTL ?? 604800)
  );

  const loginUseCase = new LoginUseCase(
    userRepository,
    tokenRepository,
    tokenService,
    new PasswordHasher()
  );
  const refreshTokenUseCase = new RefreshTokenUseCase(
    tokenRepository,
    tokenService
  );

  return {
    app: createApp({ loginUseCase, refreshTokenUseCase, tokenService }),
    redis,
  };
}
