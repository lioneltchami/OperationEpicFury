import { NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { getAllEvents } from "@/lib/kv";

export async function POST() {
  if (!(await authorize())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await getAllEvents();
  return NextResponse.json({ ok: true, count: events.length });
}
