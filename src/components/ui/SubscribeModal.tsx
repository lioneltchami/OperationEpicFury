"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getUserSubscription,
  subscribeUser,
  unsubscribeUser,
  updateUserCategories,
} from "@/app/actions/push";
import { useLocale } from "@/i18n/LocaleContext";

function CircleCheck({
  checked,
  indeterminate,
  size = "w-4 h-4",
}: {
  checked: boolean;
  indeterminate?: boolean;
  size?: string;
}) {
  return (
    <span
      className={`${size} flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
        checked || indeterminate
          ? "bg-red-600 border-red-600"
          : "bg-zinc-900 border-zinc-600"
      }`}
    >
      {checked && (
        <svg
          className="w-2.5 h-2.5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
      {indeterminate && !checked && (
        <span className="block w-2 h-0.5 bg-white rounded-full" />
      )}
    </span>
  );
}

const CATEGORY_GROUPS = [
  {
    key: "groupMilitary" as const,
    categories: ["strike", "retaliation"],
  },
  {
    key: "groupDiplomatic" as const,
    categories: ["announcement", "world-reaction"],
  },
  {
    key: "groupUrgent" as const,
    categories: ["breaking", "breaking-important"],
  },
  {
    key: "groupCasualties" as const,
    categories: ["casualty"],
  },
];

const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap((g) => g.categories);

type ModalState =
  | "not-supported"
  | "ios-homescreen"
  | "permission-denied"
  | "subscribe"
  | "just-subscribed"
  | "manage";

export function SubscribeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { dict, locale } = useLocale();
  const t = (dict as unknown as Record<string, Record<string, string>>)
    .notifications;

  const overlayRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ModalState>("subscribe");
  const [selected, setSelected] = useState<string[]>([...ALL_CATEGORIES]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);
  const [existingEndpoint, setExistingEndpoint] = useState<string | null>(null);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus trap: move focus into modal on open
  useEffect(() => {
    if (!open) return;
    const modal = overlayRef.current;
    if (!modal) return;

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements =
      modal.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = modal!.querySelectorAll<HTMLElement>(focusableSelector);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Register SW and check subscription on mount
  useEffect(() => {
    if (!open) return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      const ua = navigator.userAgent;
      const isIOS =
        /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone;
      setState(isIOS && !isStandalone ? "ios-homescreen" : "not-supported");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        setSwReg(reg);
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setExistingEndpoint(sub.endpoint);
          const record = await getUserSubscription(sub.endpoint);
          if (record) {
            setSelected(record.categories);
            setState("manage");
          }
        } else {
          setState("subscribe");
        }
      })
      .catch(() => {
        setState("not-supported");
      });
  }, [open]);

  const handleSubscribe = useCallback(async () => {
    if (!swReg) return;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("permission-denied");
        setLoading(false);
        return;
      }

      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      });

      const json = sub.toJSON();
      await subscribeUser(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys!.p256dh!,
            auth: json.keys!.auth!,
          },
        },
        selected,
        locale,
      );

      setExistingEndpoint(sub.endpoint);
      setState("just-subscribed");
    } catch {
      setState("not-supported");
    } finally {
      setLoading(false);
    }
  }, [swReg, selected, locale]);

  const handleUnsubscribe = useCallback(async () => {
    if (!swReg || !existingEndpoint) return;
    setLoading(true);
    try {
      const sub = await swReg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await unsubscribeUser(existingEndpoint);
      setExistingEndpoint(null);
      setSelected([...ALL_CATEGORIES]);
      setState("subscribe");
    } finally {
      setLoading(false);
    }
  }, [swReg, existingEndpoint]);

  const handleUpdate = useCallback(async () => {
    if (!existingEndpoint) return;
    setLoading(true);
    try {
      await updateUserCategories(existingEndpoint, selected);
      setState("just-subscribed");
    } finally {
      setLoading(false);
    }
  }, [existingEndpoint, selected]);

  const toggleCategory = (cat: string) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const toggleGroup = (categories: string[]) => {
    const allSelected = categories.every((c) => selected.includes(c));
    if (allSelected) {
      setSelected((prev) => prev.filter((c) => !categories.includes(c)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...categories])]);
    }
  };

  const toggleSelectAll = () => {
    if (selected.length === ALL_CATEGORIES.length) {
      setSelected([]);
    } else {
      setSelected([...ALL_CATEGORIES]);
    }
  };

  const toggleExpand = (key: string) => {
    setExpanded((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribe-modal-title"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="
        fixed inset-0 z-[100] flex items-center justify-center
        bg-black/70 backdrop-blur-sm
        animate-fade-in
      "
    >
      <div
        className="
          relative w-full max-w-md mx-4
          bg-zinc-950 border border-zinc-800/80
          rounded-2xl shadow-2xl shadow-black/60
          animate-slide-up
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
          <h2
            id="subscribe-modal-title"
            className="text-base font-bold text-white"
          >
            {t.title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {state === "not-supported" && (
            <p className="text-zinc-400 text-sm">{t.notSupported}</p>
          )}

          {state === "ios-homescreen" && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm">{t.iosHomescreen}</p>
              <ol className="text-zinc-400 text-sm space-y-2 list-decimal list-inside">
                <li>{t.iosStep1}</li>
                <li>{t.iosStep2}</li>
                <li>{t.iosStep3}</li>
              </ol>
            </div>
          )}

          {state === "permission-denied" && (
            <p className="text-zinc-400 text-sm">{t.permissionDenied}</p>
          )}

          {state === "just-subscribed" && (
            <div className="text-center py-4">
              <div className="text-2xl mb-2">&#10003;</div>
              <p className="text-white font-semibold">{t.subscribed}</p>
              <p className="text-zinc-400 text-sm mt-1">{t.subscribedDesc}</p>
            </div>
          )}

          {(state === "subscribe" || state === "manage") && (
            <>
              <p className="text-zinc-400 text-sm mb-4">{t.description}</p>

              {/* Select All */}
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-3 mb-3 cursor-pointer"
              >
                <CircleCheck
                  checked={selected.length === ALL_CATEGORIES.length}
                  indeterminate={
                    selected.length > 0 &&
                    selected.length < ALL_CATEGORIES.length
                  }
                />
                <span className="text-sm text-white font-medium">
                  {t.selectAll}
                </span>
              </button>

              <div className="border-t border-zinc-800/60 pt-3 space-y-1">
                {CATEGORY_GROUPS.map((group) => {
                  const allSel = group.categories.every((c) =>
                    selected.includes(c),
                  );
                  const someSel =
                    !allSel &&
                    group.categories.some((c) => selected.includes(c));
                  const isExpanded = expanded.includes(group.key);

                  return (
                    <div key={group.key}>
                      <div className="flex items-center gap-3 py-1.5">
                        <button
                          onClick={() => toggleGroup(group.categories)}
                          className="flex-shrink-0"
                        >
                          <CircleCheck
                            checked={allSel}
                            indeterminate={someSel}
                          />
                        </button>
                        <button
                          onClick={() => toggleExpand(group.key)}
                          className="flex items-center gap-1 text-sm text-white font-medium hover:text-zinc-300 transition-colors"
                        >
                          <svg
                            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""} `}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          {t[group.key]}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pl-8">
                          {group.categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => toggleCategory(cat)}
                              className="flex items-center gap-3 py-1 cursor-pointer w-full"
                            >
                              <CircleCheck
                                checked={selected.includes(cat)}
                                size="w-3.5 h-3.5"
                              />
                              <span className="text-xs text-zinc-400">
                                {
                                  (
                                    dict as unknown as Record<
                                      string,
                                      Record<string, string>
                                    >
                                  ).categories[cat]
                                }
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-3">
                {state === "subscribe" && (
                  <button
                    onClick={handleSubscribe}
                    disabled={loading || selected.length === 0}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    {loading ? "..." : t.subscribe}
                  </button>
                )}

                {state === "manage" && (
                  <>
                    <button
                      onClick={handleUpdate}
                      disabled={loading || selected.length === 0}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      {loading ? "..." : t.updatePreferences}
                    </button>
                    <button
                      onClick={handleUnsubscribe}
                      disabled={loading}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-sm font-medium rounded-xl transition-colors"
                    >
                      {t.unsubscribe}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
