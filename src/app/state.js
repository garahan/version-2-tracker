// ============================================================
// Life OS v2 — State
// Schema v2, persistence, v1→v2 migration, accessors.
// Single source of truth. All modules import from here.
// ============================================================

import { lsGet, lsSet, lsRemove, clone, uid, todayKey, addDays } from './util.js';
import { DEFAULT_DOMAINS } from './data/domains.js';

const STORAGE_KEY = 'lifeos-v2-state';
const SCHEMA_VERSION = 2;

// ---- Default empty state (v2) ----

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: todayKey(),
    version: 1.0,                  // overall life version (v1.00 → v2.00 at 400 pts)
    totalPoints: 0,
    identity: {
      name: '',
      statements: [],              // "I am the kind of person who..."
      northStar: { y10: '', y20: '', y30: '' },
      mission: '',
      values: [],
    },
    domains: clone(DEFAULT_DOMAINS),
    days: {},                       // { 'YYYY-MM-DD': DayRecord }
    reviews: {
      weekly: [],
      monthly: [],
      quarterly: [],
      semiannual: [],
      annual: [],
    },
    decisions: [],                  // DecisionRecord[]
    errors: [],                     // ErrorRecord[]
    opportunities: [],              // OpportunityRecord[]
    antiGoals: [],                  // AntiGoal[]
    risks: [],                      // RiskRecord[]
    resilienceProtocols: [],        // ResilienceProtocol[]
    sops: [],                       // SOP[] (also embedded in domains, but standalone library)
    lessonsLearned: [],             // LessonRecord[]
    inbox: [],                      // InboxItem[]
    tasks: [],                      // Task[] (clarified inbox items)
    metrics: {
      weight: [], hrv: [], sleep: [], vo2max: [],
      screenTime: [], steps: [], restingHr: [], bodyFat: [],
      workouts: [], mindfulMinutes: [], water: [],
    },
    optionality: {
      runwayMonths: 0,
      incomeSources: 0,
      scarceSkills: [],
      countries: [],
      strongContacts: 0,
      independentProjects: [],
    },
    infoDiet: {
      newsMins: 0, socialMins: 0, inboxZero: false, notificationsAudited: '',
    },
    shields: 0,                     // streak shields earned
    settings: {
      theme: 'midnight',            // midnight | light | oled
      accent: 'blue',
      sync: 'none',                 // none | gist
      gistId: '',
      gistToken: '',                // stored locally only
      onboarded: false,
      haptics: true,
      sounds: false,
      notifications: false,
    },
  };
}

// ---- Day record shape (for reference; not enforced at runtime) ----
// days[key] = {
//   habits: { domainId: 'full' | 'floor' | 'rest' | null },
//   mood: 1..5 | null,
//   note: '',
//   wins: '',
//   anti: '',
//   careerLog: '',
//   deepWorkMins: 0,
//   tasks: [taskId, ...],
//   shielded: false,
// }

// ---- Load with migration ----

export function loadState() {
  // Try v2 first
  const v2 = lsGet(STORAGE_KEY);
  if (v2 && v2.schemaVersion === SCHEMA_VERSION) {
    return reconcile(v2);
  }
  // Try v1 (legacy single-file app key)
  const v1 = lsGet('bega-v2-state');
  if (v1) return migrateV1ToV2(v1);
  // Fresh
  return defaultState();
}

/** Ensure all keys exist (forward-compatible additions). */
function reconcile(s) {
  const d = defaultState();
  return {
    ...d,
    ...s,
    identity: { ...d.identity, ...(s.identity || {}) },
    domains: mergeDomains(d.domains, s.domains),
    days: s.days || {},
    reviews: { ...d.reviews, ...(s.reviews || {}) },
    metrics: { ...d.metrics, ...(s.metrics || {}) },
    optionality: { ...d.optionality, ...(s.optionality || {}) },
    infoDiet: { ...d.infoDiet, ...(s.infoDiet || {}) },
    settings: { ...d.settings, ...(s.settings || {}) },
  };
}

/** Keep user customizations but ensure all 15 domains exist. */
function mergeDomains(defaults, existing) {
  const out = clone(defaults);
  if (!existing) return out;
  for (const [id, dom] of Object.entries(existing)) {
    if (out[id]) {
      out[id] = { ...out[id], ...dom, id };
    } else {
      out[id] = dom;
    }
  }
  return out;
}

// ---- v1 → v2 migration ----
// v1 had: habits (Big4 array), days (with habits keyed by habit id), mood, notes, etc.
// We map Big4 → domains.body.actions (preserving daily completion).

export function migrateV1ToV2(v1) {
  const s = defaultState();
  s.settings.onboarded = true; // already used v1
  s.createdAt = v1.createdAt || todayKey();

  // Map v1 habit completion (Big4) into v2 day records.
  // v1 days: { 'YYYY-MM-DD': { habits: { move:'full', fuel:'floor', ... }, mood, note, ... } }
  const v1Days = v1.days || {};
  let totalPts = 0;
  for (const [key, day] of Object.entries(v1Days)) {
    const habits = day.habits || {};
    const newHabits = {};
    // Big4 → body domain actions (we keep them as the body domain's daily actions)
    // Map: move/fuel/build/wind → body domain habit slots
    if (habits.move) newHabits.body_move = habits.move;
    if (habits.fuel) newHabits.body_fuel = habits.fuel;
    if (habits.build) newHabits.exec_build = habits.build;
    if (habits.wind) newHabits.body_wind = habits.wind;
    // Score: full=1, floor=0.5
    for (const v of Object.values(newHabits)) {
      if (v === 'full') totalPts += 1;
      else if (v === 'floor') totalPts += 0.5;
    }
    s.days[key] = {
      habits: newHabits,
      mood: day.mood || null,
      note: day.note || '',
      wins: day.wins || '',
      anti: day.anti || '',
      careerLog: day.careerLog || '',
      deepWorkMins: day.deepWorkMins || 0,
      tasks: [],
      shielded: !!day.shielded,
    };
  }
  s.totalPoints = totalPts;
  s.version = 1 + totalPts / 400;

  // Migrate identity if present
  if (v1.identity) {
    s.identity = { ...s.identity, ...v1.identity };
  }
  // Migrate shields
  if (typeof v1.shields === 'number') s.shields = v1.shields;

  return s;
}

// ---- Save ----

let _state = null;
let _listeners = new Set();

export function getState() {
  if (!_state) _state = loadState();
  return _state;
}

export function setState(updater) {
  const s = getState();
  if (typeof updater === 'function') updater(s);
  else Object.assign(s, updater);
  persist();
  notify();
}

export function persist() {
  lsSet(STORAGE_KEY, _state);
}

export function resetState() {
  lsRemove(STORAGE_KEY);
  _state = defaultState();
  persist();
  notify();
}

export function subscribe(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

function notify() {
  for (const fn of _listeners) {
    try { fn(_state); } catch (e) { console.error('listener error', e); }
  }
}

// ---- Domain accessors ----

export function getDomain(id) {
  return getState().domains[id];
}

export function updateDomain(id, patch) {
  setState((s) => {
    s.domains[id] = { ...s.domains[id], ...patch, id };
  });
}

export function domainIds() {
  return Object.keys(getState().domains);
}

// ---- Day accessors ----

export function getDay(key) {
  const s = getState();
  if (!s.days[key]) {
    s.days[key] = {
      habits: {}, mood: null, note: '', wins: '', anti: '',
      careerLog: '', deepWorkMins: 0, tasks: [], shielded: false,
    };
  }
  return s.days[key];
}

export function setDayAction(key, actionId, value) {
  setState((s) => {
    if (!s.days[key]) s.days[key] = { habits: {}, mood: null, note: '', wins: '', anti: '', careerLog: '', deepWorkMins: 0, tasks: [], shielded: false };
    if (value === null || value === undefined) delete s.days[key].habits[actionId];
    else s.days[key].habits[actionId] = value;
  });
  recomputeScore();
}

export function setDayField(key, field, value) {
  setState((s) => {
    if (!s.days[key]) s.days[key] = { habits: {}, mood: null, note: '', wins: '', anti: '', careerLog: '', deepWorkMins: 0, tasks: [], shielded: false };
    s.days[key][field] = value;
  });
}

// ---- Scoring ----

export function dayScore(key) {
  const day = getState().days[key];
  if (!day) return 0;
  let pts = 0;
  for (const v of Object.values(day.habits || {})) {
    if (v === 'full') pts += 1;
    else if (v === 'floor') pts += 0.5;
    else if (v === 'rest') pts += 1; // rest day counts as full for streak
  }
  return pts;
}

export function recomputeScore() {
  let total = 0;
  for (const key of Object.keys(getState().days)) total += dayScore(key);
  setState((s) => {
    s.totalPoints = total;
    s.version = 1 + total / 400;
  });
}

// ---- Streak ----

export function currentStreak() {
  const s = getState();
  let streak = 0;
  let key = todayKey();
  // If today not yet complete, start from yesterday
  if (dayScore(key) === 0) key = addDays(key, -1);
  while (s.days[key] && (dayScore(key) > 0 || s.days[key].shielded)) {
    streak++;
    key = addDays(key, -1);
  }
  return streak;
}

export function bestStreak() {
  const keys = Object.keys(getState().days).sort();
  let best = 0, cur = 0;
  for (const k of keys) {
    if (dayScore(k) > 0 || getState().days[k].shielded) {
      cur++;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}

// ---- Generic collection helpers ----

export function addRecord(collection, record) {
  setState((s) => {
    s[collection].push({ id: uid(collection.slice(0, 3)), createdAt: new Date().toISOString(), ...record });
  });
}

export function updateRecord(collection, id, patch) {
  setState((s) => {
    const item = s[collection].find((x) => x.id === id);
    if (item) Object.assign(item, patch, { updatedAt: new Date().toISOString() });
  });
}

export function removeRecord(collection, id) {
  setState((s) => {
    s[collection] = s[collection].filter((x) => x.id !== id);
  });
}

// ---- Settings ----

export function setSetting(key, value) {
  setState((s) => { s.settings[key] = value; });
  applySettings();
}

export function applySettings() {
  const s = getState();
  document.documentElement.dataset.theme = s.settings.theme;
  document.documentElement.dataset.accent = s.settings.accent;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const colors = { midnight: '#0b0d12', light: '#f5f6f8', oled: '#000000' };
    meta.setAttribute('content', colors[s.settings.theme] || '#0b0d12');
  }
}

// ---- Export / Import ----

export function exportJSON() {
  return JSON.stringify(getState(), null, 2);
}

export function importJSON(json) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON');
  _state = reconcile(parsed);
  persist();
  applySettings();
  notify();
}
