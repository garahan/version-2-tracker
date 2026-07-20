// ============================================================
// Life OS v3 — Cadence Engine (v3 §7)
// Only high-ROI actions are daily. Everything else moves upward.
// ============================================================

import { allDomains } from './data/domains.js';
import { todayKey, dateFromKey } from './util.js';

// ---- Is a cadence due on a given date? ----
export function isDueOn(cadence, d = new Date()) {
  const wd = d.getDay();
  const dt = d.getDate();
  const mo = d.getMonth();
  switch (cadence) {
    case 'daily':       return true;
    case 'weekly':      return wd === 0;
    case 'monthly':     return wd === 0 && dt <= 7;
    case 'quarterly':   return wd === 0 && dt <= 7 && [0, 3, 6, 9].includes(mo);
    case 'semiannual':  return wd === 0 && dt <= 7 && [0, 6].includes(mo);
    case 'annual':      return (mo === 11 && dt >= 25) || (mo === 0 && dt <= 7);
    case 'event':       return false;
    default:            return false;
  }
}

// ---- All actions due today, with their domain ----
export function dueToday(d = new Date()) {
  const out = [];
  const key = todayKey(d);
  for (const domain of allDomains()) {
    for (const action of domain.actions) {
      if (isDueOn(action.cadence, d)) {
        out.push({ domain, action });
      }
    }
  }
  return out;
}

// ---- Today progress (state passed in to avoid circular dep) ----
export function todayProgress(s) {
  const t = todayKey();
  const day = s.days[t] || { actions: {} };
  const due = dueToday();
  let done = 0, floor = 0;
  for (const { action } of due) {
    const st = day.actions[action.id];
    if (st === 'full' || st === 'rest') done++;
    else if (st === 'floor') floor++;
  }
  const pts = done + floor * 0.5;
  const pct = due.length > 0 ? pts / due.length : 0;
  return { done, floor, due: due.length, pts, pct };
}

// ---- Cadence label ----
export function cadenceLabel(c) {
  const map = {
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
    quarterly: 'Quarterly', semiannual: 'Semi-annual',
    annual: 'Annual', event: 'Event-driven',
  };
  return map[c] || c;
}

// ---- Cadence icon ----
export function cadenceIcon(c) {
  const map = {
    daily: '📅', weekly: '🗓️', monthly: '📆',
    quarterly: '📊', semiannual: '🔍', annual: '🎯', event: '⚡',
  };
  return map[c] || '•';
}
