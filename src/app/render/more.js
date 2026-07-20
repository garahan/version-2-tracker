// ============================================================
// Life OS v2 — More hub
// Secondary navigation to Inbox, Decisions, Opportunities,
// Lessons, Risks, Settings.
// ============================================================

import { el } from '../dom.js';
import { getState } from '../state.js';
import { go } from '../main.js';

const ITEMS = [
  { id: 'inbox',        label: 'Inbox',         icon: '📥', desc: 'Capture · clarify · schedule · archive', render: () => import('./inbox.js').then(m => m.renderInbox()) },
  { id: 'decisions',    label: 'Decisions',     icon: '⚖️', desc: 'Journal · library · pre-mortem',          render: () => import('./decisions.js').then(m => m.renderDecisions()) },
  { id: 'opportunities',label: 'Opportunities', icon: '🔮', desc: 'Pipeline of possibilities',               render: () => import('./opportunities.js').then(m => m.renderOpportunities()) },
  { id: 'lessons',      label: 'Lessons',       icon: '🎓', desc: 'Lessons learned · error log',             render: () => import('./lessons.js').then(m => m.renderLessons()) },
  { id: 'risks',        label: 'Risks',         icon: '🛡️', desc: 'Risk register · protocols · anti-goals · optionality', render: () => import('./risks.js').then(m => m.renderRisks()) },
  { id: 'settings',     label: 'Settings',      icon: '⚙️', desc: 'Theme · sync · data · reset',             render: () => import('./settings.js').then(m => m.renderSettings()) },
];

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
      el('div', { class: 'list-item list-item--interactive', on: { click: () => openItem(item) } }, [
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

function openItem(item) {
  // Render into the content host directly via the router's content slot
  const host = document.getElementById('content-host');
  if (!host) return;
  // Show loading
  while (host.firstChild) host.removeChild(host.firstChild);
  host.appendChild(el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['⋯'])]));
  item.render().then((node) => {
    while (host.firstChild) host.removeChild(host.firstChild);
    host.appendChild(node);
    // Add a back button at the top
    const back = el('button', { class: 'btn btn--ghost btn--sm', style: { marginBottom: '12px' }, on: { click: () => window.__lifeosRerender?.() } }, ['← Back']);
    host.insertBefore(back, host.firstChild);
    window.scrollTo({ top: 0 });
  });
}
