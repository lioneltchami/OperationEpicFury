import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { getAllEvents, setAllEvents } from "@/lib/kv";
import { generateSlug } from "@/lib/slug";

export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await getAllEvents();
    const existingSlugs = new Set<string>();
    let updated = 0;

    for (const event of events) {
      if (event.slug) {
        existingSlugs.add(event.slug);
        continue;
      }
      const slug = generateSlug(event.headline, existingSlugs);
      event.slug = slug;
      existingSlugs.add(slug);
      updated++;
    }

    if (updated > 0) {
      await setAllEvents(events);
    }

    return NextResponse.json({
      total: events.length,
      updated,
      skipped: events.length - updated,
    });
  } catch (err) {
    console.error("Slug migration failed:", err);
    return NextResponse.json(
      { error: "Slug migration failed" },
      { status: 500 },
    );
  }
}
