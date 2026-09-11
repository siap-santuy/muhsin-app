import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import Redis from "ioredis";
import { createDb, type Db } from "../db/client";

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
import { CorrectSetoranUseCase } from "../modules/setoran/application/use-cases/CorrectSetoranUseCase";
import { GetSetoranHistoryUseCase } from "../modules/setoran/application/use-cases/GetSetoranHistoryUseCase";
import { GetSetoranByIdUseCase } from "../modules/setoran/application/use-cases/GetSetoranByIdUseCase";
import { GetAssessmentCategoriesUseCase } from "../modules/setoran/application/use-cases/GetAssessmentCategoriesUseCase";
import { createSetoranRoutes } from "../modules/setoran/presentation/routes";
import { DrizzleTeacherSubstitutionRepository } from "../modules/teachers/infrastructure/DrizzleTeacherSubstitutionRepository";
import { ManageSubstitutionUseCase } from "../modules/teachers/application/use-cases/ManageSubstitutionUseCase";

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
import { GetMyMunaqosahExamsUseCase } from "../modules/munaqosah/application/use-cases/GetMyMunaqosahExamsUseCase";
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

// Notifications module
import { DrizzleCachedNotificationRepository } from "../modules/notifications/infrastructure/DrizzleCachedNotificationRepository";
import { GetNotificationsUseCase } from "../modules/notifications/application/use-cases/GetNotificationsUseCase";
import { MarkNotificationReadUseCase } from "../modules/notifications/application/use-cases/MarkNotificationReadUseCase";
import { MarkAllNotificationsReadUseCase } from "../modules/notifications/application/use-cases/MarkAllNotificationsReadUseCase";
import { createNotificationRoutes } from "../modules/notifications/presentation/routes";

// Middlewares
import { authMiddleware } from "../middleware/auth.middleware";
import { tenantScopeMiddleware } from "../middleware/tenant-scope.middleware";
import { createPublicSchoolRoutes, createSchoolAdminRoutes } from "../modules/schools/presentation/routes";
import { DrizzleSchoolAdminRepository } from "../modules/schools/infrastructure/DrizzleSchoolAdminRepository";
import { ManageStudentUseCase, ManageTeacherUseCase } from "../modules/schools/application/use-cases/ManageSchoolUserUseCase";
import { errorHandler } from "../middleware/error-handler";

export interface ContainerDeps {
  db: Db;
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
  correctSetoranUseCase: CorrectSetoranUseCase;
  getSetoranHistoryUseCase: GetSetoranHistoryUseCase;
  getSetoranByIdUseCase: GetSetoranByIdUseCase;
  getAssessmentCategoriesUseCase: GetAssessmentCategoriesUseCase;
  // Students
  getStudentsUseCase: GetStudentsUseCase;
  getStudentByIdUseCase: GetStudentByIdUseCase;
  manageStudentUseCase: ManageStudentUseCase;
  // Teachers
  getTeachersUseCase: GetTeachersUseCase;
  manageSubstitutionUseCase: ManageSubstitutionUseCase;
  manageTeacherUseCase: ManageTeacherUseCase;
  schoolAdminRepo: DrizzleSchoolAdminRepository;
  // Reports
  getMonthlyRaportUseCase: GetMonthlyRaportUseCase;
  getSemesterRaportUseCase: GetSemesterRaportUseCase;
  // Dashboard
  getDashboardSummaryUseCase: GetDashboardSummaryUseCase;
  // Munaqosah
  getMunaqosahRequestsUseCase: GetMunaqosahRequestsUseCase;
  getMyMunaqosahExamsUseCase: GetMyMunaqosahExamsUseCase;
  createMunaqosahRequestUseCase: CreateMunaqosahRequestUseCase;
  updateMunaqosahStatusUseCase: UpdateMunaqosahStatusUseCase;
  scheduleMunaqosahUseCase: ScheduleMunaqosahUseCase;
  submitMunaqosahResultUseCase: SubmitMunaqosahResultUseCase;
  // Kurikulum
  getKurikulumCategoriesUseCase: GetKurikulumCategoriesUseCase;
  createCategoryUseCase: CreateCategoryUseCase;
  createSubcategoryUseCase: CreateSubcategoryUseCase;
  kurikulumRepo: DrizzleKurikulumRepository;
  // Notifications
  getNotificationsUseCase: GetNotificationsUseCase;
  markNotificationReadUseCase: MarkNotificationReadUseCase;
  markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase;
  notificationRepo: DrizzleCachedNotificationRepository;
}

export function createApp(deps: ContainerDeps): Hono {
  const app = new Hono();

  app.onError((err, c) => errorHandler(err, c));

  app.use("*", logger());

  app.use(
    "*",
    cors({
      origin: (origin) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return "*";

        const allowedExact = [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:3001",
          "https://muhsin.id",
          "https://www.muhsin.id",
          "https://api.muhsin.id",
        ];

        if (allowedExact.includes(origin)) return origin;

        // Allow all subdomains of muhsin.id (e.g. alfitrah.muhsin.id)
        if (/^https:\/\/([a-z0-9-]+\.)*muhsin\.id$/i.test(origin)) {
          return origin;
        }

        // Allow devtunnels / local testing domains
        if (/^https:\/\/[a-z0-9-]+\.asse\.devtunnels\.ms$/i.test(origin)) {
          return origin;
        }

        return null;
      },
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Public auth & school routes
  app.route("/auth", buildAuthRoutes(deps));
  app.route("/schools", createPublicSchoolRoutes(deps.db));

  // Protected middleware for all /api/* routes
  const protectedAuth = authMiddleware(deps.tokenService);

  const schoolAdminRoutes = createSchoolAdminRoutes({
    adminRepo: deps.schoolAdminRepo,
    manageStudentUseCase: deps.manageStudentUseCase,
    manageTeacherUseCase: deps.manageTeacherUseCase,
  });
  app.use("/school-admin/*", protectedAuth, tenantScopeMiddleware);
  app.use("/school-admin", protectedAuth, tenantScopeMiddleware);
  app.route("/school-admin", schoolAdminRoutes);

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
    correctSetoranUseCase: deps.correctSetoranUseCase,
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
    manageStudentUseCase: deps.manageStudentUseCase,
  });
  app.use("/students/*", protectedAuth, tenantScopeMiddleware);
  app.use("/students", protectedAuth, tenantScopeMiddleware);
  app.route("/students", studentRoutes);

  // Teachers
  const teacherRoutes = createTeacherRoutes({
    getTeachersUseCase: deps.getTeachersUseCase,
    manageSubstitutionUseCase: deps.manageSubstitutionUseCase,
    manageTeacherUseCase: deps.manageTeacherUseCase,
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
    getMyExamsUseCase: deps.getMyMunaqosahExamsUseCase,
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

  // Notifications
  const notificationRoutes = createNotificationRoutes({
    getNotificationsUseCase: deps.getNotificationsUseCase,
    markNotificationReadUseCase: deps.markNotificationReadUseCase,
    markAllNotificationsReadUseCase: deps.markAllNotificationsReadUseCase,
  });
  app.use("/notifications/*", protectedAuth, tenantScopeMiddleware);
  app.use("/notifications", protectedAuth, tenantScopeMiddleware);
  app.route("/notifications", notificationRoutes);

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
  const teacherSubRepo = new DrizzleTeacherSubstitutionRepository(db);
  const studentRepo = new DrizzleStudentRepository(db);
  const teacherRepo = new DrizzleTeacherRepository(db);
  const raportRepo = new DrizzleRaportRepository(db);
  const dashboardRepo = new DrizzleDashboardRepository(db);
  const munaqosahRepo = new DrizzleMunaqosahRepository(db);
  const kurikulumRepo = new DrizzleKurikulumRepository(db);
  const notificationRepo = new DrizzleCachedNotificationRepository(db, redis);
  const schoolAdminRepo = new DrizzleSchoolAdminRepository(db);

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
  const correctSetoranUseCase = new CorrectSetoranUseCase(setoranRepo, addExpUseCase);
  const getSetoranHistoryUseCase = new GetSetoranHistoryUseCase(setoranRepo);
  const getSetoranByIdUseCase = new GetSetoranByIdUseCase(setoranRepo);
  const getAssessmentCategoriesUseCase = new GetAssessmentCategoriesUseCase(setoranRepo);

  // UseCases — Students & Teachers
  const getStudentsUseCase = new GetStudentsUseCase(studentRepo);
  const getStudentByIdUseCase = new GetStudentByIdUseCase(studentRepo);
  const getTeachersUseCase = new GetTeachersUseCase(teacherRepo);
  const manageSubstitutionUseCase = new ManageSubstitutionUseCase(teacherSubRepo);
  const manageStudentUseCase = new ManageStudentUseCase(schoolAdminRepo, passwordHasher);
  const manageTeacherUseCase = new ManageTeacherUseCase(schoolAdminRepo, passwordHasher);

  // UseCases — Reports
  const getMonthlyRaportUseCase = new GetMonthlyRaportUseCase(raportRepo);
  const getSemesterRaportUseCase = new GetSemesterRaportUseCase(raportRepo);

  // UseCases — Dashboard
  const getDashboardSummaryUseCase = new GetDashboardSummaryUseCase(dashboardRepo);

  // UseCases — Munaqosah
  const getMunaqosahRequestsUseCase = new GetMunaqosahRequestsUseCase(munaqosahRepo);
  const getMyMunaqosahExamsUseCase = new GetMyMunaqosahExamsUseCase(munaqosahRepo);
  const createMunaqosahRequestUseCase = new CreateMunaqosahRequestUseCase(munaqosahRepo);
  const updateMunaqosahStatusUseCase = new UpdateMunaqosahStatusUseCase(munaqosahRepo);
  const scheduleMunaqosahUseCase = new ScheduleMunaqosahUseCase(munaqosahRepo, notificationRepo);
  const submitMunaqosahResultUseCase = new SubmitMunaqosahResultUseCase(munaqosahRepo, addExpUseCase);

  // UseCases — Kurikulum
  const getKurikulumCategoriesUseCase = new GetKurikulumCategoriesUseCase(kurikulumRepo);
  const createCategoryUseCase = new CreateCategoryUseCase(kurikulumRepo);
  const createSubcategoryUseCase = new CreateSubcategoryUseCase(kurikulumRepo);

  // UseCases — Notifications
  const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepo);
  const markNotificationReadUseCase = new MarkNotificationReadUseCase(notificationRepo);
  const markAllNotificationsReadUseCase = new MarkAllNotificationsReadUseCase(notificationRepo);

  return {
    app: createApp({
      db,
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
      correctSetoranUseCase,
      getSetoranHistoryUseCase,
      getSetoranByIdUseCase,
      getAssessmentCategoriesUseCase,
      getStudentsUseCase,
      getStudentByIdUseCase,
      manageStudentUseCase,
      getTeachersUseCase,
      manageSubstitutionUseCase,
      manageTeacherUseCase,
      schoolAdminRepo,
      getMonthlyRaportUseCase,
      getSemesterRaportUseCase,
      getDashboardSummaryUseCase,
      getMunaqosahRequestsUseCase,
      getMyMunaqosahExamsUseCase,
      createMunaqosahRequestUseCase,
      updateMunaqosahStatusUseCase,
      scheduleMunaqosahUseCase,
      submitMunaqosahResultUseCase,
      getKurikulumCategoriesUseCase,
      createCategoryUseCase,
      createSubcategoryUseCase,
      kurikulumRepo,
      getNotificationsUseCase,
      markNotificationReadUseCase,
      markAllNotificationsReadUseCase,
      notificationRepo,
    }),
    db,
    redis,
  };
}
