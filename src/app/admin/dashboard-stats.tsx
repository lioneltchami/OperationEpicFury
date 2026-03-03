"use client";

import { SpotlightCard } from "@/components/ui/SpotlightCard";

export function DashboardStats({
  publishedCount,
  draftCount,
  breakingCount,
}: {
  publishedCount: number;
  draftCount: number;
  breakingCount: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up">
      <SpotlightCard
        className="p-4"
        spotlightColor="rgba(34, 197, 94, 0.12)"
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-white tabular-nums">{publishedCount}</p>
            <p className="text-xs text-zinc-500">Published</p>
          </div>
        </div>
      </SpotlightCard>

      <SpotlightCard
        className="p-4"
        spotlightColor="rgba(251, 191, 36, 0.12)"
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-white tabular-nums">{draftCount}</p>
            <p className="text-xs text-zinc-500">Drafts</p>
          </div>
        </div>
      </SpotlightCard>

      <SpotlightCard
        className="p-4"
        spotlightColor="rgba(220, 38, 38, 0.12)"
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-white tabular-nums">{breakingCount}</p>
            <p className="text-xs text-zinc-500">Breaking</p>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}
