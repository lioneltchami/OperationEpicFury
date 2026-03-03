"use client";

import React, { useState } from "react";
import { m } from "framer-motion";
import type { TimelineEvent, ConfidenceLevel } from "@/data/timeline";
import { findSource } from "@/data/sources";
import { cn } from "@/lib/utils";
import { LocalTime } from "@/components/ui/LocalTime";
import { useLocale } from "@/i18n/LocaleContext";
import { MediaGallery } from "@/components/ui/MediaGallery";

const categoryConfig: Record<
  string,
  { color: string; bg: string }
> = {
  strike: { color: "text-red-400", bg: "bg-red-500/20 border-red-500/40" },
  retaliation: { color: "text-orange-400", bg: "bg-orange-500/20 border-orange-500/40" },
  announcement: { color: "text-blue-400", bg: "bg-blue-500/20 border-blue-500/40" },
  casualty: { color: "text-yellow-400", bg: "bg-yellow-500/20 border-yellow-500/40" },
  "world-reaction": { color: "text-purple-400", bg: "bg-purple-500/20 border-purple-500/40" },
  breaking: { color: "text-red-400", bg: "bg-red-500/20 border-red-500/40" },
  "breaking-important": { color: "text-red-400", bg: "bg-red-500/20 border-red-500/40" },
};

const confidenceConfig: Record<ConfidenceLevel, { icon: string; label: string; className: string }> = {
  confirmed: { icon: "✓", label: "Confirmed", className: "text-green-400 bg-green-500/15 border-green-500/30" },
  unconfirmed: { icon: "?", label: "Unconfirmed", className: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30" },
  disputed: { icon: "⚠", label: "Disputed", className: "text-orange-400 bg-orange-500/15 border-orange-500/30" },
};

const biasColors: Record<string, { dot: string; label: string }> = {
  left: { dot: "bg-blue-400", label: "Left" },
  "lean-left": { dot: "bg-blue-400", label: "Lean Left" },
  center: { dot: "bg-zinc-400", label: "Center" },
  "lean-right": { dot: "bg-red-400", label: "Lean Right" },
  right: { dot: "bg-red-400", label: "Right" },
};

export const TimelineEntry = ({ event }: { event: TimelineEvent }) => {
  const { dict, locale, isRtl } = useLocale();
  const [showShare, setShowShare] = useState(false);
  const cat = categoryConfig[event.category];
  const catLabel = dict.categories[event.category as keyof typeof dict.categories];
  const conf = confidenceConfig[event.confidence ?? "confirmed"];
  const knownSource = findSource(event.source);
  const bias = knownSource ? biasColors[knownSource.bias] : null;

  const isFa = locale === "fa";
  const headline = isFa && event.headline_fa ? event.headline_fa : event.headline;
  const body = isFa && event.body_fa ? event.body_fa : event.body;

  return (
    <m.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      viewport={{ once: true, margin: "-50px" }}
      className={cn(
        "relative pb-12 group",
        isRtl ? "pr-8 md:pr-12" : "pl-8 md:pl-12"
      )}
      role="article"
      aria-label={`${event.timeET} — ${headline}`}
      tabIndex={0}
    >
      {/* Dot */}
      <div
        className={cn(
          "absolute top-1 w-3 h-3 rounded-full bg-red-600 border-2 border-red-400 shadow-[0_0_12px_rgba(220,38,38,0.6)] group-hover:shadow-[0_0_20px_rgba(220,38,38,0.8)] transition-shadow z-10",
          isRtl ? "right-0" : "left-0"
        )}
      />

      {/* Connector line */}
      <div
        className={cn(
          "absolute top-4 bottom-0 w-[2px] bg-gradient-to-b from-red-600/40 to-transparent",
          isRtl ? "right-[5px]" : "left-[5px]"
        )}
      />

      {/* Time - always LTR with monospace for numbers */}
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <span className="text-red-400 font-mono text-sm font-bold tracking-wider" dir="ltr">
          <LocalTime timeET={event.timeET} />
        </span>
        {(event.breaking || event.category === "breaking-important") && (
          <span
            className="px-2 py-0.5 text-[11px] font-bold tracking-widest bg-red-600 rounded uppercase text-white animate-pulse-breaking"
          >
            {dict.common.breaking}
          </span>
        )}
        <span
          className={cn(
            "px-2 py-0.5 text-[11px] font-bold tracking-widest border rounded uppercase",
            cat.bg,
            cat.color
          )}
        >
          {catLabel}
        </span>
        {event.confidence && event.confidence !== "confirmed" && (
          <span
            className={cn(
              "px-2 py-0.5 text-[11px] font-bold tracking-widest border rounded",
              conf.className,
            )}
            title={conf.label}
          >
            {conf.icon} {conf.label}
          </span>
        )}
      </div>

      {/* Card */}
      <div className={cn(
        "rounded-xl p-5 transition-colors duration-300",
        event.category === "breaking-important"
          ? "bg-red-950 border border-red-700/60 hover:bg-red-900 shadow-[0_0_40px_rgba(153,27,27,0.4)]"
          : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-red-500/20"
      )}>
        <h3 className="text-lg md:text-xl font-bold text-white mb-3 leading-tight">
          {event.slug ? (
            <a
              href={`/${locale}/events/${event.slug}`}
              className="hover:text-red-400 transition-colors"
            >
              {headline}
            </a>
          ) : (
            headline
          )}
        </h3>
        <p className={cn(
          "text-sm leading-relaxed mb-3",
          event.category === "breaking-important" ? "text-red-200" : "text-zinc-400",
          isFa && "leading-loose"
        )}>
          {body}
        </p>
        {event.media && event.media.length > 0 && (
          <MediaGallery media={event.media} />
        )}
        <div className="flex items-center justify-between">
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-xs transition-colors flex items-center gap-1.5",
              event.category === "breaking-important"
                ? "text-red-300/70 hover:text-red-200"
                : "text-red-400/70 hover:text-red-400"
            )}
          >
            {bias && (
              <span
                className={cn("inline-block w-2 h-2 rounded-full shrink-0", bias.dot)}
                title={bias.label}
              />
            )}
            <span>{dict.common.source}:</span>{" "}
            <span className="font-mono">{event.source}</span> {isRtl ? "\u2190" : "\u2192"}
          </a>
          <div className="flex items-center gap-2">
            {showShare && event.slug && (
              <>
                <a href={`https://x.com/intent/tweet?text=${encodeURIComponent(headline)}&url=${encodeURIComponent(`https://opepicfury.info/${locale}/events/${event.slug}`)}`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white transition-colors" aria-label="Share on X">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href={`https://t.me/share/url?url=${encodeURIComponent(`https://opepicfury.info/${locale}/events/${event.slug}`)}&text=${encodeURIComponent(headline)}`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white transition-colors" aria-label="Share on Telegram">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </a>
              </>
            )}
            <button
              onClick={() => setShowShare(!showShare)}
              className="text-zinc-600 hover:text-white transition-colors"
              aria-label="Share"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </m.div>
  );
};
