import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/rbac.middleware";
import type { CreateSetoranUseCase } from "../application/use-cases/CreateSetoranUseCase";

const createSetoranBodySchema = z.object({
  subcategoryId: z.string().uuid(),
  studentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  referenceStart: z.record(z.any()).optional().nullable(),
  referenceEnd: z.record(z.any()).optional().nullable(),
  scores: z.record(z.number().min(0).max(100)),
  keterangan: z.string().optional().nullable(),
  scoreFieldKeys: z.array(z.string()),
});

export function createSetoranRoutes(useCase: CreateSetoranUseCase) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // POST /api/setoran
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
      const entry = await useCase.execute({
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

  return app;
}
