import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { getStats, updateStats } from "@/lib/stats";
import { revalidateTimeline } from "@/lib/revalidate";

export async function GET() {
  const stats = await getStats();
  return NextResponse.json(stats);
}

export async function PUT(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Only allow known numeric stat fields
  const allowed = ["killed", "injured", "usKilled", "israeliKilled", "jets", "targets", "missiles", "countries"];
  const patch: Record<string, number> = {};
  for (const key of allowed) {
    if (key in body && typeof body[key] === "number") {
      patch[key] = body[key];
    }
  }

  const updated = await updateStats(patch);
  revalidateTimeline();
  return NextResponse.json(updated);
}
