import { getRedis } from "@/lib/redis";
import crypto from "crypto";

const PUSH_KEY = "push:subscriptions";

export interface PushSubscriptionRecord {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  categories: string[];
  locale: string;
}

function hashEndpoint(endpoint: string): string {
  return crypto.createHash("sha256").update(endpoint).digest("hex");
}

export async function saveSubscription(
  record: PushSubscriptionRecord,
): Promise<void> {
  const redis = getRedis();
  const field = hashEndpoint(record.subscription.endpoint);
  await redis.hset(PUSH_KEY, field, JSON.stringify(record));
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const redis = getRedis();
  const field = hashEndpoint(endpoint);
  await redis.hdel(PUSH_KEY, field);
}

export async function updateSubscriptionCategories(
  endpoint: string,
  categories: string[],
): Promise<boolean> {
  const redis = getRedis();
  const field = hashEndpoint(endpoint);
  const raw = await redis.hget(PUSH_KEY, field);
  if (!raw) return false;
  const record = JSON.parse(raw) as PushSubscriptionRecord;
  record.categories = categories;
  await redis.hset(PUSH_KEY, field, JSON.stringify(record));
  return true;
}

export async function getSubscriptionByEndpoint(
  endpoint: string,
): Promise<PushSubscriptionRecord | null> {
  const redis = getRedis();
  const field = hashEndpoint(endpoint);
  const raw = await redis.hget(PUSH_KEY, field);
  if (!raw) return null;
  return JSON.parse(raw) as PushSubscriptionRecord;
}

export async function getAllSubscriptions(): Promise<
  PushSubscriptionRecord[]
> {
  const redis = getRedis();
  const all = await redis.hgetall(PUSH_KEY);
  return Object.values(all).map((v) => JSON.parse(v) as PushSubscriptionRecord);
}

export async function removeSubscriptionByHash(hash: string): Promise<void> {
  const redis = getRedis();
  await redis.hdel(PUSH_KEY, hash);
}
