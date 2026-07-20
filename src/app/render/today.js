// ============================================================
// Life OS v2 — Today tab
// Cadence-driven: shows all actions due today across all domains.
// ============================================================

import { el, div, span } from '../dom.js';
import { getState, getDay, setDayAction, setDayField, checkShieldEarned, currentStreak } from '../state.js';
import { todayKey, fmtDateLong, greeting } from '../util.js';
import { dueToday, todayProgress } from '../cadence.js';
import { toast } from '../ui.js';
import { confetti } from '../ui.js';
import { renderCommandCenter } from './command-center.js';
import { renderHeatmap } from './heatmap.js';
import { setSubroute } from '../main.js';
import { activeBundles } from '../temptation-bundling.js';
import { activeCommitments } from '../commitments.js';

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

  // Spaced repetition due (Cepeda et al. — retrieval practice)
  const srDue = (s.spacedRepetition || []).filter((i) => i.due <= t);
  const srSection = srDue.length > 0 ? el('div', { class: 'card' }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon' }, ['🧠']),
      el('div', {}, [
        el('div', { class: 'card-title' }, ['Recall practice']),
        el('div', { class: 'card-subtitle' }, [`${srDue.length} card${srDue.length > 1 ? 's' : ''} due · SM-2`]),
      ]),
    ]),
    el('div', { class: 'list' }, srDue.slice(0, 3).map((item) =>
      el('div', { class: 'list-item list-item--interactive', on: { click: () => setSubroute('spaced-repetition') } }, [
        el('div', { class: 'list-item-icon', style: { fontSize: '20px' } }, ['🧠']),
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [item.question]),
          el('div', { class: 'list-item-sub' }, [`rep ${item.repetitions} · EF ${item.easeFactor.toFixed(1)}`]),
        ]),
        el('span', { class: 'chip chip--accent' }, ['Review']),
      ])
    )),
    srDue.length > 3 && el('button', {
      class: 'btn btn--ghost btn--sm',
      style: { width: '100%', marginTop: '8px' },
      on: { click: () => setSubroute('spaced-repetition') }
    }, [`+ ${srDue.length - 3} more`]),
  ]) : null;

  // Active commitments (Thaler — commitment devices)
  const commitments = activeCommitments();
  const commitmentSection = commitments.length > 0 ? el('div', { class: 'card' }, [
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
        el('div', { class: 'list-item-icon', style: { fontSize: '20px' } }, ['🔒']),
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [c.actionName]),
          el('div', { class: 'list-item-sub' }, [
            `${c.stake} pts staked · `,
            daysLeft <= 0 ? 'due TODAY' : `${daysLeft}d left`,
          ]),
        ]),
      ]);
    })),
  ]) : null;

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
    // Loss aversion nudge (Kahneman): show what's at stake
    (() => {
      const streak = currentStreak();
      const remaining = prog.due - prog.done - prog.floor;
      if (streak >= 3 && remaining > 0 && prog.due > 0) {
        return el('div', { class: 'card card--pad-sm mb-3', style: { borderColor: 'var(--c-accent)' } }, [
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
      return null;
    })(),
    ...sections,
    srSection,
    commitmentSection,
    reflection,
  ]);
}

function actionRow(action, day, key) {
  const v = day.habits[action.id] || null;
  const isDone = v === 'full' || v === 'rest';
  const isFloor = v === 'floor';
  // Temptation bundling (Milkman et al.): show bundle if linked
  const bundles = activeBundles().filter((b) => b.actionId === action.id);
  return el('div', { class: 'list-item list-item--interactive', on: { click: () => toggle(action, key) } }, [
    el('div', { class: `check ${isDone ? 'check--done' : isFloor ? 'check--floor' : ''}` }, [isDone ? '✓' : isFloor ? '½' : '']),
    el('div', { class: 'list-item-body' }, [
      el('div', { class: 'list-item-title' }, [action.icon ? `${action.icon} ` : '', action.name]),
      // Implementation intention: "After X → do Y" (Gollwitzer's if-then planning)
      action.implementationIntention && !isDone && el('div', { class: 'list-item-sub', style: { fontStyle: 'italic', opacity: '0.8' } }, [
        '🔗 ', action.cue, ' → ', action.response,
      ]),
      // Temptation bundle (Milkman): "🎧 Only X during Y"
      bundles.length > 0 && !isDone && el('div', { class: 'list-item-sub', style: { color: 'var(--c-accent)' } }, [
        '🎧 Bundle: only ', bundles[0].want, ' during ', bundles[0].should,
      ]),
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
