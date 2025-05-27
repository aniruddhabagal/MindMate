// public/sw.js

const CACHE_NAME = "mindmate-cache-v2"; // Incremented version for cache busting
const assetsToCache = [
  "/", // Root (usually serves index.html or Next.js page)
  "/offline.html", // Ensure this is in /public
  // Add specific crucial static assets if not handled by Next.js's own caching
  // e.g., "/manifest.json", "/icons/icon-192x192.png"
  // CSS and JS bundles from Next.js are usually versioned, so less critical to list explicitly here,
  // but CDNs for FontAwesome/Chart.js are good candidates if you want offline for them.
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js",
];

// Install Event: Cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching app shell assets:", assetsToCache);
        return cache.addAll(assetsToCache).catch((error) => {
          console.error("[SW] Failed to cache assets during install:", error);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Serve from cache or network, with offline fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // --- IMPORTANT: Bypass Service Worker for API calls ---
  // Let API calls (to our backend) go directly to the network.
  if (url.origin === self.origin && url.pathname.startsWith("/api/")) {
    // console.log('[SW] Bypassing cache for API request:', request.url);
    // For API POST/PUT/DELETE, just fetch. For GET, could implement network-first if desired,
    // but for data APIs, usually network is preferred.
    event.respondWith(fetch(request));
    return;
  }

  // Handle navigation requests (HTML pages) - Network first, then cache, then offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Check if we received a valid response
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match("/offline.html"); // If not in cache, show offline
          });
        })
    );
    return;
  }

  // For other GET requests (CSS, JS from CDNs, images from /public)
  // Cache-first strategy
  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        }
        // console.log('[SW] Fetching from network:', request.url);
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              // Check if the response type is cacheable (basic or cors for external assets)
              if (
                networkResponse.type === "basic" ||
                networkResponse.type === "cors"
              ) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseToCache);
                });
              }
            }
            return networkResponse;
          })
          .catch((error) => {
            console.warn(
              "[SW] Fetch failed for non-API, non-navigate GET request:",
              request.url,
              error
            );
            // Optionally, for specific asset types like images, you could return a placeholder
          });
      })
    );
    return;
  }

  // For non-GET requests or unhandled, let the browser handle it by default
  // console.log('[SW] Letting browser handle request:', request.url);
});
