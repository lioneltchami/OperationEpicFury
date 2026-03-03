"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { m } from "framer-motion";
import { TracingBeam } from "@/components/ui/TracingBeam";
import { TimelineEntry } from "@/components/ui/TimelineEntry";
import type { TimelineEvent } from "@/data/timeline";
import { useLocale } from "@/i18n/LocaleContext";

const EAGER_COUNT = 20;

interface TimelineProps {
  initialEvents: TimelineEvent[];
  totalEvents: number;
  pageSize: number;
}

export const Timeline = ({ initialEvents, totalEvents, pageSize }: TimelineProps) => {
  const { dict, isRtl, locale } = useLocale();
  const isFa = locale === "fa";
  const monoClass = isFa ? "" : "font-mono";

  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(false);
  const hasMore = events.length < totalEvents;
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      // Offset from the end since we're showing newest-first
      // The API returns oldest-first, so we need to calculate the right offset
      const loaded = events.length;
      const remaining = totalEvents - loaded;
      const nextBatch = Math.min(pageSize, remaining);
      const offset = remaining - nextBatch;

      const res = await fetch(
        `/api/events/published?offset=${offset}&limit=${nextBatch}`,
      );
      if (res.ok) {
        const data = await res.json();
        // Reverse to maintain newest-first order
        const newEvents = [...data.events].reverse();
        setEvents((prev) => [...prev, ...newEvents]);
      }
    } catch {
      // Silently fail — user can scroll again to retry
    } finally {
      setLoading(false);
    }
  }, [events.length, totalEvents, pageSize, loading, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
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
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            {dict.timeline.title}
          </h2>
          <p className={`text-zinc-500 ${monoClass} text-sm tracking-wider`}>
            {dict.timeline.subtitle}
          </p>
          <div className="mt-6 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
        </m.div>

        {/* Timeline with tracing beam */}
        <TracingBeam className={isRtl ? "pr-4 md:pr-16" : "pl-4 md:pl-16"}>
          {events.map((event, i) => (
            <div
              key={event.id}
              style={
                i >= EAGER_COUNT
                  ? { contentVisibility: "auto", containIntrinsicSize: "auto 400px" }
                  : undefined
              }
            >
              <TimelineEntry event={event} />
            </div>
          ))}
        </TracingBeam>

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="py-8 text-center">
            {loading && (
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-red-500" />
            )}
          </div>
        )}
      </div>
    </section>
  );
};
