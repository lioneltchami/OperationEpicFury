import { NextRequest } from "next/server";
import { getPublishedEventsPaginated } from "@/lib/kv";

import { SITE_URL } from "@/lib/utils";



export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(parseInt(params.get("limit") ?? "10") || 10, 1), 30);
  const category = params.get("category") ?? "";
  const theme = params.get("theme") === "light" ? "light" : "dark";

  const { events: allEvents } = await getPublishedEventsPaginated(0, 200);
  const reversed = [...allEvents].reverse();
  const filtered = category
    ? reversed.filter((e) => e.category === category).slice(0, limit)
    : reversed.slice(0, limit);

  const bg = theme === "light" ? "#fff" : "#09090b";
  const text = theme === "light" ? "#18181b" : "#d4d4d8";
  const muted = theme === "light" ? "#71717a" : "#71717a";
  const accent = "#dc2626";
  const border = theme === "light" ? "#e4e4e7" : "#27272a";

  const eventsHtml = filtered
    .map(
      (e) => `
    <div style="padding:12px 16px;border-bottom:1px solid ${border}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="color:${accent};font-family:monospace;font-size:12px;font-weight:700">${escapeHtml(e.timeET.split(" ")[1] ?? "")}</span>
        <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:${muted}">${escapeHtml(e.category)}</span>
      </div>
      <a href="${SITE_URL}/en/events/${e.slug ?? ""}" target="_blank" rel="noopener" style="color:${text};text-decoration:none;font-size:14px;font-weight:600;line-height:1.4">${escapeHtml(e.headline)}</a>
      <div style="margin-top:4px;font-size:11px;color:${muted}">${escapeHtml(e.source)}</div>
    </div>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:${bg};color:${text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
a:hover{text-decoration:underline!important}
</style>
</head>
<body>
<div style="border:1px solid ${border};border-radius:12px;overflow:hidden;max-width:480px">
  <div style="padding:12px 16px;border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between">
    <a href="${SITE_URL}" target="_blank" rel="noopener" style="color:${accent};font-size:13px;font-weight:800;text-decoration:none;letter-spacing:0.02em">OPERATION EPIC FURY</a>
    <span style="font-size:10px;color:${muted}">LIVE</span>
  </div>
  ${eventsHtml}
  <div style="padding:10px 16px;text-align:center">
    <a href="${SITE_URL}" target="_blank" rel="noopener" style="color:${muted};font-size:11px;text-decoration:none">View full timeline →</a>
  </div>
</div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
      "X-Frame-Options": "ALLOWALL",
    },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
