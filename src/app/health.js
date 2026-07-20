// ============================================================
// Life OS v2 — Apple Health sync (URL bridge)
// Apple Shortcut reads HealthKit and opens the app URL with
// query params: ?steps=&sleep=&hrv=&weight=&workoutMins=…
// This module parses those params and updates state.
// ============================================================

import { setState, getState, setDayField } from './state.js';
import { todayKey } from './util.js';
import { toast } from './ui.js';

const PARAM_MAP = {
  steps: { metric: 'steps', unit: 'count', label: 'Steps' },
  sleep: { metric: 'sleep', unit: 'h',     label: 'Sleep' },
  hrv:   { metric: 'hrv',   unit: 'ms',    label: 'HRV' },
  weight:{ metric: 'weight',unit: 'kg',    label: 'Weight' },
  restingHr: { metric: 'restingHr', unit: 'bpm', label: 'Resting HR' },
  activeCals: { metric: 'activeCals', unit: 'kcal', label: 'Active calories' },
  mindful: { metric: 'mindfulMinutes', unit: 'min', label: 'Mindful minutes' },
  water: { metric: 'water', unit: 'ml', label: 'Water' },
  workoutMins: { metric: 'workouts', unit: 'min', label: 'Workout' },
  vo2max: { metric: 'vo2max', unit: 'mL/kg/min', label: 'VO₂max' },
  screenTime: { metric: 'screenTime', unit: 'min', label: 'Screen time' },
};

/** Parse URL params on load and apply to state. Returns true if any params were found. */
export function ingestHealthFromURL() {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  if (![...params.keys()].some((k) => PARAM_MAP[k])) return false;

  const t = todayKey();
  const updates = {};
  for (const [param, def] of Object.entries(PARAM_MAP)) {
    const raw = params.get(param);
    if (raw == null || raw === '') continue;
    const val = Number(raw);
    if (Number.isNaN(val)) continue;
    updates[def.metric] = val;
    // Auto-toggle habits based on health data
    if (param === 'steps' && val >= 8000) maybeAutoMove('full');
    if (param === 'workoutMins' && val >= 20) maybeAutoMove('full');
    if (param === 'mindful' && val >= 10) maybeAutoWind('floor');
    if (param === 'sleep' && val >= 7) maybeAutoSleepNote(val);
  }

  if (Object.keys(updates).length === 0) return false;

  setState((s) => {
    for (const [metric, val] of Object.entries(updates)) {
      s.metrics[metric] = s.metrics[metric] || [];
      // Replace today's entry if exists, else append
      const existing = s.metrics[metric].find((m) => m.date === t);
      if (existing) existing.value = val;
      else s.metrics[metric].push({ date: t, value: val });
    }
  });

  // Clean URL (remove params so refresh doesn't re-apply)
  try {
    window.history.replaceState({}, '', window.location.pathname);
  } catch {}

  toast('Health data synced', { icon: '⌚' });
  return true;
}

function maybeAutoMove(level) {
  const s = getState();
  const t = todayKey();
  const day = s.days[t];
  if (day && day.habits?.body_move) return; // don't override manual
  setDayField(t, 'habits', { ...(day?.habits || {}), body_move: level });
}

function maybeAutoWind(level) {
  const s = getState();
  const t = todayKey();
  const day = s.days[t];
  if (day && day.habits?.body_wind) return;
  setDayField(t, 'habits', { ...(day?.habits || {}), body_wind: level });
}

function maybeAutoSleepNote(hours) {
  setDayField(todayKey(), '_sleepHours', hours);
}

/** Generate the URL the Apple Shortcut should open (for setup instructions). */
export function shortcutURL() {
  return `${window.location.origin}${window.location.pathname}?steps={steps}&sleep={sleep}&hrv={hrv}&weight={weight}&workoutMins={workoutMins}&mindful={mindful}&restingHr={restingHR}&water={water}&vo2max={vo2max}&screenTime={screenTimeMin}&activeCals={activeCal}`;
}
