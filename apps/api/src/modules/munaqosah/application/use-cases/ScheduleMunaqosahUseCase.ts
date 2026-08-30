import type { IMunaqosahRepository } from "../../domain/repositories/IMunaqosahRepository";

export class ScheduleMunaqosahUseCase {
  constructor(private readonly repo: IMunaqosahRepository) {}

  async execute(params: {
    requestId: string;
    periodId: string;
    examinerTeacherId: string;
    jadwalTanggal: string;
    jadwalWaktu?: string;
    assignedBy: string;
    schoolId: string;
  }) {
    const assignmentId = await this.repo.createAssignment({
      requestId: params.requestId,
      periodId: params.periodId,
      examinerTeacherId: params.examinerTeacherId,
      jadwalTanggal: params.jadwalTanggal,
      jadwalWaktu: params.jadwalWaktu,
      assignedBy: params.assignedBy,
    });

    await this.repo.updateRequestStatus(
      params.requestId,
      params.schoolId,
      "dijadwalkan"
    );

    return assignmentId;
  }
}
