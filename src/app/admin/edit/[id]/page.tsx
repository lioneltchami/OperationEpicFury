import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEventForm } from "@/components/ui/AdminEventForm";
import { getEventById } from "@/lib/kv";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const event = await getEventById(id);
	if (!event) notFound();

	return (
		<div>
			<div className="flex items-center gap-3 mb-6">
				<Link
					href="/admin"
					className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
				>
					<svg
						className="w-5 h-5"
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
				</Link>
				<div>
					<h1 className="text-lg font-bold text-white">Edit Event</h1>
					<p className="text-xs text-zinc-600 font-mono">{id}</p>
				</div>
			</div>
			<AdminEventForm event={event} mode="edit" />
		</div>
	);
}
