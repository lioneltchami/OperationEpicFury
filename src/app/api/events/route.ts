import { type NextRequest, NextResponse } from "next/server";
import type { TimelineEvent } from "@/data/timeline";
import { authorize } from "@/lib/authorize";
import { addEvent, getAllEvents, getPublishedEvents } from "@/lib/kv";
import { notifySubscribers } from "@/lib/notify";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidateTimeline } from "@/lib/revalidate";
import { generateSlug } from "@/lib/slug";
import { validateEventInput } from "@/lib/validate-event";

export async function GET(req: NextRequest) {
  if (!(await authorize())) {
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
    const published = await getPublishedEvents();
    const res = NextResponse.json(published);
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );
    return res;
  }
  const events = await getAllEvents();
  const res = NextResponse.json(events);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
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
  const existingSlugs = new Set(
    existing.map((e) => e.slug).filter(Boolean) as string[],
  );
  const slug = generateSlug(result.data.headline, existingSlugs);

  const event: TimelineEvent = { ...result.data, id, slug };
  await addEvent(event);

  // Notify if event is published immediately (not draft)
  if (event.status !== "draft") {
    notifySubscribers(event).catch(console.error);
    revalidateTimeline(slug);
  }

  return NextResponse.json(event, { status: 201 });
}
