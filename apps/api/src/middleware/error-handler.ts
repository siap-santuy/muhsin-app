import type { Context } from "hono";
import { ZodError } from "zod";
import {
  AuthError,
  UserNotFoundError,
  WrongPasswordError,
  EmailAlreadyUsedError,
} from "../modules/auth/domain/errors/AuthErrors";
import { AssignmentForbiddenError } from "../modules/munaqosah/application/use-cases/SubmitMunaqosahResultUseCase";

export function errorHandler(err: unknown, c: Context): Response {
  const errCode = (err as any)?.code;
  const method = c.req.method;
  const path = c.req.path;
  const timestamp = new Date().toISOString();

  if (err instanceof ZodError) {
    console.warn(`[WARN] ${timestamp} [400] ${method} ${path} - Validation Error:`, err.flatten().fieldErrors);
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
    console.warn(`[WARN] ${timestamp} [404] ${method} ${path} - User Not Found: ${(err as Error).message}`);
    return c.json(
      { data: null, error: { code: "USER_NOT_FOUND", message: (err as Error).message }, meta: null },
      404
    );
  }

  if (err instanceof WrongPasswordError || errCode === "WRONG_PASSWORD") {
    console.warn(`[WARN] ${timestamp} [400] ${method} ${path} - Wrong Password attempt`);
    return c.json(
      { data: null, error: { code: "WRONG_PASSWORD", message: (err as Error).message }, meta: null },
      400
    );
  }

  if (err instanceof EmailAlreadyUsedError || errCode === "EMAIL_ALREADY_USED") {
    console.warn(`[WARN] ${timestamp} [409] ${method} ${path} - Email Already Used: ${(err as Error).message}`);
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
    console.warn(`[WARN] ${timestamp} [401] ${method} ${path} - Auth Failed (${errCode}): ${(err as Error).message}`);
    return c.json(
      { data: null, error: { code: errCode || "AUTH_ERROR", message: (err as Error).message }, meta: null },
      401
    );
  }

  if (errCode === "ASSIGNMENT_FORBIDDEN" || err instanceof AssignmentForbiddenError) {
    return c.json(
      { data: null, error: { code: "ASSIGNMENT_FORBIDDEN", message: (err as Error).message }, meta: null },
      403
    );
  }

  // 500 Uncaught / Internal Server Error with full stack trace
  console.error(`[ERROR] ${timestamp} [500] ${method} ${path}:`, err);
  return c.json(
    {
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" },
      meta: null,
    },
    500
  );
}
