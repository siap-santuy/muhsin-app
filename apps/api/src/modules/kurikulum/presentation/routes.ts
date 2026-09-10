import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { GetKurikulumCategoriesUseCase } from "../application/use-cases/GetKurikulumCategoriesUseCase";
import type { CreateCategoryUseCase } from "../application/use-cases/CreateCategoryUseCase";
import type { CreateSubcategoryUseCase } from "../application/use-cases/CreateSubcategoryUseCase";
import type { IKurikulumRepository } from "../domain/repositories/IKurikulumRepository";

const createCategorySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  academicPeriodId: z.string().uuid().optional(),
});

const createSubcategorySchema = z.object({
  categoryId: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  scoreFields: z.array(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      min: z.number().default(0),
      max: z.number().default(100),
    })
  ),
  includeInRanking: z.boolean().default(false),
});

const updateCategorySchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
});

const updateSubcategorySchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  scoreFields: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        min: z.number().default(0),
        max: z.number().default(100),
      })
    )
    .optional(),
  includeInRanking: z.boolean().optional(),
});

export interface KurikulumRoutesDeps {
  getCategoriesUseCase: GetKurikulumCategoriesUseCase;
  createCategoryUseCase: CreateCategoryUseCase;
  createSubcategoryUseCase: CreateSubcategoryUseCase;
  repo: IKurikulumRepository;
}

export function createKurikulumRoutes(deps: KurikulumRoutesDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /kurikulum/categories
  app.get(
    "/categories",
    requireRole("koordinator_ttq", "teacher"),
    async (c) => {
      const user = c.get("user");
      const cats = await deps.getCategoriesUseCase.execute(user.schoolId);
      return c.json({ data: cats, error: null, meta: null }, 200);
    }
  );

  // POST /kurikulum/categories
  app.post(
    "/categories",
    requireRole("koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const body = await c.req.json();
      const parsed = createCategorySchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
          400
        );
      }

      const id = await deps.createCategoryUseCase.execute({
        schoolId: user.schoolId,
        academicPeriodId: parsed.data.academicPeriodId ?? crypto.randomUUID(),
        code: parsed.data.code,
        name: parsed.data.name,
      });

      return c.json({ data: { id, message: "Kategori berhasil dibuat" }, error: null, meta: null }, 201);
    }
  );

  // POST /kurikulum/subcategories
  app.post(
    "/subcategories",
    requireRole("koordinator_ttq"),
    async (c) => {
      const user = c.get("user");
      const body = await c.req.json();
      const parsed = createSubcategorySchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null },
          400
        );
      }

      const id = await deps.createSubcategoryUseCase.execute({
        schoolId: user.schoolId,
        categoryId: parsed.data.categoryId,
        code: parsed.data.code,
        name: parsed.data.name,
        scoreFields: parsed.data.scoreFields,
        includeInRanking: parsed.data.includeInRanking,
      });

      return c.json({ data: { id, message: "Subkategori berhasil dibuat" }, error: null, meta: null }, 201);
    }
  );

  app.put("/categories/:id", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    const parsed = updateCategorySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
    }
    await deps.repo.updateCategory(c.req.param("id") ?? "", user.schoolId, parsed.data);
    return c.json({ data: { success: true }, error: null, meta: null }, 200);
  });

  app.delete("/categories/:id", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    try {
      await deps.repo.deleteCategory(c.req.param("id") ?? "", user.schoolId);
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    } catch (err: any) {
      return c.json({ data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null }, 422);
    }
  });

  app.put("/subcategories/:id", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    const parsed = updateSubcategorySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ data: null, error: { code: "VALIDATION_ERROR", details: parsed.error.format() }, meta: null }, 400);
    }
    try {
      await deps.repo.updateSubcategory(c.req.param("id") ?? "", user.schoolId, parsed.data);
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    } catch (err: any) {
      return c.json({ data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null }, 422);
    }
  });

  app.delete("/subcategories/:id", requireRole("koordinator_ttq"), async (c) => {
    const user = c.get("user");
    try {
      await deps.repo.deleteSubcategory(c.req.param("id") ?? "", user.schoolId);
      return c.json({ data: { success: true }, error: null, meta: null }, 200);
    } catch (err: any) {
      return c.json({ data: null, error: { code: "BUSINESS_ERROR", message: err.message }, meta: null }, 422);
    }
  });

  // GET /kurikulum/grading-scale
  app.get(
    "/grading-scale",
    requireRole("koordinator_ttq", "teacher"),
    async (c) => {
      const user = c.get("user");
      const scale = await deps.repo.getGradingScale(user.schoolId);
      return c.json({ data: scale, error: null, meta: null }, 200);
    }
  );

  return app;
}
