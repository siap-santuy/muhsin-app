import { describe, it, expect, vi } from "vitest";
import { GetHafalanTargetUseCase } from "../modules/targets/application/use-cases/GetHafalanTargetUseCase";
import { SetHafalanTargetUseCase } from "../modules/targets/application/use-cases/SetHafalanTargetUseCase";
import type { IHafalanTargetRepository } from "../modules/targets/domain/repositories/IHafalanTargetRepository";

describe("Targets Module UseCases", () => {
  const mockRepo: IHafalanTargetRepository = {
    findByStudentAndMonth: vi.fn(),
    findByClassAndMonth: vi.fn(),
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
});
