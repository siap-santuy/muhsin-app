export type UserRole = "koordinator_ttq" | "teacher" | "parent" | "student";

export interface User {
  id: string;
  schoolId: string;
  role: UserRole;
  name: string;
  username: string | null;
  email: string;
  passwordHash: string;
  phone: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  createdAt: Date;
}
