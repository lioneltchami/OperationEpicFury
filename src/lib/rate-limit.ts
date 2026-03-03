import { getRedis } from "@/lib/redis";

const RATE_LIMIT_PREFIX = "ratelimit:";

/**
 * Sliding window rate limiter using Redis.
 * Returns { allowed, remaining, retryAfterSeconds }.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const redis = getRedis();
  const redisKey = `${RATE_LIMIT_PREFIX}${key}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Remove expired entries, add current, count total — all in one pipeline
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, now - windowMs);
  pipeline.zadd(redisKey, now.toString(), `${now}:${Math.random()}`);
  pipeline.zcard(redisKey);
  pipeline.expire(redisKey, windowSeconds);
  const results = await pipeline.exec();

  const count = (results?.[2]?.[1] as number) ?? 0;
  const allowed = count <= maxAttempts;

  if (!allowed) {
    // Remove the entry we just added since it's over the limit
    const members = await redis.zrangebyscore(redisKey, now.toString(), now.toString());
    if (members.length > 0) {
      await redis.zrem(redisKey, members[members.length - 1]);
    }
  }

  // Find oldest entry to calculate retry-after
  let retryAfterSeconds = 0;
  if (!allowed) {
    const oldest = await redis.zrange(redisKey, 0, 0, "WITHSCORES");
    if (oldest.length >= 2) {
      const oldestTime = parseInt(oldest[1], 10);
      retryAfterSeconds = Math.ceil((oldestTime + windowMs - now) / 1000);
    }
  }

  return {
    allowed,
    remaining: Math.max(0, maxAttempts - count),
    retryAfterSeconds: Math.max(0, retryAfterSeconds),
  };
}
