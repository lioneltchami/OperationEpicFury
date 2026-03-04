"use client";

import { useRouter } from "next/navigation";

export function BackToTimeline({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        // If the user navigated here from the timeline, go back to restore scroll position
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(href);
        }
      }}
      className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors"
    >
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
          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
        />
      </svg>
      {label}
    </button>
  );
}
