// ============================================================
// Life OS v2 — Cadence engine
// Given a date, compute what actions are due across all domains.
// Drives the Today tab and review flows.
// ============================================================

import { getState } from './state.js';
import { todayKey, parseKey, dow, weekNumber, startOfWeek, startOfMonth, startOfQuarter, addDays, daysBetween } from './util.js';

/**
 * Determine if a given action (with cadence) is due on a given date key.
 * @param {string} key - YYYY-MM-DD
 * @param {{cadence:string, days?:number[]}} action
 * @returns {boolean}
 */
export function isDueOn(key, action) {
  const d = parseKey(key);
  const wd = d.getDay(); // 0=Sun
  const m = d.getMonth();
  const dt = d.getDate();
  switch (action.cadence) {
    case 'daily':     return true;
    case 'weekly':    return wd === 0; // Sunday
    case 'monthly':   return dt <= 7 && wd === 0; // first Sunday
    case 'quarterly': {
      const isQStart = m === 0 || m === 3 || m === 6 || m === 9;
      return isQStart && dt <= 7 && wd === 0;
    }
    case 'semiannual': {
      const isStart = m === 0 || m === 6;
      return isStart && dt <= 7 && wd === 0;
    }
    case 'annual':    return (m === 11 && dt >= 25) || (m === 0 && dt <= 7); // Dec 25–31 or Jan 1–7
    case 'event':     return false;
    default:          return false;
  }
}

/**
 * All actions due today across all domains.
 * Returns [{domain, action}].
 */
export function dueToday() {
  return dueOn(todayKey());
}

export function dueOn(key) {
  const s = getState();
  const out = [];
  for (const dom of Object.values(s.domains)) {
    for (const action of dom.actions || []) {
      if (isDueOn(key, action)) out.push({ domain: dom, action });
    }
  }
  return out;
}

/**
 * Actions due this week (not yet daily items, but weekly+ items due Sunday).
 */
export function dueThisWeek() {
  const start = startOfWeek(todayKey());
  const out = [];
  for (let i = 0; i < 7; i++) {
    const k = addDays(start, i);
    for (const item of dueOn(k)) {
      if (item.action.cadence !== 'daily') out.push({ ...item, key: k });
    }
  }
  return out;
}

/**
 * Actions due this month (monthly+ cadences).
 */
export function dueThisMonth() {
  const start = startOfMonth(todayKey());
  const out = [];
  for (let i = 0; i < 31; i++) {
    const k = addDays(start, i);
    if (k.slice(0, 7) !== start.slice(0, 7)) break;
    for (const item of dueOn(k)) {
      if (['monthly', 'quarterly', 'semiannual', 'annual'].includes(item.action.cadence)) {
        out.push({ ...item, key: k });
      }
    }
  }
  return out;
}

/**
 * Overdue items: weekly/monthly/quarterly actions whose due window has passed
 * and not yet completed this cycle.
 */
export function overdue() {
  const s = getState();
  const t = todayKey();
  const out = [];
  // Grace periods: how many days after due date before marking overdue
  const GRACE = { weekly: 7, monthly: 14, quarterly: 21, semiannual: 30, annual: 30 };
  for (const dom of Object.values(s.domains)) {
    for (const action of dom.actions || []) {
      if (action.cadence === 'daily' || action.cadence === 'event') continue;
      if (!isCompletedThisCycle(action, t)) {
        const dueKey = lastDueDate(action.cadence, t);
        if (dueKey && dueKey < t) {
          const grace = GRACE[action.cadence] || 7;
          if (daysBetween(dueKey, t) > grace) {
            out.push({ domain: dom, action, dueKey });
          }
        }
      }
    }
  }
  return out;
}

/** Last date this cadence was due, on or before `key`. */
export function lastDueDate(cadence, key) {
  const d = parseKey(key);
  for (let i = 0; i < 400; i++) {
    const testKey = addDays(key, -i);
    const testD = parseKey(testKey);
    const wd = testD.getDay();
    const m = testD.getMonth();
    const dt = testD.getDate();
    switch (cadence) {
      case 'weekly':     if (wd === 0) return testKey; break;
      case 'monthly':    if (dt <= 7 && wd === 0) return testKey; break;
      case 'quarterly':  if ((m === 0 || m === 3 || m === 6 || m === 9) && dt <= 7 && wd === 0) return testKey; break;
      case 'semiannual': if ((m === 0 || m === 6) && dt <= 7 && wd === 0) return testKey; break;
      case 'annual':     if ((m === 11 && dt >= 25) || (m === 0 && dt <= 7)) return testKey; break;
    }
  }
  return null;
}

/** Has this action been completed in its current cycle? */
export function isCompletedThisCycle(action, key = todayKey()) {
  const s = getState();
  const dueKey = lastDueDate(action.cadence, key);
  if (!dueKey) return false;
  // Walk from dueKey to today, see if any day marks this action done
  for (let k = dueKey; k <= key; k = addDays(k, 1)) {
    const day = s.days[k];
    if (day && day.habits && day.habits[action.id]) return true;
  }
  return false;
}

/** Count of daily actions completed today. */
export function todayProgress() {
  const s = getState();
  const t = todayKey();
  const due = dueToday();
  const day = s.days[t] || { habits: {} };
  let done = 0, floor = 0;
  for (const { action } of due) {
    const v = day.habits[action.id];
    if (v === 'full' || v === 'rest') done++;
    else if (v === 'floor') floor++;
  }
  return { due: due.length, done, floor, total: done + floor * 0.5, pct: due.length ? (done + floor * 0.5) / due.length : 0 };
}

/** Upcoming review (next cadence due). */
export function nextReview() {
  const t = todayKey();
  const candidates = [
    { type: 'weekly',     label: 'Weekly Review',     key: nextDueDate('weekly', t) },
    { type: 'monthly',    label: 'Monthly Review',    key: nextDueDate('monthly', t) },
    { type: 'quarterly',  label: 'Quarterly Review',  key: nextDueDate('quarterly', t) },
    { type: 'semiannual', label: 'Semi-annual Audit', key: nextDueDate('semiannual', t) },
    { type: 'annual',     label: 'Annual Life Review',key: nextDueDate('annual', t) },
  ];
  candidates.sort((a, b) => a.key.localeCompare(b.key));
  return candidates[0];
}

/** Next date this cadence is due, on or after `key`. */
export function nextDueDate(cadence, key) {
  for (let i = 0; i < 400; i++) {
    const testKey = addDays(key, i);
    if (isDueOn(testKey, { cadence })) return testKey;
  }
  return key;
}
