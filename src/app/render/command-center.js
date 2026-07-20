// ============================================================
// Life OS v2 — Command Center
// The always-visible top dashboard. 10-15 KPIs visible in 60s.
// ============================================================

import { el, div, span, svg, svgEl } from '../dom.js';
import { getState, currentStreak, dayScore } from '../state.js';
import { todayKey, lastNDays, fmtNum, greeting, addDays } from '../util.js';
import { todayProgress } from '../cadence.js';
import { forecast, streakRisk } from '../analytics.js';

export function renderCommandCenter() {
  const s = getState();
  const t = todayKey();
  const prog = todayProgress();
  const streak = currentStreak();
  const f = forecast();
  const risk = streakRisk();
  const yest = dayScore(addDays(t, -1));
  const yestMissed = yest === 0;

  return el('section', { class: 'page-section' }, [
    // Greeting + version
    el('div', { class: 'flex items-center justify-between mb-3' }, [
      el('div', {}, [
        el('div', { class: 'text-mute text-xs uppercase' }, [greeting()]),
        el('div', { class: 'text-xl font-bold' }, [`v${s.version.toFixed(2)}`]),
      ]),
      ring(prog.pct, s.version),
    ]),

    // Streak risk nudge
    risk.level !== 'low' && el('div', { class: `card card--pad-sm mb-3 ${risk.level === 'high' ? 'card--accent' : ''}` }, [
      el('div', { class: 'flex items-center gap-2' }, [
        el('span', {}, [risk.level === 'high' ? '🚨' : '⚠️']),
        el('span', { class: 'text-sm' }, [risk.message]),
      ]),
    ]),

    // Never-miss-twice warning
    yestMissed && el('div', { class: 'card card--pad-sm mb-3' }, [
      el('div', { class: 'flex items-center gap-2' }, [
        el('span', {}, ['⚠️']),
        el('span', { class: 'text-sm font-semibold' }, ['Yesterday was missed.']),
        el('span', { class: 'text-sm text-mute' }, ['Never miss twice — do the Floor today.']),
      ]),
    ]),

    // KPI bento
    el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, ['Command Center']),
    ]),
    el('div', { class: 'bento' }, [
      kpi('🔥', 'Streak', `${streak}d`, null),
      kpi('⭐', 'Points', fmtNum(s.totalPoints), null),
      kpi('📅', 'v2.00 ETA', f.date || '—', f.days ? `${f.days}d` : null),
      kpi('🛡️', 'Shields', String(s.shields), null),
      kpi('✅', 'Today', `${prog.done}/${prog.due}`, prog.floor ? `${prog.floor} floor` : null),
      kpi('📈', 'Pace', f.pace ? `${f.pace}/d` : '—', null),
    ]),
  ]);
}

function kpi(icon, label, value, sub) {
  return el('div', { class: 'card card--pad-sm bento-cell' }, [
    el('div', { class: 'flex items-center gap-2 mb-2' }, [
      el('span', { style: { fontSize: '14px' } }, [icon]),
      el('span', { class: 'text-xs text-mute uppercase' }, [label]),
    ]),
    el('div', { class: 'stat-value', style: { fontSize: 'var(--fs-xl)' } }, [value]),
    sub && el('div', { class: 'text-xs text-mute mt-2' }, [sub]),
  ]);
}

function ring(pct, version) {
  const size = 96, stroke = 8, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - clamp(pct));
  return el('div', { style: { position: 'relative', width: `${size}px`, height: `${size}px` } }, [
    svg(`0 0 ${size} ${size}`, { width: size, height: size, style: 'transform: rotate(-90deg)' }, [
      svgEl('circle', { cx: size/2, cy: size/2, r, fill: 'none', stroke: 'var(--c-bg-elev-3)', 'stroke-width': stroke, class: 'ring-track' }),
      svgEl('circle', { cx: size/2, cy: size/2, r, fill: 'none', stroke: 'var(--c-accent)', 'stroke-width': stroke, 'stroke-linecap': 'round', 'stroke-dasharray': circ, 'stroke-dashoffset': offset, class: 'ring-fill' }),
    ]),
    el('div', { style: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' } }, [
      el('div', { class: 'font-bold', style: { fontSize: '18px', fontVariantNumeric: 'tabular-nums' } }, [`v${version.toFixed(2)}`]),
    ]),
  ]);
}

function clamp(n) { return Math.min(1, Math.max(0, n)); }
