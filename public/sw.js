// ============================================================
// Life PWA Service Worker (Secure Zero-Cache Policy for Private Data)
// ============================================================

const CACHE_NAME = "life-pwa-shell-v3";
const STATIC_ASSETS = [
  "/manifest.json",
  "/assets/images/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // STRICT BYPASS RULES:
  // 1. Never intercept Next.js internals, Turbopack, webpack HMR, or chunks
  if (url.pathname.startsWith("/_next")) {
    return;
  }

  // 2. Never intercept RSC router queries (?_rsc=...)
  if (url.searchParams.has("_rsc")) {
    return;
  }

  // 3. Never intercept full page navigations (let browser/Next.js navigate directly)
  if (event.request.mode === "navigate") {
    return;
  }

  // 4. Never intercept API routes or Server Action POSTs
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/trpc")) {
    return;
  }

  // ONLY intercept and cache designated static assets (images, icons, manifest)
  const isStaticMedia =
    url.pathname.startsWith("/assets/") ||
    url.pathname === "/manifest.json" ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp");

  if (!isStaticMedia) {
    return; // Pass through to network directly
  }

  // Cache-first / Network-fallback for purely static media
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
