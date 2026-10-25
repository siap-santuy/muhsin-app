import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { YaumiyahAccessRequestEntity } from "../../domain/entities/YaumiyahAccessRequest";

export interface RejectYaumiyahAccessInput {
  requestId: string;
  schoolId: string;
  reviewerId: string;
  reviewerRole: string;
  rejectionNote?: string | null;
}

export class RejectYaumiyahAccessUseCase {
  constructor(private readonly repo: IYaumiyahAccessRequestRepository) {}

  async execute(input: RejectYaumiyahAccessInput): Promise<YaumiyahAccessRequestEntity> {
    if (input.reviewerRole !== "teacher" && input.reviewerRole !== "koordinator_ttq") {
      throw new Error("Hanya guru pembina atau koordinator yang berwenang menolak permohonan");
    }

    const request = await this.repo.findById(input.requestId, input.schoolId);
    if (!request) {
      throw new Error("Permohonan akses tidak ditemukan");
    }

    if (request.status !== "pending") {
      throw new Error(`Permohonan sudah berstatus ${request.status}`);
    }

    const now = new Date();
    const updated: YaumiyahAccessRequestEntity = {
      ...request,
      status: "rejected",
      reviewedBy: input.reviewerId,
      reviewedAt: now,
      rejectionNote: input.rejectionNote?.trim() || "Permohonan tidak disetujui",
      updatedAt: now,
    };

    return this.repo.update(updated);
  }
}
