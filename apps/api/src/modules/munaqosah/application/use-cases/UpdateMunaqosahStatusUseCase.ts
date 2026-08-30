import type { IMunaqosahRepository } from "../../domain/repositories/IMunaqosahRepository";

export class UpdateMunaqosahStatusUseCase {
  constructor(private readonly repo: IMunaqosahRepository) {}

  async execute(params: {
    id: string;
    schoolId: string;
    status: "diajukan" | "disetujui" | "dijadwalkan" | "lulus" | "tidak_lulus" | "ditolak";
  }) {
    await this.repo.updateRequestStatus(params.id, params.schoolId, params.status);
  }
}
