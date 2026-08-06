export interface TenantContext {
  schoolId: string;
  userId: string;
  role: "koordinator_ttq" | "teacher" | "parent" | "student";
}
