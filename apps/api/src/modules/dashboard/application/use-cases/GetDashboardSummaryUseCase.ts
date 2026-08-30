import type { IDashboardRepository } from "../../domain/repositories/IDashboardRepository";

export class GetDashboardSummaryUseCase {
  constructor(private readonly repo: IDashboardRepository) {}

  async execute(user: { userId: string; role: string; schoolId: string }) {
    switch (user.role) {
      case "student":
        return this.repo.getStudentDashboard(user.userId, user.schoolId);
      case "teacher":
        return this.repo.getTeacherDashboard(user.userId, user.schoolId);
      case "parent":
        return this.repo.getParentDashboard(user.userId, user.schoolId);
      case "koordinator_ttq":
      default:
        return this.repo.getKoordinatorDashboard(user.schoolId);
    }
  }
}
