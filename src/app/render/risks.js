// ============================================================
// Life OS v3 — Risk Engine (v3 §16)
// Risk register, resilience protocols, anti-goals, optionality.
// ============================================================

import { el } from '../dom.js';
import { getState, update } from '../state.js';
import { todayKey, uid } from '../util.js';
import { toast, prompt } from '../ui.js';
import { go } from '../main.js';

export function renderRisks() {
  const s = getState();
  const risks = s.risks || [];
  const antiGoals = s.antiGoals || [];
  const protocols = s.resilienceProtocols || [];
  const blackSwans = s.blackSwans || [];
  const opt = s.optionality || {};

  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['Risks']),
    el('div', { class: 'app-subtitle' }, ['Register · protocols · anti-goals · optionality']),

    // Risk register
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-4)' } }, [
      el('div', { class: 'section-title' }, [`Risk register (${risks.length})`]),
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: addRisk } }, ['+']),
    ]),
    el('div', { class: 'card' }, risks.length === 0
      ? [el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['🛡️']), el('div', { class: 'empty-title' }, ['No risks logged'])])]
      : risks.map(r => el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [r.risk]),
            el('div', { class: 'list-item-sub' }, [
              r.likelihood != null ? `Likelihood: ${r.likelihood}/5 · ` : '',
              r.impact != null ? `Impact: ${r.impact}/5 · ` : '',
              r.mitigation || '',
            ]),
          ]),
          el('span', { class: `chip ${(r.likelihood || 0) * (r.impact || 0) >= 12 ? 'chip--danger' : (r.likelihood || 0) * (r.impact || 0) >= 6 ? 'chip--attention' : 'chip--healthy'}` }, [String((r.likelihood || 0) * (r.impact || 0))]),
        ]))
    ),

    // Anti-goals
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, [`Anti-goals (${antiGoals.length})`]),
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: addAntiGoal } }, ['+']),
    ]),
    el('div', { class: 'card' }, antiGoals.length === 0
      ? [el('div', { class: 'empty' }, [el('div', { class: 'empty-title' }, ['No anti-goals'])])]
      : antiGoals.map(g => el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [el('div', { class: 'list-item-title' }, [g.text || g])]),
          el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => update(st => { st.antiGoals = st.antiGoals.filter(x => (x.id || x) !== (g.id || g)); }) } }, ['×']),
        ]))
    ),

    // Resilience protocols
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, [`Resilience protocols (${protocols.length})`]),
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: addProtocol } }, ['+']),
    ]),
    el('div', { class: 'card' }, protocols.length === 0
      ? [el('div', { class: 'empty' }, [el('div', { class: 'empty-title' }, ['No protocols'])])]
      : protocols.map(p => el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [p.name]),
            el('div', { class: 'list-item-sub' }, [p.steps || '']),
          ]),
        ]))
    ),

    // Black Swan Plans (v3 §16)
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, [`Black swan plans (${blackSwans.length})`]),
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: addBlackSwan } }, ['+']),
    ]),
    el('div', { class: 'card' }, blackSwans.length === 0
      ? [el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['🦢']), el('div', { class: 'empty-title' }, ['No black swan plans']), el('div', { class: 'text-mute text-meta', style: { marginTop: 'var(--sp-2)' } }, ['Low-probability, high-impact events with pre-written response plans'])])]
      : blackSwans.map(bs => el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [bs.event]),
            el('div', { class: 'list-item-sub' }, [bs.plan || '']),
            el('div', { class: 'text-meta', style: { marginTop: 'var(--sp-1)' } }, [
              `Trigger: ${bs.trigger || '—'} · Reviewed: ${bs.lastReviewed || 'never'}`,
            ]),
          ]),
          el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => update(st => { st.blackSwans = st.blackSwans.filter(x => x.id !== bs.id); }) } }, ['×']),
        ]))
    ),

    // Optionality (v3 §16)
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, ['Optionality']),
    ]),
    el('div', { class: 'card' }, [
      optRow('Runway (months)', opt.runwayMonths || 0),
      optRow('Income sources', opt.incomeSources || 0),
      optRow('Strong contacts', opt.strongContacts || 0),
      optRow('Scarce skills', (opt.scarceSkills || []).length),
      optRow('Countries', (opt.countries || []).length),
      optRow('Independent projects', (opt.independentProjects || []).length),
    ]),
  ]);
}

function optRow(label, value) {
  return el('div', { class: 'ns-metric' }, [
    el('div', { class: 'ns-metric-body' }, [el('div', { class: 'ns-metric-label' }, [label])]),
    el('div', { class: 'ns-metric-value' }, [String(value)]),
  ]);
}

async function addRisk() {
  const risk = await prompt({ title: 'Risk', label: 'What could go wrong?', placeholder: '...' });
  if (!risk) return;
  const likelihood = parseInt(await prompt({ title: 'Likelihood', label: 'Likelihood (1-5)', initial: '3' }) || '3', 10);
  const impact = parseInt(await prompt({ title: 'Impact', label: 'Impact (1-5)', initial: '3' }) || '3', 10);
  const mitigation = await prompt({ title: 'Mitigation', label: 'Mitigation?', placeholder: '...' });
  update(st => {
    st.risks.push({ id: uid('rsk'), risk, likelihood, impact, mitigation: mitigation || '', status: 'open', created: todayKey() });
  });
  toast('Risk added');
}

async function addAntiGoal() {
  const text = await prompt({ title: 'Anti-goal', label: 'What will you NEVER do?', placeholder: 'e.g. Work for a toxic boss' });
  if (!text) return;
  update(st => { st.antiGoals.push({ id: uid('ag'), text }); });
  toast('Anti-goal added');
}

async function addProtocol() {
  const name = await prompt({ title: 'Protocol name', label: 'e.g. Job loss protocol', placeholder: '...' });
  if (!name) return;
  const steps = await prompt({ title: 'Steps', label: 'Pre-written steps', placeholder: '...' });
  update(st => { st.resilienceProtocols.push({ id: uid('rp'), name, steps: steps || '' }); });
  toast('Protocol added');
}

async function addBlackSwan() {
  const event = await prompt({ title: 'Black swan event', label: 'What low-probability, high-impact event?', placeholder: 'e.g. Pandemic, market crash, health crisis' });
  if (!event) return;
  const trigger = await prompt({ title: 'Trigger', label: 'What signal tells you it\'s happening?', placeholder: 'e.g. S&P drops 10% in a day' });
  const plan = await prompt({ title: 'Response plan', label: 'Pre-written steps you\'d take', placeholder: '...' });
  update(st => {
    if (!st.blackSwans) st.blackSwans = [];
    st.blackSwans.push({ id: uid('bs'), event, trigger: trigger || '', plan: plan || '', lastReviewed: todayKey() });
  });
  toast('Black swan plan added');
}
