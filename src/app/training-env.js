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
import { suggestNextWeight, formatLastSession, getExerciseHistory, progressSparkline } from './training-progress.js';

// ============================================================
// 14-16 Week Hypertrophy Split (5 sessions/wk, 60 min each)
// Goal: visually big upper body (chest, biceps, shoulders, back)
// Rules: progressive overload every set · small +200-300cal surplus
// ============================================================

const SPLIT_PROGRAM = {
  name: 'Hypertrophy Split',
  goal: 'Visually big upper body — chest, biceps, shoulders, back',
  weeks: '14–16',
  sessions: '5× / week',
  duration: '60 min',
  surplus: '+200–300 cal',
  // 7-day rotation starting Monday. Days 4 & 7 are rest.
  rotation: [
    {
      id: 'push', day: 1, name: 'PUSH', icon: '💥',
      focus: 'Chest · Shoulders · Triceps',
      color: '#ef4444',
      upperBody: true,
      exercises: ['db_lateral_raise', 'incline_bench', 'db_shoulder_press', 'chest_press_machine', 'cable_flye', 'rope_tricep_ext', 'weighted_dip'],
    },
    {
      id: 'pull', day: 2, name: 'PULL', icon: '🧗',
      focus: 'Back · Rear Delts · Biceps',
      color: '#3b82f6',
      upperBody: true,
      exercises: ['chest_supported_row', 'lat_pulldown', 'cable_row', 'rear_delt_flye', 'hammer_curl', 'high_cable_curl'],
    },
    {
      id: 'lower', day: 3, name: 'LOWER', icon: '🦵',
      focus: 'Quads · Hamstrings · Glutes · Calves',
      color: '#22c55e',
      upperBody: false,
      exercises: ['quad_extension', 'hack_squat', 'rdl', 'legpress', 'hamstring_curl', 'walking_lunge', 'calf_raise'],
    },
    {
      id: 'rest1', day: 4, name: 'REST', icon: '😴',
      focus: 'Recovery · Sleep · Walk',
      color: '#64748b',
      upperBody: false,
      exercises: [],
    },
    {
      id: 'delts_arms', day: 5, name: 'DELTS + ARMS', icon: '💪',
      focus: 'Shoulders · Biceps · Triceps',
      color: '#06b6d4',
      upperBody: true,
      exercises: ['machine_lateral_raise', 'bb_shoulder_press', 'chest_supported_lateral', 'face_pull', 'ez_tricep_ext', 'incline_db_curl', 'skull_crusher'],
    },
    {
      id: 'chest_back', day: 6, name: 'CHEST + BACK', icon: '🏋️',
      focus: 'Chest · Back (upper body volume)',
      color: '#a855f7',
      upperBody: true,
      exercises: ['close_grip_pulldown', 'smith_chest_press', 'db_row', 'incline_bench', 'row_barbell', 'pec_dec_flye'],
    },
    {
      id: 'rest2', day: 7, name: 'REST', icon: '😴',
      focus: 'Recovery · Sleep · Walk',
      color: '#64748b',
      upperBody: false,
      exercises: [],
    },
  ],
};

// Pick today's split by day of week (Mon=0 ... Sun=6)
export function getTodaySplit() {
  const idx = (new Date().getDay() + 6) % 7; // Mon=0
  return SPLIT_PROGRAM.rotation[idx];
}

// Count completed sessions this week (Mon-Sun)
function sessionsThisWeek(state) {
  let n = 0;
  const today = new Date();
  const dayIdx = (today.getDay() + 6) % 7; // Mon=0
  for (let i = 0; i <= dayIdx; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (dayIdx - i));
    const key = d.toISOString().slice(0, 10);
    if (state.trainingLog?.[key]?.completed) n++;
  }
  return n;
}

// Did you already log today's prescribed split?
function didTodaySplit(state, split) {
  const t = todayKey();
  const log = state.trainingLog?.[t];
  if (!log?.exercises?.length) return false;
  const loggedIds = new Set(log.exercises.map(e => e.id));
  return split.exercises.length > 0 && split.exercises.every(id => loggedIds.has(id));
}

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

// ---- Start screen: today's prescribed split + weekly grid ----
function renderStartScreen() {
  const s = getState();
  const t = todayKey();
  const today = getTodaySplit();
  const isRestDay = today.exercises.length === 0;
  const alreadyDone = didTodaySplit(s, today);
  const weekSessions = sessionsThisWeek(s);
  const totalSets = isRestDay ? 0 : today.exercises.reduce((sum, exId) => sum + (EXERCISES[exId]?.sets || 3), 0);

  const host = ensureHost();
  clear(host);
  mount(host, [
    el('div', { class: 'training-env' }, [
      el('button', { class: 'focus-mode-close', on: { click: exitTraining } }, ['✕']),

      el('div', { class: 'training-env-header' }, [
        el('div', { class: 'focus-mode-label' }, ['Hypertrophy Split · ' + SPLIT_PROGRAM.weeks + ' wk']),
        el('div', { class: 'training-env-title' }, ['Today: Day ' + today.day + ' · ' + today.name]),
      ]),

      // Weekly progress dots
      el('div', { class: 'training-week-dots' }, SPLIT_PROGRAM.rotation.map((d, i) => {
        const isToday = d.id === today.id;
        // Check if this day was completed this week
        const todayDate = new Date();
        const dayIdx = (todayDate.getDay() + 6) % 7;
        const dayDate = new Date(todayDate);
        dayDate.setDate(todayDate.getDate() - (dayIdx - i));
        const key = dayDate.toISOString().slice(0, 10);
        const done = s.trainingLog?.[key]?.completed;
        const isPast = i < dayIdx;
        const isFuture = i > dayIdx;
        return el('div', {
          class: 'training-week-dot' + (isToday ? ' training-week-dot--today' : '') + (done ? ' training-week-dot--done' : ''),
          style: { '--dot-color': d.color, background: done ? d.color : (isToday ? d.color + '22' : 'var(--c-bg-elev-2)'), borderColor: isToday ? d.color : 'transparent' },
          title: 'Day ' + d.day + ': ' + d.name,
        }, [d.icon]);
      })),

      // Today's split card (big, prominent)
      !isRestDay && el('div', {
        class: 'training-split-card',
        style: { '--split-color': today.color, borderColor: today.color + '55', background: `linear-gradient(135deg, ${today.color}11, transparent)` },
      }, [
        el('div', { class: 'training-split-card-head' }, [
          el('div', { class: 'training-split-card-icon', style: { color: today.color } }, [today.icon]),
          el('div', { class: 'training-split-card-body' }, [
            el('div', { class: 'training-split-card-label' }, ['TODAY · DAY ' + today.day]),
            el('div', { class: 'training-split-card-name' }, [today.name]),
            el('div', { class: 'training-split-card-focus' }, [today.focus]),
          ]),
          today.upperBody && el('span', { class: 'training-upper-badge', style: { background: today.color + '22', color: today.color, borderColor: today.color + '55' } }, ['UPPER']),
        ]),

        // Exercise list with visuals (organized, scannable)
        el('div', { class: 'training-split-exercises' }, today.exercises.map((exId, i) => {
          const def = EXERCISES[exId];
          if (!def) return null;
          const muscleColor = MUSCLE_COLORS[def.muscle] || today.color;
          return el('div', { class: 'training-split-ex' }, [
            el('div', { class: 'training-split-ex-num', style: { color: today.color } }, [String(i + 1)]),
            el('div', { class: 'training-split-ex-visual', style: { color: muscleColor } }, [exerciseVisual(def.visual, 44, muscleColor)]),
            el('div', { class: 'training-split-ex-info' }, [
              el('div', { class: 'training-split-ex-name' }, [def.name]),
              el('div', { class: 'training-split-ex-meta' }, [
                el('span', { style: { color: muscleColor } }, [def.muscle]),
                ' · ' + def.sets + '×' + def.reps,
              ]),
            ]),
            el('div', { class: 'training-split-ex-sets', style: { color: today.color } }, [def.sets + '×' + def.reps]),
          ]);
        }).filter(Boolean)),

        // Stats footer
        el('div', { class: 'training-split-card-stats' }, [
          el('div', {}, [el('strong', {}, [String(today.exercises.length)]), ' exercises']),
          el('div', {}, [el('strong', {}, [String(totalSets)]), ' sets']),
          el('div', {}, [el('strong', {}, ['~60']), ' min']),
        ]),

        // Start button
        el('button', {
          class: 'training-big-btn',
          style: { background: today.color, boxShadow: `0 4px 24px ${today.color}66`, marginTop: 'var(--sp-4)' },
          on: { click: () => startSplit(today) }
        }, [
          el('div', { style: { fontSize: 'var(--fs-section)', fontWeight: 'var(--fw-bold)' } }, [alreadyDone ? '↻ Restart ' + today.name : '▶ Start ' + today.name]),
          el('div', { style: { fontSize: 'var(--fs-meta)', opacity: 0.85 } }, [alreadyDone ? 'You already did this today' : `${today.exercises.length} exercises · ~60 min · progressive overload`]),
        ]),
      ]),

      // Rest day card
      isRestDay && el('div', {
        class: 'training-split-card training-split-card--rest',
        style: { '--split-color': today.color, borderColor: today.color + '55' },
      }, [
        el('div', { class: 'training-split-card-head' }, [
          el('div', { class: 'training-split-card-icon', style: { color: today.color } }, [today.icon]),
          el('div', { class: 'training-split-card-body' }, [
            el('div', { class: 'training-split-card-label' }, ['TODAY · DAY ' + today.day]),
            el('div', { class: 'training-split-card-name' }, [today.name]),
            el('div', { class: 'training-split-card-focus' }, [today.focus]),
          ]),
        ]),
        el('div', { class: 'training-rest-tips' }, [
          el('div', {}, ['🛌 Sleep 8h — muscle grows during recovery']),
          el('div', {}, ['🚶 Walk 20-30 min — blood flow aids repair']),
          el('div', {}, ['💧 Hydrate · 🥩 Hit protein target']),
          el('div', {}, ['🧘 Mobility / stretch 10 min']),
        ]),
        el('div', { class: 'text-mute text-meta', style: { marginTop: 'var(--sp-3)' } }, ['Tomorrow: ' + SPLIT_PROGRAM.rotation[(today.day) % 7].name]),
      ]),

      // Weekly schedule grid (visual overview)
      el('div', { class: 'training-week-grid' }, [
        el('div', { class: 'training-week-grid-label' }, ['This week (' + weekSessions + '/5 sessions)']),
        el('div', { class: 'training-week-grid-row' }, SPLIT_PROGRAM.rotation.map(d => {
          const isToday = d.id === today.id;
          const todayDate = new Date();
          const dayIdx = (todayDate.getDay() + 6) % 7;
          const i = d.day - 1;
          const dayDate = new Date(todayDate);
          dayDate.setDate(todayDate.getDate() - (dayIdx - i));
          const key = dayDate.toISOString().slice(0, 10);
          const done = s.trainingLog?.[key]?.completed;
          const isPast = i < dayIdx;
          return el('div', {
            class: 'training-week-cell' + (isToday ? ' training-week-cell--today' : '') + (done ? ' training-week-cell--done' : '') + (isPast && !done && d.exercises.length ? ' training-week-cell--missed' : ''),
            style: { '--cell-color': d.color },
          }, [
            el('div', { class: 'training-week-cell-day' }, ['D' + d.day]),
            el('div', { class: 'training-week-cell-icon' }, [d.icon]),
            el('div', { class: 'training-week-cell-name', style: { color: d.exercises.length ? d.color : 'var(--c-text-mute)' } }, [d.name.replace(' + ', '+')]),
            done && el('div', { class: 'training-week-cell-check' }, ['✓']),
          ]);
        })),
      ]),

      // Program rules card
      el('div', { class: 'training-program-rules' }, [
        el('div', { class: 'training-program-rules-title' }, ['📋 Program Rules']),
        el('div', { class: 'training-program-rules-grid' }, [
          el('div', { class: 'training-rule' }, [el('span', { class: 'training-rule-icon' }, ['📅']), el('div', {}, [el('strong', {}, [SPLIT_PROGRAM.sessions]), el('div', { class: 'text-mute text-meta' }, ['sessions/wk'])])]),
          el('div', { class: 'training-rule' }, [el('span', { class: 'training-rule-icon' }, ['⏱️']), el('div', {}, [el('strong', {}, [SPLIT_PROGRAM.duration]), el('div', { class: 'text-mute text-meta' }, ['per session'])])]),
          el('div', { class: 'training-rule' }, [el('span', { class: 'training-rule-icon' }, ['🗓️']), el('div', {}, [el('strong', {}, [SPLIT_PROGRAM.weeks + ' wk']), el('div', { class: 'text-mute text-meta' }, ['commit, no changes'])])]),
          el('div', { class: 'training-rule' }, [el('span', { class: 'training-rule-icon' }, ['🍽️']), el('div', {}, [el('strong', {}, [SPLIT_PROGRAM.surplus]), el('div', { class: 'text-mute text-meta' }, ['cal surplus'])])]),
        ]),
        el('div', { class: 'training-program-rules-note' }, [
          el('span', {}, ['📈 ']),
          'Progressive overload every set — add weight or reps weekly. Log every session here to track it.',
        ]),
        el('div', { class: 'training-program-rules-note training-program-rules-note--goal' }, [
          el('span', {}, ['🎯 ']),
          'Goal: ' + SPLIT_PROGRAM.goal + '. 4 of 5 sessions target upper body.',
        ]),
      ]),

      // Manual override: pick a different split
      el('div', { class: 'training-start-others' }, [
        el('div', { class: 'training-start-others-label' }, ['Or jump to a different day:']),
        el('div', { class: 'training-start-others-row' }, SPLIT_PROGRAM.rotation
          .filter(d => d.id !== today.id && d.exercises.length > 0)
          .map(d =>
            el('button', {
              class: 'training-start-chip',
              style: { borderColor: d.color, color: d.color },
              on: { click: () => startSplit(d) }
            }, [d.icon + ' ' + d.name])
          )
        ),
      ]),
    ]),
  ]);
}

// ---- Start a split → enter exercise view ----
function startSplit(split) {
  _plan = { ...split, name: split.name };
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

  // Smart suggestion + history for this exercise
  const suggestion = suggestNextWeight(exId);
  const lastSession = formatLastSession(exId);
  const history = getExerciseHistory(exId, 6);

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

      // Smart suggestion banner (progressive overload)
      el('div', {
        class: 'training-suggestion-banner',
        style: { '--ex-color': muscleColor, borderColor: muscleColor + '44', background: muscleColor + '12' },
      }, [
        el('div', { class: 'training-suggestion-row' }, [
          el('span', { class: 'training-suggestion-icon' }, ['💡']),
          el('div', { class: 'training-suggestion-body' }, [
            el('div', { class: 'training-suggestion-label' }, ['SUGGESTED']),
            el('div', { class: 'training-suggestion-value', style: { color: muscleColor } }, [
              suggestion.weight != null
                ? `${suggestion.weight} kg × ${suggestion.reps} reps`
                : `${suggestion.reps} reps`,
            ]),
            el('div', { class: 'training-suggestion-reason' }, [suggestion.reason]),
          ]),
          suggestion.delta > 0 && el('span', { class: 'training-suggestion-delta', style: { color: 'var(--c-healthy)' } }, ['↑' + suggestion.delta + 'kg']),
        ]),
        // Last session quick info
        lastSession && el('div', { class: 'training-suggestion-last' }, [
          'Last: ' + lastSession.summary + ' (' + lastSession.whenLabel + ')',
        ]),
        // Mini progress sparkline
        history.length >= 2 && el('div', { class: 'training-suggestion-spark' }, [
          progressSparkline(history, { width: 240, height: 36, metric: 'maxWeight', color: muscleColor }),
        ]),
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

      // Big log set button (uses suggestion for first set)
      el('button', {
        class: 'training-big-btn',
        style: { background: muscleColor, boxShadow: `0 4px 24px ${muscleColor}66` },
        on: { click: () => logSet(exId, def) }
      }, [
        el('div', { style: { fontSize: 'var(--fs-section)', fontWeight: 'var(--fw-bold)' } }, [`✓ Set ${currentSet} Done`]),
        el('div', { style: { fontSize: 'var(--fs-meta)', opacity: 0.8 } }, [
          _setIdx === 0 && suggestion.weight != null
            ? `Log ${suggestion.reps} reps @ ${suggestion.weight}kg → rest`
            : `Tap to log ${def.reps}${def.isTimed ? 's' : ' reps'} → rest`,
        ]),
      ]),

      // Custom reps + weight (pre-filled with suggestion on first set)
      el('div', { class: 'training-custom-row' }, [
        el('input', {
          type: 'number',
          placeholder: 'Reps',
          class: 'training-input',
          id: 'training-custom-reps',
          value: _setIdx === 0 ? String(suggestion.reps) : '',
        }),
        el('input', {
          type: 'number',
          placeholder: 'kg',
          class: 'training-input',
          id: 'training-custom-weight',
          value: _setIdx === 0 && suggestion.weight != null ? String(suggestion.weight) : '',
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
  // First set with no custom values: use smart suggestion
  let reps, weight;
  if (customReps) {
    reps = customReps;
    weight = customWeight;
  } else if (_setIdx === 0) {
    const sug = suggestNextWeight(exId);
    reps = sug.reps;
    weight = sug.weight;
  } else {
    reps = def.reps;
    weight = null;
  }
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
