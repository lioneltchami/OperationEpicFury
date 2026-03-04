import { type NextRequest, NextResponse } from "next/server";
import { findSource } from "@/data/sources";
import type { MediaItem } from "@/data/timeline";
import { authorize } from "@/lib/authorize";
import { addEvent, getAllEvents, getBufferedMedia } from "@/lib/kv";
import { notifySubscribers } from "@/lib/notify";
import { revalidateTimeline } from "@/lib/revalidate";
import { generateSlug } from "@/lib/slug";
import { validateEventInput } from "@/lib/validate-event";

export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    const authHeader = req.headers.get("authorization");
    console.log(
      "[api/events/publish] Unauthorized. Header present:",
      !!authHeader,
    );
    if (authHeader) {
      console.log("[api/events/publish] Header length:", authHeader.length);
      console.log(
        "[api/events/publish] Expected length:",
        `Bearer ${process.env.PUBLISH_SECRET}`.length,
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { media_group_id, ...eventFields } = body as Record<string, unknown> & {
    media_group_id?: string;
  };

  const result = validateEventInput(eventFields);
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

  // Resolve media: merge direct media with any buffered group media
  let media: MediaItem[] = result.data.media ?? [];
  if (media_group_id && typeof media_group_id === "string") {
    const buffered = await getBufferedMedia(media_group_id);
    media = [...media, ...buffered];
  }

  // Auto-detect source region if not provided
  let sourceRegion = result.data.sourceRegion;
  if (!sourceRegion) {
    const known = findSource(result.data.source);
    if (known && known.region !== "global") {
      sourceRegion = known.region as any;
    }
  }

  const event = {
    ...result.data,
    id,
    slug,
    sourceRegion,
    ...(media.length > 0 ? { media } : {}),
  };
  event.publishedAt = new Date().toISOString();
  event.status = "published";
  await addEvent(event);

  // Send push notifications (events from this endpoint are published)
  notifySubscribers(event).catch(console.error);

  revalidateTimeline();
  return NextResponse.json(event, { status: 201 });
}
