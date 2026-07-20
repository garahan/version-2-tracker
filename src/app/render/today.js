// ============================================================
// Life OS v2 — Today tab
// Cadence-driven: shows all actions due today across all domains.
// ============================================================

import { el, div, span } from '../dom.js';
import { getState, getDay, setDayAction, setDayField, checkShieldEarned } from '../state.js';
import { todayKey, fmtDateLong, greeting } from '../util.js';
import { dueToday, todayProgress } from '../cadence.js';
import { toast } from '../ui.js';
import { confetti } from '../ui.js';
import { renderCommandCenter } from './command-center.js';
import { renderHeatmap } from './heatmap.js';

export function renderToday() {
  const s = getState();
  const t = todayKey();
  const due = dueToday();
  const day = getDay(t);
  const prog = todayProgress();

  // Group by domain
  const byDomain = {};
  for (const { domain, action } of due) {
    (byDomain[domain.id] ||= { domain, items: [] }).items.push(action);
  }

  const sections = Object.values(byDomain).map(({ domain, items }) =>
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
  );

  // Mood + note section
  const reflection = el('div', { class: 'card' }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon' }, ['🧘']),
      el('div', { class: 'card-title' }, ['Reflection']),
    ]),
    moodRow(day, t),
    noteRow(day, t),
  ]);

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Today']),
      el('div', { class: 'app-subtitle' }, [fmtDateLong(t)]),
    ]),
    renderCommandCenter(),
    renderHeatmap(105),
    el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, [`Today's actions · ${prog.done}/${prog.due} done`]),
    ]),
    ...sections,
    reflection,
  ]);
}

function actionRow(action, day, key) {
  const v = day.habits[action.id] || null;
  const isDone = v === 'full' || v === 'rest';
  const isFloor = v === 'floor';
  return el('div', { class: 'list-item list-item--interactive', on: { click: () => toggle(action, key) } }, [
    el('div', { class: `check ${isDone ? 'check--done' : isFloor ? 'check--floor' : ''}` }, [isDone ? '✓' : isFloor ? '½' : '']),
    el('div', { class: 'list-item-body' }, [
      el('div', { class: 'list-item-title' }, [action.icon ? `${action.icon} ` : '', action.name]),
      action.floor && el('div', { class: 'list-item-sub' }, [
        isFloor ? `Floor: ${action.floor}` : (isDone ? (action.full || 'Done') : `Floor: ${action.floor}`)
      ]),
    ]),
    action.floor && el('button', {
      class: 'btn btn--ghost btn--sm',
      on: { click: (e) => { e.stopPropagation(); setFloor(action, key); } }
    }, ['Floor']),
  ]);
}

function toggle(action, key) {
  const day = getDay(key);
  const cur = day.habits[action.id] || null;
  const next = cur === 'full' ? null : 'full';
  setDayAction(key, action.id, next);
  if (next === 'full') {
    const prog = todayProgress();
    if (prog.due > 0 && prog.done + prog.floor === prog.due) {
      confetti();
      toast('Perfect day. 🎉', { icon: '⭐' });
      // Check if this completed a perfect week → earn shield
      if (checkShieldEarned()) {
        setTimeout(() => toast('Shield earned! 🛡️', { icon: '🛡️' }), 800);
      }
    } else {
      toast(`${action.name} ✓`, { duration: 1200 });
    }
  }
}

function setFloor(action, key) {
  const day = getDay(key);
  const cur = day.habits[action.id] || null;
  const next = cur === 'floor' ? null : 'floor';
  setDayAction(key, action.id, next);
  if (next === 'floor') toast(`${action.name} floor ✓`, { duration: 1200, icon: '🟡' });
}

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
