import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { getAllEvents, setAllEvents } from "@/lib/kv";

export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await getAllEvents();
  events.sort((a, b) => (a.timeET ?? "").localeCompare(b.timeET ?? ""));
  await setAllEvents(events);
  return NextResponse.json({ ok: true, count: events.length });
}
