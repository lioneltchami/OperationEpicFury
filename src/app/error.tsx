"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  const locale =
    typeof window !== "undefined" && window.location.pathname.startsWith("/fr")
      ? "fr"
      : "en";

  const t =
    locale === "fr"
      ? {
          title: "Une erreur est survenue",
          desc: "Une erreur inattendue s'est produite. Veuillez reessayer.",
          tryAgain: "Reessayer",
          back: "Retour a la chronologie",
        }
      : {
          title: "Something Went Wrong",
          desc: "An unexpected error occurred. Please try again.",
          tryAgain: "Try Again",
          back: "Back to Timeline",
        };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.08),transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(220,38,38,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-md">
        <div className="card-tactical border border-white/[0.06] rounded-sm p-8">
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse-dot" />
            <span className="text-xs font-mono tracking-widest text-orange-400 uppercase">
              {locale === "fr" ? "Erreur systeme" : "System error"}
            </span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-white mb-3">
            {t.title}
          </h1>
          <p className="text-sm text-zinc-400 mb-8 leading-relaxed">{t.desc}</p>
          {error.digest && (
            <p className="text-[10px] font-mono text-zinc-600 mb-6 tracking-wider">
              REF: {error.digest}
            </p>
          )}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white text-sm font-bold tracking-wider rounded-sm hover:bg-red-700 transition-colors focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:outline-none"
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
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                />
              </svg>
              {t.tryAgain}
            </button>
            <Link
              href={`/${locale}`}
              className="text-sm text-zinc-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:outline-none rounded-sm px-2 py-1"
            >
              {t.back}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
