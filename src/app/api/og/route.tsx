import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getEventBySlug } from "@/lib/kv";
import { SITE_URL, SITE_NAME } from "@/lib/utils";

export const runtime = "edge";

const categoryColors: Record<string, string> = {
  strike: "#ef4444",
  retaliation: "#f97316",
  announcement: "#3b82f6",
  casualty: "#eab308",
  "world-reaction": "#a855f7",
  breaking: "#ef4444",
  "breaking-important": "#dc2626",
};

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "black",
            color: "white",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 900 }}>{ SITE_NAME }</div>
          <div style={{ fontSize: 20, color: "#ef4444", marginTop: 12 }}>
            Minute-by-minute timeline
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  const event = await getEventBySlug(slug);
  if (!event) {
    return new Response("Not found", { status: 404 });
  }

  const accentColor = categoryColors[event.category] ?? "#ef4444";
  const headline = event.headline.length > 120
    ? event.headline.slice(0, 117) + "..."
    : event.headline;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "black",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: category + time */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              padding: "6px 16px",
              background: accentColor + "33",
              border: `2px solid ${accentColor}`,
              borderRadius: "6px",
              color: accentColor,
              fontSize: 16,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {event.category.replace("-", " ")}
          </div>
          <div style={{ color: "#ef4444", fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
            {event.timeET}
          </div>
        </div>

        {/* Middle: headline */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: "white",
            lineHeight: 1.2,
            maxWidth: "1000px",
          }}
        >
          {headline}
        </div>

        {/* Bottom: branding + source */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>
              {SITE_NAME}
            </div>
            <div style={{ fontSize: 14, color: "#71717a" }}>
              {new URL(SITE_URL).host}
            </div>
          </div>
          <div style={{ fontSize: 14, color: "#71717a" }}>
            Source: {event.source}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
