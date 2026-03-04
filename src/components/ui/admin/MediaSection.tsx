"use client";

import { useState } from "react";
import type { MediaItem } from "@/data/timeline";
import { FormLabel, FormSection, inputClass } from "../AdminEventForm";

interface MediaSectionProps {
	media: MediaItem[];
	setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>;
	inputClass: string;
}

export function MediaSection({ media, setMedia }: MediaSectionProps) {
	const [newMediaUrl, setNewMediaUrl] = useState("");
	const [newMediaFileId, setNewMediaFileId] = useState("");
	const [newMediaType, setNewMediaType] = useState<"photo" | "video">("photo");
	const [dragIdx, setDragIdx] = useState<number | null>(null);
	const [infoIdx, setInfoIdx] = useState<number | null>(null);

	function removeMedia(idx: number) {
		setMedia((prev) => prev.filter((_, i) => i !== idx));
	}

	function addMediaByUrl() {
		const url = newMediaUrl.trim();
		if (!url) return;
		setMedia((prev) => [...prev, { fileId: "", type: "photo" as const, url }]);
		setNewMediaUrl("");
	}

	function addMediaByFileId() {
		const fileId = newMediaFileId.trim();
		if (!fileId) return;
		setMedia((prev) => [...prev, { fileId, type: newMediaType }]);
		setNewMediaFileId("");
	}

	function handleDragStart(idx: number) {
		setDragIdx(idx);
	}

	function handleDragOver(e: React.DragEvent, idx: number) {
		e.preventDefault();
		if (dragIdx === null || dragIdx === idx) return;
		setMedia((prev) => {
			const next = [...prev];
			const [moved] = next.splice(dragIdx, 1);
			next.splice(idx, 0, moved);
			return next;
		});
		setDragIdx(idx);
	}

	function handleDragEnd() {
		setDragIdx(null);
	}

	function updateCaption(idx: number, caption: string) {
		setMedia((prev) =>
			prev.map((item, i) => (i === idx ? { ...item, caption } : item)),
		);
	}

	return (
		<FormSection title="Media">
			{/* Existing media grid */}
			{media.length > 0 && (
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
					{media.map((item, idx) => (
						<div
							key={idx}
							draggable
							onDragStart={() => handleDragStart(idx)}
							onDragOver={(e) => handleDragOver(e, idx)}
							onDragEnd={handleDragEnd}
							className={`relative group rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 ${
								dragIdx === idx ? "opacity-50 ring-2 ring-red-500" : ""
							}`}
						>
							{/* Drag handle */}
							<div className="absolute top-1 left-1 z-10 p-1 rounded bg-black/60 text-zinc-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
								<svg
									className="w-3.5 h-3.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
									/>
								</svg>
							</div>
							{/* Top-right buttons */}
							<div className="absolute top-1 right-1 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
								<button
									type="button"
									onClick={() => setInfoIdx(infoIdx === idx ? null : idx)}
									className="p-1 rounded bg-black/60 text-zinc-400 hover:text-blue-400"
								>
									<svg
										className="w-3.5 h-3.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
										/>
									</svg>
								</button>
								<button
									type="button"
									onClick={() => removeMedia(idx)}
									className="p-1 rounded bg-black/60 text-zinc-400 hover:text-red-400"
								>
									<svg
										className="w-3.5 h-3.5"
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
							</div>
							{/* Thumbnail or Info overlay */}
							<div className="aspect-video bg-zinc-800 flex items-center justify-center relative">
								{infoIdx === idx ? (
									<div
										className="absolute inset-0 bg-black/90 p-2 overflow-auto text-[10px] font-mono text-zinc-300 space-y-0.5 select-text cursor-text z-20"
										draggable={false}
										onDragStart={(e) => e.stopPropagation()}
										onMouseDown={(e) => e.stopPropagation()}
									>
										<p>
											<span className="text-zinc-500">type:</span> {item.type}
										</p>
										{item.fileId && (
											<p className="break-all">
												<span className="text-zinc-500">fileId:</span>{" "}
												{item.fileId}
											</p>
										)}
										{item.url && (
											<p className="break-all">
												<span className="text-zinc-500">url:</span> {item.url}
											</p>
										)}
										{item.thumbnailFileId && (
											<p className="break-all">
												<span className="text-zinc-500">thumb:</span>{" "}
												{item.thumbnailFileId}
											</p>
										)}
										{item.width && (
											<p>
												<span className="text-zinc-500">size:</span>{" "}
												{item.width}x{item.height}
											</p>
										)}
										{item.duration != null && (
											<p>
												<span className="text-zinc-500">duration:</span>{" "}
												{item.duration}s
											</p>
										)}
										{item.mimeType && (
											<p>
												<span className="text-zinc-500">mime:</span>{" "}
												{item.mimeType}
											</p>
										)}
										<div className="pt-1 border-t border-zinc-700 mt-1">
											<label className="text-zinc-500 block mb-0.5">
												caption:
											</label>
											<input
												type="text"
												value={item.caption ?? ""}
												onChange={(e) => updateCaption(idx, e.target.value)}
												placeholder="Add caption..."
												className="w-full bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
											/>
										</div>
									</div>
								) : item.type === "video" ? (
									item.thumbnailFileId ? (
										<img
											src={`/api/media/${encodeURIComponent(item.thumbnailFileId)}`}
											alt=""
											className="w-full h-full object-cover"
										/>
									) : (
										<svg
											className="w-8 h-8 text-zinc-600"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path d="M8 5v14l11-7z" />
										</svg>
									)
								) : (
									<img
										src={
											item.url ||
											`/api/media/${encodeURIComponent(item.fileId)}`
										}
										alt=""
										className="w-full h-full object-cover"
									/>
								)}
							</div>
							{/* Type badge */}
							<div className="px-2 py-1 text-[10px] text-zinc-500 truncate">
								{item.type === "video" ? "Video" : "Photo"}
								{item.url
									? " (URL)"
									: item.fileId
										? ` (${item.fileId.slice(0, 12)}...)`
										: ""}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add by URL */}
			<div>
				<FormLabel>Add Image by URL</FormLabel>
				<div className="flex gap-2">
					<input
						className={`${inputClass} flex-1`}
						value={newMediaUrl}
						onChange={(e) => setNewMediaUrl(e.target.value)}
						placeholder="https://example.com/image.jpg"
						type="url"
					/>
					<button
						type="button"
						onClick={addMediaByUrl}
						disabled={!newMediaUrl.trim()}
						className="px-4 py-2.5 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 transition-all shrink-0"
					>
						Add
					</button>
				</div>
			</div>

			{/* Add by Telegram file ID */}
			<div>
				<FormLabel>Add by Telegram File ID</FormLabel>
				<div className="flex gap-2">
					<input
						className={`${inputClass} !w-0 min-w-0 flex-1`}
						value={newMediaFileId}
						onChange={(e) => setNewMediaFileId(e.target.value)}
						placeholder="AgACAgIAAxkBAAI..."
					/>
					<select
						className={`${inputClass} !w-24 shrink-0`}
						value={newMediaType}
						onChange={(e) =>
							setNewMediaType(e.target.value as "photo" | "video")
						}
					>
						<option value="photo">Photo</option>
						<option value="video">Video</option>
					</select>
					<button
						type="button"
						onClick={addMediaByFileId}
						disabled={!newMediaFileId.trim()}
						className="px-4 py-2.5 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 transition-all shrink-0"
					>
						Add
					</button>
				</div>
			</div>
		</FormSection>
	);
}
