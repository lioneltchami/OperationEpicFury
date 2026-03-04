"use client";
import dynamic from "next/dynamic";

const EventMapLazy = dynamic(() => import("./EventMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full bg-zinc-900/50 animate-pulse rounded-xl border border-zinc-800/60 flex items-center justify-center">
      <span className="text-zinc-700 text-xs font-mono uppercase tracking-widest">
        Loading Map...
      </span>
    </div>
  ),
});

export { EventMapLazy as EventMap };
