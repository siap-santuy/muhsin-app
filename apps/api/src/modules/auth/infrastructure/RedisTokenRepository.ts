import type Redis from "ioredis";
import type { ITokenRepository } from "../domain/repositories/ITokenRepository";

const KEY_PREFIX = "refresh_token:";

export class RedisTokenRepository implements ITokenRepository {
  constructor(private readonly redis: Redis) {}

  async saveRefreshToken(
    userId: string,
    tokenHash: string,
    ttlSeconds: number
  ): Promise<void> {
    await this.redis.set(KEY_PREFIX + tokenHash, userId, "EX", ttlSeconds);
  }

  async findRefreshToken(tokenHash: string): Promise<string | null> {
    return this.redis.get(KEY_PREFIX + tokenHash);
  }

  async deleteRefreshToken(tokenHash: string): Promise<void> {
    await this.redis.del(KEY_PREFIX + tokenHash);
  }
}
