export interface GamificationSummary {
  studentId: string;
  schoolId: string;
  level: number;
  totalExp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}
