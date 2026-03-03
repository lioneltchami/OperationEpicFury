import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { dispatchGitHubAction } from "@/lib/github";

export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await req.json();
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  if (!process.env.GH_PAT) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 },
    );
  }

  const ok = await dispatchGitHubAction("translate_event", {
    event_id: eventId,
  });

  if (!ok) {
    return NextResponse.json(
      { error: "Failed to trigger translation" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, eventId });
}
