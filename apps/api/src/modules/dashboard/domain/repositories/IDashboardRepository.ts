import type {
  StudentDashboardSummary,
  TeacherDashboardSummary,
  ParentDashboardSummary,
  KoordinatorDashboardSummary,
} from "../entities/Dashboard";

export interface IDashboardRepository {
  getStudentDashboard(studentId: string, schoolId: string): Promise<StudentDashboardSummary>;
  getTeacherDashboard(teacherId: string, schoolId: string): Promise<TeacherDashboardSummary>;
  getParentDashboard(parentId: string, schoolId: string): Promise<ParentDashboardSummary>;
  getKoordinatorDashboard(schoolId: string): Promise<KoordinatorDashboardSummary>;
}
