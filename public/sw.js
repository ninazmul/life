// ============================================================
// Life PWA Service Worker (Secure Zero-Cache Policy for Private Data)
// ============================================================

const CACHE_NAME = "life-pwa-shell-v1";
const STATIC_ASSETS = [
  "/manifest.json",
  "/assets/images/logo.png",
  "/favicon.ico"
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
  const url = new URL(event.request.url);

  // STRICT SECURITY RULE: NEVER cache API routes, Server Actions, Vault, Money, or Documents
  if (
    event.request.method !== "GET" ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/vault") ||
    url.pathname.startsWith("/money") ||
    url.pathname.startsWith("/documents") ||
    url.pathname.startsWith("/people") ||
    url.pathname.startsWith("/information") ||
    url.pathname.startsWith("/legacy")
  ) {
    return; // Pass through directly to network
  }

  // Network-first strategy for static assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache pure static media / icons
        if (
          response.status === 200 &&
          (url.pathname.startsWith("/assets/") || url.pathname.endsWith(".png") || url.pathname.endsWith(".ico"))
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback
          return new Response("Offline — Secure Life Data requires active connectivity.", {
            headers: { "Content-Type": "text/plain" },
          });
        });
      })
  );
});
