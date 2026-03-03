"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/LocaleContext";

export function LanguageSwitcher() {
  const { locale } = useLocale();
  const pathname = usePathname();

  function getOtherLocalePath() {
    const otherLocale = locale === "en" ? "fr" : "en";
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] === "en" || segments[0] === "fr") {
      segments[0] = otherLocale;
    } else {
      segments.unshift(otherLocale);
    }
    return `/${segments.join("/")}`;
  }

  return (
    <Link
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
    </Link>
  );
}
