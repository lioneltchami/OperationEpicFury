import type { Metadata } from "next";
import { ArchiveList } from "@/components/ui/ArchiveList";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getPublishedEvents } from "@/lib/kv";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return {
    title: `${dict.archive.title} | Operation Epic Fury`,
    description: `Browse all Operation Epic Fury events by date.`,
  };
}

export const dynamic = "force-dynamic";

export default async function ArchivePage({ params }: Props) {
  const { locale } = await params;
  const [events, dict] = await Promise.all([
    getPublishedEvents(),
    getDictionary(locale as Locale),
  ]);

  // Group events by date (YYYY-MM-DD)
  const grouped: Record<string, typeof events> = {};
  for (const e of events) {
    const date = e.timeET.split(" ")[0] ?? "unknown";
    (grouped[date] ??= []).push(e);
  }
  const sortedDates = Object.keys(grouped).sort().reverse();

  return (
    <main className="min-h-screen bg-black">
      {/* Top bar */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
          <a
            href={`/${locale}`}
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
            {(dict.common as Record<string, string>).backToTimeline}
          </a>
          <span className="text-[11px] text-zinc-500 font-mono tracking-wider uppercase">
            {dict.archive.heading} ({events.length})
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">
          {dict.archive.title}
        </h1>
        <ArchiveList
          sortedDates={sortedDates}
          grouped={grouped}
          locale={locale}
          catLabels={dict.categories as Record<string, string>}
        />
      </div>
    </main>
  );
}
