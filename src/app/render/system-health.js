// ============================================================
// Life OS v2 — System Health view
// Shows the health of the OS itself + entropy monitor.
// ============================================================

import { el } from '../dom.js';
import { systemHealth, entropyMonitor } from '../system-health.js';
import { setSubroute } from '../main.js';

export function renderSystemHealth() {
  const health = systemHealth();
  const entropy = entropyMonitor();

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['System Health']),
      el('div', { class: 'app-subtitle' }, ['Health of the OS · entropy monitor']),
    ]),

    // Overall health score
    el('div', { class: `card mb-4 ${health.status === 'critical' ? 'card--accent' : ''}` }, [
      el('div', { class: 'card-head' }, [
        el('div', { class: 'card-icon', style: { fontSize: '28px' } }, [health.status === 'healthy' ? '✅' : health.status === 'warning' ? '⚠️' : '🚨']),
        el('div', {}, [
          el('div', { class: 'card-title' }, ['OS Health Score']),
          el('div', { class: 'card-subtitle' }, [health.status === 'healthy' ? 'System is healthy' : health.status === 'warning' ? 'Needs attention' : 'Critical — fix now']),
        ]),
        el('div', { class: 'stat-value', style: { fontSize: 'var(--fs-2xl)', marginLeft: 'auto' } }, [`${health.score}`]),
      ]),
      // Health bar
      el('div', { class: 'health-bar' }, [
        el('div', {
          class: `health-bar-fill health-bar-fill--${health.status}`,
          style: { width: `${health.score}%` },
        }),
      ]),
    ]),

    // Health checks
    el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, ['Health checks']),
    ]),
    el('div', { class: 'list mb-6' }, health.checks.map((c) => checkRow(c))),

    // Entropy monitor
    el('div', { class: `card mb-4 ${entropy.level === 'high' ? 'card--accent' : ''}` }, [
      el('div', { class: 'card-head' }, [
        el('div', { class: 'card-icon', style: { fontSize: '28px' } }, [entropy.level === 'low' ? '🌀' : entropy.level === 'medium' ? '🌊' : '🌪️']),
        el('div', {}, [
          el('div', { class: 'card-title' }, ['Entropy Monitor']),
          el('div', { class: 'card-subtitle' }, [entropy.level === 'low' ? 'Low chaos' : entropy.level === 'medium' ? 'Building chaos' : 'High chaos — reduce']),
        ]),
        el('div', { class: 'stat-value', style: { fontSize: 'var(--fs-2xl)', marginLeft: 'auto' } }, [`${entropy.score}`]),
      ]),
      el('div', { class: 'health-bar' }, [
        el('div', {
          class: `health-bar-fill health-bar-fill--${entropy.level === 'low' ? 'healthy' : entropy.level === 'medium' ? 'warning' : 'critical'}`,
          style: { width: `${entropy.score}%` },
        }),
      ]),
    ]),

    // Entropy items
    el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, ['Entropy sources']),
    ]),
    el('div', { class: 'list' }, entropy.items.map((item) => entropyRow(item))),
  ]);
}

function checkRow(c) {
  const statusIcon = c.status === 'ok' ? '✅' : c.status === 'warning' ? '⚠️' : '🚨';
  return el('div', { class: 'list-item', on: { click: () => navigateToCheck(c.id) } }, [
    el('div', { class: 'list-item-icon', style: { fontSize: '20px' } }, [c.icon]),
    el('div', { class: 'list-item-body' }, [
      el('div', { class: 'list-item-title' }, [c.label]),
      el('div', { class: 'list-item-sub' }, [c.detail]),
    ]),
    el('span', { style: { fontSize: '18px' } }, [statusIcon]),
  ]);
}

function entropyRow(item) {
  return el('div', { class: 'list-item' }, [
    el('div', { class: 'list-item-icon', style: { fontSize: '20px' } }, [item.icon]),
    el('div', { class: 'list-item-body' }, [
      el('div', { class: 'list-item-title' }, [item.label]),
      el('div', { class: 'list-item-sub' }, [item.detail]),
    ]),
    item.count > 0 && el('span', { class: 'chip chip--accent' }, [String(item.count)]),
  ]);
}

function navigateToCheck(id) {
  const map = {
    inbox: 'inbox',
    reviews: null, // stay on reviews tab
    risks: 'risks',
    decisions: 'decisions',
    lessons: 'lessons',
  };
  const subroute = map[id];
  if (subroute) setSubroute(subroute);
}
