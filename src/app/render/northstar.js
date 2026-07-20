// ============================================================
// Life OS v3 — North Star Dashboard (v3 §23)
// The most important page after Today. Long-term metrics only.
// ============================================================

import { el } from '../dom.js';
import { getState, currentStreak, bestStreak } from '../state.js';
import { consistency, momentum, domainScores, forecast } from '../analytics.js';
import { fmtNum } from '../util.js';

export function renderNorthStar() {
  const s = getState();
  const ns = s.northStar || {};
  const m = momentum();
  const cons = consistency(30);
  const streak = currentStreak();
  const best = bestStreak();
  const fc = forecast();
  const scores = domainScores();

  return el('div', { class: 'page' }, [
    el('div', { class: 'app-title' }, ['North Star']),
    el('div', { class: 'app-subtitle' }, ['Long-term metrics only']),

    // ---- Life version + projection ----
    el('div', { class: 'card card--accent', style: { marginTop: 'var(--sp-4)' } }, [
      el('div', { class: 'overline' }, ['Life version']),
      el('div', { style: { fontSize: 'var(--fs-display)', fontWeight: 'var(--fw-bold)', fontVariantNumeric: 'tabular-nums' } }, [`v${s.version.toFixed(2)}`]),
      el('div', { class: 'text-mute text-meta mt-2' }, [
        `Projected: v${fc.projected.toFixed(2)} (30d) · `,
        el('span', { class: m >= 0 ? 'text-healthy' : 'text-danger' }, [m >= 0 ? '↑' : '↓', ` ${Math.abs(Math.round(m * 100))}%`]),
      ]),
    ]),

    // ---- Long-term metrics (v3 §23) ----
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-8)' } }, [
      el('div', { class: 'section-title' }, ['Capitals']),
    ]),
    el('div', { class: 'card' }, [
      nsMetric('Healthspan', ns.healthspan != null ? ns.healthspan + ' yr' : '—', null),
      nsMetric('Energy (avg)', ns.energy != null ? String(ns.energy) : '—', null),
      nsMetric('VO₂max', ns.vo2max != null ? ns.vo2max + ' mL/kg/min' : '—', null),
      nsMetric('Financial runway', (s.optionality?.runwayMonths || 0) + ' months', (s.optionality?.runwayMonths || 0) < 6 ? 'down' : 'up'),
      nsMetric('Net worth', ns.netWorth != null ? fmtNum(ns.netWorth) : '—', null),
      nsMetric('Savings rate', ns.savingsRate != null ? ns.savingsRate + '%' : '—', null),
      nsMetric('Learning velocity', ns.learningVelocity != null ? ns.learningVelocity + ' h/wk' : '—', null),
      nsMetric('Deep work (30d)', ns.deepWorkHours != null ? ns.deepWorkHours + ' h' : '—', null),
      nsMetric('Relationship score', ns.relationshipScore != null ? ns.relationshipScore + '/5' : '—', null),
      nsMetric('Optionality', ns.optionality != null ? String(ns.optionality) : '—', null),
      nsMetric('Freedom score', ns.freedomScore != null ? ns.freedomScore + '/5' : '—', null),
      nsMetric('Life satisfaction', ns.lifeSatisfaction != null ? ns.lifeSatisfaction + '/5' : '—', null),
    ]),

    // ---- Consistency + streaks ----
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-8)' } }, [
      el('div', { class: 'section-title' }, ['Consistency']),
    ]),
    el('div', { class: 'bento' }, [
      el('div', { class: 'card card--pad-sm' }, [
        el('div', { class: 'stat-label' }, ['30-day consistency']),
        el('div', { class: 'stat-value' }, [Math.round(cons * 100) + '%']),
      ]),
      el('div', { class: 'card card--pad-sm' }, [
        el('div', { class: 'stat-label' }, ['Current streak']),
        el('div', { class: 'stat-value' }, [streak + 'd']),
      ]),
      el('div', { class: 'card card--pad-sm' }, [
        el('div', { class: 'stat-label' }, ['Best streak']),
        el('div', { class: 'stat-value' }, [best + 'd']),
      ]),
      el('div', { class: 'card card--pad-sm' }, [
        el('div', { class: 'stat-label' }, ['Shields']),
        el('div', { class: 'stat-value' }, [String(s.shields || 0)]),
      ]),
    ]),

    // ---- Domain scores ----
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-8)' } }, [
      el('div', { class: 'section-title' }, ['Domain scores (30d)']),
    ]),
    el('div', { class: 'card' }, Object.entries(scores).map(([id, score]) =>
      el('div', { class: 'ns-metric' }, [
        el('div', { class: 'ns-metric-body' }, [
          el('div', { class: 'ns-metric-label' }, [id]),
          el('div', { class: 'ns-metric-value' }, [score + '%']),
        ]),
        el('div', { class: 'bar bar--sm', style: { width: '80px' } }, [
          el('div', { class: `bar-fill ${score >= 70 ? 'bar-fill--done' : score >= 40 ? 'bar-fill--floor' : 'bar-fill--danger'}`, style: { width: score + '%' } }),
        ]),
      ])
    )),
  ]);
}

function nsMetric(label, value, trend) {
  const trendCls = trend === 'up' ? 'ns-metric-trend--up' : trend === 'down' ? 'ns-metric-trend--down' : 'ns-metric-trend--flat';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';
  return el('div', { class: 'ns-metric' }, [
    el('div', { class: 'ns-metric-body' }, [
      el('div', { class: 'ns-metric-label' }, [label]),
      el('div', { class: 'ns-metric-value' }, [value]),
    ]),
    trend && el('div', { class: `ns-metric-trend ${trendCls}` }, [trendIcon]),
  ]);
}
