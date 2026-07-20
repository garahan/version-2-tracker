// ============================================================
// Life OS v3 — Recall Engine (v3 §15)
// SM-2 spaced repetition. Cards, review, statistics.
// ============================================================

import { el } from '../dom.js';
import { getState, update } from '../state.js';
import { todayKey, uid, fmtDate } from '../util.js';
import { toast, prompt, modal, closeAll } from '../ui.js';
import { go } from '../main.js';

export function renderRecall() {
  const s = getState();
  const cards = s.spacedRepetition || [];
  const due = cards.filter(c => c.nextDue && c.nextDue <= todayKey());
  const totalReviews = cards.reduce((sum, c) => sum + (c.reviews || 0), 0);
  const avgEase = cards.length ? cards.reduce((sum, c) => sum + (c.ease || 2.5), 0) / cards.length : 2.5;

  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['Recall']),
    el('div', { class: 'app-subtitle' }, ['Spaced repetition · SM-2']),

    // Stats
    el('div', { class: 'bento', style: { marginTop: 'var(--sp-4)' } }, [
      el('div', { class: 'card card--pad-sm' }, [el('div', { class: 'stat-label' }, ['Cards']), el('div', { class: 'stat-value' }, [String(cards.length)])]),
      el('div', { class: 'card card--pad-sm' }, [el('div', { class: 'stat-label' }, ['Due now']), el('div', { class: 'stat-value', style: { color: due.length ? 'var(--c-attention)' : 'var(--c-healthy)' } }, [String(due.length)])]),
      el('div', { class: 'card card--pad-sm' }, [el('div', { class: 'stat-label' }, ['Reviews']), el('div', { class: 'stat-value' }, [String(totalReviews)])]),
      el('div', { class: 'card card--pad-sm' }, [el('div', { class: 'stat-label' }, ['Avg ease']), el('div', { class: 'stat-value' }, [avgEase.toFixed(2)])]),
    ]),

    el('button', { class: 'btn btn--primary btn--block', style: { marginTop: 'var(--sp-4)' }, on: { click: addCard } }, ['+ New card']),

    due.length > 0 && el('button', { class: 'btn btn--accent btn--block', style: { marginTop: 'var(--sp-2)', background: 'var(--c-accent)', color: 'var(--c-on-accent)' }, on: { click: () => reviewSession(due) } }, [`Review ${due.length} due cards`]),

    // All cards
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, [`All cards (${cards.length})`]),
    ]),
    el('div', { class: 'card' }, cards.length === 0
      ? [el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['🧠']), el('div', { class: 'empty-title' }, ['No cards yet'])])]
      : cards.map(c => el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [c.question]),
            el('div', { class: 'list-item-sub' }, [c.nextDue ? `due ${fmtDate(c.nextDue)}` : '', ` · ease ${c.ease?.toFixed(2) || '2.50'}`]),
          ]),
          el('span', { class: `chip ${c.nextDue && c.nextDue <= todayKey() ? 'chip--attention' : 'chip--healthy'}` }, [c.nextDue && c.nextDue <= todayKey() ? 'due' : 'ok']),
        ]))
    ),
  ]);
}

async function addCard() {
  const question = await prompt({ title: 'New card', label: 'Question', placeholder: 'What is...?' });
  if (!question) return;
  const answer = await prompt({ title: 'Answer', label: 'Answer', placeholder: '...' });
  if (!answer) return;
  update(st => {
    st.spacedRepetition.push({
      id: uid('sr'), question, answer,
      ease: 2.5, interval: 1, reviews: 0,
      nextDue: todayKey(), created: todayKey(),
    });
  });
  toast('Card added');
}

function reviewSession(dueCards) {
  let idx = 0;
  const reviewOne = () => {
    if (idx >= dueCards.length) { closeAll(); toast('Review session complete ✓', { icon: '🧠' }); return; }
    const card = dueCards[idx];
    let revealed = false;
    const body = el('div', {}, [
      el('div', { class: 'wizard-step-num' }, [`Card ${idx + 1} of ${dueCards.length}`]),
      el('div', { class: 'wizard-question' }, [card.question]),
      el('div', { id: 'answer-area', style: { marginTop: 'var(--sp-4)' } }, [
        el('button', { class: 'btn btn--ghost btn--block', on: { click: () => {
          const area = document.getElementById('answer-area');
          if (area && !revealed) {
            area.innerHTML = '';
            area.appendChild(el('div', { class: 'card card--pad-sm', style: { marginBottom: 'var(--sp-3)' } }, [card.answer]));
            area.appendChild(el('div', { class: 'overline mb-2' }, ['How well did you recall?']));
            area.appendChild(el('div', { class: 'flex gap-2' }, [0, 1, 2, 3, 4, 5].map(q =>
              el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => { rate(card, q); idx++; reviewOne(); } } }, [String(q)])
            )));
            revealed = true;
          }
        } } }, ['Show answer']),
      ]),
    ]);
    modal({ title: 'Recall', body });
  };
  reviewOne();
}

function rate(card, quality) {
  // SM-2 algorithm
  let ease = card.ease || 2.5;
  let interval = card.interval || 1;
  if (quality < 3) {
    interval = 1;
  } else {
    if (interval === 1) interval = 6;
    else interval = Math.round(interval * ease);
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }
  const next = new Date();
  next.setDate(next.getDate() + interval);
  const nextDue = todayKey(next);
  update(st => {
    const c = st.spacedRepetition.find(x => x.id === card.id);
    if (!c) return;
    c.ease = ease; c.interval = interval; c.reviews = (c.reviews || 0) + 1; c.nextDue = nextDue;
  });
}
