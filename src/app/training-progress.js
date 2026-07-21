// ============================================================
// Life OS v3 — Training Progress & Smart Suggestions
// Tracks per-exercise history, suggests next weight (progressive
// overload), and renders visual progress sparklines.
// ============================================================

import { svg, svgEl } from './dom.js';
import { getState } from './state.js';
import { todayKey } from './util.js';
import { EXERCISES } from './training.js';

// ---- Get chronological history for an exercise (last N sessions) ----
// Returns [{ date, sets: [{reps, weight}], maxWeight, totalVolume, est1RM }]
export function getExerciseHistory(exId, sessions = 10) {
  const s = getState();
  if (!s.trainingLog) return [];
  const keys = Object.keys(s.trainingLog).sort(); // chronological
  const out = [];
  for (const key of keys) {
    const log = s.trainingLog[key];
    const ex = log.exercises.find(e => e.id === exId);
    if (!ex || !ex.sets || ex.sets.length === 0) continue;
    const maxWeight = ex.sets.reduce((m, set) => Math.max(m, set.weight || 0), 0);
    const totalVolume = ex.sets.reduce((v, set) => v + (set.reps || 0) * (set.weight || 0), 0);
    // Epley 1RM estimate: weight * (1 + reps/30)
    const est1RM = ex.sets.reduce((m, set) => {
      const w = set.weight || 0;
      const r = set.reps || 0;
      return Math.max(m, w > 0 ? w * (1 + r / 30) : 0);
    }, 0);
    out.push({ date: key, sets: ex.sets, maxWeight, totalVolume, est1RM });
  }
  return out.slice(-sessions);
}

// ---- Smart progressive overload suggestion ----
// Algorithm:
//   1. Look at last 2 sessions of this exercise
//   2. If last session: all sets hit target reps at the top weight → add weight
//      - Upper body: +2.5 kg (barbell) or +1 kg (dumbbell)
//      - Lower body: +5 kg (barbell/quad) or +2.5 kg (isolation)
//   3. If last session: missed reps on top set → keep same weight, try to hit reps
//   4. If no history: suggest a sensible starting weight
//      - Barbell compound (bench, squat, deadlift, row, OHP): 40 kg
//      - Dumbbell: 10 kg per hand
//      - Machine/cable: 20 kg
//      - Bodyweight: null (no weight)
// Returns { weight, reps, reason, delta }
export function suggestNextWeight(exId) {
  const def = EXERCISES[exId];
  if (!def) return { weight: null, reps: 12, reason: 'Unknown exercise', delta: 0 };

  const hist = getExerciseHistory(exId, 3);
  const targetReps = def.reps;
  const targetSets = def.sets;

  // No history → starting weight heuristic
  if (hist.length === 0) {
    const start = startingWeight(exId, def);
    return {
      weight: start,
      reps: targetReps,
      reason: start ? `Starting weight for ${def.name}` : 'Bodyweight — log your reps',
      delta: 0,
    };
  }

  const last = hist[hist.length - 1];
  const prev = hist.length > 1 ? hist[hist.length - 2] : null;

  // Bodyweight exercises: no weight to suggest, but suggest reps progression
  if (last.maxWeight === 0 && !def.hasWeight) {
    const lastMaxReps = Math.max(...last.sets.map(s => s.reps || 0));
    const suggestedReps = Math.min(targetReps + 2, lastMaxReps + 2);
    return {
      weight: null,
      reps: suggestedReps,
      reason: `Last: ${last.sets.length}×${lastMaxReps} reps. Try +2 reps for progressive overload.`,
      delta: 0,
    };
  }

  // Weighted exercises: progressive overload logic
  const topSets = last.sets.filter(s => s.weight === last.maxWeight);
  const allHitReps = topSets.every(s => (s.reps || 0) >= targetReps);
  const setsCompleted = last.sets.length >= targetSets;

  if (allHitReps && setsCompleted) {
    // Success → add weight
    const increment = weightIncrement(exId, def, last.maxWeight);
    const newWeight = roundToPlate(last.maxWeight + increment);
    return {
      weight: newWeight,
      reps: targetReps,
      reason: `Last: ${last.sets.length}×${targetReps} @ ${last.maxWeight}kg ✓ — increase by ${increment}kg`,
      delta: +increment,
    };
  }

  if (allHitReps && !setsCompleted) {
    // Hit reps but not all sets → same weight, add a set
    return {
      weight: last.maxWeight,
      reps: targetReps,
      reason: `Last: ${last.sets.length}/${targetSets} sets @ ${last.maxWeight}kg — same weight, add a set`,
      delta: 0,
    };
  }

  // Missed reps → same weight, try again
  const missedReps = targetReps - Math.min(...topSets.map(s => s.reps || 0));
  return {
    weight: last.maxWeight,
    reps: targetReps,
    reason: `Last: missed ${missedReps} rep(s) @ ${last.maxWeight}kg — same weight, get all reps first`,
    delta: 0,
  };
}

// ---- Starting weight heuristic ----
function startingWeight(exId, def) {
  const bodyweight = ['pushup', 'squat', 'pullup', 'plank', 'lunge', 'dip', 'row', 'pike', 'walking_lunge', 'calf_raise'];
  if (bodyweight.includes(exId)) return null;

  // Barbell compounds
  const barbell = ['bench', 'incline_bench', 'ohp', 'deadlift', 'row_barbell', 'rdl', 'bb_shoulder_press', 'smith_chest_press', 'hack_squat'];
  if (barbell.includes(exId)) {
    if (exId === 'deadlift' || exId === 'rdl') return 60;
    if (exId === 'bench' || exId === 'incline_bench' || exId === 'smith_chest_press') return 40;
    if (exId === 'ohp' || exId === 'bb_shoulder_press') return 25;
    if (exId === 'row_barbell') return 35;
    if (exId === 'hack_squat') return 60;
    return 40;
  }

  // Dumbbell exercises
  const dumbbell = ['curl', 'hammer_curl', 'incline_db_curl', 'db_lateral_raise', 'db_shoulder_press', 'chest_supported_lateral', 'db_row', 'skull_crusher'];
  if (dumbbell.includes(exId)) {
    if (exId.includes('lateral_raise')) return 5;
    if (exId === 'db_shoulder_press') return 12;
    if (exId === 'db_row') return 14;
    if (exId === 'skull_crusher') return 10;
    return 10;
  }

  // Machine / cable
  const machine = ['legpress', 'chest_press_machine', 'machine_lateral_raise', 'chest_supported_row', 'quad_extension', 'hamstring_curl'];
  if (machine.includes(exId)) {
    if (exId === 'legpress') return 80;
    if (exId === 'chest_press_machine' || exId === 'chest_supported_row') return 25;
    if (exId === 'quad_extension' || exId === 'hamstring_curl') return 20;
    if (exId === 'machine_lateral_raise') return 10;
    return 20;
  }

  // Cable exercises
  const cable = ['cable_flye', 'rope_tricep_ext', 'lat_pulldown', 'cable_row', 'rear_delt_flye', 'high_cable_curl', 'face_pull', 'ez_tricep_ext', 'close_grip_pulldown', 'pec_dec_flye'];
  if (cable.includes(exId)) {
    if (exId === 'lat_pulldown' || exId === 'close_grip_pulldown' || exId === 'cable_row') return 25;
    if (exId === 'cable_flye' || exId === 'pec_dec_flye') return 15;
    if (exId === 'face_pull' || exId === 'rear_delt_flye') return 10;
    return 15;
  }

  return 15;
}

// ---- Weight increment based on exercise type ----
function weightIncrement(exId, def, currentWeight) {
  const barbell = ['bench', 'incline_bench', 'ohp', 'deadlift', 'row_barbell', 'rdl', 'bb_shoulder_press', 'smith_chest_press', 'hack_squat'];
  if (barbell.includes(exId)) {
    if (exId === 'deadlift' || exId === 'rdl' || exId === 'hack_squat') return 5;
    if (exId === 'bench' || exId === 'incline_bench' || exId === 'smith_chest_press') return 2.5;
    if (exId === 'ohp' || exId === 'bb_shoulder_press') return 2;
    if (exId === 'row_barbell') return 2.5;
    return 2.5;
  }
  // Dumbbell: +1 kg per hand
  const dumbbell = ['curl', 'hammer_curl', 'incline_db_curl', 'db_lateral_raise', 'db_shoulder_press', 'chest_supported_lateral', 'db_row', 'skull_crusher'];
  if (dumbbell.includes(exId)) return 1;
  // Machine/cable: +2.5 kg
  return 2.5;
}

// ---- Round to nearest plate (1.25 kg increments for barbell, 0.5 for DB) ----
function roundToPlate(w) {
  const plate = 1.25;
  return Math.round(w / plate) * plate;
}

// ---- Render a progress sparkline (SVG) ----
// Shows the last N sessions of an exercise's top weight (or volume)
export function progressSparkline(history, opts = {}) {
  const { width = 200, height = 48, metric = 'maxWeight', color = 'var(--c-accent-text)' } = opts;
  if (!history || history.length < 2) {
    return svg(`0 0 ${width} ${height}`, { width, height }, [
      svgEl('text', { x: width / 2, y: height / 2 + 4, 'text-anchor': 'middle', fill: 'var(--c-text-mute)', 'font-size': 10 }, ['Not enough data yet']),
    ]);
  }

  const values = history.map(h => h[metric] || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return [x, y];
  });

  const pathD = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const areaD = pathD + ` L${points[points.length - 1][0]},${height - pad} L${points[0][0]},${height - pad} Z`;

  // Last point dot
  const [lx, ly] = points[points.length - 1];
  const [fx, fy] = points[0];

  return svg(`0 0 ${width} ${height}`, { width, height }, [
    // Area fill
    svgEl('path', { d: areaD, fill: color, opacity: 0.12 }),
    // Line
    svgEl('path', { d: pathD, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.9 }),
    // First point (hollow)
    svgEl('circle', { cx: fx, cy: fy, r: 2.5, fill: 'var(--c-bg)', stroke: color, 'stroke-width': 1.5, opacity: 0.5 }),
    // Last point (solid, highlighted)
    svgEl('circle', { cx: lx, cy: ly, r: 3.5, fill: color }),
    svgEl('circle', { cx: lx, cy: ly, r: 6, fill: 'none', stroke: color, 'stroke-width': 1, opacity: 0.3 }),
  ]);
}

// ---- Format history summary for display ----
export function formatLastSession(exId) {
  const hist = getExerciseHistory(exId, 1);
  if (hist.length === 0) return null;
  const last = hist[0];
  const def = EXERCISES[exId];
  const date = new Date(last.date);
  const daysAgo = Math.round((Date.now() - date.getTime()) / 86400000);
  const topSet = last.sets.reduce((best, s) => {
    const vol = (s.reps || 0) * (s.weight || 1);
    const bestVol = (best.reps || 0) * (best.weight || 1);
    return vol > bestVol ? s : best;
  }, last.sets[0]);

  return {
    daysAgo,
    sets: last.sets.length,
    topWeight: last.maxWeight,
    topReps: topSet.reps,
    volume: last.totalVolume,
    est1RM: Math.round(last.est1RM),
    summary: last.sets.length + '×' + (topSet.reps || 0) + (last.maxWeight > 0 ? ' @ ' + last.maxWeight + 'kg' : ' reps'),
    whenLabel: daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : daysAgo + 'd ago',
  };
}

// ---- Get all-time PR for an exercise ----
export function getPR(exId) {
  const hist = getExerciseHistory(exId, 999);
  if (!hist.length) return null;
  let pr = { weight: 0, reps: 0, est1RM: 0, date: null };
  for (const h of hist) {
    if (h.est1RM > pr.est1RM) {
      pr = { weight: h.maxWeight, reps: Math.max(...h.sets.map(s => s.reps || 0)), est1RM: Math.round(h.est1RM), date: h.date };
    }
  }
  return pr;
}

// ---- Calculate volume trend (last 4 weeks vs previous 4 weeks) ----
export function volumeTrend(exId) {
  const hist = getExerciseHistory(exId, 20);
  if (hist.length < 2) return { trend: 'new', pct: 0 };
  const recent = hist.slice(-2);
  const older = hist.slice(-4, -2);
  const recentVol = recent.reduce((s, h) => s + h.totalVolume, 0);
  const olderVol = older.length ? older.reduce((s, h) => s + h.totalVolume, 0) : 0;
  if (olderVol === 0) return { trend: 'up', pct: 100 };
  const pct = Math.round(((recentVol - olderVol) / olderVol) * 100);
  return { trend: pct > 5 ? 'up' : pct < -5 ? 'down' : 'flat', pct };
}
