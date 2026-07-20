// ============================================================
// Life OS v2 — Heatmap
// GitHub-style activity heatmap showing last ~105 days.
// ============================================================

import { el } from '../dom.js';
import { getState, dayScore } from '../state.js';
import { lastNDays, todayKey, addDays, parseKey, fmtDate } from '../util.js';

/**
 * Render a heatmap of last `days` days.
 * @param {number} days - number of days to show (default 105 = ~15 weeks)
 * @param {(key:string)=>number} scoreFn - returns 0..4 intensity
 */
export function renderHeatmap(days = 105, scoreFn = defaultScore) {
  const keys = lastNDays(days);
  // Group into weeks (columns of 7)
  const weeks = [];
  let week = [];
  // Pad start so first week starts on Sunday
  const firstDow = parseKey(keys[0]).getDay();
  for (let i = 0; i < firstDow; i++) week.push(null);
  for (const key of keys) {
    week.push(key);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) weeks.push(week);

  return el('div', { class: 'card' }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon' }, ['📅']),
      el('div', { class: 'card-title' }, ['History']),
      el('div', { class: 'card-subtitle' }, [`Last ${days} days`]),
    ]),
    el('div', { style: { overflowX: 'auto', padding: '4px 0' } }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, 12px)`, gap: '3px', minWidth: 'min-content' } },
        weeks.map((wk) =>
          el('div', { style: { display: 'grid', gridTemplateRows: 'repeat(7, 12px)', gap: '3px' } },
            wk.map((key) => key ? heatmapCell(key, scoreFn(key)) : el('div', { style: { width: '12px', height: '12px' } }))
          )
        )
      ),
    ]),
    el('div', { class: 'flex items-center gap-2 mt-3', style: { justifyContent: 'flex-end' } }, [
      el('span', { class: 'text-xs text-mute' }, ['Less']),
      el('div', { class: 'heatmap-cell', style: { width: '10px', height: '10px' } }),
      el('div', { class: 'heatmap-cell heatmap-cell--1', style: { width: '10px', height: '10px' } }),
      el('div', { class: 'heatmap-cell heatmap-cell--2', style: { width: '10px', height: '10px' } }),
      el('div', { class: 'heatmap-cell heatmap-cell--3', style: { width: '10px', height: '10px' } }),
      el('div', { class: 'heatmap-cell heatmap-cell--4', style: { width: '10px', height: '10px' } }),
      el('span', { class: 'text-xs text-mute' }, ['More']),
    ]),
  ]);
}

function heatmapCell(key, intensity) {
  const s = getState();
  const shielded = s.days[key]?.shielded;
  const cls = shielded ? 'heatmap-cell--shield' : intensity > 0 ? `heatmap-cell--${intensity}` : '';
  return el('div', {
    class: `heatmap-cell ${cls}`,
    title: `${fmtDate(key)}: ${intensity > 0 ? `${intensity * 0.5}+ pts` : 'no activity'}`,
    style: { width: '12px', height: '12px' },
    on: { click: () => window.__lifeosShowDay?.(key) }
  });
}

function defaultScore(key) {
  const score = dayScore(key);
  if (score <= 0) return 0;
  if (score < 1) return 1;
  if (score < 2) return 2;
  if (score < 3) return 3;
  return 4;
}
