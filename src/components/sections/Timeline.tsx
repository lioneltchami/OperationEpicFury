"use client";

import { m } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { TimelineEntry } from "@/components/ui/TimelineEntry";
import { TracingBeam } from "@/components/ui/TracingBeam";
import type {
  EventCategory,
  SourceRegion,
  TimelineEvent,
} from "@/data/timeline";
import { useLocale } from "@/i18n/LocaleContext";
import { useTimelineEvents } from "@/hooks/use-realtime-data";

const EAGER_COUNT = 20;

const CATEGORIES: EventCategory[] = [
  "strike",
  "retaliation",
  "announcement",
  "casualty",
  "world-reaction",
  "breaking",
  "breaking-important",
];

const SOURCE_REGIONS: { key: SourceRegion; labelKey: string }[] = [
  { key: "us", labelKey: "sourceUS" },
  { key: "eu", labelKey: "sourceEU" },
  { key: "middle-east", labelKey: "sourceME" },
  { key: "asia", labelKey: "sourceAsia" },
  { key: "other", labelKey: "sourceOther" },
];

interface TimelineProps {
  initialEvents: TimelineEvent[];
  totalEvents: number;
  pageSize: number;
}

export const Timeline = ({
  initialEvents,
  totalEvents,
  pageSize,
}: TimelineProps) => {
  const { dict, locale } = useLocale();
  const isFr = locale === "fr";
  const monoClass = isFr ? "" : "font-mono";
  const catLabels = dict.categories as Record<string, string>;
  const timelineDict = dict.timeline as Record<string, string>;

  const [allEvents, setAllEvents] = useState(initialEvents);
  const { data: liveEvents } = useTimelineEvents();

  // Merge live updates
  useEffect(() => {
    if (liveEvents && Array.isArray(liveEvents)) {
      const newestFirst = [...liveEvents].reverse();
      setAllEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const toAdd = newestFirst.filter((e) => !existingIds.has(e.id));
        if (toAdd.length === 0) return prev;
        // Prepend new arrivals to the top
        return [...toAdd, ...prev];
      });
    }
  }, [liveEvents]);
  const [filter, setFilter] = useState<EventCategory | null>(null);
  const [regionFilter, setRegionFilter] = useState<SourceRegion | null>(null);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const hasMore = !filter && !regionFilter && allEvents.length < totalEvents;
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Cache initial events for offline reading via the SW's data cache
  useEffect(() => {
    if (!("caches" in window) || !initialEvents.length) return;
    caches.open("data-v1").then((cache) => {
      const url =
        "/api/events/published?offset=0&limit=" + initialEvents.length;
      const body = JSON.stringify({
        events: [...initialEvents].reverse(),
        total: totalEvents,
      });
      cache.put(
        url,
        new Response(body, { headers: { "Content-Type": "application/json" } }),
      );
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = allEvents.filter((e) => {
    if (filter && e.category !== filter) return false;
    if (regionFilter && e.sourceRegion !== regionFilter) return false;
    return true;
  });

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const loaded = allEvents.length;
      const remaining = totalEvents - loaded;
      const nextBatch = Math.min(pageSize, remaining);
      const offset = remaining - nextBatch;

      const res = await fetch(
        `/api/events/published?offset=${offset}&limit=${nextBatch}`,
      );
      if (res.ok) {
        const data = await res.json();
        const newEvents = [...data.events].reverse();
        setAllEvents((prev) => [...prev, ...newEvents]);
        setAnnouncement(`${newEvents.length} more events loaded`);
      }
    } catch {
      // Silently fail — user can scroll again to retry
    } finally {
      setLoading(false);
    }
  }, [allEvents.length, totalEvents, pageSize, loading, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <section className="relative py-16 md:py-24 bg-black">
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        {/* Section header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            {timelineDict.title}
          </h2>
          <p className={`text-zinc-500 ${monoClass} text-sm tracking-wider`}>
            {timelineDict.subtitle}
          </p>
          <div className="mt-6 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
        </m.div>

        {/* Search bar */}
        <div className="mb-6">
          <SearchBar />
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:outline-none ${!filter
                ? "bg-red-500/20 text-red-400 border-red-500/40"
                : "text-zinc-500 border-zinc-800 hover:border-zinc-600"
              }`}
          >
            {timelineDict.all}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(filter === cat ? null : cat)}
              className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:outline-none ${filter === cat
                  ? "bg-red-500/20 text-red-400 border-red-500/40"
                  : "text-zinc-500 border-zinc-800 hover:border-zinc-600"
                }`}
            >
              {catLabels[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Source region filter pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <button
            onClick={() => setRegionFilter(null)}
            className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:outline-none ${!regionFilter
                ? "bg-zinc-700/40 text-zinc-300 border-zinc-600/40"
                : "text-zinc-500 border-zinc-800 hover:border-zinc-600"
              }`}
          >
            {timelineDict.allSources}
          </button>
          {SOURCE_REGIONS.map((r) => (
            <button
              key={r.key}
              onClick={() =>
                setRegionFilter(regionFilter === r.key ? null : r.key)
              }
              className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:outline-none ${regionFilter === r.key
                  ? "bg-zinc-700/40 text-zinc-300 border-zinc-600/40"
                  : "text-zinc-500 border-zinc-800 hover:border-zinc-600"
                }`}
            >
              {timelineDict[r.labelKey]}
            </button>
          ))}
        </div>

        {/* Timeline with tracing beam */}
        {displayed.length > 0 ? (
          <TracingBeam className={"pl-4 md:pl-16"}>
            {displayed.map((event, i) => (
              <div
                key={event.id}
                style={
                  i >= EAGER_COUNT
                    ? {
                      contentVisibility: "auto",
                      containIntrinsicSize: "auto 400px",
                    }
                    : undefined
                }
              >
                <TimelineEntry event={event} />
              </div>
            ))}
          </TracingBeam>
        ) : (
          <p className="text-center text-zinc-500 py-12">
            {timelineDict.noResults}
          </p>
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="py-8 text-center">
            {loading && (
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-red-500" />
            )}
          </div>
        )}

        {/* Screen reader announcement for loaded events */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>
      </div>
    </section>
  );
};
