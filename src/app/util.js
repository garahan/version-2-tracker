// ============================================================
// Life OS v3 — Utility helpers
// ============================================================

// ---- Date helpers ----
export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dateFromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(key) {
  const d = dateFromKey(key);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtDateLong(key) {
  const d = dateFromKey(key);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function dayName(key) {
  const d = dateFromKey(key);
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
}

export function hour() {
  return new Date().getHours();
}

export function daysBetween(aKey, bKey) {
  const a = dateFromKey(aKey).getTime();
  const b = dateFromKey(bKey).getTime();
  return Math.round((b - a) / 86400000);
}

export function addDays(key, n) {
  const d = dateFromKey(key);
  d.setDate(d.getDate() + n);
  return todayKey(d);
}

// ---- ID generator ----
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Clamping ----
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

// ---- Deep clone (structured for plain JSON data) ----
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ---- Format compact numbers ----
export function fmtNum(n) {
  if (n == null) return '—';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}
