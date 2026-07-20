// ============================================================
// Life OS v3 — Heatmap (history at bottom of Today)
// ============================================================

import { el } from '../dom.js';
import { getState, dayScore } from '../state.js';
import { todayKey, addDays } from '../util.js';

export function renderHeatmap(days = 105) {
  const s = getState();
  const today = todayKey();
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = addDays(today, -i);
    const day = s.days[k];
    const score = dayScore(day);
    const shielded = day?.shielded;
    let cls = 'heatmap-cell';
    if (shielded) cls += ' heatmap-cell--shield';
    else if (score >= 1) cls += ' heatmap-cell--4';
    else if (score >= 0.7) cls += ' heatmap-cell--3';
    else if (score >= 0.4) cls += ' heatmap-cell--2';
    else if (score > 0) cls += ' heatmap-cell--1';
    cells.push(el('div', { class: cls, title: `${k}: ${score.toFixed(1)} pts` }));
  }
  return el('div', {}, [
    el('div', { class: 'overline mb-2' }, ['History']),
    el('div', { class: 'heatmap' }, cells),
  ]);
}
