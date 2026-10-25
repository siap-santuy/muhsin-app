import type {
  PasswordResetRequestEntity,
  PasswordResetRequestWithUser,
} from "../entities/PasswordResetRequest";

export interface IPasswordResetRequestRepository {
  create(entity: PasswordResetRequestEntity): Promise<PasswordResetRequestEntity>;
  findById(id: string, schoolId: string): Promise<PasswordResetRequestEntity | null>;
  findPendingByUserId(userId: string, schoolId: string): Promise<PasswordResetRequestEntity | null>;
  listPendingBySchool(schoolId: string): Promise<PasswordResetRequestWithUser[]>;
  update(entity: PasswordResetRequestEntity): Promise<PasswordResetRequestEntity>;
}
