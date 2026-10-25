import type { IMunaqosahRepository } from "../../domain/repositories/IMunaqosahRepository";

export class CreateMunaqosahRequestUseCase {
  constructor(private readonly repo: IMunaqosahRepository) {}

  async execute(params: {
    schoolId: string;
    studentId: string;
    teacherId: string;
    juzKe?: number;
    juzList?: number[];
    periodId?: string;
  }) {
    // Normalisasi list juz
    let list = params.juzList && params.juzList.length > 0 ? params.juzList : params.juzKe ? [params.juzKe] : [];
    // Hapus duplikat & urutkan
    list = [...new Set(list)].sort((a, b) => a - b);

    if (list.length === 0) {
      throw new Error("Pilih minimal 1 juz untuk ujian munaqosah");
    }

    for (const j of list) {
      if (j < 1 || j > 30) {
        throw new Error("Nomor juz harus antara 1 sampai 30");
      }
    }

    // 1. Cek apakah siswa sudah memiliki permohonan munaqosah aktif pada periode ini
    const active = await this.repo.findActiveRequestByStudent(
      params.studentId,
      params.schoolId,
      params.periodId
    );
    if (active) {
      throw new Error(
        `Siswa sudah memiliki pengajuan munaqosah aktif (${active.status}) pada periode ini. Siswa hanya dapat mengikuti 1 kali ujian per periode.`
      );
    }

    // 2. Cek apakah ada juz yang diajukan yang sudah pernah LULUS sebelumnya
    const passedJuz = await this.repo.findPassedJuzByStudent(params.studentId, params.schoolId);
    const alreadyPassed = list.filter((j) => passedJuz.includes(j));
    if (alreadyPassed.length > 0) {
      throw new Error(
        `Siswa telah dinyatakan LULUS munaqosah untuk Juz ${alreadyPassed.join(", ")} sebelumnya. Tidak perlu diajukan ulang.`
      );
    }

    const primaryJuz = list[0];

    return this.repo.createRequest({
      schoolId: params.schoolId,
      studentId: params.studentId,
      teacherId: params.teacherId,
      juzKe: primaryJuz,
      juzList: list,
      periodId: params.periodId,
    });
  }
}
