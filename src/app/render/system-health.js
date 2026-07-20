// ============================================================
// Life OS v3 — System Health page (v3 §21)
// ============================================================

import { el } from '../dom.js';
import { systemHealth, entropyMonitor } from '../system-health.js';
import { go } from '../main.js';

export function renderSystemHealth() {
  const health = systemHealth();
  const entropy = entropyMonitor();
  const statusCls = health.score >= 70 ? 'healthy' : health.score >= 40 ? 'warning' : 'critical';

  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['System Health']),
    el('div', { class: 'app-subtitle' }, ['Health of the OS itself']),

    // Overall score
    el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, [
      el('div', { class: 'overline' }, ['OS health score']),
      el('div', { style: { fontSize: 'var(--fs-display)', fontWeight: 'var(--fw-bold)', fontVariantNumeric: 'tabular-nums' } }, [String(health.score)]),
      el('div', { class: 'health-bar', style: { marginTop: 'var(--sp-3)' } }, [
        el('div', { class: `health-bar-fill health-bar-fill--${statusCls}`, style: { width: health.score + '%' } }),
      ]),
    ]),

    // 6 checks
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, ['Checks']),
    ]),
    el('div', { class: 'card' }, health.checks.map(c =>
      el('div', { class: 'list-item' }, [
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [c.label]),
          el('div', { class: 'list-item-sub' }, [String(c.value)]),
        ]),
        el('span', { class: `chip chip--${c.status === 'healthy' ? 'healthy' : c.status === 'warning' ? 'attention' : 'danger'}` }, [c.status]),
      ])
    )),

    // Entropy monitor (v3 §22)
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, ['Entropy monitor']),
    ]),
    el('div', { class: 'card' }, [
      el('div', { class: 'overline' }, ['Entropy score (higher = less chaos)']),
      el('div', { style: { fontSize: 'var(--fs-display)', fontWeight: 'var(--fw-bold)', fontVariantNumeric: 'tabular-nums' } }, [String(entropy.score)]),
      el('div', { class: 'list', style: { marginTop: 'var(--sp-3)' } }, entropy.items.map(i =>
        el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [i.label]),
          ]),
          el('span', { class: `chip ${i.value > 0 ? 'chip--attention' : 'chip--healthy'}` }, [String(i.value)]),
        ])
      )),
    ]),
  ]);
}
