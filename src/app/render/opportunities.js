// ============================================================
// Life OS v3 — Opportunity Engine (v3 §13)
// Kanban: Open → Exploring → Active → Waiting → Won → Lost.
// Each stores: Upside, Downside, Probability, Expected Value,
// Leverage, Time Cost.
// ============================================================

import { el } from '../dom.js';
import { getState, update } from '../state.js';
import { todayKey, uid } from '../util.js';
import { toast, prompt } from '../ui.js';
import { go } from '../main.js';

const STAGES = ['open', 'exploring', 'active', 'waiting', 'won', 'lost'];

export function renderOpportunities() {
  const s = getState();
  const opps = s.opportunities || [];

  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['Opportunities']),
    el('div', { class: 'app-subtitle' }, ['Pipeline of possibilities']),

    el('button', { class: 'btn btn--primary btn--block', style: { marginTop: 'var(--sp-4)' }, on: { click: addOpportunity } }, ['+ New opportunity']),

    el('div', { class: 'kanban', style: { marginTop: 'var(--sp-4)' } }, STAGES.map(stage => {
      const items = opps.filter(o => (o.status || 'open') === stage);
      return el('div', { class: 'kanban-col' }, [
        el('div', { class: 'kanban-col-head' }, [
          el('span', {}, [stage.charAt(0).toUpperCase() + stage.slice(1)]),
          el('span', { class: 'chip' }, [String(items.length)]),
        ]),
        ...items.map(o => el('div', { class: 'kanban-card' }, [
          el('div', { style: { fontSize: 'var(--fs-sub)', fontWeight: 'var(--fw-semibold)' } }, [o.name]),
          el('div', { class: 'text-mute text-meta mt-2' }, [
            o.upside ? `↑ ${o.upside} · ` : '',
            o.probability != null ? `${Math.round(o.probability * 100)}% · ` : '',
            o.timeCost ? `${o.timeCost}h` : '',
          ]),
          el('div', { class: 'flex gap-2 mt-3' }, [
            el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => advance(o.id) } }, ['→']),
            el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => remove(o.id) } }, ['×']),
          ]),
        ])),
      ]);
    })),
  ]);
}

async function addOpportunity() {
  const name = await prompt({ title: 'New opportunity', label: 'What is it?', placeholder: 'e.g. Job at startup X' });
  if (!name) return;
  const upside = await prompt({ title: 'Upside', label: 'Potential upside (currency or description)', placeholder: '50000' });
  const probability = parseInt(await prompt({ title: 'Probability', label: 'Probability % (0-100)', placeholder: '30', initial: '30' }) || '30', 10);
  update(st => {
    st.opportunities.push({
      id: uid('opp'), name,
      upside: upside || '', downside: '',
      probability: (probability || 30) / 100,
      expectedValue: '', leverage: '', timeCost: '',
      status: 'open', created: todayKey(),
    });
  });
  toast('Opportunity added');
}

function advance(id) {
  update(st => {
    const o = st.opportunities.find(x => x.id === id);
    if (!o) return;
    const cur = STAGES.indexOf(o.status || 'open');
    o.status = STAGES[(cur + 1) % STAGES.length];
  });
}

function remove(id) {
  update(st => { st.opportunities = st.opportunities.filter(o => o.id !== id); });
}
