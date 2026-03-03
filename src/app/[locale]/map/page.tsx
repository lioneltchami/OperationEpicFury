import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { getPublishedEvents } from "@/lib/kv";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

const AggregateMap = dynamic(() => import("@/components/ui/AggregateMap"), { ssr: false });

export const metadata: Metadata = {
  title: "Event Map | Operation Epic Fury",
  description: "Geographic view of all Operation Epic Fury events.",
};

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MapPage({ params }: Props) {
  const { locale } = await params;
  const [events, dict] = await Promise.all([
    getPublishedEvents(),
    getDictionary(locale as Locale),
  ]);

  const eventsWithLocation = events.filter((e) => e.location);
  
  const isFr = locale === "fr";

  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
          <a
            href={`/${locale}`}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {(dict.common as Record<string, string>).backToTimeline}
          </a>
          <span className="text-[11px] text-zinc-500 font-mono tracking-wider uppercase">
            {isFr ? "نقشه رویدادها" : "Event Map"} ({eventsWithLocation.length})
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 48px)" }}>
        {eventsWithLocation.length > 0 ? (
          <AggregateMap events={events} locale={locale} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-500 text-sm">
              {isFr ? "هنوز رویدادی با موقعیت مکانی ثبت نشده است." : "No events with location data yet."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
