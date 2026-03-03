import Redis from "ioredis";

let cachedRedis: Redis | null = null;

/**
 * Shared Redis connection singleton.
 * All modules should import this instead of creating their own connections.
 */
export function getRedis(): Redis {
	if (!cachedRedis) {
		const url = process.env.KV_REDIS_URL;
		if (!url) {
			throw new Error("KV_REDIS_URL environment variable is not set");
		}
		const useTls = url.startsWith("rediss://");
		cachedRedis = new Redis(url, {
			maxRetriesPerRequest: 3,
			lazyConnect: true,
			family: 0,
			enableReadyCheck: false,
			connectTimeout: 5000,
			...(useTls ? { tls: {} } : {}),
		});
		cachedRedis.on("error", () => {
			// Prevent unhandled error events from crashing the process
		});
	}
	return cachedRedis;
}

/** Returns true if Redis is configured and available for use. */
export function isRedisAvailable(): boolean {
	return !!process.env.KV_REDIS_URL;
}
