"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type { MediaItem } from "@/data/timeline";
import { cn } from "@/lib/utils";

function mediaUrl(item: MediaItem): string {
  if (item.url) return item.url;
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

function MediaThumb({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const aspectRatio = item.width && item.height ? item.width / item.height : undefined;

  if (item.type === "video") {
    const thumbSrc = item.thumbnailFileId
      ? `/api/media/${encodeURIComponent(item.thumbnailFileId)}`
      : undefined;

    return (
      <button
        onClick={onClick}
        aria-label="Play video"
        className="relative w-full max-h-48 overflow-hidden rounded-lg group cursor-pointer bg-zinc-900"
        style={{ aspectRatio: aspectRatio ?? 16 / 9 }}
      >
        {thumbSrc && (
          <Image
            src={thumbSrc}
            alt=""
            width={item.width || 320}
            height={item.height || 240}
            sizes="(max-width: 640px) 50vw, 200px"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <svg className="w-10 h-10 text-white/90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <button onClick={onClick} aria-label="View photo" className="relative w-full max-h-48 overflow-hidden rounded-lg cursor-pointer">
      {!loaded && <Skeleton aspectRatio={aspectRatio} />}
      <Image
        src={mediaUrl(item)}
        alt=""
        unoptimized={!!item.url}
        width={item.width || 320}
        height={item.height || 240}
        sizes="(max-width: 640px) 50vw, 200px"
        className={cn(
          "w-full h-full object-cover rounded-lg bg-zinc-900 transition-opacity",
          loaded ? "hover:opacity-90" : "absolute inset-0 opacity-0"
        )}
        onLoad={() => setLoaded(true)}
      />
    </button>
  );
}

function Lightbox({
  item,
  onClose,
}: {
  item: MediaItem;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        aria-label="Close"
        className="absolute top-4 right-4 text-white/70 hover:text-white z-50"
        onClick={onClose}
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
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
            alt=""
            unoptimized={!!item.url}
            width={item.width || 800}
            height={item.height || 600}
            sizes="90vw"
            quality={90}
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
          />
        )}
      </div>
    </div>
  );
}

export function MediaGallery({ media }: { media: MediaItem[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);

  if (media.length === 0) return null;

  return (
    <>
      <div
        className={cn(
          "mt-3 mb-3",
          media.length === 1 ? "max-w-xs" : "grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg"
        )}
      >
        {media.map((item, i) => (
          <MediaThumb key={item.url ?? item.fileId} item={item} onClick={() => setLightboxIdx(i)} />
        ))}
      </div>
      {lightboxIdx !== null && (
        <Lightbox item={media[lightboxIdx]} onClose={closeLightbox} />
      )}
    </>
  );
}
