import { describe, expect, it } from "vitest";
import {
  calculateStudentAchievements,
  type MunaqosahAchievementRecord,
  type SetoranEntryForAchievement,
} from "@muhsin/shared";
import { GetStudentAchievementsUseCase } from "../modules/gamification/application/use-cases/GetStudentAchievementsUseCase";
import type { IAchievementRepository } from "../modules/gamification/domain/repositories/IAchievementRepository";

describe("calculateStudentAchievements (Badge Engine)", () => {
  it("menghitung badge surah selesai saat semua ayat tuntas disetor", () => {
    // An-Nas (114) punya 6 ayat
    const setoran: SetoranEntryForAchievement[] = [
      {
        subcatCode: "ZIYADAH",
        referenceStart: { surah: "An-Nas", surahNumber: 114, ayat: 1 },
        referenceEnd: { surah: "An-Nas", surahNumber: 114, ayat: 6 },
        date: "2026-10-10",
      },
    ];

    const result = calculateStudentAchievements(setoran);
    const badgeAnNas = result.badges.find((b) => b.id === "surah-114");

    expect(badgeAnNas).toBeDefined();
    expect(badgeAnNas?.status).toBe("unlocked");
    expect(badgeAnNas?.progressPercent).toBe(100);
    expect(badgeAnNas?.currentValue).toBe(6);
    expect(badgeAnNas?.unlockedAt).toBe("2026-10-10");
  });

  it("menghitung badge surah 'in_progress' jika ayat baru sebagian", () => {
    // Al-Falaq (113) punya 5 ayat, baru setor 1-3
    const setoran: SetoranEntryForAchievement[] = [
      {
        subcatCode: "ZIYADAH",
        referenceStart: { surah: "Al-Falaq", surahNumber: 113, ayat: 1 },
        referenceEnd: { surah: "Al-Falaq", surahNumber: 113, ayat: 3 },
        date: "2026-10-11",
      },
    ];

    const result = calculateStudentAchievements(setoran);
    const badgeAlFalaq = result.badges.find((b) => b.id === "surah-113");

    expect(badgeAlFalaq?.status).toBe("in_progress");
    expect(badgeAlFalaq?.currentValue).toBe(3);
    expect(badgeAlFalaq?.targetValue).toBe(5);
    expect(badgeAlFalaq?.progressPercent).toBe(60);
  });

  it("mengakumulasi setoran terpisah pada surah yang sama tanpa duplikasi", () => {
    // Setor Al-Falaq ayat 1-3, lalu setor ayat 3-5 (ayat 3 overlap)
    const setoran: SetoranEntryForAchievement[] = [
      {
        subcatCode: "ZIYADAH",
        referenceStart: { surah: "Al-Falaq", surahNumber: 113, ayat: 1 },
        referenceEnd: { surah: "Al-Falaq", surahNumber: 113, ayat: 3 },
        date: "2026-10-11",
      },
      {
        subcatCode: "ZIYADAH",
        referenceStart: { surah: "Al-Falaq", surahNumber: 113, ayat: 3 },
        referenceEnd: { surah: "Al-Falaq", surahNumber: 113, ayat: 5 },
        date: "2026-10-12",
      },
    ];

    const result = calculateStudentAchievements(setoran);
    const badgeAlFalaq = result.badges.find((b) => b.id === "surah-113");

    expect(badgeAlFalaq?.status).toBe("unlocked");
    expect(badgeAlFalaq?.currentValue).toBe(5);
    expect(badgeAlFalaq?.unlockedAt).toBe("2026-10-12");
  });

  it("mendukung setoran lintas surah dengan urutan mundur (An-Nazi'at ke An-Naba')", () => {
    // An-Nazi'at (79) 46 ayat full, lanjut An-Naba' (78) ayat 1-5
    const setoran: SetoranEntryForAchievement[] = [
      {
        subcatCode: "ZIYADAH",
        referenceStart: { surah: "An-Nazi'at", surahNumber: 79, ayat: 1 },
        referenceEnd: { surah: "An-Naba'", surahNumber: 78, ayat: 5 },
        date: "2026-10-15",
      },
    ];

    const result = calculateStudentAchievements(setoran);
    const badgeNaziat = result.badges.find((b) => b.id === "surah-79");
    const badgeNaba = result.badges.find((b) => b.id === "surah-78");

    expect(badgeNaziat?.status).toBe("unlocked");
    expect(badgeNaziat?.currentValue).toBe(46);

    expect(badgeNaba?.status).toBe("in_progress");
    expect(badgeNaba?.currentValue).toBe(5);
  });

  it("membuka badge Juz jika munaqosah juz lulus", () => {
    const setoran: SetoranEntryForAchievement[] = [];
    const munaqosah: MunaqosahAchievementRecord[] = [
      { juzKe: 30, earnedAt: "2026-10-01" },
    ];

    const result = calculateStudentAchievements(setoran, munaqosah);
    const badgeJuz30 = result.badges.find((b) => b.id === "juz-30");

    expect(badgeJuz30?.status).toBe("unlocked");
    expect(badgeJuz30?.unlockedAt).toBe("2026-10-01");
  });

  it("menghitung badge Sabiq tuntas saat halaman mencapai 40 atau jilid naik", () => {
    const setoran: SetoranEntryForAchievement[] = [
      {
        subcatCode: "SABIQ",
        referenceStart: { jilid: 1, halaman: 1 },
        referenceEnd: { jilid: 1, halaman: 40 },
        date: "2026-09-20",
      },
      {
        subcatCode: "SABIQ",
        referenceStart: { jilid: 2, halaman: 1 },
        referenceEnd: { jilid: 2, halaman: 15 },
        date: "2026-10-05",
      },
    ];

    const result = calculateStudentAchievements(setoran);
    const badgeJilid1 = result.badges.find((b) => b.id === "sabiq-1");
    const badgeJilid2 = result.badges.find((b) => b.id === "sabiq-2");

    expect(badgeJilid1?.status).toBe("unlocked");
    expect(badgeJilid2?.status).toBe("in_progress");
    expect(badgeJilid2?.currentValue).toBe(15);
  });
});

describe("GetStudentAchievementsUseCase", () => {
  it("memanggil repository dengan tenant scoping yang benar", async () => {
    const mockRepo: IAchievementRepository = {
      getStudentSetoranHistory: async (studentId, schoolId) => {
        expect(studentId).toBe("std-123");
        expect(schoolId).toBe("sch-456");
        return [
          {
            subcatCode: "ZIYADAH",
            referenceStart: { surah: "Al-Fatihah", surahNumber: 1, ayat: 1 },
            referenceEnd: { surah: "Al-Fatihah", surahNumber: 1, ayat: 7 },
            date: "2026-10-01",
          },
        ];
      },
      getStudentMunaqosahAchievements: async (studentId, schoolId) => {
        expect(studentId).toBe("std-123");
        expect(schoolId).toBe("sch-456");
        return [];
      },
    };

    const uc = new GetStudentAchievementsUseCase(mockRepo);
    const result = await uc.execute("std-123", "sch-456");

    expect(result.totalUnlocked).toBeGreaterThanOrEqual(1);
    const fatihah = result.badges.find((b) => b.id === "surah-1");
    expect(fatihah?.status).toBe("unlocked");
  });

  it("melempar error jika studentId atau schoolId kosong", async () => {
    const mockRepo: IAchievementRepository = {
      getStudentSetoranHistory: async () => [],
      getStudentMunaqosahAchievements: async () => [],
    };
    const uc = new GetStudentAchievementsUseCase(mockRepo);

    await expect(uc.execute("", "sch-1")).rejects.toThrow("Student ID wajib diisi");
    await expect(uc.execute("std-1", "")).rejects.toThrow("School ID wajib diisi");
  });
});
