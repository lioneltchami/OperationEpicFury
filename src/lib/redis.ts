import Redis from "ioredis";

let cachedRedis: Redis | null = null;

/**
 * Shared Redis connection singleton.
 * All modules should import this instead of creating their own connections.
 */
export function getRedis(): Redis {
  if (!cachedRedis) {
    cachedRedis = new Redis(process.env.KV_REDIS_URL!, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return cachedRedis;
}
