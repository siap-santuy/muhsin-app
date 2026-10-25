import { describe, it, expect, vi } from "vitest";
import { CreateMunaqosahRequestUseCase } from "../modules/munaqosah/application/use-cases/CreateMunaqosahRequestUseCase";
import { GetMyMunaqosahExamsUseCase } from "../modules/munaqosah/application/use-cases/GetMyMunaqosahExamsUseCase";
import {
  ScheduleMunaqosahUseCase,
  ExaminerNotInPoolError,
  ExaminerCapacityFullError,
} from "../modules/munaqosah/application/use-cases/ScheduleMunaqosahUseCase";
import { ManageMunaqosahExaminersUseCase } from "../modules/munaqosah/application/use-cases/ManageMunaqosahExaminersUseCase";
import {
  SubmitMunaqosahResultUseCase,
  AssignmentForbiddenError,
} from "../modules/munaqosah/application/use-cases/SubmitMunaqosahResultUseCase";
import type { IMunaqosahRepository } from "../modules/munaqosah/domain/repositories/IMunaqosahRepository";

function baseMockRepo(): IMunaqosahRepository {
  return {
    findRequests: vi.fn(),
    createRequest: vi.fn(),
    findActiveRequestByStudent: vi.fn().mockResolvedValue(null),
    findPassedJuzByStudent: vi.fn().mockResolvedValue([]),
    updateRequestStatus: vi.fn(),
    createAssignment: vi.fn(),
    getRequestDetail: vi.fn(),
    findParentIdsByStudent: vi.fn(),
    findMyExams: vi.fn(),
    findStudentSchedule: vi.fn().mockResolvedValue([]),
    getAssignmentOwner: vi.fn(),
    findExaminers: vi.fn(),
    upsertExaminer: vi.fn(),
    removeExaminer: vi.fn(),
    checkExaminerCapacity: vi.fn(),
    submitResult: vi.fn(),
    grantAchievement: vi.fn(),
    findPeriods: vi.fn().mockResolvedValue([]),
    createPeriod: vi.fn().mockResolvedValue("period-1"),
    updatePeriod: vi.fn().mockResolvedValue(undefined),
  };
}

describe("Munaqosah Module UseCases", () => {
  it("creates munaqosah request for valid juz", async () => {
    const mockRepo = baseMockRepo();
    (mockRepo.createRequest as any).mockResolvedValue("req-1");

    const useCase = new CreateMunaqosahRequestUseCase(mockRepo);
    const result = await useCase.execute({
      schoolId: "school-1",
      studentId: "student-1",
      teacherId: "teacher-1",
      juzKe: 30,
    });

    expect(result).toBe("req-1");
    expect(mockRepo.createRequest).toHaveBeenCalledWith({
      schoolId: "school-1",
      studentId: "student-1",
      teacherId: "teacher-1",
      juzKe: 30,
      juzList: [30],
      periodId: undefined,
    });
  });

  it("supports multi-juz request and rejects duplicates in period", async () => {
    const mockRepo = baseMockRepo();
    (mockRepo.createRequest as any).mockResolvedValue("req-multi");

    const useCase = new CreateMunaqosahRequestUseCase(mockRepo);
    const result = await useCase.execute({
      schoolId: "school-1",
      studentId: "student-1",
      teacherId: "teacher-1",
      juzList: [29, 30],
      periodId: "period-1",
    });

    expect(result).toBe("req-multi");
    expect(mockRepo.createRequest).toHaveBeenCalledWith({
      schoolId: "school-1",
      studentId: "student-1",
      teacherId: "teacher-1",
      juzKe: 29,
      juzList: [29, 30],
      periodId: "period-1",
    });

    // Tolak jika sudah ada active request
    (mockRepo.findActiveRequestByStudent as any).mockResolvedValue({
      id: "req-existing",
      status: "dijadwalkan",
    });

    await expect(
      useCase.execute({
        schoolId: "school-1",
        studentId: "student-1",
        teacherId: "teacher-1",
        juzKe: 28,
        periodId: "period-1",
      })
    ).rejects.toThrow("Siswa hanya dapat mengikuti 1 kali ujian per periode");
  });

  it("rejects request if any juz has already passed munaqosah", async () => {
    const mockRepo = baseMockRepo();
    (mockRepo.findPassedJuzByStudent as any).mockResolvedValue([30]);

    const useCase = new CreateMunaqosahRequestUseCase(mockRepo);
    await expect(
      useCase.execute({
        schoolId: "school-1",
        studentId: "student-1",
        teacherId: "teacher-1",
        juzList: [29, 30],
      })
    ).rejects.toThrow("Siswa telah dinyatakan LULUS munaqosah untuk Juz 30");
  });

  it("throws error for invalid juz (<1 or >30)", async () => {
    const mockRepo = baseMockRepo();

    const useCase = new CreateMunaqosahRequestUseCase(mockRepo);
    await expect(
      useCase.execute({
        schoolId: "school-1",
        studentId: "student-1",
        teacherId: "teacher-1",
        juzKe: 35,
      })
    ).rejects.toThrow();
  });

  it("ScheduleMunaqosahUseCase notifies student and parents", async () => {
    const mockRepo = baseMockRepo();
    (mockRepo.checkExaminerCapacity as any).mockResolvedValue({ kapasitas: 10, terpakai: 2, penuh: false });
    (mockRepo.createAssignment as any).mockResolvedValue("assign-1");
    (mockRepo.getRequestDetail as any).mockResolvedValue({
      studentId: "student-1",
      studentName: "Ananda",
      juzKe: 5,
      schoolId: "school-1",
    });
    (mockRepo.findParentIdsByStudent as any).mockResolvedValue(["parent-1", "parent-2"]);
    const mockNotif = { createNotification: vi.fn().mockResolvedValue({}) } as any;

    const useCase = new ScheduleMunaqosahUseCase(mockRepo, mockNotif);
    const result = await useCase.execute({
      requestId: "req-1",
      periodId: "period-1",
      examinerTeacherId: "teacher-2",
      jadwalTanggal: "2026-09-20",
      jadwalWaktu: "08:00",
      assignedBy: "koor-1",
      schoolId: "school-1",
    });

    expect(result).toBe("assign-1");
    expect(mockNotif.createNotification).toHaveBeenCalledTimes(3);
    expect(mockNotif.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "student-1", type: "munaqosah" })
    );
  });

  it("ScheduleMunaqosahUseCase still succeeds when notification fails", async () => {
    const mockRepo = baseMockRepo();
    (mockRepo.checkExaminerCapacity as any).mockResolvedValue({ kapasitas: 10, terpakai: 2, penuh: false });
    (mockRepo.createAssignment as any).mockResolvedValue("assign-1");
    (mockRepo.getRequestDetail as any).mockRejectedValue(new Error("db down"));
    const mockNotif = { createNotification: vi.fn() } as any;

    const useCase = new ScheduleMunaqosahUseCase(mockRepo, mockNotif);
    const result = await useCase.execute({
      requestId: "req-1",
      periodId: "period-1",
      examinerTeacherId: "teacher-2",
      jadwalTanggal: "2026-09-20",
      assignedBy: "koor-1",
      schoolId: "school-1",
    });

    expect(result).toBe("assign-1");
    expect(mockRepo.updateRequestStatus).toHaveBeenCalledWith("req-1", "school-1", "dijadwalkan");
  });

  it("ScheduleMunaqosahUseCase rejects examiner not in pool", async () => {
    const mockRepo = baseMockRepo();
    (mockRepo.checkExaminerCapacity as any).mockResolvedValue(null);
    const mockNotif = { createNotification: vi.fn() } as any;

    const useCase = new ScheduleMunaqosahUseCase(mockRepo, mockNotif);
    await expect(
      useCase.execute({
        requestId: "req-1",
        periodId: "period-1",
        examinerTeacherId: "teacher-x",
        jadwalTanggal: "2026-09-20",
        assignedBy: "koor-1",
        schoolId: "school-1",
      })
    ).rejects.toBeInstanceOf(ExaminerNotInPoolError);
    expect(mockRepo.createAssignment).not.toHaveBeenCalled();
  });

  it("ScheduleMunaqosahUseCase rejects examiner at full capacity", async () => {
    const mockRepo = baseMockRepo();
    (mockRepo.checkExaminerCapacity as any).mockResolvedValue({ kapasitas: 5, terpakai: 5, penuh: true });
    const mockNotif = { createNotification: vi.fn() } as any;

    const useCase = new ScheduleMunaqosahUseCase(mockRepo, mockNotif);
    await expect(
      useCase.execute({
        requestId: "req-1",
        periodId: "period-1",
        examinerTeacherId: "teacher-2",
        jadwalTanggal: "2026-09-20",
        assignedBy: "koor-1",
        schoolId: "school-1",
      })
    ).rejects.toBeInstanceOf(ExaminerCapacityFullError);
    expect(mockRepo.createAssignment).not.toHaveBeenCalled();
  });

  it("ManageMunaqosahExaminersUseCase rejects zero capacity", async () => {
    const mockRepo = baseMockRepo();
    const useCase = new ManageMunaqosahExaminersUseCase(mockRepo);
    await expect(
      useCase.add({
        periodId: "period-1",
        teacherId: "teacher-2",
        kapasitasSiswa: 0,
        assignedBy: "koor-1",
        schoolId: "school-1",
      })
    ).rejects.toThrow();
    expect(mockRepo.upsertExaminer).not.toHaveBeenCalled();
  });

  it("GetMyMunaqosahExamsUseCase scopes exams by examiner and school", async () => {
    const mockRepo = baseMockRepo();
    (mockRepo.findMyExams as any).mockResolvedValue([{ id: "req-1" }]);

    const useCase = new GetMyMunaqosahExamsUseCase(mockRepo);
    const result = await useCase.execute("teacher-2", "school-1");

    expect(mockRepo.findMyExams).toHaveBeenCalledWith("teacher-2", "school-1");
    expect(result).toEqual([{ id: "req-1" }]);
  });

  it("SubmitMunaqosahResultUseCase rejects teacher who is not the assigned examiner", async () => {
    const mockRepo = baseMockRepo();
    (mockRepo.getAssignmentOwner as any).mockResolvedValue({ examinerTeacherId: "teacher-9" });
    const mockAddExp = { execute: vi.fn() } as any;

    const useCase = new SubmitMunaqosahResultUseCase(mockRepo, mockAddExp);
    await expect(
      useCase.execute({
        assignmentId: "assign-1",
        scores: { tajwid: 80, kelancaran: 85 },
        hasil: "lulus",
        actorUserId: "teacher-2",
        actorRole: "teacher",
        schoolId: "school-1",
      })
    ).rejects.toBeInstanceOf(AssignmentForbiddenError);
    expect(mockRepo.submitResult).not.toHaveBeenCalled();
  });

  it("SubmitMunaqosahResultUseCase allows the assigned examiner", async () => {
    const mockRepo = baseMockRepo();
    (mockRepo.getAssignmentOwner as any).mockResolvedValue({ examinerTeacherId: "teacher-2" });
    (mockRepo.submitResult as any).mockResolvedValue({
      studentId: "student-1",
      juzKe: 30,
      schoolId: "school-1",
    });
    const mockAddExp = { execute: vi.fn().mockResolvedValue({}) } as any;

    const useCase = new SubmitMunaqosahResultUseCase(mockRepo, mockAddExp);
    await useCase.execute({
      assignmentId: "assign-1",
      scores: { tajwid: 90, kelancaran: 95 },
      hasil: "lulus",
      actorUserId: "teacher-2",
      actorRole: "teacher",
      schoolId: "school-1",
    });

    expect(mockRepo.submitResult).toHaveBeenCalledTimes(1);
    expect(mockRepo.grantAchievement).toHaveBeenCalledTimes(1);
  });

  it("SubmitMunaqosahResultUseCase grants achievement & EXP when passed", async () => {
    const mockRepo = baseMockRepo();
    (mockRepo.submitResult as any).mockResolvedValue({
      studentId: "student-1",
      juzKe: 30,
      schoolId: "school-1",
    });

    const mockAddExp = {
      execute: vi.fn().mockResolvedValue({ newTotalExp: 100, newLevel: 2 }),
    } as any;

    const useCase = new SubmitMunaqosahResultUseCase(mockRepo, mockAddExp);
    await useCase.execute({
      assignmentId: "assign-1",
      scores: { tajwid: 90, kelancaran: 95 },
      hasil: "lulus",
      catatanPenguji: "Sangat lancar",
    });

    expect(mockRepo.grantAchievement).toHaveBeenCalledWith({
      schoolId: "school-1",
      studentId: "student-1",
      juzKe: 30,
      sourceId: "assign-1",
    });
    expect(mockAddExp.execute).toHaveBeenCalledTimes(1);
  });
});
