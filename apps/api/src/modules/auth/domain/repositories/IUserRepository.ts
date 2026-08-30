import type { User } from "../entities/User";

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string | null;
}

export interface IUserRepository {
  findByEmail(email: string, schoolId: string): Promise<User | null>;
  findById(id: string, schoolId: string): Promise<User | null>;
  updateProfile(id: string, schoolId: string, data: UpdateUserData): Promise<User>;
  updatePasswordHash(id: string, schoolId: string, passwordHash: string): Promise<void>;
}
