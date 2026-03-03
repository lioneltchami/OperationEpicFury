import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { getAllEvents, getPublishedEvents, addEvent } from "@/lib/kv";
import { generateSlug } from "@/lib/slug";
import { notifySubscribers } from "@/lib/notify";
import { validateEventInput } from "@/lib/validate-event";
import { revalidateTimeline } from "@/lib/revalidate";
import type { TimelineEvent } from "@/data/timeline";

export async function GET() {
  if (!(await authorize())) {
    const published = await getPublishedEvents();
    return NextResponse.json(published);
  }
  const events = await getAllEvents();
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = validateEventInput(body);
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const id = crypto.randomUUID();

  // Auto-generate slug from headline
  const existing = await getAllEvents();
  const existingSlugs = new Set(existing.map((e) => e.slug).filter(Boolean) as string[]);
  const slug = generateSlug(result.data.headline, existingSlugs);

  const event: TimelineEvent = { ...result.data, id, slug };
  await addEvent(event);

  // Notify if event is published immediately (not draft)
  if (event.status !== "draft") {
    notifySubscribers(event).catch(console.error);
    revalidateTimeline();
  }

  return NextResponse.json(event, { status: 201 });
}
