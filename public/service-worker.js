// Service Worker for Pokemon GO Search String Builder
// Version: 1.0.0

const CACHE_NAME = 'pogo-search-v1';
const RUNTIME_CACHE = 'pogo-search-runtime-v1';

// Get base path for GitHub Pages compatibility
const getBasePath = () => {
  const path = self.location.pathname;
  const swIndex = path.indexOf('/service-worker.js');
  return swIndex > 0 ? path.substring(0, swIndex) : '';
};

const BASE_PATH = getBasePath();

// Helper to create full URL with base path
const getUrl = (path) => {
  if (path.startsWith('http')) return path;
  const base = BASE_PATH.endsWith('/') ? BASE_PATH.slice(0, -1) : BASE_PATH;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        // Cache the current page and key assets
        const urlsToCache = [
          getUrl('/'),
          getUrl('/index.html'),
          getUrl('/manifest.json'),
          getUrl('/favicon.ico'),
          getUrl('/logo192.png'),
          getUrl('/logo512.png')
        ];
        
        // Cache app shell files, handling failures gracefully
        return Promise.allSettled(
          urlsToCache.map((url) => {
            return fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch((err) => {
                console.log(`[Service Worker] Failed to cache ${url}:`, err);
              });
          })
        );
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - cache-first strategy for assets, network-first for dynamic content
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle app shell and static assets with cache-first strategy
  if (
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname === '/' ||
    url.pathname.startsWith('/static/')
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              // Don't cache non-ok responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              // Clone the response
              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
              return response;
            })
            .catch(() => {
              // If both cache and network fail, return offline fallback for HTML
              if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
                return caches.match(getUrl('/index.html')) || caches.match(getUrl('/'));
              }
            });
        })
    );
  } else {
    // For other requests, try network first, then cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request);
        })
    );
  }
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

