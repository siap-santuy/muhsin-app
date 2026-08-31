import type { Context } from "hono";
import { ZodError } from "zod";
import {
  AuthError,
  UserNotFoundError,
  WrongPasswordError,
  EmailAlreadyUsedError,
} from "../modules/auth/domain/errors/AuthErrors";

export function errorHandler(err: unknown, c: Context): Response {
  const errCode = (err as any)?.code;

  if (err instanceof ZodError) {
    return c.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Input tidak valid",
          details: err.flatten().fieldErrors,
        },
        meta: null,
      },
      400
    );
  }

  if (err instanceof UserNotFoundError || errCode === "USER_NOT_FOUND") {
    return c.json(
      { data: null, error: { code: "USER_NOT_FOUND", message: (err as Error).message }, meta: null },
      404
    );
  }

  if (err instanceof WrongPasswordError || errCode === "WRONG_PASSWORD") {
    return c.json(
      { data: null, error: { code: "WRONG_PASSWORD", message: (err as Error).message }, meta: null },
      400
    );
  }

  if (err instanceof EmailAlreadyUsedError || errCode === "EMAIL_ALREADY_USED") {
    return c.json(
      { data: null, error: { code: "EMAIL_ALREADY_USED", message: (err as Error).message }, meta: null },
      409
    );
  }

  if (
    err instanceof AuthError ||
    errCode === "INVALID_CREDENTIALS" ||
    errCode === "AUTH_ERROR" ||
    errCode === "TOKEN_EXPIRED" ||
    errCode === "TOKEN_INVALID"
  ) {
    return c.json(
      { data: null, error: { code: errCode || "AUTH_ERROR", message: (err as Error).message }, meta: null },
      401
    );
  }

  console.error("[INTERNAL_ERROR]", err);
  return c.json(
    {
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal" },
      meta: null,
    },
    500
  );
}
