import { z } from "zod";

export const userRoleSchema = z.enum([
  "koordinator_ttq",
  "teacher",
  "parent",
  "student",
]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  schoolId: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const refreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenInputSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  role: userRoleSchema,
  name: z.string(),
  email: z.string().email(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const loginOutputSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: authUserSchema,
});
export type LoginOutput = z.infer<typeof loginOutputSchema>;

export const refreshTokenOutputSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
});
export type RefreshTokenOutput = z.infer<typeof refreshTokenOutputSchema>;
