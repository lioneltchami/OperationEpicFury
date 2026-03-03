import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { getPublishedEvents } from "@/lib/kv";
import { SITE_URL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const events = await getPublishedEvents();

	const entries: MetadataRoute.Sitemap = [];

	// Home pages
	for (const locale of locales) {
		entries.push({
			url: `${SITE_URL}/${locale}`,
			lastModified: new Date(),
			changeFrequency: "hourly",
			priority: 1.0,
		});
	}

	// Event pages
	for (const event of events) {
		if (!event.slug) continue;
		for (const locale of locales) {
			entries.push({
				url: `${SITE_URL}/${locale}/events/${event.slug}`,
				lastModified: new Date(),
				changeFrequency: "weekly",
				priority: 0.8,
			});
		}
	}

	return entries;
}
