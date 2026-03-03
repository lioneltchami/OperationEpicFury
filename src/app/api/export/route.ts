import { NextRequest, NextResponse } from "next/server";
import { getPublishedEvents } from "@/lib/kv";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfterSeconds } = await checkRateLimit(`export:${ip}`, 5, 3600);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const format = req.nextUrl.searchParams.get("format") ?? "json";
  const events = await getPublishedEvents();

  if (format === "csv") {
    const header = "time,headline,category,source,sourceUrl,confidence,sourceRegion";
    const rows = events.map((e) => {
      const fields = [
        e.timeET,
        e.headline,
        e.category,
        e.source,
        e.sourceUrl,
        e.confidence ?? "confirmed",
        e.sourceRegion ?? "",
      ];
      return fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",");
    });
    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=operation-epic-fury-events.csv",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  // Default: JSON
  return new Response(JSON.stringify(events, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=operation-epic-fury-events.json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
