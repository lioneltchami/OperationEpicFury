import { getPublishedEventsPaginated } from "@/lib/kv";
import type { TimelineEvent } from "@/data/timeline";

import { SITE_URL, SITE_NAME, SITE_NAME_FA } from "@/lib/utils";

const FEED_SIZE = 50;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function eventToDate(e: TimelineEvent): string {
  // timeET is "YYYY-MM-DD HH:MM" in ET
  const [date, time] = e.timeET.split(" ");
  if (!date || !time) return new Date().toUTCString();
  return new Date(`${date}T${time}:00-05:00`).toUTCString();
}

function eventToIso(e: TimelineEvent): string {
  const [date, time] = e.timeET.split(" ");
  if (!date || !time) return new Date().toISOString();
  return new Date(`${date}T${time}:00-05:00`).toISOString();
}

async function getFeedEvents() {
  const { events } = await getPublishedEventsPaginated(0, FEED_SIZE);
  return events;
}

export async function generateRss(locale: "en" | "fa"): Promise<string> {
  const events = await getFeedEvents();
  const isFa = locale === "fa";
  const title = isFa ? SITE_NAME_FA : SITE_NAME;
  const description = isFa
    ? "تایملاین لحظه‌به‌لحظه عملیات خشم حماسی"
    : `A minute-by-minute timeline of ${SITE_NAME}`;

  const items = events.map((e) => {
    const headline = isFa && e.headline_fa ? e.headline_fa : e.headline;
    const body = isFa && e.body_fa ? e.body_fa : e.body;
    const link = `${SITE_URL}/${locale}/events/${e.slug ?? e.id}`;
    return `    <item>
      <title>${escapeXml(headline)}</title>
      <description>${escapeXml(body)}</description>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${eventToDate(e)}</pubDate>
      <category>${escapeXml(e.category)}</category>
      <source url="${escapeXml(e.sourceUrl)}">${escapeXml(e.source)}</source>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${SITE_URL}/${locale}</link>
    <description>${escapeXml(description)}</description>
    <language>${locale}</language>
    <atom:link href="${SITE_URL}/api/rss${isFa ? "/fa" : ""}" rel="self" type="application/rss+xml"/>
${items.join("\n")}
  </channel>
</rss>`;
}

export async function generateAtom(locale: "en" | "fa"): Promise<string> {
  const events = await getFeedEvents();
  const isFa = locale === "fa";
  const title = isFa ? SITE_NAME_FA : SITE_NAME;
  const subtitle = isFa
    ? "تایملاین لحظه‌به‌لحظه عملیات خشم حماسی"
    : `A minute-by-minute timeline of ${SITE_NAME}`;
  const altLocale = isFa ? "en" : "fa";
  const updated = events.length > 0 ? eventToIso(events[0]) : new Date().toISOString();

  const entries = events.map((e) => {
    const headline = isFa && e.headline_fa ? e.headline_fa : e.headline;
    const body = isFa && e.body_fa ? e.body_fa : e.body;
    const link = `${SITE_URL}/${locale}/events/${e.slug ?? e.id}`;
    return `  <entry>
    <title>${escapeXml(headline)}</title>
    <link href="${link}"/>
    <id>${link}</id>
    <updated>${eventToIso(e)}</updated>
    <summary>${escapeXml(body)}</summary>
    <category term="${escapeXml(e.category)}"/>
    <author><name>${escapeXml(e.source)}</name></author>
  </entry>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(title)}</title>
  <subtitle>${escapeXml(subtitle)}</subtitle>
  <link href="${SITE_URL}/api/atom${isFa ? "/fa" : ""}" rel="self" type="application/atom+xml"/>
  <link href="${SITE_URL}/${locale}" rel="alternate" type="text/html"/>
  <link href="${SITE_URL}/api/atom/${altLocale === "fa" ? "fa" : ""}" rel="alternate" type="application/atom+xml" hreflang="${altLocale}"/>
  <id>${SITE_URL}/${locale}</id>
  <updated>${updated}</updated>
${entries.join("\n")}
</feed>`;
}
