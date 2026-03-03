import { getRedis } from "@/lib/redis";
import type { TimelineEvent, MediaItem } from "@/data/timeline";

const KEY = "timeline:events";

export async function getAllEvents(): Promise<TimelineEvent[]> {
  const redis = getRedis();
  const raw = await redis.get(KEY);
  if (!raw) return [];
  const events = JSON.parse(raw) as TimelineEvent[];
  events.sort((a, b) => (a.timeET ?? "").localeCompare(b.timeET ?? ""));
  return events;
}

export async function getPublishedEvents(): Promise<TimelineEvent[]> {
  const events = await getAllEvents();
  return events.filter((e) => e.timeET && (!e.status || e.status === "published"));
}

export async function getPublishedEventsPaginated(
  offset: number,
  limit: number,
): Promise<{ events: TimelineEvent[]; total: number }> {
  const all = await getPublishedEvents();
  return { events: all.slice(offset, offset + limit), total: all.length };
}

export async function getDraftEvents(): Promise<TimelineEvent[]> {
  const events = await getAllEvents();
  return events.filter((e) => e.status === "draft");
}

export async function getEventById(
  id: string,
): Promise<TimelineEvent | undefined> {
  const events = await getAllEvents();
  return events.find((e) => e.id === id);
}

export async function getEventBySlug(
  slug: string,
): Promise<TimelineEvent | undefined> {
  const events = await getPublishedEvents();
  return events.find((e) => e.slug === slug);
}

export async function getAdjacentEvents(
  slug: string,
): Promise<{ prev: TimelineEvent | null; next: TimelineEvent | null }> {
  const events = await getPublishedEvents();
  const idx = events.findIndex((e) => e.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? events[idx - 1] : null,
    next: idx < events.length - 1 ? events[idx + 1] : null,
  };
}

export async function setAllEvents(events: TimelineEvent[]): Promise<void> {
  const redis = getRedis();
  await redis.set(KEY, JSON.stringify(events));
}

export async function addEvent(event: TimelineEvent): Promise<void> {
  const events = await getAllEvents();
  events.push(event);
  events.sort((a, b) => (a.timeET ?? "").localeCompare(b.timeET ?? ""));
  await setAllEvents(events);
}

export async function updateEvent(
  id: string,
  data: Partial<TimelineEvent>,
): Promise<TimelineEvent | null> {
  const events = await getAllEvents();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  events[idx] = { ...events[idx], ...data, id };
  await setAllEvents(events);
  return events[idx];
}

export async function deleteEvent(id: string): Promise<boolean> {
  const events = await getAllEvents();
  const filtered = events.filter((e) => e.id !== id);
  if (filtered.length === events.length) return false;
  await setAllEvents(filtered);
  return true;
}

const MEDIA_BUFFER_PREFIX = "media_buffer:";

export async function bufferMediaItem(
  mediaGroupId: string,
  item: MediaItem,
): Promise<number> {
  const redis = getRedis();
  const key = `${MEDIA_BUFFER_PREFIX}${mediaGroupId}`;
  const raw = await redis.get(key);
  const items: MediaItem[] = raw ? JSON.parse(raw) : [];
  items.push(item);
  await redis.set(key, JSON.stringify(items), "EX", 600);
  return items.length;
}

export async function getBufferedMedia(
  mediaGroupId: string,
): Promise<MediaItem[]> {
  const redis = getRedis();
  const key = `${MEDIA_BUFFER_PREFIX}${mediaGroupId}`;
  const raw = await redis.get(key);
  if (!raw) return [];
  await redis.del(key);
  return JSON.parse(raw) as MediaItem[];
}
