import type {
  MunaqosahAchievementRecord,
  SetoranEntryForAchievement,
} from "@muhsin/shared";

export interface IAchievementRepository {
  getStudentSetoranHistory(
    studentId: string,
    schoolId: string
  ): Promise<SetoranEntryForAchievement[]>;

  getStudentMunaqosahAchievements(
    studentId: string,
    schoolId: string
  ): Promise<MunaqosahAchievementRecord[]>;
}
