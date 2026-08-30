import { Hono } from "hono";
import Redis from "ioredis";
import { createDb } from "../db/client";

// Auth module
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

// Daily Ibadah module
import { DrizzleDailyIbadahRepository } from "../modules/daily-ibadah/infrastructure/DrizzleDailyIbadahRepository";
import { SaveDraftDailyIbadahUseCase } from "../modules/daily-ibadah/application/use-cases/SaveDraftDailyIbadahUseCase";
import { SubmitDailyIbadahUseCase } from "../modules/daily-ibadah/application/use-cases/SubmitDailyIbadahUseCase";
import { createDailyIbadahRoutes } from "../modules/daily-ibadah/presentation/routes";

// Gamification module
import { DrizzleGamificationRepository } from "../modules/gamification/infrastructure/DrizzleGamificationRepository";
import { DrizzleExpTransactionRepository } from "../modules/gamification/infrastructure/DrizzleExpTransactionRepository";
import { GetGamificationSummaryUseCase } from "../modules/gamification/application/use-cases/GetGamificationSummaryUseCase";
import { AddExpUseCase } from "../modules/gamification/application/use-cases/AddExpUseCase";
import { UpdateStreakUseCase } from "../modules/gamification/application/use-cases/UpdateStreakUseCase";
import { createGamificationRoutes } from "../modules/gamification/presentation/routes";

// Setoran module
import { DrizzleSetoranRepository } from "../modules/setoran/infrastructure/DrizzleSetoranRepository";
import { CreateSetoranUseCase } from "../modules/setoran/application/use-cases/CreateSetoranUseCase";
import { createSetoranRoutes } from "../modules/setoran/presentation/routes";

// Students module
import { DrizzleStudentRepository } from "../modules/students/infrastructure/DrizzleStudentRepository";
import { GetStudentsUseCase } from "../modules/students/application/use-cases/GetStudentsUseCase";
import { GetStudentByIdUseCase } from "../modules/students/application/use-cases/GetStudentByIdUseCase";
import { createStudentRoutes } from "../modules/students/presentation/routes";

// Teachers module
import { DrizzleTeacherRepository } from "../modules/teachers/infrastructure/DrizzleTeacherRepository";
import { GetTeachersUseCase } from "../modules/teachers/application/use-cases/GetTeachersUseCase";
import { createTeacherRoutes } from "../modules/teachers/presentation/routes";

// Middlewares
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
  // Daily Ibadah
  dailyIbadahRepo: DrizzleDailyIbadahRepository;
  submitDailyIbadahUseCase: SubmitDailyIbadahUseCase;
  saveDraftDailyIbadahUseCase: SaveDraftDailyIbadahUseCase;
  // Gamification
  getGamificationSummaryUseCase: GetGamificationSummaryUseCase;
  // Setoran
  createSetoranUseCase: CreateSetoranUseCase;
  // Students
  getStudentsUseCase: GetStudentsUseCase;
  getStudentByIdUseCase: GetStudentByIdUseCase;
  // Teachers
  getTeachersUseCase: GetTeachersUseCase;
}

export function createApp(deps: ContainerDeps): Hono {
  const app = new Hono();
  app.use("*", errorHandler);

  // Public auth routes
  app.route("/auth", buildAuthRoutes(deps));

  // Protected middleware for all /api/* routes
  const protectedAuth = authMiddleware(deps.tokenService);

  // Users / Profile
  const protectedUsers = buildAuthProtectedRoutes(deps);
  app.use("/users/*", protectedAuth, tenantScopeMiddleware);
  app.route("/users", protectedUsers);

  // Daily Ibadah
  const dailyIbadahRoutes = createDailyIbadahRoutes(
    deps.dailyIbadahRepo,
    deps.submitDailyIbadahUseCase,
    deps.saveDraftDailyIbadahUseCase
  );
  app.use("/daily-ibadah/*", protectedAuth, tenantScopeMiddleware);
  app.use("/daily-ibadah", protectedAuth, tenantScopeMiddleware);
  app.route("/daily-ibadah", dailyIbadahRoutes);

  // Gamification
  const gamificationRoutes = createGamificationRoutes(deps.getGamificationSummaryUseCase);
  app.use("/gamification/*", protectedAuth, tenantScopeMiddleware);
  app.use("/gamification", protectedAuth, tenantScopeMiddleware);
  app.route("/gamification", gamificationRoutes);

  // Setoran
  const setoranRoutes = createSetoranRoutes(deps.createSetoranUseCase);
  app.use("/setoran/*", protectedAuth, tenantScopeMiddleware);
  app.use("/setoran", protectedAuth, tenantScopeMiddleware);
  app.route("/setoran", setoranRoutes);

  // Students
  const studentRoutes = createStudentRoutes({
    getStudentsUseCase: deps.getStudentsUseCase,
    getStudentByIdUseCase: deps.getStudentByIdUseCase,
  });
  app.use("/students/*", protectedAuth, tenantScopeMiddleware);
  app.use("/students", protectedAuth, tenantScopeMiddleware);
  app.route("/students", studentRoutes);

  // Teachers
  const teacherRoutes = createTeacherRoutes({
    getTeachersUseCase: deps.getTeachersUseCase,
  });
  app.use("/teachers/*", protectedAuth, tenantScopeMiddleware);
  app.use("/teachers", protectedAuth, tenantScopeMiddleware);
  app.route("/teachers", teacherRoutes);

  return app;
}

export function buildContainer() {
  const db = createDb();
  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

  // Repositories
  const userRepository = new DrizzleUserRepository(db);
  const tokenRepository = new RedisTokenRepository(redis);
  const dailyIbadahRepo = new DrizzleDailyIbadahRepository(db);
  const gamificationRepo = new DrizzleGamificationRepository(db);
  const expTxRepo = new DrizzleExpTransactionRepository(db);
  const setoranRepo = new DrizzleSetoranRepository(db);
  const studentRepo = new DrizzleStudentRepository(db);
  const teacherRepo = new DrizzleTeacherRepository(db);

  // Services
  const passwordHasher = new PasswordHasher();
  const tokenService = new TokenService(
    process.env.JWT_SECRET ?? "dev-secret-access-change-me",
    process.env.JWT_REFRESH_SECRET ?? "dev-secret-refresh-change-me",
    Number(process.env.ACCESS_TOKEN_TTL ?? 900),
    Number(process.env.REFRESH_TOKEN_TTL ?? 604800)
  );

  // UseCases — Auth
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

  // UseCases — Gamification
  const addExpUseCase = new AddExpUseCase(gamificationRepo, expTxRepo);
  const updateStreakUseCase = new UpdateStreakUseCase(gamificationRepo);
  const getGamificationSummaryUseCase = new GetGamificationSummaryUseCase(gamificationRepo);

  // UseCases — Daily Ibadah
  const saveDraftDailyIbadahUseCase = new SaveDraftDailyIbadahUseCase(dailyIbadahRepo);
  const submitDailyIbadahUseCase = new SubmitDailyIbadahUseCase(
    dailyIbadahRepo,
    addExpUseCase,
    updateStreakUseCase
  );

  // UseCases — Setoran
  const createSetoranUseCase = new CreateSetoranUseCase(setoranRepo, addExpUseCase);

  // UseCases — Students & Teachers
  const getStudentsUseCase = new GetStudentsUseCase(studentRepo);
  const getStudentByIdUseCase = new GetStudentByIdUseCase(studentRepo);
  const getTeachersUseCase = new GetTeachersUseCase(teacherRepo);

  return {
    app: createApp({
      loginUseCase,
      refreshTokenUseCase,
      getProfileUseCase,
      updateProfileUseCase,
      changePasswordUseCase,
      tokenService,
      dailyIbadahRepo,
      submitDailyIbadahUseCase,
      saveDraftDailyIbadahUseCase,
      getGamificationSummaryUseCase,
      createSetoranUseCase,
      getStudentsUseCase,
      getStudentByIdUseCase,
      getTeachersUseCase,
    }),
    redis,
  };
}
