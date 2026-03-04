import Redis from "ioredis";

let cachedRedis: Redis | null = null;

/**
 * Shared Redis connection singleton.
 * All modules should import this instead of creating their own connections.
 */
export function getRedis(): Redis {
  if (!cachedRedis) {
    const url = process.env.KV_REDIS_URL || process.env.KV_URL;
    if (!url) {
      throw new Error("Redis connection URL (KV_REDIS_URL or KV_URL) is not set");
    }

    // Upstash often requires rediss:// (TLS)
    let finalUrl = url;
    if (url.includes("upstash.io") && url.startsWith("redis://")) {
      finalUrl = url.replace("redis://", "rediss://");
      console.log("[redis] Upgrading to TLS for Upstash host");
    }

    const useTls = finalUrl.startsWith("rediss://");
    cachedRedis = new Redis(finalUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      family: 6,
      enableReadyCheck: false,
      connectTimeout: 5000,
      ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
    });

    cachedRedis.on("error", (err) => {
      console.error("[redis] Connection error:", err.message);
    });
  }
  return cachedRedis;
}

/** Returns true if Redis is configured and available for use. */
export function isRedisAvailable(): boolean {
  return !!(process.env.KV_REDIS_URL || process.env.KV_URL);
}
