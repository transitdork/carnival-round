// ============================================================
// SERVICE WORKER — Carnival Round PWA
// ============================================================
// IMPORTANT: Bump this version string every time you push
// an update to GitHub. The old cache will be cleared and
// the new files will be downloaded automatically on next load.
// ============================================================
const CACHE_VERSION = 'carnival-v7';
const BASE_URL = 'https://transitdork.github.io/carnival-round';

const ASSETS_TO_CACHE = [
  BASE_URL + '/index.html',
  BASE_URL + '/manifest.json',
  BASE_URL + '/icons/icon-192.png',
  BASE_URL + '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap',
];

// ---- INSTALL: cache all assets ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll([
        BASE_URL + '/index.html',
        BASE_URL + '/manifest.json',
      ]).then(() => {
        return Promise.allSettled(
          ASSETS_TO_CACHE.filter(url => url.startsWith('https://fonts')).map(url =>
            fetch(url).then(res => cache.put(url, res)).catch(() => {})
          )
        );
      });
    }).then(() => self.skipWaiting())
  );
});

// ---- ACTIVATE: delete old caches ----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---- FETCH: cache-first, fall back to network ----
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(networkResponse => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(BASE_URL + '/index.html');
        }
      });
    })
  );
});

// ---- MESSAGE: force update from app ----
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
