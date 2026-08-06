export class AuthError extends Error {
  code = "AUTH_ERROR";
}

export class InvalidCredentialsError extends AuthError {
  code = "INVALID_CREDENTIALS";
  constructor() {
    super("Email atau password salah");
  }
}

export class TokenExpiredError extends AuthError {
  code = "TOKEN_EXPIRED";
  constructor() {
    super("Token telah kedaluwarsa");
  }
}

export class TokenInvalidError extends AuthError {
  code = "TOKEN_INVALID";
  constructor() {
    super("Token tidak valid");
  }
}
