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
  createdAt: Date;
}
