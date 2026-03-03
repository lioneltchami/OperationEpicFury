import { getPublishedEvents } from "@/lib/kv";
import type { TimelineEvent } from "@/data/timeline";

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
}

export async function searchEvents(
  query: string,
  limit: number = 20,
): Promise<TimelineEvent[]> {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const events = await getPublishedEvents();

  const scored = events
    .map((event) => {
      const haystack = [
        event.headline,
        event.body,
        event.headline_fa,
        event.body_fa,
        event.source,
        event.category,
      ]
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
    .sort((a, b) => b.score - a.score || b.event.timeET.localeCompare(a.event.timeET));

  return scored.slice(0, limit).map((s) => s.event);
}
