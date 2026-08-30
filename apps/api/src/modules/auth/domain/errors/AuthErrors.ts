export class AuthError extends Error {
  code = "AUTH_ERROR";
}

export class InvalidCredentialsError extends AuthError {
  code = "INVALID_CREDENTIALS";
  constructor() {
    super("Email atau password salah");
  }
}

export class WrongPasswordError extends AuthError {
  code = "WRONG_PASSWORD";
  constructor() {
    super("Password lama tidak sesuai");
  }
}

export class UserNotFoundError extends AuthError {
  code = "USER_NOT_FOUND";
  constructor() {
    super("User tidak ditemukan");
  }
}

export class EmailAlreadyUsedError extends AuthError {
  code = "EMAIL_ALREADY_USED";
  constructor() {
    super("Email sudah digunakan user lain");
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
