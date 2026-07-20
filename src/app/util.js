// ============================================================
// Life OS v2 — Utility helpers
// Pure functions, no side effects, no imports.
// ============================================================

/** Today's date as YYYY-MM-DD (local time). */
export const todayKey = () => {
  const d = new Date();
  return dateKey(d);
};

/** Date object → YYYY-MM-DD. */
export const dateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Parse YYYY-MM-DD into a local Date (avoids UTC drift). */
export const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Add n days to a date key, return new key. */
export const addDays = (key, n) => {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
};

/** Difference in days between two keys (b - a). */
export const daysBetween = (a, b) => {
  const da = parseKey(a).getTime();
  const db = parseKey(b).getTime();
  return Math.round((db - da) / 86400000);
};

/** Day of week (0=Sun … 6=Sat). */
export const dow = (key) => parseKey(key).getDay();

/** ISO week number (1–53). */
export const weekNumber = (key) => {
  const d = parseKey(key);
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
};

/** First day of the week (Sunday) for a given key. */
export const startOfWeek = (key) => {
  const d = parseKey(key);
  d.setDate(d.getDate() - d.getDay());
  return dateKey(d);
};

/** First day of the month. */
export const startOfMonth = (key) => {
  const d = parseKey(key);
  d.setDate(1);
  return dateKey(d);
};

/** Quarter (1–4) for a key. */
export const quarter = (key) => Math.floor(parseKey(key).getMonth() / 3) + 1;

/** Start of quarter. */
export const startOfQuarter = (key) => {
  const d = parseKey(key);
  const q = Math.floor(d.getMonth() / 3);
  d.setMonth(q * 3, 1);
  return dateKey(d);
};

/** Generate last N day keys ending today (oldest first). */
export const lastNDays = (n) => {
  const out = [];
  const t = todayKey();
  for (let i = n - 1; i >= 0; i--) out.push(addDays(t, -i));
  return out;
};

/** Stable id generator. */
export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Clamp number. */
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/** Round to d decimals. */
export const round = (n, d = 2) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

/** Format a number with thousands separators. */
export const fmtNum = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US');
  return String(n);
};

/** Format a currency-like number (no symbol, just grouping). */
export const fmtMoney = (n, currency = '¥') => {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${currency}${Math.round(n).toLocaleString('en-US')}`;
};

/** Format hours/minutes. */
export const fmtMins = (mins) => {
  if (!mins && mins !== 0) return '—';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
};

/** Exponentially weighted moving average over a series (most recent last). */
export const ewma = (values, alpha = 0.15) => {
  if (!values.length) return 0;
  let acc = values[0];
  for (let i = 1; i < values.length; i++) acc = alpha * values[i] + (1 - alpha) * acc;
  return acc;
};

/** Simple linear regression slope over [[x,y],...]. */
export const slope = (points) => {
  const n = points.length;
  if (n < 2) return 0;
  const sx = points.reduce((s, p) => s + p[0], 0);
  const sy = points.reduce((s, p) => s + p[1], 0);
  const sxy = points.reduce((s, p) => s + p[0] * p[1], 0);
  const sxx = points.reduce((s, p) => s + p[0] * p[0], 0);
  return (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
};

/** Escape HTML. */
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

/** Debounce. */
export const debounce = (fn, ms = 200) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

/** Deep clone via structured clone (with JSON fallback). */
export const clone = (obj) => {
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
};

/** Deep equal. */
export const deepEqual = (a, b) => {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (typeof a !== 'object') return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
};

/** Safe localStorage get with JSON parse. */
export const lsGet = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

/** Safe localStorage set. */
export const lsSet = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch { return false; }
};

/** Safe localStorage remove. */
export const lsRemove = (key) => {
  try { localStorage.removeItem(key); } catch {}
};

/** Human-readable short date (e.g. "Jul 19"). */
export const fmtDate = (key) => {
  const d = parseKey(key);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** Long date (e.g. "Sunday, July 19, 2026"). */
export const fmtDateLong = (key) => {
  const d = parseKey(key);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

/** Relative day label: Today / Yesterday / weekday. */
export const relDay = (key) => {
  const t = todayKey();
  if (key === t) return 'Today';
  if (key === addDays(t, -1)) return 'Yesterday';
  if (key === addDays(t, 1)) return 'Tomorrow';
  return parseKey(key).toLocaleDateString('en-US', { weekday: 'short' });
};

/** Current hour (0–23). */
export const hour = () => new Date().getHours();

/** Greeting based on hour. */
export const greeting = () => {
  const h = hour();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Winding down';
};
