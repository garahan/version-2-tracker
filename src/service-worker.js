// ============================================================
// Life OS v3 — Service Worker (offline-first, v3 §26)
// Network-first for app code, cache-first for static assets.
// ============================================================

const CACHE = 'lifeos-v3.7';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles/tokens.css',
  './styles/base.css',
  './styles/components.css',
  './app/main.js',
];

// App code files — always fetch fresh from network first
const NETWORK_FIRST = [
  '/app/main.js',
  '/service-worker.js',
  '/index.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  
  // Network-first for app code (so updates are picked up immediately)
  const isNetworkFirst = NETWORK_FIRST.some(path => url.pathname.endsWith(path));
  
  if (isNetworkFirst) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return resp;
      }).catch(() => caches.match(e.request).then(c => c || new Response('', { status: 503 })))
    );
    return;
  }
  
  // Cache-first for everything else (static assets)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
