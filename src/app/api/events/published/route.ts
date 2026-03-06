import { type NextRequest, NextResponse } from "next/server";
import type { EventCategory } from "@/data/timeline";
import { getPublishedEventsPaginated } from "@/lib/kv";
import { checkRateLimit } from "@/lib/rate-limit";

const VALID_CATEGORIES: EventCategory[] = [
  "strike",
  "retaliation",
  "announcement",
  "casualty",
  "world-reaction",
  "breaking",
  "breaking-important",
];

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rateCheck = await checkRateLimit(`events:${ip}`, 60, 60);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
      },
    );
  }

  const { searchParams } = req.nextUrl;
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
  const limit = Math.min(
    500,
    Math.max(1, Number(searchParams.get("limit")) || 50),
  );
  const category = searchParams.get("category");

  const data = await getPublishedEventsPaginated(offset, limit);

  if (category && VALID_CATEGORIES.includes(category as EventCategory)) {
    const filtered = data.events.filter((e) => e.category === category);
    const res = NextResponse.json({ events: filtered, total: filtered.length });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const res = NextResponse.json(data);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
