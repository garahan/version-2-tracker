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
import { getState, getDay, setDayAction, setDayField, currentStreak, updateSilent } from '../state.js';
import { todayKey, fmtDate, dayName, fmtNum } from '../util.js';
import { dueToday, todayProgress } from '../cadence.js';
import { toast, sheet } from '../ui.js';
import { renderHeatmap } from './heatmap.js';
import { enterFocusMode } from '../focus-mode.js';
import { autoDeriveKPIs, autoCalcRunway } from '../automation.js';
import { trainingLogSection } from '../training.js';
import { enterTraining } from '../training-env.js';
import { buildSuggestions, dismissSuggestion, acceptSuggestion, ensureCarryOver, addTask, toggleTask, deleteTask } from '../suggestions.js';
import { importFromClipboard, payloadTemplate } from '../health-sync.js';
import { buildDayPlan, fmtHour } from '../day-plan.js';

export function renderToday() {
  const s = getState();
  const t = todayKey();
  const due = dueToday();
  const day = getDay(t);
  ensureCarryOver();
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
    scheduleSection(day),
    suggestionsSection(),
    todoSection(t),
    kpiPanel(s),
    focusButton(),
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-8)' } }, [
      el('div', { class: 'section-title' }, ['Today']),
      viewToggle(s),
      el('span', { class: 'text-mute text-meta' }, [`${prog.done}/${prog.due} done`]),
    ]),
    streakNudge(streak, prog),
    ...((s.settings.todayView || 'plan') === 'plan'
      ? [timelineSection(day, t)]
      : Object.values(byDomain).map(({ domain, items }) =>
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
      )),
    trainingLogSection(s, t),
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
    // Streak + shields (only shown when they exist — keep the top calm)
    (streak > 0 || s.shields > 0) && el('div', { class: 'flex items-center gap-2', style: { marginTop: 'var(--sp-2)' } }, [
      streak > 0 && el('span', { class: 'chip chip--attention' }, ['🔥 ' + streak + 'd streak']),
      s.shields > 0 && el('span', { class: 'chip chip--shield' }, ['🛡️ ' + s.shields + ' shields']),
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

// ---- Today's schedule (from calendar sync, if any) ----
function scheduleSection(day) {
  const events = day.calendar || [];
  if (!events.length) return null;
  return el('div', { class: 'card card--pad-sm', style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'flex items-center gap-2', style: { marginBottom: 'var(--sp-2)' } }, [
      el('span', {}, ['🗓']),
      el('div', { class: 'card-title', style: { flex: 1 } }, ['Schedule']),
      el('span', { class: 'text-mute text-meta' }, [`${events.length} event${events.length === 1 ? '' : 's'}`]),
    ]),
    el('div', {}, events.map(e =>
      el('div', { class: 'flex items-center gap-2', style: { padding: '3px 0', fontSize: 'var(--fs-sub)' } }, [
        el('span', { class: 'text-mute', style: { fontVariantNumeric: 'tabular-nums', minWidth: '84px' } }, [
          e.start ? (e.end ? `${e.start}–${e.end}` : e.start) : '—',
        ]),
        el('span', { style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, [e.title]),
      ])
    )),
  ]);
}

// ---- Health sync sheet (Apple Shortcuts bridge) ----
function openSyncSheet() {
  const s = getState();
  const last = s.settings.lastHealthSync;
  const appUrl = window.location.origin + window.location.pathname;

  const body = el('div', {}, [
    el('div', { class: 'text-mute', style: { fontSize: 'var(--fs-sub)', lineHeight: 1.5 } }, [
      'Apple Health, Calendar and Screen Time have no browser APIs — but the iOS Shortcuts app can read Health + Calendar and send everything here in one tap (or automatically every morning).',
    ]),

    last && el('div', { class: 'chip chip--healthy', style: { marginTop: 'var(--sp-3)' } }, [
      '✓ Last sync: ' + new Date(last).toLocaleString(),
    ]),

    el('button', {
      class: 'btn btn--primary btn--block', style: { marginTop: 'var(--sp-4)' },
      on: { click: async () => {
        try {
          const { imported } = await importFromClipboard();
          toast(`Synced: ${imported.join(', ') || 'nothing new'}`, { icon: '⌚', duration: 4000 });
          window.__lifeosRerender && window.__lifeosRerender();
        } catch (e) {
          toast('Import failed: ' + e.message, { icon: '⚠️', duration: 4000 });
        }
      } }
    }, ['📋 Import from clipboard']),

    el('div', { class: 'overline', style: { marginTop: 'var(--sp-5)' } }, ['One-time setup (5 min)']),
    el('ol', { style: { fontSize: 'var(--fs-sub)', color: 'var(--c-text-soft)', paddingLeft: '18px', lineHeight: 1.7, marginTop: 'var(--sp-2)' } }, [
      el('li', {}, ['Open the Shortcuts app → new Shortcut']),
      el('li', {}, ['Add "Find Health Samples" actions: sleep, steps, HRV, resting heart rate, weight']),
      el('li', {}, ['Add "Get Upcoming Events" (today) for your calendar']),
      el('li', {}, ['Add "Text" action shaped like the template below, inserting the health variables']),
      el('li', {}, ['Add "URL" → ', el('code', { style: { fontSize: '11px', wordBreak: 'break-all' } }, [appUrl + '#sync=']), ' + URL-encoded Text, then "Open URL"']),
      el('li', {}, ['Optional: Automations → "Time of Day, 7:00, daily" → run this Shortcut. Fully automatic from then on.']),
    ]),
    el('div', { class: 'text-mute text-meta', style: { marginTop: 'var(--sp-2)' } }, [
      'Alternative: end the Shortcut with "Copy to Clipboard" and use the import button above. Screen Time has no API at all — add an "Ask for Input" step if you want it included.',
    ]),

    el('button', {
      class: 'btn btn--ghost btn--block', style: { marginTop: 'var(--sp-3)' },
      on: { click: async () => {
        try {
          await navigator.clipboard.writeText(payloadTemplate());
          toast('Template copied — paste it into the Shortcut "Text" action', { icon: '📋', duration: 3500 });
        } catch { toast('Copy failed', { icon: '⚠️' }); }
      } }
    }, ['Copy JSON template']),
  ]);

  sheet({ title: '⌚ Health & Calendar Sync', body });
}

// ---- Plan / Domains view toggle ----
function viewToggle(s) {
  const view = s.settings.todayView || 'plan';
  const setView = (v) => {
    updateSilent(st => { st.settings.todayView = v; });
    window.__lifeosRerender && window.__lifeosRerender();
  };
  return el('div', { class: 'flex gap-1', style: { marginLeft: 'auto', marginRight: 'var(--sp-2)' } }, [
    el('button', { class: `chip ${view === 'plan' ? 'chip--accent' : ''}`, on: { click: () => setView('plan') } }, ['🕐 Plan']),
    el('button', { class: `chip ${view === 'domains' ? 'chip--accent' : ''}`, on: { click: () => setView('domains') } }, ['🗂 Domains']),
  ]);
}

// ---- Timeline: everything due today, slotted by the day-plan engine ----
function timelineSection(day, t) {
  const plan = buildDayPlan();
  if (!plan.length) {
    return el('div', { class: 'card' }, [
      el('div', { class: 'empty' }, [
        el('div', { class: 'empty-icon' }, ['🌤']),
        el('div', { class: 'empty-title' }, ['Nothing scheduled']),
      ]),
    ]);
  }
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  let nowMarkerPlaced = false;
  const rows = [];
  for (const entry of plan) {
    if (!nowMarkerPlaced && entry.hour >= nowH) {
      rows.push(el('div', { class: 'plan-now' }, [
        el('span', { class: 'plan-now-time' }, [fmtHour(nowH)]),
        el('span', { class: 'plan-now-line' }),
        el('span', { class: 'plan-now-label' }, ['now']),
      ]));
      nowMarkerPlaced = true;
    }
    rows.push(planRow(entry, day, t, !nowMarkerPlaced));
  }
  return el('div', { class: 'card' }, [el('div', { class: 'list' }, rows)]);
}

function planRow(entry, day, t, isPast) {
  const isDone = entry.type === 'action'
    ? (entry.state === 'full' || entry.state === 'rest' || entry.state === 'floor')
    : entry.type === 'task' ? !!entry.task?.done : false;

  let check = null;
  if (entry.type === 'action') {
    check = toggle(entry.state, (e) => {
      e.stopPropagation();
      setDayAction(t, entry.action.id, null);
      updateSilent(st => { autoDeriveKPIs(st); autoCalcRunway(st); });
      const newSt = getState().days[t]?.actions[entry.action.id];
      check.className = `check check--${newSt || ''}`;
      check.textContent = newSt === 'full' ? '✓' : newSt === 'floor' ? '½' : newSt === 'rest' ? 'R' : '';
      const done = newSt === 'full' || newSt === 'floor' || newSt === 'rest';
      nameEl.style.color = done ? 'var(--c-healthy)' : '';
      if (newSt === 'full' || newSt === 'rest') toast(`${entry.name} ✓`, { icon: entry.icon });
    });
  } else if (entry.type === 'task') {
    check = toggle(entry.task.done ? 'done' : null, () => {
      toggleTask(entry.task.id);
      const nowDone = getState().days[t]?.tasks?.find(x => x.id === entry.task.id)?.done;
      check.className = `check check--${nowDone ? 'done' : ''}`;
      check.textContent = nowDone ? '✓' : '';
      nameEl.style.textDecoration = nowDone ? 'line-through' : '';
      nameEl.style.color = nowDone ? 'var(--c-text-mute)' : '';
    });
  }

  const nameEl = el('div', { class: 'plan-row-name', style: {
    color: isDone ? (entry.type === 'task' ? 'var(--c-text-mute)' : 'var(--c-healthy)') : '',
    textDecoration: entry.type === 'task' && isDone ? 'line-through' : '',
  } }, [entry.name]);

  return el('div', { class: `plan-row ${isPast && !isDone ? 'plan-row--past' : ''}` }, [
    el('div', { class: 'plan-row-time' }, [fmtHour(entry.hour)]),
    el('span', { class: 'plan-row-icon' }, [entry.icon]),
    el('div', { class: 'plan-row-body' }, [
      nameEl,
      (entry.why || entry.meta) && el('div', { class: 'plan-row-why' }, [
        [entry.meta, isDone ? null : entry.why].filter(Boolean).join(' — '),
      ]),
      entry.floor && !isDone && el('div', { class: 'plan-row-why' }, ['Floor: ' + entry.floor]),
    ]),
    check,
  ]);
}

// ---- Suggestions (personalized, max 3, dismissible) ----
function suggestionsSection() {
  const sugs = buildSuggestions();
  if (!sugs.length) return null;
  const host = el('div', { style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, ['Suggested for you']),
      el('span', { class: 'text-mute text-meta' }, ['based on your last 7 days']),
    ]),
    ...sugs.map(sug => suggestionCard(sug)),
  ]);
  return host;
}

function suggestionCard(sug) {
  const card = el('div', { class: 'card card--pad-sm suggestion-card', style: { marginTop: 'var(--sp-2)' } }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('span', { style: { fontSize: '18px' } }, [sug.icon]),
      el('div', { style: { flex: 1, minWidth: 0 } }, [
        el('div', { style: { fontSize: 'var(--fs-sub)', fontWeight: 'var(--fw-semibold)' } }, [sug.title]),
        el('div', { class: 'text-mute text-meta', style: { marginTop: '2px' } }, [sug.why]),
      ]),
    ]),
    el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-2)' } }, [
      el('button', {
        class: 'btn btn--primary btn--sm',
        'aria-label': 'Add suggestion to to-do list',
        on: { click: () => {
          acceptSuggestion(sug);
          toast('Added to to-do', { icon: sug.icon });
          window.__lifeosRerender && window.__lifeosRerender();
        } }
      }, ['+ To-do']),
      el('button', {
        class: 'btn btn--ghost btn--sm',
        'aria-label': 'Dismiss suggestion',
        on: { click: () => {
          dismissSuggestion(sug.id);
          card.style.display = 'none';
        } }
      }, ['Dismiss']),
    ]),
  ]);
  return card;
}

// ---- To-do list (day-scoped, carries over unfinished tasks) ----
function todoSection(t) {
  const day = getState().days[t] || { tasks: [] };
  const tasks = day.tasks || [];
  const open = tasks.filter(x => !x.done).length;

  const list = el('div', { class: 'list', style: { marginTop: 'var(--sp-2)' } },
    tasks.map(task => todoRow(task)));

  const input = el('input', {
    class: 'capture-input',
    placeholder: 'Add a task…',
    'aria-label': 'Add a task',
    on: { keydown: (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        addTask(e.target.value.trim());
        e.target.value = '';
        const fresh = getState().days[t]?.tasks || [];
        list.appendChild(todoRow(fresh[fresh.length - 1]));
        countChip.textContent = countLabel(fresh);
      }
    } }
  });

  const countChip = el('span', { class: 'text-mute text-meta' }, [countLabel(tasks)]);

  return el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon' }, ['📝']),
      el('div', { style: { flex: 1 } }, [
        el('div', { class: 'card-title' }, ['To-Do']),
      ]),
      countChip,
    ]),
    el('div', { class: 'capture', style: { marginTop: 'var(--sp-2)' } }, [input]),
    list,
  ]);

  function countLabel(arr) {
    const remaining = arr.filter(x => !x.done).length;
    return arr.length === 0 ? 'nothing yet' : remaining === 0 ? 'all done ✓' : `${remaining} open`;
  }
}

function todoRow(task) {
  if (!task) return null;
  const check = toggle(task.done ? 'done' : null, () => {
    toggleTask(task.id);
    const nowDone = getState().days[todayKey()]?.tasks?.find(x => x.id === task.id)?.done;
    check.className = `check check--${nowDone ? 'done' : ''}`;
    check.textContent = nowDone ? '✓' : '';
    label.style.textDecoration = nowDone ? 'line-through' : '';
    label.style.color = nowDone ? 'var(--c-text-mute)' : '';
  });
  const label = el('div', { style: {
    flex: 1, fontSize: 'var(--fs-sub)',
    textDecoration: task.done ? 'line-through' : '',
    color: task.done ? 'var(--c-text-mute)' : '',
  } }, [
    task.text,
    task.carried && el('span', { class: 'text-mute text-meta', style: { marginLeft: '6px' } }, ['↻ carried']),
  ]);
  const row = el('div', { class: 'action-row' }, [
    el('div', { class: 'action-row-head', style: { alignItems: 'center' } }, [
      check,
      label,
      el('button', {
        class: 'btn btn--ghost btn--sm',
        'aria-label': 'Delete task',
        on: { click: () => { deleteTask(task.id); row.remove(); } }
      }, ['×']),
    ]),
  ]);
  return row;
}

// ---- KPI panel (compact by default: 6 essentials, expandable) ----
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

  // 6 essentials always visible; the rest behind a calm "More" toggle
  const essentials = [
    kpiCell('Energy', energy != null ? String(energy) : '—', energy != null && energy < 3 ? 'low' : null),
    kpiCell('Sleep', sleep != null ? sleep + 'h' : '—', sleep != null && sleep < 6 ? 'low' : null),
    kpiCell('Deep', deepWork ? (deepWork / 60).toFixed(1) + 'h' : '—', null),
    kpiCell('Mood', moodEmoji, null),
    kpiCell('Steps', stepsStr, null),
    kpiCell('Runway', runway + 'm', runway < 6 ? 'low' : null),
  ];
  const extras = [
    kpiCell('HRV', hrv != null ? String(hrv) : '—', null, 'ms'),
    kpiCell('Net', netWorth != null ? fmtNum(netWorth) : '—', null),
    kpiCell('Opps', String(opps), null),
    kpiCell('Health', String(Math.round((s.version - 1) * 100)), null),
    kpiCell('Sat', s.northStar?.lifeSatisfaction != null ? String(s.northStar.lifeSatisfaction) : '—', null),
  ];

  const extraGrid = el('div', { class: 'kpi-grid', style: { marginTop: 'var(--sp-2)', display: _kpiExpanded ? '' : 'none' } }, extras);
  const toggleBtn = el('button', {
    class: 'btn btn--ghost btn--sm',
    style: { width: '100%', marginTop: 'var(--sp-1)' },
    'aria-expanded': String(_kpiExpanded),
    on: { click: () => {
      _kpiExpanded = !_kpiExpanded;
      extraGrid.style.display = _kpiExpanded ? '' : 'none';
      toggleBtn.textContent = _kpiExpanded ? 'Less ▴' : 'More ▾';
      toggleBtn.setAttribute('aria-expanded', String(_kpiExpanded));
    } }
  }, [_kpiExpanded ? 'Less ▴' : 'More ▾']);

  return el('div', { style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'kpi-grid' }, essentials),
    extraGrid,
    toggleBtn,
  ]);
}

let _kpiExpanded = false;

function kpiCell(label, value, sub, unit) {
  const isLow = sub === 'low';
  return el('div', { class: `kpi-cell ${isLow ? 'kpi-cell--low' : ''}` }, [
    el('div', { class: 'kpi-cell-label' }, [label]),
    el('div', { class: 'kpi-cell-value' }, [value, unit && el('span', { style: { fontSize: '10px', color: 'var(--c-text-mute)', marginLeft: '2px' } }, [unit])]),
    isLow && el('div', { class: 'kpi-cell-sub', style: { color: 'var(--c-attention)' } }, ['⚠']),
  ]);
}

// ---- Finance summary card (auto-calculated) ----
function financeCard(s) {
  const ns = s.northStar || {};
  const netWorth = ns.netWorth || 0;
  const monthlyExpenses = ns.monthlyExpenses || 0;
  const runway = s.optionality?.runwayMonths || (monthlyExpenses > 0 ? Math.round(netWorth / monthlyExpenses) : 0);
  const savingsRate = ns.savingsRate || 0;
  const incomeSources = s.optionality?.incomeSources || 0;

  return el('div', { class: 'card card--accent', style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'flex items-center justify-between' }, [
      el('div', { class: 'overline', style: { color: 'var(--c-accent-text)' } }, ['💰 Financial Capital']),
      el('span', { class: 'chip chip--accent' }, ['Auto']),
    ]),
    el('div', { class: 'flex gap-6 mt-2', style: { gap: 'var(--sp-6)' } }, [
      el('div', {}, [
        el('div', { class: 'text-mute text-meta' }, ['Net worth']),
        el('div', { style: { fontSize: 'var(--fs-section)', fontWeight: 'var(--fw-bold)', fontVariantNumeric: 'tabular-nums', color: 'var(--c-accent-text)' } }, ['$' + fmtNum(netWorth)]),
      ]),
      el('div', {}, [
        el('div', { class: 'text-mute text-meta' }, ['Runway']),
        el('div', { style: { fontSize: 'var(--fs-section)', fontWeight: 'var(--fw-bold)', fontVariantNumeric: 'tabular-nums', color: runway >= 6 ? 'var(--c-healthy)' : 'var(--c-attention)' } }, [runway + 'm']),
      ]),
      el('div', {}, [
        el('div', { class: 'text-mute text-meta' }, ['Savings']),
        el('div', { style: { fontSize: 'var(--fs-section)', fontWeight: 'var(--fw-bold)', fontVariantNumeric: 'tabular-nums', color: savingsRate >= 20 ? 'var(--c-healthy)' : 'var(--c-attention)' } }, [savingsRate + '%']),
      ]),
      el('div', {}, [
        el('div', { class: 'text-mute text-meta' }, ['Sources']),
        el('div', { style: { fontSize: 'var(--fs-section)', fontWeight: 'var(--fw-bold)', fontVariantNumeric: 'tabular-nums' } }, [String(incomeSources)]),
      ]),
    ]),
  ]);
}

// ---- Focus + Training + Sync buttons ----
function focusButton() {
  return el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-4)' } }, [
    el('button', {
      class: 'btn btn--ghost',
      style: { flex: 1 },
      on: { click: enterFocusMode }
    }, ['🎯 Focus']),
    el('button', {
      class: 'btn btn--primary',
      style: { flex: 1, background: 'var(--c-gradient-healthy)' },
      on: { click: enterTraining }
    }, ['🏋️ Train']),
    el('button', {
      class: 'btn btn--ghost',
      style: { flex: '0 0 auto' },
      'aria-label': 'Sync health and calendar data',
      on: { click: openSyncSheet }
    }, ['⌚']),
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
    // Auto-derive KPIs from this action completion
    updateSilent(st => { autoDeriveKPIs(st); autoCalcRunway(st); });
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
