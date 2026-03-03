"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TimelineEvent, EventCategory } from "@/data/timeline";
import { LocalTime } from "@/components/ui/LocalTime";

const categoryLabels: Record<EventCategory, string> = {
  strike: "Strike",
  retaliation: "Retaliation",
  announcement: "Announcement",
  casualty: "Casualty",
  "world-reaction": "World Reaction",
  breaking: "Breaking",
  "breaking-important": "Breaking!",
};

export function AdminEventTable({
  events,
  isDraftSection,
  onEdit,
  onPreview,
}: {
  events: TimelineEvent[];
  isDraftSection?: boolean;
  onEdit?: (event: TimelineEvent) => void;
  onPreview?: (event: TimelineEvent) => void;
}) {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleSeed() {
    setSeeding(true);
    await fetch("/api/seed", { method: "POST" });
    setSeeding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  // Empty state
  if (events.length === 0 && !isDraftSection) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50">
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-sm text-zinc-500 mb-1">No events yet</p>
        <p className="text-xs text-zinc-600 mb-5">
          Seed the database to get started
        </p>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="
            px-4 py-2 text-xs font-semibold rounded-lg
            bg-red-600 text-white
            hover:bg-red-500 disabled:opacity-50
            transition-all duration-150
          "
        >
          {seeding ? "Seeding..." : "Seed from Hardcoded Data"}
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-900/30">
              <th className="py-2.5 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Time
              </th>
              <th className="py-2.5 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Event
              </th>
              {isDraftSection && (
                <th className="py-2.5 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Translation
                </th>
              )}
              <th className="py-2.5 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Category
              </th>
              <th className="py-2.5 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {events.map((event) => (
              <tr
                key={event.id}
                className="group hover:bg-zinc-900/50 transition-colors duration-150"
              >
                {/* Time */}
                <td className="py-3 px-4 whitespace-nowrap align-top">
                  <div className="text-xs font-mono text-zinc-300">
                    <LocalTime timeET={event.timeET} />
                  </div>
                </td>

                {/* Headline + Source */}
                <td className="py-3 px-4 max-w-sm align-top">
                  <div className="flex items-start gap-2">
                    {event.breaking && (
                      <span className="mt-0.5 shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-600/20 text-red-400 border border-red-600/30">
                        Live
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-zinc-200 truncate font-medium text-sm leading-tight">
                        {event.headline}
                      </p>
                      <p className="text-[11px] text-zinc-600 mt-0.5 truncate">
                        {event.source}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Translation status */}
                {isDraftSection && (
                  <td className="py-3 px-4 align-top">
                    {event.headline_fr ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-green-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Pending
                      </span>
                    )}
                  </td>
                )}

                {/* Category */}
                <td className="py-3 px-4 align-top">
                  <span
                    className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-md badge-${event.category}`}
                  >
                    {categoryLabels[event.category]}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap align-top">
                  <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    {isDraftSection && onPreview && (
                      <button
                        onClick={() => onPreview(event)}
                        title="Preview & Publish"
                        className="
                          p-1.5 rounded-md text-green-400 hover:bg-green-400/10
                          transition-all duration-150
                        "
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => onEdit?.(event)}
                      title="Edit"
                      className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-150"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                      title="Delete"
                      className="
                        p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-400/10
                        disabled:opacity-50 transition-all duration-150
                      "
                    >
                      {deleting === event.id ? (
                        <Spinner />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden divide-y divide-zinc-800/50">
        {events.map((event) => (
          <div key={event.id} className="p-4 space-y-2.5">
            {/* Top row: time + category */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">
                  <LocalTime timeET={event.timeET} />
                </span>
                {event.breaking && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-red-600/20 text-red-400 border border-red-600/30">
                    Live
                  </span>
                )}
              </div>
              <span
                className={`px-2 py-0.5 text-[10px] font-medium rounded-md badge-${event.category}`}
              >
                {categoryLabels[event.category]}
              </span>
            </div>

            {/* Headline */}
            <p className="text-sm font-medium text-zinc-200 leading-snug">
              {event.headline}
            </p>

            {/* Source */}
            <div className="text-[11px] text-zinc-600">
              <span>{event.source}</span>
            </div>

            {/* Translation status for drafts */}
            {isDraftSection && (
              <div className="pt-1">
                {event.headline_fr ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-green-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Translation ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Translation pending
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/50">
              {isDraftSection && onPreview && (
                <button
                  onClick={() => onPreview(event)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-green-400 bg-green-400/10 rounded-md hover:bg-green-400/20 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Publish
                </button>
              )}
              <button
                onClick={() => onEdit?.(event)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 bg-zinc-800/50 rounded-md hover:bg-zinc-800 transition-all"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => handleDelete(event.id)}
                disabled={deleting === event.id}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:text-red-400 bg-zinc-800/50 rounded-md hover:bg-red-400/10 disabled:opacity-50 transition-all ml-auto"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                {deleting === event.id ? "..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
