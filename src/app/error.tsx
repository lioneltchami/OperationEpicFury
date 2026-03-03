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
    <main className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-white mb-4">{t.title}</h1>
        <p className="text-zinc-400 mb-6">{t.desc}</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            {t.tryAgain}
          </button>
          <Link
            href={`/${locale}`}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {t.back}
          </Link>
        </div>
      </div>
    </main>
  );
}
