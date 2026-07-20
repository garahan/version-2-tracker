// ============================================================
// Life OS v2 — Lessons Learned + Error Log
// After every project / decision / purchase:
//   what worked / what didn't / why / what to change in the system.
// ============================================================

import { el } from '../dom.js';
import { getState, addRecord, removeRecord } from '../state.js';
import { toast, openModal, closeModal, confirmDialog } from '../ui.js';
import { todayKey, fmtDate } from '../util.js';

export function renderLessons() {
  const s = getState();
  const lessons = [...(s.lessonsLearned || [])].reverse();
  const errors = [...(s.errors || [])].reverse();

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Lessons']),
      el('div', { class: 'app-subtitle' }, ['Lessons learned · error log · pattern detection']),
    ]),

    el('div', { class: 'flex gap-2 mb-4' }, [
      el('button', { class: 'btn btn--primary', style: { flex: 1 }, on: { click: newLesson } }, ['+ Lesson']),
      el('button', { class: 'btn', style: { flex: 1 }, on: { click: newError } }, ['+ Error']),
    ]),

    // Error log
    el('div', { class: 'section-head' }, [el('div', { class: 'section-title' }, [`Error log · ${errors.length}`])]),
    errors.length === 0
      ? el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['🐛']), el('div', { class: 'empty-title' }, ['No errors logged']), el('div', { class: 'empty-body' }, ['Log failures to find patterns.'])])
      : el('div', { class: 'list mb-6' }, errors.map(errorRow)),

    // Lessons
    el('div', { class: 'section-head' }, [el('div', { class: 'section-title' }, [`Lessons learned · ${lessons.length}`])]),
    lessons.length === 0
      ? el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['🎓']), el('div', { class: 'empty-title' }, ['No lessons yet']), el('div', { class: 'empty-body' }, ['After a project or big decision, log what worked and what didn\'t.'])])
      : el('div', { class: 'list' }, lessons.map(lessonRow)),
  ]);
}

function errorRow(e) {
  return el('div', { class: 'card card--interactive', on: { click: () => viewError(e) } }, [
    el('div', { class: 'flex items-center justify-between mb-2' }, [
      el('div', { class: 'card-title' }, [e.what]),
      el('span', { class: 'chip chip--missed' }, [fmtDate(e.date || e.createdAt?.slice(0, 10) || todayKey())]),
    ]),
    e.rootCause && el('div', { class: 'text-sm text-soft' }, [`Root cause: ${e.rootCause}`]),
    e.pattern && el('div', { class: 'text-xs text-mute mt-2' }, [`Pattern: ${e.pattern}`]),
  ]);
}

function lessonRow(l) {
  return el('div', { class: 'card card--interactive', on: { click: () => viewLesson(l) } }, [
    el('div', { class: 'flex items-center justify-between mb-2' }, [
      el('div', { class: 'card-title' }, [l.title]),
      el('span', { class: 'chip' }, [fmtDate(l.date || l.createdAt?.slice(0, 10) || todayKey())]),
    ]),
    l.worked && el('div', { class: 'text-sm', style: { color: 'var(--c-success)' } }, [`✓ ${l.worked}`]),
    l.didntWork && el('div', { class: 'text-sm', style: { color: 'var(--c-danger)' } }, [`✗ ${l.didntWork}`]),
    l.systemChange && el('div', { class: 'text-xs text-mute mt-2' }, [`System change: ${l.systemChange}`]),
  ]);
}

function newError() {
  const what = el('input', { class: 'field-input', placeholder: 'What went wrong?' });
  const rootCause = el('textarea', { class: 'field-textarea', placeholder: 'Root cause (be honest, not self-critical)' });
  const pattern = el('input', { class: 'field-input', placeholder: 'Is this a pattern? (optional)' });

  const body = el('div', {}, [
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['What happened']), what]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Root cause']), rootCause]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Pattern']), pattern]),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        if (!what.value.trim()) return;
        addRecord('errors', { what: what.value.trim(), rootCause: rootCause.value.trim(), pattern: pattern.value.trim(), date: todayKey() });
        toast('Error logged');
        closeModal();
        rerender();
      } } }, ['Log']),
    ]),
  ]);
  openModal(body);
}

function newLesson() {
  const title = el('input', { class: 'field-input', placeholder: 'Project / decision / event' });
  const worked = el('textarea', { class: 'field-textarea', placeholder: 'What worked?' });
  const didntWork = el('textarea', { class: 'field-textarea', placeholder: 'What didn\'t work?' });
  const why = el('textarea', { class: 'field-textarea', placeholder: 'Why?' });
  const systemChange = el('textarea', { class: 'field-textarea', placeholder: 'What will I change in the system?' });

  const body = el('div', {}, [
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Title']), title]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['✓ What worked']), worked]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['✗ What didn\'t']), didntWork]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Why']), why]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['System change']), systemChange]),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        if (!title.value.trim()) return;
        addRecord('lessonsLearned', {
          title: title.value.trim(),
          worked: worked.value.trim(),
          didntWork: didntWork.value.trim(),
          why: why.value.trim(),
          systemChange: systemChange.value.trim(),
          date: todayKey(),
        });
        toast('Lesson saved');
        closeModal();
        rerender();
      } } }, ['Save']),
    ]),
  ]);
  openModal(body);
}

function viewError(e) {
  const body = el('div', {}, [
    el('h3', { class: 'text-lg font-bold mb-2' }, [e.what]),
    el('p', { class: 'text-xs text-mute mb-4' }, [fmtDate(e.date || todayKey())]),
    e.rootCause && el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Root cause']), el('p', { class: 'text-sm' }, [e.rootCause])]),
    e.pattern && el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Pattern']), el('p', { class: 'text-sm' }, [e.pattern])]),
    el('div', { class: 'flex gap-2 justify-end mt-4' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Close']),
      el('button', { class: 'btn btn--danger', on: { click: async () => {
        if (await confirmDialog({ title: 'Delete?', confirmText: 'Delete', danger: true })) {
          removeRecord('errors', e.id);
          closeModal();
          rerender();
        }
      } } }, ['Delete']),
    ]),
  ]);
  openModal(body);
}

function viewLesson(l) {
  const body = el('div', {}, [
    el('h3', { class: 'text-lg font-bold mb-2' }, [l.title]),
    el('p', { class: 'text-xs text-mute mb-4' }, [fmtDate(l.date || todayKey())]),
    l.worked && el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['✓ Worked']), el('p', { class: 'text-sm' }, [l.worked])]),
    l.didntWork && el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['✗ Didn\'t work']), el('p', { class: 'text-sm' }, [l.didntWork])]),
    l.why && el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Why']), el('p', { class: 'text-sm' }, [l.why])]),
    l.systemChange && el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['System change']), el('p', { class: 'text-sm' }, [l.systemChange])]),
    el('div', { class: 'flex gap-2 justify-end mt-4' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Close']),
      el('button', { class: 'btn btn--danger', on: { click: async () => {
        if (await confirmDialog({ title: 'Delete?', confirmText: 'Delete', danger: true })) {
          removeRecord('lessonsLearned', l.id);
          closeModal();
          rerender();
        }
      } } }, ['Delete']),
    ]),
  ]);
  openModal(body);
}

function rerender() { window.__lifeosRerender?.(); }
