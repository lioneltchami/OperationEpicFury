"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocalTime } from "@/components/ui/LocalTime";
import type { EventCategory, MediaItem, TimelineEvent } from "@/data/timeline";

const categories: { value: EventCategory; label: string; color: string }[] = [
  { value: "strike", label: "Strike", color: "text-red-400" },
  { value: "retaliation", label: "Retaliation", color: "text-orange-400" },
  { value: "announcement", label: "Announcement", color: "text-blue-400" },
  { value: "casualty", label: "Casualty", color: "text-purple-400" },
  { value: "world-reaction", label: "World Reaction", color: "text-green-400" },
  { value: "breaking", label: "Breaking", color: "text-yellow-400" },
  {
    value: "breaking-important",
    label: "Breaking Important",
    color: "text-red-400",
  },
];

type Props = {
  event?: TimelineEvent;
  mode: "create" | "edit";
  /** Called after successful save (modal mode) */
  onSaved?: () => void;
  /** Called when user cancels (modal mode) */
  onCancel?: () => void;
};

export function AdminEventForm({ event, mode, onSaved, onCancel }: Props) {
  const router = useRouter();
  const isModal = !!onSaved;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showFrench, setShowFrench] = useState(
    !!(event?.headline_fr || event?.body_fr),
  );
  const [showPreview, setShowPreview] = useState(false);

  const [timeET, setTimeET] = useState(event?.timeET ?? "");
  const [headline, setHeadline] = useState(event?.headline ?? "");
  const [body, setBody] = useState(event?.body ?? "");
  const [category, setCategory] = useState<EventCategory>(
    event?.category ?? "announcement",
  );
  const [source, setSource] = useState(event?.source ?? "");
  const [sourceUrl, setSourceUrl] = useState(event?.sourceUrl ?? "");
  const [breaking, setBreaking] = useState(event?.breaking ?? false);
  const [headlineFr, setHeadlineFr] = useState(event?.headline_fr ?? "");
  const [bodyFr, setBodyFr] = useState(event?.body_fr ?? "");
  const [locationName, setLocationName] = useState(event?.location?.name ?? "");
  const [locationLat, setLocationLat] = useState(
    event?.location?.lat?.toString() ?? "",
  );
  const [locationLng, setLocationLng] = useState(
    event?.location?.lng?.toString() ?? "",
  );
  const [media, setMedia] = useState<MediaItem[]>(event?.media ?? []);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaFileId, setNewMediaFileId] = useState("");
  const [newMediaType, setNewMediaType] = useState<"photo" | "video">("photo");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [infoIdx, setInfoIdx] = useState<number | null>(null);

  const validTime = timeET.match(/^(\d{4}-\d{2}-\d{2}\s+)?\d{1,2}:\d{2}$/)
    ? true
    : false;

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

  function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validTime) {
      setError(
        "Invalid time format. Use YYYY-MM-DD HH:MM (e.g. 2026-03-01 14:30)",
      );
      return;
    }
    setShowPreview(true);
  }

  async function handleConfirm() {
    if (!validTime) return;
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      timeET,
      headline,
      body,
      category,
      source,
      sourceUrl,
      breaking,
      status: mode === "create" ? "draft" : (event?.status ?? "published"),
    };
    if (headlineFr) payload.headline_fr = headlineFr;
    if (bodyFr) payload.body_fr = bodyFr;
    payload.media = media;
    if (locationName && locationLat && locationLng) {
      payload.location = {
        name: locationName,
        lat: parseFloat(locationLat),
        lng: parseFloat(locationLng),
      };
    }

    const url = mode === "create" ? "/api/events" : `/api/events/${event!.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        setSaving(false);
        return;
      }

      const created = await res.json();

      if (mode === "create") {
        fetch("/api/translate-trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: created.id }),
        }).catch(() => {});
      }

      if (onSaved) {
        onSaved();
      } else {
        router.push("/admin");
      }
      router.refresh();
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  // ─── Preview ───
  if (showPreview && validTime) {
    return (
      <div className="max-w-2xl space-y-5 animate-slide-up">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(false)}
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
          </button>
          <h2 className="text-lg font-bold text-white">Preview</h2>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-zinc-800/50 bg-zinc-900/30">
            <span className="text-xs font-mono text-white">
              <LocalTime timeET={timeET} />
            </span>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md badge-${category}`}
              >
                {categories.find((c) => c.value === category)?.label}
              </span>
              {breaking && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-600/20 text-red-400 border border-red-600/30">
                  Breaking
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white leading-snug">
              {headline}
            </h3>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {body}
            </p>
            {media.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {media.map((item, idx) => (
                  <div
                    key={idx}
                    className="aspect-video rounded-lg overflow-hidden bg-zinc-800"
                  >
                    {item.type === "video" ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-zinc-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
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
                ))}
              </div>
            )}
          </div>

          {locationName && locationLat && locationLng && (
            <div className="px-5 py-3 border-t border-zinc-800/50 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-red-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              <span className="text-sm text-zinc-400">{locationName}</span>
              <span className="text-xs text-zinc-600 font-mono">
                ({locationLat}, {locationLng})
              </span>
            </div>
          )}

          {/* French preview */}
          {(headlineFr || bodyFr) && (
            <div className="px-5 py-4 border-t border-zinc-800/50" dir="ltr">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">
                French Translation
              </p>
              <h3 className="text-lg font-semibold text-white">{headlineFr}</h3>
              <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">
                {bodyFr}
              </p>
            </div>
          )}

          {/* Source */}
          <div className="px-5 py-3 border-t border-zinc-800/50 bg-zinc-900/20">
            <p className="text-xs text-zinc-600">
              Source: <span className="text-zinc-400">{source}</span>
            </p>
          </div>
        </div>

        {mode === "create" && (
          <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-800/30 text-amber-300 px-4 py-3 rounded-lg text-xs leading-relaxed">
            <svg
              className="w-4 h-4 shrink-0 mt-0.5 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            This event will be saved as a draft. Translation will be added
            automatically.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="
              flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
              bg-red-600 text-white
              hover:bg-red-500 active:bg-red-700
              disabled:opacity-50
              transition-all duration-150
              shadow-lg shadow-red-600/20
            "
          >
            {saving ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Saving...
              </>
            ) : mode === "create" ? (
              "Confirm & Save Draft"
            ) : (
              "Confirm & Update"
            )}
          </button>
          <button
            onClick={() => setShowPreview(false)}
            className="px-4 py-2.5 text-sm text-zinc-400 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all"
          >
            Back to Edit
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Form ───
  return (
    <form
      onSubmit={handlePreview}
      className="max-w-2xl space-y-6 animate-slide-up"
    >
      {error && (
        <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg text-sm animate-shake">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* ── Section: Timing ── */}
      <FormSection title="Timing">
        <div>
          <FormLabel>Date & Time (ET)</FormLabel>
          <input
            className={`${inputClass} max-w-[280px] font-mono`}
            value={timeET}
            onChange={(e) => setTimeET(e.target.value)}
            placeholder="2026-03-01 14:30"
            pattern="\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}"
            title="Format: YYYY-MM-DD HH:MM"
            required
          />
          {validTime && (
            <p className="text-xs text-zinc-500 font-mono mt-1.5">
              <LocalTime timeET={timeET} />
            </p>
          )}
        </div>
      </FormSection>

      {/* ── Section: Content ── */}
      <FormSection title="Content">
        <div>
          <FormLabel>Headline</FormLabel>
          <input
            className={inputClass}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="What happened?"
            required
          />
        </div>

        <div>
          <FormLabel>Body</FormLabel>
          <textarea
            className={`${inputClass} min-h-[120px] resize-y`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Provide more details..."
            required
          />
        </div>
      </FormSection>

      {/* ── Section: Classification ── */}
      <FormSection title="Classification">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FormLabel>Category</FormLabel>
            <select
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer group pb-2.5">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={breaking}
                  onChange={(e) => setBreaking(e.target.checked)}
                  className="sr-only peer"
                />
                <div
                  className="
                  w-9 h-5 bg-zinc-800 rounded-full
                  peer-checked:bg-red-600
                  border border-zinc-700 peer-checked:border-red-500
                  transition-all duration-200
                "
                />
                <div
                  className="
                  absolute top-0.5 left-0.5 w-4 h-4 bg-zinc-400 rounded-full
                  peer-checked:translate-x-4 peer-checked:bg-white
                  transition-all duration-200
                "
                />
              </div>
              <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                Breaking News
              </span>
            </label>
          </div>
        </div>
      </FormSection>

      {/* ── Section: Source ── */}
      <FormSection title="Source">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FormLabel>Source Name</FormLabel>
            <input
              className={inputClass}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Reuters, AP, etc."
              required
            />
          </div>
          <div>
            <FormLabel>Source URL</FormLabel>
            <input
              className={inputClass}
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              type="url"
              placeholder="https://..."
              required
            />
          </div>
        </div>
      </FormSection>

      {/* ── Section: Location ── */}
      <FormSection title="Location">
        <p className="text-xs text-zinc-600">
          Optional. Add coordinates to show this event on the map.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <FormLabel>Location Name</FormLabel>
            <input
              className={inputClass}
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Tehran, Iran"
            />
          </div>
          <div>
            <FormLabel>Latitude</FormLabel>
            <input
              className={`${inputClass} font-mono`}
              type="number"
              step="any"
              value={locationLat}
              onChange={(e) => setLocationLat(e.target.value)}
              placeholder="35.6892"
            />
          </div>
          <div>
            <FormLabel>Longitude</FormLabel>
            <input
              className={`${inputClass} font-mono`}
              type="number"
              step="any"
              value={locationLng}
              onChange={(e) => setLocationLng(e.target.value)}
              placeholder="51.3890"
            />
          </div>
        </div>
      </FormSection>

      {/* ── Section: Media ── */}
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

      {/* ── Section: French Translation ── */}
      <div className="rounded-xl border border-zinc-800/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFrench(!showFrench)}
          className="
            w-full flex items-center justify-between px-5 py-3.5
            text-sm text-zinc-400 hover:text-zinc-200
            bg-zinc-950/50 hover:bg-zinc-900/30
            transition-all duration-150
          "
        >
          <div className="flex items-center gap-2">
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
                d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
              />
            </svg>
            French Translation
            <span className="text-[10px] text-zinc-600">(optional)</span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${showFrench ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {showFrench && (
          <div className="px-5 py-4 space-y-4 border-t border-zinc-800/50 bg-zinc-950/30">
            <p className="text-xs text-zinc-600">
              Leave blank to auto-translate after saving.
            </p>
            <div>
              <FormLabel>Headline (FR)</FormLabel>
              <input
                className={inputClass}
                value={headlineFr}
                onChange={(e) => setHeadlineFr(e.target.value)}
                dir="ltr"
                placeholder="Titre en français"
              />
            </div>
            <div>
              <FormLabel>Body (FR)</FormLabel>
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                value={bodyFr}
                onChange={(e) => setBodyFr(e.target.value)}
                dir="ltr"
                placeholder="Texte en français"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
            bg-red-600 text-white
            hover:bg-red-500 active:bg-red-700
            transition-all duration-150
            shadow-lg shadow-red-600/20
          "
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
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {mode === "create" ? "Preview & Create" : "Preview & Update"}
        </button>
        {isModal ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all"
          >
            Cancel
          </button>
        ) : (
          <Link
            href="/admin"
            className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all"
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}

// ─── Shared sub-components ───

const inputClass = `
  w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2.5
  text-white text-sm placeholder:text-zinc-600
  focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/30
  transition-all duration-200
`;

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-4 pl-0.5">{children}</div>
    </div>
  );
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm text-zinc-400 mb-1.5 font-medium">
      {children}
    </label>
  );
}
