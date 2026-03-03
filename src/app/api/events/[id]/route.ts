import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { getEventById, updateEvent, deleteEvent } from "@/lib/kv";
import { notifySubscribers } from "@/lib/notify";
import { validateEventUpdate } from "@/lib/validate-event";
import { revalidateTimeline } from "@/lib/revalidate";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Hide draft events from unauthenticated users
  if (event.status === "draft" && !(await authorize(req))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const result = validateEventUpdate(body);
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Check if this is a draft->published transition
  const existing = await getEventById(id);
  const isPublishing =
    existing?.status === "draft" &&
    result.data.status === "published";

  const updated = await updateEvent(id, result.data);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Send push notifications on publish
  if (isPublishing) {
    notifySubscribers(updated).catch(console.error);
  }

  revalidateTimeline();
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteEvent(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  revalidateTimeline();
  return NextResponse.json({ ok: true });
}
