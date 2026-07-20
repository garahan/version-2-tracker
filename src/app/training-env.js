// ============================================================
// Life OS v3 — Training Environment
// Full-screen workout mode. One button to enter.
// Suggests a training plan, guides set-by-set with visuals,
// big rest timer between sets, progress tracking.
//
// Flow:
//   Enter → Pick plan (or use suggested) → Exercise 1, Set 1
//   → Log Set → Rest timer (2:00) → Set 2 → ... → Exercise 2
//   → ... → Workout complete → logs to training log
// ============================================================

import { el, clear, mount, $, svg, svgEl } from './dom.js';
import { toast } from './ui.js';
import { getState, update } from './state.js';
import { todayKey } from './util.js';
import { EXERCISES, MUSCLE_COLORS, exerciseVisual, getTodayLog } from './training.js';

// ---- Workout plan templates ----
const PLANS = {
  fullbody: {
    name: 'Full Body',
    icon: '💪',
    desc: 'Hit every muscle group',
    exercises: ['pushup', 'squat', 'pullup', 'plank', 'lunge', 'pike'],
  },
  push: {
    name: 'Push Day',
    icon: '🤾',
    desc: 'Chest, shoulders, triceps',
    exercises: ['pushup', 'pike', 'dip', 'bench', 'ohp'],
  },
  pull: {
    name: 'Pull Day',
    icon: '🧗',
    desc: 'Back and arms',
    exercises: ['pullup', 'row', 'curl', 'row_barbell', 'deadlift'],
  },
  legs: {
    name: 'Leg Day',
    icon: '🦵',
    desc: 'Quads, hamstrings, glutes',
    exercises: ['squat', 'lunge', 'legpress', 'deadlift'],
  },
  core: {
    name: 'Core & Stability',
    icon: '🎯',
    desc: 'Abs, obliques, stability',
    exercises: ['plank', 'lunge', 'squat', 'pushup'],
  },
  quick: {
    name: 'Quick Burn',
    icon: '⚡',
    desc: '10-min express workout',
    exercises: ['pushup', 'squat', 'plank', 'lunge'],
  },
};

// ---- State ----
let _plan = null;
let _exIdx = 0;
let _setIdx = 0;
let _restTimer = null;
let _restRemaining = 0;
let _workoutStartTime = null;
let _loggedSets = []; // { exerciseId, setNum, reps, weight }

// ---- Enter training environment ----
export function enterTraining() {
  _exIdx = 0;
  _setIdx = 0;
  _restTimer = null;
  _restRemaining = 0;
  _loggedSets = [];
  _workoutStartTime = Date.now();
  renderPlanPicker();
}

// ---- Pick a plan ----
function renderPlanPicker() {
  const s = getState();
  const t = todayKey();
  const log = getTodayLog(s, t);
  const doneMuscles = new Set(
    log.exercises.filter(e => e.completed).map(e => EXERCISES[e.id]?.muscle).filter(Boolean)
  );

  // Suggest a plan based on what's been worked
  let suggested = 'fullbody';
  if (doneMuscles.has('Chest') && doneMuscles.has('Legs') && doneMuscles.has('Back')) {
    suggested = 'core';
  } else if (doneMuscles.has('Chest') && !doneMuscles.has('Back')) {
    suggested = 'pull';
  } else if (doneMuscles.has('Back') && !doneMuscles.has('Chest')) {
    suggested = 'push';
  } else if (doneMuscles.has('Chest') && doneMuscles.has('Back') && !doneMuscles.has('Legs')) {
    suggested = 'legs';
  }

  const host = getHost();
  clear(host);
  mount(host, [
    el('div', { class: 'training-env' }, [
      el('button', { class: 'focus-mode-close', on: { click: exitTraining } }, ['Exit']),
      el('div', { class: 'training-env-header' }, [
        el('div', { class: 'focus-mode-label' }, ['Training Mode']),
        el('div', { class: 'training-env-title' }, ['Choose your plan']),
      ]),
      el('div', { class: 'training-plans' }, Object.entries(PLANS).map(([id, plan]) => {
        const isSuggested = id === suggested;
        const totalSets = plan.exercises.reduce((sum, exId) => sum + (EXERCISES[exId]?.sets || 3), 0);
        return el('button', {
          class: `training-plan-card ${isSuggested ? 'training-plan-card--suggested' : ''}`,
          on: { click: () => startPlan(id) }
        }, [
          el('div', { class: 'training-plan-card-icon' }, [plan.icon]),
          el('div', { class: 'training-plan-card-body' }, [
            el('div', { class: 'training-plan-card-name' }, [plan.name]),
            el('div', { class: 'training-plan-card-desc' }, [plan.desc]),
            el('div', { class: 'training-plan-card-meta' }, [
              `${plan.exercises.length} exercises · ${totalSets} sets`,
            ]),
          ]),
          isSuggested && el('div', { class: 'training-plan-card-badge' }, ['Suggested']),
        ]);
      })),
    ]),
  ]);
}

// ---- Start a plan → enter exercise view ----
function startPlan(planId) {
  _plan = PLANS[planId];
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
  const overallProgress = ((_exIdx * totalSets + _setIdx) / (_plan.exercises.length * totalSets)) * 100;

  const host = getHost();
  clear(host);
  mount(host, [
    el('div', { class: 'training-env' }, [
      el('button', { class: 'focus-mode-close', on: { click: exitTraining } }, ['Exit']),

      // Progress bar
      el('div', { class: 'training-progress-bar' }, [
        el('div', { class: 'training-progress-fill', style: { width: overallProgress + '%' } }),
      ]),
      el('div', { class: 'training-progress-text' }, [
        `Exercise ${_exIdx + 1} of ${totalExercises} · Set ${currentSet} of ${totalSets}`,
      ]),

      // Exercise visual (big)
      el('div', { class: 'training-visual-wrap', style: { color: muscleColor } }, [
        exerciseVisual(def.visual, 200, muscleColor),
      ]),

      // Exercise name + muscle
      el('div', { class: 'training-ex-name' }, [def.name]),
      el('div', { class: 'training-ex-muscle', style: { color: muscleColor } }, [def.muscle]),

      // Instructions
      el('div', { class: 'training-instructions' }, [
        getInstructions(exId),
      ]),

      // Target reps
      el('div', { class: 'training-target' }, [
        el('span', { class: 'training-target-label' }, ['Target: ']),
        el('span', { class: 'training-target-value' }, [`${def.reps}${def.isTimed ? ' seconds' : ' reps'}`]),
      ]),

      // Set dots (visual progress for this exercise)
      el('div', { class: 'training-set-dots' }, Array.from({ length: totalSets }, (_, i) =>
        el('div', { class: `training-set-dot ${i < _setIdx ? 'training-set-dot--done' : ''} ${i === _setIdx ? 'training-set-dot--current' : ''}` })
      )),

      // Big log set button
      el('button', {
        class: 'training-big-btn',
        style: { background: muscleColor },
        on: { click: () => logSet(exId, def) }
      }, [`✓ Log Set ${currentSet}`]),

      // Custom reps input
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
            logSet(exId, def, reps, weight);
          } }
        }, ['Log']),
      ]),

      // Skip exercise
      el('button', {
        class: 'training-skip-btn',
        on: { click: () => { _exIdx++; _setIdx = 0; renderExercise(); } }
      }, ['Skip exercise →']),
    ]),
  ]);
}

// ---- Log a set and start rest timer ----
function logSet(exId, def, customReps, customWeight) {
  const reps = customReps || def.reps;
  const weight = customWeight || null;
  _loggedSets.push({ exerciseId: exId, setNum: _setIdx + 1, reps, weight });

  // Save to state
  update(st => {
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
    // Mark exercise complete
    update(st => {
      const t = todayKey();
      const log = getTodayLog(st, t);
      const ex = log.exercises.find(e => e.id === exId);
      if (ex) ex.completed = true;
    });
    _exIdx++;
    _setIdx = 0;
    // Short rest between exercises
    startRestTimer(90, MUSCLE_COLORS[def.muscle], () => renderExercise());
  } else {
    // Normal rest between sets
    startRestTimer(120, MUSCLE_COLORS[def.muscle], () => renderExercise());
  }
}

// ---- Rest timer (full screen, big) ----
function startRestTimer(seconds, color, onComplete) {
  if (_restTimer) clearInterval(_restTimer);
  _restRemaining = seconds;
  const circumference = 2 * Math.PI * 80;

  const host = getHost();
  clear(host);
  mount(host, [
    el('div', { class: 'training-env training-env--rest' }, [
      el('button', { class: 'focus-mode-close', on: { click: () => { clearInterval(_restTimer); _restTimer = null; onComplete(); } } }, ['Skip']),

      el('div', { class: 'training-rest-label' }, ['Rest time']),

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
          style: { transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 12px ${color})` },
        }),
      ]),

      el('div', {
        id: 'rest-time-text',
        class: 'training-rest-time',
        style: { color: color || 'var(--c-foundation)' }
      }, [fmtTime(_restRemaining)]),

      el('div', { class: 'training-rest-controls' }, [
        el('button', {
          class: 'btn btn--ghost btn--sm',
          on: { click: () => { _restRemaining = Math.max(0, _restRemaining - 15); updateRestDisplay(circumference); } }
        }, ['-15s']),
        el('button', {
          class: 'btn btn--ghost btn--sm',
          on: { click: () => { _restRemaining += 15; updateRestDisplay(circumference); } }
        }, ['+15s']),
        el('button', {
          class: 'btn btn--primary btn--sm',
          on: { click: () => { clearInterval(_restTimer); _restTimer = null; onComplete(); } }
        }, ['Skip rest']),
      ]),
    ]),
  ]);

  function updateRestDisplay(circ) {
    const text = document.getElementById('rest-time-text');
    const ring = document.getElementById('rest-ring');
    if (text) text.textContent = fmtTime(_restRemaining);
    if (ring) {
      const progress = Math.max(0, _restRemaining / seconds);
      ring.style.strokeDashoffset = circ * (1 - progress);
    }
  }

  _restTimer = setInterval(() => {
    _restRemaining--;
    updateRestDisplay(circumference);
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
      toast('Rest over! Next set 🔥', { icon: '⏱️' });
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

  // Mark workout complete in state
  update(st => {
    const t = todayKey();
    const log = getTodayLog(st, t);
    log.completed = true;
    log.endTime = Date.now();
  });

  const host = getHost();
  clear(host);
  mount(host, [
    el('div', { class: 'training-env training-env--complete' }, [
      el('div', { class: 'training-complete-icon' }, ['🏆']),
      el('div', { class: 'training-complete-title' }, ['Workout Complete!']),
      el('div', { class: 'training-complete-stats' }, [
        el('div', { class: 'training-stat' }, [
          el('div', { class: 'training-stat-value' }, [String(totalSets)]),
          el('div', { class: 'training-stat-label' }, ['sets']),
        ]),
        el('div', { class: 'training-stat' }, [
          el('div', { class: 'training-stat-value' }, [String(totalReps)]),
          el('div', { class: 'training-stat-label' }, ['reps']),
        ]),
        el('div', { class: 'training-stat' }, [
          el('div', { class: 'training-stat-value' }, [duration + 'm']),
          el('div', { class: 'training-stat-label' }, ['duration']),
        ]),
      ]),
      el('div', { class: 'training-complete-muscles' }, [
        el('div', { class: 'training-complete-muscles-label' }, ['Muscles worked:']),
        el('div', { class: 'flex gap-1', style: { flexWrap: 'wrap', gap: 'var(--sp-1)', justifyContent: 'center', marginTop: 'var(--sp-2)' } },
          musclesWorked.map(m =>
            el('span', {
              class: 'chip',
              style: { background: MUSCLE_COLORS[m] || 'var(--c-accent-soft)', color: MUSCLE_COLORS[m] || 'var(--c-accent-text)', fontSize: '11px' }
            }, [m])
          )
        ),
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

// ---- Exercise instructions ----
function getInstructions(exId) {
  const instructions = {
    pushup: 'Hands shoulder-width. Lower chest to ground. Push up keeping core tight.',
    squat: 'Feet shoulder-width. Lower hips back and down. Keep knees behind toes. Drive up through heels.',
    pullup: 'Grip bar shoulder-width. Pull chin above bar. Lower with control. Full hang each rep.',
    plank: 'Forearms on ground. Body straight line. Squeeze glutes and core. Don\'t let hips sag.',
    lunge: 'Step forward. Lower back knee toward ground. Both knees at 90°. Push back to start.',
    dip: 'Support body on bars. Lower until shoulders below elbows. Push up. Keep elbows close.',
    row: 'Hang under bar. Body straight. Pull chest to bar. Squeeze shoulder blades together.',
    pike: 'Start in inverted V. Lower head toward ground. Push back up. Keep legs straight.',
    curl: 'Keep elbows pinned to sides. Curl weight up. Squeeze bicep. Lower with control.',
    deadlift: 'Feet hip-width. Grip bar. Drive through heels. Hips and chest rise together. Lock out.',
    bench: 'Lie on bench. Grip slightly wider than shoulders. Lower to chest. Press up explosively.',
    ohp: 'Stand tall. Bar at shoulders. Press overhead until arms lock. Don\'t lean back.',
    row_barbell: 'Hinge at hips. Bar hanging. Pull to lower ribs. Squeeze back. Lower with control.',
    legpress: 'Feet on platform shoulder-width. Lower with control. Push through heels. Don\'t lock knees.',
  };
  return instructions[exId] || 'Perform with good form. Control the movement.';
}

// ---- Helpers ----
function getHost() {
  let host = $('#training-host');
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
  const host = $('#training-host');
  if (host) host.remove();
}
