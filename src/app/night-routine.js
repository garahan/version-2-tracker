// ============================================================
// Life OS v3 — Night Routine
// A dedicated, sequential evening checklist designed to be used
// in bed, one step at a time. Backed by sleep-hygiene science:
// dim light, no screens, no food, reflection, breathing.
//
// The routine is ordered chronologically and each step has a
// short instruction. A progress ring shows how far through the
// routine you are. Completing the final step logs the whole
// routine as done for the day.
// ============================================================

import { el, svg, svgEl } from './dom.js';
import { getState, update, updateSilent } from './state.js';
import { todayKey } from './util.js';
import { toast } from './ui.js';

// The canonical night routine, in order. Each step maps to an
// action id in domains.js so completion propagates to the main
// day plan and KPIs.
const NIGHT_STEPS = [
  { id: 'body_wind',       icon: '🌙', label: 'Wind Down',        short: 'Dim lights · no more screens',          time: '21:30' },
  { id: 'env_phone',       icon: '📵', label: 'Phone in Kitchen', short: 'Plug phone in kitchen, not bedroom',     time: '21:30' },
  { id: 'body_skincare_pm',icon: '🧴', label: 'Skincare',         short: 'Cleanse + moisturize',                   time: '21:40' },
  { id: 'body_teeth_pm',   icon: '🪥', label: 'Brush + Floss',    short: 'No food after this',                     time: '21:45' },
  { id: 'body_supp_pm',    icon: '💊', label: 'Supplements',      short: 'Magnesium glycinate + glycine',          time: '21:50' },
  { id: 'psy_note',        icon: '📝', label: 'Reflection',       short: 'One win · one lesson',                   time: '21:55' },
  { id: 'psy_gratitude',   icon: '🙏', label: 'Gratitude',        short: '3 things you are grateful for',          time: '22:00' },
  { id: 'body_stretch_pm', icon: '🧘‍♂️', label: 'Stretch',          short: '5 min gentle stretch in bed',            time: '22:05' },
  { id: 'psy_breath',      icon: '🌬️', label: 'Box Breathing',    short: '4-4-4-4 × 6 rounds · or NSDR',           time: '22:10' },
];

// ---- Get/set night routine progress for today ----
function getNightProgress(state, dateKey) {
  if (!state.days[dateKey]) state.days[dateKey] = { actions: {}, tasks: [] };
  if (!state.days[dateKey].nightRoutine) {
    state.days[dateKey].nightRoutine = { completed: [], doneAt: null };
  }
  return state.days[dateKey].nightRoutine;
}

function isStepDone(state, dateKey, stepId) {
  const nr = getNightProgress(state, dateKey);
  return nr.completed.includes(stepId);
}

function toggleStep(state, dateKey, stepId) {
  const nr = getNightProgress(state, dateKey);
  const idx = nr.completed.indexOf(stepId);
  if (idx >= 0) {
    nr.completed.splice(idx, 1);
  } else {
    nr.completed.push(stepId);
  }
  // Also mark the underlying action as done in the day plan
  const actionState = nr.completed.includes(stepId) ? 'full' : null;
  if (actionState) {
    state.days[dateKey].actions[stepId] = actionState;
    // Record completion time for personalization
    if (!state.days[dateKey].actionTimes) state.days[dateKey].actionTimes = {};
    const now = new Date();
    state.days[dateKey].actionTimes[stepId] = now.getHours() + now.getMinutes() / 60;
  } else {
    // Un-completing: only clear if no other source set it
    delete state.days[dateKey].actions[stepId];
  }
  // If all steps done, mark the whole routine complete
  if (nr.completed.length === NIGHT_STEPS.length) {
    nr.doneAt = Date.now();
  } else {
    nr.doneAt = null;
  }
}

// ---- Progress ring SVG ----
function progressRing(done, total, size = 64, stroke = 5) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = total > 0 ? done / total : 0;
  const offset = circ * (1 - pct);
  const color = pct === 1 ? 'var(--c-healthy)' : 'var(--c-accent-text)';
  return svg(`0 0 ${size} ${size}`, { width: size, height: size, class: 'night-ring' }, [
    svgEl('circle', {
      cx: size / 2, cy: size / 2, r: radius,
      fill: 'none', stroke: 'var(--c-border)', 'stroke-width': stroke,
    }),
    svgEl('circle', {
      cx: size / 2, cy: size / 2, r: radius,
      fill: 'none', stroke: color, 'stroke-width': stroke,
      'stroke-linecap': 'round',
      'stroke-dasharray': circ,
      'stroke-dashoffset': offset,
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
      style: 'transition: stroke-dashoffset 0.4s ease, stroke 0.3s ease',
    }),
    svgEl('text', {
      x: size / 2, y: size / 2 + 5,
      'text-anchor': 'middle',
      fill: color,
      'font-size': 16,
      'font-weight': 'bold',
    }, [`${done}/${total}`]),
  ]);
}

// ---- Full-screen night routine mode (used in bed) ----
let _nightOpen = false;

export function enterNightRoutine() {
  _nightOpen = true;
  renderNightFull();
}

function exitNightRoutine() {
  _nightOpen = false;
  const host = document.getElementById('night-host');
  if (host) host.remove();
  // Re-render the main app
  window.__lifeosRerender && window.__lifeosRerender();
}

function renderNightFull() {
  let host = document.getElementById('night-host');
  if (!host) {
    host = el('div', { id: 'night-host', class: 'night-host' }, []);
    document.body.appendChild(host);
  }
  const s = getState();
  const t = todayKey();
  const nr = getNightProgress(s, t);
  const done = nr.completed.length;
  const total = NIGHT_STEPS.length;
  const allDone = done === total;

  // Find the next undone step
  const nextStep = NIGHT_STEPS.find(step => !nr.completed.includes(step.id));

  host.replaceChildren(el('div', { class: 'night-full' }, [
    // Top bar
    el('div', { class: 'night-top-bar' }, [
      el('button', {
        class: 'focus-mode-close',
        on: { click: exitNightRoutine }
      }, ['✕']),
      el('div', { class: 'night-top-bar-title' }, ['🌙 Night Routine']),
      el('div', { class: 'night-top-bar-progress' }, [`${done}/${total}`]),
    ]),

    // Progress ring
    el('div', { class: 'night-ring-wrap' }, [
      progressRing(done, total, 120, 8),
      allDone && el('div', { class: 'night-complete-label' }, ['All done. Sleep well 🌙']),
    ]),

    // Steps list
    el('div', { class: 'night-steps' }, NIGHT_STEPS.map((step, i) => {
      const isDone = nr.completed.includes(step.id);
      const isNext = !isDone && step.id === nextStep?.id;
      return el('div', {
        class: `night-step ${isDone ? 'night-step--done' : ''} ${isNext ? 'night-step--next' : ''}`,
        on: { click: () => {
          update(st => toggleStep(st, t, step.id));
          renderNightFull();
          if (!isDone) {
            toast(`${step.label} ✓`, { icon: step.icon, duration: 1500 });
          }
        } }
      }, [
        el('div', { class: 'night-step-check' }, [isDone ? '✓' : step.icon]),
        el('div', { class: 'night-step-body' }, [
          el('div', { class: 'night-step-label' }, [step.label]),
          el('div', { class: 'night-step-short' }, [step.short]),
        ]),
        el('div', { class: 'night-step-time' }, [step.time]),
      ]);
    })),

    // Complete button
    !allDone && el('button', {
      class: 'btn btn--ghost btn--block',
      style: { marginTop: 'var(--sp-4)' },
      on: { click: () => {
        update(st => {
          const nr = getNightProgress(st, t);
          nr.completed = NIGHT_STEPS.map(s => s.id);
          nr.doneAt = Date.now();
          // Mark all underlying actions
          for (const step of NIGHT_STEPS) {
            st.days[t].actions[step.id] = 'full';
            if (!st.days[t].actionTimes) st.days[t].actionTimes = {};
            const now = new Date();
            st.days[t].actionTimes[step.id] = now.getHours() + now.getMinutes() / 60;
          }
        });
        renderNightFull();
        toast('Night routine complete 🌙', { icon: '🌙' });
      } }
    }, ['Mark all done']),

    allDone && el('button', {
      class: 'btn btn--primary btn--block',
      style: { marginTop: 'var(--sp-4)', background: 'var(--c-gradient-healthy)' },
      on: { click: exitNightRoutine }
    }, ['✓ Done — good night']),
  ]));
}

// ---- Compact card for Today page ----
export function nightRoutineSection() {
  const s = getState();
  const t = todayKey();
  const nr = getNightProgress(s, t);
  const done = nr.completed.length;
  const total = NIGHT_STEPS.length;
  const allDone = done === total;
  const pct = Math.round((done / total) * 100);

  // Find next step
  const nextStep = NIGHT_STEPS.find(step => !nr.completed.includes(step.id));

  return el('div', { class: 'card night-card', style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon', style: { background: 'var(--c-bg-elev-2)', color: 'var(--c-text-soft)' } }, ['🌙']),
      el('div', { style: { flex: 1 } }, [
        el('div', { class: 'card-title' }, ['Night Routine']),
        el('div', { class: 'card-subtitle' }, [
          allDone
            ? 'Complete · sleep well 🌙'
            : nextStep
              ? `Next: ${nextStep.icon} ${nextStep.label}`
              : `${done}/${total} done`,
        ]),
      ]),
      // Mini progress ring
      progressRing(done, total, 44, 4),
    ]),

    // Progress bar
    el('div', { class: 'night-progress-bar' }, [
      el('div', {
        class: 'night-progress-fill',
        style: { width: pct + '%', background: allDone ? 'var(--c-healthy)' : 'var(--c-accent-text)' },
      }, []),
    ]),

    // Compact step chips (show all 9 in a grid)
    el('div', { class: 'night-chips' }, NIGHT_STEPS.map(step => {
      const isDone = nr.completed.includes(step.id);
      return el('div', {
        class: `night-chip ${isDone ? 'night-chip--done' : ''}`,
        title: step.short,
        on: { click: () => {
          update(st => toggleStep(st, t, step.id));
          window.__lifeosRerender && window.__lifeosRerender();
          if (!isDone) toast(`${step.label} ✓`, { icon: step.icon, duration: 1200 });
        } }
      }, [
        el('span', { class: 'night-chip-icon' }, [isDone ? '✓' : step.icon]),
        el('span', { class: 'night-chip-label' }, [step.label]),
      ]);
    })),

    // Open full-screen mode button
    el('button', {
      class: 'btn btn--ghost btn--block',
      style: { marginTop: 'var(--sp-3)' },
      on: { click: enterNightRoutine }
    }, ['🌙 Start Night Routine (full screen)']),
  ]);
}

// Export step count for other modules
export const NIGHT_STEP_COUNT = NIGHT_STEPS.length;
export { NIGHT_STEPS };
