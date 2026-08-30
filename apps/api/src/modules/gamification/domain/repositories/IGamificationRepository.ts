import type { GamificationSummary } from "../entities/Gamification";

export interface IGamificationRepository {
  findByStudentId(
    studentId: string,
    schoolId: string
  ): Promise<GamificationSummary | null>;
  upsert(data: GamificationSummary): Promise<void>;
}
