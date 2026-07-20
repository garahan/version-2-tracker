// ============================================================
// Life OS v3 — Decision Engine (v3 §12)
// Every major decision records: Decision, Context, Assumptions,
// Confidence, Alternatives, Expected Result, Probability,
// Review Date, Outcome, Decision Quality, Lessons, Bayesian Update.
// ============================================================

import { el } from '../dom.js';
import { getState, update } from '../state.js';
import { todayKey, uid, fmtDate } from '../util.js';
import { toast, prompt, confirm } from '../ui.js';
import { go } from '../main.js';

export function renderDecisions() {
  const s = getState();
  const decisions = s.decisions || [];

  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['Decisions']),
    el('div', { class: 'app-subtitle' }, ['Journal · pre-mortem · review']),

    el('button', { class: 'btn btn--primary btn--block', style: { marginTop: 'var(--sp-4)' }, on: { click: addDecision } }, ['+ Log decision']),

    el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, decisions.length === 0
      ? [el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['⚖️']), el('div', { class: 'empty-title' }, ['No decisions yet'])])]
      : decisions.map(d => el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [d.decision]),
            el('div', { class: 'list-item-sub' }, [
              fmtDate(d.date),
              d.confidence != null ? ` · ${d.confidence}% confidence` : '',
              d.reviewDate ? ` · review ${fmtDate(d.reviewDate)}` : '',
              d.outcome ? ' · reviewed' : '',
            ]),
          ]),
          el('span', { class: `chip ${d.outcome ? 'chip--healthy' : d.reviewDate && d.reviewDate < todayKey() ? 'chip--attention' : ''}` }, [d.outcome ? 'reviewed' : d.reviewDate && d.reviewDate < todayKey() ? 'due' : 'open']),
        ]))
    ),
  ]);
}

async function addDecision() {
  const decision = await prompt({ title: 'New decision', label: 'What did you decide?', placeholder: 'e.g. Accept job offer at X' });
  if (!decision) return;
  const context = await prompt({ title: 'Context', label: 'What is the context?', placeholder: 'Background...' });
  const confidence = parseInt(await prompt({ title: 'Confidence', label: 'Confidence % (0-100)', placeholder: '70', initial: '70' }) || '50', 10);
  const reviewDate = await prompt({ title: 'Review date', label: 'When to review? (YYYY-MM-DD)', placeholder: todayKey(), initial: todayKey() });
  update(st => {
    st.decisions.push({
      id: uid('dec'), decision, context: context || '',
      assumptions: [], alternatives: [], expectedResult: '',
      confidence: confidence || 50, probability: (confidence || 50) / 100,
      reviewDate: reviewDate || todayKey(), date: todayKey(),
      outcome: null, quality: null, lessons: '', bayesianUpdate: null,
    });
  });
  toast('Decision logged');
}
