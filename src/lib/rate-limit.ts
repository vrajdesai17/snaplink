import { redis } from "./redis";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Sliding window rate limiter backed by Redis sorted sets.
 * Each request is stored as a timestamped member; members older
 * than the window are pruned on every check.
 */
export async function checkRateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60_000
): Promise<RateLimitResult> {
  if (!redis) {
    return { success: true, remaining: limit, reset: Date.now() + windowMs };
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const key = `rl:${identifier}`;

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, "-inf", windowStart);
    pipeline.zadd(key, now, `${now}-${Math.random().toString(36).slice(2)}`);
    pipeline.zcard(key);
    pipeline.pexpire(key, windowMs);
    const results = await pipeline.exec();

    const count = (results?.[2]?.[1] as number) ?? 0;
    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
      reset: now + windowMs,
    };
  } catch {
    return { success: true, remaining: limit, reset: now + windowMs };
  }
}
