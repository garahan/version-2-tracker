// ============================================================
// Life OS v2 — Reviews (weekly / monthly / quarterly / annual)
// Templated questions, persisted answers, history.
// ============================================================

import { el } from '../dom.js';
import { getState, setState } from '../state.js';
import { toast } from '../ui.js';
import { todayKey, fmtDateLong, startOfWeek, startOfMonth, startOfQuarter } from '../util.js';

const TEMPLATES = {
  weekly: {
    label: 'Weekly Review',
    duration: '30–60 min',
    questions: [
      'What did I ship this week?',
      'What did I learn?',
      'Which habit was hardest to keep? Why?',
      'What is the #1 priority for next week?',
      'What should I say NO to next week?',
      'Did I complete my weekly cadence actions? (Portfolio review, project review, inbox zero, plan next week)',
    ],
  },
  monthly: {
    label: 'Monthly Review',
    duration: '1–2 hours',
    questions: [
      'KPIs: how did each domain perform this month?',
      'Savings rate? Net worth change?',
      'Did I make 1 new useful contact?',
      'Did I update CV / LinkedIn / portfolio?',
      'Which STAR story did I write this month?',
      'Family day — did it happen?',
      'Which project should be killed?',
    ],
  },
  quarterly: {
    label: 'Quarterly Strategy Review',
    duration: '3–4 hours',
    questions: [
      'Am I playing the right game?',
      'What one bet would change the next 5 years?',
      'Which competencies will be most valuable next year?',
      'Which AI opportunities am I acting on?',
      'What is becoming obsolete — and what should I kill?',
      'What should I scale?',
      'Health: bloods, derma, dental — done?',
      'Rebalancing done? Tax planning done?',
      'Salary benchmark — am I priced correctly?',
    ],
  },
  semiannual: {
    label: 'Semi-annual Audit',
    duration: '4–6 hours',
    questions: [
      'Deep skill audit: which skills are growing, which decaying?',
      'Language progress?',
      'AI tooling — am I keeping up?',
      'Physical form — am I stronger than 6 months ago?',
      'Career direction — still right?',
      'Life goals — still aligned?',
    ],
  },
  annual: {
    label: 'Annual Life Review',
    duration: '6–8 hours',
    questions: [
      'Values — have they changed?',
      'Mission — do I still want this?',
      'Capital audit: biological, intellectual, financial, social, family, product, reputational.',
      'Strategy for the next 3 / 5 / 10 years.',
      'What could destroy the system? (Risks)',
      '3–5 main goals for the year ahead.',
      'What legacy did I build this year?',
    ],
  },
};

export function renderReviews() {
  const s = getState();
  const types = ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'];

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Reviews']),
      el('div', { class: 'app-subtitle' }, ['Weekly · monthly · quarterly · annual']),
    ]),

    el('div', { class: 'list mb-6' }, types.map((type) => reviewTypeRow(type, s))),

    el('div', { class: 'section-head' }, [el('div', { class: 'section-title' }, ['History'])]),
    reviewHistory(s),
  ]);
}

function reviewTypeRow(type, s) {
  const tmpl = TEMPLATES[type];
  const items = s.reviews[type] || [];
  const last = items[items.length - 1];
  return el('div', { class: 'card card--interactive', on: { click: () => startReview(type) } }, [
    el('div', { class: 'flex items-center justify-between' }, [
      el('div', {}, [
        el('div', { class: 'card-title' }, [tmpl.label]),
        el('div', { class: 'card-subtitle' }, [`${tmpl.duration} · ${items.length} done`]),
      ]),
      el('div', { class: 'text-right' }, [
        el('div', { class: 'text-xs text-mute' }, ['Last']),
        el('div', { class: 'text-sm font-semibold' }, [last ? fmtDateLong(last.date).split(',')[0] : '—']),
      ]),
    ]),
  ]);
}

function startReview(type) {
  const tmpl = TEMPLATES[type];
  const answers = tmpl.questions.map(() => '');

  const body = el('div', {}, [
    el('h3', { class: 'text-lg font-bold mb-2' }, [tmpl.label]),
    el('p', { class: 'text-xs text-mute mb-4' }, [`${tmpl.duration} · ${fmtDateLong(todayKey())}`]),
    ...tmpl.questions.map((q, i) => el('div', { class: 'field' }, [
      el('div', { class: 'field-label' }, [q]),
      el('textarea', {
        class: 'field-textarea',
        on: { input: (e) => { answers[i] = e.target.value; } }
      }),
    ])),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: () => import('../ui.js').then(ui => ui.closeModal()) } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        const answered = answers.filter(Boolean).length;
        if (answered === 0) { toast('Answer at least one question'); return; }
        const qa = {};
        tmpl.questions.forEach((q, i) => { if (answers[i]) qa[q] = answers[i]; });
        setState((s) => {
          s.reviews[type].push({ id: `rev_${Date.now()}`, date: todayKey(), answers: qa, type });
        });
        toast(`${tmpl.label} saved`);
        import('../ui.js').then(ui => ui.closeModal());
        rerender();
      } } }, ['Save review']),
    ]),
  ]);
  import('../ui.js').then(ui => ui.openModal(body));
}

function reviewHistory(s) {
  const all = [];
  for (const type of ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual']) {
    for (const r of (s.reviews[type] || [])) all.push({ ...r, type });
  }
  all.sort((a, b) => b.date.localeCompare(a.date));
  if (all.length === 0) {
    return el('div', { class: 'empty' }, [
      el('div', { class: 'empty-icon' }, ['📅']),
      el('div', { class: 'empty-title' }, ['No reviews yet']),
      el('div', { class: 'empty-body' }, ['Start your first weekly review above.']),
    ]);
  }
  return el('div', { class: 'list' }, all.map((r) =>
    el('div', { class: 'list-item', on: { click: () => viewReview(r) } }, [
      el('div', { class: 'list-item-body' }, [
        el('div', { class: 'list-item-title' }, [TEMPLATES[r.type].label]),
        el('div', { class: 'list-item-sub' }, [fmtDateLong(r.date)]),
      ]),
      el('span', { class: 'chip' }, [`${Object.keys(r.answers || {}).length} answers`]),
    ])
  ));
}

function viewReview(r) {
  const body = el('div', {}, [
    el('h3', { class: 'text-lg font-bold mb-2' }, [TEMPLATES[r.type].label]),
    el('p', { class: 'text-xs text-mute mb-4' }, [fmtDateLong(r.date)]),
    ...Object.entries(r.answers || {}).map(([q, a]) =>
      el('div', { class: 'card card--pad-sm card--flat mb-2' }, [
        el('div', { class: 'field-label mb-2' }, [q]),
        el('p', { class: 'text-sm' }, [a]),
      ])
    ),
    el('div', { class: 'flex justify-end mt-4' }, [
      el('button', { class: 'btn btn--ghost', on: { click: () => import('../ui.js').then(ui => ui.closeModal()) } }, ['Close']),
    ]),
  ]);
  import('../ui.js').then(ui => ui.openModal(body));
}

function rerender() { window.__lifeosRerender?.(); }
