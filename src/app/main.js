// ============================================================
// Life OS v3 — Main entry
// Boots the app, wires router, renders shell + current tab.
// 4 tabs max (v3 §24): Today / North Star / Domains / More.
// ============================================================

import { el, clear, mount, $ } from './dom.js';
import { getState, applySettings, subscribe, update } from './state.js';
import { todayKey } from './util.js';
import { toast } from './ui.js';
import { seedSampleData, runAutomation } from './automation.js';

const TABS = [
  { id: 'today',     label: 'Today',     icon: '✅', render: () => import('./render/today.js').then(m => m.renderToday()) },
  { id: 'northstar', label: 'North Star', icon: '🌟', render: () => import('./render/northstar.js').then(m => m.renderNorthStar()) },
  { id: 'domains',   label: 'Domains',   icon: '🧩', render: () => import('./render/domains.js').then(m => m.renderDomains()) },
  { id: 'more',      label: 'More',      icon: '⋯',  render: () => import('./render/more.js').then(m => m.renderMore()) },
];

let currentTab = 'today';
let currentSubroute = null;

// ---- Boot ----
export function boot() {
  applySettings();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
  window.addEventListener('online', () => toast('Back online'));
  window.addEventListener('offline', () => toast('Offline mode', { icon: '⚠️' }));

  const s = getState();
  // Auto-seed sample data on first run (no manual entry needed)
  if (!s.settings.onboarded) {
    import('./onboarding.js').then(m => m.renderOnboarding());
  }
  // Run automation: seed data if empty, derive KPIs
  if (!s.settings.seeded) {
    update(st => {
      const seeded = seedSampleData(st);
      Object.assign(st, seeded);
      st.settings.seeded = true;
    });
  }
  // Always run automation to derive today's KPIs
  update(st => { runAutomation(st); });
  render();

  let raf = null;
  subscribe(() => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { render(); });
  });
  window.__lifeosRerender = () => render();

  // Midnight rollover
  let lastTodayKey = todayKey();
  setInterval(() => {
    const cur = todayKey();
    if (cur !== lastTodayKey) {
      lastTodayKey = cur;
      render();
      toast('New day — fresh start 🌅');
    }
  }, 60000);
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

export function currentTabId() { return currentTab; }
export function currentSub() { return currentSubroute; }

// ---- Render shell ----
let _renderToken = 0;

function render() {
  const app = $('#app');
  if (!app) return;
  const token = ++_renderToken;
  clear(app);

  const tab = TABS.find(t => t.id === currentTab) || TABS[0];
  const contentHost = el('div', { id: 'content-host' });
  mount(app, [contentHost, renderNav()]);

  mount(contentHost, [el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['⋯'])])]);

  const renderPromise = currentSubroute && currentTab === 'more'
    ? import('./render/more.js').then(m => m.renderSubroute(currentSubroute))
    : tab.render();

  renderPromise.then(node => {
    if (token !== _renderToken) return;
    if (!node) { currentSubroute = null; render(); return; }
    clear(contentHost);
    mount(contentHost, [node]);
    updateNavActive();
  }).catch(err => {
    if (token !== _renderToken) return;
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
    TABS.map(t =>
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
