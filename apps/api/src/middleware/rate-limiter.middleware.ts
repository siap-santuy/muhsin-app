import type { Context, Next } from "hono";
import type Redis from "ioredis";

interface MemoryRateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryRateLimitRecord>();

export interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
  errorMessage?: string;
  redis?: Redis;
}

export function rateLimiter(options: RateLimitOptions) {
  const {
    windowSeconds,
    maxRequests,
    keyPrefix,
    errorMessage = "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.",
    redis,
  } = options;

  return async (c: Context, next: Next) => {
    // Gunakan IP client dan identifier jika ada di body
    const forwarded = c.req.header("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const key = `${keyPrefix}:${ip}`;

    if (redis) {
      try {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, windowSeconds);
        }
        if (current > maxRequests) {
          return c.json(
            {
              data: null,
              error: {
                code: "RATE_LIMITED",
                message: errorMessage,
              },
              meta: null,
            },
            429
          );
        }
        return next();
      } catch {
        // Fallback to in-memory store on redis connection error
      }
    }

    // In-memory sliding window fallback
    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || now > record.resetAt) {
      memoryStore.set(key, {
        count: 1,
        resetAt: now + windowSeconds * 1000,
      });
      return next();
    }

    if (record.count >= maxRequests) {
      return c.json(
        {
          data: null,
          error: {
            code: "RATE_LIMITED",
            message: errorMessage,
          },
          meta: null,
        },
        429
      );
    }

    record.count += 1;
    return next();
  };
}
