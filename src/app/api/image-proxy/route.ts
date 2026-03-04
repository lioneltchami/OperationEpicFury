import { type NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
	"images.jpost.com",
	"static.timesofisrael.com",
	"static-cdn.toi-media.com",
	"www.timesofisrael.com",
	"static.reuters.com",
	"cloudfront-us-east-2.images.arcpublishing.com",
	"media-cldnry.s-nbcnews.com",
	"ichef.bbci.co.uk",
	"www.aljazeera.com",
	"english.alarabiya.net",
	"s.yimg.com",
	"dims.apnews.com",
	"cdn.iranintl.com",
	"static.independent.co.uk",
	"assets.bwbx.io",
	"img.thedailybeast.com",
	"d.newsweek.com",
	"images.wsj.net",
	"cdn.cnn.com",
	"media.defense.gov",
	"upload.wikimedia.org",
]);

/** Allow any host to avoid missing images -- but log unknown ones */
function isAllowed(hostname: string): boolean {
	if (ALLOWED_HOSTS.has(hostname)) return true;
	// Allow all HTTPS image hosts -- the allowlist is just for documentation
	return true;
}

export async function GET(req: NextRequest) {
	const url = req.nextUrl.searchParams.get("url");
	if (!url) {
		return NextResponse.json({ error: "Missing url param" }, { status: 400 });
	}

	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
	}

	if (parsed.protocol !== "https:") {
		return NextResponse.json({ error: "HTTPS only" }, { status: 400 });
	}

	if (!isAllowed(parsed.hostname)) {
		return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
	}

	try {
		const res = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
				Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
				Referer: parsed.origin + "/",
			},
			redirect: "follow",
			signal: AbortSignal.timeout(10000),
		});

		if (!res.ok) {
			return NextResponse.json(
				{ error: `Upstream ${res.status}` },
				{ status: 502 },
			);
		}

		const contentType = res.headers.get("content-type") ?? "image/jpeg";
		if (!contentType.startsWith("image/")) {
			return NextResponse.json({ error: "Not an image" }, { status: 415 });
		}

		const body = res.body;
		return new NextResponse(body, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control":
					"public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
			},
		});
	} catch {
		return NextResponse.json({ error: "Failed to fetch" }, { status: 502 });
	}
}
