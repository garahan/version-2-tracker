// ============================================================
// Life OS v2 — Analytics engine
// Momentum (EWMA), forecast, maturity progression,
// correlations, streak risk, insights.
// ============================================================

import { getState, dayScore, currentStreak } from './state.js';
import { lastNDays, ewma, slope, round, todayKey, addDays, hour, parseKey, dow } from './util.js';
import { dueToday, dueOn, todayProgress } from './cadence.js';
export { todayProgress } from './cadence.js';

// ---- Momentum per action (14-day EWMA) ----

export function actionMomentum(actionId, days = 14) {
  const s = getState();
  const keys = lastNDays(days);
  const values = keys.map((k) => {
    const day = s.days[k];
    if (!day || !day.habits) return 0;
    const v = day.habits[actionId];
    if (v === 'full' || v === 'rest') return 1;
    if (v === 'floor') return 0.5;
    return 0;
  });
  const current = ewma(values, 0.15);
  const older = ewma(values.slice(0, Math.floor(days / 2)), 0.15);
  const trend = current > older + 0.05 ? 'up' : current < older - 0.05 ? 'down' : 'flat';
  return { current: round(current, 2), trend, older: round(older, 2) };
}

// ---- Momentum per domain (avg of its daily actions) ----

export function domainMomentum(domainId, days = 14) {
  const s = getState();
  const dom = s.domains[domainId];
  if (!dom) return { current: 0, trend: 'flat' };
  const dailyActions = (dom.actions || []).filter((a) => a.cadence === 'daily');
  if (!dailyActions.length) return { current: 0, trend: 'flat' };
  const ms = dailyActions.map((a) => actionMomentum(a.id, days).current);
  const current = ms.reduce((x, y) => x + y, 0) / ms.length;
  const olderMs = dailyActions.map((a) => actionMomentum(a.id, days).older);
  const older = olderMs.reduce((x, y) => x + y, 0) / olderMs.length;
  const trend = current > older + 0.05 ? 'up' : current < older - 0.05 ? 'down' : 'flat';
  return { current: round(current, 2), trend, older: round(older, 2) };
}

// ---- Forecast: when will v2.00 be reached? ----

export function forecast() {
  const s = getState();
  const remaining = Math.max(0, 400 - s.totalPoints);
  if (remaining <= 0) return { date: null, days: 0, remaining: 0, pace: 0 };
  const keys = lastNDays(14);
  const pts = keys.map((k) => dayScore(k));
  const validDays = pts.filter((p) => p > 0).length;
  if (validDays < 7) return { date: null, days: null, remaining, pace: null, insufficient: true };
  const avg = pts.reduce((x, y) => x + y, 0) / 14;
  if (avg <= 0) return { date: null, days: Infinity, remaining, pace: 0 };
  const days = Math.ceil(remaining / avg);
  const date = addDays(todayKey(), days);
  return { date, days, remaining: round(remaining, 1), pace: round(avg, 2) };
}

// ---- Streak risk (time-aware) ----

export function streakRisk() {
  const h = hour();
  const progress = todayProgress();
  const done = progress.done + progress.floor;
  const streak = currentStreak();
  // Loss aversion framing (Kahneman & Tversky, 1992):
  // Losses loom ~2x larger than gains. Frame as potential loss, not potential gain.
  const streakLoss = streak >= 3 ? ` You're about to lose your ${streak}-day streak.` : '';
  if (h >= 21 && done === 0) return { level: 'high', message: `Don't lose this day. Do the Floor now — it takes 2 minutes.${streakLoss}` };
  if (h >= 18 && done <= 1) return { level: 'high', message: `The day is slipping. Pick one habit or lose momentum.${streakLoss}` };
  if (h >= 14 && done === 0) return { level: 'medium', message: `Half the day is gone with nothing done. Don't waste it.${streakLoss}` };
  if (h >= 12 && done < progress.due / 2) return { level: 'medium', message: `Behind pace. Your future self is counting on you.` };
  return { level: 'low', message: 'On track. Protect your streak.' };
}

// ---- Insights ----

export function insights() {
  const s = getState();
  const out = [];
  // Most-skipped action (last 30 days)
  const skipCounts = {};
  for (const k of lastNDays(30)) {
    const due = dueOn(k);
    const day = s.days[k] || { habits: {} };
    for (const { action } of due) {
      if (action.cadence !== 'daily') continue;
      if (!day.habits[action.id]) skipCounts[action.id] = (skipCounts[action.id] || 0) + 1;
    }
  }
  let worst = null, worstCount = 0;
  for (const [id, c] of Object.entries(skipCounts)) {
    if (c > worstCount) { worst = id; worstCount = c; }
  }
  if (worst) {
    const dom = Object.values(s.domains).find((d) => d.actions?.some((a) => a.id === worst));
    const act = dom?.actions.find((a) => a.id === worst);
    if (act) out.push({ type: 'skip', icon: '⚠️', text: `Most-skipped (30d): ${act.name} — ${worstCount} misses` });
  }
  // Best day of week
  const dayScores = {};
  for (const k of Object.keys(s.days)) {
    const wd = dow(k);
    dayScores[wd] = dayScores[wd] || [];
    dayScores[wd].push(dayScore(k));
  }
  let bestDay = 0, bestAvg = 0;
  for (const [wd, arr] of Object.entries(dayScores)) {
    const avg = arr.reduce((x, y) => x + y, 0) / arr.length;
    if (avg > bestAvg) { bestAvg = avg; bestDay = Number(wd); }
  }
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (bestAvg > 0) out.push({ type: 'bestday', icon: '🏆', text: `Best day: ${dayNames[bestDay]} (avg ${bestAvg.toFixed(1)} pts)` });
  // Forecast
  const f = forecast();
  if (f.date) out.push({ type: 'forecast', icon: '📅', text: `At current pace, v2.00 on ${f.date} (${f.days}d)` });
  return out;
}
