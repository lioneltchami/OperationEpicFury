import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";

export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await req.json();
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const token = process.env.GH_PAT;
  if (!token) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 },
    );
  }

  const res = await fetch(
    "https://api.github.com/repos/FZ1010/OperationEpicFury/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "translate_event",
        client_payload: { event_id: eventId },
      }),
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to trigger translation" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, eventId });
}
