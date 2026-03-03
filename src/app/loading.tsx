import { headers } from "next/headers";

export default async function Loading() {
  const locale = (await headers()).get("x-next-locale") ?? "en";
  const text = locale === "fr" ? "Chargement..." : "Loading...";

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 h-3 w-3 rounded-full bg-red-600 animate-pulse-dot" />
        <p className="text-zinc-500 text-sm">{text}</p>
      </div>
    </main>
  );
}
