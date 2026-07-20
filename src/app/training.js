// ============================================================
// Life OS v3 — Training Log
// Workout tracking with sets/reps, 2-min rest timer with visual
// countdown, exercise visuals (SVG body diagrams), smart check-ins.
//
// Exercises have visual diagrams so you don't need to know names.
// Timer runs between sets with circular countdown + audio cue.
// Smart tracking suggests next exercise based on muscle groups.
// ============================================================

import { el, svg, svgEl } from './dom.js';
import { getState, update, updateSilent } from './state.js';
import { todayKey, fmtDate, uid } from './util.js';
import { toast, sheet, closeAll } from './ui.js';

// ---- Exercise library with visuals ----
// Each exercise has: name, muscle group, SVG visual, default sets/reps
const EXERCISES = {
  pushup: {
    name: 'Push-up',
    muscle: 'Chest',
    sets: 3, reps: 12,
    visual: 'pushup',
  },
  squat: {
    name: 'Bodyweight Squat',
    muscle: 'Legs',
    sets: 3, reps: 15,
    visual: 'squat',
  },
  pullup: {
    name: 'Pull-up',
    muscle: 'Back',
    sets: 3, reps: 8,
    visual: 'pullup',
  },
  plank: {
    name: 'Plank',
    muscle: 'Core',
    sets: 3, reps: 30, // seconds
    isTimed: true,
    visual: 'plank',
  },
  lunge: {
    name: 'Lunge',
    muscle: 'Legs',
    sets: 3, reps: 10,
    visual: 'lunge',
  },
  dip: {
    name: 'Dips',
    muscle: 'Triceps',
    sets: 3, reps: 10,
    visual: 'dip',
  },
  row: {
    name: 'Inverted Row',
    muscle: 'Back',
    sets: 3, reps: 10,
    visual: 'row',
  },
  pike: {
    name: 'Pike Push-up',
    muscle: 'Shoulders',
    sets: 3, reps: 8,
    visual: 'pike',
  },
  curl: {
    name: 'Bicep Curl',
    muscle: 'Arms',
    sets: 3, reps: 12,
    visual: 'curl',
  },
  deadlift: {
    name: 'Deadlift',
    muscle: 'Posterior Chain',
    sets: 3, reps: 8,
    visual: 'deadlift',
  },
  bench: {
    name: 'Bench Press',
    muscle: 'Chest',
    sets: 3, reps: 8,
    visual: 'bench',
  },
  ohp: {
    name: 'Overhead Press',
    muscle: 'Shoulders',
    sets: 3, reps: 8,
    visual: 'ohp',
  },
  row_barbell: {
    name: 'Barbell Row',
    muscle: 'Back',
    sets: 3, reps: 10,
    visual: 'row_barbell',
  },
  legpress: {
    name: 'Leg Press',
    muscle: 'Legs',
    sets: 3, reps: 12,
    visual: 'legpress',
  },
};

// ---- Muscle group colors ----
const MUSCLE_COLORS = {
  'Chest':           '#ef4444',
  'Legs':            '#22c55e',
  'Back':            '#3b82f6',
  'Core':            '#f97316',
  'Triceps':         '#a855f7',
  'Shoulders':       '#06b6d4',
  'Arms':            '#ec4899',
  'Posterior Chain': '#f59e0b',
};

// ---- Exercise SVG visuals (simple body diagrams) ----
const VISUALS = {
  pushup: [
    // Person doing push-up (horizontal body)
    svgEl('circle', { cx: 20, cy: 28, r: 6, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 26, y: 25, width: 40, height: 6, rx: 3, fill: 'currentColor', opacity: 0.7 }),
    svgEl('rect', { x: 26, y: 31, width: 4, height: 14, rx: 2, fill: 'currentColor', opacity: 0.5 }),
    svgEl('rect', { x: 62, y: 31, width: 4, height: 14, rx: 2, fill: 'currentColor', opacity: 0.5 }),
    // Arrow showing movement
    svgEl('path', { d: 'M40 50 v6 M37 53 l3 3 l3 -3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.4 }),
  ],
  squat: [
    // Person doing squat (bent legs)
    svgEl('circle', { cx: 40, cy: 12, r: 6, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 37, y: 18, width: 6, height: 14, rx: 2, fill: 'currentColor', opacity: 0.7 }),
    svgEl('rect', { x: 30, y: 32, width: 10, height: 6, rx: 2, fill: 'currentColor', opacity: 0.6, transform: 'rotate(20 35 35)' }),
    svgEl('rect', { x: 40, y: 32, width: 10, height: 6, rx: 2, fill: 'currentColor', opacity: 0.6, transform: 'rotate(-20 45 35)' }),
    svgEl('rect', { x: 28, y: 38, width: 8, height: 12, rx: 2, fill: 'currentColor', opacity: 0.5 }),
    svgEl('rect', { x: 44, y: 38, width: 8, height: 12, rx: 2, fill: 'currentColor', opacity: 0.5 }),
  ],
  pullup: [
    // Person hanging from bar
    svgEl('rect', { x: 10, y: 8, width: 60, height: 3, rx: 1.5, fill: 'currentColor', opacity: 0.8 }),
    svgEl('rect', { x: 30, y: 11, width: 3, height: 8, fill: 'currentColor', opacity: 0.5 }),
    svgEl('rect', { x: 47, y: 11, width: 3, height: 8, fill: 'currentColor', opacity: 0.5 }),
    svgEl('circle', { cx: 40, cy: 22, r: 5, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 37, y: 27, width: 6, height: 16, rx: 2, fill: 'currentColor', opacity: 0.7 }),
    // Arrow up
    svgEl('path', { d: 'M40 46 v-8 M37 41 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.4 }),
  ],
  plank: [
    // Person in plank position
    svgEl('circle', { cx: 15, cy: 30, r: 5, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 20, y: 27, width: 45, height: 5, rx: 2.5, fill: 'currentColor', opacity: 0.7 }),
    svgEl('rect', { x: 20, y: 32, width: 4, height: 12, rx: 2, fill: 'currentColor', opacity: 0.5 }),
    svgEl('rect', { x: 61, y: 32, width: 4, height: 12, rx: 2, fill: 'currentColor', opacity: 0.5 }),
  ],
  lunge: [
    // Person in lunge position
    svgEl('circle', { cx: 40, cy: 10, r: 5, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 37, y: 15, width: 6, height: 10, rx: 2, fill: 'currentColor', opacity: 0.7 }),
    svgEl('rect', { x: 25, y: 25, width: 12, height: 6, rx: 2, fill: 'currentColor', opacity: 0.6, transform: 'rotate(15 31 28)' }),
    svgEl('rect', { x: 43, y: 25, width: 12, height: 6, rx: 2, fill: 'currentColor', opacity: 0.6, transform: 'rotate(-15 49 28)' }),
    svgEl('rect', { x: 22, y: 32, width: 8, height: 14, rx: 2, fill: 'currentColor', opacity: 0.5 }),
    svgEl('rect', { x: 50, y: 32, width: 8, height: 14, rx: 2, fill: 'currentColor', opacity: 0.5 }),
  ],
  dip: [
    // Person on parallel bars
    svgEl('rect', { x: 15, y: 10, width: 3, height: 35, fill: 'currentColor', opacity: 0.4 }),
    svgEl('rect', { x: 62, y: 10, width: 3, height: 35, fill: 'currentColor', opacity: 0.4 }),
    svgEl('circle', { cx: 40, cy: 18, r: 5, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 37, y: 23, width: 6, height: 14, rx: 2, fill: 'currentColor', opacity: 0.7 }),
    svgEl('path', { d: 'M37 37 l-20 -5 M43 37 l20 -5', stroke: 'currentColor', 'stroke-width': 3, opacity: 0.5 }),
  ],
  row: [
    // Person doing inverted row (horizontal, pulling)
    svgEl('rect', { x: 10, y: 8, width: 60, height: 3, rx: 1.5, fill: 'currentColor', opacity: 0.6 }),
    svgEl('circle', { cx: 20, cy: 28, r: 5, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 25, y: 25, width: 35, height: 5, rx: 2.5, fill: 'currentColor', opacity: 0.7 }),
    svgEl('path', { d: 'M25 28 l-12 -18 M60 28 l12 -18', stroke: 'currentColor', 'stroke-width': 2, opacity: 0.5 }),
    // Arrow up
    svgEl('path', { d: 'M40 38 v-6 M37 35 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.4 }),
  ],
  pike: [
    // Pike push-up (inverted V)
    svgEl('circle', { cx: 45, cy: 12, r: 5, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 42, y: 17, width: 5, height: 12, rx: 2, fill: 'currentColor', opacity: 0.7, transform: 'rotate(35 44 23)' }),
    svgEl('rect', { x: 25, y: 30, width: 20, height: 5, rx: 2, fill: 'currentColor', opacity: 0.6, transform: 'rotate(-35 35 32)' }),
    svgEl('rect', { x: 18, y: 35, width: 8, height: 12, rx: 2, fill: 'currentColor', opacity: 0.5 }),
  ],
  curl: [
    // Bicep curl (arm with dumbbell)
    svgEl('circle', { cx: 20, cy: 40, r: 4, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 18, y: 20, width: 4, height: 22, rx: 2, fill: 'currentColor', opacity: 0.7 }),
    svgEl('rect', { x: 14, y: 15, width: 12, height: 4, rx: 2, fill: 'currentColor', opacity: 0.8 }),
    // Bicep bulge
    svgEl('circle', { cx: 30, cy: 28, r: 6, fill: 'currentColor', opacity: 0.5 }),
    // Arrow showing curl motion
    svgEl('path', { d: 'M35 15 a10 10 0 0 1 0 20', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.3 }),
  ],
  deadlift: [
    // Deadlift (person bending, barbell)
    svgEl('circle', { cx: 45, cy: 10, r: 5, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 42, y: 15, width: 6, height: 15, rx: 2, fill: 'currentColor', opacity: 0.7, transform: 'rotate(25 45 22)' }),
    // Barbell
    svgEl('rect', { x: 10, y: 42, width: 60, height: 3, rx: 1.5, fill: 'currentColor', opacity: 0.8 }),
    svgEl('circle', { cx: 12, cy: 43, r: 5, fill: 'currentColor', opacity: 0.6 }),
    svgEl('circle', { cx: 68, cy: 43, r: 5, fill: 'currentColor', opacity: 0.6 }),
    // Arms
    svgEl('path', { d: 'M42 20 l-25 22 M48 20 l25 22', stroke: 'currentColor', 'stroke-width': 2, opacity: 0.5 }),
  ],
  bench: [
    // Bench press (lying, barbell above)
    svgEl('circle', { cx: 35, cy: 35, r: 5, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 32, y: 38, width: 30, height: 4, rx: 2, fill: 'currentColor', opacity: 0.6 }),
    // Barbell
    svgEl('rect', { x: 10, y: 20, width: 60, height: 3, rx: 1.5, fill: 'currentColor', opacity: 0.8 }),
    svgEl('circle', { cx: 12, cy: 21, r: 5, fill: 'currentColor', opacity: 0.6 }),
    svgEl('circle', { cx: 68, cy: 21, r: 5, fill: 'currentColor', opacity: 0.6 }),
    // Arms reaching up
    svgEl('path', { d: 'M35 35 v-12 M50 35 v-12', stroke: 'currentColor', 'stroke-width': 2, opacity: 0.5 }),
  ],
  ohp: [
    // Overhead press (pressing barbell up)
    svgEl('circle', { cx: 40, cy: 30, r: 5, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 37, y: 35, width: 6, height: 15, rx: 2, fill: 'currentColor', opacity: 0.7 }),
    // Barbell overhead
    svgEl('rect', { x: 10, y: 8, width: 60, height: 3, rx: 1.5, fill: 'currentColor', opacity: 0.8 }),
    svgEl('circle', { cx: 12, cy: 9, r: 5, fill: 'currentColor', opacity: 0.6 }),
    svgEl('circle', { cx: 68, cy: 9, r: 5, fill: 'currentColor', opacity: 0.6 }),
    // Arms
    svgEl('path', { d: 'M40 30 l-15 -18 M40 30 l15 -18', stroke: 'currentColor', 'stroke-width': 2, opacity: 0.5 }),
  ],
  row_barbell: [
    // Barbell row (bent over, pulling bar)
    svgEl('circle', { cx: 50, cy: 12, r: 5, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 47, y: 17, width: 5, height: 15, rx: 2, fill: 'currentColor', opacity: 0.7, transform: 'rotate(20 50 24)' }),
    // Barbell
    svgEl('rect', { x: 10, y: 40, width: 60, height: 3, rx: 1.5, fill: 'currentColor', opacity: 0.8 }),
    svgEl('circle', { cx: 12, cy: 41, r: 5, fill: 'currentColor', opacity: 0.6 }),
    svgEl('circle', { cx: 68, cy: 41, r: 5, fill: 'currentColor', opacity: 0.6 }),
    // Arms pulling
    svgEl('path', { d: 'M47 22 l-15 18 M52 22 l15 18', stroke: 'currentColor', 'stroke-width': 2, opacity: 0.5 }),
  ],
  legpress: [
    // Leg press (seated, pushing platform)
    svgEl('circle', { cx: 15, cy: 15, r: 5, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 12, y: 20, width: 6, height: 12, rx: 2, fill: 'currentColor', opacity: 0.7 }),
    // Legs extended
    svgEl('rect', { x: 18, y: 25, width: 25, height: 5, rx: 2, fill: 'currentColor', opacity: 0.6 }),
    // Platform
    svgEl('rect', { x: 55, y: 15, width: 5, height: 25, rx: 2, fill: 'currentColor', opacity: 0.8 }),
    // Arrow
    svgEl('path', { d: 'M48 27 l8 0 M53 24 l3 3 l-3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.4 }),
  ],
};

// ---- Render exercise visual ----
function exerciseVisual(visualKey, size = 48, color = 'var(--c-accent-text)') {
  const elements = VISUALS[visualKey] || VISUALS.pushup;
  return svg({ viewBox: '0 0 80 50', width: size, height: size * 0.625, style: { color } }, elements);
}

// ---- Get today's training log ----
function getTodayLog(state, dateKey) {
  if (!state.trainingLog) state.trainingLog = {};
  if (!state.trainingLog[dateKey]) {
    state.trainingLog[dateKey] = { exercises: [], completed: false, startTime: null };
  }
  return state.trainingLog[dateKey];
}

// ---- Smart suggestion: which exercise to do next ----
function suggestNextExercise(log) {
  const doneMuscles = new Set(log.exercises.filter(e => e.completed).map(e => EXERCISES[e.id]?.muscle).filter(Boolean));
  // Find an exercise targeting a muscle group not yet worked
  const candidates = Object.entries(EXERCISES).filter(([id, ex]) => !doneMuscles.has(ex.muscle));
  if (candidates.length === 0) return null;
  // Prefer compound movements (Chest, Back, Legs) first
  const priority = ['Chest', 'Back', 'Legs', 'Posterior Chain', 'Shoulders', 'Core', 'Triceps', 'Arms'];
  for (const muscle of priority) {
    const found = candidates.find(([_, ex]) => ex.muscle === muscle);
    if (found) return { id: found[0], ...found[1] };
  }
  return { id: candidates[0][0], ...candidates[0][1] };
}

// ---- Main training log section for Today ----
export function trainingLogSection(s, t) {
  const log = getTodayLog(s, t);
  const completedExercises = log.exercises.filter(e => e.completed);
  const totalSets = completedExercises.reduce((sum, e) => sum + (e.sets?.length || 0), 0);
  const totalReps = completedExercises.reduce((sum, e) =>
    sum + (e.sets?.reduce((ss, set) => ss + (set.reps || 0), 0) || 0), 0);
  const suggestion = suggestNextExercise(log);

  return el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon', style: { background: 'var(--c-foundation-soft)', color: 'var(--c-foundation)' } }, ['🏋️']),
      el('div', {}, [
        el('div', { class: 'card-title' }, ['Training Log']),
        el('div', { class: 'card-subtitle' }, [
          completedExercises.length > 0
            ? `${completedExercises.length} exercises · ${totalSets} sets · ${totalReps} reps`
            : 'Start your workout',
        ]),
      ]),
      el('button', {
        class: 'btn btn--ghost btn--sm',
        on: { click: () => openTrainingSheet(t) }
      }, ['+ Add']),
    ]),

    // Completed exercises with visuals
    completedExercises.length > 0 && el('div', { class: 'list', style: { marginTop: 'var(--sp-2)' } },
      completedExercises.map(ex => {
        const def = EXERCISES[ex.id];
        if (!def) return null;
        const muscleColor = MUSCLE_COLORS[def.muscle] || 'var(--c-accent-text)';
        return el('div', { class: 'list-item', style: { alignItems: 'flex-start' } }, [
          // Visual
          el('div', { style: { flexShrink: 0, marginRight: 'var(--sp-3)' } }, [
            exerciseVisual(def.visual, 56, muscleColor),
          ]),
          el('div', { class: 'list-item-body', style: { flex: 1 } }, [
            el('div', { class: 'list-item-title' }, [def.name]),
            el('div', { class: 'list-item-sub' }, [
              el('span', { style: { color: muscleColor } }, [def.muscle]),
              ` · ${ex.sets?.length || 0} sets`,
            ]),
            // Set badges
            ex.sets && ex.sets.length > 0 && el('div', { class: 'flex gap-1', style: { marginTop: 'var(--sp-1)', flexWrap: 'wrap', gap: 'var(--sp-1)' } },
              ex.sets.map((set, i) =>
                el('span', {
                  class: 'chip chip--healthy',
                  style: { fontSize: '10px', height: '18px', padding: '0 6px' }
                }, [`S${i + 1}: ${set.reps}${def.isTimed ? 's' : ''}`])
              )
            ),
          ]),
          el('span', { class: 'chip chip--healthy' }, ['✓']),
        ]);
      }).filter(Boolean)
    ),

    // Smart suggestion
    suggestion && completedExercises.length > 0 && el('div', {
      style: {
        marginTop: 'var(--sp-3)',
        padding: 'var(--sp-3)',
        background: 'var(--c-foundation-soft)',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--c-foundation-border)',
      }
    }, [
      el('div', { class: 'flex items-center gap-2' }, [
        el('span', { style: { fontSize: 'var(--fs-meta)' } }, ['💡']),
        el('div', { style: { flex: 1, fontSize: 'var(--fs-sub)' } }, [
          'Next: ',
          el('span', { style: { fontWeight: 'var(--fw-semibold)' } }, [suggestion.name]),
          ` (${suggestion.muscle})`,
        ]),
        el('button', {
          class: 'btn btn--ghost btn--sm',
          on: { click: () => openExerciseSheet(suggestion.id, t) }
        }, ['Add']),
      ]),
    ]),

    // Empty state
    completedExercises.length === 0 && el('div', { class: 'empty', style: { padding: 'var(--sp-4)' } }, [
      el('div', { style: { fontSize: '32px', marginBottom: 'var(--sp-2)' } }, ['🏋️']),
      el('div', { class: 'empty-title' }, ['No workout logged today']),
      el('div', { class: 'empty-body', style: { marginTop: 'var(--sp-1)' } }, [
        'Tap + Add to start tracking sets, reps, and rest timers.',
      ]),
      suggestion && el('button', {
        class: 'btn btn--primary btn--sm',
        style: { marginTop: 'var(--sp-3)' },
        on: { click: () => openExerciseSheet(suggestion.id, t) }
      }, [`Start with ${suggestion.name}`]),
    ]),

    // Check-in button
    el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-3)' } }, [
      el('button', {
        class: `btn ${log.completed ? 'btn--ghost' : 'btn--primary'} btn--sm btn--block`,
        on: { click: () => {
          update(st => {
            const l = getTodayLog(st, t);
            l.completed = !l.completed;
            if (l.completed) {
              l.endTime = Date.now();
              toast('Workout complete! 💪', { icon: '🏋️' });
            }
          });
        } }
      }, [log.completed ? '✓ Workout done' : 'Mark workout complete']),
    ]),
  ]);
}

// ---- Training sheet (exercise picker) ----
function openTrainingSheet(dateKey) {
  const muscleGroups = [...new Set(Object.values(EXERCISES).map(e => e.muscle))];
  const body = el('div', {}, [
    el('div', { class: 'text-mute text-meta', style: { marginBottom: 'var(--sp-3)' } }, ['Pick an exercise']),
    ...muscleGroups.map(muscle => {
      const exercises = Object.entries(EXERCISES).filter(([_, ex]) => ex.muscle === muscle);
      const color = MUSCLE_COLORS[muscle] || 'var(--c-accent-text)';
      return el('div', { style: { marginBottom: 'var(--sp-4)' } }, [
        el('div', {
          class: 'overline',
          style: { color, marginBottom: 'var(--sp-2)' }
        }, [muscle]),
        el('div', { class: 'list' }, exercises.map(([id, ex]) =>
          el('div', {
            class: 'list-item',
            on: { click: () => { closeAll(); setTimeout(() => openExerciseSheet(id, dateKey), 300); } }
          }, [
            el('div', { style: { flexShrink: 0, marginRight: 'var(--sp-3)' } }, [
              exerciseVisual(ex.visual, 48, color),
            ]),
            el('div', { class: 'list-item-body' }, [
              el('div', { class: 'list-item-title' }, [ex.name]),
              el('div', { class: 'list-item-sub' }, [`${ex.sets} × ${ex.reps}${ex.isTimed ? 's' : ''}`]),
            ]),
            el('span', { class: 'text-mute' }, ['›']),
          ])
        )),
      ]);
    }),
  ]);
  sheet({ title: 'Add Exercise', body });
}

// ---- Exercise sheet (log sets + rest timer) ----
let restTimerInterval = null;

function openExerciseSheet(exerciseId, dateKey) {
  const def = EXERCISES[exerciseId];
  if (!def) return;
  const s = getState();
  const log = getTodayLog(s, dateKey);
  let exercise = log.exercises.find(e => e.id === exerciseId);
  if (!exercise) {
    exercise = { id: exerciseId, sets: [], completed: false };
  }

  const muscleColor = MUSCLE_COLORS[def.muscle] || 'var(--c-accent-text)';

  function renderSheet() {
    const body = el('div', {}, [
      // Visual + name
      el('div', { class: 'flex items-center gap-3', style: { marginBottom: 'var(--sp-4)' } }, [
        el('div', { style: { flexShrink: 0 } }, [exerciseVisual(def.visual, 80, muscleColor)]),
        el('div', {}, [
          el('div', { style: { fontSize: 'var(--fs-section)', fontWeight: 'var(--fw-bold)' } }, [def.name]),
          el('div', { style: { color: muscleColor, fontSize: 'var(--fs-sub)' } }, [def.muscle]),
          el('div', { class: 'text-mute text-meta' }, [`Target: ${def.sets} × ${def.reps}${def.isTimed ? 's' : ''}`]),
        ]),
      ]),

      // Sets log
      el('div', { class: 'section-head', style: { marginTop: 'var(--sp-2)' } }, [
        el('div', { class: 'section-title' }, [`Sets (${exercise.sets.length})`]),
      ]),
      exercise.sets.length > 0 && el('div', { class: 'list' }, exercise.sets.map((set, i) =>
        el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [`Set ${i + 1}: ${set.reps}${def.isTimed ? 's' : ''} reps`]),
            el('div', { class: 'list-item-sub' }, [set.weight ? `${set.weight} kg` : 'Bodyweight']),
          ]),
          el('button', {
            class: 'btn btn--ghost btn--sm',
            on: { click: () => { exercise.sets.splice(i, 1); renderSheet(); } }
          }, ['×']),
        ])
      )),

      // Add set button
      el('button', {
        class: 'btn btn--primary btn--block',
        style: { marginTop: 'var(--sp-3)' },
        on: { click: () => {
          const lastSet = exercise.sets[exercise.sets.length - 1];
          const reps = lastSet ? lastSet.reps : def.reps;
          const weight = lastSet ? lastSet.weight : null;
          exercise.sets.push({ reps, weight });
          // Save to state
          update(st => {
            const l = getTodayLog(st, dateKey);
            let ex = l.exercises.find(e => e.id === exerciseId);
            if (!ex) { ex = { id: exerciseId, sets: [], completed: false }; l.exercises.push(ex); }
            ex.sets = exercise.sets;
            if (!l.startTime) l.startTime = Date.now();
          });
          renderSheet();
          // Start rest timer
          startRestTimer(120, muscleColor);
        } }
      }, [`+ Log Set (${exercise.sets.length + 1})`]),

      // Custom reps input
      el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-3)' } }, [
        el('input', {
          type: 'number',
          placeholder: 'Custom reps',
          style: {
            flex: 1, background: 'var(--c-bg-elev-2)', border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)', padding: 'var(--sp-2) var(--sp-3)', color: 'var(--c-text)',
            fontSize: 'var(--fs-body)',
          },
          id: 'custom-reps-input',
        }),
        el('input', {
          type: 'number',
          placeholder: 'kg (optional)',
          style: {
            flex: 1, background: 'var(--c-bg-elev-2)', border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)', padding: 'var(--sp-2) var(--sp-3)', color: 'var(--c-text)',
            fontSize: 'var(--fs-body)',
          },
          id: 'custom-weight-input',
        }),
        el('button', {
          class: 'btn btn--ghost btn--sm',
          on: { click: () => {
            const repsInput = document.getElementById('custom-reps-input');
            const weightInput = document.getElementById('custom-weight-input');
            const reps = parseInt(repsInput?.value, 10);
            const weight = weightInput?.value ? parseFloat(weightInput.value) : null;
            if (!reps || reps <= 0) { toast('Enter reps first'); return; }
            exercise.sets.push({ reps, weight });
            update(st => {
              const l = getTodayLog(st, dateKey);
              let ex = l.exercises.find(e => e.id === exerciseId);
              if (!ex) { ex = { id: exerciseId, sets: [], completed: false }; l.exercises.push(ex); }
              ex.sets = exercise.sets;
              if (!l.startTime) l.startTime = Date.now();
            });
            if (repsInput) repsInput.value = '';
            if (weightInput) weightInput.value = '';
            renderSheet();
            startRestTimer(120, muscleColor);
          } }
        }, ['Log']),
      ]),

      // Mark exercise complete
      exercise.sets.length > 0 && el('button', {
        class: 'btn btn--ghost btn--block',
        style: { marginTop: 'var(--sp-3)' },
        on: { click: () => {
          exercise.completed = true;
          update(st => {
            const l = getTodayLog(st, dateKey);
            let ex = l.exercises.find(e => e.id === exerciseId);
            if (!ex) { ex = { id: exerciseId, sets: [], completed: false }; l.exercises.push(ex); }
            ex.sets = exercise.sets;
            ex.completed = true;
          });
          closeAll();
          toast(`${def.name} complete! ✓`, { icon: '🏋️' });
        } }
      }, ['✓ Exercise done']),
    ]);
    sheet({ title: def.name, body });
  }

  renderSheet();
}

// ---- Rest timer (2 minutes with visual countdown) ----
function startRestTimer(seconds, color) {
  if (restTimerInterval) clearInterval(restTimerInterval);
  let remaining = seconds;

  const timerBody = el('div', { style: { textAlign: 'center', padding: 'var(--sp-4)' } }, [
    // Circular countdown
    svg({ viewBox: '0 0 120 120', width: 120, height: 120, style: { margin: '0 auto' } }, [
      svgEl('circle', { cx: 60, cy: 60, r: 54, fill: 'none', stroke: 'var(--c-bg-elev-3)', 'stroke-width': 8 }),
      svgEl('circle', {
        id: 'rest-timer-ring',
        cx: 60, cy: 60, r: 54, fill: 'none',
        stroke: color || 'var(--c-foundation)',
        'stroke-width': 8,
        'stroke-linecap': 'round',
        'stroke-dasharray': 2 * Math.PI * 54,
        'stroke-dashoffset': 0,
        transform: 'rotate(-90 60 60)',
        style: { transition: 'stroke-dashoffset 1s linear' },
      }),
    ]),
    el('div', {
      id: 'rest-timer-text',
      style: {
        fontSize: 'var(--fs-display)', fontWeight: 'var(--fw-bold)',
        fontVariantNumeric: 'tabular-nums', marginTop: 'var(--sp-3)',
        color: color || 'var(--c-foundation)',
      }
    }, [formatTime(remaining)]),
    el('div', { class: 'text-mute text-meta', style: { marginTop: 'var(--sp-1)' } }, ['Rest time']),
    el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-4)' } }, [
      el('button', {
        class: 'btn btn--ghost btn--sm',
        on: { click: () => { remaining = Math.max(0, remaining - 15); updateTimerDisplay(); } }
      }, ['-15s']),
      el('button', {
        class: 'btn btn--ghost btn--sm',
        on: { click: () => { remaining += 15; updateTimerDisplay(); } }
      }, ['+15s']),
      el('button', {
        class: 'btn btn--primary btn--sm',
        on: { click: () => { clearInterval(restTimerInterval); restTimerInterval = null; closeAll(); } }
      }, ['Skip']),
    ]),
  ]);

  sheet({ title: 'Rest', body });

  function updateTimerDisplay() {
    const text = document.getElementById('rest-timer-text');
    const ring = document.getElementById('rest-timer-ring');
    if (text) text.textContent = formatTime(remaining);
    if (ring) {
      const progress = remaining / seconds;
      const circumference = 2 * Math.PI * 54;
      ring.style.strokeDashoffset = circumference * (1 - progress);
    }
  }

  restTimerInterval = setInterval(() => {
    remaining--;
    updateTimerDisplay();
    if (remaining <= 0) {
      clearInterval(restTimerInterval);
      restTimerInterval = null;
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
      // Vibrate
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      closeAll();
      toast('Rest over! Next set 🔥', { icon: '⏱️' });
    }
  }, 1000);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ---- Get training stats for analytics ----
export function trainingStats(state, days = 30) {
  let totalWorkouts = 0;
  let totalSets = 0;
  let totalReps = 0;
  let totalMinutes = 0;
  const muscleGroups = {};

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const log = state.trainingLog?.[key];
    if (log && log.exercises.length > 0) {
      if (log.completed) totalWorkouts++;
      for (const ex of log.exercises) {
        const def = EXERCISES[ex.id];
        if (!def) continue;
        totalSets += ex.sets?.length || 0;
        totalReps += ex.sets?.reduce((s, set) => s + (set.reps || 0), 0) || 0;
        muscleGroups[def.muscle] = (muscleGroups[def.muscle] || 0) + (ex.sets?.length || 0);
      }
      if (log.startTime && log.endTime) {
        totalMinutes += Math.round((log.endTime - log.startTime) / 60000);
      }
    }
  }

  return { totalWorkouts, totalSets, totalReps, totalMinutes, muscleGroups };
}
