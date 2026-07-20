// ============================================================
// Life OS v2 — Domains browser + Management Card view
// ============================================================

import { el, div, span } from '../dom.js';
import { getState, getDomain, updateDomain } from '../state.js';
import { DOMAINS_BY_LEVEL, LEVELS, CADENCE } from '../data/domains.js';
import { openSheet, closeSheet, toast } from '../ui.js';

export function renderDomains() {
  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Domains']),
      el('div', { class: 'app-subtitle' }, ['15 systems · 5 levels']),
    ]),
    ...DOMAINS_BY_LEVEL.map(({ level, domains }) =>
      el('section', { class: 'page-section' }, [
        el('div', { class: 'section-head' }, [
          el('div', { class: 'section-title' }, [`L${level.id} · ${level.name}`]),
        ]),
        ...domains.map((d) => domainRow(d)),
      ])
    ),
  ]);
}

function domainRow(d) {
  const state = getState().domains[d.id] || d;
  return el('div', { class: 'card card--interactive', on: { click: () => openDomain(d.id) } }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon' }, [d.icon]),
      el('div', { style: { flex: 1 } }, [
        el('div', { class: 'card-title' }, [d.name]),
        el('div', { class: 'card-subtitle clamp-2' }, [d.objective]),
      ]),
      el('div', { class: `chip chip--${d.color}` }, [`L${state.maturity}`]),
    ]),
    el('div', { class: 'flex gap-2' }, [
      el('span', { class: 'chip' }, [`${(d.actions || []).length} actions`]),
      d.sop && el('span', { class: 'chip chip--accent' }, ['SOP']),
    ]),
  ]);
}

function openDomain(id) {
  const d = getDomain(id);
  openSheet(domainSheet(d), { title: `${d.icon} ${d.name}` });
}

function domainSheet(d) {
  return el('div', {}, [
    // Objective
    fieldBlock('Objective', d.objective, (v) => updateDomain(d.id, { objective: v })),
    // Maturity
    el('div', { class: 'field' }, [
      el('div', { class: 'field-label' }, ['Maturity']),
      el('div', { class: 'flex gap-2 mt-2' }, [1,2,3,4,5].map((lvl) =>
        el('button', {
          class: `btn btn--sm ${d.maturity === lvl ? 'btn--primary' : ''}`,
          style: { width: '36px' },
          on: { click: () => { updateDomain(d.id, { maturity: lvl }); closeSheet(); openDomain(d.id); toast(`Maturity → L${lvl}`); } }
        }, [String(lvl)])
      )),
      el('div', { class: 'field-help mt-2' }, [maturityLabel(d.maturity)]),
    ]),
    // Principles
    d.principles?.length > 0 && el('div', { class: 'mb-4' }, [
      el('div', { class: 'field-label mb-2' }, ['Principles']),
      el('ul', { class: 'list' }, d.principles.map((p) =>
        el('li', { class: 'list-item' }, [el('span', { class: 'text-sm' }, ['• ', p])])
      )),
    ]),
    // Leading indicators
    d.leadingIndicators?.length > 0 && el('div', { class: 'mb-4' }, [
      el('div', { class: 'field-label mb-2' }, ['Leading indicators']),
      ...d.leadingIndicators.map((li) =>
        el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [li.name]),
            el('div', { class: 'list-item-sub' }, [`${li.target} ${li.unit} · ${CADENCE[li.cadence] || li.cadence}`]),
          ]),
        ])
      ),
    ]),
    // Lagging indicators
    d.laggingIndicators?.length > 0 && el('div', { class: 'mb-4' }, [
      el('div', { class: 'field-label mb-2' }, ['Lagging indicators']),
      ...d.laggingIndicators.map((li) =>
        el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [li.name]),
            el('div', { class: 'list-item-sub' }, [li.unit]),
          ]),
        ])
      ),
    ]),
    // Actions
    d.actions?.length > 0 && el('div', { class: 'mb-4' }, [
      el('div', { class: 'field-label mb-2' }, ['Actions']),
      ...d.actions.map((a) =>
        el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-icon' }, [a.icon || '•']),
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [a.name]),
            el('div', { class: 'list-item-sub' }, [CADENCE[a.cadence] || a.cadence, a.floor ? ` · Floor: ${a.floor}` : '']),
          ]),
          el('div', { class: 'chip' }, [a.cadence]),
        ])
      ),
    ]),
    // SOP
    d.sop && el('div', { class: 'card card--pad-sm mb-4' }, [
      el('div', { class: 'card-title mb-2' }, [`📋 ${d.sop.title}`]),
      el('div', { class: 'text-xs text-mute mb-2' }, [`${d.sop.when} · ${d.sop.duration}`]),
      el('ol', { class: 'list' }, d.sop.steps.map((step, i) =>
        el('li', { class: 'list-item' }, [
          el('div', { class: 'list-item-icon', style: { fontSize: '12px', fontWeight: '700' } }, [String(i + 1)]),
          el('div', { class: 'list-item-body' }, [el('div', { class: 'text-sm' }, [step])]),
        ])
      )),
    ]),
    // Risk register
    d.riskRegister?.length > 0 && el('div', { class: 'mb-4' }, [
      el('div', { class: 'field-label mb-2' }, ['Risk register']),
      ...d.riskRegister.map((r) =>
        el('div', { class: 'card card--pad-sm card--flat' }, [
          el('div', { class: 'text-sm font-semibold' }, [r.risk]),
          el('div', { class: 'text-xs text-mute mt-2' }, [r.mitigation]),
        ])
      ),
    ]),
    // Kill criteria
    d.killCriteria?.length > 0 && el('div', { class: 'mb-4' }, [
      el('div', { class: 'field-label mb-2' }, ['Kill criteria']),
      el('ul', { class: 'list' }, d.killCriteria.map((k) =>
        el('li', { class: 'list-item' }, [el('span', { class: 'text-sm' }, ['✂️ ', k])])
      )),
    ]),
    // Review questions
    d.reviewQuestions?.length > 0 && el('div', { class: 'mb-4' }, [
      el('div', { class: 'field-label mb-2' }, ['Review questions']),
      el('ul', { class: 'list' }, d.reviewQuestions.map((q) =>
        el('li', { class: 'list-item' }, [el('span', { class: 'text-sm' }, ['? ', q])])
      )),
    ]),
  ].filter(Boolean));
}

function maturityLabel(lvl) {
  return ({
    1: 'L1 — Chaos. No system.',
    2: 'L2 — List. Tasks written down.',
    3: 'L3 — Process. Repeatable.',
    4: 'L4 — Metrics. KPIs tracked.',
    5: 'L5 — Auto-improve. System upgrades itself.',
  })[lvl] || '';
}

function fieldBlock(label, value, onSave) {
  const ta = el('textarea', { class: 'field-textarea' }, [value || '']);
  return el('div', { class: 'field' }, [
    el('div', { class: 'field-label' }, [label]),
    ta,
    el('div', { class: 'flex gap-2 mt-2' }, [
      el('button', { class: 'btn btn--sm btn--primary', on: { click: () => { onSave(ta.value); toast('Saved'); } } }, ['Save']),
    ]),
  ]);
}
