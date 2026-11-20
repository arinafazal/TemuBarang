const CACHE_NAME = 'temubarang-static-v3';
const DATA_CACHE_NAME = 'temubarang-data-v3';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/api.js',
  './images/profile.jpg',
  './manifest.json',
  './icons/icon-homescreen.png',
  './icons/icon-app-512.png'
];

// Install: Cache semua asset statis utama
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Gagal cache asset saat install:', asset, err);
        }
      }
    })
  );
});

// Activate: Bersihkan cache versi lama dan klaim client
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DATA_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Tangani semua request offline & online
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. API Request:
  // JIKA ONLINE: Jangan lakukan event.respondWith!
  // Biarkan browser native HTTP cache yang menangani request sehingga muncul "(disk cache)" di DevTools Network tab!
  if (url.pathname.includes('/api/')) {
    if (navigator.onLine) {
      // Update cache di background untuk cadangan offline
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            caches.open(DATA_CACHE_NAME).then((cache) => cache.put(event.request, res));
          }
        })
        .catch(() => {});
      return; // Browser native stack will handle it and show (disk cache)
    }

    // JIKA OFFLINE: Berikan dari Service Worker cache
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return new Response(
          JSON.stringify({
            success: false,
            data: [],
            _isOffline: true,
            message: 'Mode offline: data diambil dari cache lokal.'
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 2. Static Assets: Cache First with Background Revalidation
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html', { ignoreSearch: true });
          }
        });
    })
  );
});
