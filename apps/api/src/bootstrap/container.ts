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
import { GetDailyIbadahStatsUseCase } from "../modules/daily-ibadah/application/use-cases/GetDailyIbadahStatsUseCase";
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
import { GetSetoranHistoryUseCase } from "../modules/setoran/application/use-cases/GetSetoranHistoryUseCase";
import { GetSetoranByIdUseCase } from "../modules/setoran/application/use-cases/GetSetoranByIdUseCase";
import { GetAssessmentCategoriesUseCase } from "../modules/setoran/application/use-cases/GetAssessmentCategoriesUseCase";
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

// Reports module
import { DrizzleRaportRepository } from "../modules/reports/infrastructure/DrizzleRaportRepository";
import { GetMonthlyRaportUseCase } from "../modules/reports/application/use-cases/GetMonthlyRaportUseCase";
import { GetSemesterRaportUseCase } from "../modules/reports/application/use-cases/GetSemesterRaportUseCase";
import { createRaportRoutes } from "../modules/reports/presentation/routes";

// Dashboard module
import { DrizzleDashboardRepository } from "../modules/dashboard/infrastructure/DrizzleDashboardRepository";
import { GetDashboardSummaryUseCase } from "../modules/dashboard/application/use-cases/GetDashboardSummaryUseCase";
import { createDashboardRoutes } from "../modules/dashboard/presentation/routes";

// Munaqosah module
import { DrizzleMunaqosahRepository } from "../modules/munaqosah/infrastructure/DrizzleMunaqosahRepository";
import { GetMunaqosahRequestsUseCase } from "../modules/munaqosah/application/use-cases/GetMunaqosahRequestsUseCase";
import { CreateMunaqosahRequestUseCase } from "../modules/munaqosah/application/use-cases/CreateMunaqosahRequestUseCase";
import { UpdateMunaqosahStatusUseCase } from "../modules/munaqosah/application/use-cases/UpdateMunaqosahStatusUseCase";
import { ScheduleMunaqosahUseCase } from "../modules/munaqosah/application/use-cases/ScheduleMunaqosahUseCase";
import { SubmitMunaqosahResultUseCase } from "../modules/munaqosah/application/use-cases/SubmitMunaqosahResultUseCase";
import { createMunaqosahRoutes } from "../modules/munaqosah/presentation/routes";

// Kurikulum module
import { DrizzleKurikulumRepository } from "../modules/kurikulum/infrastructure/DrizzleKurikulumRepository";
import { GetKurikulumCategoriesUseCase } from "../modules/kurikulum/application/use-cases/GetKurikulumCategoriesUseCase";
import { CreateCategoryUseCase } from "../modules/kurikulum/application/use-cases/CreateCategoryUseCase";
import { CreateSubcategoryUseCase } from "../modules/kurikulum/application/use-cases/CreateSubcategoryUseCase";
import { createKurikulumRoutes } from "../modules/kurikulum/presentation/routes";

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
  getDailyIbadahStatsUseCase: GetDailyIbadahStatsUseCase;
  // Gamification
  getGamificationSummaryUseCase: GetGamificationSummaryUseCase;
  // Setoran
  createSetoranUseCase: CreateSetoranUseCase;
  getSetoranHistoryUseCase: GetSetoranHistoryUseCase;
  getSetoranByIdUseCase: GetSetoranByIdUseCase;
  getAssessmentCategoriesUseCase: GetAssessmentCategoriesUseCase;
  // Students
  getStudentsUseCase: GetStudentsUseCase;
  getStudentByIdUseCase: GetStudentByIdUseCase;
  // Teachers
  getTeachersUseCase: GetTeachersUseCase;
  // Reports
  getMonthlyRaportUseCase: GetMonthlyRaportUseCase;
  getSemesterRaportUseCase: GetSemesterRaportUseCase;
  // Dashboard
  getDashboardSummaryUseCase: GetDashboardSummaryUseCase;
  // Munaqosah
  getMunaqosahRequestsUseCase: GetMunaqosahRequestsUseCase;
  createMunaqosahRequestUseCase: CreateMunaqosahRequestUseCase;
  updateMunaqosahStatusUseCase: UpdateMunaqosahStatusUseCase;
  scheduleMunaqosahUseCase: ScheduleMunaqosahUseCase;
  submitMunaqosahResultUseCase: SubmitMunaqosahResultUseCase;
  // Kurikulum
  getKurikulumCategoriesUseCase: GetKurikulumCategoriesUseCase;
  createCategoryUseCase: CreateCategoryUseCase;
  createSubcategoryUseCase: CreateSubcategoryUseCase;
  kurikulumRepo: DrizzleKurikulumRepository;
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
  const dailyIbadahRoutes = createDailyIbadahRoutes({
    repo: deps.dailyIbadahRepo,
    submitUseCase: deps.submitDailyIbadahUseCase,
    saveDraftUseCase: deps.saveDraftDailyIbadahUseCase,
    getStatsUseCase: deps.getDailyIbadahStatsUseCase,
  });
  app.use("/daily-ibadah/*", protectedAuth, tenantScopeMiddleware);
  app.use("/daily-ibadah", protectedAuth, tenantScopeMiddleware);
  app.route("/daily-ibadah", dailyIbadahRoutes);

  // Gamification
  const gamificationRoutes = createGamificationRoutes(deps.getGamificationSummaryUseCase);
  app.use("/gamification/*", protectedAuth, tenantScopeMiddleware);
  app.use("/gamification", protectedAuth, tenantScopeMiddleware);
  app.route("/gamification", gamificationRoutes);

  // Setoran
  const setoranRoutes = createSetoranRoutes({
    createSetoranUseCase: deps.createSetoranUseCase,
    getSetoranHistoryUseCase: deps.getSetoranHistoryUseCase,
    getSetoranByIdUseCase: deps.getSetoranByIdUseCase,
    getAssessmentCategoriesUseCase: deps.getAssessmentCategoriesUseCase,
  });
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

  // Reports
  const raportRoutes = createRaportRoutes({
    getMonthlyRaportUseCase: deps.getMonthlyRaportUseCase,
    getSemesterRaportUseCase: deps.getSemesterRaportUseCase,
  });
  app.use("/raport/*", protectedAuth, tenantScopeMiddleware);
  app.use("/raport", protectedAuth, tenantScopeMiddleware);
  app.route("/raport", raportRoutes);

  // Dashboard
  const dashboardRoutes = createDashboardRoutes(deps.getDashboardSummaryUseCase);
  app.use("/dashboard/*", protectedAuth, tenantScopeMiddleware);
  app.use("/dashboard", protectedAuth, tenantScopeMiddleware);
  app.route("/dashboard", dashboardRoutes);

  // Munaqosah
  const munaqosahRoutes = createMunaqosahRoutes({
    getRequestsUseCase: deps.getMunaqosahRequestsUseCase,
    createRequestUseCase: deps.createMunaqosahRequestUseCase,
    updateStatusUseCase: deps.updateMunaqosahStatusUseCase,
    scheduleUseCase: deps.scheduleMunaqosahUseCase,
    submitResultUseCase: deps.submitMunaqosahResultUseCase,
  });
  app.use("/munaqosah/*", protectedAuth, tenantScopeMiddleware);
  app.use("/munaqosah", protectedAuth, tenantScopeMiddleware);
  app.route("/munaqosah", munaqosahRoutes);

  // Kurikulum
  const kurikulumRoutes = createKurikulumRoutes({
    getCategoriesUseCase: deps.getKurikulumCategoriesUseCase,
    createCategoryUseCase: deps.createCategoryUseCase,
    createSubcategoryUseCase: deps.createSubcategoryUseCase,
    repo: deps.kurikulumRepo,
  });
  app.use("/kurikulum/*", protectedAuth, tenantScopeMiddleware);
  app.use("/kurikulum", protectedAuth, tenantScopeMiddleware);
  app.route("/kurikulum", kurikulumRoutes);

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
  const raportRepo = new DrizzleRaportRepository(db);
  const dashboardRepo = new DrizzleDashboardRepository(db);
  const munaqosahRepo = new DrizzleMunaqosahRepository(db);
  const kurikulumRepo = new DrizzleKurikulumRepository(db);

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
  const getDailyIbadahStatsUseCase = new GetDailyIbadahStatsUseCase(dailyIbadahRepo);

  // UseCases — Setoran
  const createSetoranUseCase = new CreateSetoranUseCase(setoranRepo, addExpUseCase);
  const getSetoranHistoryUseCase = new GetSetoranHistoryUseCase(setoranRepo);
  const getSetoranByIdUseCase = new GetSetoranByIdUseCase(setoranRepo);
  const getAssessmentCategoriesUseCase = new GetAssessmentCategoriesUseCase(setoranRepo);

  // UseCases — Students & Teachers
  const getStudentsUseCase = new GetStudentsUseCase(studentRepo);
  const getStudentByIdUseCase = new GetStudentByIdUseCase(studentRepo);
  const getTeachersUseCase = new GetTeachersUseCase(teacherRepo);

  // UseCases — Reports
  const getMonthlyRaportUseCase = new GetMonthlyRaportUseCase(raportRepo);
  const getSemesterRaportUseCase = new GetSemesterRaportUseCase(raportRepo);

  // UseCases — Dashboard
  const getDashboardSummaryUseCase = new GetDashboardSummaryUseCase(dashboardRepo);

  // UseCases — Munaqosah
  const getMunaqosahRequestsUseCase = new GetMunaqosahRequestsUseCase(munaqosahRepo);
  const createMunaqosahRequestUseCase = new CreateMunaqosahRequestUseCase(munaqosahRepo);
  const updateMunaqosahStatusUseCase = new UpdateMunaqosahStatusUseCase(munaqosahRepo);
  const scheduleMunaqosahUseCase = new ScheduleMunaqosahUseCase(munaqosahRepo);
  const submitMunaqosahResultUseCase = new SubmitMunaqosahResultUseCase(munaqosahRepo, addExpUseCase);

  // UseCases — Kurikulum
  const getKurikulumCategoriesUseCase = new GetKurikulumCategoriesUseCase(kurikulumRepo);
  const createCategoryUseCase = new CreateCategoryUseCase(kurikulumRepo);
  const createSubcategoryUseCase = new CreateSubcategoryUseCase(kurikulumRepo);

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
      getDailyIbadahStatsUseCase,
      getGamificationSummaryUseCase,
      createSetoranUseCase,
      getSetoranHistoryUseCase,
      getSetoranByIdUseCase,
      getAssessmentCategoriesUseCase,
      getStudentsUseCase,
      getStudentByIdUseCase,
      getTeachersUseCase,
      getMonthlyRaportUseCase,
      getSemesterRaportUseCase,
      getDashboardSummaryUseCase,
      getMunaqosahRequestsUseCase,
      createMunaqosahRequestUseCase,
      updateMunaqosahStatusUseCase,
      scheduleMunaqosahUseCase,
      submitMunaqosahResultUseCase,
      getKurikulumCategoriesUseCase,
      createCategoryUseCase,
      createSubcategoryUseCase,
      kurikulumRepo,
    }),
    redis,
  };
}
