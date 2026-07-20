// ============================================================
// Life OS v3 — Lessons Engine (v3 §14)
// After every project: What worked? What failed? Why?
// What changes in the system?
// ============================================================

import { el } from '../dom.js';
import { getState, update } from '../state.js';
import { todayKey, uid, fmtDate } from '../util.js';
import { toast, prompt } from '../ui.js';
import { go } from '../main.js';

export function renderLessons() {
  const s = getState();
  const lessons = s.lessonsLearned || [];
  const errors = s.errors || [];

  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['Lessons']),
    el('div', { class: 'app-subtitle' }, ['Lessons learned · error log']),

    el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-4)' } }, [
      el('button', { class: 'btn btn--primary btn--block', on: { click: addLesson } }, ['+ Lesson']),
      el('button', { class: 'btn btn--ghost btn--block', on: { click: addError } }, ['+ Error']),
    ]),

    // Lessons
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, [`Lessons (${lessons.length})`]),
    ]),
    el('div', { class: 'card' }, lessons.length === 0
      ? [el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['🎓']), el('div', { class: 'empty-title' }, ['No lessons yet'])])]
      : lessons.map(l => el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [l.whatWorked || l.title || 'Lesson']),
            el('div', { class: 'list-item-sub' }, [fmtDate(l.date), l.why ? ` · ${l.why}` : '']),
          ]),
        ]))
    ),

    // Errors
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, [`Errors (${errors.length})`]),
    ]),
    el('div', { class: 'card' }, errors.length === 0
      ? [el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['✓']), el('div', { class: 'empty-title' }, ['No errors logged'])])]
      : errors.map(e => el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [e.error]),
            el('div', { class: 'list-item-sub' }, [fmtDate(e.date), e.rootCause ? ` · ${e.rootCause}` : '', e.fix ? ` · fix: ${e.fix}` : '']),
          ]),
          el('span', { class: `chip ${e.fix ? 'chip--healthy' : 'chip--attention'}` }, [e.fix ? 'fixed' : 'open']),
        ]))
    ),
  ]);
}

async function addLesson() {
  const worked = await prompt({ title: 'What worked?', label: 'What worked?', placeholder: '...' });
  if (!worked) return;
  const failed = await prompt({ title: 'What failed?', label: 'What failed?', placeholder: '...' });
  const why = await prompt({ title: 'Why?', label: 'Why did it happen?', placeholder: '...' });
  const change = await prompt({ title: 'System change', label: 'What changes in the system?', placeholder: '...' });
  update(st => {
    st.lessonsLearned.push({
      id: uid('les'), whatWorked: worked, whatFailed: failed || '',
      why: why || '', systemChange: change || '', date: todayKey(),
    });
  });
  toast('Lesson saved');
}

async function addError() {
  const error = await prompt({ title: 'Error', label: 'What went wrong?', placeholder: '...' });
  if (!error) return;
  const rootCause = await prompt({ title: 'Root cause', label: 'Root cause?', placeholder: '...' });
  update(st => {
    st.errors.push({ id: uid('err'), error, rootCause: rootCause || '', fix: '', date: todayKey() });
  });
  toast('Error logged');
}
