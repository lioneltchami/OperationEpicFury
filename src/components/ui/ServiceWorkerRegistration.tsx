"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Check for waiting worker on load
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });
    });
  }, []);

  const handleUpdate = () => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
    setUpdateAvailable(false);
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl flex items-center justify-between gap-3">
      <p className="text-sm text-zinc-300">New updates available.</p>
      <button
        onClick={handleUpdate}
        className="shrink-0 px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
      >
        Refresh
      </button>
    </div>
  );
}
