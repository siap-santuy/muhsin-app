import { describe, it, expect } from "vitest";
import { GetMonthlyRaportUseCase } from "../modules/reports/application/use-cases/GetMonthlyRaportUseCase";
import { GetSemesterRaportUseCase } from "../modules/reports/application/use-cases/GetSemesterRaportUseCase";
import type { IRaportRepository } from "../modules/reports/domain/repositories/IRaportRepository";
import type { MonthlyRaportData, SemesterRaportData } from "../modules/reports/domain/entities/Raport";

describe("Raport Module UseCases", () => {
  const mockMonthly: MonthlyRaportData = {
    student: {
      id: "student-1",
      name: "Fulan bin Fulan",
      email: "fulan@demo.sch.id",
      className: "VII Abu Bakar",
      pembimbingName: "Ustadz Arai",
    },
    period: {
      month: "2026-07",
      year: "2026",
    },
    nilaiTtq: {
      tahfidz: {
        grade: "B",
        score: "86/100",
        arabicPredicate: "جيد جدا",
        capaian: "Al-Baqarah: 1-5",
      },
      tahsin: {
        grade: "A",
        score: "92/100",
        arabicPredicate: "ممتاز",
        capaian: "Sabiq Jilid 3 Hal 1-5",
      },
    },
    detailTtq: {
      ziyadah: 85.0,
      murojaah: 87.0,
      makhroj: 90.0,
      mad: 92.0,
      ghunnah: 93.0,
      kelancaran: 95.0,
    },
    absensi: {
      kehadiranRatio: "25/30",
      tidakSetoranCount: 5,
      sakitCount: 0,
      izinCount: 0,
      alpaCount: 0,
    },
    mutabaah: [
      { label: "Tilawah", ratio: "25/30", grade: "A", color: "text-emerald-500" },
      { label: "Shalat Fardhu", ratio: "140/150", grade: "A", color: "text-brand-cyan" },
    ],
    evaluasi: "Bagus, pertahankan prestasimu.",
  };

  const mockSemester: SemesterRaportData = {
    student: mockMonthly.student,
    period: {
      semester: "Ganjil",
      tahunAjaran: "2026/2027",
    },
    nilaiAkhir: 89.0,
    gradeAkhir: "B",
    arabicPredicate: "جيد جدا",
    nilaiTtq: mockMonthly.nilaiTtq,
    detailTtq: mockMonthly.detailTtq,
    absensi: mockMonthly.absensi,
    kategoriList: [
      { name: "Tahfidz", grade: "B", score: 86, arabicPredicate: "جيد جدا" },
      { name: "Tahsin", grade: "A", score: 92, arabicPredicate: "ممتاز" },
    ],
    mutabaah: mockMonthly.mutabaah,
    evaluasi: mockMonthly.evaluasi,
  };

  const repo: IRaportRepository = {
    getMonthlyRaport: async () => mockMonthly,
    getSemesterRaport: async () => mockSemester,
  };

  it("GetMonthlyRaportUseCase returns correct monthly report shape", async () => {
    const useCase = new GetMonthlyRaportUseCase(repo);
    const result = await useCase.execute("student-1", "2026-07", "school-1");

    expect(result.student.name).toBe("Fulan bin Fulan");
    expect(result.nilaiTtq.tahsin.grade).toBe("A");
    expect(result.mutabaah).toHaveLength(2);
  });

  it("GetSemesterRaportUseCase returns correct semester report shape", async () => {
    const useCase = new GetSemesterRaportUseCase(repo);
    const result = await useCase.execute("student-1", "Ganjil", "2026/2027", "school-1");

    expect(result.period.semester).toBe("Ganjil");
    expect(result.nilaiAkhir).toBe(89.0);
    expect(result.kategoriList).toHaveLength(2);
  });
});
