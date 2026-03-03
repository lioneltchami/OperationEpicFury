const CACHE_VERSION = "v2";
const STATIC_CACHE = "static-" + CACHE_VERSION;
const DATA_CACHE = "data-" + CACHE_VERSION;
const IMAGE_CACHE = "images-" + CACHE_VERSION;
const IMAGE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// App shell files to pre-cache on install
const APP_SHELL = ["/", "/offline.html"];

// ── Install: pre-cache app shell ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DATA_CACHE && k !== IMAGE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Message: handle skip waiting from update toast ──
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Fetch strategies ──
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip chrome-extension, etc.
  if (!url.protocol.startsWith("http")) return;

  // API data: network-first with cache fallback
  if (url.pathname.startsWith("/api/events")) {
    event.respondWith(networkFirst(event.request, DATA_CACHE));
    return;
  }

  // Images/media: cache-first with 7-day expiry
  if (
    url.pathname.startsWith("/api/media") ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)
  ) {
    event.respondWith(cacheFirstWithExpiry(event.request, IMAGE_CACHE, IMAGE_MAX_AGE));
    return;
  }

  // Next.js static assets (_next/static): cache-first (immutable)
  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // HTML pages: network-first, offline fallback
  if (event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirstWithOfflineFallback(event.request));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(event.request, STATIC_CACHE));
});

// ── Push notifications (preserved from original) ──
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
      tag: data.tag,
      data: { url: data.url || "/" },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.matchAll({ type: "window" }).then((windowClients) => {
    for (const client of windowClients) {
      if (client.url === url && "focus" in client) return client.focus();
    }
    return self.clients.openWindow(url);
  }));
});

// ── Strategy helpers ──

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("/offline.html");
  }
}

async function cacheFirstWithExpiry(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const dateHeader = cached.headers.get("sw-cached-at");
    if (dateHeader && Date.now() - parseInt(dateHeader) < maxAge) {
      return cached;
    }
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone and add a timestamp header
      const headers = new Headers(response.headers);
      headers.set("sw-cached-at", Date.now().toString());
      const timestamped = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, timestamped);
    }
    return response;
  } catch {
    if (cached) return cached;
    return new Response("Offline", { status: 503 });
  }
}
