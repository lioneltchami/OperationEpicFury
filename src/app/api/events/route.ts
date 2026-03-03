import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAllEvents, getPublishedEvents, addEvent } from "@/lib/kv";
import { generateSlug } from "@/lib/slug";
import { notifySubscribers } from "@/lib/notify";
import type { TimelineEvent } from "@/data/timeline";

export async function GET() {
  if (!(await isAuthenticated())) {
    const published = await getPublishedEvents();
    return NextResponse.json(published);
  }
  const events = await getAllEvents();
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Omit<TimelineEvent, "id">;
  const id = crypto.randomUUID();

  // Auto-generate slug from headline
  const existing = await getAllEvents();
  const existingSlugs = new Set(existing.map((e) => e.slug).filter(Boolean) as string[]);
  const slug = generateSlug(body.headline, existingSlugs);

  const event: TimelineEvent = { ...body, id, slug };
  await addEvent(event);

  // Notify if event is published immediately (not draft)
  if (event.status !== "draft") {
    notifySubscribers(event).catch(console.error);
  }

  return NextResponse.json(event, { status: 201 });
}
