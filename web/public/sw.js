const CACHE_NAME = 'arboles-mvd-v1';
const STATIC_ASSETS = [
  '/',
  '/trees.pmtiles',
  '/trees-data.json.gz',
  '/species.json',
  '/species-counts.json',
  '/species-metadata.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

// Install: precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin and GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Cache-first for static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then((cached) => {
          if (cached) {
            return cached;
          }
          return fetch(event.request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // Network-first for Next.js assets and pages
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses for Next.js chunks
          if (response.ok && url.pathname.includes('/_next/')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Network-only for external APIs (Wikipedia, Mapbox)
  // These will fail when offline, which the app handles gracefully
});

function isStaticAsset(pathname) {
  return STATIC_ASSETS.includes(pathname) ||
    pathname.endsWith('.pmtiles') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.json.gz') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.webmanifest');
}
