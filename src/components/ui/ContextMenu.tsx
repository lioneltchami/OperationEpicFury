"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { SITE_URL } from "@/lib/utils";

type MenuContext =
	| {
			type: "event";
			headline: string;
			url: string;
			sourceUrl: string;
			source: string;
	  }
	| { type: "page" };

interface MenuItem {
	label: string;
	icon: React.ReactNode;
	action: () => void;
}

function XIcon() {
	return (
		<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);
}

function TelegramIcon() {
	return (
		<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
			<path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
		</svg>
	);
}

function WhatsAppIcon() {
	return (
		<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
			<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
		</svg>
	);
}

function LinkIcon() {
	return (
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
				d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374"
			/>
		</svg>
	);
}

function ExternalIcon() {
	return (
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
				d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
			/>
		</svg>
	);
}

function DownloadIcon() {
	return (
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
				d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
			/>
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg
			className="w-3.5 h-3.5 text-green-400"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M4.5 12.75l6 6 9-13.5"
			/>
		</svg>
	);
}

export function ContextMenu() {
	const { dict } = useLocale();
	const t = (dict as unknown as Record<string, Record<string, string>>)
		.contextMenu;
	const shareT = (dict as unknown as Record<string, Record<string, string>>)
		.share;

	const menuRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [pos, setPos] = useState({ x: 0, y: 0 });
	const [ctx, setCtx] = useState<MenuContext>({ type: "page" });
	const [copied, setCopied] = useState(false);
	const [focusIdx, setFocusIdx] = useState(-1);

	const close = useCallback(() => {
		setOpen(false);
		setCopied(false);
		setFocusIdx(-1);
	}, []);

	// Close on outside click, scroll, or resize
	useEffect(() => {
		if (!open) return;
		const dismiss = () => close();
		window.addEventListener("click", dismiss);
		window.addEventListener("scroll", dismiss, true);
		window.addEventListener("resize", dismiss);
		return () => {
			window.removeEventListener("click", dismiss);
			window.removeEventListener("scroll", dismiss, true);
			window.removeEventListener("resize", dismiss);
		};
	}, [open, close]);

	// Close on Escape
	useEffect(() => {
		if (!open) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") close();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, close]);

	// Intercept right-click
	useEffect(() => {
		function onContextMenu(e: MouseEvent) {
			const target = e.target as HTMLElement;

			// Let external links keep default context menu
			const link = target.closest("a[target='_blank']");
			if (link) return;

			// Let form elements keep default
			if (target.closest("input, textarea, select")) return;

			e.preventDefault();

			// Detect if right-clicked on an event card
			const eventCard = target.closest(
				"[data-ctx='event']",
			) as HTMLElement | null;

			if (eventCard) {
				setCtx({
					type: "event",
					headline: eventCard.dataset.ctxHeadline || "",
					url: eventCard.dataset.ctxUrl || "",
					sourceUrl: eventCard.dataset.ctxSourceUrl || "",
					source: eventCard.dataset.ctxSource || "",
				});
			} else {
				setCtx({ type: "page" });
			}

			// Position with edge detection
			const menuWidth = 220;
			const menuHeight = 280;
			const x =
				e.clientX + menuWidth > window.innerWidth
					? e.clientX - menuWidth
					: e.clientX;
			const y =
				e.clientY + menuHeight > window.innerHeight
					? e.clientY - menuHeight
					: e.clientY;

			setPos({ x: Math.max(4, x), y: Math.max(4, y) });
			setOpen(true);
			setFocusIdx(-1);
			setCopied(false);
		}

		document.addEventListener("contextmenu", onContextMenu);
		return () => document.removeEventListener("contextmenu", onContextMenu);
	}, []);

	const copyToClipboard = useCallback(
		(text: string) => {
			navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => close(), 800);
		},
		[close],
	);

	const pageUrl =
		typeof window !== "undefined" ? window.location.href : SITE_URL;

	const items: MenuItem[] =
		ctx.type === "event"
			? [
					{
						label: shareT.shareOnX,
						icon: <XIcon />,
						action: () => {
							window.open(
								`https://x.com/intent/tweet?text=${encodeURIComponent(ctx.headline)}&url=${encodeURIComponent(ctx.url)}`,
								"_blank",
							);
							close();
						},
					},
					{
						label: shareT.shareOnTelegram,
						icon: <TelegramIcon />,
						action: () => {
							window.open(
								`https://t.me/share/url?url=${encodeURIComponent(ctx.url)}&text=${encodeURIComponent(ctx.headline)}`,
								"_blank",
							);
							close();
						},
					},
					{
						label: shareT.shareOnWhatsApp,
						icon: <WhatsAppIcon />,
						action: () => {
							window.open(
								`https://wa.me/?text=${encodeURIComponent(ctx.headline + " " + ctx.url)}`,
								"_blank",
							);
							close();
						},
					},
					{
						label: copied ? t.copied : t.copyEventLink,
						icon: copied ? <CheckIcon /> : <LinkIcon />,
						action: () => copyToClipboard(ctx.url),
					},
					{
						label: `${t.viewSource} (${ctx.source})`,
						icon: <ExternalIcon />,
						action: () => {
							window.open(ctx.sourceUrl, "_blank");
							close();
						},
					},
				]
			: [
					{
						label: t.sharePageOnX,
						icon: <XIcon />,
						action: () => {
							window.open(
								`https://x.com/intent/tweet?url=${encodeURIComponent(pageUrl)}`,
								"_blank",
							);
							close();
						},
					},
					{
						label: copied ? t.copied : t.copyPageLink,
						icon: copied ? <CheckIcon /> : <LinkIcon />,
						action: () => copyToClipboard(pageUrl),
					},
					{
						label: t.exportJson,
						icon: <DownloadIcon />,
						action: () => {
							window.open("/api/export?format=json", "_blank");
							close();
						},
					},
					{
						label: t.exportCsv,
						icon: <DownloadIcon />,
						action: () => {
							window.open("/api/export?format=csv", "_blank");
							close();
						},
					},
				];

	// Keyboard navigation
	useEffect(() => {
		if (!open) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setFocusIdx((i) => (i + 1) % items.length);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setFocusIdx((i) => (i - 1 + items.length) % items.length);
			} else if (e.key === "Enter" && focusIdx >= 0) {
				e.preventDefault();
				items[focusIdx].action();
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, focusIdx, items]);

	if (!open) return null;

	return (
		<div
			ref={menuRef}
			role="menu"
			aria-label="Context menu"
			className="fixed z-[200] animate-fade-in"
			style={{ left: pos.x, top: pos.y }}
			onClick={(e) => e.stopPropagation()}
		>
			<div className="min-w-[200px] bg-zinc-950 border border-zinc-700/80 rounded-lg shadow-2xl shadow-black/60 overflow-hidden backdrop-blur-sm py-1">
				{ctx.type === "event" && (
					<div className="px-3 py-2 border-b border-zinc-800/60">
						<p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider truncate max-w-[240px]">
							{ctx.headline}
						</p>
					</div>
				)}
				{items.map((item, i) => (
					<button
						key={item.label}
						role="menuitem"
						tabIndex={focusIdx === i ? 0 : -1}
						onClick={item.action}
						className={`
              w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors
              ${
								focusIdx === i
									? "bg-red-500/15 text-red-400"
									: "text-zinc-300 hover:bg-white/5 hover:text-white"
							}
            `}
					>
						<span className="flex-shrink-0 text-zinc-500">{item.icon}</span>
						<span className="truncate">{item.label}</span>
					</button>
				))}
			</div>
		</div>
	);
}
