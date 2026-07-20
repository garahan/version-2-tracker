// ============================================================
// Life OS v2 — Reviews (Wizard flow, not forms)
// Step-by-step questions. Green when due. Confetti on completion.
// ============================================================

import { el } from '../dom.js';
import { getState, setState } from '../state.js';
import { toast, openModal, closeModal, confetti } from '../ui.js';
import { todayKey, fmtDateLong, startOfWeek, startOfMonth, startOfQuarter, addDays, daysBetween } from '../util.js';

const TEMPLATES = {
  weekly: {
    label: 'Weekly Review',
    duration: '30–60 min',
    icon: '🗓️',
    questions: [
      'What did I ship this week?',
      'What did I learn?',
      'Which protocol was hardest to keep? Why?',
      'What is the #1 priority for next week?',
      'What should I say NO to next week?',
      'Did I complete my weekly cadence actions? (Portfolio review, project review, inbox zero, plan next week)',
    ],
  },
  monthly: {
    label: 'Monthly Review',
    duration: '1–2 hours',
    icon: '📆',
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
    icon: '📊',
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
    icon: '🔍',
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
    icon: '🎯',
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

const INTERVALS = { weekly: 7, monthly: 31, quarterly: 92, semiannual: 183, annual: 365 };

export function renderReviews() {
  const s = getState();
  const types = ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'];

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Review']),
      el('div', { class: 'app-subtitle' }, ['Weekly · monthly · quarterly · annual']),
    ]),

    // Big review type buttons
    el('div', { class: 'list mb-6' }, types.map((type) => reviewTypeBtn(type, s))),

    // History
    el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, ['History']),
    ]),
    reviewHistory(s),
  ]);
}

function reviewTypeBtn(type, s) {
  const tmpl = TEMPLATES[type];
  const items = s.reviews[type] || [];
  const last = items[items.length - 1];
  const isDue = isReviewDue(type, s);
  return el('button', {
    class: `review-type-btn ${isDue ? 'review-type-btn--due' : ''}`,
    on: { click: () => startReviewWizard(type) }
  }, [
    el('span', { class: 'review-type-btn-icon' }, [tmpl.icon]),
    el('div', { class: 'review-type-btn-body' }, [
      el('div', { class: 'review-type-btn-title' }, [tmpl.label]),
      el('div', { class: 'review-type-btn-sub' }, [`${tmpl.duration} · ${items.length} done · last: ${last ? fmtDateLong(last.date).split(',')[0] : '—'}`]),
    ]),
    isDue && el('span', { class: 'review-type-btn-badge' }, ['Due']),
  ]);
}

function isReviewDue(type, s) {
  const items = s.reviews[type] || [];
  const last = items[items.length - 1];
  const interval = INTERVALS[type];
  if (!last) return true;
  return daysBetween(last.date, todayKey()) > interval;
}

// ---- Wizard flow (step-by-step, not form) ----
function startReviewWizard(type) {
  const tmpl = TEMPLATES[type];
  const answers = tmpl.questions.map(() => '');
  let step = 0;

  const modalBody = el('div', { class: 'wizard', style: { minHeight: '400px' } }, []);
  renderStep();
  openModal(modalBody, { title: `${tmpl.icon} ${tmpl.label}` });

  function renderStep() {
    const isLast = step === tmpl.questions.length - 1;
    const isFirst = step === 0;
    el; // keep reference
    const content = el('div', { class: 'wizard' }, [
      // Progress dots
      el('div', { class: 'wizard-progress' }, tmpl.questions.map((_, i) =>
        el('div', { class: `wizard-dot ${i === step ? 'wizard-dot--active' : i < step ? 'wizard-dot--done' : ''}` })
      )),

      // Step number
      el('div', { class: 'wizard-step-num' }, [`Question ${step + 1} of ${tmpl.questions.length}`]),

      // Question
      el('div', { class: 'wizard-question' }, [tmpl.questions[step]]),

      // Answer textarea
      el('textarea', {
        class: 'wizard-textarea',
        placeholder: 'Type your answer…',
        on: { input: (e) => { answers[step] = e.target.value; } }
      }, [answers[step] || '']),

      // Navigation
      el('div', { class: 'wizard-nav' }, [
        !isFirst && el('button', {
          class: 'wizard-btn wizard-btn--secondary',
          on: { click: () => { step--; renderStep(); } }
        }, ['← Back']),
        isLast
          ? el('button', {
              class: 'wizard-btn wizard-btn--primary',
              on: { click: finishWizard }
            }, ['Finish ✓'])
          : el('button', {
              class: 'wizard-btn wizard-btn--primary',
              on: { click: () => { step++; renderStep(); } }
            }, ['Next →']),
      ]),
    ]);

    // Replace modal content
    const modal = document.getElementById('modal');
    if (modal) {
      // Find the modal content and replace
      const existing = modal.querySelector('.wizard');
      if (existing) {
        existing.replaceWith(content);
      } else {
        modal.appendChild(content);
      }
    }
  }

  function finishWizard() {
    const answered = answers.filter(Boolean).length;
    if (answered === 0) { toast('Answer at least one question'); return; }
    const qa = {};
    tmpl.questions.forEach((q, i) => { if (answers[i]) qa[q] = answers[i]; });
    setState((s) => {
      s.reviews[type].push({ id: `rev_${Date.now()}`, date: todayKey(), answers: qa, type });
    });
    closeModal();
    confetti();
    toast(`${tmpl.label} complete! System updated.`, { icon: '✅' });
    rerender();
  }
}

function reviewHistory(s) {
  const all = [];
  for (const [type, items] of Object.entries(s.reviews || {})) {
    for (const item of items) all.push({ ...item, typeLabel: TEMPLATES[type]?.label || type });
  }
  all.sort((a, b) => b.date.localeCompare(a.date));
  if (all.length === 0) {
    return el('div', { class: 'empty' }, [
      el('div', { class: 'empty-icon' }, ['📅']),
      el('div', { class: 'empty-title' }, ['No reviews yet']),
      el('div', { class: 'empty-body' }, ['Run your first Weekly Review on Sunday.']),
    ]);
  }
  return el('div', { class: 'list' }, all.slice(0, 20).map((r) =>
    el('div', { class: 'list-item' }, [
      el('div', { class: 'list-item-body' }, [
        el('div', { class: 'list-item-title' }, [r.typeLabel]),
        el('div', { class: 'list-item-sub' }, [fmtDateLong(r.date)]),
      ]),
      el('span', { class: 'chip' }, [`${Object.keys(r.answers || {}).length} answers`]),
    ])
  ));
}

function rerender() {
  window.__lifeosRerender?.();
}
