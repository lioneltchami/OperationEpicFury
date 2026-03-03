import { NextRequest, NextResponse } from "next/server";
import { searchEvents } from "@/lib/search";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ events: [] });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfterSeconds } = await checkRateLimit(`search:${ip}`, 30, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const limit = Math.min(20, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 20));
  const events = await searchEvents(q, limit);
  return NextResponse.json({ events });
}
