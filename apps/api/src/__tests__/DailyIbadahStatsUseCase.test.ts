import { describe, it, expect } from "vitest";
import { GetDailyIbadahStatsUseCase } from "../modules/daily-ibadah/application/use-cases/GetDailyIbadahStatsUseCase";
import type { IDailyIbadahRepository } from "../modules/daily-ibadah/domain/repositories/IDailyIbadahRepository";
import type { DailyIbadahEntity } from "../modules/daily-ibadah/domain/entities/DailyIbadah";

describe("GetDailyIbadahStatsUseCase", () => {
  const mockEntries: DailyIbadahEntity[] = [
    {
      id: "ibadah-1",
      schoolId: "school-1",
      studentId: "student-1",
      date: "2026-08-01",
      status: "submitted",
      submittedAt: new Date(),
      sholatFardhu: {
        subuh: "BA",
        dzuhur: "BA",
        ashar: "MA",
        maghrib: "BA",
        isya: "BA",
      },
      sholatRawatib: ["Qabliyah Subuh", "Ba'diyah Maghrib"],
      tahajud: true,
      dhuha: true,
      puasaSunnah: "senin",
      tilawah: { surahStart: 1, ayatStart: 1, surahEnd: 1, ayatEnd: 7 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "ibadah-2",
      schoolId: "school-1",
      studentId: "student-1",
      date: "2026-08-02",
      status: "draft",
      submittedAt: null,
      sholatFardhu: {
        subuh: "BT",
        dzuhur: "BA",
        ashar: "MT",
        maghrib: "BA",
        isya: "T",
      },
      sholatRawatib: [],
      tahajud: false,
      dhuha: false,
      puasaSunnah: null,
      tilawah: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const repo: IDailyIbadahRepository = {
    findByStudentAndDate: async () => null,
    save: async (e) => e,
    findByMonth: async () => mockEntries,
  };

  it("calculates correct statistics from monthly list", async () => {
    const useCase = new GetDailyIbadahStatsUseCase(repo);
    const stats = await useCase.execute({
      studentId: "student-1",
      month: "2026-08",
      schoolId: "school-1",
    });

    expect(stats.totalDaysRecorded).toBe(2);
    expect(stats.totalDaysSubmitted).toBe(1);
    // ibadah-1 has 5 BA/MA; ibadah-2 has 2 BA/MA -> total 7
    expect(stats.fardhuOnTimeCount).toBe(7);
    expect(stats.rawatibTotalCount).toBe(2);
    expect(stats.tahajudDaysCount).toBe(1);
    expect(stats.dhuhaDaysCount).toBe(1);
    expect(stats.puasaDaysCount).toBe(1);
    expect(stats.tilawahDaysCount).toBe(1);
  });
});
