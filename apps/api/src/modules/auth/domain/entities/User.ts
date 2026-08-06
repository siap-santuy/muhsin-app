export type UserRole = "koordinator_ttq" | "teacher" | "parent" | "student";

export interface User {
  id: string;
  schoolId: string;
  role: UserRole;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  createdAt: Date;
}
