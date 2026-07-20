// ============================================================
// Life OS v2 — Temptation Bundling
// Scientific basis: Milkman, Minson & Volpp (2013)
// "Temptation bundling" — link a "want" activity to a "should"
// activity. Field experiments show 10-14% increase in exercise
// when tempting audiobooks restricted to gym use.
//
// Mechanism: combats present bias (hyperbolic discounting) by
// making "should" behaviors instantly gratifying.
// ============================================================

import { todayKey } from './util.js';
import { getState, setState } from './state.js';

/**
 * Create a temptation bundle.
 * @param {string} want - The tempting activity (podcast, show, treat)
 * @param {string} should - The productive activity (deep work, gym)
 * @param {string} [actionId] - Optional linked action ID
 */
export function addBundle({ want, should, actionId = null }) {
  const bundle = {
    id: `tb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    want,
    should,
    actionId,
    createdAt: todayKey(),
    // Track adherence: did user do "should" to access "want"?
    log: [],  // [{ date, kept: boolean }]
    active: true,
  };
  setState((s) => { s.temptationBundles.push(bundle); });
  return bundle;
}

/**
 * Log whether the bundle was kept today.
 */
export function logBundle(id, kept) {
  const t = todayKey();
  setState((s) => {
    const b = s.temptationBundles.find((x) => x.id === id);
    if (!b) return;
    // Remove today's entry if exists (replace)
    b.log = b.log.filter((l) => l.date !== t);
    b.log.push({ date: t, kept });
  });
}

/**
 * Delete a bundle.
 */
export function deleteBundle(id) {
  setState((s) => {
    s.temptationBundles = s.temptationBundles.filter((b) => b.id !== id);
  });
}

/**
 * Get adherence rate for a bundle (last 30 days).
 */
export function bundleAdherence(id) {
  const s = getState();
  const b = s.temptationBundles.find((x) => x.id === id);
  if (!b || !b.log.length) return 0;
  const recent = b.log.filter((l) => l.date >= todayKey().slice(0, 8) + '-01');
  if (!recent.length) return 0;
  return recent.filter((l) => l.kept).length / recent.length;
}

/**
 * Get all active bundles.
 */
export function activeBundles() {
  return (getState().temptationBundles || []).filter((b) => b.active);
}
