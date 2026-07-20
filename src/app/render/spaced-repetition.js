// ============================================================
// Life OS v2 — Spaced Repetition view
// Shows due reviews, review interface, and stats.
// Scientific basis: Cepeda et al. (2008), Karpicke & Roediger (2007)
// ============================================================

import { el } from '../dom.js';
import { getState } from '../state.js';
import { toast, openModal, closeModal } from '../ui.js';
import { addSRItem, reviewItem, deleteSRItem, dueReviews, srStats } from '../spaced-repetition.js';
import { todayKey, fmtDate } from '../util.js';

export function renderSpacedRepetition() {
  const s = getState();
  const due = dueReviews();
  const stats = srStats();

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Spaced Repetition']),
      el('div', { class: 'app-subtitle' }, ['Recall strengthens memory · SM-2 algorithm']),
    ]),

    // Stats card
    el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', { class: 'card-icon' }, ['📊']),
        el('div', { class: 'card-title' }, ['Overview']),
      ]),
      el('div', { class: 'bento' }, [
        kpi('📚', 'Total cards', String(stats.total)),
        kpi('⏰', 'Due now', String(stats.due)),
        kpi('🔄', 'Reviews', String(stats.totalReviews)),
        kpi('🧠', 'Retention', stats.retention > 0 ? `${Math.round(stats.retention * 100)}%` : '—'),
        kpi('⚡', 'Avg ease', stats.avgEase.toFixed(2)),
      ]),
    ]),

    // Due reviews
    el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, [`Due today · ${due.length}`]),
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => addCardModal() } }, ['+ New card']),
    ]),

    due.length === 0
      ? el('div', { class: 'card' }, [
          el('div', { class: 'empty' }, [
            el('div', { class: 'empty-icon' }, ['✅']),
            el('div', { class: 'empty-title' }, ['No reviews due']),
            el('div', { class: 'empty-body' }, ['Create cards from lessons, decisions, or anything you want to remember long-term.']),
            el('button', { class: 'btn btn--primary', on: { click: () => addCardModal() } }, ['+ Create your first card']),
          ]),
        ])
      : el('div', { class: 'list' }, due.map((item) => reviewRow(item))),

    // All cards (if any)
    (s.spacedRepetition || []).length > 0 && el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, [`All cards · ${(s.spacedRepetition || []).length}`]),
    ]),
    (s.spacedRepetition || []).length > 0 && el('div', { class: 'list' }, (s.spacedRepetition || [])
      .filter((i) => i.due > todayKey())
      .map((item) => cardRow(item))),
  ]);
}

function reviewRow(item) {
  const overdue = item.due < todayKey();
  return el('div', { class: 'list-item list-item--interactive', on: { click: () => reviewModal(item) } }, [
    el('div', { class: 'list-item-icon', style: { fontSize: '20px' } }, ['🧠']),
    el('div', { class: 'list-item-body' }, [
      el('div', { class: 'list-item-title' }, [item.question]),
      el('div', { class: 'list-item-sub' }, [
        overdue ? `Overdue · was due ${fmtDate(item.due)}` : `Due today`,
        ` · rep ${item.repetitions} · EF ${item.easeFactor.toFixed(1)}`,
      ]),
    ]),
    el('span', { class: 'chip chip--accent' }, ['Review']),
  ]);
}

function cardRow(item) {
  return el('div', { class: 'list-item' }, [
    el('div', { class: 'list-item-icon', style: { fontSize: '20px' } }, ['📇']),
    el('div', { class: 'list-item-body' }, [
      el('div', { class: 'list-item-title' }, [item.question]),
      el('div', { class: 'list-item-sub' }, [
        `Next: ${fmtDate(item.due)} · rep ${item.repetitions} · EF ${item.easeFactor.toFixed(1)}`,
      ]),
    ]),
    el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => { deleteSRItem(item.id); toast('Card deleted'); } } }, ['🗑']),
  ]);
}

function kpi(icon, label, value) {
  return el('div', { class: 'card card--pad-sm bento-cell' }, [
    el('div', { class: 'flex items-center gap-2 mb-2' }, [
      el('span', { style: { fontSize: '14px' } }, [icon]),
      el('span', { class: 'text-xs text-mute uppercase' }, [label]),
    ]),
    el('div', { class: 'stat-value', style: { fontSize: 'var(--fs-xl)' } }, [value]),
  ]);
}

function reviewModal(item) {
  const answerArea = el('div', { id: 'sr-answer-area' }, [
    el('button', {
      class: 'btn btn--ghost',
      style: { width: '100%' },
      on: { click: () => {
        // Replace answer area with answer + quality buttons
        const area = document.getElementById('sr-answer-area');
        if (!area) return;
        while (area.firstChild) area.removeChild(area.firstChild);
        area.appendChild(el('div', { class: 'text-xs text-mute uppercase mb-2' }, ['Answer']));
        area.appendChild(el('div', { class: 'card card--pad-sm mb-3', style: { fontSize: 'var(--fs-md)' } }, [item.answer]));
        area.appendChild(el('div', { class: 'text-xs text-mute uppercase mb-2' }, ['How well did you recall?']));
        area.appendChild(el('div', { class: 'flex gap-2 flex-wrap' }, QUALITY.map((q) =>
          el('button', {
            class: 'btn btn--ghost btn--sm',
            style: { flex: '1', minWidth: '80px' },
            on: { click: () => {
              reviewItem(item.id, q.value);
              closeModal();
              toast(q.value >= 3 ? `Recalled ✓ — next review scheduled` : 'Relearning — see you tomorrow', { icon: q.icon });
            } }
          }, [q.icon, ' ', q.label])
        )));
      } }
    }, ['👁 Show answer']),
  ]);
  const content = el('div', { style: { minWidth: '320px' } }, [
    el('div', { class: 'text-xs text-mute uppercase mb-2' }, ['Question']),
    el('div', { class: 'card card--pad-sm mb-3', style: { fontSize: 'var(--fs-md)' } }, [item.question]),
    answerArea,
  ]);
  openModal(content, { title: 'Review' });
}

const QUALITY = [
  { value: 0, label: 'Blackout', icon: '😵' },
  { value: 2, label: 'Wrong', icon: '❌' },
  { value: 3, label: 'Hard', icon: '😰' },
  { value: 4, label: 'Good', icon: '🙂' },
  { value: 5, label: 'Easy', icon: '😄' },
];

function addCardModal() {
  let question = '', answer = '';
  const content = el('div', { style: { minWidth: '320px' } }, [
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, ['Question / Prompt']),
      el('textarea', {
        class: 'field-textarea',
        placeholder: 'What are the 3 principles of deliberate practice?',
        on: { input: (e) => { question = e.target.value; } }
      }),
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, ['Answer']),
      el('textarea', {
        class: 'field-textarea',
        placeholder: 'Specific goals, immediate feedback, progressive difficulty',
        on: { input: (e) => { answer = e.target.value; } }
      }),
    ]),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: () => closeModal() } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        if (!question.trim() || !answer.trim()) { toast('Fill in both fields'); return; }
        addSRItem({ question: question.trim(), answer: answer.trim() });
        closeModal();
        toast('Card created 📇');
      } } }, ['Create']),
    ]),
  ]);
  openModal(content, { title: 'New Spaced Repetition Card' });
}
