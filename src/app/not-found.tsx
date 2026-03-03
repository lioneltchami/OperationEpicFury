import { headers } from "next/headers";
import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export default async function NotFound() {
	const locale = ((await headers()).get("x-next-locale") as Locale) ?? "en";
	const dict = await getDictionary(locale);

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
				<p className="text-[120px] font-headline font-black leading-none text-red-600/10 select-none tracking-tight">
					404
				</p>
				<div className="card-tactical border border-white/[0.06] rounded-sm p-8 -mt-8">
					<div className="flex items-center justify-center gap-2 mb-4">
						<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
						<span className="text-xs font-mono tracking-widest text-red-400 uppercase">
							{locale === "fr" ? "Signal perdu" : "Signal lost"}
						</span>
					</div>
					<h1 className="text-2xl font-headline font-bold text-white mb-3">
						{dict.errors.notFound}
					</h1>
					<p className="text-sm text-zinc-400 mb-8 leading-relaxed">
						{dict.errors.notFoundDesc}
					</p>
					<Link
						href={`/${locale}`}
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
								d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
							/>
						</svg>
						{dict.errors.backToTimeline}
					</Link>
				</div>
			</div>
		</main>
	);
}
