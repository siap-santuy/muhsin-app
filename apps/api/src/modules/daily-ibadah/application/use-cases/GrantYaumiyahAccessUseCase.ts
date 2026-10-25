import type { IYaumiyahAccessRequestRepository } from "../../domain/repositories/IYaumiyahAccessRequestRepository";
import type { YaumiyahAccessRequestEntity } from "../../domain/entities/YaumiyahAccessRequest";

export interface GrantYaumiyahAccessInput {
  schoolId: string;
  studentId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason?: string;
  durationHours?: number; // default 24
  granterId: string;
  granterRole: string;
}

export class GrantYaumiyahAccessUseCase {
  constructor(private readonly repo: IYaumiyahAccessRequestRepository) {}

  async execute(input: GrantYaumiyahAccessInput): Promise<YaumiyahAccessRequestEntity> {
    if (input.granterRole !== "teacher" && input.granterRole !== "koordinator_ttq") {
      throw new Error("Hanya guru atau koordinator yang berwenang memberikan akses langsung");
    }

    if (input.startDate > input.endDate) {
      throw new Error("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
    }

    const now = new Date();
    const durationHours = input.durationHours ?? 24;
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const entity: YaumiyahAccessRequestEntity = {
      id: crypto.randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason?.trim() || "Akses dibuka langsung oleh Guru/Koordinator",
      status: "approved",
      reviewedBy: input.granterId,
      reviewedAt: now,
      expiresAt,
      isDirectGrant: true,
      createdAt: now,
      updatedAt: now,
    };

    return this.repo.create(entity);
  }
}
