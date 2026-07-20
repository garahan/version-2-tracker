// ============================================================
// Life OS v2 — Notifications
// Uses the Notifications API + service worker for reminders.
// Gracefully degrades if not supported or denied.
// ============================================================

import { getState, setSetting } from './state.js';
import { toast } from './ui.js';

const DEFAULT_TIMES = [
  { h: 9,  m: 0, msg: 'Plan your day. Pick the top 3.' },
  { h: 14, m: 0, msg: 'Afternoon check — how is the day going?' },
  { h: 21, m: 0, msg: 'Wind down. Did you do the Floor?' },
];

export async function requestPermission() {
  if (!('Notification' in window)) {
    toast('Notifications not supported on this device');
    return false;
  }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    setSetting('notifications', true);
    toast('Notifications on');
    scheduleAll();
    return true;
  }
  toast('Notifications blocked', { icon: '⚠️' });
  return false;
}

export function scheduleAll() {
  const s = getState();
  if (!s.settings.notifications) return;
  if (Notification.permission !== 'granted') return;
  // Cancel any existing
  cancelAll();
  for (const t of DEFAULT_TIMES) scheduleOne(t);
}

export function cancelAll() {
  // We use setTimeout-based scheduling (no real push server).
  // Track them so we can cancel.
  for (const id of _scheduled) clearTimeout(id);
  _scheduled = [];
}

const _scheduled = [];

function scheduleOne({ h, m, msg }) {
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const ms = next - now;
  const id = setTimeout(() => {
    try {
      new Notification('Life OS', { body: msg, icon: '/icon.png' });
    } catch {}
    // Re-schedule for next day
    scheduleOne({ h, m, msg });
  }, ms);
  _scheduled.push(id);
}

/** Fire an immediate test notification. */
export function testNotification() {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    toast('Enable notifications first');
    return;
  }
  new Notification('Life OS', { body: 'This is a test notification. 🔔' });
}
