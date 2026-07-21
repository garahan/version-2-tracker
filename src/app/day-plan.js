// ============================================================
// Life OS v3 — Day Plan Engine
// Turns everything due today (daily / weekly / monthly actions,
// to-dos, recall) into a time-slotted plan.
//
// Slotting logic, in priority order:
//   1. Personal history — the median hour at which YOU actually
//      completed this action over the last 21 days (≥3 samples).
//      Completion times are recorded automatically on every toggle.
//   2. Chronobiology defaults (see SCIENCE_SLOTS):
//      · Morning light within 30-60 min of waking — anchors the
//        circadian clock via the cortisol awakening response
//        (Huberman/ Czeisler protocols).
//      · Deep work 2-4h after waking — peak alertness window of
//        the circadian arousal curve; scheduled as a 90-min
//        ultradian cycle (Kleitman; Ericsson deliberate practice).
//      · Low-focus admin in the post-lunch dip (~13-15h) when
//        alertness naturally sags.
//      · Strength/cardio late afternoon (~16-18h) — body
//        temperature, power output and injury resilience peak.
//      · Recall/spaced repetition in the evening — pre-sleep
//        review benefits from sleep-dependent memory
//        consolidation.
//      · Reflection + wind-down last — sleep-hygiene buffer,
//        dim light, no screens (AASM guidance).
//   3. Calendar awareness — slots that collide with synced
//      events are pushed to the first free gap after the event.
// ============================================================

import { getState, updateSilent } from './state.js';
import { todayKey, daysAgoKey } from './util.js';
import { dueToday } from './cadence.js';

// ---- Science-backed default slots (fractional hours) ----
// Ordered chronologically through the day. Timing is grounded in:
//  · Circadian biology (Czeisler, Huberman) — light, cortisol, body temp
//  · Glucose management — post-meal walks blunt glucose spikes
//  · Sleep hygiene (AASM) — wind-down, dim light, no screens, no food
//  · Memory consolidation — pre-sleep review benefits from sleep
const SCIENCE_SLOTS = {
  // === MORNING (wake – 9h) ===
  body_sun:        { h: 7.0,  why: 'Morning light anchors your circadian clock' },
  body_teeth_am:   { h: 7.05, why: 'Brush first thing — clears morning bacteria' },
  body_weight:     { h: 7.15, why: 'Weigh at the same conditions: waking, fasted' },
  psy_mindful:     { h: 7.3,  why: 'Meditation before inputs sets attentional tone' },
  nutr_water:      { h: 7.5,  why: 'Rehydrate first — you lose ~0.5L overnight' },
  body_skincare_am:{ h: 7.7,  why: 'Apply SPF before any sun exposure' },
  body_mobility:   { h: 7.75, why: 'Mobility when warm from the shower' },
  nutr_breakfast:  { h: 8.0,  why: 'Break the fast with protein to anchor blood sugar' },
  know_review:     { h: 8.25, why: 'Recall works best fresh, before new input' },
  att_deep:        { h: 9.0,  why: 'Alertness peaks 2–4h after waking — protect it' },
  prod_commit:     { h: 10.0, why: 'Ship inside the deep work window' },
  att_single:      { h: 11.0, why: 'One window, one task — ride the focus wave' },

  // === MIDDAY (12 – 15h) ===
  nutr_lunch:      { h: 12.5, why: 'Lunch at a consistent time stabilizes circadian rhythm' },
  nutr_protein:    { h: 12.55,why: 'Check protein at the meal anchor' },
  psy_mood:        { h: 13.0, why: 'Post-lunch check-in catches the afternoon dip' },
  nutr_log:        { h: 13.2, why: 'Log while the meal is fresh in memory' },
  body_walk_lunch: { h: 13.3, why: '10-min walk after lunch blunts the glucose spike by ~30%' },
  bio_sync:        { h: 13.5, why: 'Admin belongs in the post-lunch dip' },
  env_ws:          { h: 15.0, why: 'Reset the workspace in the low-focus window' },
  env_inbox:       { h: 15.5, why: 'Batch shallow work in the dip' },

  // === LATE AFTERNOON (15 – 18h) ===
  prod_review:     { h: 16.0, why: 'Review before the day\u2019s energy fades' },
  proj_review:     { h: 16.0, why: 'Review before the day\u2019s energy fades' },
  body_zone2:      { h: 16.5, why: 'Cardio in the late-afternoon performance peak' },
  body_move:       { h: 17.0, why: 'Strength peaks with body temperature (16–18h)' },
  body_strength:   { h: 17.0, why: 'Strength peaks with body temperature (16–18h)' },

  // === EVENING (18 – 21h) ===
  psy_journal:     { h: 18.0, why: 'Journal at the day\u2019s natural close' },
  res_plan:        { h: 18.0, why: 'Plan the week while it\u2019s still visible' },
  soc_reach:       { h: 18.5, why: 'People are reachable after work hours' },
  att_audit:       { h: 18.5, why: 'Audit distractions while they\u2019re fresh' },
  nutr_dinner:     { h: 19.0, why: 'Dinner 3h before bed allows digestion before sleep' },
  fam_conv:        { h: 19.5, why: 'Phone-free time after dinner' },
  env_tomorrow:    { h: 20.0, why: 'Prep tomorrow after dinner — reduces morning friction' },
  body_walk_pm:    { h: 20.2, why: 'Evening walk aids digestion + decompression' },
  nutr_stop:       { h: 20.5, why: 'Stop eating 3h before bed — improves sleep quality' },
  know_read:       { h: 20.5, why: 'Reading winds the mind down, screens up' },
  know_capture:    { h: 21.0, why: 'Capture ideas right after reading' },

  // === NIGHT ROUTINE (21 – 22h) — sequential, in order ===
  body_wind:       { h: 21.25, why: 'Dim light + no phone = deeper sleep' },
  env_phone:       { h: 21.3,  why: 'Phone in kitchen overnight — removes the temptation' },
  body_skincare_pm:{ h: 21.4,  why: 'Night skincare before bed' },
  body_teeth_pm:   { h: 21.5,  why: 'Brush + floss before bed — no food after' },
  body_supp_pm:    { h: 21.55, why: 'Magnesium glycinate + glycine support sleep' },
  psy_note:        { h: 21.6,  why: 'Reflection before bed consolidates the day' },
  psy_gratitude:   { h: 21.7,  why: 'Gratitude practice improves sleep quality' },
  body_stretch_pm: { h: 21.8,  why: 'Gentle stretch releases tension from the day' },
  psy_breath:      { h: 21.9,  why: 'Box breathing 4-4-4-4 activates parasympathetic' },
};

// Heuristic fallback for unmapped actions
function defaultSlot(action) {
  if ((action.compoundScore || 0) >= 9 && (action.estMins || 0) >= 45) {
    return { h: 9.0, why: 'High-leverage work belongs in the morning peak' };
  }
  if ((action.estMins || 0) <= 5) return { h: 8.0, why: 'Tiny task — stack it onto the morning routine' };
  return { h: 15.0, why: 'Scheduled in the flexible afternoon window' };
}

// ---- Personal history: median completion hour (last 21 days) ----
function personalHour(s, actionId) {
  const hours = [];
  for (let i = 0; i < 21; i++) {
    const h = s.days[daysAgoKey(i)]?.actionTimes?.[actionId];
    if (typeof h === 'number' && h >= 5 && h <= 23.9) hours.push(h);
  }
  if (hours.length < 3) return null;
  hours.sort((a, b) => a - b);
  return hours[Math.floor(hours.length / 2)];
}

// ---- Busy intervals from synced calendar ----
function busyIntervals(day) {
  return (day.calendar || [])
    .map(e => {
      const s = parseHM(e.start), en = parseHM(e.end);
      return s != null && en != null && en > s ? [s, en] : null;
    })
    .filter(Boolean)
    .sort((a, b) => a[0] - b[0]);
}

function parseHM(str) {
  const m = String(str || '').match(/(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) + Number(m[2]) / 60 : null;
}

// Push a slot out of any busy interval (5-min buffer after events)
function avoidBusy(h, durMins, busy) {
  const dur = Math.max(durMins || 10, 10) / 60;
  let hour = h;
  for (let guard = 0; guard < 12; guard++) {
    const hit = busy.find(([s, e]) => hour < e && hour + dur > s);
    if (!hit) return hour;
    hour = hit[1] + 5 / 60;
  }
  return hour;
}

// ---- Build today's plan ----
export function buildDayPlan() {
  const s = getState();
  const t = todayKey();
  const day = s.days[t] || { actions: {}, tasks: [], calendar: [] };
  const busy = busyIntervals(day);
  const entries = [];

  // 1. Cadenced actions due today (daily / weekly / monthly / ...)
  for (const { domain, action } of dueToday()) {
    const personal = personalHour(s, action.id);
    const slot = SCIENCE_SLOTS[action.id] || defaultSlot(action);
    const base = personal != null ? personal : slot.h;
    const hour = avoidBusy(base, action.estMins, busy);
    entries.push({
      hour,
      type: 'action',
      id: action.id,
      icon: action.icon || domain.icon,
      name: action.name,
      meta: [action.estMins && `${action.estMins}m`, action.cadence !== 'daily' && action.cadence].filter(Boolean).join(' · '),
      why: personal != null ? 'Your usual time for this' : slot.why,
      floor: action.floor,
      state: day.actions[action.id] || null,
      action,
    });
  }

  // 2. Recall block if cards are due (evening consolidation)
  const dueCards = (s.spacedRepetition || []).filter(c => c.nextDue && c.nextDue <= t).length;
  const hasReviewAction = entries.some(e => e.id === 'know_review');
  if (dueCards > 0 && !hasReviewAction) {
    entries.push({
      hour: avoidBusy(21.0, 15, busy),
      type: 'recall', id: 'plan-recall', icon: '🧠',
      name: `Review ${dueCards} recall card${dueCards === 1 ? '' : 's'}`,
      meta: '15m',
      why: 'Pre-sleep review benefits from memory consolidation',
    });
  }

  // 3. Open to-dos → earliest free gaps from now (30-min steps)
  const now = new Date();
  let cursor = Math.max(now.getHours() + now.getMinutes() / 60 + 0.25, 9);
  const taken = entries.map(e => [e.hour, e.hour + Math.max((e.action?.estMins || 15), 15) / 60]);
  for (const task of (day.tasks || [])) {
    if (task.done) continue;
    let h = avoidBusy(cursor, 30, busy);
    for (let guard = 0; guard < 24; guard++) {
      const clash = taken.find(([a, b]) => h < b && h + 0.5 > a);
      if (!clash) break;
      h = avoidBusy(clash[1] + 5 / 60, 30, busy);
    }
    taken.push([h, h + 0.5]);
    entries.push({ hour: h, type: 'task', id: task.id, icon: '📝', name: task.text, meta: 'to-do', why: '', task });
    cursor = h + 0.5;
  }

  entries.sort((a, b) => a.hour - b.hour);
  return entries;
}

// ---- Format fractional hour → "HH:MM" ----
export function fmtHour(h) {
  const clamped = Math.min(23.99, Math.max(0, h));
  const hh = Math.floor(clamped);
  const mm = Math.round((clamped - hh) / (1 / 60) / 5) * 5 % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// ---- Record when an action was completed (feeds personalization) ----
export function recordActionTime(dateKey, actionId) {
  const now = new Date();
  updateSilent(st => {
    const day = st.days[dateKey];
    if (!day) return;
    (day.actionTimes ||= {})[actionId] = now.getHours() + now.getMinutes() / 60;
  });
}
