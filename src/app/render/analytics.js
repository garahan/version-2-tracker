// ============================================================
// Life OS v3 — Analytics page (v3 §17)
// Momentum, trend, forecast, consistency, domain scores,
// most skipped, best day, system health, entropy.
// ============================================================

import { el } from '../dom.js';
import { momentum, trend, consistency, domainScores, mostSkipped, bestDay, forecast } from '../analytics.js';
import { go } from '../main.js';

export function renderAnalytics() {
  const m = momentum();
  const cons = consistency(30);
  const fc = forecast();
  const scores = domainScores();
  const skipped = mostSkipped(5);
  const best = bestDay();

  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['Analytics']),
    el('div', { class: 'app-subtitle' }, ['Momentum · trends · forecast']),

    // Momentum + forecast
    el('div', { class: 'bento', style: { marginTop: 'var(--sp-4)' } }, [
      el('div', { class: 'card card--pad-sm' }, [
        el('div', { class: 'stat-label' }, ['Momentum (7d vs prior 7d)']),
        el('div', { class: 'stat-value', style: { color: m >= 0 ? 'var(--c-healthy)' : 'var(--c-danger)' } }, [(m >= 0 ? '+' : '') + Math.round(m * 100) + '%']),
      ]),
      el('div', { class: 'card card--pad-sm' }, [
        el('div', { class: 'stat-label' }, ['30-day consistency']),
        el('div', { class: 'stat-value' }, [Math.round(cons * 100) + '%']),
      ]),
      el('div', { class: 'card card--pad-sm' }, [
        el('div', { class: 'stat-label' }, ['Current version']),
        el('div', { class: 'stat-value' }, ['v' + fc.currentVersion.toFixed(2)]),
      ]),
      el('div', { class: 'card card--pad-sm' }, [
        el('div', { class: 'stat-label' }, ['Projected (30d)']),
        el('div', { class: 'stat-value' }, ['v' + fc.projected.toFixed(2)]),
      ]),
    ]),

    // Best day
    best && el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, [
      el('div', { class: 'overline' }, ['Best day (last 30)']),
      el('div', { style: { fontSize: 'var(--fs-section)', fontWeight: 'var(--fw-bold)' } }, [best.date, ' · ', best.score.toFixed(1), ' pts']),
    ]),

    // Domain scores
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, ['Domain scores (30d)']),
    ]),
    el('div', { class: 'card' }, Object.entries(scores).map(([id, score]) =>
      el('div', { class: 'list-item' }, [
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [id]),
          el('div', { class: 'bar bar--sm', style: { width: '120px', marginTop: 'var(--sp-2)' } }, [
            el('div', { class: `bar-fill ${score >= 70 ? 'bar-fill--done' : score >= 40 ? 'bar-fill--floor' : 'bar-fill--danger'}`, style: { width: score + '%' } }),
          ]),
        ]),
        el('span', { class: 'text-meta font-bold' }, [score + '%']),
      ])
    )),

    // Most skipped
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, ['Most skipped (30d)']),
    ]),
    el('div', { class: 'card' }, skipped.map(({ action, domain, skips }) =>
      el('div', { class: 'list-item' }, [
        el('div', { class: 'list-item-icon' }, [action.icon || '•']),
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [action.name]),
          el('div', { class: 'list-item-sub' }, [domain.name, ' · ', skips, ' skips']),
        ]),
      ])
    )),
  ]);
}
