import type { ITokenRepository } from "../../domain/repositories/ITokenRepository";
import { TokenInvalidError } from "../../domain/errors/AuthErrors";
import type { RefreshTokenInput, RefreshTokenOutput } from "../dto/auth";
import { TokenService } from "../services/TokenService";
import { hashRefreshToken } from "../services/RefreshTokenHasher";

export class RefreshTokenUseCase {
  constructor(
    private readonly tokenRepository: ITokenRepository,
    private readonly tokenService: TokenService
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const payload = await this.tokenService.verifyRefreshToken(
      input.refreshToken
    );

    const stored = await this.tokenRepository.findRefreshToken(
      hashRefreshToken(input.refreshToken)
    );

    if (!stored) {
      throw new TokenInvalidError();
    }

    const accessToken = await this.tokenService.signAccessToken({
      id: payload.sub,
      schoolId: payload.schoolId,
      role: payload.role,
    });

    return {
      accessToken,
      expiresIn: this.tokenService.accessTtl,
    };
  }
}
