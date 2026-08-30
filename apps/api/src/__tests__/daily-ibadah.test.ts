import { describe, it, expect, vi } from "vitest";
import { IbadahValidator } from "../modules/daily-ibadah/domain/services/IbadahValidator";
import { SubmitDailyIbadahUseCase } from "../modules/daily-ibadah/application/use-cases/SubmitDailyIbadahUseCase";
import type { IDailyIbadahRepository } from "../modules/daily-ibadah/domain/repositories/IDailyIbadahRepository";

describe("IbadahValidator", () => {
  it("calculates EXP for full day ibadah according to PRD", () => {
    // 5 sholat BA (5*5=25), 2 rawatib (2*2=4), tahajud (10), dhuha (5), puasa (15), tilawah (10) = 69 EXP
    const exp = IbadahValidator.calculateDayExp({
      sholatFardhu: {
        subuh: "BA",
        dzuhur: "BA",
        ashar: "BA",
        maghrib: "BA",
        isya: "BA",
      },
      sholatRawatib: ["qobliyah_dzuhur", "badiyah_maghrib"],
      tahajud: true,
      dhuha: true,
      puasaSunnah: "senin",
      tilawah: { surahStart: 1, ayatStart: 1, surahEnd: 1, ayatEnd: 7 },
    });

    expect(exp).toBe(69);
  });

  it("checks completeness for streak (all 5 fardhu required)", () => {
    expect(
      IbadahValidator.isCompleteForStreak({
        subuh: "BA",
        dzuhur: "BA",
        ashar: "MA",
        maghrib: "BT",
        isya: "MT",
      })
    ).toBe(true);

    expect(
      IbadahValidator.isCompleteForStreak({
        subuh: "BA",
        dzuhur: "BA",
        ashar: "MA",
        maghrib: "BT",
        isya: undefined as any,
      })
    ).toBe(false);
  });
});

describe("SubmitDailyIbadahUseCase", () => {
  it("submits ibadah and triggers EXP and streak without DB", async () => {
    const mockRepo: IDailyIbadahRepository = {
      findByStudentAndDate: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockImplementation(async (e) => e),
      findByMonth: vi.fn().mockResolvedValue([]),
    };

    const mockAddExpUseCase = {
      execute: vi.fn().mockResolvedValue({ newTotalExp: 25, newLevel: 1 }),
    } as any;

    const mockUpdateStreakUseCase = {
      execute: vi.fn().mockResolvedValue({ currentStreak: 1, longestStreak: 1 }),
    } as any;

    const useCase = new SubmitDailyIbadahUseCase(
      mockRepo,
      mockAddExpUseCase,
      mockUpdateStreakUseCase
    );

    const result = await useCase.execute({
      schoolId: "school-1",
      studentId: "student-1",
      date: "2026-08-29",
      sholatFardhu: {
        subuh: "BA",
        dzuhur: "BA",
        ashar: "BA",
        maghrib: "BA",
        isya: "BA",
      },
    });

    expect(result.entity.status).toBe("submitted");
    expect(result.expEarned).toBe(25);
    expect(result.currentStreak).toBe(1);
    expect(mockAddExpUseCase.execute).toHaveBeenCalledTimes(1);
    expect(mockUpdateStreakUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
