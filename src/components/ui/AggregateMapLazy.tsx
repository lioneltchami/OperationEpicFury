"use client";
import dynamic from "next/dynamic";

const AggregateMapLazy = dynamic(() => import("./AggregateMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-zinc-900/50 animate-pulse flex items-center justify-center">
      <span className="text-zinc-700 text-xs font-mono uppercase tracking-widest">
        Loading Map...
      </span>
    </div>
  ),
});

export { AggregateMapLazy as AggregateMap };
