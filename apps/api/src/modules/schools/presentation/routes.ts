import { Hono } from "hono";
import type { Db } from "../../../db/client";
import { schools } from "../../../db/schema";
import { eq } from "drizzle-orm";

export function createPublicSchoolRoutes(db: Db) {
  const app = new Hono();

  // GET /schools/public/:slug
  app.get("/public/:slug", async (c) => {
    const slug = c.req.param("slug");
    let rows = await db
      .select({
        id: schools.id,
        slug: schools.slug,
        name: schools.name,
        jenjang: schools.jenjang,
        address: schools.address,
        logoUrl: schools.logoUrl,
      })
      .from(schools)
      .where(eq(schools.slug, slug))
      .limit(1);

    if (rows.length === 0) {
      // Fallback to first school
      rows = await db
        .select({
          id: schools.id,
          slug: schools.slug,
          name: schools.name,
          jenjang: schools.jenjang,
          address: schools.address,
          logoUrl: schools.logoUrl,
        })
        .from(schools)
        .limit(1);
    }

    if (rows.length === 0) {
      return c.json(
        { data: null, error: { code: "NOT_FOUND", message: "Sekolah tidak ditemukan" }, meta: null },
        404
      );
    }

    return c.json({ data: rows[0], error: null, meta: null }, 200);
  });

  // GET /schools/public
  app.get("/public", async (c) => {
    const slug = c.req.query("slug");
    if (slug) {
      const rows = await db
        .select({
          id: schools.id,
          slug: schools.slug,
          name: schools.name,
          jenjang: schools.jenjang,
          address: schools.address,
          logoUrl: schools.logoUrl,
        })
        .from(schools)
        .where(eq(schools.slug, slug))
        .limit(1);

      if (rows.length > 0) {
        return c.json({ data: rows[0], error: null, meta: null }, 200);
      }
    }

    const rows = await db
      .select({
        id: schools.id,
        slug: schools.slug,
        name: schools.name,
        jenjang: schools.jenjang,
        address: schools.address,
        logoUrl: schools.logoUrl,
      })
      .from(schools)
      .limit(1);

    if (rows.length === 0) {
      return c.json(
        { data: null, error: { code: "NOT_FOUND", message: "Sekolah tidak ditemukan" }, meta: null },
        404
      );
    }

    return c.json({ data: rows[0], error: null, meta: null }, 200);
  });

  return app;
}
