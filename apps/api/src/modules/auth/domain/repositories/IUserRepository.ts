import type { User } from "../entities/User";

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
}

export interface CreateUserData {
  schoolId: string;
  role: User["role"];
  name: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
  username?: string | null;
  gender?: string | null;
}

export interface UpdateUserAdminData {
  name?: string;
  email?: string;
  phone?: string | null;
}

export interface IUserRepository {
  findByEmail(email: string, schoolId: string): Promise<User | null>;
  findByIdentifier(identifier: string, schoolId: string): Promise<User | null>;
  findById(id: string, schoolId: string): Promise<User | null>;
  updateProfile(id: string, schoolId: string, data: UpdateUserData): Promise<User>;
  updatePasswordHash(id: string, schoolId: string, passwordHash: string): Promise<void>;
  createUser(data: CreateUserData): Promise<User>;
  updateUser(id: string, schoolId: string, data: UpdateUserAdminData): Promise<User>;
  deleteUser(id: string, schoolId: string): Promise<void>;
}
