"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { MediaItem } from "@/data/timeline";
import { cn } from "@/lib/utils";

function mediaUrl(item: MediaItem): string {
	if (item.url) {
		// Proxy external images to bypass hotlink protection
		if (item.type === "photo") {
			return `/api/image-proxy?url=${encodeURIComponent(item.url)}`;
		}
		return item.url;
	}
	const base = `/api/media/${encodeURIComponent(item.fileId)}`;
	return item.type === "video" ? `${base}?type=video` : base;
}

function Skeleton({ aspectRatio }: { aspectRatio?: number }) {
	return (
		<div
			className="w-full max-h-48 rounded-lg bg-zinc-800 animate-pulse"
			style={{ aspectRatio: aspectRatio ?? 16 / 9 }}
		/>
	);
}

function MediaThumb({
	item,
	onClick,
	eventHeadline,
}: {
	item: MediaItem;
	onClick: () => void;
	eventHeadline?: string;
}) {
	const [loaded, setLoaded] = useState(false);
	const aspectRatio =
		item.width && item.height ? item.width / item.height : undefined;

	if (item.type === "video") {
		const thumbSrc = item.thumbnailFileId
			? `/api/media/${encodeURIComponent(item.thumbnailFileId)}`
			: undefined;

		return (
			<div>
				<button
					onClick={onClick}
					aria-label="Play video"
					className="relative w-full max-h-48 overflow-hidden rounded-lg group cursor-pointer bg-zinc-900"
					style={{ aspectRatio: aspectRatio ?? 16 / 9 }}
				>
					{thumbSrc && (
						<Image
							src={thumbSrc}
							alt={eventHeadline || "Video thumbnail"}
							width={item.width || 320}
							height={item.height || 240}
							sizes="(max-width: 640px) 50vw, 200px"
							className="w-full h-full object-cover"
						/>
					)}
					<div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
						<svg
							className="w-10 h-10 text-white/90"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path d="M8 5v14l11-7z" />
						</svg>
					</div>
				</button>
				{item.caption && (
					<p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
						{item.caption}
					</p>
				)}
			</div>
		);
	}

	return (
		<div>
			<button
				onClick={onClick}
				aria-label="View photo"
				className="relative w-full max-h-48 overflow-hidden rounded-lg cursor-pointer"
			>
				{!loaded && <Skeleton aspectRatio={aspectRatio} />}
				<Image
					src={mediaUrl(item)}
					alt={eventHeadline || "Event media"}
					unoptimized={!!item.url}
					width={item.width || 320}
					height={item.height || 240}
					sizes="(max-width: 640px) 50vw, 200px"
					className={cn(
						"w-full h-full object-cover rounded-lg bg-zinc-900 transition-opacity",
						loaded ? "hover:opacity-90" : "absolute inset-0 opacity-0",
					)}
					onLoad={() => setLoaded(true)}
				/>
			</button>
			{item.caption && (
				<p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
					{item.caption}
				</p>
			)}
		</div>
	);
}

function Lightbox({
	item,
	onClose,
	onPrev,
	onNext,
	hasPrev,
	hasNext,
	current,
	total,
	eventHeadline,
}: {
	item: MediaItem;
	onClose: () => void;
	onPrev: () => void;
	onNext: () => void;
	hasPrev: boolean;
	hasNext: boolean;
	current: number;
	total: number;
	eventHeadline?: string;
}) {
	const [touchStart, setTouchStart] = useState<number | null>(null);

	function handlePointerDown(e: React.PointerEvent) {
		setTouchStart(e.clientX);
	}

	function handlePointerUp(e: React.PointerEvent) {
		if (touchStart === null) return;
		const diff = e.clientX - touchStart;
		const threshold = 50;
		if (diff > threshold && hasPrev) onPrev();
		if (diff < -threshold && hasNext) onNext();
		setTouchStart(null);
	}

	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowLeft" && hasPrev) onPrev();
			if (e.key === "ArrowRight" && hasNext) onNext();
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [onClose, onPrev, onNext, hasPrev, hasNext]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
			onClick={onClose}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			style={{ touchAction: "pan-y" }}
		>
			<button
				aria-label="Close"
				className="absolute top-4 right-4 text-white/70 hover:text-white z-50"
				onClick={onClose}
			>
				<svg
					className="w-8 h-8"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
			{hasPrev && (
				<button
					aria-label="Previous"
					className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/80 transition-all z-50"
					onClick={(e) => {
						e.stopPropagation();
						onPrev();
					}}
				>
					<svg
						className="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15.75 19.5L8.25 12l7.5-7.5"
						/>
					</svg>
				</button>
			)}
			{hasNext && (
				<button
					aria-label="Next"
					className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/80 transition-all z-50"
					onClick={(e) => {
						e.stopPropagation();
						onNext();
					}}
				>
					<svg
						className="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M8.25 4.5l7.5 7.5-7.5 7.5"
						/>
					</svg>
				</button>
			)}
			<div
				className="max-w-[90vw] max-h-[90vh]"
				onClick={(e) => e.stopPropagation()}
			>
				{item.type === "video" ? (
					<video
						src={mediaUrl(item)}
						className="max-w-full max-h-[90vh] rounded-lg"
						controls
						autoPlay
						playsInline
					/>
				) : (
					<Image
						src={mediaUrl(item)}
						alt={eventHeadline || "Event media"}
						unoptimized={!!item.url}
						width={item.width || 800}
						height={item.height || 600}
						sizes="90vw"
						quality={90}
						className="max-w-full max-h-[90vh] rounded-lg object-contain"
					/>
				)}
			</div>
			{item.caption && (
				<p className="absolute bottom-12 left-1/2 -translate-x-1/2 max-w-[80vw] bg-black/70 px-4 py-2 rounded text-sm text-zinc-300 text-center">
					{item.caption}
				</p>
			)}
			{total > 1 && (
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-xs text-zinc-400 font-mono">
					{current} / {total}
				</div>
			)}
		</div>
	);
}

export function MediaGallery({
	media,
	eventHeadline,
}: {
	media: MediaItem[];
	eventHeadline?: string;
}) {
	const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
	const closeLightbox = useCallback(() => setLightboxIdx(null), []);

	if (media.length === 0) return null;

	return (
		<>
			<div
				className={cn(
					"mt-3 mb-3",
					media.length === 1
						? "max-w-xs"
						: "grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg",
				)}
			>
				{media.map((item, i) => (
					<MediaThumb
						key={item.url ?? item.fileId}
						item={item}
						onClick={() => setLightboxIdx(i)}
						eventHeadline={eventHeadline}
					/>
				))}
			</div>
			{lightboxIdx !== null && (
				<Lightbox
					item={media[lightboxIdx]}
					onClose={closeLightbox}
					onPrev={() =>
						setLightboxIdx((i) => (i !== null && i > 0 ? i - 1 : i))
					}
					onNext={() =>
						setLightboxIdx((i) =>
							i !== null && i < media.length - 1 ? i + 1 : i,
						)
					}
					hasPrev={lightboxIdx > 0}
					hasNext={lightboxIdx < media.length - 1}
					current={lightboxIdx + 1}
					total={media.length}
					eventHeadline={eventHeadline}
				/>
			)}
		</>
	);
}
