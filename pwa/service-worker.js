const CACHE_NAME = 'temubarang-static-v5';
const DATA_CACHE_NAME = 'temubarang-data-v5';

const ASSETS_TO_CACHE = [
  '/',
  './',
  'index.html',
  './index.html',
  'css/style.css',
  './css/style.css',
  'js/app.js',
  './js/app.js',
  'js/api.js',
  './js/api.js',
  'images/profile.jpg',
  './images/profile.jpg',
  'manifest.json',
  './manifest.json',
  'icons/icon-homescreen.png',
  './icons/icon-homescreen.png',
  'icons/icon-app-512.png',
  './icons/icon-app-512.png'
];

// Install: Cache semua asset utama
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Pre-cache skip:', asset);
        }
      }
    })
  );
});

// Activate: Bersihkan cache versi lama
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

// Fetch: Tangani request dengan aman (Anti ERR_FAILED)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. API Request
  if (url.pathname.includes('/api/')) {
    if (navigator.onLine) {
      // Biarkan browser native HTTP cache yang memproses agar muncul (disk cache)
      return;
    }

    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            _isOffline: true,
            message: 'Mode offline: data diambil dari cache lokal.'
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 2. Navigasi Halaman Utama (HTML Shell): Cegah ERR_FAILED saat offline / reload
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Jika offline atau jaringan putus, kembalikan index.html dari cache
          const cached =
            (await caches.match(event.request, { ignoreSearch: true })) ||
            (await caches.match('./index.html', { ignoreSearch: true })) ||
            (await caches.match('index.html', { ignoreSearch: true })) ||
            (await caches.match('./', { ignoreSearch: true })) ||
            (await caches.match('/', { ignoreSearch: true }));

          if (cached) return cached;
          return new Response(
            '<!DOCTYPE html><html><head><title>TemuBarang</title></head><body><h1>TemuBarang Offline</h1><p>Silakan hubungkan koneksi internet.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 3. Asset Statis (CSS, JS, Ikon, Gambar): Cache First
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
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
        .catch(async () => {
          // Fallback anti ERR_FAILED untuk stylesheet dan script
          if (event.request.destination === 'style') {
            return (
              (await caches.match('./css/style.css', { ignoreSearch: true })) ||
              (await caches.match('css/style.css', { ignoreSearch: true })) ||
              new Response('', { headers: { 'Content-Type': 'text/css' } })
            );
          }
          if (event.request.destination === 'script') {
            return new Response('', { headers: { 'Content-Type': 'application/javascript' } });
          }
          return new Response('', { status: 404 });
        });
    })
  );
});
