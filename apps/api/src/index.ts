import { buildContainer } from "./bootstrap/container";
import { createDb } from "./db/client";
import { DrizzleActivityRepository } from "./modules/dashboard/infrastructure/DrizzleActivityRepository";
import { PurgeOldParentViewsUseCase } from "./modules/dashboard/application/use-cases/PurgeOldParentViewsUseCase";

const { app } = buildContainer();

// ponytail: setInterval in-process. Ganti pg_cron/scheduler saat multi-tenant besar.
const RETENTION_DAYS = Number(process.env.PARENT_VIEWS_RETENTION_DAYS ?? 30);
const DAY_MS = 24 * 60 * 60 * 1000;
setInterval(async () => {
  try {
    const db = createDb();
    const repo = new DrizzleActivityRepository(db);
    await new PurgeOldParentViewsUseCase(repo).execute({ retentionDays: RETENTION_DAYS });
  } catch (err) {
    console.error("[purge-parent-views]", err);
  }
}, DAY_MS);

export default {
  port: 3001,
  fetch: app.fetch.bind(app),
  error(err: Error) {
    console.error("[BUN_ERROR]", err);
    return new Response(
      JSON.stringify({
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal" },
        meta: null,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  },
};
