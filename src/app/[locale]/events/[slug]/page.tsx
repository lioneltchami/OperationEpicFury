import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventMap } from "@/components/ui/EventMapLazy";
import { LocalTime } from "@/components/ui/LocalTime";
import { MediaGallery } from "@/components/ui/MediaGallery";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { SourcePerspectives } from "@/components/ui/SourcePerspectives";
import { categoryTailwind, defaultCategoryTailwind } from "@/data/categories";
import { getDictionary } from "@/i18n";
import { type Locale, locales } from "@/i18n/config";
import {
  getAdjacentEvents,
  getEventBySlug,
  getPublishedEvents,
} from "@/lib/kv";
import { SITE_NAME, SITE_NAME_FR, SITE_URL } from "@/lib/utils";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

/* ── Static generation ── */

export async function generateStaticParams() {
  const events = await getPublishedEvents();
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const event of events) {
      if (event.slug) {
        params.push({ locale, slug: event.slug });
      }
    }
  }
  return params;
}

/* ── Dynamic metadata ── */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};

  const isFr = locale === "fr";
  const title = isFr && event.headline_fr ? event.headline_fr : event.headline;
  const description = isFr && event.body_fr ? event.body_fr : event.body;
  const truncatedDesc =
    description.length > 160 ? description.slice(0, 157) + "..." : description;

  return {
    title: `${title} | Operation Epic Fury`,
    description: truncatedDesc,
    openGraph: {
      title,
      description: truncatedDesc,
      type: "article",
      siteName: new URL(SITE_URL).host,
      url: `${SITE_URL}/${locale}/events/${slug}`,
      images: [
        {
          url: `${SITE_URL}/api/og?slug=${slug}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: truncatedDesc,
      images: [`${SITE_URL}/api/og?slug=${slug}`],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/events/${slug}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${SITE_URL}/${l}/events/${slug}`]),
      ),
    },
  };
}

/* ── Page ── */

export const revalidate = 60;

export default async function EventPage({ params }: Props) {
  const { locale, slug } = await params;
  const [event, adjacent, dict] = await Promise.all([
    getEventBySlug(slug),
    getAdjacentEvents(slug),
    getDictionary(locale as Locale),
  ]);

  if (!event) notFound();

  const isFr = locale === "fr";

  const headline =
    isFr && event.headline_fr ? event.headline_fr : event.headline;
  const body = isFr && event.body_fr ? event.body_fr : event.body;
  const catLabels = dict.categories as Record<string, string>;
  const catLabel = catLabels[event.category] ?? event.category;
  const confidenceLabel = event.confidence ?? "confirmed";

  const cat = categoryTailwind[event.category] ?? defaultCategoryTailwind;

  /* JSON-LD structured data */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: event.headline,
    description: event.body.slice(0, 200),
    datePublished: event.timeET.includes(" ")
      ? `${event.timeET.split(" ")[0]}T${event.timeET.split(" ")[1]}:00-05:00`
      : `2026-02-28T${event.timeET}:00-05:00`,
    author: { "@type": "Organization", name: event.source },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/${locale}/events/${slug}`,
    inLanguage: locale,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
              {isFr ? SITE_NAME_FR : SITE_NAME}
            </span>
          </div>
        </div>

        {/* Content */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          {/* Time & category badges */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span
              className="text-red-400 font-mono text-sm font-bold tracking-wider"
              dir="ltr"
            >
              <LocalTime timeET={event.timeET} />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            {(event.breaking || event.category === "breaking-important") && (
              <span className="px-2.5 py-1 text-[11px] font-bold tracking-widest bg-red-600 rounded uppercase text-white animate-pulse-breaking">
                {dict.common.breaking}
              </span>
            )}
            <span
              className={`px-2.5 py-1 text-[11px] font-bold tracking-widest border rounded uppercase ${cat.bg} ${cat.text} ${cat.border}`}
            >
              {catLabel}
            </span>
            {confidenceLabel !== "confirmed" && (
              <span
                className={`px-2.5 py-1 text-[11px] font-bold tracking-widest border rounded ${
                  confidenceLabel === "disputed"
                    ? "text-orange-400 bg-orange-500/15 border-orange-500/30"
                    : "text-yellow-400 bg-yellow-500/15 border-yellow-500/30"
                }`}
              >
                {confidenceLabel === "disputed"
                  ? "⚠ Disputed"
                  : "? Unconfirmed"}
              </span>
            )}
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
            {headline}
          </h1>

          {/* Body */}
          <div
            className={`text-base sm:text-lg leading-relaxed text-zinc-300 mb-8 whitespace-pre-wrap ${
              isFr ? "leading-loose" : ""
            }`}
          >
            {body}
          </div>

          {/* Media */}
          {event.media && event.media.length > 0 && (
            <div className="mb-8">
              <MediaGallery media={event.media} eventHeadline={headline} />
            </div>
          )}

          {/* Location map */}
          {event.location && (
            <div id="map" className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-4 h-4 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                <span className="text-sm text-zinc-400">
                  {event.location.name}
                </span>
              </div>
              <EventMap
                lat={event.location.lat}
                lng={event.location.lng}
                name={event.location.name}
              />
            </div>
          )}

          {/* Source(s) */}
          <div className="flex items-center justify-between border-t border-zinc-800/60 pt-6 mb-10">
            <div className="flex flex-col gap-2">
              {event.sources && event.sources.length > 0 ? (
                <>
                  <span className="text-xs text-zinc-500">
                    {dict.common.source}s:
                  </span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {event.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-red-400/70 hover:text-red-400 transition-colors font-mono"
                      >
                        {src.name}
                        {src.region && (
                          <span className="text-zinc-600 ml-1">
                            ({src.region})
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    {dict.common.source}:
                  </span>
                  <a
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-red-400/70 hover:text-red-400 transition-colors font-mono"
                  >
                    {event.source} {"→"}
                  </a>
                </div>
              )}
            </div>
            <ShareButtons
              url={`${SITE_URL}/${locale}/events/${slug}`}
              title={headline}
            />
          </div>

          {/* All perspectives (multi-source events) */}
          {event.sources && event.sources.length >= 2 && (
            <SourcePerspectives sources={event.sources} />
          )}

          {/* Prev / Next navigation */}
          <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-800/60 pt-8">
            {adjacent.prev ? (
              <a
                href={`/${locale}/events/${adjacent.prev.slug}`}
                className="group flex flex-col gap-1.5 p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all"
              >
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider">
                  {(dict.common as Record<string, string>).previous}
                </span>
                <span className="text-sm text-zinc-400 group-hover:text-white transition-colors line-clamp-2">
                  {isFr && adjacent.prev.headline_fr
                    ? adjacent.prev.headline_fr
                    : adjacent.prev.headline}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono" dir="ltr">
                  <LocalTime timeET={adjacent.prev.timeET} showDate={false} />
                </span>
              </a>
            ) : (
              <div />
            )}
            {adjacent.next ? (
              <a
                href={`/${locale}/events/${adjacent.next.slug}`}
                className="group flex flex-col gap-1.5 p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all text-right"
              >
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider">
                  {(dict.common as Record<string, string>).next}
                </span>
                <span className="text-sm text-zinc-400 group-hover:text-white transition-colors line-clamp-2">
                  {isFr && adjacent.next.headline_fr
                    ? adjacent.next.headline_fr
                    : adjacent.next.headline}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono" dir="ltr">
                  <LocalTime timeET={adjacent.next.timeET} showDate={false} />
                </span>
              </a>
            ) : (
              <div />
            )}
          </nav>
        </article>
      </main>
    </>
  );
}
