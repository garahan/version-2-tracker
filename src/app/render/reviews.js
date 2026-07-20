// ============================================================
// Life OS v3 — Reviews (v3 §10)
// Wizard format. Question by question. Progress indicator.
// Auto-save. History.
// ============================================================

import { el } from '../dom.js';
import { getState, update } from '../state.js';
import { REVIEW_TEMPLATES, REVIEW_ORDER } from '../data/reviews.js';
import { todayKey, fmtDate } from '../util.js';
import { modal, closeAll, confetti, toast } from '../ui.js';
import { go } from '../main.js';

export function renderReviews() {
  const s = getState();
  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['Reviews']),
    el('div', { class: 'app-subtitle' }, ['Weekly · monthly · quarterly · annual']),
    el('div', { style: { marginTop: 'var(--sp-2)' } }, [
      el('span', { class: 'cog-mode cog-mode--reflect' }, ['Reflect mode · 30–60 min']),
    ]),
    el('div', { style: { marginTop: 'var(--sp-4)' } }, REVIEW_ORDER.map(id => renderReviewButton(id, s))),
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-8)' } }, [
      el('div', { class: 'section-title' }, ['History']),
    ]),
    renderHistory(s),
  ]);
}

function renderReviewButton(id, s) {
  const tpl = REVIEW_TEMPLATES[id];
  const reviews = s.reviews[id] || [];
  const last = reviews[reviews.length - 1];
  const isOverdue = isReviewDue(id, reviews);
  return el('button', {
    class: `review-type-btn ${isOverdue ? 'review-type-btn--due' : ''}`,
    on: { click: () => startWizard(id) }
  }, [
    el('div', { class: 'review-type-btn-icon' }, [tpl.icon]),
    el('div', { class: 'review-type-btn-body' }, [
      el('div', { class: 'review-type-btn-title' }, [tpl.name]),
      el('div', { class: 'review-type-btn-sub' }, [
        tpl.duration,
        ` · ${reviews.length} done`,
        last ? ` · last ${fmtDate(last.date)}` : '',
      ]),
    ]),
    isOverdue && el('div', { class: 'review-type-btn-badge' }, ['Due']),
  ]);
}

function isReviewDue(id, reviews) {
  if (!reviews.length) return true;
  const last = reviews[reviews.length - 1];
  const days = (Date.now() - new Date(last.date).getTime()) / 86400000;
  const limits = { weekly: 9, monthly: 38, quarterly: 95, semiannual: 190, annual: 380 };
  return days > (limits[id] || 30);
}

// ---- Wizard (v3 §10) ----
function startWizard(id) {
  const tpl = REVIEW_TEMPLATES[id];
  const answers = new Array(tpl.questions.length).fill('');
  let step = 0;

  const body = el('div', { class: 'wizard', id: 'wizard-body' }, []);
  const renderStep = () => {
    while (body.firstChild) body.removeChild(body.firstChild);
    const isLast = step === tpl.questions.length - 1;
    body.appendChild(el('div', { class: 'wizard-progress' }, tpl.questions.map((_, i) =>
      el('div', { class: `wizard-dot ${i < step ? 'wizard-dot--done' : i === step ? 'wizard-dot--active' : ''}` })
    )));
    body.appendChild(el('div', { class: 'wizard-step-num' }, [`Question ${step + 1} of ${tpl.questions.length}`]));
    body.appendChild(el('div', { class: 'wizard-question' }, [tpl.questions[step]]));
    const ta = el('textarea', {
      class: 'wizard-textarea',
      placeholder: 'Write your answer...',
      on: { input: (e) => { answers[step] = e.target.value; } }
    }, [answers[step] || '']);
    body.appendChild(ta);
    body.appendChild(el('div', { class: 'wizard-nav' }, [
      step > 0 && el('button', { class: 'btn btn--ghost btn--block', on: { click: () => { step--; renderStep(); } } }, ['Back']),
      el('button', {
        class: 'btn btn--primary btn--block',
        on: { click: () => {
          if (isLast) { finishWizard(id, tpl, answers); return; }
          step++; renderStep();
        } }
      }, [isLast ? 'Finish' : 'Next']),
    ]));
    setTimeout(() => ta.focus(), 50);
  };
  renderStep();
  modal({ title: `${tpl.icon} ${tpl.name}`, body });
}

function finishWizard(id, tpl, answers) {
  const entry = {
    date: todayKey(),
    answers: tpl.questions.map((q, i) => ({ question: q, answer: answers[i] || '' })),
  };
  update(st => { st.reviews[id].push(entry); });
  closeAll();
  confetti();
  toast(`${tpl.name} complete ✓`, { icon: tpl.icon });
}

function renderHistory(s) {
  const all = [];
  for (const id of REVIEW_ORDER) {
    for (const r of (s.reviews[id] || [])) {
      all.push({ id, ...r });
    }
  }
  all.sort((a, b) => b.date.localeCompare(a.date));
  if (!all.length) return el('div', { class: 'empty' }, [
    el('div', { class: 'empty-icon' }, ['📅']),
    el('div', { class: 'empty-title' }, ['No reviews yet']),
    el('div', { class: 'empty-body' }, ['Start your first review above.']),
  ]);
  return el('div', { class: 'card' }, all.slice(0, 20).map(r =>
    el('div', { class: 'list-item' }, [
      el('div', { class: 'list-item-icon' }, [REVIEW_TEMPLATES[r.id].icon]),
      el('div', { class: 'list-item-body' }, [
        el('div', { class: 'list-item-title' }, [REVIEW_TEMPLATES[r.id].name]),
        el('div', { class: 'list-item-sub' }, [fmtDate(r.date), ` · ${r.answers.length} answers`]),
      ]),
    ])
  ));
}
