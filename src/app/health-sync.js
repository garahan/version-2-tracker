// ============================================================
// Life OS v3 — Health & Calendar Sync (Apple Shortcuts bridge)
// A PWA can't read Apple Health / Calendar directly, but the iOS
// Shortcuts app can. The bridge works like this:
//
//   1. A Shortcut reads Health samples + today's calendar events
//   2. It packs them into JSON and opens:
//        https://<your-app>/#sync=<base64 or url-encoded JSON>
//      (or copies the JSON — the app can paste from clipboard)
//   3. On load the app detects #sync=..., imports everything,
//      cleans the URL, and personalizes today's plan.
//
// Scheduled via Shortcuts Automation (e.g. every morning at 7:00),
// this becomes fully automatic — zero manual entry.
//
// Accepted JSON payload (all fields optional):
// {
//   "date": "YYYY-MM-DD",
//   "sleep": 7.4, "steps": 8200, "hrv": 62, "restingHr": 55,
//   "weight": 72.5, "bodyFat": 15, "vo2max": 44,
//   "mindfulMinutes": 10, "water": 1.2, "screenTime": 180,
//   "energy": 7, "deepWorkMins": 90,
//   "calendar": [ { "title": "Standup", "start": "09:30", "end": "10:00" } ]
// }
// Note: Screen Time has NO API (not even for Shortcuts) — it can
// only arrive via an "Ask for input" step in the Shortcut.
// ============================================================

import { getState, updateSilent, blankDay } from './state.js';
import { todayKey } from './util.js';
import { toast } from './ui.js';

const METRIC_KEYS = ['sleep', 'steps', 'hrv', 'restingHr', 'weight', 'bodyFat', 'vo2max', 'mindfulMinutes', 'water', 'screenTime', 'workouts'];

// ---- Import a parsed payload into state ----
export function importHealthPayload(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid sync payload');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(data.date || '') ? data.date : todayKey();
  const imported = [];

  updateSilent(st => {
    st.metrics ||= {};
    for (const key of METRIC_KEYS) {
      const v = Number(data[key]);
      if (data[key] == null || !isFinite(v)) continue;
      const arr = (st.metrics[key] ||= []);
      const existing = arr.find(m => m.date === date);
      if (existing) existing.value = v;
      else arr.push({ date, value: v });
      imported.push(key);
    }
    if (!st.days[date]) st.days[date] = blankDay();
    const day = st.days[date];
    const energy = Number(data.energy);
    if (data.energy != null && isFinite(energy)) { st.northStar.energy = energy; imported.push('energy'); }
    const dw = Number(data.deepWorkMins);
    if (data.deepWorkMins != null && isFinite(dw)) { day.deepWorkMins = dw; imported.push('deep work'); }
    if (Array.isArray(data.calendar)) {
      day.calendar = data.calendar
        .filter(e => e && typeof e === 'object' && e.title)
        .slice(0, 30)
        .map(e => ({ title: String(e.title).slice(0, 120), start: fmtEventTime(e.start), end: fmtEventTime(e.end) }));
      imported.push(`${day.calendar.length} events`);
    }
    st.settings.lastHealthSync = new Date().toISOString();
  });

  return { date, imported };
}

function fmtEventTime(v) {
  if (!v) return '';
  const s = String(v);
  // Accept "09:30", ISO strings, or "2026-07-21 09:30"
  const m = s.match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
}

// ---- URL intake: #sync=<payload> (base64 or url-encoded JSON) ----
export function maybeImportFromURL() {
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const m = hash.match(/[#&]sync=([^&]+)/) || search.match(/[?&]sync=([^&]+)/);
  if (!m) return false;
  try {
    const data = parsePayload(m[1]);
    const { imported } = importHealthPayload(data);
    toast(`Synced: ${imported.join(', ') || 'nothing new'}`, { icon: '⌚', duration: 4000 });
  } catch (e) {
    toast('Sync failed: ' + e.message, { icon: '⚠️' });
  }
  // Clean the URL either way so the payload doesn't linger in history
  history.replaceState(null, '', window.location.pathname);
  return true;
}

function parsePayload(raw) {
  const text = decodeURIComponent(raw);
  try { return JSON.parse(text); } catch {}
  // base64 / base64url fallback
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(escape(atob(b64))));
}

// ---- Clipboard intake (one tap in the app) ----
export async function importFromClipboard() {
  const text = await navigator.clipboard.readText();
  if (!text || !text.trim()) throw new Error('Clipboard is empty');
  const data = JSON.parse(text);
  return importHealthPayload(data);
}

// ---- Template JSON for building the Shortcut ----
export function payloadTemplate() {
  return JSON.stringify({
    date: todayKey(),
    sleep: 7.5, steps: 8000, hrv: 60, restingHr: 55, weight: 72.5,
    mindfulMinutes: 10, water: 1.5, screenTime: 150, energy: 7,
    calendar: [{ title: 'Meeting', start: '10:00', end: '11:00' }],
  }, null, 2);
}
