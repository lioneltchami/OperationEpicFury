import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { StatsBar } from "@/components/sections/StatsBar";
import { Ticker } from "@/components/sections/Ticker";
import { Timeline } from "@/components/sections/Timeline";
import { AggregateMap } from "@/components/ui/AggregateMapLazy";
import type { TimelineEvent } from "@/data/timeline";
import type { Dictionary } from "@/i18n";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getPublishedEventsPaginated } from "@/lib/kv";
import { getStats } from "@/lib/stats";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/utils";

export const dynamic = "force-dynamic";

const INITIAL_PAGE_SIZE = 30;

async function loadData(locale: string) {
  // Always attempt to load dict separately so error UI can be translated
  let dict: Dictionary | null = null;
  try {
    dict = await getDictionary(locale as Locale);
  } catch {
    // Dict load failed; error UI will use fallback strings
  }

  try {
    const [page, stats] = await Promise.all([
      getPublishedEventsPaginated(0, INITIAL_PAGE_SIZE),
      getStats(),
    ]);
    // Reverse so newest first
    const events = [...page.events].reverse();
    return { events, total: page.total, dict, stats, error: false as const };
  } catch (err) {
    console.error("[page] Failed to load timeline data:", err);
    return {
      events: [] as TimelineEvent[],
      total: 0,
      dict,
      stats: null,
      error: true as const,
    };
  }
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { events, total, dict, stats, error } = await loadData(locale);

  if (error || !dict) {
    const fallback = {
      unavailable: "Temporarily Unavailable",
      unavailableDesc:
        "The timeline is temporarily unavailable. Please try again in a few moments.",
      retry: "Retry",
    };
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">
            {dict?.errors.unavailable ?? fallback.unavailable}
          </h1>
          <p className="text-zinc-400 mb-6">
            {dict?.errors.unavailableDesc ?? fallback.unavailableDesc}
          </p>
          <a
            href={`/${locale}`}
            className="inline-block px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            {dict?.errors.retry ?? fallback.retry}
          </a>
        </div>
      </main>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: locale,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a
        href="#timeline"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded"
      >
        {dict.accessibility.skipToTimeline}
      </a>
      <main className="min-h-screen bg-black">
        <Hero dict={dict} locale={locale as Locale} />
        <Ticker initialHeadlines={events.slice(0, 10).map(e => e.headline)} />
        <StatsBar stats={stats} />

        {/* Integrated Live Tactical Map */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
          <div className="relative h-[350px] md:h-[450px] rounded-sm overflow-hidden border border-zinc-800/50 bg-zinc-950 group">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <span className="bg-black/80 border border-red-500/30 px-3 py-1 text-[10px] font-mono tracking-widest text-red-500 uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE_TACTICAL_MAP
              </span>
            </div>
            {events.some(e => e.location) ? (
              <AggregateMap events={events} locale={locale} />
            ) : (
              <div className="flex items-center justify-center h-full bg-zinc-900/50">
                <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest px-8 text-center">
                  System Offline: No geolocation data detected in current intel feed
                </p>
              </div>
            )}
            <div className="absolute bottom-4 right-4 z-10">
              <a
                href={`/${locale}/map`}
                className="bg-black/80 border border-zinc-800 px-3 py-1.5 text-[10px] font-mono tracking-widest text-zinc-400 hover:text-white transition-colors uppercase"
              >
                Expand to Fullscreen →
              </a>
            </div>
          </div>
        </div>

        <div id="timeline">
          <Timeline
            initialEvents={events}
            totalEvents={total}
            pageSize={INITIAL_PAGE_SIZE}
          />
        </div>
        <Footer />
      </main>
    </>
  );
}
