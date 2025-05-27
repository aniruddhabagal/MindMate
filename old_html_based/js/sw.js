// sw.js

const CACHE_NAME = "mindmate-cache-v1"; // Change version if you update assets
const assetsToCache = [
  "/", // Cache the root (index.html)
  "/index.html", // Explicitly cache index.html
  // Add paths to your crucial CSS files
  "https://cdn.tailwindcss.com", // Or the specific v2 link if you kept that
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  // Add paths to your crucial JS files
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js",
  // You might want to cache your custom inline styles/scripts if they were external files
  // '/path/to/your/custom-styles.css',
  // '/path/to/your/custom-script.js',

  // Add paths to any important images or icons if they are separate files
  // '/images/logo.png',
  // '/images/background.jpg',

  "../offline.html", // A fallback page for when offline and page not cached
];

// 1. Install Event: Cache assets
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching assets:", assetsToCache);
        return cache.addAll(assetsToCache).catch((error) => {
          console.error("[SW] Failed to cache assets during install:", error);
          // Optionally, you might decide not to let the SW install if critical assets fail
          // For example, by throwing the error: throw error;
        });
      })
      .then(() => self.skipWaiting()) // Activate the new SW immediately
  );
});

// 2. Activate Event: Clean up old caches
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
      .then(() => self.clients.claim()) // Take control of open clients
  );
});

// 3. Fetch Event: Serve from cache or network, with offline fallback
self.addEventListener("fetch", (event) => {
  // We only want to handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Cache-first strategy for navigation requests (HTML pages)
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request)
            .then((networkResponse) => {
              // Check if we received a valid response
              if (networkResponse && networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Network failed, try to serve offline page
              return caches.match("../offline.html");
            });
          return cachedResponse || fetchedResponse;
        });
      })
    );
    return;
  }

  // For other requests (CSS, JS, images), use a cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // console.log('[SW] Serving from cache:', event.request.url);
        return cachedResponse;
      }
      // console.log('[SW] Fetching from network:', event.request.url);
      return fetch(event.request)
        .then((networkResponse) => {
          // Check if we received a valid response
          if (networkResponse && networkResponse.ok) {
            // Cache the new resource
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse; // Return even if not ok, or it's an opaque response
        })
        .catch(() => {
          // Network request failed, and not in cache.
          // For non-navigation requests, we might not want an HTML fallback.
          // You could return a specific placeholder image/style if appropriate.
          // For now, let the browser handle the error (e.g., broken image icon).
          if (event.request.url.endsWith(".html")) {
            // Only for HTML pages try offline
            return caches.match("../offline.html");
          }
        });
    })
  );
});
