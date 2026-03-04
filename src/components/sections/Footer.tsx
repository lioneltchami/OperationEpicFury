"use client";

import React from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { SITE_URL } from "@/lib/utils";

const sources = [
  {
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/news/liveblog/2026/2/28/live-israel-launches-attacks-on-iran-multiple-explosions-heard-in-tehran",
  },
  {
    name: "CNN",
    url: "https://edition.cnn.com/world/live-news/israel-iran-attack-02-28-26-hnk-intl",
  },
  {
    name: "PBS",
    url: "https://www.pbs.org/newshour/world/live-updates-u-s-and-israel-attack-iran",
  },
  {
    name: "NPR",
    url: "https://www.npr.org/2026/02/28/nx-s1-5730158/israel-iran-strikes-trump-us",
  },
  {
    name: "NBC News",
    url: "https://www.nbcnews.com/world/iran/live-blog/israel-iran-live-updates-rcna261099",
  },
  {
    name: "Washington Post",
    url: "https://www.washingtonpost.com/world/2026/02/28/israel-strikes-iran-live-updates/",
  },
  {
    name: "Times of Israel",
    url: "https://www.timesofisrael.com/liveblog-february-28-2026/",
  },
  {
    name: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/2026_Israeli%E2%80%93United_States_strikes_on_Iran",
  },
  {
    name: "CENTCOM",
    url: "https://www.centcom.mil/MEDIA/PRESS-RELEASES/Press-Release-View/Article/4418396/",
  },
  {
    name: "Stars and Stripes",
    url: "https://www.stripes.com/theaters/middle_east/2026-02-28/strikes-on-bahrain-iran-israel-20902624.html",
  },
];

export const Footer = () => {
  const { dict, locale } = useLocale();
  const monoClass = "font-mono";

  return (
    <footer className="relative py-16 bg-black border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-6">
            {dict.footer.sources}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {sources.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs text-zinc-500 hover:text-red-400 transition-colors ${monoClass} py-2 px-3 border border-white/5 rounded hover:border-red-500/20`}
              >
                {s.name}
              </a>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className={`text-zinc-500 text-xs ${monoClass}`}>
              {dict.footer.tagline}
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/api/rss"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-orange-400 transition-colors"
                aria-label={dict.accessibility.rssFeed}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6.18 15.64a2.18 2.18 0 110 4.36 2.18 2.18 0 010-4.36zM4 4.44A15.56 15.56 0 0119.56 20h-2.83A12.73 12.73 0 004 7.27V4.44zm0 5.66a9.9 9.9 0 019.9 9.9h-2.83A7.07 7.07 0 004 12.93V10.1z" />
                </svg>
              </a>
              <a
                href={`/${locale}/archive`}
                className="text-zinc-500 hover:text-white transition-colors"
                aria-label={dict.accessibility.archive}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                  />
                </svg>
              </a>
              <a
                href="https://x.com/wejustread"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-white transition-colors"
                aria-label="Follow on X"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <div className={`text-zinc-500 text-[11px] ${monoClass}`}>
                {dict.footer.disclaimer}
              </div>
            </div>
          </div>

          {/* Embed & Export */}
          {/* eslint-disable @next/next/no-html-link-for-pages */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center gap-4 text-[11px]">
            <a
              href="/api/export?format=json"
              className={`text-zinc-500 hover:text-white transition-colors ${monoClass}`}
            >
              {dict.footer.exportJson}
            </a>
            <a
              href="/api/export?format=csv"
              className={`text-zinc-500 hover:text-white transition-colors ${monoClass}`}
            >
              {dict.footer.exportCsv}
            </a>
            <button
              onClick={() => {
                const code = `<iframe src="${SITE_URL}/api/embed" width="480" height="600" frameborder="0"></iframe>`;
                navigator.clipboard.writeText(code);
              }}
              className={`text-zinc-500 hover:text-white transition-colors ${monoClass}`}
            >
              {`${dict.footer.embedCode} \u2398`}
            </button>
          </div>
          {/* eslint-enable @next/next/no-html-link-for-pages */}
        </div>
      </div>
    </footer>
  );
};
