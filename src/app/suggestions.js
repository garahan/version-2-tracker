// ============================================================
// Life OS v3 — Daily Suggestions Engine
// Personalized, history-based nudges for Today. Max 3 at a time,
// calm by design: each one is dismissible and explains *why* it
// appears. Signals used:
//   - most-skipped daily actions (last 7 days)
//   - time of day (deep work in the morning, reflection at night)
//   - training recency (from trainingLog)
//   - inbox pressure, recall cards due, weekly review due
//   - mood trend (suggest a floor day when consistently low)
// ============================================================

import { getState, updateSilent } from './state.js';
import { todayKey, daysAgoKey, hour, uid } from './util.js';
import { dueToday } from './cadence.js';

const MAX_SUGGESTIONS = 3;

// ---- Build today's suggestions (deterministic priority order) ----
export function buildSuggestions() {
  const s = getState();
  const t = todayKey();
  const day = s.days[t] || { actions: {}, tasks: [] };
  const dismissed = new Set(day.dismissedSuggestions || []);
  const out = [];
  const push = (sug) => {
    if (out.length < MAX_SUGGESTIONS && sug && !dismissed.has(sug.id) && !alreadyTasked(day, sug.id)) out.push(sug);
  };

  push(skippedActionSuggestion(s, day));
  push(trainingSuggestion(s));
  push(deepWorkSuggestion(s, day));
  push(recallSuggestion(s, t));
  push(inboxSuggestion(s));
  push(weeklyReviewSuggestion(s));
  push(lowMoodSuggestion(s, day));
  push(reflectionSuggestion(day));

  return out;
}

function alreadyTasked(day, sugId) {
  return (day.tasks || []).some(task => task.fromSuggestion === sugId);
}

// ---- 1. Most-skipped daily action in the last 7 days ----
function skippedActionSuggestion(s, day) {
  const due = dueToday();
  let worst = null;
  for (const { action } of due) {
    if (action.cadence !== 'daily') continue;
    if (day.actions[action.id]) continue; // already done today
    let missed = 0, seen = 0;
    for (let i = 1; i <= 7; i++) {
      const d = s.days[daysAgoKey(i)];
      if (!d) continue;
      seen++;
      if (!d.actions[action.id]) missed++;
    }
    if (seen >= 3 && missed >= 4 && (!worst || missed > worst.missed)) {
      worst = { action, missed, seen };
    }
  }
  if (!worst) return null;
  const { action, missed, seen } = worst;
  return {
    id: 'sug-skipped-' + action.id,
    icon: action.icon || '🎯',
    title: action.floor ? `Just the floor: ${action.floor}` : `Restart: ${action.name}`,
    why: `You missed "${action.name}" ${missed} of the last ${seen} days. A 2-minute floor keeps the loop alive.`,
    taskText: action.floor ? `${action.name} (floor: ${action.floor})` : action.name,
  };
}

// ---- 2. Training recency ----
function trainingSuggestion(s) {
  for (let i = 0; i < 3; i++) {
    if (s.trainingLog?.[daysAgoKey(i)]?.exercises?.length > 0) return null;
  }
  // Only suggest during waking action hours
  if (hour() < 7 || hour() > 20) return null;
  return {
    id: 'sug-training',
    icon: '🏋️',
    title: 'Train today',
    why: 'No workout logged in 3+ days. Muscle protein synthesis fades after ~48-72h — even one set restarts it.',
    taskText: 'Workout (tap Train for a guided session)',
  };
}

// ---- 3. Deep work in the morning ----
function deepWorkSuggestion(s, day) {
  if (hour() < 7 || hour() >= 13) return null;
  if ((day.deepWorkMins || 0) > 0) return null;
  return {
    id: 'sug-deepwork',
    icon: '🧠',
    title: 'One deep work block before noon',
    why: 'Your focus peaks in the first hours of the day. 60–90 min on the highest-leverage task compounds most.',
    taskText: 'Deep work block (60–90 min)',
  };
}

// ---- 4. Recall cards due ----
function recallSuggestion(s, t) {
  const due = (s.spacedRepetition || []).filter(c => c.nextDue && c.nextDue <= t).length;
  if (due < 1) return null;
  return {
    id: 'sug-recall',
    icon: '🃏',
    title: `Review ${due} recall card${due === 1 ? '' : 's'}`,
    why: 'Cards reviewed on their due date are remembered ~2× longer than late reviews.',
    taskText: `Review ${due} recall card${due === 1 ? '' : 's'}`,
  };
}

// ---- 5. Inbox pressure ----
function inboxSuggestion(s) {
  const raw = (s.inbox || []).filter(i => (i.status || 'raw') === 'raw').length;
  if (raw < 5) return null;
  return {
    id: 'sug-inbox',
    icon: '📥',
    title: `Process inbox (${raw} raw items)`,
    why: 'Open loops drain attention. 5 minutes of clarify-and-archive frees working memory.',
    taskText: `Process inbox (${raw} items)`,
  };
}

// ---- 6. Weekly review on Sundays ----
function weeklyReviewSuggestion(s) {
  const d = new Date();
  if (d.getDay() !== 0) return null;
  const t = todayKey();
  const recent = (s.reviews?.weekly || []).some(r => r.date && r.date >= daysAgoKey(6) && r.date <= t);
  if (recent) return null;
  return {
    id: 'sug-weekly-review',
    icon: '🔍',
    title: 'Weekly review',
    why: "It's Sunday and this week's review isn't logged. 15 minutes of correction beats a week of drift.",
    taskText: 'Weekly review (15 min)',
  };
}

// ---- 7. Low mood trend → floor day ----
function lowMoodSuggestion(s, day) {
  if (day.mood != null) return null;
  const moods = [];
  for (let i = 1; i <= 3; i++) {
    const m = s.days[daysAgoKey(i)]?.mood;
    if (m != null) moods.push(m);
  }
  if (moods.length < 2 || moods.reduce((a, b) => a + b, 0) / moods.length > 2.5) return null;
  return {
    id: 'sug-floor-day',
    icon: '🛟',
    title: 'Make today a floor day',
    why: 'Mood has been low for a few days. Do only the 2-minute floors — never miss twice, never burn out.',
    taskText: 'Floor day: minimum versions only',
  };
}

// ---- 8. Evening reflection ----
function reflectionSuggestion(day) {
  if (hour() < 19) return null;
  if (day.mood != null || (day.win || '').trim() || (day.lesson || '').trim()) return null;
  return {
    id: 'sug-reflection',
    icon: '🧘',
    title: 'Close the day: mood, one win, one lesson',
    why: 'Daily reflection is the feedback loop that makes everything else improve.',
    taskText: 'Evening reflection (2 min)',
  };
}

// ---- Actions on suggestions ----
export function dismissSuggestion(id) {
  const t = todayKey();
  updateSilent(st => {
    if (!st.days[t]) return;
    (st.days[t].dismissedSuggestions ||= []).push(id);
  });
}

export function acceptSuggestion(sug) {
  const t = todayKey();
  updateSilent(st => {
    if (!st.days[t]) return;
    const tasks = (st.days[t].tasks ||= []);
    if (tasks.some(task => task.fromSuggestion === sug.id)) return;
    tasks.push({ id: uid('task'), text: sug.taskText, done: false, fromSuggestion: sug.id, created: t });
  });
}

// ---- To-do helpers (day-scoped task list with carry-over) ----
export function ensureCarryOver() {
  const t = todayKey();
  const s = getState();
  const day = s.days[t];
  if (day && day.carriedOver) return;
  updateSilent(st => {
    if (!st.days[t]) return;
    const today = st.days[t];
    if (today.carriedOver) return;
    today.tasks ||= [];
    // Pull unfinished tasks from the last 3 days (once per day)
    for (let i = 1; i <= 3; i++) {
      const prev = st.days[daysAgoKey(i)];
      if (!prev || !Array.isArray(prev.tasks)) continue;
      for (const task of prev.tasks) {
        if (task.done || task.carriedTo) continue;
        task.carriedTo = t;
        today.tasks.push({ id: uid('task'), text: task.text, done: false, carried: true, created: t });
      }
    }
    today.carriedOver = true;
  });
}

export function addTask(text) {
  const t = todayKey();
  updateSilent(st => {
    if (!st.days[t]) return;
    (st.days[t].tasks ||= []).push({ id: uid('task'), text, done: false, created: t });
  });
}

export function toggleTask(id) {
  const t = todayKey();
  updateSilent(st => {
    const task = (st.days[t]?.tasks || []).find(x => x.id === id);
    if (task) task.done = !task.done;
  });
}

export function deleteTask(id) {
  const t = todayKey();
  updateSilent(st => {
    if (!st.days[t]) return;
    st.days[t].tasks = (st.days[t].tasks || []).filter(x => x.id !== id);
  });
}
