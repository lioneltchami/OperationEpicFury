import type { MediaItem, TimelineEvent } from "@/data/timeline";
import { getRedis, isRedisAvailable } from "@/lib/redis";
import { deindexEvent, indexEvent } from "@/lib/search";

// New structure:
//   HASH  "events:data"          — id → JSON(event)
//   ZSET  "events:index"         — score=timeET as sortable string, member=id
//   HASH  "events:slugs"         — slug → id
// Legacy (read-only, kept for migration):
//   STRING "timeline:events"     — JSON array of all events

const HASH_KEY = "events:data";
const INDEX_KEY = "events:index";
const SLUG_KEY = "events:slugs";
const PUBLISHED_KEY = "events:published";
const LEGACY_KEY = "timeline:events";

/** Convert timeET string to a numeric score for sorted set ordering. */
export function timeScore(timeET: string | undefined): number {
  if (!timeET) return 0;
  // "YYYY-MM-DD HH:MM" → remove non-digits → number
  // e.g. "2026-03-01 14:30" → 202603011430
  return parseInt(timeET.replace(/\D/g, ""), 10) || 0;
}

// ─── Read operations ───

export async function getAllEvents(): Promise<TimelineEvent[]> {
  if (!isRedisAvailable()) return [];
  const redis = getRedis();

  // Check if new structure exists
  const count = await redis.hlen(HASH_KEY);
  if (count > 0) {
    // Use sorted set for ordering, hash for data
    const ids = await redis.zrange(INDEX_KEY, 0, -1);
    if (ids.length === 0) return [];
    const pipeline = redis.pipeline();
    for (const id of ids) {
      pipeline.hget(HASH_KEY, id);
    }
    const results = await pipeline.exec();
    const events: TimelineEvent[] = [];
    for (const result of results ?? []) {
      const [err, raw] = result;
      if (!err && raw) {
        events.push(JSON.parse(raw as string) as TimelineEvent);
      }
    }
    return events;
  }

  // Fallback to legacy single-key format
  const raw = await redis.get(LEGACY_KEY);
  if (!raw) return [];
  const events = JSON.parse(raw) as TimelineEvent[];
  events.sort((a, b) => (a.timeET ?? "").localeCompare(b.timeET ?? ""));
  return events;
}

export async function getPublishedEvents(): Promise<TimelineEvent[]> {
  const events = await getAllEvents();
  return events.filter(
    (e) => e.timeET && (!e.status || e.status === "published"),
  );
}

export async function getPublishedEventsPaginated(
  offset: number,
  limit: number,
): Promise<{ events: TimelineEvent[]; total: number }> {
  if (!isRedisAvailable()) return { events: [], total: 0 };
  const redis = getRedis();

  // Use dedicated published index for exact count and efficient pagination
  const total = await redis.zcard(PUBLISHED_KEY);
  if (total === 0) return { events: [], total: 0 };

  // Direct pagination -- no draft filtering needed since PUBLISHED_KEY only contains published events
  const ids = await redis.zrevrange(PUBLISHED_KEY, offset, offset + limit - 1);
  if (ids.length === 0) return { events: [], total };

  const pipeline = redis.pipeline();
  for (const id of ids) {
    pipeline.hget(HASH_KEY, id);
  }
  const results = await pipeline.exec();

  const events: TimelineEvent[] = [];
  for (const result of results ?? []) {
    const [err, raw] = result;
    if (!err && raw) {
      events.push(JSON.parse(raw as string) as TimelineEvent);
    }
  }

  return { events, total };
}

export async function getDraftEvents(): Promise<TimelineEvent[]> {
  const events = await getAllEvents();
  return events.filter((e) => e.status === "draft");
}

export async function getEventById(
  id: string,
): Promise<TimelineEvent | undefined> {
  if (!isRedisAvailable()) return undefined;
  const redis = getRedis();

  // Try new structure first (O(1))
  const raw = await redis.hget(HASH_KEY, id);
  if (raw) return JSON.parse(raw) as TimelineEvent;

  // Fallback to legacy
  const legacyRaw = await redis.get(LEGACY_KEY);
  if (!legacyRaw) return undefined;
  const events = JSON.parse(legacyRaw) as TimelineEvent[];
  return events.find((e) => e.id === id);
}

export async function getEventBySlug(
  slug: string,
): Promise<TimelineEvent | undefined> {
  if (!isRedisAvailable()) return undefined;
  const redis = getRedis();

  // Try slug index first (O(1))
  const id = await redis.hget(SLUG_KEY, slug);
  if (id) {
    const raw = await redis.hget(HASH_KEY, id);
    if (raw) {
      const event = JSON.parse(raw) as TimelineEvent;
      // Only return published events
      if (event.timeET && (!event.status || event.status === "published")) {
        return event;
      }
    }
    return undefined;
  }

  // Fallback to legacy
  const events = await getPublishedEvents();
  return events.find((e) => e.slug === slug);
}

export async function getAdjacentEvents(
  slug: string,
): Promise<{ prev: TimelineEvent | null; next: TimelineEvent | null }> {
  if (!isRedisAvailable()) return { prev: null, next: null };
  const redis = getRedis();

  // Resolve slug -> id
  const id = await redis.hget(SLUG_KEY, slug);
  if (!id) {
    // Fallback to full scan for legacy data
    const events = await getPublishedEvents();
    const idx = events.findIndex((e) => e.slug === slug);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? events[idx - 1] : null,
      next: idx < events.length - 1 ? events[idx + 1] : null,
    };
  }

  // Get rank in sorted set
  const rank = await redis.zrank(INDEX_KEY, id);
  if (rank === null) return { prev: null, next: null };

  // Fetch neighbors: rank-1 (prev) and rank+1 (next) in time order
  const prevId =
    rank > 0 ? (await redis.zrange(INDEX_KEY, rank - 1, rank - 1))[0] : null;
  const nextId = (await redis.zrange(INDEX_KEY, rank + 1, rank + 1))[0] ?? null;

  const [prevRaw, nextRaw] = await Promise.all([
    prevId ? redis.hget(HASH_KEY, prevId) : null,
    nextId ? redis.hget(HASH_KEY, nextId) : null,
  ]);

  const prev = prevRaw ? (JSON.parse(prevRaw) as TimelineEvent) : null;
  const next = nextRaw ? (JSON.parse(nextRaw) as TimelineEvent) : null;

  // Filter: only return published events with slugs
  return {
    prev: prev && prev.slug && prev.status !== "draft" ? prev : null,
    next: next && next.slug && next.status !== "draft" ? next : null,
  };
}

// ─── Write operations ───

export async function setAllEvents(events: TimelineEvent[]): Promise<void> {
  const redis = getRedis();
  const pipeline = redis.pipeline();

  // Clear existing new-structure keys
  pipeline.del(HASH_KEY, INDEX_KEY, SLUG_KEY, PUBLISHED_KEY);

  // Write each event to hash + sorted set + slug index
  for (const event of events) {
    pipeline.hset(HASH_KEY, event.id, JSON.stringify(event));
    pipeline.zadd(INDEX_KEY, timeScore(event.timeET).toString(), event.id);
    if (event.slug) {
      pipeline.hset(SLUG_KEY, event.slug, event.id);
    }
    if (event.status !== "draft") {
      pipeline.zadd(
        PUBLISHED_KEY,
        timeScore(event.timeET).toString(),
        event.id,
      );
    }
  }

  // Also update legacy key for backward compatibility during rollout
  events.sort((a, b) => (a.timeET ?? "").localeCompare(b.timeET ?? ""));
  pipeline.set(LEGACY_KEY, JSON.stringify(events));

  await pipeline.exec();
}

export async function addEvent(event: TimelineEvent): Promise<void> {
  if (!event.createdAt) {
    event.createdAt = new Date().toISOString();
  }

  const redis = getRedis();
  const pipeline = redis.pipeline();

  // Atomic write to hash + sorted set + slug index
  pipeline.hset(HASH_KEY, event.id, JSON.stringify(event));
  pipeline.zadd(INDEX_KEY, timeScore(event.timeET).toString(), event.id);
  if (event.slug) {
    pipeline.hset(SLUG_KEY, event.slug, event.id);
  }
  // Maintain published index for non-draft events
  if (event.status !== "draft") {
    pipeline.zadd(PUBLISHED_KEY, timeScore(event.timeET).toString(), event.id);
  }

  await pipeline.exec();
  await indexEvent(event);
}

export async function updateEvent(
  id: string,
  data: Partial<TimelineEvent>,
): Promise<TimelineEvent | null> {
  const redis = getRedis();

  const raw = await redis.hget(HASH_KEY, id);
  if (!raw) {
    // Fallback: try legacy, then migrate
    const legacyRaw = await redis.get(LEGACY_KEY);
    if (!legacyRaw) return null;
    const events = JSON.parse(legacyRaw) as TimelineEvent[];
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    events[idx] = { ...events[idx], ...data, id };
    await setAllEvents(events);
    return events[idx];
  }

  const existing = JSON.parse(raw) as TimelineEvent;
  const oldSlug = existing.slug;
  const updated = { ...existing, ...data, id };
  updated.updatedAt = new Date().toISOString();

  const pipeline = redis.pipeline();
  pipeline.hset(HASH_KEY, id, JSON.stringify(updated));

  // Update sorted set score if timeET changed
  if (data.timeET) {
    pipeline.zadd(INDEX_KEY, timeScore(updated.timeET).toString(), id);
  }

  // Update slug index if slug changed
  if (data.slug && data.slug !== oldSlug) {
    if (oldSlug) pipeline.hdel(SLUG_KEY, oldSlug);
    pipeline.hset(SLUG_KEY, data.slug, id);
  }

  // Maintain published index
  if (updated.status === "draft") {
    pipeline.zrem(PUBLISHED_KEY, id);
  } else {
    pipeline.zadd(PUBLISHED_KEY, timeScore(updated.timeET).toString(), id);
  }

  await pipeline.exec();
  await indexEvent(updated);
  return updated;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const redis = getRedis();

  const raw = await redis.hget(HASH_KEY, id);
  if (!raw) {
    // Fallback: try legacy
    const legacyRaw = await redis.get(LEGACY_KEY);
    if (!legacyRaw) return false;
    const events = JSON.parse(legacyRaw) as TimelineEvent[];
    const filtered = events.filter((e) => e.id !== id);
    if (filtered.length === events.length) return false;
    await setAllEvents(filtered);
    return true;
  }

  const event = JSON.parse(raw) as TimelineEvent;
  const pipeline = redis.pipeline();
  pipeline.hdel(HASH_KEY, id);
  pipeline.zrem(INDEX_KEY, id);
  pipeline.zrem(PUBLISHED_KEY, id);
  if (event.slug) {
    pipeline.hdel(SLUG_KEY, event.slug);
  }
  await pipeline.exec();
  await deindexEvent(event);
  return true;
}

// ─── Migration ───

/**
 * Migrate from legacy single-key format to new hash + sorted set structure.
 * Safe to run multiple times (idempotent).
 * Returns the number of events migrated.
 */
export async function migrateToNewStructure(): Promise<{
  migrated: number;
  alreadyMigrated: boolean;
}> {
  const redis = getRedis();

  // Check if already migrated
  const newCount = await redis.hlen(HASH_KEY);
  if (newCount > 0) {
    return { migrated: newCount, alreadyMigrated: true };
  }

  // Read from legacy key
  const raw = await redis.get(LEGACY_KEY);
  if (!raw) return { migrated: 0, alreadyMigrated: false };

  const events = JSON.parse(raw) as TimelineEvent[];
  if (events.length === 0) return { migrated: 0, alreadyMigrated: false };

  // Write to new structure
  const pipeline = redis.pipeline();
  for (const event of events) {
    pipeline.hset(HASH_KEY, event.id, JSON.stringify(event));
    pipeline.zadd(INDEX_KEY, timeScore(event.timeET).toString(), event.id);
    if (event.slug) {
      pipeline.hset(SLUG_KEY, event.slug, event.id);
    }
  }
  await pipeline.exec();

  // Verify
  const verifyCount = await redis.hlen(HASH_KEY);
  if (verifyCount !== events.length) {
    // Rollback
    await redis.del(HASH_KEY, INDEX_KEY, SLUG_KEY);
    throw new Error(
      `Migration verification failed: expected ${events.length}, got ${verifyCount}`,
    );
  }

  return { migrated: events.length, alreadyMigrated: false };
}

// ─── Media buffer (unchanged) ───

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
