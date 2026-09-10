import { describe, it, expect, vi } from "vitest";
import { CreateSetoranUseCase } from "../modules/setoran/application/use-cases/CreateSetoranUseCase";
import { CorrectSetoranUseCase } from "../modules/setoran/application/use-cases/CorrectSetoranUseCase";
import { ExpCalculator } from "../modules/gamification/domain/services/ExpCalculator";
import { AddExpUseCase } from "../modules/gamification/application/use-cases/AddExpUseCase";
import { ManageSubstitutionUseCase } from "../modules/teachers/application/use-cases/ManageSubstitutionUseCase";
import type { ISetoranRepository } from "../modules/setoran/domain/repositories/ISetoranRepository";
import type { IGamificationRepository } from "../modules/gamification/domain/repositories/IGamificationRepository";
import type { IExpTransactionRepository } from "../modules/gamification/domain/repositories/IExpTransactionRepository";
import type { ITeacherSubstitutionRepository } from "../modules/teachers/domain/repositories/ITeacherSubstitutionRepository";

describe("Setoran & Gamification Business Rules", () => {
  const createMockSetoranRepo = (initialData: any = null): ISetoranRepository => ({
    create: vi.fn().mockImplementation(async (e) => e),
    update: vi.fn().mockImplementation(async (e) => e),
    findById: vi.fn().mockResolvedValue(initialData),
    findByStudent: vi.fn().mockResolvedValue([]),
    findByStudentAndMonth: vi.fn().mockResolvedValue([]),
    findByClassAndDate: vi.fn().mockResolvedValue([]),
    getActiveSubcategories: vi.fn().mockResolvedValue([]),
  });

  describe("ExpCalculator & AddExpUseCase (Dynamic Level Dropping)", () => {
    it("calculates level 1 for 0 EXP and level 2 for 100 EXP", () => {
      expect(ExpCalculator.calculateLevel(0)).toBe(1);
      expect(ExpCalculator.calculateLevel(99)).toBe(1);
      expect(ExpCalculator.calculateLevel(100)).toBe(2);
      expect(ExpCalculator.calculateLevel(299)).toBe(2);
      expect(ExpCalculator.calculateLevel(300)).toBe(3);
    });

    it("allows level to drop if negative EXP pulls total below threshold", async () => {
      let storedGamification: any = {
        studentId: "student-1",
        schoolId: "school-1",
        level: 2,
        totalExp: 105,
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: "2026-09-09",
      };

      const mockGamificationRepo: IGamificationRepository = {
        findByStudentId: vi.fn().mockImplementation(async () => storedGamification),
        upsert: vi.fn().mockImplementation(async (data) => {
          storedGamification = { ...data };
        }),
      };

      const mockTxRepo: IExpTransactionRepository = {
        create: vi.fn().mockResolvedValue(undefined),
      };

      const addExpUseCase = new AddExpUseCase(mockGamificationRepo, mockTxRepo);

      // Total 105 (Level 2). Reverse -20 EXP -> 85 (Level should drop to 1)
      const result = await addExpUseCase.execute({
        schoolId: "school-1",
        studentId: "student-1",
        sourceType: "setoran",
        sourceId: "setoran-1",
        expAmount: -20,
        description: "Reversal koreksi setoran",
      });

      expect(result.newTotalExp).toBe(85);
      expect(result.newLevel).toBe(1);
      expect(storedGamification.level).toBe(1);
      expect(storedGamification.totalExp).toBe(85);
    });
  });

  describe("CreateSetoranUseCase (EXP awarded only for Hadir)", () => {
    it("awards +20 EXP when status is Hadir and scores > 0", async () => {
      const mockRepo = createMockSetoranRepo();
      const mockAddExp = { execute: vi.fn().mockResolvedValue({ newTotalExp: 20, newLevel: 1 }) } as any;
      const useCase = new CreateSetoranUseCase(mockRepo, mockAddExp);

      await useCase.execute({
        schoolId: "school-1",
        subcategoryId: "subcat-ziyadah",
        studentId: "student-1",
        teacherId: "teacher-1",
        date: "2026-09-10",
        scores: { tajwid: 90, kelancaran: 85 },
        keterangan: "[Hadir] Lancar",
        scoreFieldKeys: ["tajwid", "kelancaran"],
      });

      expect(mockAddExp.execute).toHaveBeenCalledTimes(1);
      expect(mockAddExp.execute).toHaveBeenCalledWith(
        expect.objectContaining({ expAmount: 20 })
      );
    });

    it("does NOT award EXP when status is Sakit/Izin/Alpa", async () => {
      const mockRepo = createMockSetoranRepo();
      const mockAddExp = { execute: vi.fn() } as any;
      const useCase = new CreateSetoranUseCase(mockRepo, mockAddExp);

      await useCase.execute({
        schoolId: "school-1",
        subcategoryId: "subcat-ziyadah",
        studentId: "student-1",
        teacherId: "teacher-1",
        date: "2026-09-10",
        scores: { tajwid: 0, kelancaran: 0 },
        keterangan: "[Sakit] Demam",
        scoreFieldKeys: ["tajwid", "kelancaran"],
      });

      expect(mockAddExp.execute).not.toHaveBeenCalled();
    });
  });

  describe("CorrectSetoranUseCase (Ubah Kategori & EXP Reversal)", () => {
    it("allows category change without duplicate EXP when status remains Hadir", async () => {
      const existing = {
        id: "setoran-1",
        schoolId: "school-1",
        subcategoryId: "subcat-ziyadah",
        studentId: "student-1",
        teacherId: "teacher-1",
        date: "2026-09-10",
        scores: { tajwid: 90, kelancaran: 85 },
        keterangan: "[Hadir] Bagus",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRepo = createMockSetoranRepo(existing);
      const mockAddExp = { execute: vi.fn() } as any;
      const useCase = new CorrectSetoranUseCase(mockRepo, mockAddExp);

      // Koreksi dari subcat-ziyadah ke subcat-murojaah
      const result = await useCase.execute({
        setoranId: "setoran-1",
        schoolId: "school-1",
        userId: "teacher-1",
        userRole: "teacher",
        targetSubcategoryId: "subcat-murojaah",
        scores: { tajwid: 90, kelancaran: 85 },
        keterangan: "[Hadir] Pindah ke murojaah",
        scoreFieldKeys: ["tajwid", "kelancaran"],
      });

      expect(result.subcategoryId).toBe("subcat-murojaah");
      // Tidak ada trigger penambahan EXP baru (EXP tetap 20, tidak double)
      expect(mockAddExp.execute).not.toHaveBeenCalled();
      expect(mockRepo.update).toHaveBeenCalledTimes(1);
    });

    it("reverses -20 EXP when status changed from Hadir to Sakit/Izin", async () => {
      const existing = {
        id: "setoran-1",
        schoolId: "school-1",
        subcategoryId: "subcat-ziyadah",
        studentId: "student-1",
        teacherId: "teacher-1",
        date: "2026-09-10",
        scores: { tajwid: 90, kelancaran: 85 },
        keterangan: "[Hadir] Sebelumnya hadir",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRepo = createMockSetoranRepo(existing);
      const mockAddExp = { execute: vi.fn() } as any;
      const useCase = new CorrectSetoranUseCase(mockRepo, mockAddExp);

      await useCase.execute({
        setoranId: "setoran-1",
        schoolId: "school-1",
        userId: "teacher-1",
        userRole: "teacher",
        targetSubcategoryId: "subcat-ziyadah",
        scores: { tajwid: 0, kelancaran: 0 },
        keterangan: "[Sakit] Salah input, anak sakit",
        scoreFieldKeys: ["tajwid", "kelancaran"],
      });

      expect(mockAddExp.execute).toHaveBeenCalledTimes(1);
      expect(mockAddExp.execute).toHaveBeenCalledWith(
        expect.objectContaining({ expAmount: -20 })
      );
    });

    it("rejects correction if non-owner teacher attempts it", async () => {
      const existing = {
        id: "setoran-1",
        schoolId: "school-1",
        subcategoryId: "subcat-ziyadah",
        studentId: "student-1",
        teacherId: "teacher-original",
        date: "2026-09-10",
        scores: { tajwid: 90, kelancaran: 85 },
        keterangan: "[Hadir]",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRepo = createMockSetoranRepo(existing);
      const mockAddExp = { execute: vi.fn() } as any;
      const useCase = new CorrectSetoranUseCase(mockRepo, mockAddExp);

      await expect(
        useCase.execute({
          setoranId: "setoran-1",
          schoolId: "school-1",
          userId: "teacher-other",
          userRole: "teacher",
          targetSubcategoryId: "subcat-ziyadah",
          scores: { tajwid: 80, kelancaran: 80 },
          scoreFieldKeys: ["tajwid", "kelancaran"],
        })
      ).rejects.toThrow(/Akses ditolak/);
    });

    it("allows koordinator_ttq to correct even if not the teacher", async () => {
      const existing = {
        id: "setoran-1",
        schoolId: "school-1",
        subcategoryId: "subcat-ziyadah",
        studentId: "student-1",
        teacherId: "teacher-1",
        date: "2026-09-10",
        scores: { tajwid: 90, kelancaran: 85 },
        keterangan: "[Hadir]",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRepo = createMockSetoranRepo(existing);
      const mockAddExp = { execute: vi.fn() } as any;
      const useCase = new CorrectSetoranUseCase(mockRepo, mockAddExp);

      const res = await useCase.execute({
        setoranId: "setoran-1",
        schoolId: "school-1",
        userId: "koor-1",
        userRole: "koordinator_ttq",
        targetSubcategoryId: "subcat-murojaah",
        scores: { tajwid: 90, kelancaran: 85 },
        scoreFieldKeys: ["tajwid", "kelancaran"],
      });

      expect(res.subcategoryId).toBe("subcat-murojaah");
    });
  });

  describe("ManageSubstitutionUseCase (Guru Pengganti)", () => {
    it("creates teacher substitution for a valid date range", async () => {
      const mockSubRepo: ITeacherSubstitutionRepository = {
        create: vi.fn().mockImplementation(async (e) => e),
        findActiveSubstitutionsByTeacher: vi.fn().mockResolvedValue([]),
        findBySchool: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue(undefined),
      };

      const useCase = new ManageSubstitutionUseCase(mockSubRepo);

      const result = await useCase.create({
        schoolId: "school-1",
        absentTeacherId: "teacher-sakit",
        substituteTeacherId: "teacher-pengganti",
        classId: "class-7a",
        dateStart: "2026-09-10",
        dateEnd: "2026-09-12",
        reason: "Izin sakit 3 hari",
      });

      expect(result.substituteTeacherId).toBe("teacher-pengganti");
      expect(result.classId).toBe("class-7a");
      expect(mockSubRepo.create).toHaveBeenCalledTimes(1);
    });

    it("rejects substitution when dateEnd is earlier than dateStart", async () => {
      const mockSubRepo: ITeacherSubstitutionRepository = {
        create: vi.fn(),
        findActiveSubstitutionsByTeacher: vi.fn().mockResolvedValue([]),
        findBySchool: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue(undefined),
      };

      const useCase = new ManageSubstitutionUseCase(mockSubRepo);

      await expect(
        useCase.create({
          schoolId: "school-1",
          absentTeacherId: "teacher-sakit",
          substituteTeacherId: "teacher-pengganti",
          classId: "class-7a",
          dateStart: "2026-09-15",
          dateEnd: "2026-09-10",
        })
      ).rejects.toThrow(/Tanggal selesai tidak boleh lebih awal/);
    });
  });
});
