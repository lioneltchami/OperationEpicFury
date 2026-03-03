import { headers } from "next/headers";
import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export default async function NotFound() {
  const locale = ((await headers()).get("x-next-locale") as Locale) ?? "en";
  const dict = await getDictionary(locale);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-red-600/20 select-none">404</p>
        <h1 className="text-2xl font-bold text-white mb-4">
          {dict.errors.notFound}
        </h1>
        <p className="text-zinc-400 mb-6">{dict.errors.notFoundDesc}</p>
        <Link
          href={`/${locale}`}
          className="inline-block px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          {dict.errors.backToTimeline}
        </Link>
      </div>
    </main>
  );
}
