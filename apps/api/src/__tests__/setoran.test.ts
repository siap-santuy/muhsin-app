import { describe, it, expect, vi } from "vitest";
import { CreateSetoranUseCase } from "../modules/setoran/application/use-cases/CreateSetoranUseCase";
import type { ISetoranRepository } from "../modules/setoran/domain/repositories/ISetoranRepository";

describe("CreateSetoranUseCase", () => {
  it("validates dynamic score fields and adds EXP", async () => {
    const mockRepo: ISetoranRepository = {
      create: vi.fn().mockImplementation(async (e) => e),
      findByStudentAndMonth: vi.fn().mockResolvedValue([]),
      findByClassAndDate: vi.fn().mockResolvedValue([]),
    };

    const mockAddExp = {
      execute: vi.fn().mockResolvedValue({ newTotalExp: 20, newLevel: 1 }),
    } as any;

    const useCase = new CreateSetoranUseCase(mockRepo, mockAddExp);

    const result = await useCase.execute({
      schoolId: "school-1",
      subcategoryId: "subcat-ziyadah",
      studentId: "student-1",
      teacherId: "teacher-1",
      date: "2026-08-29",
      scores: { tajwid: 90, kelancaran: 85 },
      scoreFieldKeys: ["tajwid", "kelancaran"],
    });

    expect(result.scores).toEqual({ tajwid: 90, kelancaran: 85 });
    expect(mockAddExp.execute).toHaveBeenCalledTimes(1);
  });

  it("throws error when invalid score key is provided", async () => {
    const mockRepo: ISetoranRepository = {
      create: vi.fn(),
      findByStudentAndMonth: vi.fn(),
      findByClassAndDate: vi.fn(),
    };
    const mockAddExp = { execute: vi.fn() } as any;
    const useCase = new CreateSetoranUseCase(mockRepo, mockAddExp);

    await expect(
      useCase.execute({
        schoolId: "school-1",
        subcategoryId: "subcat-ziyadah",
        studentId: "student-1",
        teacherId: "teacher-1",
        date: "2026-08-29",
        scores: { unknown_key: 90 },
        scoreFieldKeys: ["tajwid", "kelancaran"],
      })
    ).rejects.toThrow(/Field nilai 'unknown_key' tidak valid/);
  });
});
