"use client";

import { useEffect, useState } from "react";
import { CurrentDate } from "@/components/ui/CurrentDate";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { SplitText } from "@/components/ui/SplitText";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

type Props = {
  dict: Dictionary;
  locale: Locale;
};

const HUDItem = ({
  label,
  value,
  color = "text-red-500",
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <div className="flex items-center gap-2 text-[10px] font-mono tracking-tighter uppercase mb-1">
    <span className="text-zinc-600 italic">{label}:</span>
    <span className={color}>{value}</span>
  </div>
);

export const Hero = ({ dict, locale }: Props) => {
  const [tehranTime, setTehranTime] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      setTehranTime(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: "Asia/Tehran",
          hour12: false,
        }),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isFr = locale === "fr";
  const monoClass = isFr ? "" : "font-mono";

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Language switcher + X/Twitter */}
      <div className="absolute top-4 ltr:right-4 rtl:left-4 z-20 flex items-center gap-3">
        <a
          href="https://x.com/wejustread"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 hover:text-white transition-colors p-1.5"
          aria-label="Follow on X"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <LanguageSwitcher />
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(127,29,29,0.2),transparent_50%)]" />
        {/* Animated grid — CSS animation, no JS */}
        <div
          className="absolute inset-0 animate-grid-scroll"
          style={{
            backgroundImage:
              "linear-gradient(rgba(220,38,38,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Operations HUD */}
        <div className="absolute top-20 left-4 z-20 p-3 bg-black/40 border border-zinc-800/50 backdrop-blur-sm rounded hidden md:block select-none">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-900">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-500 tracking-[0.2em]">
              OP_HUD_V2.1
            </span>
          </div>
          <HUDItem label="SATELLITE" value="ACTIVE" color="text-green-500" />
          <HUDItem label="INTEL_FEED" value="ONLINE" color="text-green-500" />
          <HUDItem label="SWR_POLL" value="ACTIVE (30S)" />
          <HUDItem
            label="TEHRAN"
            value={tehranTime || "00:00:00"}
            color="text-red-400"
          />
        </div>

        {/* Scanlines */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
          }}
        />
      </div>

      {/* Content — all CSS animations, no JS dependency for visibility */}
      <div className="relative z-10 text-center max-w-5xl">
        {/* Date badge */}
        <div
          className="mb-8"
          style={{ animation: "fade-in-up 0.6s ease-out both" }}
        >
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-sm ${monoClass} tracking-wider`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
            <CurrentDate />
          </span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tight font-headline uppercase">
          <SplitText
            text={dict.hero.headline1}
            className="block text-red-500"
            delay={0.2}
            splitBy={isFr ? "word" : "letter"}
          />
          <SplitText
            text={dict.hero.headline2}
            className="block"
            delay={0.6}
            splitBy={isFr ? "word" : "letter"}
          />
        </h1>

        {/* Subtitle */}
        <p
          className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
          style={{ animation: "fade-in 0.8s ease-out 0.6s both" }}
        >
          {dict.hero.subtitle}
        </p>

        {/* Operation names */}
        <div
          className={`flex flex-wrap items-center justify-center gap-4 text-xs font-headline font-bold tracking-widest text-zinc-500 uppercase`}
          style={{ animation: "fade-in-down 0.6s ease-out 0.8s both" }}
        >
          <span className="px-3 py-1.5 border border-zinc-800 rounded">
            {dict.hero.opUS}
          </span>
          <span className="px-3 py-1.5 border border-zinc-800 rounded">
            {dict.hero.opIsrael}
          </span>
          <span className="px-3 py-1.5 border border-zinc-800 rounded">
            {dict.hero.opIran}
          </span>
        </div>

        {/* Scroll indicator */}
        <div
          className="mt-16"
          style={{ animation: "fade-in 0.5s ease-out 1.0s both" }}
        >
          <div className="flex flex-col items-center gap-2 text-zinc-600 animate-bounce-scroll">
            <span className={`text-xs ${monoClass} tracking-widest uppercase`}>
              {dict.hero.scroll}
            </span>
            <svg
              width="16"
              height="24"
              viewBox="0 0 16 24"
              fill="none"
              className="text-red-500/50"
            >
              <path
                d="M7.29 23.71a1 1 0 001.42 0l6.36-6.36a1 1 0 10-1.42-1.42L8 21.59l-5.66-5.66a1 1 0 00-1.41 1.42l6.36 6.36zM7 0v23.3h2V0H7z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};
