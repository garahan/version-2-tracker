// ============================================================
// Life OS v3 — System Health Engine (v3 §21)
// Health of the OS itself — not your health, the system's.
// ============================================================

import { getState } from './state.js';
import { todayKey, addDays } from './util.js';

// ---- 6 health checks (v3 §21) ----
export function healthChecks() {
  const s = getState();
  const today = todayKey();
  const checks = [];

  // 1. Inbox backlog (raw items >7d old)
  const oldInbox = s.inbox.filter(i => (i.status || 'raw') === 'raw' && (i.created || today) < addDays(today, -7)).length;
  checks.push({
    id: 'inbox', label: 'Inbox backlog', value: oldInbox,
    status: oldInbox === 0 ? 'healthy' : oldInbox < 5 ? 'warning' : 'critical',
    target: 'Inbox',
  });

  // 2. Reviews overdue
  const overdueReviews = [];
  const limits = { weekly: 9, monthly: 38, quarterly: 95, semiannual: 190, annual: 380 };
  for (const [cadence, limit] of Object.entries(limits)) {
    const reviews = s.reviews[cadence] || [];
    if (!reviews.length) { overdueReviews.push(cadence); continue; }
    const last = reviews[reviews.length - 1];
    const days = (Date.now() - new Date(last.date).getTime()) / 86400000;
    if (days > limit) overdueReviews.push(cadence);
  }
  checks.push({
    id: 'reviews', label: 'Reviews overdue', value: overdueReviews.length,
    status: overdueReviews.length === 0 ? 'healthy' : overdueReviews.length < 2 ? 'warning' : 'critical',
    target: 'Reviews',
  });

  // 3. Risk register staleness (>90d without any update)
  const staleRisks = s.risks.filter(r => (r.updated || r.created || today) < addDays(today, -90)).length;
  checks.push({
    id: 'risks', label: 'Risks stale', value: staleRisks,
    status: staleRisks === 0 ? 'healthy' : staleRisks < 3 ? 'warning' : 'critical',
    target: 'Risks',
  });

  // 4. Strategy last review (quarterly review age)
  const qReviews = s.reviews.quarterly || [];
  const stratAge = qReviews.length ? (Date.now() - new Date(qReviews[qReviews.length - 1].date).getTime()) / 86400000 : 999;
  checks.push({
    id: 'strategy', label: 'Strategy last review', value: Math.round(stratAge) + 'd',
    status: stratAge < 95 ? 'healthy' : stratAge < 120 ? 'warning' : 'critical',
    target: 'Reviews',
  });

  // 5. Lessons logged (days since last)
  const lastLesson = s.lessonsLearned.length ? s.lessonsLearned[s.lessonsLearned.length - 1].date : null;
  const lessonAge = lastLesson ? (Date.now() - new Date(lastLesson).getTime()) / 86400000 : 999;
  checks.push({
    id: 'lessons', label: 'Days since lesson', value: Math.round(lessonAge),
    status: lessonAge < 14 ? 'healthy' : lessonAge < 30 ? 'warning' : 'critical',
    target: 'Lessons',
  });

  // 6. Decisions pending review
  const pendingDecisions = s.decisions.filter(d => !d.outcome && d.reviewDate && d.reviewDate < today).length;
  checks.push({
    id: 'decisions', label: 'Decisions pending review', value: pendingDecisions,
    status: pendingDecisions === 0 ? 'healthy' : pendingDecisions < 3 ? 'warning' : 'critical',
    target: 'Decisions',
  });

  return checks;
}

// ---- Overall system health score (0-100) ----
export function systemHealth() {
  const checks = healthChecks();
  const weights = { inbox: 15, reviews: 25, risks: 10, strategy: 15, lessons: 10, decisions: 15 };
  let score = 0, total = 0;
  for (const c of checks) {
    const w = weights[c.id] || 10;
    total += w;
    if (c.status === 'healthy') score += w;
    else if (c.status === 'warning') score += w * 0.5;
  }
  return { score: Math.round((score / total) * 100), checks };
}

// ---- Entropy monitor (v3 §22) ----
export function entropyMonitor() {
  const s = getState();
  const today = todayKey();
  const items = [];

  // Overdue actions (past grace period — last 7 days with no completions)
  let overdueActions = 0;
  for (let i = 1; i <= 7; i++) {
    const k = addDays(today, -i);
    const day = s.days[k];
    if (day && Object.keys(day.actions).length === 0) overdueActions++;
  }
  items.push({ id: 'overdue', label: 'Overdue days', value: overdueActions });

  // Stuck opportunities (>90d open)
  const stuckOpps = s.opportunities.filter(o => o.status === 'open' && (o.created || today) < addDays(today, -90)).length;
  items.push({ id: 'opps', label: 'Stuck opportunities', value: stuckOpps });

  // Unresolved errors (no fix)
  const unresolvedErrors = s.errors.filter(e => !e.fix).length;
  items.push({ id: 'errors', label: 'Unresolved errors', value: unresolvedErrors });

  // Aging inbox
  const agingInbox = s.inbox.filter(i => (i.status || 'raw') === 'raw' && (i.created || today) < addDays(today, -7)).length;
  items.push({ id: 'inbox', label: 'Aging inbox items', value: agingInbox });

  // Commitments at risk
  const commitmentsAtRisk = s.commitments.filter(c => c.status === 'active' && c.deadline < today).length;
  items.push({ id: 'commitments', label: 'Commitments at risk', value: commitmentsAtRisk });

  // Score: 100 - weighted chaos
  let chaos = 0;
  chaos += overdueActions * 8;
  chaos += stuckOpps * 5;
  chaos += unresolvedErrors * 4;
  chaos += agingInbox * 3;
  chaos += commitmentsAtRisk * 6;
  const score = Math.max(0, Math.min(100, 100 - chaos));

  return { score, items };
}
