import { type NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { getAllEvents, updateEvent } from "@/lib/kv";
import { notifySubscribers } from "@/lib/notify";
import { revalidateTimeline } from "@/lib/revalidate";

export async function POST(req: NextRequest) {
  // Require auth (PUBLISH_SECRET) to prevent abuse
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check kill switch
  if (process.env.AUTO_PUBLISH_ENABLED === "false") {
    return NextResponse.json({ message: "Auto-publish disabled", promoted: 0 });
  }

  const events = await getAllEvents();
  const now = Date.now();
  const THIRTY_MINUTES = 30 * 60 * 1000;

  const draftsToPromote = events.filter((e) => {
    if (e.status !== "draft") return false;
    if (!e.createdAt) return false;
    const age = now - new Date(e.createdAt).getTime();
    return age > THIRTY_MINUTES;
  });

  let promoted = 0;
  for (const event of draftsToPromote) {
    await updateEvent(event.id, {
      status: "published",
      publishedAt: new Date().toISOString(),
    });
    notifySubscribers({ ...event, status: "published" }).catch(console.error);
    promoted++;
  }

  if (promoted > 0) {
    revalidateTimeline();
  }

  return NextResponse.json({ promoted, total_drafts: draftsToPromote.length });
}
