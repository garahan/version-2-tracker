// ============================================================
// Life OS v3 — Domains (v3 §9)
// Hierarchy: Foundation → Executive → Capital → Strategy → Legacy
// Expand → Choose Domain → Bottom Sheet with universal card.
// ============================================================

import { el } from '../dom.js';
import { LAYERS, LAYER_ORDER, LEVELS, allDomains, domainsByLayer, getDomain } from '../data/domains.js';
import { getState, update } from '../state.js';
import { sheet, toast } from '../ui.js';
import { cadenceLabel } from '../cadence.js';

export function renderDomains() {
  const s = getState();
  return el('div', { class: 'page' }, [
    el('div', { class: 'app-title' }, ['Domains']),
    el('div', { class: 'app-subtitle' }, ['22 systems · 3 layers']),
    ...LAYER_ORDER.map(layerId => renderLayer(layerId, s)),
  ]);
}

function renderLayer(layerId, s) {
  const layer = LAYERS[layerId];
  const domains = domainsByLayer(layerId);
  return el('div', { class: 'domain-tree-layer', style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: `domain-tree-head domain-tree-head--${layerId}`, dataset: { layer: layerId }, on: { click: (e) => toggleLayer(e) } }, [
      el('span', {}, [layer.icon]),
      el('div', { class: 'domain-tree-layer-name' }, [layer.name]),
      el('span', { class: 'domain-tree-layer-count' }, [`${domains.length} domains`]),
      el('span', { class: 'domain-tree-chevron' }, ['›']),
    ]),
    el('div', { class: 'domain-tree-children', id: `layer-${layerId}` }, domains.map(d => renderDomain(d, s))),
  ]);
}

function toggleLayer(e) {
  const head = e.currentTarget;
  const layerId = head.dataset.layer;
  const children = document.getElementById(`layer-${layerId}`);
  if (!children) return;
  const open = children.classList.toggle('domain-tree-children--open');
  head.classList.toggle('domain-tree-head--open', open);
}

function renderDomain(d, s) {
  const userDomain = s.domains[d.id] || d;
  const maturity = userDomain.maturity || 1;
  return el('div', { class: 'domain-tree-domain', on: { click: () => openDomain(d.id) } }, [
    el('div', { class: 'domain-tree-domain-icon' }, [d.icon]),
    el('div', { class: 'domain-tree-domain-body' }, [
      el('div', { class: 'domain-tree-domain-name' }, [d.name]),
      el('div', { class: 'domain-tree-domain-obj clamp-1' }, [d.objective]),
    ]),
    el('div', { class: 'maturity' }, [1,2,3,4,5].map(n =>
      el('div', { class: `maturity-dot ${n <= maturity ? 'maturity-dot--filled' : ''}` })
    )),
  ]);
}

// ---- Domain bottom sheet (v3 §9 — universal card) ----
function openDomain(id) {
  const s = getState();
  const d = s.domains[id] || getDomain(id);
  if (!d) return;
  const body = el('div', {}, [
    section('Objective', true, el('p', { class: 'card-body' }, [d.objective])),
    d.principles?.length && section('Principles', false, list(d.principles)),
    d.leadingIndicators?.length && section('Leading indicators', false, indicators(d.leadingIndicators)),
    d.laggingIndicators?.length && section('Lagging indicators', false, indicators(d.laggingIndicators)),
    d.actions?.length && section(`Actions (${d.actions.length})`, false, actionsList(d.actions)),
    d.trigger && section('Trigger', false, el('p', { class: 'card-body' }, [d.trigger])),
    d.checklist?.length && section('Checklist', false, list(d.checklist)),
    d.sop && section('SOP', false, el('pre', { style: { whiteSpace: 'pre-wrap', fontSize: 'var(--fs-sub)', color: 'var(--c-text-soft)', lineHeight: 'var(--lh-normal)' } }, [d.sop])),
    d.automation?.length && section('Automation', false, list(d.automation)),
    d.riskRegister?.length && section('Risk register', false, d.riskRegister.map(r =>
      el('div', { class: 'list-item' }, [
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [r.risk]),
          el('div', { class: 'list-item-sub' }, ['Mitigation: ' + r.mitigation]),
        ]),
      ])
    )),
    d.killCriteria?.length && section('Kill criteria', false, list(d.killCriteria)),
    d.experiments?.length && section('Experiments', false, d.experiments.map(x =>
      el('div', { class: 'list-item' }, [
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [x.name]),
          el('div', { class: 'list-item-sub' }, ['Status: ' + (x.status || '—')]),
        ]),
      ])
    )),
    d.reviewQuestions?.length && section('Review questions', false, list(d.reviewQuestions)),
    d.dependencies?.length && section('Dependencies', false, list(d.dependencies)),
    d.resources?.length && section('Resources', false, list(d.resources)),
    section('Maturity', true, maturityControl(d.id, d.maturity || 1)),
  ]);
  sheet({ title: `${d.icon} ${d.name}`, body });
}

function section(title, openByDefault, content) {
  return el('div', { class: `sheet-section ${openByDefault ? 'sheet-section--open' : ''}` }, [
    el('div', { class: 'sheet-section-head', on: { click: (e) => {
      const sec = e.currentTarget.parentElement;
      sec.classList.toggle('sheet-section--open');
    } } }, [
      el('div', { style: { fontSize: 'var(--fs-sub)', fontWeight: 'var(--fw-semibold)' } }, [title]),
      el('span', { class: 'sheet-section-chevron' }, ['›']),
    ]),
    el('div', { class: 'sheet-section-body' }, [content]),
  ]);
}

function list(items) {
  return el('ul', {}, items.map(i => el('li', { style: { padding: 'var(--sp-2) 0', fontSize: 'var(--fs-sub)', color: 'var(--c-text-soft)', borderBottom: '1px solid var(--c-border)' } }, ['• ', i])));
}

function indicators(items) {
  return el('div', {}, items.map(i =>
    el('div', { class: 'list-item' }, [
      el('div', { class: 'list-item-body' }, [
        el('div', { class: 'list-item-title' }, [i.name]),
        el('div', { class: 'list-item-sub' }, [
          i.target != null ? `Target: ${i.target}${i.unit ? ' ' + i.unit : ''}` : '',
          i.cadence ? ` · ${cadenceLabel(i.cadence)}` : '',
        ]),
      ]),
    ])
  ));
}

function actionsList(actions) {
  return el('div', {}, actions.map(a =>
    el('div', { class: 'list-item' }, [
      el('div', { class: 'list-item-icon' }, [a.icon || '•']),
      el('div', { class: 'list-item-body' }, [
        el('div', { class: 'list-item-title' }, [a.name]),
        el('div', { class: 'list-item-sub' }, [
          cadenceLabel(a.cadence),
          a.floor ? ` · Floor: ${a.floor}` : '',
          a.estMins ? ` · ${a.estMins}m` : '',
        ]),
      ]),
    ])
  ));
}

function maturityControl(domainId, current) {
  return el('div', { class: 'flex gap-2' }, [1,2,3,4,5].map(n =>
    el('button', {
      class: `btn ${n === current ? 'btn--primary' : 'btn--ghost'} btn--sm`,
      on: { click: () => {
        update(st => { if (!st.domains[domainId]) st.domains[domainId] = { ...getDomain(domainId) }; st.domains[domainId].maturity = n; });
        toast(`Maturity set to L${n}`);
      } }
    }, [`L${n}`])
  ));
}
