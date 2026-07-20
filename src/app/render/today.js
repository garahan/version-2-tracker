// ============================================================
// Life OS v2 — Today tab (Cognitive Interface)
// Three attention levels: Glance (3s) → Operate (30s) → Reflect
// ============================================================

import { el, div, span, toggle, svg, svgEl } from '../dom.js';
import { getState, getDay, setDayAction, setDayField, checkShieldEarned, currentStreak } from '../state.js';
import { todayKey, fmtDateLong, fmtDate, hour } from '../util.js';
import { dueToday, todayProgress } from '../cadence.js';
import { toast, confetti } from '../ui.js';
import { renderHeatmap } from './heatmap.js';
import { setSubroute } from '../main.js';
import { activeBundles } from '../temptation-bundling.js';
import { activeCommitments } from '../commitments.js';
import { systemHealth } from '../system-health.js';
import { enterFocusMode } from '../focus-mode.js';

export function renderToday() {
  const s = getState();
  const t = todayKey();
  const due = dueToday();
  const day = getDay(t);
  const prog = todayProgress();
  const streak = currentStreak();

  // Group by domain
  const byDomain = {};
  for (const { domain, action } of due) {
    (byDomain[domain.id] ||= { domain, items: [] }).items.push(action);
  }

  return el('div', { class: 'page' }, [
    // ---- GLANCE: top bar (version + date + streak/shields) ----
    topBar(s, t, streak),

    // ---- GLANCE: large progress ring ----
    heroRing(s, prog),

    // ---- GLANCE: 6-metric command panel ----
    metricPanel(s),

    // Focus Mode button (strips to next action + timer)
    el('button', {
      class: 'btn btn--ghost',
      style: { width: '100%', marginTop: 'var(--sp-4)', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)' },
      on: { click: enterFocusMode }
    }, ['🎯 Focus Mode']),

    // ---- OPERATE: today's actions ----
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-8)' } }, [
      el('div', { class: 'section-title', style: { fontSize: 'var(--fs-section)' } }, ['Today']),
      el('span', { class: 'text-mute', style: { fontSize: 'var(--fs-meta)' } }, [`${prog.done}/${prog.due} done`]),
    ]),

    // Loss aversion nudge (only if streak at risk)
    streakNudge(streak, prog),

    // Action sections by domain
    ...Object.values(byDomain).map(({ domain, items }) =>
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [
          el('div', { class: 'card-icon' }, [domain.icon]),
          el('div', {}, [
            el('div', { class: 'card-title' }, [domain.name]),
            el('div', { class: 'card-subtitle' }, [items.length === 1 ? '1 action' : `${items.length} actions`]),
          ]),
        ]),
        el('div', { class: 'list' }, items.map((a) => actionRow(a, day, t))),
      ])
    ),

    // Recall (only if cards due — hide if empty)
    recallSection(s, t),

    // Commitments (only if active — hide if empty)
    commitmentSection(s, t),

    // ---- REFLECT: mood + note ----
    el('div', { class: 'card', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'card-head' }, [
        el('div', { class: 'card-icon' }, ['🧘']),
        el('div', { class: 'card-title' }, ['Reflection']),
      ]),
      moodRow(day, t),
      noteRow(day, t),
    ]),

    // Heatmap (history at the bottom)
    el('div', { style: { marginTop: 'var(--sp-6)' } }, [renderHeatmap(105)]),
  ]);
}

// ---- Top bar: version left, date right, streak/shields below ----
function topBar(s, t, streak) {
  const d = new Date();
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
  return el('div', { class: 'flex items-center justify-between', style: { padding: 'var(--sp-4) 0 var(--sp-2)' } }, [
    el('div', {}, [
      el('div', { style: { fontSize: 'var(--fs-page)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--ls-tight)', fontVariantNumeric: 'tabular-nums' } }, [`v${s.version.toFixed(2)}`]),
    ]),
    el('div', { style: { textAlign: 'right' } }, [
      el('div', { style: { fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)' } }, [dayName]),
      el('div', { style: { fontSize: 'var(--fs-meta)', color: 'var(--c-text-mute)' } }, [fmtDate(t)]),
    ]),
    // Streak + shields top-right
    el('div', { class: 'flex items-center gap-2', style: { position: 'absolute', top: 'var(--sp-2)', right: 'var(--sp-4)' } }, [
      streak > 0 && el('span', { class: 'chip', style: { fontSize: 'var(--fs-meta)' } }, [`🔥 ${streak}`]),
      s.shields > 0 && el('span', { class: 'chip', style: { fontSize: 'var(--fs-meta)', background: 'rgba(255,209,102,0.15)' } }, [`🛡️ ${s.shields}`]),
    ]),
  ]);
}

// ---- Hero ring: large, centered, version in center ----
function heroRing(s, prog) {
  const pct = prog.pct;
  const size = 180, stroke = 12, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, Math.max(0, pct)));
  return el('div', { class: 'ring-hero', style: { marginTop: 'var(--sp-4)' } }, [
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

// ---- 6-metric panel (Glance level) ----
function metricPanel(s) {
  const t = todayKey();
  const lastMetric = (metric) => {
    const arr = s.metrics?.[metric];
    if (!arr || !arr.length) return null;
    const today = arr.find(m => m.date === t);
    return today ? today.value : arr[arr.length - 1].value;
  };
  const sleep = lastMetric('sleep');
  const hrv = lastMetric('hrv');
  const steps = lastMetric('steps');
  const deepWork = s.days[t]?.deepWorkMins || 0;
  const runway = s.optionality?.runwayMonths || 0;
  const mood = s.days[t]?.mood;

  const moodEmoji = mood === 1 ? '😞' : mood === 2 ? '😕' : mood === 3 ? '😐' : mood === 4 ? '🙂' : mood === 5 ? '😄' : '—';

  const stepsStr = steps != null ? (steps >= 1000 ? (steps / 1000).toFixed(1) + 'k' : String(steps)) : '—';

  return el('div', { class: 'metric-panel', style: { marginTop: 'var(--sp-6)' } }, [
    metricCell('Sleep', sleep != null ? sleep + 'h' : '—', sleep != null && sleep < 6 ? 'low' : null),
    metricCell('HRV', hrv != null ? String(hrv) : '—', null, 'ms'),
    metricCell('Deep', deepWork ? (deepWork / 60).toFixed(1) + 'h' : '—', null),
    metricCell('Runway', runway + 'm', runway < 6 ? 'low' : null),
    metricCell('Steps', stepsStr, null),
    metricCell('Mood', moodEmoji, null),
  ]);
}

function metricCell(label, value, sub, unit) {
  const isLow = sub === 'low';
  return el('div', { class: 'metric-cell' }, [
    el('div', { class: 'metric-cell-label' }, [label]),
    el('div', { class: 'metric-cell-value', style: isLow ? { color: 'var(--c-attention)' } : {} }, [value, unit && el('span', { style: { fontSize: 'var(--fs-meta)', color: 'var(--c-text-mute)', marginLeft: '2px' } }, [unit])]),
    isLow && el('div', { class: 'metric-cell-sub', style: { color: 'var(--c-attention)' } }, ['⚠']),
  ]);
}

// ---- Streak nudge (loss aversion) ----
function streakNudge(streak, prog) {
  const remaining = prog.due - prog.done - prog.floor;
  if (streak < 3 || remaining <= 0 || prog.due === 0) return null;
  return el('div', { class: 'card card--pad-sm mb-3', style: { borderColor: 'var(--c-accent)', marginTop: 'var(--sp-3)' } }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('span', {}, ['🔥']),
      el('span', { class: 'text-sm' }, [
        `Don't lose your ${streak}-day streak. `,
        el('strong', {}, [`${remaining} action${remaining > 1 ? 's' : ''} left`]),
        ' to protect it.',
      ]),
    ]),
  ]);
}

// ---- Action row with Apple-style toggle ----
function actionRow(action, day, key) {
  const v = day.habits[action.id] || null;
  const isDone = v === 'full' || v === 'rest';
  const isFloor = v === 'floor';
  const bundles = activeBundles().filter((b) => b.actionId === action.id);

  return el('div', { class: 'list-item', style: { padding: 'var(--sp-4) var(--sp-3)' } }, [
    // Toggle on the left (Apple style)
    toggle({
      state: v,
      onFull: () => doFull(action, key),
      onFloor: () => doFloor(action, key),
      onRest: () => doRest(action, key),
    }),
    // Action info
    el('div', { class: 'list-item-body', style: { marginLeft: 'var(--sp-3)' } }, [
      el('div', { class: 'list-item-title', style: isDone ? { color: 'var(--c-text-mute)', textDecoration: 'line-through' } : {} }, [
        action.icon ? `${action.icon} ` : '', action.name,
      ]),
      // Implementation intention (Gollwitzer)
      action.implementationIntention && !isDone && el('div', { class: 'list-item-sub', style: { fontStyle: 'italic', opacity: '0.8' } }, [
        '🔗 ', action.cue, ' → ', action.response,
      ]),
      // Temptation bundle (Milkman)
      bundles.length > 0 && !isDone && el('div', { class: 'list-item-sub', style: { color: 'var(--c-accent)' } }, [
        '🎧 Bundle: only ', bundles[0].want, ' during ', bundles[0].should,
      ]),
      // Floor description
      action.floor && el('div', { class: 'list-item-sub' }, [
        isFloor ? `Floor: ${action.floor}` : (isDone ? (action.full || 'Done') : `Floor: ${action.floor}`)
      ]),
    ]),
  ]);
}

function doFull(action, key) {
  setDayAction(key, action.id, 'full');
  const prog = todayProgress();
  const allFull = prog.done === prog.due && prog.floor === 0;
  const allDone = prog.done + prog.floor === prog.due;
  if (prog.due > 0 && allDone) {
    confetti();
    toast(allFull ? 'Perfect day. 🎉' : 'All done! Great work.', { icon: allFull ? '⭐' : '✅' });
    if (allFull && checkShieldEarned()) {
      setTimeout(() => toast('Shield earned! 🛡️', { icon: '🛡️' }), 800);
    }
  } else {
    toast(`${action.name} ✓`, { duration: 1200 });
  }
}

function doFloor(action, key) {
  setDayAction(key, action.id, 'floor');
  toast(`${action.name} floor ✓`, { duration: 1200, icon: '🟡' });
}

function doRest(action, key) {
  setDayAction(key, action.id, 'rest');
  toast(`${action.name} rest ✓`, { duration: 1200, icon: '😴' });
}

// ---- Recall section (hidden if empty) ----
function recallSection(s, t) {
  const srDue = (s.spacedRepetition || []).filter((i) => i.due <= t);
  if (srDue.length === 0) return null;
  return el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon' }, ['🧠']),
      el('div', {}, [
        el('div', { class: 'card-title' }, ['Recall']),
        el('div', { class: 'card-subtitle' }, [`${srDue.length} card${srDue.length > 1 ? 's' : ''} due`]),
      ]),
    ]),
    el('div', { class: 'list' }, srDue.slice(0, 3).map((item) =>
      el('div', { class: 'list-item list-item--interactive', on: { click: () => setSubroute('spaced-repetition') } }, [
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [item.question]),
          el('div', { class: 'list-item-sub' }, [`rep ${item.repetitions} · EF ${item.easeFactor.toFixed(1)}`]),
        ]),
        el('span', { class: 'chip chip--accent' }, ['Review']),
      ])
    )),
  ]);
}

// ---- Commitments section (hidden if empty) ----
function commitmentSection(s, t) {
  const commitments = activeCommitments();
  if (commitments.length === 0) return null;
  return el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon' }, ['🔒']),
      el('div', {}, [
        el('div', { class: 'card-title' }, ['Commitments']),
        el('div', { class: 'card-subtitle' }, [`${commitments.length} active · points at stake`]),
      ]),
    ]),
    el('div', { class: 'list' }, commitments.map((c) => {
      const daysLeft = Math.ceil((new Date(c.deadline) - new Date(t)) / 86400000);
      return el('div', { class: 'list-item' }, [
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [c.actionName]),
          el('div', { class: 'list-item-sub' }, [
            `${c.stake} pts staked · `,
            daysLeft <= 0 ? 'due TODAY' : `${daysLeft}d left`,
          ]),
        ]),
      ]);
    })),
  ]);
}

// ---- Reflection ----
function moodRow(day, key) {
  const moods = ['😞', '😕', '😐', '🙂', '😄'];
  return el('div', { class: 'flex items-center gap-2 mb-3' }, [
    el('span', { class: 'text-xs text-mute uppercase' }, ['Mood']),
    el('div', { class: 'flex gap-2 flex-1 justify-end' }, moods.map((emoji, i) => {
      const val = i + 1;
      const active = day.mood === val;
      return el('button', {
        class: `btn btn--sm ${active ? 'btn--primary' : 'btn--ghost'}`,
        style: { width: '36px', height: '36px', fontSize: '18px' },
        on: { click: () => setDayField(key, 'mood', active ? null : val) }
      }, [emoji]);
    })),
  ]);
}

function noteRow(day, key) {
  return el('div', { class: 'field' }, [
    el('textarea', {
      class: 'field-textarea',
      placeholder: 'One win, one thing to improve…',
      on: { input: (e) => setDayField(key, 'note', e.target.value) }
    }, [day.note || '']),
  ]);
}
