// ============================================================
// Life OS v2 — More hub
// Secondary navigation to Inbox, Decisions, Opportunities,
// Lessons, Risks, Settings. Uses subroute system in main.js.
// ============================================================

import { el } from '../dom.js';
import { getState } from '../state.js';
import { setSubroute } from '../main.js';

const ITEMS = [
  { id: 'inbox',        label: 'Inbox',         icon: '📥', desc: 'Capture · clarify · schedule · archive', render: () => import('./inbox.js').then(m => m.renderInbox()) },
  { id: 'decisions',    label: 'Decisions',     icon: '⚖️', desc: 'Journal · library · pre-mortem',          render: () => import('./decisions.js').then(m => m.renderDecisions()) },
  { id: 'opportunities',label: 'Opportunities', icon: '🔮', desc: 'Pipeline of possibilities',               render: () => import('./opportunities.js').then(m => m.renderOpportunities()) },
  { id: 'lessons',      label: 'Lessons',       icon: '🎓', desc: 'Lessons learned · error log',             render: () => import('./lessons.js').then(m => m.renderLessons()) },
  { id: 'risks',        label: 'Risks',         icon: '🛡️', desc: 'Risk register · protocols · anti-goals · optionality', render: () => import('./risks.js').then(m => m.renderRisks()) },
  { id: 'settings',     label: 'Settings',      icon: '⚙️', desc: 'Theme · sync · data · reset',             render: () => import('./settings.js').then(m => m.renderSettings()) },
];

export const MORE_ITEMS = ITEMS;

export function renderMore() {
  const s = getState();
  const counts = {
    inbox: (s.inbox || []).filter(i => i.status !== 'archived').length,
    decisions: (s.decisions || []).length,
    opportunities: (s.opportunities || []).length,
    lessons: (s.lessonsLearned || []).length,
    risks: (s.risks || []).length,
  };

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['More']),
      el('div', { class: 'app-subtitle' }, ['Inbox · decisions · opportunities · lessons · risks · settings']),
    ]),

    el('div', { class: 'list' }, ITEMS.map((item) =>
      el('div', { class: 'list-item list-item--interactive', on: { click: () => setSubroute(item.id) } }, [
        el('div', { class: 'list-item-icon', style: { fontSize: '20px' } }, [item.icon]),
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [item.label]),
          el('div', { class: 'list-item-sub' }, [item.desc]),
        ]),
        counts[item.id] > 0 && el('span', { class: 'chip' }, [String(counts[item.id])]),
        el('span', { class: 'list-item-action' }, ['›']),
      ])
    )),

    el('div', { class: 'text-center text-mute mt-6', style: { fontSize: 'var(--fs-xs)' } }, [
      'Life OS v2 · ', `v${s.version.toFixed(2)}`,
    ]),
  ]);
}

/** Render a subroute view with a back button. */
export async function renderSubroute(id) {
  const item = ITEMS.find((i) => i.id === id);
  if (!item) return null;
  const node = await item.render();
  // Wrap with back button
  const back = el('button', {
    class: 'btn btn--ghost btn--sm',
    style: { marginBottom: '12px' },
    on: { click: () => setSubroute(null) }
  }, ['← Back']);
  const wrap = el('div', {}, [back, node]);
  return wrap;
}
