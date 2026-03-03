import { Hero } from "@/components/sections/Hero";
import { Ticker } from "@/components/sections/Ticker";
import { StatsBar } from "@/components/sections/StatsBar";
import { Timeline } from "@/components/sections/Timeline";
import { Footer } from "@/components/sections/Footer";
import { getPublishedEvents } from "@/lib/kv";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import type { TimelineEvent } from "@/data/timeline";
import type { Dictionary } from "@/i18n";

export const revalidate = 60;

async function loadData(locale: string) {
  try {
    const [events, dict] = await Promise.all([
      getPublishedEvents(),
      getDictionary(locale as Locale),
    ]);
    return { events, dict, error: false as const };
  } catch (err) {
    console.error("[page] Failed to load timeline data:", err);
    return { events: [] as TimelineEvent[], dict: null as Dictionary | null, error: true as const };
  }
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { events, dict, error } = await loadData(locale);

  if (error || !dict) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">
            Temporarily Unavailable
          </h1>
          <p className="text-zinc-400 mb-6">
            The timeline is temporarily unavailable. Please try again in a few
            moments.
          </p>
          <a
            href={`/${locale}`}
            className="inline-block px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </a>
        </div>
      </main>
    );
  }

  const reversed = [...events].reverse();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Operation Epic Fury",
    url: "https://opepicfury.info",
    description:
      "A minute-by-minute timeline of Operation Epic Fury — the US-Israel strikes on Iran.",
    inLanguage: locale === "fa" ? "fa" : "en",
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
        Skip to timeline
      </a>
      <main className="min-h-screen bg-black">
        <Hero dict={dict} locale={locale as Locale} />
        <Ticker />
        <StatsBar />
        <div id="timeline">
          <Timeline events={reversed} />
        </div>
        <Footer />
      </main>
    </>
  );
}
