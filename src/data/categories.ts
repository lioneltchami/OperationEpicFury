import type { EventCategory } from "./timeline";

export const categoryTailwind: Record<
  EventCategory,
  { text: string; bg: string; border: string }
> = {
  strike: {
    text: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/40",
  },
  retaliation: {
    text: "text-orange-400",
    bg: "bg-orange-500/20",
    border: "border-orange-500/40",
  },
  announcement: {
    text: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/40",
  },
  casualty: {
    text: "text-yellow-400",
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/40",
  },
  "world-reaction": {
    text: "text-purple-400",
    bg: "bg-purple-500/20",
    border: "border-purple-500/40",
  },
  breaking: {
    text: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/40",
  },
  "breaking-important": {
    text: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/40",
  },
};

export const categoryHex: Record<EventCategory, string> = {
  strike: "#ef4444",
  retaliation: "#f97316",
  announcement: "#3b82f6",
  casualty: "#eab308",
  "world-reaction": "#a855f7",
  breaking: "#ef4444",
  "breaking-important": "#dc2626",
};

export const defaultCategoryTailwind = categoryTailwind.announcement;
export const defaultCategoryHex = "#3b82f6";
