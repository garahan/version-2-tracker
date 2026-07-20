// ============================================================
// Life OS v2 — Main entry
// Boots the app, wires router, renders shell + current tab.
// ============================================================

import { el, clear, mount, $ } from './dom.js';
import { getState, applySettings, subscribe } from './state.js';
import { renderOnboarding } from './onboarding.js';
import { ingestHealthFromURL } from './health.js';
import { todayProgress } from './cadence.js';

// Render modules (lazy via dynamic import to keep initial bundle small)
const TABS = [
  { id: 'today',   label: 'Today',   icon: '✅', render: () => import('./render/today.js').then(m => m.renderToday()) },
  { id: 'domains', label: 'Domains', icon: '🧩', render: () => import('./render/domains.js').then(m => m.renderDomains()) },
  { id: 'reviews', label: 'Reviews', icon: '📅', render: () => import('./render/reviews.js').then(m => m.renderReviews()) },
  { id: 'more',    label: 'More',    icon: '⋯',  render: () => import('./render/more.js').then(m => m.renderMore()) },
];

let currentTab = 'today';

// ---- Boot ----

export function boot() {
  applySettings();
  // Ingest any health params from URL
  ingestHealthFromURL();
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
  // Onboarding if needed
  const s = getState();
  if (!s.settings.onboarded) {
    renderOnboarding();
  }
  // Initial render
  render();
  // Re-render on state changes (debounced)
  let raf = null;
  subscribe(() => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { render(); });
  });
  // Expose rerender for modules
  window.__lifeosRerender = () => render();
}

// ---- Router ----

export function go(tab) {
  if (tab === currentTab) return;
  currentTab = tab;
  render();
  // Scroll to top
  document.getElementById('app')?.scrollTo?.({ top: 0 });
  window.scrollTo({ top: 0 });
}

// ---- Render shell ----

function render() {
  const app = $('#app');
  if (!app) return;
  clear(app);

  const tab = TABS.find((t) => t.id === currentTab) || TABS[0];
  // Render is async (dynamic import) — show a placeholder first
  const contentHost = el('div', { id: 'content-host' });
  mount(app, [contentHost, renderNav()]);

  // Show loading state
  mount(contentHost, [el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['⋯'])])]);

  tab.render().then((node) => {
    clear(contentHost);
    mount(contentHost, [node]);
    // Update nav active state
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

// ---- Start ----

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
