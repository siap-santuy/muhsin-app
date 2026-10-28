import { describe, it, expect } from "vitest";
import { GetMonthlyRaportUseCase } from "../modules/reports/application/use-cases/GetMonthlyRaportUseCase";
import { GetSemesterRaportUseCase } from "../modules/reports/application/use-cases/GetSemesterRaportUseCase";
import { GetRaportSummaryUseCase } from "../modules/reports/application/use-cases/GetRaportSummaryUseCase";
import type { IRaportRepository } from "../modules/reports/domain/repositories/IRaportRepository";
import type {
  MonthlyRaportData,
  SemesterRaportData,
  RaportSummaryItem,
} from "../modules/reports/domain/entities/Raport";

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
    sumatif: {
      testTahfidz: {
        grade: "B",
        score: "86/100",
        arabicPredicate: "جيد جدا",
        capaian: "Al-Baqarah: 1-5",
        tajwid: "85.0",
        kelancaran: "87.0",
      },
      testTilawah: {
        grade: "A",
        score: "92/100",
        arabicPredicate: "ممتاز",
        capaian: "Sabiq Jilid 3 Hal 1-5",
        tajwid: "90.0",
        kelancaran: "95.0",
      },
      testTertulis: {
        grade: "B",
        score: "89/100",
        arabicPredicate: "جيد جدا",
        materi: "-",
      },
    },
    mutabaah: mockMonthly.mutabaah,
    evaluasi: mockMonthly.evaluasi,
  };

  const mockSummary: RaportSummaryItem[] = [
    {
      rank: 1,
      studentId: "student-1",
      studentName: "Fulan bin Fulan",
      className: "VII Abu Bakar",
      tahfidzScore: 92,
      tahfidzGrade: "A",
      tahsinScore: 90,
      tahsinGrade: "A",
      yaumiyahGrade: "A",
      kehadiranCount: 15,
      kehadiranRatio: "15/16",
      nilaiAkhir: 91,
      gradeAkhir: "A",
      arabicPredicate: "ممتاز",
      isUnderTarget: false,
    },
    {
      rank: 2,
      studentId: "student-2",
      studentName: "Zaid",
      className: "VII Abu Bakar",
      tahfidzScore: 68,
      tahfidzGrade: "D",
      tahsinScore: 70,
      tahsinGrade: "C",
      yaumiyahGrade: "C",
      kehadiranCount: 10,
      kehadiranRatio: "10/16",
      nilaiAkhir: 69,
      gradeAkhir: "D",
      arabicPredicate: "مقبول",
      isUnderTarget: true,
    },
  ];

  const repo: IRaportRepository = {
    getMonthlyRaport: async () => mockMonthly,
    getSemesterRaport: async () => mockSemester,
    getRaportSummary: async () => mockSummary,
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

  it("GetRaportSummaryUseCase returns ranked summary list", async () => {
    const useCase = new GetRaportSummaryUseCase(repo);
    const result = await useCase.execute({
      schoolId: "school-1",
      mode: "monthly",
      month: "2026-10",
      className: "VII Abu Bakar",
    });

    expect(result).toHaveLength(2);
    expect(result[0].rank).toBe(1);
    expect(result[0].studentName).toBe("Fulan bin Fulan");
    expect(result[0].isUnderTarget).toBe(false);
    expect(result[1].rank).toBe(2);
    expect(result[1].isUnderTarget).toBe(true);
  });
});
