"use client";

import { useState, useEffect } from "react";
import { SubscribeModal } from "./SubscribeModal";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setHasSubscription(!!sub);
    });
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`
          fixed bottom-6 z-50 cursor-pointer
          right-6
          w-11 h-11 flex items-center justify-center
          bg-zinc-900 border border-zinc-700
          rounded-full shadow-lg shadow-black/40
          hover:bg-zinc-800 transition-colors
        `}
        aria-label="Notifications"
      >
        {/* Bell icon */}
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Red ping dot when not subscribed */}
        {!hasSubscription && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
          </span>
        )}
      </button>

      <SubscribeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
