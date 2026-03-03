"use client";

import React, { useState } from "react";
import type { TimelineEvent } from "@/data/timeline";

interface ArchiveListProps {
  sortedDates: string[];
  grouped: Record<string, TimelineEvent[]>;
  locale: string;
  isFr: boolean;
  catLabels: Record<string, string>;
}

export function ArchiveList({ sortedDates, grouped, locale, isFr, catLabels }: ArchiveListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([sortedDates[0]]));

  const toggle = (date: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {sortedDates.map((date) => {
        const events = grouped[date];
        const isOpen = expanded.has(date);
        const formatted = new Date(date + "T12:00:00").toLocaleDateString(
          isFr ? "fa-IR" : "en-US",
          { weekday: "long", year: "numeric", month: "long", day: "numeric" },
        );

        return (
          <div key={date} className="border border-zinc-800/60 rounded-xl overflow-hidden">
            <button
              onClick={() => toggle(date)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-900/50 transition-colors text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                <span className="text-sm text-white font-bold">{formatted}</span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {events.length} {isFr ? "رویداد" : events.length === 1 ? "event" : "events"}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-zinc-800/40 divide-y divide-zinc-800/30">
                {events.map((event) => {
                  const headline = isFr && event.headline_fr ? event.headline_fr : event.headline;
                  const time = event.timeET.split(" ")[1] ?? "";
                  return (
                    <a
                      key={event.id}
                      href={event.slug ? `/${locale}/events/${event.slug}` : undefined}
                      className="flex items-start gap-3 px-5 py-3 hover:bg-zinc-900/30 transition-colors"
                    >
                      <span className="text-xs text-red-400 font-mono font-bold shrink-0 pt-0.5 w-12" dir="ltr">
                        {time}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-zinc-300 line-clamp-1">{headline}</span>
                        <span className="text-[11px] text-zinc-600 uppercase tracking-wider">
                          {catLabels[event.category] ?? event.category}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
