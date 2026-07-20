// ============================================================
// Life OS v3 — State
// Local-first, single user, localStorage persistence.
// v3 §26: local-first, offline-first, no backend, JSON export,
// JSON import, schema migration, encryption-ready.
// ============================================================

import { clone, todayKey } from './util.js';
import { DEFAULT_DOMAINS } from './data/domains.js';

const STORAGE_KEY = 'lifeos.v3';
const SCHEMA_VERSION = 3;

// ---- Default state ----
export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: todayKey(),
    version: 1.0,           // life version (v1.00 → v2.00 at 400 pts)
    totalPoints: 0,
    identity: {
      name: '',
      statements: [],
      northStar: { y3: '', y5: '', y10: '' },
      mission: '',
      values: [],
    },
    domains: clone(DEFAULT_DOMAINS),
    days: {},               // { 'YYYY-MM-DD': DayRecord }
    reviews: { weekly: [], monthly: [], quarterly: [], semiannual: [], annual: [] },
    decisions: [],
    errors: [],
    opportunities: [],
    antiGoals: [],
    risks: [],
    resilienceProtocols: [],
    lessonsLearned: [],
    inbox: [],
    tasks: [],
    spacedRepetition: [],
    temptationBundles: [],
    commitments: [],
    projects: [],           // v3 §20 — Leverage Engine
    blackSwans: [],         // v3 §16 — Black Swan Plans
    metrics: {
      weight: [], hrv: [], sleep: [], vo2max: [],
      screenTime: [], steps: [], restingHr: [], bodyFat: [],
      workouts: [], mindfulMinutes: [], water: [],
    },
    optionality: {
      runwayMonths: 0, incomeSources: 0, scarceSkills: [],
      countries: [], strongContacts: 0, independentProjects: [],
    },
    northStar: {
      healthspan: null, energy: null, vo2max: null,
      runwayMonths: null, netWorth: null, savingsRate: null,
      learningVelocity: null, deepWorkHours: null,
      relationshipScore: null, optionality: null,
      freedomScore: null, lifeSatisfaction: null,
    },
    shields: 0,
    settings: {
      theme: 'midnight', accent: 'cyan',
      sync: 'none', gistId: '', gistToken: '',
      onboarded: false, haptics: true, sounds: false, notifications: false,
    },
  };
}

// ---- Day record factory ----
export function blankDay() {
  return {
    actions: {},     // { actionId: 'full' | 'floor' | 'rest' | null }
    mood: null,      // 1..5
    win: '',         // one win (v3 §8)
    lesson: '',      // one lesson (v3 §8)
    deepWorkMins: 0,
    tasks: [],
    shielded: false,
  };
}

// ---- Persistence ----
let _state = null;
const _subs = new Set();

export function getState() {
  if (_state) return _state;
  _state = load();
  return _state;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (e) {
    console.warn('State load failed, using defaults:', e);
    return defaultState();
  }
}

export function save() {
  if (!_state) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  } catch (e) {
    console.warn('State save failed:', e);
  }
  notify();
}

// Save without triggering re-render (for in-place DOM updates)
export function saveSilent() {
  if (!_state) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  } catch (e) {
    console.warn('State save failed:', e);
  }
}

export function subscribe(fn) {
  _subs.add(fn);
  return () => _subs.delete(fn);
}

function notify() {
  for (const fn of _subs) {
    try { fn(); } catch (e) { console.warn(e); }
  }
}

// ---- Mutations (immutable-ish: mutate then save+notify) ----
export function update(mutator) {
  const s = getState();
  mutator(s);
  save();
}

// Silent mutation — save without re-render (for in-place DOM updates)
export function updateSilent(mutator) {
  const s = getState();
  mutator(s);
  saveSilent();
}

export function applySettings() {
  const s = getState();
  const root = document.documentElement;
  root.dataset.theme = s.settings.theme;
  root.dataset.accent = s.settings.accent;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const colors = { midnight: '#0a0b0f', light: '#f4f5f8', oled: '#000000' };
    meta.content = colors[s.settings.theme] || '#0a0b0f';
  }
}

// ---- Day helpers ----
export function getDay(key) {
  const s = getState();
  if (!s.days[key]) {
    update(st => { st.days[key] = blankDay(); });
  }
  return getState().days[key];
}

export function setDayAction(key, actionId, state) {
  updateSilent(st => {
    if (!st.days[key]) st.days[key] = blankDay();
    const day = st.days[key];
    const cur = day.actions[actionId];
    // cycle: null → full → floor → rest → null
    const next = state != null ? state : cycleState(cur);
    if (next) day.actions[actionId] = next;
    else delete day.actions[actionId];
    recompute(st);
  });
}

export function cycleState(cur) {
  if (!cur || cur === null) return 'full';
  if (cur === 'full') return 'floor';
  if (cur === 'floor') return 'rest';
  if (cur === 'rest') return null;
  return 'full';
}

export function setDayField(key, field, value) {
  updateSilent(st => {
    if (!st.days[key]) st.days[key] = blankDay();
    st.days[key][field] = value;
  });
}

// ---- Recompute version + shields (v3 §8 scoring) ----
function recompute(st) {
  const today = todayKey();
  const day = st.days[today];
  if (!day) return;
  // Points: full=1, floor=0.5, rest=1, missed=0
  // (computed on demand in analytics; version derived from totalPoints)
}

export function addPoints(n) {
  update(st => { st.totalPoints += n; st.version = 1 + st.totalPoints / 400; });
}

// ---- Streaks ----
export function currentStreak() {
  const s = getState();
  let streak = 0;
  let key = todayKey();
  // If today not complete, count from yesterday
  const today = s.days[key];
  const todayScore = dayScore(today);
  if (todayScore <= 0) key = shiftKey(key, -1);
  while (true) {
    const d = s.days[key];
    if (!d) break;
    const score = dayScore(d);
    if (score > 0 || d.shielded) streak++;
    else break;
    key = shiftKey(key, -1);
  }
  return streak;
}

export function bestStreak() {
  const s = getState();
  const keys = Object.keys(s.days).sort();
  let best = 0, cur = 0;
  let prev = null;
  for (const k of keys) {
    const d = s.days[k];
    const score = dayScore(d);
    if (score > 0 || d.shielded) {
      if (prev && shiftKey(prev, 1) === k) cur++;
      else cur = 1;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
    prev = k;
  }
  return best;
}

export function dayScore(day) {
  if (!day) return 0;
  const states = Object.values(day.actions);
  if (!states.length) return 0;
  let pts = 0;
  for (const st of states) {
    if (st === 'full') pts += 1;
    else if (st === 'floor') pts += 0.5;
    else if (st === 'rest') pts += 1;
  }
  return pts;
}

function shiftKey(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return todayKey(dt);
}

export function checkShieldEarned() {
  // Earn a shield every 7 consecutive complete days
  const s = getState();
  const streak = currentStreak();
  if (streak > 0 && streak % 7 === 0 && streak / 7 > s.shields) {
    update(st => { st.shields = Math.floor(streak / 7); });
    return true;
  }
  return false;
}

// ---- Migration ----
function migrate(prev) {
  if (!prev.schemaVersion || prev.schemaVersion < SCHEMA_VERSION) {
    // Merge in any new default fields
    const next = defaultState();
    const merged = { ...next, ...prev };
    merged.settings = { ...next.settings, ...prev.settings };
    merged.identity = { ...next.identity, ...prev.identity };
    merged.optionality = { ...next.optionality, ...prev.optionality };
    merged.northStar = { ...next.northStar, ...(prev.northStar || {}) };
    merged.reviews = { ...next.reviews, ...prev.reviews };
    merged.metrics = { ...next.metrics, ...prev.metrics };
    // Domains: keep user data, but ensure all 22 exist
    merged.domains = { ...next.domains, ...prev.domains };
    merged.schemaVersion = SCHEMA_VERSION;
    return merged;
  }
  return prev;
}

// ---- Export / Import (v3 §26) ----
export function exportJSON() {
  return JSON.stringify(getState(), null, 2);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  const migrated = migrate(parsed);
  _state = migrated;
  save();
  applySettings();
}

export function resetAll() {
  _state = defaultState();
  save();
  applySettings();
}
