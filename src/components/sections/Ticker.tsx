"use client";

import React from "react";
import { ScrollVelocity } from "@/components/ui/ScrollVelocity";
import { useLocale } from "@/i18n/LocaleContext";

export const Ticker = () => {
  const { dict, locale } = useLocale();
  const headlines = dict.ticker.headlines;
  const isFr = locale === "fr";
  const monoClass = isFr ? "" : "font-mono";

  return (
    <div className="relative py-3 bg-red-600/10 border-y border-red-500/20 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10" />
      <ScrollVelocity
        baseVelocity={-2}
        className={`text-red-400 font-headline text-xs tracking-widest font-bold uppercase`}
      >
        <span className="flex items-center gap-6">
          {headlines.map((h: string, i: number) => (
            <span key={i} className="flex items-center gap-6 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {h}
            </span>
          ))}
        </span>
      </ScrollVelocity>
    </div>
  );
};
