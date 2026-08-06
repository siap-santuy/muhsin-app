import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { TokenInvalidError } from "../../domain/errors/AuthErrors";

export interface TokenSubject {
  id: string;
  schoolId: string;
  role: string;
}

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  schoolId: string;
  role: string;
}

export class TokenService {
  constructor(
    private readonly accessSecret: string,
    private readonly refreshSecret: string,
    private readonly accessTtlSeconds: number,
    private readonly refreshTtlSeconds: number
  ) {}

  async signAccessToken(subject: TokenSubject): Promise<string> {
    return this.sign(subject, this.accessSecret, this.accessTtlSeconds);
  }

  async signRefreshToken(subject: TokenSubject): Promise<string> {
    return this.sign(subject, this.refreshSecret, this.refreshTtlSeconds);
  }

  private async sign(
    subject: TokenSubject,
    secret: string,
    ttlSeconds: number
  ): Promise<string> {
    const secretKey = new TextEncoder().encode(secret);
    return new SignJWT({ schoolId: subject.schoolId, role: subject.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(subject.id)
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
      .sign(secretKey);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.verify(token, this.accessSecret);
  }

  async verifyRefreshToken(token: string): Promise<AccessTokenPayload> {
    return this.verify(token, this.refreshSecret);
  }

  private async verify(
    token: string,
    secret: string
  ): Promise<AccessTokenPayload> {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );
      return payload as AccessTokenPayload;
    } catch {
      throw new TokenInvalidError();
    }
  }

  get accessTtl(): number {
    return this.accessTtlSeconds;
  }

  get refreshTtl(): number {
    return this.refreshTtlSeconds;
  }
}
