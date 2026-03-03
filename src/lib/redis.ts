import Redis from "ioredis";

let cachedRedis: Redis | null = null;

/**
 * Shared Redis connection singleton.
 * All modules should import this instead of creating their own connections.
 */
export function getRedis(): Redis {
  if (!cachedRedis) {
    const url = process.env.KV_REDIS_URL!;
    const useTls = url.startsWith("rediss://");
    cachedRedis = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      family: 6,
      enableReadyCheck: false,
      connectTimeout: 10000,
      ...(useTls ? { tls: {} } : {}),
    });
  }
  return cachedRedis;
}
