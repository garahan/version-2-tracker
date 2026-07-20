// ============================================================
// Life OS v2 — Risks, Resilience, Anti-Goals, Optionality
// ============================================================

import { el } from '../dom.js';
import { getState, addRecord, removeRecord, setState } from '../state.js';
import { toast, openModal, closeModal, confirmDialog } from '../ui.js';
import { todayKey, fmtDate } from '../util.js';

export function renderRisks() {
  const s = getState();
  const risks = s.risks || [];
  const protocols = s.resilienceProtocols || [];
  const antiGoals = s.antiGoals || [];

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Risks & Resilience']),
      el('div', { class: 'app-subtitle' }, ['Risk register · protocols · anti-goals · optionality']),
    ]),

    // Anti-goals
    el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, [`Anti-goals · ${antiGoals.length}`]),
      el('button', { class: 'section-action', on: { click: newAntiGoal } }, ['+ Add']),
    ]),
    antiGoals.length === 0
      ? el('div', { class: 'empty mb-6' }, [el('div', { class: 'empty-icon' }, ['🚫']), el('div', { class: 'empty-title' }, ['No anti-goals']), el('div', { class: 'empty-body' }, ['What will you NEVER do?'])])
      : el('div', { class: 'list mb-6' }, antiGoals.map(antiGoalRow)),

    // Risk register
    el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, [`Risk register · ${risks.length}`]),
      el('button', { class: 'section-action', on: { click: newRisk } }, ['+ Add']),
    ]),
    risks.length === 0
      ? el('div', { class: 'empty mb-6' }, [el('div', { class: 'empty-icon' }, ['⚠️']), el('div', { class: 'empty-title' }, ['No risks logged']), el('div', { class: 'empty-body' }, ['What could destroy the system?'])])
      : el('div', { class: 'list mb-6' }, risks.map(riskRow)),

    // Resilience protocols
    el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, [`Resilience protocols · ${protocols.length}`]),
      el('button', { class: 'section-action', on: { click: newProtocol } }, ['+ Add']),
    ]),
    protocols.length === 0
      ? el('div', { class: 'empty mb-6' }, [el('div', { class: 'empty-icon' }, ['🛡️']), el('div', { class: 'empty-title' }, ['No protocols']), el('div', { class: 'empty-body' }, ['Pre-written checklists for rare critical events.'])])
      : el('div', { class: 'list mb-6' }, protocols.map(protocolRow)),

    // Optionality tracker
    el('div', { class: 'section-head' }, [el('div', { class: 'section-title' }, ['Optionality tracker'])]),
    optionalityCard(s),
  ]);
}

function antiGoalRow(a) {
  return el('div', { class: 'card' }, [
    el('div', { class: 'flex items-center justify-between mb-2' }, [
      el('div', { class: 'card-title' }, ['🚫 ', a.rule]),
      el('button', { class: 'btn btn--ghost btn--icon', on: { click: async () => {
        if (await confirmDialog({ title: 'Delete?', confirmText: 'Delete', danger: true })) {
          removeRecord('antiGoals', a.id);
          rerender();
        }
      } } }, ['×']),
    ]),
    a.why && el('div', { class: 'text-sm text-soft' }, [a.why]),
    el('div', { class: 'mt-2' }, [el('span', { class: `chip ${a.enforced === 'always' ? 'chip--accent' : ''}` }, [a.enforced || 'always'])]),
  ]);
}

function riskRow(r) {
  const score = (r.likelihood || 1) * (r.impact || 1);
  const level = score >= 16 ? 'chip--missed' : score >= 8 ? 'chip--floor' : 'chip--done';
  return el('div', { class: 'card' }, [
    el('div', { class: 'flex items-center justify-between mb-2' }, [
      el('div', { class: 'card-title' }, [r.risk]),
      el('span', { class: `chip ${level}` }, [`L${r.likelihood || 1}×I${r.impact || 1}`]),
    ]),
    r.domain && el('div', { class: 'text-xs text-mute mb-2' }, [r.domain]),
    r.mitigation && el('div', { class: 'text-sm text-soft' }, [`Mitigation: ${r.mitigation}`]),
    el('div', { class: 'flex justify-end mt-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm btn--icon', on: { click: async () => {
        if (await confirmDialog({ title: 'Delete?', confirmText: 'Delete', danger: true })) {
          removeRecord('risks', r.id);
          rerender();
        }
      } } }, ['×']),
    ]),
  ]);
}

function protocolRow(p) {
  return el('div', { class: 'card' }, [
    el('div', { class: 'flex items-center justify-between mb-2' }, [
      el('div', { class: 'card-title' }, ['🛡️ ', p.trigger]),
      el('button', { class: 'btn btn--ghost btn--icon', on: { click: async () => {
        if (await confirmDialog({ title: 'Delete?', confirmText: 'Delete', danger: true })) {
          removeRecord('resilienceProtocols', p.id);
          rerender();
        }
      } } }, ['×']),
    ]),
    el('ol', { class: 'list mt-2' }, (p.checklist || []).map((step, i) =>
      el('li', { class: 'list-item' }, [
        el('div', { class: 'list-item-icon', style: { fontSize: '12px', fontWeight: '700' } }, [String(i + 1)]),
        el('div', { class: 'list-item-body' }, [el('div', { class: 'text-sm' }, [step])]),
      ])
    )),
  ]);
}

function optionalityCard(s) {
  const o = s.optionality || {};
  return el('div', { class: 'card' }, [
    el('div', { class: 'bento' }, [
      optCell('Runway', `${o.runwayMonths || 0}m`, 'months without income'),
      optCell('Income sources', String(o.incomeSources || 0), 'distinct streams'),
      optCell('Scarce skills', String((o.scarceSkills || []).length), 'high-leverage'),
      optCell('Countries', String((o.countries || []).length), 'can live & work'),
      optCell('Strong contacts', String(o.strongContacts || 0), '50+ trusted'),
      optCell('Indep. projects', String((o.independentProjects || []).length), 'revenue-capable'),
    ]),
    el('div', { class: 'flex justify-end mt-3' }, [
      el('button', { class: 'btn btn--sm', on: { click: editOptionality } }, ['Edit']),
    ]),
  ]);
}

function optCell(label, value, sub) {
  return el('div', { class: 'bento-cell' }, [
    el('div', { class: 'stat-label' }, [label]),
    el('div', { class: 'stat-value', style: { fontSize: 'var(--fs-xl)' } }, [value]),
    el('div', { class: 'text-xs text-mute mt-2' }, [sub]),
  ]);
}

function editOptionality() {
  const s = getState();
  const o = s.optionality || {};
  const runway = el('input', { class: 'field-input', type: 'number', value: String(o.runwayMonths || 0) });
  const income = el('input', { class: 'field-input', type: 'number', value: String(o.incomeSources || 0) });
  const contacts = el('input', { class: 'field-input', type: 'number', value: String(o.strongContacts || 0) });
  const skills = el('textarea', { class: 'field-textarea' }, [(o.scarceSkills || []).join('\n')]);
  const countries = el('textarea', { class: 'field-textarea' }, [(o.countries || []).join('\n')]);
  const projects = el('textarea', { class: 'field-textarea' }, [(o.independentProjects || []).join('\n')]);

  const body = el('div', {}, [
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Runway (months)']), runway]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Income sources']), income]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Strong contacts']), contacts]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Scarce skills (one per line)']), skills]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Countries (one per line)']), countries]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Independent projects (one per line)']), projects]),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        setState((st) => {
          st.optionality = {
            runwayMonths: Number(runway.value) || 0,
            incomeSources: Number(income.value) || 0,
            strongContacts: Number(contacts.value) || 0,
            scarceSkills: skills.value.split('\n').map(s => s.trim()).filter(Boolean),
            countries: countries.value.split('\n').map(s => s.trim()).filter(Boolean),
            independentProjects: projects.value.split('\n').map(s => s.trim()).filter(Boolean),
          };
        });
        toast('Optionality updated');
        closeModal();
        rerender();
      } } }, ['Save']),
    ]),
  ]);
  openModal(body);
}

function newAntiGoal() {
  const rule = el('input', { class: 'field-input', placeholder: 'What will you NEVER do?' });
  const why = el('input', { class: 'field-input', placeholder: 'Why? (the cost of doing it)' });
  const enforced = el('select', { class: 'field-input' }, [
    el('option', { value: 'always' }, ['Always']),
    el('option', { value: 'event' }, ['Event-triggered']),
  ]);
  const body = el('div', {}, [
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Rule']), rule]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Why']), why]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Enforced']), enforced]),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        if (!rule.value.trim()) return;
        addRecord('antiGoals', { rule: rule.value.trim(), why: why.value.trim(), enforced: enforced.value, date: todayKey() });
        toast('Anti-goal added');
        closeModal();
        rerender();
      } } }, ['Add']),
    ]),
  ]);
  openModal(body);
}

function newRisk() {
  const risk = el('input', { class: 'field-input', placeholder: 'What could go wrong?' });
  const domain = el('input', { class: 'field-input', placeholder: 'Domain (e.g. finance, health)' });
  const likelihood = el('select', { class: 'field-input' }, [1,2,3,4,5].map(n => el('option', { value: n }, [String(n)])));
  const impact = el('select', { class: 'field-input' }, [1,2,3,4,5].map(n => el('option', { value: n }, [String(n)])));
  const mitigation = el('textarea', { class: 'field-textarea', placeholder: 'Mitigation plan' });
  const body = el('div', {}, [
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Risk']), risk]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Domain']), domain]),
    el('div', { class: 'bento bento--3' }, [
      el('div', {}, [el('div', { class: 'field-label' }, ['Likelihood (1-5)']), likelihood]),
      el('div', {}, [el('div', { class: 'field-label' }, ['Impact (1-5)']), impact]),
    ]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Mitigation']), mitigation]),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        if (!risk.value.trim()) return;
        addRecord('risks', { risk: risk.value.trim(), domain: domain.value.trim(), likelihood: Number(likelihood.value), impact: Number(impact.value), mitigation: mitigation.value.trim(), date: todayKey() });
        toast('Risk added');
        closeModal();
        rerender();
      } } }, ['Add']),
    ]),
  ]);
  openModal(body);
}

function newProtocol() {
  const trigger = el('input', { class: 'field-input', placeholder: 'When this happens… (e.g. Job loss)' });
  const steps = el('textarea', { class: 'field-textarea', placeholder: 'Checklist steps (one per line)' });
  const body = el('div', {}, [
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Trigger']), trigger]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Checklist (one per line)']), steps]),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        if (!trigger.value.trim()) return;
        addRecord('resilienceProtocols', { trigger: trigger.value.trim(), checklist: steps.value.split('\n').map(s => s.trim()).filter(Boolean), date: todayKey() });
        toast('Protocol added');
        closeModal();
        rerender();
      } } }, ['Add']),
    ]),
  ]);
  openModal(body);
}

function rerender() { window.__lifeosRerender?.(); }
