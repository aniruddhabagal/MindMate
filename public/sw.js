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

  "/offline.html", // A fallback page for when offline and page not cached
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
  // Only handle HTTP and HTTPS GET requests
  if (event.request.method !== "GET" || !event.request.url.startsWith("http")) {
    return;
  }

  // Navigation requests: Cache-first strategy with network fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => caches.match("/offline.html"));
          return cachedResponse || fetchedResponse;
        });
      })
    );
    return;
  }

  // Other requests: Cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.destination === "document") {
            return caches.match("/offline.html");
          }
        });
    })
  );
});
