import React from "react";
import { SplitText } from "@/components/ui/SplitText";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { CurrentDate } from "@/components/ui/CurrentDate";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

type Props = {
  dict: Dictionary;
  locale: Locale;
};

export const Hero = ({ dict, locale }: Props) => {
  const isFr = locale === "fr";
  const monoClass = isFr ? "" : "font-mono";

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Language switcher + GitHub */}
      <div className="absolute top-4 ltr:right-4 rtl:left-4 z-20 flex items-center gap-3">
        <a
          href="https://github.com/FZ1010/OperationEpicFury"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 hover:text-white transition-colors p-1.5"
          aria-label="GitHub"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
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
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-sm ${monoClass} tracking-wider`}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
            <CurrentDate />
          </span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tight">
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
          style={{ animation: "fade-in 0.8s ease-out 1s both" }}
        >
          {dict.hero.subtitle}
        </p>

        {/* Operation names */}
        <div
          className={`flex flex-wrap items-center justify-center gap-4 text-xs ${monoClass} tracking-widest text-zinc-500`}
          style={{ animation: "fade-in-down 0.6s ease-out 1.4s both" }}
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
          style={{ animation: "fade-in 0.5s ease-out 1.8s both" }}
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
