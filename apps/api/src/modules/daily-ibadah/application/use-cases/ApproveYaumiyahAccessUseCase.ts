import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { YaumiyahAccessRequestEntity } from "../../domain/entities/YaumiyahAccessRequest";

export interface ApproveYaumiyahAccessInput {
  requestId: string;
  schoolId: string;
  reviewerId: string;
  reviewerRole: string;
  durationHours?: number; // default 24 jam
}

export class ApproveYaumiyahAccessUseCase {
  constructor(private readonly repo: IYaumiyahAccessRequestRepository) {}

  async execute(input: ApproveYaumiyahAccessInput): Promise<YaumiyahAccessRequestEntity> {
    if (input.reviewerRole !== "teacher" && input.reviewerRole !== "koordinator_ttq") {
      throw new Error("Hanya guru pembina atau koordinator yang berwenang menyetujui permohonan");
    }

    const request = await this.repo.findById(input.requestId, input.schoolId);
    if (!request) {
      throw new Error("Permohonan akses tidak ditemukan");
    }

    if (request.status !== "pending") {
      throw new Error(`Permohonan sudah berstatus ${request.status}`);
    }

    const now = new Date();
    const durationHours = input.durationHours ?? 24;
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const updated: YaumiyahAccessRequestEntity = {
      ...request,
      status: "approved",
      reviewedBy: input.reviewerId,
      reviewedAt: now,
      expiresAt,
      updatedAt: now,
    };

    return this.repo.update(updated);
  }
}
