// ============================================================
// Life OS v2 — Spaced Repetition (SM-2 algorithm)
// Scientific basis: Cepeda et al. (2008), Karpicke & Roediger (2007)
// SM-2: SuperMemo 2 algorithm (Piotr Wozniak)
//
// SM-2 algorithm:
//   I(1) = 1 (first interval = 1 day)
//   I(2) = 6 (second interval = 6 days)
//   I(n) = I(n-1) * EF  (for n > 2)
//   EF starts at 2.5
//   EF = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
//   Where q = quality of recall (0-5):
//     5 = perfect, 4 = correct after hesitation, 3 = correct with effort,
//     2 = incorrect but felt close, 1 = incorrect, recall felt easy,
//     0 = complete blackout
//   If q < 3: reset interval to 1 (relearn from scratch)
// ============================================================

import { todayKey, addDays } from './util.js';
import { getState, setState } from './state.js';

/**
 * Create a new spaced repetition item.
 * @param {string} question - The prompt/question
 * @param {string} answer - The answer
 * @param {string} [domainId] - Optional domain link
 * @param {string[]} [tags] - Optional tags
 */
export function addSRItem({ question, answer, domainId = null, tags = [] }) {
  const item = {
    id: `sr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    question,
    answer,
    domainId,
    tags,
    // SM-2 state
    interval: 0,       // days until next review
    repetitions: 0,    // number of successful reviews
    easeFactor: 2.5,   // EF (starts at 2.5, min 1.3)
    due: todayKey(),   // due date (YYYY-MM-DD)
    createdAt: todayKey(),
    history: [],       // [{ date, quality, interval, ef }]
  };
  setState((s) => { s.spacedRepetition.push(item); });
  return item;
}

/**
 * Review an item with a quality score (0-5).
 * Updates the SM-2 state.
 * @param {string} id - item ID
 * @param {number} quality - 0-5 (see algorithm header)
 */
export function reviewItem(id, quality) {
  const q = Math.max(0, Math.min(5, quality));
  setState((s) => {
    const item = s.spacedRepetition.find((i) => i.id === id);
    if (!item) return;

    let { interval, repetitions, easeFactor } = item;

    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);

    if (q < 3) {
      // Failed recall — reset
      repetitions = 0;
      interval = 1;
    } else {
      // Successful recall
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 6;
      else interval = Math.round(interval * easeFactor);
    }

    // Record history
    item.history.push({ date: todayKey(), quality: q, interval, ef: easeFactor });
    // Keep last 50 reviews
    if (item.history.length > 50) item.history = item.history.slice(-50);

    item.interval = interval;
    item.repetitions = repetitions;
    item.easeFactor = Math.round(easeFactor * 100) / 100;
    item.due = addDays(todayKey(), interval);
  });
}

/**
 * Get all items due for review today (or overdue).
 */
export function dueReviews() {
  const s = getState();
  const t = todayKey();
  return (s.spacedRepetition || []).filter((i) => i.due <= t);
}

/**
 * Delete an SR item.
 */
export function deleteSRItem(id) {
  setState((s) => {
    s.spacedRepetition = s.spacedRepetition.filter((i) => i.id !== id);
  });
}

/**
 * Get SR statistics.
 */
export function srStats() {
  const s = getState();
  const items = s.spacedRepetition || [];
  const due = items.filter((i) => i.due <= todayKey()).length;
  const totalReviews = items.reduce((sum, i) => sum + (i.history?.length || 0), 0);
  const avgEase = items.length ? items.reduce((sum, i) => sum + (i.easeFactor || 2.5), 0) / items.length : 2.5;
  // Retention rate: % of reviews with quality >= 3
  const allReviews = items.flatMap((i) => i.history || []);
  const successful = allReviews.filter((r) => r.quality >= 3).length;
  const retention = allReviews.length ? successful / allReviews.length : 0;
  return { total: items.length, due, totalReviews, avgEase, retention };
}
