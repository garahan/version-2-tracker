// ============================================================
// Life OS v2 — Main entry
// Boots the app, wires router, renders shell + current tab.
// ============================================================

import { el, clear, mount, $ } from './dom.js';
import { getState, applySettings, subscribe } from './state.js';
import { renderOnboarding } from './onboarding.js';
import { ingestHealthFromURL } from './health.js';

const TABS = [
  { id: 'today',   label: 'Today',   icon: '✅', render: () => import('./render/today.js').then(m => m.renderToday()) },
  { id: 'domains', label: 'Domains', icon: '🧩', render: () => import('./render/domains.js').then(m => m.renderDomains()) },
  { id: 'reviews', label: 'Reviews', icon: '📅', render: () => import('./render/reviews.js').then(m => m.renderReviews()) },
  { id: 'more',    label: 'More',    icon: '⋯',  render: () => import('./render/more.js').then(m => m.renderMore()) },
];

let currentTab = 'today';
let currentSubroute = null;

// ---- Boot ----

export function boot() {
  applySettings();
  ingestHealthFromURL();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
  // Online/offline indicator
  window.addEventListener('online', () => toast('Back online'));
  window.addEventListener('offline', () => toast('Offline mode', { icon: '⚠️' }));

  const s = getState();
  if (!s.settings.onboarded) renderOnboarding();
  render();

  let raf = null;
  subscribe(() => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { render(); });
  });
  window.__lifeosRerender = () => render();
}

// ---- Router ----

export function go(tab) {
  if (tab === currentTab) return;
  currentTab = tab;
  currentSubroute = null;
  render();
  window.scrollTo({ top: 0 });
}

export function setSubroute(id) {
  currentSubroute = id;
  render();
  window.scrollTo({ top: 0 });
}

// ---- Render shell ----

function render() {
  const app = $('#app');
  if (!app) return;
  clear(app);

  const tab = TABS.find((t) => t.id === currentTab) || TABS[0];
  const contentHost = el('div', { id: 'content-host' });
  mount(app, [contentHost, renderNav()]);

  mount(contentHost, [el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['⋯'])])]);

  const renderPromise = currentSubroute && currentTab === 'more'
    ? import('./render/more.js').then(m => m.renderSubroute(currentSubroute))
    : tab.render();

  renderPromise.then((node) => {
    if (!node) { currentSubroute = null; render(); return; }
    clear(contentHost);
    mount(contentHost, [node]);
    updateNavActive();
  }).catch((err) => {
    clear(contentHost);
    mount(contentHost, [el('div', { class: 'empty' }, [
      el('div', { class: 'empty-icon' }, ['⚠️']),
      el('div', { class: 'empty-title' }, ['Failed to load']),
      el('div', { class: 'empty-body' }, [err.message]),
    ])]);
    console.error(err);
  });
}

function renderNav() {
  return el('nav', { class: 'nav', id: 'main-nav' },
    TABS.map((t) =>
      el('button', {
        class: `nav-btn ${t.id === currentTab ? 'nav-btn--active' : ''}`,
        dataset: { tab: t.id },
        on: { click: () => go(t.id) }
      }, [
        el('span', { class: 'nav-btn-icon' }, [t.icon]),
        el('span', {}, [t.label]),
      ])
    )
  );
}

function updateNavActive() {
  const nav = $('#main-nav');
  if (!nav) return;
  for (const btn of nav.querySelectorAll('.nav-btn')) {
    btn.classList.toggle('nav-btn--active', btn.dataset.tab === currentTab);
  }
}

// Lazy toast import to avoid circular dep
function toast(msg, opts) {
  import('./ui.js').then(ui => ui.toast(msg, opts));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
