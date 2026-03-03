import { generateAtom } from "@/lib/feed";

export async function GET() {
  const xml = await generateAtom("en");
  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
