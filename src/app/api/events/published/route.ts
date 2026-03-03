import { NextRequest, NextResponse } from "next/server";
import { getPublishedEventsPaginated } from "@/lib/kv";
import type { EventCategory } from "@/data/timeline";

const VALID_CATEGORIES: EventCategory[] = [
  "strike", "retaliation", "announcement", "casualty",
  "world-reaction", "breaking", "breaking-important",
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
  const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit")) || 50));
  const category = searchParams.get("category");

  const data = await getPublishedEventsPaginated(offset, limit);

  if (category && VALID_CATEGORIES.includes(category as EventCategory)) {
    const filtered = data.events.filter((e) => e.category === category);
    return NextResponse.json({ events: filtered, total: filtered.length });
  }

  return NextResponse.json(data);
}
