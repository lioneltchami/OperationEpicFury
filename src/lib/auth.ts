import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getRedis } from "@/lib/redis";

const COOKIE_NAME = "admin_token";
const SESSION_PREFIX = "session:";
const SESSION_TTL = 60 * 60 * 24; // 24 hours

/** Generate a cryptographically random session token. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Store a session token in Redis with TTL. */
export async function createSession(token: string): Promise<void> {
  const redis = getRedis();
  await redis.set(`${SESSION_PREFIX}${token}`, "1", "EX", SESSION_TTL);
}

/** Delete a session token from Redis. */
export async function destroySession(token: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`${SESSION_PREFIX}${token}`);
}

/** Check if a session token exists in Redis. */
async function isValidSession(token: string): Promise<boolean> {
  const redis = getRedis();
  const exists = await redis.exists(`${SESSION_PREFIX}${token}`);
  return exists === 1;
}

/** Check if the current request has a valid admin session cookie. */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return isValidSession(token);
}

export { COOKIE_NAME, SESSION_TTL };
