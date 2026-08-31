import { validator } from "hono/validator";
import {
  loginInputSchema,
  refreshTokenInputSchema,
  updateProfileInputSchema,
  changePasswordInputSchema,
} from "@muhsin/shared";
import type { Context } from "hono";

function withSchema<T>(
  schema: {
    safeParse(data: unknown): { success: true; data: T } | { success: false };
  }
) {
  return (value: unknown, c: Context): T | Response => {
    const result = schema.safeParse(value);
    if (!result.success) {
      return c.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Input tidak valid" },
          meta: null,
        },
        400
      );
    }
    return result.data;
  };
}

export const loginValidator = validator("json", withSchema(loginInputSchema));
export const refreshTokenValidator = validator("json", withSchema(refreshTokenInputSchema));
export const updateProfileValidator = validator("json", withSchema(updateProfileInputSchema));
export const changePasswordValidator = validator("json", withSchema(changePasswordInputSchema));