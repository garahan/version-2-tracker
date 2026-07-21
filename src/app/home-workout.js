// ============================================================
// Life OS v3 — Home Workout Quick-Add
// Bodyweight exercises you can do at home (pushups, squats,
// pullups, planks, lunges, dips). Adds them to the to-do list
// and lets you log sets/reps with one tap.
// ============================================================

import { el, svg, svgEl } from './dom.js';
import { getState, update, updateSilent } from './state.js';
import { todayKey, uid } from './util.js';
import { toast, sheet, closeAll } from './ui.js';
import { EXERCISES, MUSCLE_COLORS, exerciseVisual, getTodayLog } from './training.js';
import { suggestNextWeight, formatLastSession, getExerciseHistory, progressSparkline } from './training-progress.js';

// Bodyweight exercises available for home workouts
export const HOME_EXERCISES = [
  { id: 'pushup', label: 'Push-ups', icon: '💪' },
  { id: 'squat', label: 'Squats', icon: '🦵' },
  { id: 'pullup', label: 'Pull-ups', icon: '🧗' },
  { id: 'plank', label: 'Plank', icon: '🎯' },
  { id: 'lunge', label: 'Lunges', icon: '🚶' },
  { id: 'dip', label: 'Dips', icon: '🏋️' },
  { id: 'pike', label: 'Pike Push-ups', icon: '🤸' },
  { id: 'row', label: 'Inverted Rows', icon: '🪢' },
];

// ---- Add a home exercise to today's to-do list ----
export function addHomeExerciseToTodo(exId) {
  const def = EXERCISES[exId];
  if (!def) return;
  const t = todayKey();
  update(st => {
    if (!st.days[t]) st.days[t] = { actions: {}, tasks: [] };
    if (!st.days[t].tasks) st.days[t].tasks = [];
    st.days[t].tasks.push({
      id: uid(),
      text: `🏠 ${def.name} — ${def.sets}×${def.reps}${def.isTimed ? 's' : ''}`,
      done: false,
      carried: false,
      homeExercise: exId, // marker so we can offer one-tap logging
    });
  });
  toast(`Added ${def.name} to to-do`, { icon: '🏠' });
}

// ---- Check if a task is a home exercise and offer quick logging ----
export function isHomeExerciseTask(task) {
  return task?.homeExercise && EXERCISES[task.homeExercise];
}

// ---- Open a quick-log sheet for a home exercise from the to-do ----
export function openHomeExerciseLogger(exId, taskId) {
  const def = EXERCISES[exId];
  if (!def) return;
  const s = getState();
  const t = todayKey();
  const log = getTodayLog(s, t);
  let exercise = log.exercises.find(e => e.id === exId);
  if (!exercise) exercise = { id: exId, sets: [], completed: false };

  const muscleColor = MUSCLE_COLORS[def.muscle] || 'var(--c-accent-text)';
  const suggestion = suggestNextWeight(exId);
  const lastSession = formatLastSession(exId);
  const history = getExerciseHistory(exId, 6);

  function renderSheet() {
    const body = el('div', {}, [
      // Visual + name
      el('div', { class: 'flex items-center gap-3', style: { marginBottom: 'var(--sp-3)' } }, [
        el('div', { style: { flexShrink: 0 } }, [exerciseVisual(def.visual, 64, muscleColor)]),
        el('div', {}, [
          el('div', { style: { fontSize: 'var(--fs-section)', fontWeight: 'var(--fw-bold)' } }, [def.name]),
          el('div', { style: { color: muscleColor, fontSize: 'var(--fs-sub)' } }, [def.muscle]),
        ]),
      ]),

      // Suggestion
      el('div', {
        class: 'ex-suggestion-card',
        style: { '--ex-color': muscleColor, borderColor: muscleColor + '44', background: muscleColor + '0d' },
      }, [
        el('div', { class: 'ex-suggestion-head' }, [
          el('span', { class: 'ex-suggestion-icon' }, ['💡']),
          el('div', { class: 'ex-suggestion-body' }, [
            el('div', { class: 'ex-suggestion-label' }, ['SUGGESTED']),
            el('div', { class: 'ex-suggestion-value', style: { color: muscleColor } }, [`${suggestion.reps} reps`]),
            el('div', { class: 'ex-suggestion-reason' }, [suggestion.reason]),
          ]),
        ]),
      ]),

      // Last session
      lastSession && el('div', { class: 'ex-last-session' }, [
        el('div', { class: 'ex-last-session-item' }, [
          el('span', { class: 'ex-last-session-label' }, ['Last']),
          el('span', { class: 'ex-last-session-value' }, [lastSession.summary]),
          el('span', { class: 'ex-last-session-when' }, [lastSession.whenLabel]),
        ]),
      ]),

      // Progress sparkline
      history.length >= 2 && el('div', { class: 'ex-progress-chart' }, [
        el('div', { class: 'ex-progress-chart-label' }, ['Progress (' + history.length + ' sessions)']),
        progressSparkline(history, { width: 260, height: 48, metric: 'maxWeight', color: muscleColor }),
      ]),

      // Sets logged today
      exercise.sets.length > 0 && el('div', { class: 'list', style: { marginTop: 'var(--sp-3)' } },
        exercise.sets.map((set, i) =>
          el('div', { class: 'list-item' }, [
            el('div', { class: 'list-item-body' }, [
              el('div', { class: 'list-item-title' }, [`Set ${i + 1}: ${set.reps}${def.isTimed ? 's' : ''} reps`]),
            ]),
            el('button', {
              class: 'btn btn--ghost btn--sm',
              on: { click: () => { exercise.sets.splice(i, 1); renderSheet(); } }
            }, ['×']),
          ])
        )
      ),

      // Big log button
      el('button', {
        class: 'btn btn--primary btn--block',
        style: { marginTop: 'var(--sp-3)', background: muscleColor },
        on: { click: () => {
          const lastSet = exercise.sets[exercise.sets.length - 1];
          const reps = lastSet ? lastSet.reps : suggestion.reps;
          exercise.sets.push({ reps, weight: null });
          update(st => {
            const l = getTodayLog(st, t);
            let ex = l.exercises.find(e => e.id === exId);
            if (!ex) { ex = { id: exId, sets: [], completed: false }; l.exercises.push(ex); }
            ex.sets = exercise.sets;
            if (!l.startTime) l.startTime = Date.now();
          });
          renderSheet();
          toast(`Set logged: ${reps} reps`, { icon: '✓' });
        } }
      }, [`+ Log Set (${exercise.sets.length + 1}) · ${suggestion.reps} reps`]),

      // Custom reps
      el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-2)' } }, [
        el('input', {
          type: 'number',
          placeholder: 'Custom reps',
          style: {
            flex: 1, background: 'var(--c-bg-elev-2)', border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)', padding: 'var(--sp-2) var(--sp-3)', color: 'var(--c-text)',
            fontSize: 'var(--fs-body)',
          },
          id: 'home-custom-reps',
        }),
        el('button', {
          class: 'btn btn--ghost btn--sm',
          on: { click: () => {
            const reps = parseInt(document.getElementById('home-custom-reps')?.value, 10);
            if (!reps || reps <= 0) { toast('Enter reps'); return; }
            exercise.sets.push({ reps, weight: null });
            update(st => {
              const l = getTodayLog(st, t);
              let ex = l.exercises.find(e => e.id === exId);
              if (!ex) { ex = { id: exId, sets: [], completed: false }; l.exercises.push(ex); }
              ex.sets = exercise.sets;
              if (!l.startTime) l.startTime = Date.now();
            });
            document.getElementById('home-custom-reps').value = '';
            renderSheet();
          } }
        }, ['Log']),
      ]),

      // Complete + check off to-do
      el('button', {
        class: 'btn btn--ghost btn--block',
        style: { marginTop: 'var(--sp-3)' },
        on: { click: () => {
          update(st => {
            const l = getTodayLog(st, t);
            let ex = l.exercises.find(e => e.id === exId);
            if (!ex) { ex = { id: exId, sets: [], completed: false }; l.exercises.push(ex); }
            ex.sets = exercise.sets;
            ex.completed = true;
            // Mark the to-do task as done
            if (taskId) {
              const task = st.days[t]?.tasks?.find(x => x.id === taskId);
              if (task) task.done = true;
            }
          });
          closeAll();
          toast(`${def.name} complete! ✓`, { icon: '🏠' });
          window.__lifeosRerender && window.__lifeosRerender();
        } }
      }, ['✓ Done — check off to-do']),
    ]);
    sheet({ title: '🏠 ' + def.name, body });
  }

  renderSheet();
}

// ---- Render the Home Workout section for Today page ----
export function homeWorkoutSection() {
  const s = getState();
  const t = todayKey();
  const day = s.days[t] || { tasks: [] };
  const tasks = day.tasks || [];

  // Show home exercise tasks that are not yet done
  const homeTasks = tasks.filter(t => isHomeExerciseTask(t) && !t.done);

  return el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon', style: { background: 'var(--c-healthy-soft)', color: 'var(--c-healthy)' } }, ['🏠']),
      el('div', { style: { flex: 1 } }, [
        el('div', { class: 'card-title' }, ['Home Workout']),
        el('div', { class: 'card-subtitle' }, [
          homeTasks.length > 0
            ? `${homeTasks.length} exercise${homeTasks.length === 1 ? '' : 's'} queued`
            : 'Quick bodyweight session at home',
        ]),
      ]),
    ]),

    // Queued home exercises (from to-do)
    homeTasks.length > 0 && el('div', { class: 'list', style: { marginTop: 'var(--sp-2)' } },
      homeTasks.map(task => {
        const def = EXERCISES[task.homeExercise];
        const muscleColor = MUSCLE_COLORS[def.muscle] || 'var(--c-accent-text)';
        const last = formatLastSession(task.homeExercise);
        return el('div', { class: 'list-item', style: { alignItems: 'center' } }, [
          el('div', { style: { flexShrink: 0, marginRight: 'var(--sp-2)' } }, [exerciseVisual(def.visual, 40, muscleColor)]),
          el('div', { class: 'list-item-body', style: { flex: 1 } }, [
            el('div', { class: 'list-item-title' }, [def.name]),
            el('div', { class: 'list-item-sub' }, [
              el('span', { style: { color: muscleColor } }, [def.muscle]),
              ' · ' + def.sets + '×' + def.reps,
              last && ' · last: ' + last.summary,
            ]),
          ]),
          el('button', {
            class: 'btn btn--primary btn--sm',
            on: { click: () => openHomeExerciseLogger(task.homeExercise, task.id) }
          }, ['Log']),
        ]);
      })
    ),

    // Quick-add buttons for bodyweight exercises
    el('div', { class: 'home-workout-chips', style: { marginTop: 'var(--sp-3)' }, id: 'home-workout-chips' },
      HOME_EXERCISES.map(ex =>
        el('button', {
          class: 'home-workout-chip',
          on: { click: () => {
            addHomeExerciseToTodo(ex.id);
            window.__lifeosRerender && window.__lifeosRerender();
          } }
        }, [
          el('span', { class: 'home-workout-chip-icon' }, [ex.icon]),
          el('span', { class: 'home-workout-chip-label' }, [ex.label]),
        ])
      )
    ),
  ]);
}
