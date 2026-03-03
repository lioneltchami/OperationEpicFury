import { headers } from "next/headers";

export default async function Loading() {
  const locale = (await headers()).get("x-next-locale") ?? "en";
  const text = locale === "fr" ? "Chargement..." : "Loading...";

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.05),transparent_70%)]" />
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
          <span
            className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot"
            style={{ animationDelay: "0.2s" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
        <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase">
          {text}
        </p>
      </div>
    </main>
  );
}
