import { describe, it, expect, vi } from "vitest";
import { GetHafalanTargetUseCase } from "../modules/targets/application/use-cases/GetHafalanTargetUseCase";
import { SetHafalanTargetUseCase } from "../modules/targets/application/use-cases/SetHafalanTargetUseCase";
import { GetStudentPositionUseCase } from "../modules/targets/application/use-cases/GetStudentPositionUseCase";
import type { IHafalanTargetRepository } from "../modules/targets/domain/repositories/IHafalanTargetRepository";

describe("Targets Module UseCases", () => {
  const mockRepo: IHafalanTargetRepository = {
    findByStudentAndMonth: vi.fn(),
    findByClassAndMonth: vi.fn(),
    findStudentLastZiyadahPosition: vi.fn(),
    setTargets: vi.fn(),
  };

  it("GetHafalanTargetUseCase harus memanggil repo dengan argumen yang benar", async () => {
    const uc = new GetHafalanTargetUseCase(mockRepo);
    (mockRepo.findByStudentAndMonth as any).mockResolvedValue({
      id: "t-1",
      studentId: "s-1",
      bulan: "2026-10",
      targetSurahStart: "An-Naba'",
      targetAyatStart: "1",
      targetSurahEnd: "Al-Infitar",
      targetAyatEnd: "19",
    });

    const res = await uc.execute({ studentId: "s-1", bulan: "2026-10", schoolId: "sch-1" });
    expect(res?.targetSurahStart).toBe("An-Naba'");
    expect(mockRepo.findByStudentAndMonth).toHaveBeenCalledWith("s-1", "2026-10", "sch-1");
  });

  it("GetStudentPositionUseCase harus memanggil repo.findStudentLastZiyadahPosition", async () => {
    const uc = new GetStudentPositionUseCase(mockRepo);
    (mockRepo.findStudentLastZiyadahPosition as any).mockResolvedValue({
      lastSurah: "An-Naba'",
      lastSurahNumber: 78,
      lastAyat: 40,
      lastSetoranDate: "2026-09-30",
      suggestedStartSurah: "An-Nazi'at",
      suggestedStartSurahNumber: 79,
      suggestedStartAyat: 1,
    });

    const res = await uc.execute({ studentId: "s-1", schoolId: "sch-1" });
    expect(res.suggestedStartSurah).toBe("An-Nazi'at");
    expect(res.suggestedStartAyat).toBe(1);
    expect(mockRepo.findStudentLastZiyadahPosition).toHaveBeenCalledWith("s-1", "sch-1");
  });

  it("SetHafalanTargetUseCase harus memvalidasi studentIds tidak kosong", async () => {
    const uc = new SetHafalanTargetUseCase(mockRepo);
    await expect(
      uc.execute({
        schoolId: "sch-1",
        teacherId: "t-1",
        bulan: "2026-10",
        studentIds: [],
        targetSurahStart: "An-Naba'",
        targetAyatStart: "1",
        targetSurahEnd: "An-Nazi'at",
        targetAyatEnd: "46",
      })
    ).rejects.toThrow("Daftar santri wajib dipilih");
  });

  it("SetHafalanTargetUseCase harus berhasil memanggil repo.setTargets saat input valid", async () => {
    const uc = new SetHafalanTargetUseCase(mockRepo);
    (mockRepo.setTargets as any).mockResolvedValue([
      { id: "res-1", studentId: "s-1", bulan: "2026-10" },
      { id: "res-2", studentId: "s-2", bulan: "2026-10" },
    ]);

    const res = await uc.execute({
      schoolId: "sch-1",
      teacherId: "t-1",
      bulan: "2026-10",
      studentIds: ["s-1", "s-2"],
      targetSurahStart: "An-Naba'",
      targetAyatStart: "1",
      targetSurahEnd: "An-Nazi'at",
      targetAyatEnd: "46",
    });

    expect(res).toHaveLength(2);
    expect(mockRepo.setTargets).toHaveBeenCalled();
  });

  it("SetHafalanTargetUseCase harus menolak target jika surah akhir mundur", async () => {
    const uc = new SetHafalanTargetUseCase(mockRepo);
    await expect(
      uc.execute({
        schoolId: "sch-1",
        teacherId: "t-1",
        bulan: "2026-10",
        studentIds: ["s-1"],
        targetSurahStart: "An-Nazi'at",
        targetAyatStart: "1",
        targetSurahEnd: "An-Naba'",
        targetAyatEnd: "40",
      })
    ).rejects.toThrow("Surah akhir tidak boleh lebih kecil dari surah awal");
  });

  it("SetHafalanTargetUseCase harus menolak target jika ayat akhir mundur dalam surah yang sama", async () => {
    const uc = new SetHafalanTargetUseCase(mockRepo);
    await expect(
      uc.execute({
        schoolId: "sch-1",
        teacherId: "t-1",
        bulan: "2026-10",
        studentIds: ["s-1"],
        targetSurahStart: "An-Naba'",
        targetAyatStart: "20",
        targetSurahEnd: "An-Naba'",
        targetAyatEnd: "10",
      })
    ).rejects.toThrow("Ayat akhir tidak boleh lebih kecil dari ayat awal");
  });

  it("SetHafalanTargetUseCase harus menolak jika ayat melebihi total ayat", async () => {
    const uc = new SetHafalanTargetUseCase(mockRepo);
    await expect(
      uc.execute({
        schoolId: "sch-1",
        teacherId: "t-1",
        bulan: "2026-10",
        studentIds: ["s-1"],
        targetSurahStart: "Al-Fatihah",
        targetAyatStart: "1",
        targetSurahEnd: "Al-Fatihah",
        targetAyatEnd: "10",
      })
    ).rejects.toThrow("Ayat akhir harus antara 1 dan 7 untuk surah Al-Fatihah");
  });
});
