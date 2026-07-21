// ============================================================
// Life OS v3 — Service Worker (offline-first, v3 §26)
// Network-first for app code, cache-first for static assets.
// ============================================================

const CACHE = 'lifeos-v4.2';
// Pre-cache EVERYTHING the app can lazily import, so offline works
// even for tabs the user hasn't opened yet.
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles/tokens.css',
  './styles/base.css',
  './styles/components.css',
  './app/main.js',
  './app/dom.js',
  './app/state.js',
  './app/util.js',
  './app/ui.js',
  './app/icons.js',
  './app/cadence.js',
  './app/crypto.js',
  './app/analytics.js',
  './app/automation.js',
  './app/onboarding.js',
  './app/system-health.js',
  './app/leverage.js',
  './app/focus-mode.js',
  './app/training.js',
  './app/training-env.js',
  './app/gist-sync.js',
  './app/suggestions.js',
  './app/health-sync.js',
  './app/day-plan.js',
  './app/data/domains.js',
  './app/data/reviews.js',
  './app/render/today.js',
  './app/render/northstar.js',
  './app/render/domains.js',
  './app/render/more.js',
  './app/render/settings.js',
  './app/render/analytics.js',
  './app/render/reviews.js',
  './app/render/decisions.js',
  './app/render/risks.js',
  './app/render/lessons.js',
  './app/render/recall.js',
  './app/render/inbox.js',
  './app/render/commitments.js',
  './app/render/opportunities.js',
  './app/render/heatmap.js',
  './app/render/system-health.js',
  './app/render/dependencies.js',
  './app/render/leverage.js',
];

// App code files — always fetch fresh from network first
// ALL JS and CSS files must be network-first so updates are picked up
// immediately. ES modules are dynamically imported, so any file could change.
const NETWORK_FIRST = [
  '/service-worker.js',
  '/index.html',
];

self.addEventListener('install', (e) => {
  // Cache each asset individually so one failure doesn't abort the rest
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(a => c.add(a).catch(() => {})))
    )
  );
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
  
  // Network-first for ALL JS and CSS files (so updates are picked up immediately)
  const isNetworkFirst = NETWORK_FIRST.some(path => url.pathname.endsWith(path)) ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.mjs');
  
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
