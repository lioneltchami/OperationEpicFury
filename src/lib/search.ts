import { getRedis } from "@/lib/redis";
import { getPublishedEvents } from "@/lib/kv";
import type { TimelineEvent } from "@/data/timeline";

const INDEX_PREFIX = "search:tok:";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function eventTokens(event: TimelineEvent): string[] {
  const text = [event.headline, event.body, event.headline_fa, event.body_fa, event.source, event.category]
    .filter(Boolean)
    .join(" ");
  return [...new Set(tokenize(text))];
}

/** Index a single event's tokens in Redis. Call on add/update. */
export async function indexEvent(event: TimelineEvent): Promise<void> {
  if (event.status === "draft") return;
  const redis = getRedis();
  const tokens = eventTokens(event);
  if (!tokens.length) return;
  const pipeline = redis.pipeline();
  for (const token of tokens) {
    pipeline.sadd(`${INDEX_PREFIX}${token}`, event.id);
  }
  await pipeline.exec();
}

/** Remove an event from the search index. Call on delete. */
export async function deindexEvent(event: TimelineEvent): Promise<void> {
  const redis = getRedis();
  const tokens = eventTokens(event);
  if (!tokens.length) return;
  const pipeline = redis.pipeline();
  for (const token of tokens) {
    pipeline.srem(`${INDEX_PREFIX}${token}`, event.id);
  }
  await pipeline.exec();
}

export async function searchEvents(
  query: string,
  limit: number = 20,
): Promise<TimelineEvent[]> {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const redis = getRedis();

  // Check if index exists by testing all token keys
  const keys = tokens.map((t) => `${INDEX_PREFIX}${t}`);
  const existCounts = await redis.exists(...keys);

  if (existCounts > 0) {
    return searchViaIndex(tokens, limit, redis);
  }

  // Fallback: full scan
  return searchFullScan(tokens, limit);
}

async function searchViaIndex(
  tokens: string[],
  limit: number,
  redis: ReturnType<typeof getRedis>,
): Promise<TimelineEvent[]> {
  // Get event IDs for each token
  const sets = await Promise.all(tokens.map((t) => redis.smembers(`${INDEX_PREFIX}${t}`)));

  // Score by number of matching tokens
  const scores = new Map<string, number>();
  for (const ids of sets) {
    for (const id of ids) {
      scores.set(id, (scores.get(id) ?? 0) + 1);
    }
  }

  // Sort by score desc, take top candidates
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit * 2);

  if (!ranked.length) return [];

  // Fetch actual events
  const ids = ranked.map(([id]) => id);
  const raws = await redis.hmget("events:data", ...ids);

  const events: { event: TimelineEvent; score: number }[] = [];
  for (let i = 0; i < raws.length; i++) {
    if (!raws[i]) continue;
    const event = JSON.parse(raws[i]!) as TimelineEvent;
    if (event.status === "draft") continue;
    events.push({ event, score: ranked[i][1] });
  }

  return events
    .sort((a, b) => b.score - a.score || b.event.timeET.localeCompare(a.event.timeET))
    .slice(0, limit)
    .map((s) => s.event);
}

async function searchFullScan(tokens: string[], limit: number): Promise<TimelineEvent[]> {
  const events = await getPublishedEvents();

  return events
    .map((event) => {
      const haystack = [event.headline, event.body, event.headline_fa, event.body_fa, event.source, event.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (haystack.includes(token)) score++;
      }
      return { event, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.event.timeET.localeCompare(a.event.timeET))
    .slice(0, limit)
    .map((s) => s.event);
}
