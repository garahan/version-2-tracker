// ============================================================
// Life OS v2 — Domains (expandable tree / mind map style)
// 3 layers, expandable, bottom sheet for Management Card.
// ============================================================

import { el } from '../dom.js';
import { getState, getDomain, updateDomain } from '../state.js';
import { DOMAINS_BY_LAYER, LAYERS, CADENCE } from '../data/domains.js';
import { openSheet, closeSheet, toast } from '../ui.js';

export function renderDomains() {
  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Domains']),
      el('div', { class: 'app-subtitle' }, ['15 systems · 3 layers']),
    ]),
    ...DOMAINS_BY_LAYER.map(({ layer, domains }) =>
      domainTreeLayer(layer, domains)
    ),
  ]);
}

function domainTreeLayer(layer, domains) {
  let open = false;
  const head = el('div', { class: 'domain-tree-head', on: { click: () => toggle() } }, [
    el('span', { style: { fontSize: '20px' } }, [layer.icon]),
    el('span', {}, [layer.name]),
    el('span', { class: 'domain-tree-chevron' }, ['›']),
  ]);
  const childrenWrap = el('div', { class: 'domain-tree-children' }, [
    ...domains.map((d) => domainTreeDomain(d)),
  ]);
  const section = el('div', { class: 'domain-tree-layer' }, [head, childrenWrap]);

  function toggle() {
    open = !open;
    head.classList.toggle('domain-tree-head--open', open);
    childrenWrap.classList.toggle('domain-tree-children--open', open);
  }
  // Default: operating layer open, others closed
  if (layer.id === 'operating') toggle();

  return section;
}

function domainTreeDomain(d) {
  const state = getState().domains[d.id] || d;
  return el('div', { class: 'domain-tree-domain', on: { click: () => openDomain(d.id) } }, [
    el('span', { style: { fontSize: '18px' } }, [d.icon]),
    el('div', { style: { flex: 1 } }, [
      el('div', { style: { fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)' } }, [d.name]),
      el('div', { style: { fontSize: 'var(--fs-meta)', color: 'var(--c-text-mute)' } }, [d.objective]),
    ]),
    el('span', { class: `chip chip--${d.color}`, style: { fontSize: 'var(--fs-meta)' } }, [`L${state.maturity}`]),
  ]);
}

function openDomain(id) {
  const d = getDomain(id);
  openSheet(domainSheet(d), { title: `${d.icon} ${d.name}` });
}

function domainSheet(d) {
  const state = getState().domains[d.id] || d;
  return el('div', {}, [
    // Objective
    collapsibleSection('Objective', [
      el('p', { class: 'text-sm', style: { lineHeight: 'var(--lh-normal)' } }, [d.objective]),
    ], true), // open by default

    // Leading indicators
    d.leadingIndicators?.length && collapsibleSection('Leading Indicators', [
      el('ul', { class: 'text-sm', style: { paddingLeft: 'var(--sp-6)' } }, d.leadingIndicators.map(i => el('li', {}, [i]))),
    ]),

    // Lagging indicators
    d.laggingIndicators?.length && collapsibleSection('Lagging Indicators', [
      el('ul', { class: 'text-sm', style: { paddingLeft: 'var(--sp-6)' } }, d.laggingIndicators.map(i => el('li', {}, [i]))),
    ]),

    // Actions
    d.actions?.length && collapsibleSection(`Actions · ${d.actions.length}`, [
      el('div', { class: 'list' }, d.actions.map(a => el('div', { class: 'list-item' }, [
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [`${a.icon || ''} ${a.name}`]),
          el('div', { class: 'list-item-sub' }, [
            CADENCE[a.cadence] || a.cadence,
            a.floor ? ` · Floor: ${a.floor}` : '',
          ]),
        ]),
      ]))),
    ]),

    // SOP
    d.sop && collapsibleSection('SOP', [
      el('pre', { class: 'text-sm', style: { whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', lineHeight: 'var(--lh-normal)' } }, [d.sop]),
    ]),

    // Risk register
    d.riskRegister?.length && collapsibleSection('Risks', [
      el('ul', { class: 'text-sm', style: { paddingLeft: 'var(--sp-6)' } }, d.riskRegister.map(r => el('li', {}, [r]))),
    ]),

    // Kill criteria
    d.killCriteria?.length && collapsibleSection('Kill Criteria', [
      el('ul', { class: 'text-sm', style: { paddingLeft: 'var(--sp-6)' } }, d.killCriteria.map(k => el('li', {}, [k]))),
    ]),

    // Review questions
    d.reviewQuestions?.length && collapsibleSection('Review Questions', [
      el('ul', { class: 'text-sm', style: { paddingLeft: 'var(--sp-6)' } }, d.reviewQuestions.map(q => el('li', {}, [q]))),
    ]),

    // Maturity
    collapsibleSection(`Maturity · L${state.maturity}`, [
      el('div', { class: 'flex gap-2' }, [1,2,3,4,5].map(lvl =>
        el('button', {
          class: `btn btn--sm ${state.maturity === lvl ? 'btn--primary' : 'btn--ghost'}`,
          on: { click: () => { updateDomain(d.id, { maturity: lvl }); toast('Maturity updated'); } }
        }, [`L${lvl}`])
      )),
    ]),
  ]);
}

/**
 * Collapsible section for Management Card sheet.
 * Auto-saves — no Save/Cancel buttons.
 */
function collapsibleSection(title, children, openByDefault = false) {
  let open = openByDefault;
  const head = el('div', { class: `sheet-section-head ${open ? 'sheet-section--open' : ''}`, on: { click: () => toggle() } }, [
    el('span', {}, [title]),
    el('span', { class: 'sheet-section-chevron' }, ['›']),
  ]);
  const body = el('div', { class: `sheet-section-body ${open ? 'sheet-section--open' : ''}` }, children);
  const section = el('div', { class: 'sheet-section' }, [head, body]);

  function toggle() {
    open = !open;
    head.classList.toggle('sheet-section--open', open);
    body.classList.toggle('sheet-section--open', open);
  }
  return section;
}
