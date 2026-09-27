import { createDb, closeDb } from "./client";
import { DrizzleActivityRepository } from "../modules/dashboard/infrastructure/DrizzleActivityRepository";
import { PurgeOldParentViewsUseCase } from "../modules/dashboard/application/use-cases/PurgeOldParentViewsUseCase";

const retentionDays = Number(process.argv[2] ?? process.env.PARENT_VIEWS_RETENTION_DAYS ?? 30);

const db = createDb();
try {
  const repo = new DrizzleActivityRepository(db);
  const useCase = new PurgeOldParentViewsUseCase(repo);
  const res = await useCase.execute({ retentionDays });
  console.log(`[purge-parent-views] deleted=${res.deleted} retentionDays=${retentionDays}`);
} finally {
  await closeDb();
}
