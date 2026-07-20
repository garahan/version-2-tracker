// ============================================================
// Life OS v2 — Commitment Devices
// Scientific basis: Thaler & Shefrin (1981), Ashraf et al. (2006)
// Commitment contracts increase savings by 30-50% in field trials.
//
// Mechanism: pre-commitment overcomes present bias (hyperbolic
// discounting) by imposing costs on the future self for failing
// to act. The user stakes points on completing an action by a
// deadline. If they fail, the points are "burned" (lost).
// ============================================================

import { todayKey, addDays } from './util.js';
import { getState, setState } from './state.js';

/**
 * Create a commitment contract.
 * @param {string} actionId - The action to commit to
 * @param {string} actionName - Display name
 * @param {number} stake - Points to stake
 * @param {number} deadlineDays - Days until deadline
 * @param {string} [beneficiary] - Who gets the stake if failed ("burned" default)
 */
export function createCommitment({ actionId, actionName, stake, deadlineDays = 1, beneficiary = 'burned' }) {
  const c = {
    id: `cm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    actionId,
    actionName,
    stake,
    beneficiary,
    deadline: addDays(todayKey(), deadlineDays),
    createdAt: todayKey(),
    status: 'active',  // active | completed | failed
    resolvedAt: null,
  };
  setState((s) => {
    s.commitments.push(c);
    // Deduct stake from total points immediately (held in escrow)
    s.totalPoints = Math.max(0, (s.totalPoints || 0) - stake);
    s.version = 1 + s.totalPoints / 400;
  });
  return c;
}

/**
 * Check all active commitments and resolve them.
 * Called on app boot and after habit toggles.
 */
export function resolveCommitments() {
  const s = getState();
  const t = todayKey();
  let resolved = 0;
  setState((st) => {
    for (const c of st.commitments) {
      if (c.status !== 'active') continue;
      if (c.deadline < t) {
        // Deadline passed — check if action was completed
        let completed = false;
        for (let k = c.createdAt; k <= c.deadline; k = addDays(k, 1)) {
          const day = st.days[k];
          if (day && day.habits && (day.habits[c.actionId] === 'full' || day.habits[c.actionId] === 'floor')) {
            completed = true;
            break;
          }
        }
        if (completed) {
          c.status = 'completed';
          // Return stake + bonus (10% bonus for completing)
          const bonus = c.stake * 0.1;
          st.totalPoints += c.stake + bonus;
          st.version = 1 + st.totalPoints / 400;
        } else {
          c.status = 'failed';
          // Stake is burned (already deducted)
        }
        c.resolvedAt = t;
        resolved++;
      }
    }
  });
  return resolved;
}

/**
 * Cancel a commitment (only if active, stake is still burned).
 */
export function cancelCommitment(id) {
  setState((s) => {
    const c = s.commitments.find((x) => x.id === id);
    if (c && c.status === 'active') {
      c.status = 'cancelled';
      c.resolvedAt = todayKey();
      // Stake is NOT returned (cost of cancelling)
    }
  });
}

/**
 * Get active commitments.
 */
export function activeCommitments() {
  return (getState().commitments || []).filter((c) => c.status === 'active');
}

/**
 * Get commitment statistics.
 */
export function commitmentStats() {
  const all = getState().commitments || [];
  const active = all.filter((c) => c.status === 'active');
  const completed = all.filter((c) => c.status === 'completed');
  const failed = all.filter((c) => c.status === 'failed');
  const totalStaked = all.reduce((sum, c) => sum + c.stake, 0);
  const totalBurned = failed.reduce((sum, c) => sum + c.stake, 0);
  const successRate = (completed.length + failed.length) > 0
    ? completed.length / (completed.length + failed.length)
    : 0;
  return { total: all.length, active: active.length, completed: completed.length, failed: failed.length, totalStaked, totalBurned, successRate };
}
