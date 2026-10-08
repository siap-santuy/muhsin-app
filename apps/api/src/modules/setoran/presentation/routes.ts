import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { CreateSetoranUseCase } from "../application/use-cases/CreateSetoranUseCase";
import type { CorrectSetoranUseCase } from "../application/use-cases/CorrectSetoranUseCase";
import type { GetSetoranHistoryUseCase } from "../application/use-cases/GetSetoranHistoryUseCase";
import type { GetSetoranByIdUseCase } from "../application/use-cases/GetSetoranByIdUseCase";
import type { GetAssessmentCategoriesUseCase } from "../application/use-cases/GetAssessmentCategoriesUseCase";

const createSetoranBodySchema = z.object({
  subcategoryId: z.string().uuid(),
  studentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  referenceStart: z.record(z.any()).optional().nullable(),
  referenceEnd: z.record(z.any()).optional().nullable(),
  scores: z.record(z.number().min(0).max(100)),
  keterangan: z.string().optional().nullable(),
  scoreFieldKeys: z.array(z.string()),
  substitutedForTeacherId: z.string().uuid().optional().nullable(),
});

const correctSetoranBodySchema = z.object({
  targetSubcategoryId: z.string().uuid(),
  scores: z.record(z.number().min(0).max(100)),
  referenceStart: z.record(z.any()).optional().nullable(),
  referenceEnd: z.record(z.any()).optional().nullable(),
  keterangan: z.string().optional().nullable(),
  scoreFieldKeys: z.array(z.string()),
});

export interface SetoranRoutesDeps {
  createSetoranUseCase: CreateSetoranUseCase;
  correctSetoranUseCase: CorrectSetoranUseCase;
  getSetoranHistoryUseCase: GetSetoranHistoryUseCase;
  getSetoranByIdUseCase: GetSetoranByIdUseCase;
  getAssessmentCategoriesUseCase: GetAssessmentCategoriesUseCase;
  resolveStudentId?: (user: { userId: string; role: string; schoolId: string }, requestedStudentId?: string) => Promise<string>;
}

export function createSetoranRoutes(deps: SetoranRoutesDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /setoran/categories — list active assessment subcategories with fields
  app.get(
    "/categories",
    requireRole("teacher", "koordinator_ttq", "student", "parent"),
    async (c) => {
      const user = c.get("user");
      const categories = await deps.getAssessmentCategoriesUseCase.execute(
        user.schoolId
      );
      return c.json({ data: categories, error: null, meta: null }, 200);
    }
  );

  // GET /setoran/history?studentId=&subcategoryId=&month=
  app.get(
    "/history",
    requireRole("teacher", "koordinator_ttq", "student", "parent"),
    async (c) => {
      const user = c.get("user");
      const studentId = deps.resolveStudentId
        ? await deps.resolveStudentId(user, c.req.query("studentId"))
        : (c.req.query("studentId") ?? user.userId);
      const subcategoryId = c.req.query("subcategoryId");
      const month = c.req.query("month");

      const history = await deps.getSetoranHistoryUseCase.execute({
        studentId,
        schoolId: user.schoolId,
        subcategoryId,
        month,
      });

      return c.json({ data: history, error: null, meta: null }, 200);
    }
  );

  // GET /setoran/:id — get specific setoran entry
  app.get(
    "/:id",
    requireRole("teacher", "koordinator_ttq", "student", "parent"),
    async (c) => {
      const user = c.get("user");
      const id = c.req.param("id");

      try {
        const entry = await deps.getSetoranByIdUseCase.execute(
          id ?? "",
          user.schoolId
        );
        return c.json({ data: entry, error: null, meta: null }, 200);
      } catch (err: any) {
        return c.json(
          { data: null, error: { code: "NOT_FOUND", message: err.message }, meta: null },
          404
        );
      }
    }
  );

  // POST /setoran
  app.post("/", requireRole("teacher"), async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = createSetoranBodySchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
        400
      );
    }

    try {
      const entry = await deps.createSetoranUseCase.execute({
        schoolId: user.schoolId,
        teacherId: user.userId,
        ...parsed.data,
      });

      return c.json({ data: entry, error: null, meta: null }, 201);
    } catch (err: any) {
      return c.json(
        { data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null },
        422
      );
    }
  });

  // PATCH /setoran/:id/correct — koreksi atau pindah kategori setoran (guru pemilik atau koordinator)
  app.patch("/:id/correct", requireRole("teacher", "koordinator_ttq"), async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = await c.req.json();
    const parsed = correctSetoranBodySchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
        400
      );
    }

    try {
      const entry = await deps.correctSetoranUseCase.execute({
        setoranId: id ?? "",
        schoolId: user.schoolId,
        userId: user.userId,
        userRole: user.role,
        ...parsed.data,
      });

      return c.json({ data: entry, error: null, meta: null }, 200);
    } catch (err: any) {
      const isForbidden = err.message?.includes("Akses ditolak");
      const isNotFound = err.message?.includes("tidak ditemukan");
      const status = isForbidden ? 403 : isNotFound ? 404 : 422;
      return c.json(
        {
          data: null,
          error: {
            code: isForbidden ? "FORBIDDEN" : isNotFound ? "NOT_FOUND" : "BUSINESS_ERROR",
            message: err.message,
          },
          meta: null,
        },
        status
      );
    }
  });

  return app;
}
