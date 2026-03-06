import { type NextRequest, NextResponse } from "next/server";
import { getRedis, isRedisAvailable } from "@/lib/redis";

const PUBLISHED_KEY = "events:published";
const HASH_KEY = "events:data";

export async function GET(req: NextRequest) {
  if (!isRedisAvailable()) {
    return NextResponse.json([]);
  }

  const hours = Math.min(
    Number(req.nextUrl.searchParams.get("hours") ?? "12"),
    72, // cap at 72 hours
  );

  const redis = getRedis();
  const cutoff = Date.now() - hours * 60 * 60 * 1000;

  // Get IDs from the published sorted set (most recent first, capped at 100)
  const ids = await redis.zrevrange(PUBLISHED_KEY, 0, 99);
  if (ids.length === 0) {
    return NextResponse.json([]);
  }

  // Batch-fetch event data via pipeline for efficiency
  const pipeline = redis.pipeline();
  for (const id of ids) {
    pipeline.hget(HASH_KEY, id);
  }
  const results = await pipeline.exec();

  const events = (results ?? [])
    .map(([, raw]) => (raw ? JSON.parse(raw as string) : null))
    .filter(Boolean)
    .filter((e: { createdAt?: string }) => {
      if (!e.createdAt) return true; // include events without timestamp
      return new Date(e.createdAt).getTime() > cutoff;
    })
    .map(
      (e: {
        id: string;
        headline: string;
        timeET: string;
        category: string;
      }) => ({
        id: e.id,
        headline: e.headline,
        timeET: e.timeET,
        category: e.category,
      }),
    );

  const res = NextResponse.json(events);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
