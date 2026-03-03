import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getEventById, updateEvent, deleteEvent } from "@/lib/kv";
import { notifySubscribers } from "@/lib/notify";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Hide draft events from unauthenticated users
  if (event.status === "draft" && !(await isAuthenticated())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.PUBLISH_SECRET;
  const hasTokenAuth = secret && authHeader === `Bearer ${secret}`;
  const hasCookieAuth = await isAuthenticated();

  if (!hasTokenAuth && !hasCookieAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Check if this is a draft->published transition
  const existing = await getEventById(id);
  const isPublishing =
    existing?.status === "draft" &&
    body.status === "published";

  const updated = await updateEvent(id, body);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Send push notifications on publish
  if (isPublishing) {
    notifySubscribers(updated).catch(console.error);
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.PUBLISH_SECRET;
  const hasTokenAuth = secret && authHeader === `Bearer ${secret}`;
  const hasCookieAuth = await isAuthenticated();

  if (!hasTokenAuth && !hasCookieAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteEvent(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
