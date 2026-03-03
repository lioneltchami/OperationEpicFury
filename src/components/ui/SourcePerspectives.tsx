"use client";

import React, { useState } from "react";
import type { EventSource } from "@/data/timeline";
import { findSource } from "@/data/sources";

const biasGroups: { key: string; label: string; biases: string[]; dot: string }[] = [
  { key: "left", label: "Left-leaning sources", biases: ["left", "lean-left"], dot: "bg-blue-400" },
  { key: "center", label: "Center / Wire services", biases: ["center"], dot: "bg-zinc-400" },
  { key: "right", label: "Right-leaning sources", biases: ["right", "lean-right"], dot: "bg-red-400" },
  { key: "unknown", label: "Other sources", biases: [], dot: "bg-yellow-400" },
];

function classifySource(src: EventSource) {
  const known = findSource(src.name);
  if (known) return known.bias;
  return null;
}

export function SourcePerspectives({ sources }: { sources: EventSource[] }) {
  const [open, setOpen] = useState(false);

  if (sources.length < 2) return null;

  // Group sources by bias category
  const grouped = new Map<string, EventSource[]>();
  for (const src of sources) {
    const bias = classifySource(src);
    const groupKey = biasGroups.find((g) => bias && g.biases.includes(bias))?.key ?? "unknown";
    const arr = grouped.get(groupKey) ?? [];
    arr.push(src);
    grouped.set(groupKey, arr);
  }

  // Only show if there are sources in 2+ different bias groups
  if (grouped.size < 2) return null;

  return (
    <div className="border-t border-zinc-800/60 pt-6 mb-10">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        aria-expanded={open}
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        All perspectives ({sources.length} sources)
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {biasGroups.map((group) => {
            const items = grouped.get(group.key);
            if (!items?.length) return null;
            return (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${group.dot}`} />
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pl-4">
                  {items.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-400/70 hover:text-red-400 transition-colors font-mono"
                    >
                      {src.name}
                      {src.region && (
                        <span className="text-zinc-600 ml-1">({src.region})</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
