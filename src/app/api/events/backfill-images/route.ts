import { type NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { getAllEvents, updateEvent } from "@/lib/kv";
import { revalidateTimeline } from "@/lib/revalidate";

/** Extract og:image URL from raw HTML */
function extractOgImage(html: string): string | null {
	// Match: <meta property="og:image" content="...">
	const match = html.match(/og:image["'][^>]*content=["']([^"']+)["']/i);
	if (match?.[1]) return match[1];

	// Fallback: twitter:image
	const twitterMatch = html.match(
		/twitter:image["'][^>]*content=["']([^"']+)["']/i,
	);
	if (twitterMatch?.[1]) return twitterMatch[1];

	// Fallback: JSON-LD image
	const jsonLdMatch = html.match(/"image"\s*:\s*"(https?:\/\/[^"]+)"/);
	if (jsonLdMatch?.[1]) return jsonLdMatch[1];

	return null;
}

export async function POST(req: NextRequest) {
	if (!(await authorize(req))) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Optional: dry run mode
	const url = new URL(req.url);
	const dryRun = url.searchParams.get("dry") === "1";

	const events = await getAllEvents();
	const needsMedia = events.filter(
		(e) => (!e.media || e.media.length === 0) && e.sourceUrl,
	);

	const results: {
		id: string;
		headline: string;
		sourceUrl: string;
		imageFound: string | null;
		updated: boolean;
		error?: string;
	}[] = [];

	for (const event of needsMedia) {
		try {
			const res = await fetch(event.sourceUrl, {
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
					"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
					"Accept-Language": "en-US,en;q=0.5",
				},
				redirect: "follow",
				signal: AbortSignal.timeout(20000),
			});

			if (!res.ok) {
				results.push({
					id: event.id,
					headline: event.headline,
					sourceUrl: event.sourceUrl,
					imageFound: null,
					updated: false,
					error: `HTTP ${res.status}`,
				});
				continue;
			}

			const html = await res.text();
			const imageUrl = extractOgImage(html);

			if (!imageUrl) {
				results.push({
					id: event.id,
					headline: event.headline,
					sourceUrl: event.sourceUrl,
					imageFound: null,
					updated: false,
				});
				continue;
			}

			if (!dryRun) {
				await updateEvent(event.id, {
					media: [
						{
							fileId: "",
							type: "photo" as const,
							url: imageUrl,
						},
					],
				});
			}

			results.push({
				id: event.id,
				headline: event.headline,
				sourceUrl: event.sourceUrl,
				imageFound: imageUrl,
				updated: !dryRun,
			});
		} catch (err) {
			results.push({
				id: event.id,
				headline: event.headline,
				sourceUrl: event.sourceUrl,
				imageFound: null,
				updated: false,
				error: err instanceof Error ? err.message : "Unknown error",
			});
		}
	}

	const found = results.filter((r) => r.imageFound).length;
	const failed = results.filter((r) => !r.imageFound).length;

	if (!dryRun && found > 0) {
		revalidateTimeline();
	}

	return NextResponse.json({
		total: needsMedia.length,
		imagesFound: found,
		imagesMissing: failed,
		dryRun,
		results,
	});
}
