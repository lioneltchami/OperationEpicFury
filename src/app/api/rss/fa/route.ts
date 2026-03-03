import { generateRss } from "@/lib/feed";

export async function GET() {
  const xml = await generateRss("fa");
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
