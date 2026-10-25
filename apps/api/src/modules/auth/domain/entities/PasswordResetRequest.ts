export type PasswordResetRequestStatus = "pending" | "resolved" | "rejected";

export interface PasswordResetRequestEntity {
  id: string;
  schoolId: string;
  userId: string;
  identifier: string;
  status: PasswordResetRequestStatus;
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
  rejectionNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetRequestWithUser extends PasswordResetRequestEntity {
  userName: string;
  userRole: string;
  userEmail: string;
  userPhone?: string | null;
}
