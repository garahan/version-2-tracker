// ============================================================
// Life OS v3 — Analytics Engine (v3 §17)
// Momentum, trend, forecast, consistency, domain scores,
// most skipped, best day, system health, entropy.
// ============================================================

import { getState, dayScore } from './state.js';
import { allDomains } from './data/domains.js';
import { todayKey, dateFromKey, addDays } from './util.js';

// ---- Momentum (last 7 days score vs prior 7) ----
export function momentum() {
  const s = getState();
  const today = todayKey();
  let recent = 0, prior = 0;
  for (let i = 0; i < 7; i++) {
    const k = addDays(today, -i);
    recent += dayScore(s.days[k]);
  }
  for (let i = 7; i < 14; i++) {
    const k = addDays(today, -i);
    prior += dayScore(s.days[k]);
  }
  if (prior === 0) return recent > 0 ? 1 : 0;
  return (recent - prior) / prior;
}

// ---- Trend over N days (daily scores) ----
export function trend(n = 30) {
  const s = getState();
  const today = todayKey();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = addDays(today, -i);
    out.push({ date: k, score: dayScore(s.days[k]) });
  }
  return out;
}

// ---- Consistency (% of last N days with score > 0) ----
export function consistency(n = 30) {
  const s = getState();
  const today = todayKey();
  let hit = 0;
  for (let i = 0; i < n; i++) {
    const k = addDays(today, -i);
    if (dayScore(s.days[k]) > 0) hit++;
  }
  return hit / n;
}

// ---- Domain score (0-100, last 30 days completion) ----
export function domainScores() {
  const s = getState();
  const today = todayKey();
  const out = {};
  for (const domain of allDomains()) {
    const actionIds = domain.actions.map(a => a.id);
    let due = 0, done = 0;
    for (let i = 0; i < 30; i++) {
      const k = addDays(today, -i);
      const day = s.days[k];
      if (!day) continue;
      for (const id of actionIds) {
        // Approximation: count any completion in last 30 days
        const st = day.actions[id];
        if (st) {
          due++;
          if (st === 'full' || st === 'rest') done++;
          else if (st === 'floor') done += 0.5;
        }
      }
    }
    out[domain.id] = due > 0 ? Math.round((done / due) * 100) : 0;
  }
  return out;
}

// ---- Most skipped actions (last 30 days) ----
export function mostSkipped(limit = 5) {
  const s = getState();
  const today = todayKey();
  const counts = {};
  for (const domain of allDomains()) {
    for (const action of domain.actions) {
      counts[action.id] = { action, domain, skips: 0, due: 0 };
    }
  }
  for (let i = 0; i < 30; i++) {
    const k = addDays(today, -i);
    const day = s.days[k];
    if (!day) continue;
    for (const id of Object.keys(counts)) {
      const st = day.actions[id];
      if (st === undefined || st === null) {
        // Not done — but only count if it was due (approximation: count all)
        counts[id].skips++;
      }
    }
  }
  return Object.values(counts)
    .sort((a, b) => b.skips - a.skips)
    .slice(0, limit);
}

// ---- Best day (highest score in last 30) ----
export function bestDay() {
  const s = getState();
  const today = todayKey();
  let best = null, bestScore = 0;
  for (let i = 0; i < 30; i++) {
    const k = addDays(today, -i);
    const score = dayScore(s.days[k]);
    if (score > bestScore) { bestScore = score; best = k; }
  }
  return best ? { date: best, score: bestScore } : null;
}

// ---- Forecast (simple linear projection of version) ----
export function forecast() {
  const s = getState();
  const m = momentum();
  // Project version 30 days out
  const projected = s.version + (s.version * m * 0.1);
  return { currentVersion: s.version, projected, momentum: m };
}

// ---- Entropy (v3 §22) ----
export function entropy() {
  const s = getState();
  const today = todayKey();
  let score = 100;
  // Overdue actions
  let overdue = 0;
  for (let i = 1; i <= 7; i++) {
    const k = addDays(today, -i);
    const day = s.days[k];
    if (day) {
      const states = Object.values(day.actions);
      if (states.length === 0) overdue++;
    }
  }
  score -= overdue * 5;
  // Unreviewed decisions
  const unreviewedDecisions = s.decisions.filter(d => !d.outcome && d.reviewDate && d.reviewDate < today).length;
  score -= unreviewedDecisions * 4;
  // Old inbox
  const oldInbox = s.inbox.filter(i => i.status === 'raw' && i.created < addDays(today, -7)).length;
  score -= oldInbox * 3;
  // Stuck opportunities (>90d open)
  const stuckOpps = s.opportunities.filter(o => o.status === 'open' && o.created < addDays(today, -90)).length;
  score -= stuckOpps * 4;
  // Incomplete reviews
  const overdueReviews = ['weekly', 'monthly', 'quarterly', 'annual'].filter(c => isReviewOverdue(c, s)).length;
  score -= overdueReviews * 6;
  return Math.max(0, Math.min(100, score));
}

function isReviewOverdue(cadence, s) {
  const reviews = s.reviews[cadence] || [];
  if (!reviews.length) return false;
  const last = reviews[reviews.length - 1];
  const days = (Date.now() - dateFromKey(last.date).getTime()) / 86400000;
  const limits = { weekly: 9, monthly: 38, quarterly: 95, semiannual: 190, annual: 380 };
  return days > (limits[cadence] || 30);
}

// ---- System health (v3 §21) — delegated to system-health.js ----
export function systemHealthScore() {
  // Lazy import to avoid circular dep
  return import('./system-health.js').then(m => m.systemHealth().score);
}
