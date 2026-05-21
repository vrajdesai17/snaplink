import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | null };

function createRedisClient(): Redis | null {
  try {
    const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy: () => null,
      enableOfflineQueue: false,
    });
    client.on("error", () => {});
    return client;
  } catch {
    return null;
  }
}

export const redis: Redis | null =
  globalForRedis.redis !== undefined
    ? globalForRedis.redis
    : createRedisClient();

if (process.env.NODE_ENV !== "production") {
  (globalThis as unknown as { redis: Redis | null }).redis = redis;
}

export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await redis?.get(key) ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, ttl: number, value: string): Promise<void> {
  try {
    await redis?.setex(key, ttl, value);
  } catch {}
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis?.del(key);
  } catch {}
}
