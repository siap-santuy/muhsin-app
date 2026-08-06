export interface ITokenRepository {
  saveRefreshToken(userId: string, tokenHash: string, ttlSeconds: number): Promise<void>;
  findRefreshToken(tokenHash: string): Promise<string | null>;
  deleteRefreshToken(tokenHash: string): Promise<void>;
}
