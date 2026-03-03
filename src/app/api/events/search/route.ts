import { NextRequest, NextResponse } from "next/server";
import { searchEvents } from "@/lib/search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ events: [] });
  }

  const limit = Math.min(20, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 20));
  const events = await searchEvents(q, limit);
  return NextResponse.json({ events });
}
