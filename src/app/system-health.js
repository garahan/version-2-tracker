// ============================================================
// Life OS v2 — System Health & Entropy Monitor
//
// System Health: measures the health of the OS itself, not the user.
//   - Inbox backlog (unprocessed items)
//   - Review overdue (weekly/monthly/quarterly/annual past due)
//   - Risk register staleness (not updated in 90+ days)
//   - Strategy last review (quarterly review overdue)
//   - Lessons not logged (no lessons in 30+ days)
//   - Decisions pending review (reviewDate passed, no outcome)
//
// Entropy Monitor: measures chaos accumulation.
//   - Overdue actions (past grace period)
//   - Open opportunities stuck (in "open" > 90 days)
//   - Unresolved errors (errors without fix)
//   - Inbox items aging (raw > 7 days)
//
// Both produce a score 0-100 (higher = healthier / lower entropy).
// ============================================================

import { getState } from './state.js';
import { todayKey, daysBetween, addDays } from './util.js';
import { overdue } from './cadence.js';

// ---- System Health ----

/**
 * Compute overall system health.
 * Returns { score: 0-100, checks: HealthCheck[], status: 'healthy'|'warning'|'critical' }
 */
export function systemHealth() {
  const s = getState();
  const t = todayKey();
  const checks = [];

  // 1. Inbox backlog
  const rawInbox = (s.inbox || []).filter(i => i.status === 'raw');
  const agingInbox = rawInbox.filter(i => daysBetween(i.createdAt, t) > 7);
  checks.push({
    id: 'inbox',
    label: 'Inbox backlog',
    icon: '📥',
    value: rawInbox.length,
    detail: rawInbox.length === 0 ? 'Inbox zero' : `${rawInbox.length} unprocessed (${agingInbox.length} aging >7d)`,
    status: rawInbox.length === 0 ? 'ok' : agingInbox.length > 5 ? 'critical' : 'warning',
  });

  // 2. Reviews overdue
  const reviewTypes = ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'];
  let overdueReviews = 0;
  const overdueList = [];
  for (const type of reviewTypes) {
    const items = s.reviews?.[type] || [];
    const last = items[items.length - 1];
    const expectedInterval = { weekly: 7, monthly: 31, quarterly: 92, semiannual: 183, annual: 365 }[type];
    if (!last) {
      overdueReviews++;
      overdueList.push(type);
    } else if (daysBetween(last.date, t) > expectedInterval * 1.5) {
      overdueReviews++;
      overdueList.push(type);
    }
  }
  checks.push({
    id: 'reviews',
    label: 'Reviews overdue',
    icon: '📅',
    value: overdueReviews,
    detail: overdueReviews === 0 ? 'All reviews current' : `Overdue: ${overdueList.join(', ')}`,
    status: overdueReviews === 0 ? 'ok' : overdueReviews >= 3 ? 'critical' : 'warning',
  });

  // 3. Risk register staleness
  const risks = s.risks || [];
  const staleRisks = risks.filter(r => {
    if (!r.updatedAt && !r.createdAt) return false;
    const ref = r.updatedAt || r.createdAt;
    return daysBetween(ref, t) > 90;
  });
  checks.push({
    id: 'risks',
    label: 'Risk register',
    icon: '🛡️',
    value: risks.length,
    detail: risks.length === 0 ? 'No risks logged' : staleRisks.length > 0 ? `${staleRisks.length} stale (>90d)` : 'Current',
    status: risks.length === 0 ? 'warning' : staleRisks.length > 3 ? 'critical' : staleRisks.length > 0 ? 'warning' : 'ok',
  });

  // 4. Strategy last review
  const quarterlyReviews = s.reviews?.quarterly || [];
  const lastQuarterly = quarterlyReviews[quarterlyReviews.length - 1];
  const strategyAge = lastQuarterly ? daysBetween(lastQuarterly.date, t) : null;
  checks.push({
    id: 'strategy',
    label: 'Strategy review',
    icon: '🎯',
    value: strategyAge,
    detail: strategyAge === null ? 'Never reviewed' : strategyAge > 120 ? `${strategyAge}d ago — stale` : `${strategyAge}d ago`,
    status: strategyAge === null ? 'critical' : strategyAge > 120 ? 'critical' : strategyAge > 92 ? 'warning' : 'ok',
  });

  // 5. Lessons not logged
  const lessons = s.lessonsLearned || [];
  const lastLesson = lessons[lessons.length - 1];
  const lessonAge = lastLesson ? daysBetween(lastLesson.date || lastLesson.createdAt, t) : null;
  checks.push({
    id: 'lessons',
    label: 'Lessons logged',
    icon: '🎓',
    value: lessons.length,
    detail: lessonAge === null ? 'No lessons yet' : lessonAge > 60 ? `${lessonAge}d since last lesson` : 'Recent',
    status: lessonAge === null ? 'warning' : lessonAge > 60 ? 'warning' : 'ok',
  });

  // 6. Decisions pending review
  const pendingDecisions = (s.decisions || []).filter(d => d.reviewDate && d.reviewDate <= t && !d.outcome);
  checks.push({
    id: 'decisions',
    label: 'Decisions pending review',
    icon: '⚖️',
    value: pendingDecisions.length,
    detail: pendingDecisions.length === 0 ? 'All reviewed' : `${pendingDecisions.length} due for review`,
    status: pendingDecisions.length === 0 ? 'ok' : pendingDecisions.length > 3 ? 'critical' : 'warning',
  });

  // Compute score: each check contributes equally
  const okCount = checks.filter(c => c.status === 'ok').length;
  const score = Math.round((okCount / checks.length) * 100);
  const status = score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical';

  return { score, checks, status };
}

// ---- Entropy Monitor ----

/**
 * Compute entropy (chaos) level.
 * Returns { score: 0-100 (higher = less entropy), items: EntropyItem[], level: 'low'|'medium'|'high' }
 */
export function entropyMonitor() {
  const s = getState();
  const t = todayKey();
  const items = [];

  // 1. Overdue actions (past grace period)
  const overdueActions = overdue();
  items.push({
    id: 'overdue',
    label: 'Overdue actions',
    icon: '⏰',
    count: overdueActions.length,
    detail: overdueActions.length === 0 ? 'Nothing overdue' : `${overdueActions.length} actions past grace period`,
    weight: 3, // overdue actions are high entropy
  });

  // 2. Open opportunities stuck (>90 days in "open")
  const stuckOpps = (s.opportunities || []).filter(o => {
    if (o.status !== 'open') return false;
    const age = daysBetween(o.createdAt || t, t);
    return age > 90;
  });
  items.push({
    id: 'stuck-opps',
    label: 'Stuck opportunities',
    icon: '🔮',
    count: stuckOpps.length,
    detail: stuckOpps.length === 0 ? 'No stuck opportunities' : `${stuckOpps.length} open >90d`,
    weight: 1,
  });

  // 3. Unresolved errors (errors without fix)
  const unresolvedErrors = (s.errors || []).filter(e => !e.fix || e.fix === '');
  items.push({
    id: 'errors',
    label: 'Unresolved errors',
    icon: '🐛',
    count: unresolvedErrors.length,
    detail: unresolvedErrors.length === 0 ? 'All errors resolved' : `${unresolvedErrors.length} without fix`,
    weight: 2,
  });

  // 4. Inbox items aging (raw > 7 days)
  const agingInbox = (s.inbox || []).filter(i => i.status === 'raw' && daysBetween(i.createdAt, t) > 7);
  items.push({
    id: 'aging-inbox',
    label: 'Aging inbox items',
    icon: '📬',
    count: agingInbox.length,
    detail: agingInbox.length === 0 ? 'Inbox fresh' : `${agingInbox.length} raw >7d`,
    weight: 1,
  });

  // 5. Active commitments at risk (deadline today or past, not completed)
  const activeCommitments = (s.commitments || []).filter(c => c.status === 'active' && c.deadline <= t);
  items.push({
    id: 'commitments-at-risk',
    label: 'Commitments at risk',
    icon: '🔒',
    count: activeCommitments.length,
    detail: activeCommitments.length === 0 ? 'No commitments at risk' : `${activeCommitments.length} due or overdue`,
    weight: 2,
  });

  // Compute entropy score: weighted sum of items, normalized
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  const entropyPoints = items.reduce((sum, i) => sum + i.count * i.weight, 0);
  // Score: 100 = zero entropy, 0 = max entropy
  // Normalize: assume 20 entropy points = max entropy for scoring purposes
  const score = Math.max(0, Math.round(100 - (entropyPoints / 20) * 100));
  const level = score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high';

  return { score, items, level, entropyPoints };
}
