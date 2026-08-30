import { describe, it, expect, vi } from "vitest";
import { CreateMunaqosahRequestUseCase } from "../modules/munaqosah/application/use-cases/CreateMunaqosahRequestUseCase";
import { SubmitMunaqosahResultUseCase } from "../modules/munaqosah/application/use-cases/SubmitMunaqosahResultUseCase";
import type { IMunaqosahRepository } from "../modules/munaqosah/domain/repositories/IMunaqosahRepository";

describe("Munaqosah Module UseCases", () => {
  it("creates munaqosah request for valid juz", async () => {
    const mockRepo: IMunaqosahRepository = {
      findRequests: vi.fn(),
      createRequest: vi.fn().mockResolvedValue("req-1"),
      updateRequestStatus: vi.fn(),
      createAssignment: vi.fn(),
      submitResult: vi.fn(),
      grantAchievement: vi.fn(),
    };

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
    });
  });

  it("throws error for invalid juz (<1 or >30)", async () => {
    const mockRepo: IMunaqosahRepository = {
      findRequests: vi.fn(),
      createRequest: vi.fn(),
      updateRequestStatus: vi.fn(),
      createAssignment: vi.fn(),
      submitResult: vi.fn(),
      grantAchievement: vi.fn(),
    };

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

  it("SubmitMunaqosahResultUseCase grants achievement & EXP when passed", async () => {
    const mockRepo: IMunaqosahRepository = {
      findRequests: vi.fn(),
      createRequest: vi.fn(),
      updateRequestStatus: vi.fn(),
      createAssignment: vi.fn(),
      submitResult: vi.fn().mockResolvedValue({
        studentId: "student-1",
        juzKe: 30,
        schoolId: "school-1",
      }),
      grantAchievement: vi.fn().mockResolvedValue(undefined),
    };

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
