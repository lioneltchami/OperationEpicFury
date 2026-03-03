"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/LocaleContext";

export function LanguageSwitcher() {
  const { locale } = useLocale();
  const pathname = usePathname();

  function getOtherLocalePath() {
    const otherLocale = locale === "en" ? "fr" : "en";
    const rest = pathname.replace(/^\/(en|fr)/, "");
    return `/${otherLocale}${rest}`;
  }

  return (
    <a
      href={getOtherLocalePath()}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-900/80 text-xs tracking-wider text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
    >
      {locale === "en" ? (
        <>
          <span className="text-white font-bold font-mono">EN</span>
          <span className="text-zinc-600">|</span>
          <span>FR</span>
        </>
      ) : (
        <>
          <span className="font-mono">EN</span>
          <span className="text-zinc-600">|</span>
          <span className="text-white font-bold">FR</span>
        </>
      )}
    </a>
  );
}
