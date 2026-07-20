// ============================================================
// Life OS v3 — Today (v3 §8)
// The entire app is centered around Today. Everything else
// supports Today.
//   Top:    Version + Date
//   Center: Large Progress Ring (Life Version + Today's Completion)
//   Top Right: Streak + Shield count
//   Command Center: 10-12 KPIs
//   Today's Actions: grouped by domain (Title, Trigger, II,
//                    Time, Floor, Complete toggle, Progress)
//   Conditional: Recall, Commitments (only if needed)
//   Reflection: Mood, One Win, One Lesson
// ============================================================

import { el, div, span, toggle, svg, svgEl } from '../dom.js';
import { getState, getDay, setDayAction, setDayField, currentStreak } from '../state.js';
import { todayKey, fmtDate, dayName, fmtNum } from '../util.js';
import { dueToday, todayProgress } from '../cadence.js';
import { toast } from '../ui.js';
import { renderHeatmap } from './heatmap.js';
import { enterFocusMode } from '../focus-mode.js';

export function renderToday() {
  const s = getState();
  const t = todayKey();
  const due = dueToday();
  const day = getDay(t);
  const prog = todayProgress(s);
  const streak = currentStreak();

  // Group by domain
  const byDomain = {};
  for (const { domain, action } of due) {
    (byDomain[domain.id] ||= { domain, items: [] }).items.push(action);
  }

  return el('div', { class: 'page' }, [
    topBar(s, t, streak),
    heroRing(s, prog),
    kpiPanel(s),
    focusButton(),
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-8)' } }, [
      el('div', { class: 'section-title' }, ['Today']),
      el('span', { class: 'text-mute text-meta' }, [`${prog.done}/${prog.due} done`]),
    ]),
    streakNudge(streak, prog),
    ...Object.values(byDomain).map(({ domain, items }) =>
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [
          el('div', { class: 'card-icon' }, [domain.icon]),
          el('div', {}, [
            el('div', { class: 'card-title' }, [domain.name]),
            el('div', { class: 'card-subtitle' }, [items.length === 1 ? '1 action' : `${items.length} actions`]),
          ]),
        ]),
        el('div', { class: 'list' }, items.map(a => actionRow(a, day, t))),
      ])
    ),
    recallSection(s, t),
    commitmentSection(s, t),
    reflectionCard(day, t),
    el('div', { style: { marginTop: 'var(--sp-6)' } }, [renderHeatmap(105)]),
  ]);
}

// ---- Top bar: version left, date right, streak/shields row ----
function topBar(s, t, streak) {
  return el('div', { style: { padding: 'var(--sp-4) 0 var(--sp-2)' } }, [
    el('div', { class: 'flex items-center justify-between' }, [
      el('div', { style: { fontSize: 'var(--fs-page)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--ls-tight)', fontVariantNumeric: 'tabular-nums' } }, ['v' + s.version.toFixed(2)]),
      el('div', { style: { textAlign: 'right' } }, [
        el('div', { style: { fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)' } }, [dayName(t)]),
        el('div', { style: { fontSize: 'var(--fs-meta)', color: 'var(--c-text-mute)' } }, [fmtDate(t)]),
      ]),
    ]),
    // Cognitive mode indicator — Glance (3s) → Operate (30s)
    el('div', { class: 'flex items-center gap-2', style: { marginTop: 'var(--sp-2)' } }, [
      el('span', { class: 'cog-mode cog-mode--glance' }, ['Glance']),
      el('span', { class: 'text-mute text-meta' }, ['→']),
      el('span', { class: 'cog-mode cog-mode--operate' }, ['Operate']),
      (streak > 0 || s.shields > 0) && el('span', { style: { marginLeft: 'auto' } }, [
        streak > 0 && el('span', { class: 'chip chip--attention' }, ['🔥 ' + streak + 'd streak']),
        s.shields > 0 && el('span', { class: 'chip chip--shield' }, ['🛡️ ' + s.shields + ' shields']),
      ]),
    ]),
  ]);
}

// ---- Hero ring: large, centered, version + completion inside ----
function heroRing(s, prog) {
  const pct = prog.pct;
  const size = 140, stroke = 10, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, Math.max(0, pct)));
  return el('div', { class: 'ring-hero' }, [
    svg(`0 0 ${size} ${size}`, { width: size, height: size, style: 'transform: rotate(-90deg)' }, [
      svgEl('circle', { cx: size/2, cy: size/2, r, fill: 'none', stroke: 'var(--c-bg-elev-3)', 'stroke-width': stroke }),
      svgEl('circle', { cx: size/2, cy: size/2, r, fill: 'none', stroke: 'var(--c-accent)', 'stroke-width': stroke, 'stroke-linecap': 'round', 'stroke-dasharray': circ, 'stroke-dashoffset': offset, style: 'transition: stroke-dashoffset var(--dur-slow) var(--ease-out)' }),
    ]),
    el('div', { class: 'ring-hero-center' }, [
      el('div', { class: 'ring-hero-version' }, [`v${s.version.toFixed(2)}`]),
      el('div', { class: 'ring-hero-progress' }, [`${prog.done}/${prog.due} done`]),
    ]),
  ]);
}

// ---- KPI panel (Command Center — v3 §8: 10-12 KPIs) ----
function kpiPanel(s) {
  const t = todayKey();
  const last = (key) => {
    const arr = s.metrics?.[key];
    if (!arr || !arr.length) return null;
    const todayEntry = arr.find(m => m.date === t);
    return todayEntry ? todayEntry.value : arr[arr.length - 1].value;
  };
  const sleep = last('sleep');
  const hrv = last('hrv');
  const steps = last('steps');
  const deepWork = s.days[t]?.deepWorkMins || 0;
  const runway = s.optionality?.runwayMonths || 0;
  const mood = s.days[t]?.mood;
  const moodEmoji = mood === 1 ? '😞' : mood === 2 ? '😕' : mood === 3 ? '😐' : mood === 4 ? '🙂' : mood === 5 ? '😄' : '—';
  const stepsStr = steps != null ? fmtNum(steps) : '—';
  const netWorth = s.northStar?.netWorth;
  const energy = s.northStar?.energy;
  const opps = s.opportunities.filter(o => o.status === 'open' || o.status === 'exploring').length;

  return el('div', { class: 'kpi-grid', style: { marginTop: 'var(--sp-6)' } }, [
    kpiCell('Energy', energy != null ? String(energy) : '—', energy != null && energy < 3 ? 'low' : null),
    kpiCell('Sleep', sleep != null ? sleep + 'h' : '—', sleep != null && sleep < 6 ? 'low' : null),
    kpiCell('HRV', hrv != null ? String(hrv) : '—', null, 'ms'),
    kpiCell('Runway', runway + 'm', runway < 6 ? 'low' : null),
    kpiCell('Deep', deepWork ? (deepWork / 60).toFixed(1) + 'h' : '—', null),
    kpiCell('Mood', moodEmoji, null),
    kpiCell('Steps', stepsStr, null),
    kpiCell('Net', netWorth != null ? fmtNum(netWorth) : '—', null),
    kpiCell('Opps', String(opps), null),
    kpiCell('Health', String(Math.round((s.version - 1) * 100)), null),
    kpiCell('System', '—', null),
    kpiCell('Sat', s.northStar?.lifeSatisfaction != null ? String(s.northStar.lifeSatisfaction) : '—', null),
  ]);
}

function kpiCell(label, value, sub, unit) {
  const isLow = sub === 'low';
  return el('div', { class: `kpi-cell ${isLow ? 'kpi-cell--low' : ''}` }, [
    el('div', { class: 'kpi-cell-label' }, [label]),
    el('div', { class: 'kpi-cell-value' }, [value, unit && el('span', { style: { fontSize: '10px', color: 'var(--c-text-mute)', marginLeft: '2px' } }, [unit])]),
    isLow && el('div', { class: 'kpi-cell-sub', style: { color: 'var(--c-attention)' } }, ['⚠']),
  ]);
}

// ---- Focus button ----
function focusButton() {
  return el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-4)' } }, [
    el('button', {
      class: 'btn btn--ghost btn--block',
      on: { click: enterFocusMode }
    }, ['🎯 Focus']),
  ]);
}

// ---- Streak nudge (loss aversion) ----
function streakNudge(streak, prog) {
  const remaining = prog.due - prog.done - prog.floor;
  if (streak < 3 || remaining <= 0 || prog.due === 0) return null;
  return el('div', { class: 'card card--accent card--pad-sm mb-3', style: { marginTop: 'var(--sp-3)' } }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('span', {}, ['🔥']),
      el('div', { style: { flex: 1, fontSize: 'var(--fs-sub)' } }, [
        `You're on a ${streak}-day streak. Complete ${remaining} more to keep it alive.`,
      ]),
    ]),
  ]);
}

// ---- Action row (v3 §8: Title, Trigger, II, Time, Floor, Toggle, Progress) ----
function actionRow(action, day, t) {
  const st = day.actions[action.id];
  const isDone = st === 'full' || st === 'rest';
  const isFloor = st === 'floor';
  const toggleBtn = toggle(st, (e) => {
    e.stopPropagation();
    setDayAction(t, action.id, null);
    const newSt = getState().days[t]?.actions[action.id];
    // Update toggle button in-place (avoid full re-render replacing it)
    toggleBtn.className = `check check--${newSt || ''}`;
    if (newSt === 'full' || newSt === 'done') toggleBtn.textContent = '✓';
    else if (newSt === 'floor') toggleBtn.textContent = '½';
    else if (newSt === 'rest') toggleBtn.textContent = 'R';
    else toggleBtn.textContent = '';
    // Completion animation: card shrinks, checkmark draws, next rises
    if (newSt === 'full' || newSt === 'rest') {
      const row = toggleBtn.closest('.action-row');
      if (row) {
        row.classList.add('action-row--completing');
        setTimeout(() => row.classList.remove('action-row--completing'), 500);
        // Rise the next action
        const next = row.nextElementSibling;
        if (next && next.classList.contains('action-row')) {
          next.classList.add('action-row--next');
          setTimeout(() => next.classList.remove('action-row--next'), 400);
        }
      }
      toast(`${action.name} ✓`, { icon: action.icon });
    }
  });
  return el('div', { class: 'action-row' }, [
    el('div', { class: 'action-row-head' }, [
      toggleBtn,
      el('div', { class: 'action-row-body' }, [
        el('div', { class: 'action-row-title', style: isDone ? { color: 'var(--c-healthy)' } : {} }, [action.name]),
        action.cue && !isDone && el('div', { class: 'action-row-trigger' }, ['🔗 ', action.cue, ' → ', action.response]),
        action.implementationIntention && !isDone && el('div', { class: 'action-row-ii' }, [action.implementationIntention]),
        el('div', { class: 'action-row-meta' }, [
          action.estMins && el('span', { class: 'action-row-time' }, [`${action.estMins}m`]),
          action.floor && el('span', { class: 'action-row-floor' }, ['Floor: ' + action.floor]),
          action.compoundScore && el('span', { class: `compound-score ${action.compoundScore >= 8 ? 'compound-score--high' : action.compoundScore >= 6 ? 'compound-score--mid' : 'compound-score--low'}` }, [`↗ ${action.compoundScore}`]),
        ]),
      ]),
    ]),
  ]);
}

// ---- Recall section (conditional — only if cards due) ----
function recallSection(s, t) {
  const due = (s.spacedRepetition || []).filter(c => c.nextDue && c.nextDue <= t);
  if (!due.length) return null;
  return el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon' }, ['🧠']),
      el('div', { class: 'card-title' }, ['Recall']),
      el('span', { class: 'chip chip--accent' }, [String(due.length)]),
    ]),
    el('div', { class: 'text-mute text-meta' }, [`${due.length} card${due.length === 1 ? '' : 's'} due`]),
  ]);
}

// ---- Commitments section (conditional — only if active) ----
function commitmentSection(s, t) {
  const active = (s.commitments || []).filter(c => c.status === 'active');
  if (!active.length) return null;
  return el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon' }, ['🔒']),
      el('div', { class: 'card-title' }, ['Commitments']),
      el('span', { class: 'chip chip--attention' }, [String(active.length)]),
    ]),
    el('div', { class: 'text-mute text-meta' }, [`${active.length} active`]),
  ]);
}

// ---- Reflection (v3 §8: Mood, One Win, One Lesson) ----
function reflectionCard(day, t) {
  return el('div', { class: 'card', style: { marginTop: 'var(--sp-6)' } }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon' }, ['🧘']),
      el('div', { class: 'card-title' }, ['Reflection']),
    ]),
    moodRow(day, t),
    winRow(day, t),
    lessonRow(day, t),
  ]);
}

function moodRow(day, t) {
  const emojis = ['😞', '😕', '😐', '🙂', '😄'];
  const buttons = emojis.map((e, i) =>
    el('button', {
      class: `reflect-mood-btn ${day.mood === i + 1 ? 'reflect-mood-btn--selected' : ''}`,
      on: { click: () => {
        setDayField(t, 'mood', i + 1);
        // Update in-place to avoid full re-render
        buttons.forEach((b, j) => b.classList.toggle('reflect-mood-btn--selected', j === i));
      } }
    }, [e])
  );
  return el('div', {}, [
    el('div', { class: 'field-label mb-2' }, ['Mood']),
    el('div', { class: 'reflect-mood' }, buttons),
  ]);
}

function winRow(day, t) {
  return el('div', { class: 'field', style: { marginTop: 'var(--sp-3)' } }, [
    el('div', { class: 'field-label' }, ['One win']),
    el('textarea', {
      class: 'field-textarea',
      placeholder: 'What went well today?',
      on: { input: (e) => setDayField(t, 'win', e.target.value) }
    }, [day.win || '']),
  ]);
}

function lessonRow(day, t) {
  return el('div', { class: 'field' }, [
    el('div', { class: 'field-label' }, ['One lesson']),
    el('textarea', {
      class: 'field-textarea',
      placeholder: 'What did you learn?',
      on: { input: (e) => setDayField(t, 'lesson', e.target.value) }
    }, [day.lesson || '']),
  ]);
}
