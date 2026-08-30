import type { Context, Next } from "hono";
import { ZodError } from "zod";
import {
  AuthError,
  UserNotFoundError,
  WrongPasswordError,
  EmailAlreadyUsedError,
} from "../modules/auth/domain/errors/AuthErrors";

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
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

    if (err instanceof UserNotFoundError) {
      return c.json(
        { data: null, error: { code: err.code, message: err.message }, meta: null },
        404
      );
    }

    if (err instanceof WrongPasswordError) {
      return c.json(
        { data: null, error: { code: err.code, message: err.message }, meta: null },
        400
      );
    }

    if (err instanceof EmailAlreadyUsedError) {
      return c.json(
        { data: null, error: { code: err.code, message: err.message }, meta: null },
        409
      );
    }

    if (err instanceof AuthError) {
      return c.json(
        { data: null, error: { code: err.code, message: err.message }, meta: null },
        401
      );
    }

    return c.json(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal" },
        meta: null,
      },
      500
    );
  }
}
