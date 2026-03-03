"use client";

import type { TimelineEvent, EventCategory } from "@/data/timeline";
import { LocalTime } from "@/components/ui/LocalTime";
import { MediaGallery } from "@/components/ui/MediaGallery";

const categoryLabels: Record<EventCategory, string> = {
  strike: "Strike",
  retaliation: "Retaliation",
  announcement: "Announcement",
  casualty: "Casualty",
  "world-reaction": "World Reaction",
  breaking: "Breaking",
  "breaking-important": "Breaking!",
};

const categoryColors: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  strike: {
    text: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/30",
  },
  retaliation: {
    text: "text-orange-400",
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
  },
  announcement: {
    text: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
  },
  casualty: {
    text: "text-purple-400",
    bg: "bg-purple-500/15",
    border: "border-purple-500/30",
  },
  "world-reaction": {
    text: "text-green-400",
    bg: "bg-green-500/15",
    border: "border-green-500/30",
  },
  breaking: {
    text: "text-yellow-400",
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/30",
  },
  "breaking-important": {
    text: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/40",
  },
};

export function PublishPreviewContent({
  event,
  publishing,
  onPublish,
  onCancel,
}: {
  event: TimelineEvent;
  publishing: boolean;
  onPublish: () => void;
  onCancel: () => void;
}) {
  const cat = categoryColors[event.category] ?? categoryColors.announcement;

  return (
    <div className="space-y-5">
      {/* Time + badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-red-400 font-mono text-sm font-bold tracking-wider"
          dir="ltr"
        >
          <LocalTime timeET={event.timeET} />
        </span>
        {(event.breaking || event.category === "breaking-important") && (
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest bg-red-600 rounded uppercase text-white animate-pulse">
            LIVE
          </span>
        )}
        <span
          className={`px-2 py-0.5 text-[10px] font-bold tracking-widest border rounded uppercase ${cat.bg} ${cat.text} ${cat.border}`}
        >
          {categoryLabels[event.category]}
        </span>
      </div>

      {/* Headline */}
      <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
        {event.headline}
      </h2>

      {/* Body */}
      <div className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
        {event.body}
      </div>

      {/* Media */}
      {event.media && event.media.length > 0 && (
        <div className="pt-1">
          <MediaGallery media={event.media} />
        </div>
      )}

      {/* Source */}
      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
        <span className="text-xs text-zinc-600">Source:</span>
        {event.sourceUrl ? (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-red-400/70 hover:text-red-400 transition-colors font-mono"
          >
            {event.source} &rarr;
          </a>
        ) : (
          <span className="text-xs text-zinc-400 font-mono">
            {event.source}
          </span>
        )}
      </div>

      {/* French translation preview */}
      {event.headline_fr && (
        <div
          className="pt-3 border-t border-zinc-800/60 space-y-2"
          dir="ltr"
        >
          <span
            className="text-[10px] uppercase tracking-wider text-zinc-600 font-mono"
            dir="ltr"
          >
            French Translation
          </span>
          <h3 className="text-lg font-bold text-zinc-200 leading-relaxed">
            {event.headline_fr}
          </h3>
          {event.body_fr && (
            <p className="text-sm text-zinc-400 leading-loose whitespace-pre-wrap">
              {event.body_fr}
            </p>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/60">
        <button
          onClick={onCancel}
          disabled={publishing}
          className="px-4 py-2 text-xs font-medium text-zinc-400 bg-zinc-800/60 rounded-lg hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onPublish}
          disabled={publishing}
          className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-60 transition-all"
        >
          {publishing ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Publishing...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Publish
            </>
          )}
        </button>
      </div>
    </div>
  );
}
