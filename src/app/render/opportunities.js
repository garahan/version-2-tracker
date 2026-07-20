// ============================================================
// Life OS v2 — Opportunities pipeline (kanban)
// Not tasks — possibilities. Vacancies, startups, ideas, contacts.
// ============================================================

import { el } from '../dom.js';
import { getState, addRecord, updateRecord, removeRecord } from '../state.js';
import { toast, openModal, closeModal, confirmDialog } from '../ui.js';
import { todayKey, fmtDate } from '../util.js';

const COLUMNS = [
  { id: 'open',     label: 'Open',     color: '' },
  { id: 'pursuing', label: 'Pursuing', color: 'chip--accent' },
  { id: 'passed',   label: 'Passed',   color: 'chip--missed' },
  { id: 'closed',   label: 'Closed',   color: 'chip--done' },
];

const TYPES = ['job', 'startup', 'invest', 'idea', 'contact', 'market', 'other'];

export function renderOpportunities() {
  const s = getState();
  const items = s.opportunities || [];

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Opportunities']),
      el('div', { class: 'app-subtitle' }, ['Pipeline · not tasks — possibilities']),
    ]),

    el('button', { class: 'btn btn--primary btn--block mb-4', on: { click: newOpportunity } }, ['+ New opportunity']),

    el('div', { class: 'kanban' }, COLUMNS.map((col) => {
      const colItems = items.filter((i) => (i.status || 'open') === col.id);
      return el('div', { class: 'kanban-col' }, [
        el('div', { class: 'kanban-col-head' }, [`${col.label} · ${colItems.length}`]),
        ...colItems.map((item) => kanbanCard(item)),
        colItems.length === 0 && el('div', { class: 'text-xs text-mute text-center', style: { padding: '20px 0' } }, ['—']),
      ]);
    })),
  ]);
}

function kanbanCard(item) {
  return el('div', { class: 'kanban-card', on: { click: () => openOpportunity(item) } }, [
    el('div', { class: 'flex items-center justify-between mb-2' }, [
      el('span', { class: 'chip' }, [item.type || 'other']),
      el('button', { class: 'btn btn--ghost btn--icon', style: { width: '24px', height: '24px' }, on: { click: async (e) => {
        e.stopPropagation();
        if (await confirmDialog({ title: 'Delete?', message: item.title, confirmText: 'Delete', danger: true })) {
          removeRecord('opportunities', item.id);
          rerender();
        }
      } } }, ['×']),
    ]),
    el('div', { class: 'font-semibold clamp-2' }, [item.title]),
    item.notes && el('div', { class: 'text-xs text-mute mt-2 clamp-2' }, [item.notes]),
  ]);
}

function newOpportunity() {
  const title = el('input', { class: 'field-input', placeholder: 'What is the opportunity?' });
  const type = el('select', { class: 'field-input' }, TYPES.map((t) => el('option', { value: t }, [t])));
  const notes = el('textarea', { class: 'field-textarea', placeholder: 'Why interesting? What is the next action?' });

  const body = el('div', {}, [
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Title']), title]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Type']), type]),
    el('div', { class: 'field' }, [el('div', { class: 'field-label' }, ['Notes']), notes]),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        if (!title.value.trim()) return;
        addRecord('opportunities', {
          title: title.value.trim(),
          type: type.value,
          notes: notes.value.trim(),
          status: 'open',
          createdAt: todayKey(),
        });
        toast('Opportunity added');
        closeModal();
        rerender();
      } } }, ['Add']),
    ]),
  ]);
  openModal(body);
}

function openOpportunity(item) {
  const body = el('div', {}, [
    el('h3', { class: 'text-lg font-bold mb-2' }, [item.title]),
    el('div', { class: 'text-xs text-mute mb-4' }, [`${item.type} · added ${fmtDate(item.createdAt)}`]),
    item.notes && el('p', { class: 'text-sm text-soft mb-4' }, [item.notes]),

    el('div', { class: 'field-label mb-2' }, ['Move to']),
    el('div', { class: 'flex gap-2 flex-wrap mb-4' }, COLUMNS.map((col) =>
      el('button', {
        class: `btn btn--sm ${(item.status || 'open') === col.id ? 'btn--primary' : ''}`,
        on: { click: () => {
          updateRecord('opportunities', item.id, { status: col.id });
          toast(`Moved to ${col.label}`);
          closeModal();
          rerender();
        } }
      }, [col.label])
    )),

    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: closeModal } }, ['Close']),
      el('button', { class: 'btn btn--danger', on: { click: async () => {
        if (await confirmDialog({ title: 'Delete?', confirmText: 'Delete', danger: true })) {
          removeRecord('opportunities', item.id);
          closeModal();
          rerender();
        }
      } } }, ['Delete']),
    ]),
  ]);
  openModal(body);
}

function rerender() { window.__lifeosRerender?.(); }
