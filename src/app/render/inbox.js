// ============================================================
// Life OS v2 — Inbox (capture → clarify → schedule → archive)
// GTD-style flow. Nothing lives only in your head.
// ============================================================

import { el } from '../dom.js';
import { getState, addRecord, updateRecord, removeRecord } from '../state.js';
import { toast, promptDialog, confirmDialog } from '../ui.js';
import { uid, todayKey } from '../util.js';

export function renderInbox() {
  const s = getState();
  const items = s.inbox || [];

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Inbox']),
      el('div', { class: 'app-subtitle' }, ['Capture · clarify · schedule · archive']),
    ]),

    // Capture bar
    el('div', { class: 'capture mb-4' }, [
      el('input', {
        class: 'capture-input',
        id: 'inbox-capture',
        placeholder: 'Capture anything… (Enter to save)',
        on: { keydown: (e) => {
          if (e.key === 'Enter' && e.target.value.trim()) {
            addRecord('inbox', { text: e.target.value.trim(), status: 'raw', createdAt: todayKey() });
            e.target.value = '';
            toast('Captured');
            rerender();
          }
        } }
      }),
      el('button', { class: 'btn btn--primary btn--sm', on: { click: () => {
        const inp = document.getElementById('inbox-capture');
        if (inp.value.trim()) {
          addRecord('inbox', { text: inp.value.trim(), status: 'raw', createdAt: todayKey() });
          inp.value = '';
          toast('Captured');
          rerender();
        }
      } } }, ['Add']),
    ]),

    // Counts
    el('div', { class: 'flex gap-2 mb-4' }, [
      el('span', { class: 'chip' }, [`Raw: ${items.filter(i => i.status === 'raw').length}`]),
      el('span', { class: 'chip chip--accent' }, [`Actionable: ${items.filter(i => i.status === 'action').length}`]),
      el('span', { class: 'chip' }, [`Someday: ${items.filter(i => i.status === 'someday').length}`]),
      el('span', { class: 'chip' }, [`Archived: ${items.filter(i => i.status === 'archived').length}`]),
    ]),

    // List
    items.length === 0
      ? emptyState()
      : el('div', { class: 'list' }, items.map(itemRow)),
  ]);
}

function itemRow(item) {
  const statusChip = ({
    raw: el('span', { class: 'chip' }, ['Raw']),
    action: el('span', { class: 'chip chip--accent' }, ['Action']),
    someday: el('span', { class: 'chip' }, ['Someday']),
    archived: el('span', { class: 'chip' }, ['Archived']),
  })[item.status] || el('span', { class: 'chip' }, [item.status]);

  return el('div', { class: 'list-item' }, [
    el('div', { class: 'list-item-body' }, [
      el('div', { class: 'list-item-title' }, [item.text]),
      el('div', { class: 'list-item-sub' }, [item.createdAt || '']),
    ]),
    statusChip,
    el('button', { class: 'btn btn--ghost btn--sm btn--icon', on: { click: () => clarify(item) } }, ['→']),
    el('button', { class: 'btn btn--ghost btn--sm btn--icon', on: { click: async () => {
      if (await confirmDialog({ title: 'Delete?', message: item.text, confirmText: 'Delete', danger: true })) {
        removeRecord('inbox', item.id);
        rerender();
      }
    } } }, ['×']),
  ]);
}

function clarify(item) {
  // Quick action menu
  const body = el('div', {}, [
    el('p', { class: 'text-sm text-soft mb-4' }, [item.text]),
    el('div', { class: 'flex flex-col gap-2' }, [
      el('button', { class: 'btn btn--primary btn--block', on: { click: () => {
        updateRecord('inbox', item.id, { status: 'action' });
        toast('Marked actionable');
        rerender();
        closeAllSafe();
      } } }, ['→ Actionable (do it)']),
      el('button', { class: 'btn btn--block', on: { click: () => {
        updateRecord('inbox', item.id, { status: 'someday' });
        toast('Moved to Someday');
        rerender();
        closeAllSafe();
      } } }, ['📅 Someday / maybe']),
      el('button', { class: 'btn btn--block', on: { click: () => {
        updateRecord('inbox', item.id, { status: 'archived' });
        toast('Archived');
        rerender();
        closeAllSafe();
      } } }, ['🗄️ Archive']),
      el('button', { class: 'btn btn--danger btn--block', on: { click: () => {
        removeRecord('inbox', item.id);
        toast('Deleted');
        rerender();
        closeAllSafe();
      } } }, ['🗑️ Delete']),
    ]),
  ]);
  openModalSafe(body, 'Clarify');
}

function emptyState() {
  return el('div', { class: 'empty' }, [
    el('div', { class: 'empty-icon' }, ['📥']),
    el('div', { class: 'empty-title' }, ['Inbox empty']),
    el('div', { class: 'empty-body' }, ['Capture anything on your mind above.']),
  ]);
}

// Avoid circular imports — use dynamic import for UI host
let _ui = null;
async function getUI() {
  if (!_ui) _ui = await import('../ui.js');
  return _ui;
}
function openModalSafe(body, title) { getUI().then(ui => ui.openModal(body, { title })); }
function closeAllSafe() { getUI().then(ui => ui.closeAll()); }
function rerender() { window.__lifeosRerender?.(); }
