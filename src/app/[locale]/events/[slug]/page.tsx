import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEventBySlug, getAdjacentEvents, getPublishedEvents } from "@/lib/kv";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { LocalTime } from "@/components/ui/LocalTime";
import { MediaGallery } from "@/components/ui/MediaGallery";
import { ShareButtons } from "@/components/ui/ShareButtons";

const SITE_URL = "https://opepicfury.info";

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

  const isFa = locale === "fa";
  const title = isFa && event.headline_fa ? event.headline_fa : event.headline;
  const description = isFa && event.body_fa ? event.body_fa : event.body;
  const truncatedDesc = description.length > 160 ? description.slice(0, 157) + "..." : description;

  return {
    title: `${title} | Operation Epic Fury`,
    description: truncatedDesc,
    openGraph: {
      title,
      description: truncatedDesc,
      type: "article",
      siteName: "opepicfury.info",
      url: `${SITE_URL}/${locale}/events/${slug}`,
      images: [{ url: `${SITE_URL}/api/og?slug=${slug}`, width: 1200, height: 630, alt: title }],
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

  const isFa = locale === "fa";
  const isRtl = locale === "fa";
  const headline = isFa && event.headline_fa ? event.headline_fa : event.headline;
  const body = isFa && event.body_fa ? event.body_fa : event.body;
  const catLabels = dict.categories as Record<string, string>;
  const catLabel = catLabels[event.category] ?? event.category;

  const categoryColors: Record<string, { text: string; bg: string; border: string }> = {
    strike: { text: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
    retaliation: { text: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" },
    announcement: { text: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" },
    casualty: { text: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/30" },
    "world-reaction": { text: "text-green-400", bg: "bg-green-500/15", border: "border-green-500/30" },
    breaking: { text: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30" },
    "breaking-important": { text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/40" },
  };

  const cat = categoryColors[event.category] ?? categoryColors.announcement;

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
      name: "Operation Epic Fury",
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={isRtl ? "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" : "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"} />
              </svg>
              {(dict.common as Record<string, string>).backToTimeline}
            </a>
            <span className="text-[11px] text-zinc-700 font-mono tracking-wider uppercase">
              {isFa ? "عملیات خشم حماسی" : "Operation Epic Fury"}
            </span>
          </div>
        </div>

        {/* Content */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          {/* Time & category badges */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-red-400 font-mono text-sm font-bold tracking-wider" dir="ltr">
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
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
            {headline}
          </h1>

          {/* Body */}
          <div
            className={`text-base sm:text-lg leading-relaxed text-zinc-300 mb-8 whitespace-pre-wrap ${
              isFa ? "leading-loose" : ""
            }`}
          >
            {body}
          </div>

          {/* Media */}
          {event.media && event.media.length > 0 && (
            <div className="mb-8">
              <MediaGallery media={event.media} />
            </div>
          )}

          {/* Source */}
          <div className="flex items-center justify-between border-t border-zinc-800/60 pt-6 mb-10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600">{dict.common.source}:</span>
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-400/70 hover:text-red-400 transition-colors font-mono"
              >
                {event.source} {isRtl ? "\u2190" : "\u2192"}
              </a>
            </div>
            <ShareButtons
              url={`${SITE_URL}/${locale}/events/${slug}`}
              title={headline}
            />
          </div>

          {/* Prev / Next navigation */}
          <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-800/60 pt-8">
            {adjacent.prev ? (
              <a
                href={`/${locale}/events/${adjacent.prev.slug}`}
                className="group flex flex-col gap-1.5 p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all"
              >
                <span className="text-[11px] text-zinc-600 uppercase tracking-wider">
                  {(dict.common as Record<string, string>).previous}
                </span>
                <span className="text-sm text-zinc-400 group-hover:text-white transition-colors line-clamp-2">
                  {isFa && adjacent.prev.headline_fa ? adjacent.prev.headline_fa : adjacent.prev.headline}
                </span>
                <span className="text-[11px] text-zinc-700 font-mono" dir="ltr">
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
                <span className="text-[11px] text-zinc-600 uppercase tracking-wider">
                  {(dict.common as Record<string, string>).next}
                </span>
                <span className="text-sm text-zinc-400 group-hover:text-white transition-colors line-clamp-2">
                  {isFa && adjacent.next.headline_fa ? adjacent.next.headline_fa : adjacent.next.headline}
                </span>
                <span className="text-[11px] text-zinc-700 font-mono" dir="ltr">
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
