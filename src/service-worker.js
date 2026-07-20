// ============================================================
// Life OS v2 — Service Worker
// Offline-first: cache all static assets, network-first for
// same-origin GETs with cache fallback.
// ============================================================

const CACHE_NAME = 'lifeos-v2-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles/tokens.css',
  './styles/base.css',
  './styles/components.css',
  './app/main.js',
  './app/util.js',
  './app/dom.js',
  './app/ui.js',
  './app/state.js',
  './app/cadence.js',
  './app/analytics.js',
  './app/sync.js',
  './app/health.js',
  './app/notifications.js',
  './app/onboarding.js',
  './app/data/domains.js',
  './app/spaced-repetition.js',
  './app/temptation-bundling.js',
  './app/commitments.js',
  './app/system-health.js',
  './app/focus-mode.js',
  './app/suggestions.js',
  './app/render/command-center.js',
  './app/render/today.js',
  './app/render/domains.js',
  './app/render/inbox.js',
  './app/render/decisions.js',
  './app/render/opportunities.js',
  './app/render/reviews.js',
  './app/render/lessons.js',
  './app/render/risks.js',
  './app/render/settings.js',
  './app/render/more.js',
  './app/render/heatmap.js',
  './app/render/spaced-repetition.js',
  './app/render/commitments.js',
  './app/render/system-health.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Only handle same-origin
  if (new URL(req.url).origin !== self.location.origin) return;

  // Network-first for navigation, cache-first for assets
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          return resp;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
