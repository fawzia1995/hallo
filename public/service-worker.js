// Service worker cache configuration for offline support and faster page loads.
const CACHE_NAME = 'daraa-events-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js?v=2',
  '/manifest.json',
  '/icon.svg',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  // Immediately activate the new service worker and pre-cache critical assets.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  // Take control of clients immediately and remove old cache versions.
  event.waitUntil(
    Promise.resolve()
      .then(() => clients.claim())
      .then(() => caches.keys())
      .then((cacheNames) => Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests, leave POST/PUT/etc. to the network.
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isApiRequest = requestUrl.pathname.startsWith('/api/');

  if (isApiRequest) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Serve from cache when available; otherwise fetch from network and cache the result.
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // If the asset is an image and the network is unavailable, fallback to a cached icon.
        if (event.request.destination === 'image') {
          return caches.match('/icon.svg');
        }
      });
    })
  );
});
