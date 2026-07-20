// ============================================================
// Life OS v2 — Decisions journal + library
// Log decisions with expected outcome; review at 1 year.
// ============================================================

import { el } from '../dom.js';
import { getState, addRecord, updateRecord, removeRecord } from '../state.js';
import { toast, openModal, closeModal, confirmDialog } from '../ui.js';
import { todayKey, fmtDate, addDays } from '../util.js';

export function renderDecisions() {
  const s = getState();
  const decisions = [...(s.decisions || [])].reverse();

  // Decisions due for review (reviewDate <= today, no outcome yet)
  const dueForReview = decisions.filter((d) => d.reviewDate && d.reviewDate <= todayKey() && !d.outcome);

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Decisions']),
      el('div', { class: 'app-subtitle' }, ['Journal · library · pre-mortem']),
    ]),

    el('button', { class: 'btn btn--primary btn--block mb-4', on: { click: newDecision } }, ['+ Log a decision']),

    dueForReview.length > 0 && el('div', { class: 'card card--accent mb-4' }, [
      el('div', { class: 'card-title mb-2' }, ['⏰ Decisions due for review']),
      el('div', { class: 'list' }, dueForReview.map((d) =>
        el('div', { class: 'list-item list-item--interactive', on: { click: () => reviewDecision(d) } }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [d.decision]),
            el('div', { class: 'list-item-sub' }, [`Decided ${fmtDate(d.date)} · expected: ${d.expected || '—'}`]),
          ]),
          el('span', { class: 'chip chip--accent' }, ['Review']),
        ])
      )),
    ]),

    el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, [`Library · ${decisions.length}`]),
    ]),

    decisions.length === 0
      ? el('div', { class: 'empty' }, [
          el('div', { class: 'empty-icon' }, ['⚖️']),
          el('div', { class: 'empty-title' }, ['No decisions logged']),
          el('div', { class: 'empty-body' }, ['Log decisions with > 1 month of consequences. Review at 1 year.']),
        ])
      : el('div', { class: 'list' }, decisions.map(decisionRow)),
  ]);
}

function decisionRow(d) {
  const reviewed = !!d.outcome;
  return el('div', { class: 'card card--interactive', on: { click: () => openDecision(d) } }, [
    el('div', { class: 'flex items-center justify-between mb-2' }, [
      el('div', { class: 'card-title' }, [d.decision]),
      reviewed
        ? el('span', { class: 'chip chip--done' }, ['Reviewed'])
        : el('span', { class: 'chip' }, [d.reviewDate ? `Review ${fmtDate(d.reviewDate)}` : 'Pending']),
    ]),
    el('div', { class: 'text-sm text-soft' }, [`Expected: ${d.expected || '—'}`]),
    reviewed && el('div', { class: 'text-sm text-mute mt-2' }, [`Outcome: ${d.outcome}`]),
  ]);
}

function newDecision() {
  const decision = el('input', { class: 'field-input', placeholder: 'What is the decision?' });
  const expected = el('textarea', { class: 'field-textarea', placeholder: 'What do you expect to happen? Be specific and falsifiable.' });
  const horizon = el('input', { class: 'field-input', type: 'number', value: '365', min: '30', max: '1825' });

  const body = el('div', {}, [
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Decision']), decision]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Expected outcome']), expected]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Review in (days)']), horizon]),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        if (!decision.value.trim()) return;
        addRecord('decisions', {
          decision: decision.value.trim(),
          expected: expected.value.trim(),
          date: todayKey(),
          reviewDate: addDays(todayKey(), Number(horizon.value) || 365),
          outcome: '',
          notes: '',
        });
        toast('Decision logged');
        closeModal();
        rerender();
      } } }, ['Log']),
    ]),
  ]);
  openModal(body);
}

function openDecision(d) {
  const body = el('div', {}, [
    el('h3', { class: 'text-lg font-bold mb-3' }, [d.decision]),
    el('div', { class: 'text-xs text-mute mb-4' }, [`Decided ${fmtDate(d.date)} · review ${d.reviewDate ? fmtDate(d.reviewDate) : '—'}`]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Expected']), el('p', { class: 'text-sm' }, [d.expected || '—'])]),
    d.outcome && el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Outcome']), el('p', { class: 'text-sm' }, [d.outcome])]),
    el('div', { class: 'flex gap-2 justify-end mt-4' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Close']),
      !d.outcome && el('button', { class: 'btn btn--primary', on: { click: () => { closeModal(); reviewDecision(d); } } }, ['Review now']),
      el('button', { class: 'btn btn--danger', on: { click: async () => {
        if (await confirmDialog({ title: 'Delete decision?', confirmText: 'Delete', danger: true })) {
          removeRecord('decisions', d.id);
          closeModal();
          rerender();
        }
      } } }, ['Delete']),
    ]),
  ]);
  openModal(body);
}

function reviewDecision(d) {
  const outcome = el('textarea', { class: 'field-textarea', placeholder: 'What actually happened?' });
  const accuracy = el('select', { class: 'field-input' }, [
    el('option', { value: '' }, ['— accuracy —']),
    el('option', { value: 'correct' }, ['Correct']),
    el('option', { value: 'partially' }, ['Partially correct']),
    el('option', { value: 'wrong' }, ['Wrong']),
    el('option', { value: 'better' }, ['Better than expected']),
  ]);
  const lessons = el('textarea', { class: 'field-textarea', placeholder: 'What did you learn? What would you change in your decision process?' });

  const body = el('div', {}, [
    el('h3', { class: 'text-lg font-bold mb-2' }, ['Review: ', d.decision]),
    el('p', { class: 'text-sm text-soft mb-4' }, [`Expected: ${d.expected || '—'}`]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Actual outcome']), outcome]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Accuracy']), accuracy]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Lessons']), lessons]),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        updateRecord('decisions', d.id, {
          outcome: outcome.value.trim(),
          accuracy: accuracy.value,
          lessons: lessons.value.trim(),
          reviewedAt: todayKey(),
        });
        // Also create a Lessons Learned entry
        if (lessons.value.trim()) {
          addRecord('lessonsLearned', {
            title: `Decision: ${d.decision}`,
            worked: accuracy.value === 'correct' || accuracy.value === 'better' ? outcome.value.trim() : '',
            didntWork: accuracy.value === 'wrong' ? outcome.value.trim() : '',
            why: lessons.value.trim(),
            systemChange: '',
            source: 'decision',
            sourceId: d.id,
          });
        }
        toast('Decision reviewed');
        closeModal();
        rerender();
      } } }, ['Save review']),
    ]),
  ]);
  openModal(body);
}

function rerender() { window.__lifeosRerender?.(); }
