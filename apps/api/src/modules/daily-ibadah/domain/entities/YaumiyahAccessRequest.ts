export type YaumiyahRequestStatus = "pending" | "approved" | "rejected";

export interface YaumiyahAccessRequestEntity {
  id: string;
  schoolId: string;
  studentId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  status: YaumiyahRequestStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  rejectionNote?: string | null;
  expiresAt?: Date | null;
  isDirectGrant: boolean;
  createdAt: Date;
  updatedAt: Date;
}
