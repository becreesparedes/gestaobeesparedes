/**
 * sw.js — Service Worker BE-ESP v4
 * Estratégia: Cache-first para assets estáticos,
 * Network-first para chamadas à Graph API
 */

const CACHE_NAME  = 'be-esp-v4-cache-v1';
const STATIC_URLS = [
  '/',
  '/index.html',
  '/src/styles/tokens.css',
  '/src/styles/base.css',
  '/src/styles/layout.css',
  '/src/styles/components.css',
  '/src/styles/modules.css',
];

/* Instalação — pre-cache dos assets estáticos */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_URLS))
      .then(() => self.skipWaiting())
  );
});

/* Activação — limpar caches antigas */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Fetch — Cache-first para estáticos, network-first para API */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* Graph API e Microsoft Login — sempre rede */
  if (url.hostname.includes('microsoft') || url.hostname.includes('microsoftonline')) return;

  /* Assets estáticos — cache-first */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        /* Offline fallback para navegação */
        if (e.request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});
