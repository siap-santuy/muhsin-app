import type { User } from "../entities/User";

export interface IUserRepository {
  findByEmail(email: string, schoolId: string): Promise<User | null>;
  findById(id: string, schoolId: string): Promise<User | null>;
}
