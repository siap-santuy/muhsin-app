import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import type { ITokenRepository } from "../../domain/repositories/ITokenRepository";
import { InvalidCredentialsError } from "../../domain/errors/AuthErrors";
import type { LoginInput, LoginOutput } from "../dto/auth";
import { TokenService } from "../services/TokenService";
import { PasswordHasher } from "../services/PasswordHasher";
import { hashRefreshToken } from "../services/RefreshTokenHasher";

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenRepository: ITokenRepository,
    private readonly tokenService: TokenService,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByIdentifier(
      input.identifier,
      input.schoolId
    );

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordValid = await this.passwordHasher.verifyPassword(
      input.password,
      user.passwordHash
    );

    if (!passwordValid) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.tokenService.signAccessToken({
      id: user.id,
      schoolId: user.schoolId,
      role: user.role,
    });
    const refreshToken = await this.tokenService.signRefreshToken({
      id: user.id,
      schoolId: user.schoolId,
      role: user.role,
    });

    await this.tokenRepository.saveRefreshToken(
      user.id,
      hashRefreshToken(refreshToken),
      this.tokenService.refreshTtl
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.tokenService.accessTtl,
      user: {
        id: user.id,
        schoolId: user.schoolId,
        role: user.role,
        name: user.name,
        email: user.email,
        username: user.username,
      },
    };
  }
}
