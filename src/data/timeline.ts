export type EventCategory =
  | "strike"
  | "retaliation"
  | "announcement"
  | "casualty"
  | "world-reaction"
  | "breaking"
  | "breaking-important";

export interface MediaItem {
  fileId: string;
  type: "photo" | "video";
  url?: string;
  thumbnailFileId?: string;
  width?: number;
  height?: number;
  duration?: number;
  mimeType?: string;
}

export type ConfidenceLevel = "confirmed" | "unconfirmed" | "disputed";

export type SourceRegion = "us" | "eu" | "middle-east" | "asia" | "other";

export interface EventSource {
  name: string;
  url: string;
  region?: SourceRegion;
}

export interface EventLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface TimelineEvent {
  id: string;
  timeET: string;
  headline: string;
  body: string;
  category: EventCategory;
  source: string;
  sourceUrl: string;
  breaking?: boolean;
  headline_fa?: string;
  body_fa?: string;
  status?: "draft" | "published";
  slug?: string;
  media?: MediaItem[];
  confidence?: ConfidenceLevel;
  sourceRegion?: SourceRegion;
  sources?: EventSource[];
  location?: EventLocation;
}
