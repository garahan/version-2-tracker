// ============================================================
// Life OS v3 — Training Environment
// Full-screen workout mode. One button → instant training.
//
// Two options:
//   1. "Next Training" — alternates body parts automatically
//   2. "Goal: Upper Body" — chest, biceps, triceps, shoulders
//
// Guides set-by-set with visuals, big rest timer, progress,
// heatmap tracking, instructions. Everything auto-logged.
// ============================================================

import { el, clear, mount, $, svg, svgEl } from './dom.js';
import { toast } from './ui.js';
import { getState, updateSilent } from './state.js';
import { todayKey, daysAgoKey } from './util.js';
import { EXERCISES, MUSCLE_COLORS, exerciseVisual, getTodayLog } from './training.js';

// ---- Workout plans ----
const PLANS = {
  upper: {
    name: 'Upper Body',
    icon: '💪',
    desc: 'Chest · Biceps · Triceps · Shoulders',
    color: '#ef4444',
    exercises: ['pushup', 'curl', 'dip', 'pike', 'bench', 'ohp'],
  },
  lower: {
    name: 'Lower Body',
    icon: '�',
    desc: 'Quads · Hamstrings · Glutes',
    color: '#22c55e',
    exercises: ['squat', 'lunge', 'legpress', 'deadlift'],
  },
  pull: {
    name: 'Pull Day',
    icon: '🧗',
    desc: 'Back · Biceps',
    color: '#3b82f6',
    exercises: ['pullup', 'row', 'curl', 'row_barbell', 'deadlift'],
  },
  core: {
    name: 'Core & Cardio',
    icon: '🎯',
    desc: 'Abs · Stability · Zone 2',
    color: '#f97316',
    exercises: ['plank', 'lunge', 'squat', 'pushup'],
  },
  fullbody: {
    name: 'Full Body',
    icon: '⚡',
    desc: 'Every muscle group',
    color: '#a855f7',
    exercises: ['pushup', 'squat', 'pullup', 'plank', 'lunge', 'pike'],
  },
};

// ---- State (module-level, NOT triggering re-renders) ----
let _plan = null;
let _exIdx = 0;
let _setIdx = 0;
let _restTimer = null;
let _restRemaining = 0;
let _workoutStartTime = null;
let _loggedSets = [];

// ---- Enter training environment ----
export function enterTraining() {
  _exIdx = 0;
  _setIdx = 0;
  _restTimer = null;
  _restRemaining = 0;
  _loggedSets = [];
  _workoutStartTime = Date.now();
  renderStartScreen();
}

// ---- Start screen: two big options ----
function renderStartScreen() {
  const s = getState();
  const t = todayKey();

  // Determine which "next" training to suggest based on history
  const nextPlan = suggestNextPlan(s);

  const host = ensureHost();
  clear(host);
  mount(host, [
    el('div', { class: 'training-env' }, [
      el('button', { class: 'focus-mode-close', on: { click: exitTraining } }, ['✕']),

      el('div', { class: 'training-env-header' }, [
        el('div', { class: 'focus-mode-label' }, ['Training Mode']),
        el('div', { class: 'training-env-title' }, ['What do you want to train?']),
      ]),

      // Option 1: Next Training (auto-suggested)
      el('button', {
        class: 'training-start-card training-start-card--suggested',
        on: { click: () => startPlan(nextPlan.id) }
      }, [
        el('div', { class: 'training-start-card-top' }, [
          el('div', { class: 'training-start-card-icon', style: { color: nextPlan.color } }, [nextPlan.icon]),
          el('div', { class: 'training-start-card-body' }, [
            el('div', { class: 'training-start-card-label' }, ['NEXT TRAINING']),
            el('div', { class: 'training-start-card-name' }, [nextPlan.name]),
            el('div', { class: 'training-start-card-desc' }, [nextPlan.desc]),
          ]),
        ]),
        el('div', { class: 'training-start-card-meta' }, [
          `${nextPlan.exercises.length} exercises · ${nextPlan.exercises.reduce((sum, exId) => sum + (EXERCISES[exId]?.sets || 3), 0)} sets · ~${nextPlan.exercises.length * 5} min`,
        ]),
        el('div', { class: 'training-start-card-cta' }, ['Start now →']),
      ]),

      // Option 2: Goal Training — Upper Body
      el('button', {
        class: 'training-start-card',
        on: { click: () => startPlan('upper') }
      }, [
        el('div', { class: 'training-start-card-top' }, [
          el('div', { class: 'training-start-card-icon', style: { color: PLANS.upper.color } }, [PLANS.upper.icon]),
          el('div', { class: 'training-start-card-body' }, [
            el('div', { class: 'training-start-card-label' }, ['GOAL TRAINING']),
            el('div', { class: 'training-start-card-name' }, [PLANS.upper.name]),
            el('div', { class: 'training-start-card-desc' }, [PLANS.upper.desc]),
          ]),
        ]),
        el('div', { class: 'training-start-card-meta' }, [
          `${PLANS.upper.exercises.length} exercises · ${PLANS.upper.exercises.reduce((sum, exId) => sum + (EXERCISES[exId]?.sets || 3), 0)} sets`,
        ]),
      ]),

      // Other options (small)
      el('div', { class: 'training-start-others' }, [
        el('div', { class: 'training-start-others-label' }, ['Or pick:']),
        el('div', { class: 'training-start-others-row' }, Object.entries(PLANS)
          .filter(([id]) => id !== nextPlan.id && id !== 'upper')
          .map(([id, plan]) =>
            el('button', {
              class: 'training-start-chip',
              style: { borderColor: plan.color, color: plan.color },
              on: { click: () => startPlan(id) }
            }, [`${plan.icon} ${plan.name}`])
          )
        ),
      ]),
    ]),
  ]);
}

// ---- Suggest next plan based on training history ----
function suggestNextPlan(state) {
  // Check last 7 days of training
  const recentMuscles = new Set();
  for (let i = 0; i < 7; i++) {
    const key = daysAgoKey(i);
    const log = state.trainingLog?.[key];
    if (log) {
      for (const ex of log.exercises) {
        const def = EXERCISES[ex.id];
        if (def) recentMuscles.add(def.muscle);
      }
    }
  }

  // If rested too long (no workout in 3+ days), go full body
  let hasRecent = false;
  for (let i = 0; i < 3; i++) {
    const key = daysAgoKey(i);
    if (state.trainingLog?.[key]?.exercises?.length > 0) { hasRecent = true; break; }
  }
  if (!hasRecent) return { id: 'fullbody', ...PLANS.fullbody };

  // Alternate: if did upper recently, suggest lower; if did lower, suggest upper
  const didUpper = recentMuscles.has('Chest') || recentMuscles.has('Triceps') || recentMuscles.has('Shoulders');
  const didLower = recentMuscles.has('Legs');
  const didPull = recentMuscles.has('Back');

  if (didUpper && !didLower) return { id: 'lower', ...PLANS.lower };
  if (didLower && !didPull) return { id: 'pull', ...PLANS.pull };
  if (didPull && !didUpper) return { id: 'upper', ...PLANS.upper };
  if (didUpper && didLower && !didPull) return { id: 'pull', ...PLANS.pull };

  return { id: 'fullbody', ...PLANS.fullbody };
}

// ---- Start a plan → enter exercise view ----
function startPlan(planId) {
  _plan = { id: planId, ...PLANS[planId] };
  _exIdx = 0;
  _setIdx = 0;
  renderExercise();
}

// ---- Render current exercise with set progress ----
function renderExercise() {
  if (!_plan || _exIdx >= _plan.exercises.length) {
    renderComplete();
    return;
  }

  const exId = _plan.exercises[_exIdx];
  const def = EXERCISES[exId];
  if (!def) { _exIdx++; renderExercise(); return; }

  const muscleColor = MUSCLE_COLORS[def.muscle] || 'var(--c-accent-text)';
  const totalSets = def.sets;
  const currentSet = _setIdx + 1;
  const totalExercises = _plan.exercises.length;
  const overallProgress = ((_exIdx * totalSets + _setIdx) / (totalExercises * totalSets)) * 100;

  const host = ensureHost();
  clear(host);
  mount(host, [
    el('div', { class: 'training-env' }, [
      // Top bar: exit + plan name
      el('div', { class: 'training-top-bar' }, [
        el('button', { class: 'focus-mode-close', on: { click: exitTraining } }, ['✕']),
        el('div', { class: 'training-top-bar-title' }, [_plan.name]),
        el('div', { class: 'training-top-bar-progress' }, [`${_exIdx + 1}/${totalExercises}`]),
      ]),

      // Progress bar
      el('div', { class: 'training-progress-bar' }, [
        el('div', { class: 'training-progress-fill', style: { width: overallProgress + '%', background: _plan.color } }),
      ]),

      // Exercise visual (big)
      el('div', { class: 'training-visual-wrap', style: { color: muscleColor } }, [
        exerciseVisual(def.visual, 200, muscleColor),
      ]),

      // Exercise name + muscle
      el('div', { class: 'training-ex-name' }, [def.name]),
      el('div', { class: 'training-ex-muscle', style: { color: muscleColor } }, [
        el('span', { style: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: muscleColor, marginRight: '6px' } }, []),
        def.muscle,
      ]),

      // Instructions
      el('div', { class: 'training-instructions' }, [
        el('div', { class: 'training-instructions-icon' }, ['💡']),
        el('div', {}, [getInstructions(exId)]),
      ]),

      // Target + set progress
      el('div', { class: 'training-set-info' }, [
        el('div', { class: 'training-target' }, [
          el('span', { class: 'training-target-label' }, ['Target: ']),
          el('span', { class: 'training-target-value', style: { color: muscleColor } }, [`${def.reps}${def.isTimed ? 's' : ' reps'}`]),
        ]),
        // Set dots
        el('div', { class: 'training-set-dots' }, Array.from({ length: totalSets }, (_, i) =>
          el('div', {
            class: `training-set-dot ${i < _setIdx ? 'training-set-dot--done' : ''} ${i === _setIdx ? 'training-set-dot--current' : ''}`,
            style: i < _setIdx ? { background: muscleColor } : i === _setIdx ? { background: muscleColor, boxShadow: `0 0 12px ${muscleColor}` } : {}
          }, [])
        )),
      ]),

      // Big log set button
      el('button', {
        class: 'training-big-btn',
        style: { background: muscleColor, boxShadow: `0 4px 24px ${muscleColor}66` },
        on: { click: () => logSet(exId, def) }
      }, [
        el('div', { style: { fontSize: 'var(--fs-section)', fontWeight: 'var(--fw-bold)' } }, [`✓ Set ${currentSet} Done`]),
        el('div', { style: { fontSize: 'var(--fs-meta)', opacity: 0.8 } }, [`Tap to log ${def.reps}${def.isTimed ? 's' : ' reps'} → rest`]),
      ]),

      // Custom reps (optional)
      el('div', { class: 'training-custom-row' }, [
        el('input', {
          type: 'number',
          placeholder: 'Custom reps',
          class: 'training-input',
          id: 'training-custom-reps',
        }),
        el('input', {
          type: 'number',
          placeholder: 'kg',
          class: 'training-input',
          id: 'training-custom-weight',
        }),
        el('button', {
          class: 'btn btn--ghost btn--sm',
          on: { click: () => {
            const reps = parseInt(document.getElementById('training-custom-reps')?.value, 10);
            const weight = parseFloat(document.getElementById('training-custom-weight')?.value) || null;
            if (!reps || reps <= 0) { toast('Enter reps first'); return; }
            logSet(exId, def, reps, weight);
          } }
        }, ['Log']),
      ]),

      // Skip exercise
      el('button', {
        class: 'training-skip-btn',
        on: { click: () => { _exIdx++; _setIdx = 0; renderExercise(); } }
      }, ['Skip this exercise →']),
    ]),
  ]);
}

// ---- Log a set and start rest timer (uses updateSilent to avoid re-render) ----
function logSet(exId, def, customReps, customWeight) {
  const reps = customReps || def.reps;
  const weight = customWeight || null;
  _loggedSets.push({ exerciseId: exId, setNum: _setIdx + 1, reps, weight });

  // Save to state SILENTLY (no re-render, so training env stays open)
  updateSilent(st => {
    const t = todayKey();
    const log = getTodayLog(st, t);
    let ex = log.exercises.find(e => e.id === exId);
    if (!ex) { ex = { id: exId, sets: [], completed: false }; log.exercises.push(ex); }
    ex.sets.push({ reps, weight });
    if (!log.startTime) log.startTime = _workoutStartTime;
  });

  _setIdx++;

  // Check if exercise is done
  if (_setIdx >= def.sets) {
    // Mark exercise complete (silent)
    updateSilent(st => {
      const t = todayKey();
      const log = getTodayLog(st, t);
      const ex = log.exercises.find(e => e.id === exId);
      if (ex) ex.completed = true;
    });
    _exIdx++;
    _setIdx = 0;
    // Shorter rest between exercises
    startRestTimer(90, MUSCLE_COLORS[def.muscle], () => renderExercise());
  } else {
    // Normal rest between sets (2 minutes)
    startRestTimer(120, MUSCLE_COLORS[def.muscle], () => renderExercise());
  }
}

// ---- Rest timer (full screen, big) ----
function startRestTimer(seconds, color, onComplete) {
  if (_restTimer) clearInterval(_restTimer);
  _restRemaining = seconds;
  const circumference = 2 * Math.PI * 80;

  const host = ensureHost();
  clear(host);
  mount(host, [
    el('div', { class: 'training-env training-env--rest', style: { background: `linear-gradient(180deg, var(--c-bg), ${color}11)` } }, [
      el('button', { class: 'focus-mode-close', on: { click: () => { clearInterval(_restTimer); _restTimer = null; onComplete(); } } }, ['Skip']),

      el('div', { class: 'training-rest-label' }, ['REST TIME']),

      // Big circular timer
      svg({ viewBox: '0 0 180 180', width: 200, height: 200, style: { margin: '0 auto' } }, [
        svgEl('circle', { cx: 90, cy: 90, r: 80, fill: 'none', stroke: 'var(--c-bg-elev-3)', 'stroke-width': 10 }),
        svgEl('circle', {
          id: 'rest-ring',
          cx: 90, cy: 90, r: 80, fill: 'none',
          stroke: color || 'var(--c-foundation)',
          'stroke-width': 10,
          'stroke-linecap': 'round',
          'stroke-dasharray': circumference,
          'stroke-dashoffset': 0,
          transform: 'rotate(-90 90 90)',
          style: { transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 16px ${color})` },
        }),
      ]),

      el('div', {
        id: 'rest-time-text',
        class: 'training-rest-time',
        style: { color: color || 'var(--c-foundation)' }
      }, [fmtTime(_restRemaining)]),

      el('div', { class: 'text-mute text-meta' }, ['Next: ' + (_exIdx < _plan.exercises.length ? EXERCISES[_plan.exercises[_exIdx]]?.name : 'Done!')]),

      el('div', { class: 'training-rest-controls' }, [
        el('button', {
          class: 'btn btn--ghost btn--sm',
          on: { click: () => { _restRemaining = Math.max(0, _restRemaining - 15); updateRestDisplay(circumference, seconds); } }
        }, ['-15s']),
        el('button', {
          class: 'btn btn--ghost btn--sm',
          on: { click: () => { _restRemaining += 15; updateRestDisplay(circumference, seconds); } }
        }, ['+15s']),
        el('button', {
          class: 'btn btn--primary btn--sm',
          on: { click: () => { clearInterval(_restTimer); _restTimer = null; onComplete(); } }
        }, ['Skip →']),
      ]),
    ]),
  ]);

  function updateRestDisplay(circ, total) {
    const text = document.getElementById('rest-time-text');
    const ring = document.getElementById('rest-ring');
    if (text) text.textContent = fmtTime(_restRemaining);
    if (ring) {
      const progress = Math.max(0, _restRemaining / total);
      ring.style.strokeDashoffset = circ * (1 - progress);
    }
  }

  _restTimer = setInterval(() => {
    _restRemaining--;
    updateRestDisplay(circumference, seconds);
    if (_restRemaining <= 0) {
      clearInterval(_restTimer);
      _restTimer = null;
      // Audio cue
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch {}
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      toast('Rest over! 🔥', { icon: '⏱️' });
      onComplete();
    }
  }, 1000);
}

// ---- Workout complete ----
function renderComplete() {
  const totalSets = _loggedSets.length;
  const totalReps = _loggedSets.reduce((s, set) => s + set.reps, 0);
  const duration = Math.round((Date.now() - _workoutStartTime) / 60000);
  const musclesWorked = [...new Set(_loggedSets.map(s => EXERCISES[s.exerciseId]?.muscle).filter(Boolean))];

  // Mark workout complete (silent)
  updateSilent(st => {
    const t = todayKey();
    const log = getTodayLog(st, t);
    log.completed = true;
    log.endTime = Date.now();
  });

  // Trigger a re-render of the main app so training log updates
  setTimeout(() => { window.__lifeosRerender && window.__lifeosRerender(); }, 100);

  const host = ensureHost();
  clear(host);
  mount(host, [
    el('div', { class: 'training-env training-env--complete' }, [
      el('div', { class: 'training-complete-icon' }, ['🏆']),
      el('div', { class: 'training-complete-title' }, ['Workout Complete!']),
      el('div', { class: 'training-complete-subtitle' }, [_plan.name]),

      el('div', { class: 'training-complete-stats' }, [
        el('div', { class: 'training-stat' }, [
          el('div', { class: 'training-stat-value', style: { color: 'var(--c-accent-text)' } }, [String(totalSets)]),
          el('div', { class: 'training-stat-label' }, ['SETS']),
        ]),
        el('div', { class: 'training-stat' }, [
          el('div', { class: 'training-stat-value', style: { color: 'var(--c-healthy)' } }, [String(totalReps)]),
          el('div', { class: 'training-stat-label' }, ['REPS']),
        ]),
        el('div', { class: 'training-stat' }, [
          el('div', { class: 'training-stat-value', style: { color: 'var(--c-attention)' } }, [duration + 'm']),
          el('div', { class: 'training-stat-label' }, ['MIN']),
        ]),
      ]),

      // Muscles worked
      el('div', { class: 'training-complete-muscles' }, [
        el('div', { class: 'training-complete-muscles-label' }, ['Muscles worked:']),
        el('div', { class: 'training-complete-muscles-tags' },
          musclesWorked.map(m =>
            el('span', {
              class: 'training-muscle-tag',
              style: { background: (MUSCLE_COLORS[m] || '#999') + '22', color: MUSCLE_COLORS[m] || '#999', borderColor: (MUSCLE_COLORS[m] || '#999') + '55' }
            }, [m])
          )
        ),
      ]),

      // Heatmap (last 14 days)
      el('div', { class: 'training-complete-heatmap' }, [
        el('div', { class: 'training-complete-muscles-label' }, ['Last 14 days:']),
        renderTrainingHeatmap(),
      ]),

      el('button', {
        class: 'training-big-btn',
        style: { background: 'var(--c-gradient-healthy)', marginTop: 'var(--sp-6)' },
        on: { click: exitTraining }
      }, ['✓ Done']),
    ]),
  ]);

  if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
}

// ---- Training heatmap (last 14 days) ----
function renderTrainingHeatmap() {
  const s = getState();
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const key = daysAgoKey(i);
    const log = s.trainingLog?.[key];
    const sets = log?.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0;
    days.push({ key, sets, completed: log?.completed });
  }
  return el('div', { class: 'training-heatmap-row' }, days.map(d => {
    const intensity = d.completed ? 1 : (d.sets > 0 ? 0.5 : 0);
    return el('div', {
      class: 'training-heatmap-cell',
      style: {
        background: intensity > 0 ? `rgba(34, 197, 94, ${0.3 + intensity * 0.7})` : 'var(--c-bg-elev-2)',
        boxShadow: intensity > 0 ? `0 0 8px rgba(34, 197, 94, ${intensity * 0.4})` : 'none',
      },
      title: `${d.key}: ${d.sets} sets`,
    });
  }));
}

// ---- Exercise instructions ----
function getInstructions(exId) {
  const instructions = {
    pushup: 'Hands shoulder-width apart. Lower chest to ground. Push up keeping core tight. Don\'t sag hips.',
    squat: 'Feet shoulder-width. Lower hips back and down like sitting in a chair. Keep chest up. Drive through heels.',
    pullup: 'Grip bar shoulder-width, palms away. Pull chin above bar. Lower with control. Full hang each rep.',
    plank: 'Forearms on ground, body in straight line. Squeeze glutes and core. Don\'t let hips sag or pike up.',
    lunge: 'Step forward, lower back knee toward ground. Both knees at 90°. Keep torso upright. Push back to start.',
    dip: 'Support body on bars. Lower until shoulders below elbows. Push up. Keep elbows close to body.',
    row: 'Hang under bar, body straight. Pull chest to bar. Squeeze shoulder blades. Lower with control.',
    pike: 'Start in inverted V (pike position). Lower head toward ground between hands. Push back up. Keep legs straight.',
    curl: 'Keep elbows pinned to sides. Curl weight up slowly. Squeeze bicep at top. Lower with control.',
    deadlift: 'Feet hip-width. Grip bar. Drive through heels. Hips and chest rise together. Lock out at top. Keep back straight.',
    bench: 'Lie on bench, grip slightly wider than shoulders. Lower bar to chest. Press up explosively. Keep feet planted.',
    ohp: 'Stand tall, bar at shoulders. Press overhead until arms lock out. Don\'t lean back. Squeeze glutes.',
    row_barbell: 'Hinge at hips, bar hanging. Pull bar to lower ribs. Squeeze back muscles. Lower with control. Keep back flat.',
    legpress: 'Feet on platform shoulder-width. Lower with control. Push through heels. Don\'t lock knees at top.',
  };
  return instructions[exId] || 'Perform with good form. Control the movement. Breathe steadily.';
}

// ---- Helpers ----
function ensureHost() {
  let host = document.getElementById('training-host');
  if (!host) {
    host = el('div', { id: 'training-host' });
    document.body.appendChild(host);
  }
  return host;
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function exitTraining() {
  if (_restTimer) { clearInterval(_restTimer); _restTimer = null; }
  const host = document.getElementById('training-host');
  if (host) host.remove();
  // Re-render main app to update training log
  window.__lifeosRerender && window.__lifeosRerender();
}
