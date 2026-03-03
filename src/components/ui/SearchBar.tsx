"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { TimelineEvent } from "@/data/timeline";
import { useLocale } from "@/i18n/LocaleContext";

export const SearchBar = () => {
  const { locale } = useLocale();
  const isFa = locale === "fa";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TimelineEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    try {
      const res = await fetch(`/api/events/search?q=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.events);
        setOpen(data.events.length > 0);
      }
    } catch { /* ignore */ }
  }, []);

  const onChange = (val: string) => {
    setQuery(val);
    setActive(-1);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 300);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && active >= 0 && results[active]) {
      const r = results[active];
      window.location.href = `/${locale}/events/${r.slug ?? r.id}`;
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <svg className={`absolute top-1/2 -translate-y-1/2 ${isFa ? "right-3" : "left-3"} w-4 h-4 text-zinc-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={isFa ? "جستجو در رویدادها..." : "Search events..."}
          className={`w-full bg-zinc-900/80 border border-zinc-800 rounded-lg py-2.5 ${isFa ? "pr-10 pl-4" : "pl-10 pr-4"} text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-colors`}
          aria-label={isFa ? "جستجو" : "Search"}
          role="combobox"
          aria-expanded={open}
          aria-controls="search-results"
          aria-autocomplete="list"
        />
      </div>

      {open && results.length > 0 && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden max-h-80 overflow-y-auto"
        >
          {results.map((event, i) => {
            const headline = isFa && event.headline_fa ? event.headline_fa : event.headline;
            return (
              <li key={event.id} role="option" aria-selected={i === active}>
                <a
                  href={`/${locale}/events/${event.slug ?? event.id}`}
                  className={`block px-4 py-3 text-sm transition-colors ${
                    i === active ? "bg-red-500/10 text-white" : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                  onMouseEnter={() => setActive(i)}
                >
                  <div className="font-medium line-clamp-1">{headline}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                    <span className="font-mono" dir="ltr">{event.timeET}</span>
                    <span className="uppercase tracking-wider">{event.category}</span>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
