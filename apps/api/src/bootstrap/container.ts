import { Hono } from "hono";
import Redis from "ioredis";
import { createDb } from "../db/client";
import { DrizzleUserRepository } from "../modules/auth/infrastructure/DrizzleUserRepository";
import { RedisTokenRepository } from "../modules/auth/infrastructure/RedisTokenRepository";
import { TokenService } from "../modules/auth/application/services/TokenService";
import { PasswordHasher } from "../modules/auth/application/services/PasswordHasher";
import { LoginUseCase } from "../modules/auth/application/use-cases/LoginUseCase";
import { RefreshTokenUseCase } from "../modules/auth/application/use-cases/RefreshTokenUseCase";
import { GetProfileUseCase } from "../modules/auth/application/use-cases/GetProfileUseCase";
import { UpdateProfileUseCase } from "../modules/auth/application/use-cases/UpdateProfileUseCase";
import { ChangePasswordUseCase } from "../modules/auth/application/use-cases/ChangePasswordUseCase";
import { buildAuthRoutes, buildAuthProtectedRoutes } from "../modules/auth/presentation/routes";
import { authMiddleware } from "../middleware/auth.middleware";
import { tenantScopeMiddleware } from "../middleware/tenant-scope.middleware";
import { errorHandler } from "../middleware/error-handler";

export interface ContainerDeps {
  loginUseCase: LoginUseCase;
  refreshTokenUseCase: RefreshTokenUseCase;
  getProfileUseCase: GetProfileUseCase;
  updateProfileUseCase: UpdateProfileUseCase;
  changePasswordUseCase: ChangePasswordUseCase;
  tokenService: TokenService;
}

export function createApp(deps: ContainerDeps): Hono {
  const app = new Hono();
  app.use("*", errorHandler);

  // Public auth routes
  app.route("/auth", buildAuthRoutes(deps));

  // Protected user routes (GET /users/me, PATCH /users/profile, PATCH /users/change-password)
  const protectedUsers = buildAuthProtectedRoutes(deps);
  app.use("/users/*", authMiddleware(deps.tokenService), tenantScopeMiddleware);
  app.route("/users", protectedUsers);

  return app;
}

export function buildContainer() {
  const db = createDb();
  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

  const userRepository = new DrizzleUserRepository(db);
  const tokenRepository = new RedisTokenRepository(redis);
  const passwordHasher = new PasswordHasher();

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
    passwordHasher
  );
  const refreshTokenUseCase = new RefreshTokenUseCase(
    tokenRepository,
    tokenService
  );
  const getProfileUseCase = new GetProfileUseCase(userRepository);
  const updateProfileUseCase = new UpdateProfileUseCase(userRepository);
  const changePasswordUseCase = new ChangePasswordUseCase(userRepository, passwordHasher);

  return {
    app: createApp({
      loginUseCase,
      refreshTokenUseCase,
      getProfileUseCase,
      updateProfileUseCase,
      changePasswordUseCase,
      tokenService,
    }),
    redis,
  };
}
