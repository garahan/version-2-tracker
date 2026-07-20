// ============================================================
// Life OS v3 — Inbox (GTD capture)
// ============================================================

import { el } from '../dom.js';
import { getState, update } from '../state.js';
import { todayKey, uid } from '../util.js';
import { toast } from '../ui.js';
import { go } from '../main.js';

export function renderInbox() {
  const s = getState();
  const items = s.inbox || [];

  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['Inbox']),
    el('div', { class: 'app-subtitle' }, ['Capture · clarify · archive']),

    // Capture bar
    el('div', { class: 'capture', style: { marginTop: 'var(--sp-4)' } }, [
      el('input', {
        class: 'capture-input', placeholder: 'Capture anything...',
        on: { keydown: (e) => {
          if (e.key === 'Enter' && e.target.value.trim()) {
            const text = e.target.value.trim();
            update(st => { st.inbox.push({ id: uid('inb'), text, status: 'raw', created: todayKey() }); });
            e.target.value = '';
            toast('Captured');
          }
        } }
      }),
    ]),

    // Counts
    el('div', { class: 'flex gap-2 mt-4' }, [
      el('span', { class: 'chip' }, ['Raw: ' + items.filter(i => (i.status || 'raw') === 'raw').length]),
      el('span', { class: 'chip chip--info' }, ['Action: ' + items.filter(i => i.status === 'action').length]),
      el('span', { class: 'chip chip--strategy' }, ['Scheduled: ' + items.filter(i => i.status === 'scheduled').length]),
      el('span', { class: 'chip chip--healthy' }, ['Archived: ' + items.filter(i => i.status === 'archived').length]),
    ]),

    // List
    el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, items.length === 0
      ? [el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['📥']), el('div', { class: 'empty-title' }, ['Inbox empty'])])]
      : items.map(item =>
        el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [item.text]),
            el('div', { class: 'list-item-sub' }, [item.created || todayKey(), ' · ', item.status || 'raw']),
          ]),
          el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => cycleItem(item.id) } }, ['→']),
          el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => deleteItem(item.id) } }, ['×']),
        ])
      )
    ),
  ]);
}

function cycleItem(id) {
  const order = ['raw', 'action', 'scheduled', 'archived'];
  update(st => {
    const item = st.inbox.find(i => i.id === id);
    if (!item) return;
    const cur = order.indexOf(item.status || 'raw');
    item.status = order[(cur + 1) % order.length];
  });
}

function deleteItem(id) {
  update(st => { st.inbox = st.inbox.filter(i => i.id !== id); });
}
