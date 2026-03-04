import type {
	ConfidenceLevel,
	EventCategory,
	EventLocation,
	EventSource,
	MediaItem,
	SourceRegion,
	TimelineEvent,
} from "@/data/timeline";

const VALID_CATEGORIES: EventCategory[] = [
	"strike",
	"retaliation",
	"announcement",
	"casualty",
	"world-reaction",
	"breaking",
	"breaking-important",
];

const VALID_CONFIDENCE: ConfidenceLevel[] = [
	"confirmed",
	"unconfirmed",
	"disputed",
];
const VALID_SOURCE_REGIONS: SourceRegion[] = [
	"us",
	"eu",
	"middle-east",
	"asia",
	"other",
];

const MAX_HEADLINE = 500;
const MAX_BODY = 10000;
const MAX_SOURCE = 200;
const MAX_SOURCE_URL = 2000;
const MAX_MEDIA_COUNT = 10;

// Loose check: "YYYY-MM-DD HH:MM" format
const TIME_ET_RE = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/;

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validate and sanitize event input for creation.
 * Returns a cleaned event body with only known fields, or an error.
 */
export function validateEventInput(
	body: unknown,
):
	| { valid: true; data: Omit<TimelineEvent, "id" | "slug"> }
	| { valid: false; error: string } {
	if (!body || typeof body !== "object") {
		return { valid: false, error: "Request body must be a JSON object" };
	}

	const b = body as Record<string, unknown>;

	// Required fields
	if (typeof b.headline !== "string" || b.headline.trim().length === 0) {
		return { valid: false, error: "headline is required" };
	}
	if (b.headline.length > MAX_HEADLINE) {
		return {
			valid: false,
			error: `headline must be ${MAX_HEADLINE} characters or less`,
		};
	}

	const bodyText = typeof b.body === "string" ? b.body : "";
	if (bodyText.length > MAX_BODY) {
		return {
			valid: false,
			error: `body must be ${MAX_BODY} characters or less`,
		};
	}

	if (
		typeof b.category !== "string" ||
		!VALID_CATEGORIES.includes(b.category as EventCategory)
	) {
		return {
			valid: false,
			error: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
		};
	}

	if (typeof b.timeET !== "string" || !TIME_ET_RE.test(b.timeET)) {
		return { valid: false, error: "timeET must be in format YYYY-MM-DD HH:MM" };
	}

	if (typeof b.source !== "string" || b.source.trim().length === 0) {
		return { valid: false, error: "source is required" };
	}
	if (b.source.length > MAX_SOURCE) {
		return {
			valid: false,
			error: `source must be ${MAX_SOURCE} characters or less`,
		};
	}

	if (typeof b.sourceUrl !== "string") {
		return { valid: false, error: "sourceUrl is required" };
	}
	if (b.sourceUrl.length > MAX_SOURCE_URL) {
		return {
			valid: false,
			error: `sourceUrl must be ${MAX_SOURCE_URL} characters or less`,
		};
	}

	// Build sanitized output with only known fields
	const data: Omit<TimelineEvent, "id" | "slug"> = {
		timeET: b.timeET as string,
		headline: b.headline as string,
		body: bodyText,
		category: b.category as EventCategory,
		source: b.source as string,
		sourceUrl: b.sourceUrl as string,
	};

	// Optional fields
	if (typeof b.breaking === "boolean") {
		data.breaking = b.breaking;
	}
	if (
		typeof b.headline_fr === "string" &&
		b.headline_fr.length <= MAX_HEADLINE
	) {
		data.headline_fr = b.headline_fr;
	}
	if (typeof b.body_fr === "string" && b.body_fr.length <= MAX_BODY) {
		data.body_fr = b.body_fr;
	}
	if (b.status === "draft" || b.status === "published") {
		data.status = b.status;
	}
	if (Array.isArray(b.media)) {
		if (b.media.length > MAX_MEDIA_COUNT) {
			return {
				valid: false,
				error: `Maximum ${MAX_MEDIA_COUNT} media items allowed`,
			};
		}
		data.media = validateMedia(b.media);
	}
	if (
		typeof b.confidence === "string" &&
		VALID_CONFIDENCE.includes(b.confidence as ConfidenceLevel)
	) {
		data.confidence = b.confidence as ConfidenceLevel;
	}
	if (
		typeof b.sourceRegion === "string" &&
		VALID_SOURCE_REGIONS.includes(b.sourceRegion as SourceRegion)
	) {
		data.sourceRegion = b.sourceRegion as SourceRegion;
	}
	if (Array.isArray(b.sources)) {
		data.sources = validateSources(b.sources);
	}
	if (b.location != null) {
		const loc = validateLocation(b.location);
		if (loc) data.location = loc;
	}
	if (typeof b.createdAt === "string") data.createdAt = b.createdAt;
	if (typeof b.updatedAt === "string") data.updatedAt = b.updatedAt;
	if (typeof b.publishedAt === "string") data.publishedAt = b.publishedAt;

	return { valid: true, data };
}

/**
 * Validate and sanitize a partial event update.
 * Only validates fields that are present; strips unknown fields.
 */
export function validateEventUpdate(
	body: unknown,
):
	| { valid: true; data: Partial<TimelineEvent> }
	| { valid: false; error: string } {
	if (!body || typeof body !== "object") {
		return { valid: false, error: "Request body must be a JSON object" };
	}

	const b = body as Record<string, unknown>;
	const data: Partial<TimelineEvent> = {};

	if ("headline" in b) {
		if (typeof b.headline !== "string" || b.headline.trim().length === 0) {
			return { valid: false, error: "headline must be a non-empty string" };
		}
		if (b.headline.length > MAX_HEADLINE) {
			return {
				valid: false,
				error: `headline must be ${MAX_HEADLINE} characters or less`,
			};
		}
		data.headline = b.headline;
	}

	if ("body" in b) {
		if (typeof b.body !== "string") {
			return { valid: false, error: "body must be a string" };
		}
		if (b.body.length > MAX_BODY) {
			return {
				valid: false,
				error: `body must be ${MAX_BODY} characters or less`,
			};
		}
		data.body = b.body;
	}

	if ("category" in b) {
		if (
			typeof b.category !== "string" ||
			!VALID_CATEGORIES.includes(b.category as EventCategory)
		) {
			return {
				valid: false,
				error: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
			};
		}
		data.category = b.category as EventCategory;
	}

	if ("timeET" in b) {
		if (typeof b.timeET !== "string" || !TIME_ET_RE.test(b.timeET)) {
			return {
				valid: false,
				error: "timeET must be in format YYYY-MM-DD HH:MM",
			};
		}
		data.timeET = b.timeET;
	}

	if ("source" in b) {
		if (typeof b.source !== "string" || b.source.length > MAX_SOURCE) {
			return {
				valid: false,
				error: `source must be a string of ${MAX_SOURCE} characters or less`,
			};
		}
		data.source = b.source;
	}

	if ("sourceUrl" in b) {
		if (
			typeof b.sourceUrl !== "string" ||
			b.sourceUrl.length > MAX_SOURCE_URL
		) {
			return {
				valid: false,
				error: `sourceUrl must be a string of ${MAX_SOURCE_URL} characters or less`,
			};
		}
		data.sourceUrl = b.sourceUrl;
	}

	if ("breaking" in b) {
		if (typeof b.breaking === "boolean") {
			data.breaking = b.breaking;
		}
	}

	if ("headline_fr" in b) {
		if (
			typeof b.headline_fr === "string" &&
			b.headline_fr.length <= MAX_HEADLINE
		) {
			data.headline_fr = b.headline_fr;
		}
	}

	if ("body_fr" in b) {
		if (typeof b.body_fr === "string" && b.body_fr.length <= MAX_BODY) {
			data.body_fr = b.body_fr;
		}
	}

	if ("status" in b) {
		if (b.status === "draft" || b.status === "published") {
			data.status = b.status;
		}
	}

	if ("media" in b) {
		if (Array.isArray(b.media)) {
			if (b.media.length > MAX_MEDIA_COUNT) {
				return {
					valid: false,
					error: `Maximum ${MAX_MEDIA_COUNT} media items allowed`,
				};
			}
			data.media = validateMedia(b.media);
		}
	}

	if ("slug" in b) {
		if (typeof b.slug === "string") {
			data.slug = b.slug;
		}
	}

	if ("confidence" in b) {
		if (
			typeof b.confidence === "string" &&
			VALID_CONFIDENCE.includes(b.confidence as ConfidenceLevel)
		) {
			data.confidence = b.confidence as ConfidenceLevel;
		}
	}

	if ("sourceRegion" in b) {
		if (
			typeof b.sourceRegion === "string" &&
			VALID_SOURCE_REGIONS.includes(b.sourceRegion as SourceRegion)
		) {
			data.sourceRegion = b.sourceRegion as SourceRegion;
		}
	}

	if ("sources" in b) {
		if (Array.isArray(b.sources)) {
			data.sources = validateSources(b.sources);
		}
	}

	if ("location" in b) {
		if (b.location == null) {
			data.location = undefined;
		} else {
			const loc = validateLocation(b.location);
			if (loc) data.location = loc;
		}
	}
	if (typeof b.createdAt === "string") data.createdAt = b.createdAt;
	if (typeof b.updatedAt === "string") data.updatedAt = b.updatedAt;
	if (typeof b.publishedAt === "string") data.publishedAt = b.publishedAt;

	return { valid: true, data };
}

/** Validate a location object. Returns null if invalid. */
function validateLocation(input: unknown): EventLocation | null {
	if (!input || typeof input !== "object") return null;
	const loc = input as Record<string, unknown>;
	if (typeof loc.lat !== "number" || loc.lat < -90 || loc.lat > 90) return null;
	if (typeof loc.lng !== "number" || loc.lng < -180 || loc.lng > 180)
		return null;
	if (
		typeof loc.name !== "string" ||
		loc.name.length === 0 ||
		loc.name.length > 500
	)
		return null;
	return { lat: loc.lat, lng: loc.lng, name: loc.name };
}

/** Filter sources array to only valid items with known fields. */
function validateSources(items: unknown[]): EventSource[] {
	return items
		.filter(
			(item): item is Record<string, unknown> =>
				item !== null &&
				typeof item === "object" &&
				typeof (item as Record<string, unknown>).name === "string" &&
				typeof (item as Record<string, unknown>).url === "string",
		)
		.slice(0, 20) // cap at 20 sources per event
		.map((item) => {
			const src: EventSource = {
				name: (item.name as string).slice(0, 200),
				url: (item.url as string).slice(0, 2000),
			};
			if (
				typeof item.region === "string" &&
				VALID_SOURCE_REGIONS.includes(item.region as SourceRegion)
			) {
				src.region = item.region as SourceRegion;
			}
			return src;
		});
}

/** Filter media array to only valid items with known fields. */
function validateMedia(items: unknown[]): MediaItem[] {
	return items
		.filter(
			(item): item is Record<string, unknown> =>
				item !== null && typeof item === "object",
		)
		.map((item) => {
			const media: MediaItem = {
				fileId: typeof item.fileId === "string" ? item.fileId : "",
				type: item.type === "video" ? "video" : "photo",
			};
			if (typeof item.url === "string") media.url = item.url;
			if (typeof item.thumbnailFileId === "string")
				media.thumbnailFileId = item.thumbnailFileId;
			if (typeof item.width === "number") media.width = item.width;
			if (typeof item.height === "number") media.height = item.height;
			if (typeof item.duration === "number") media.duration = item.duration;
			if (typeof item.mimeType === "string") media.mimeType = item.mimeType;
			if (typeof item.caption === "string")
				media.caption = item.caption.slice(0, 500);
			return media;
		});
}
