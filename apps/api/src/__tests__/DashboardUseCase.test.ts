import { describe, it, expect } from "vitest";
import { GetDashboardSummaryUseCase } from "../modules/dashboard/application/use-cases/GetDashboardSummaryUseCase";
import type { IDashboardRepository } from "../modules/dashboard/domain/repositories/IDashboardRepository";
import type {
  StudentDashboardSummary,
  TeacherDashboardSummary,
  ParentDashboardSummary,
  KoordinatorDashboardSummary,
} from "../modules/dashboard/domain/entities/Dashboard";

describe("GetDashboardSummaryUseCase", () => {
  const mockStudentDash: StudentDashboardSummary = {
    studentName: "Ahmad",
    level: 2,
    totalExp: 200,
    currentStreak: 4,
    longestStreak: 7,
    targetHafalan: null,
    progresBulanIni: {
      ziyadahCount: 5,
      murojaahCount: 10,
      tahsinCount: 6,
      yaumiyahDays: 12,
    },
  };

  const mockTeacherDash: TeacherDashboardSummary = {
    teacherName: "Ustadz Arai",
    totalStudents: 15,
    totalClassesToday: 2,
    completedClassesToday: 1,
    pendingClassesToday: 1,
    setorHariIniCount: 12,
    belumSetorCount: 3,
    className: "VII Abu Bakar",
    classProgress: [
      {
        badge: "VII",
        badgeBg: "bg-brand-cyan/10",
        badgeText: "text-brand-cyan-dark",
        name: "VII Abu Bakar",
        percentage: 80,
        progressColor: "bg-brand-cyan",
        targetLabel: "12/15 Siswa Aktif",
      },
    ],
    attentionStudents: [
      {
        name: "Siswa Z",
        className: "VII Abu Bakar",
        grade: "Belum Setor",
      },
    ],
  };

  const mockParentDash: ParentDashboardSummary = {
    parentName: "Ummu Fulan",
    childName: "Fulan",
    childClassName: "VII Abu Bakar",
    childLevel: 2,
    childStreak: 4,
    progres: {
      ziyadahCount: 5,
      murojaahCount: 10,
      tahsinCount: 6,
      yaumiyahDays: 12,
    },
    isYaumiyahTodayFilled: true,
  };

  const mockKoorDash: KoordinatorDashboardSummary = {
    totalStudents: 1200,
    totalTeachers: 20,
    totalClasses: 10,
    setoranMingguIniCount: 150,
    chartData: [],
  };

  const repo: IDashboardRepository = {
    getStudentDashboard: async () => mockStudentDash,
    getTeacherDashboard: async () => mockTeacherDash,
    getParentDashboard: async () => mockParentDash,
    getKoordinatorDashboard: async () => mockKoorDash,
  };

  it("routes correctly for student role", async () => {
    const useCase = new GetDashboardSummaryUseCase(repo);
    const result = await useCase.execute({
      userId: "u-1",
      role: "student",
      schoolId: "s-1",
    });
    expect((result as StudentDashboardSummary).studentName).toBe("Ahmad");
    expect((result as StudentDashboardSummary).level).toBe(2);
  });

  it("routes correctly for teacher role", async () => {
    const useCase = new GetDashboardSummaryUseCase(repo);
    const result = await useCase.execute({
      userId: "u-2",
      role: "teacher",
      schoolId: "s-1",
    });
    const teacherSummary = result as TeacherDashboardSummary;
    expect(teacherSummary.teacherName).toBe("Ustadz Arai");
    expect(teacherSummary.totalStudents).toBe(15);
    expect(teacherSummary.totalClassesToday).toBe(2);
    expect(teacherSummary.completedClassesToday).toBe(1);
    expect(teacherSummary.classProgress).toHaveLength(1);
    expect(teacherSummary.attentionStudents).toHaveLength(1);
  });

  it("routes correctly for parent role", async () => {
    const useCase = new GetDashboardSummaryUseCase(repo);
    const result = await useCase.execute({
      userId: "u-3",
      role: "parent",
      schoolId: "s-1",
    });
    expect((result as ParentDashboardSummary).childName).toBe("Fulan");
    expect((result as ParentDashboardSummary).isYaumiyahTodayFilled).toBe(true);
  });

  it("routes correctly for koordinator role", async () => {
    const useCase = new GetDashboardSummaryUseCase(repo);
    const result = await useCase.execute({
      userId: "u-4",
      role: "koordinator_ttq",
      schoolId: "s-1",
    });
    expect((result as KoordinatorDashboardSummary).totalStudents).toBe(1200);
  });
});
