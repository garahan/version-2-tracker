// ============================================================
// Life OS v3 — Settings (v3 §26)
// Theme, accent, haptics, sounds, notifications, sync, data.
// ============================================================

import { el } from '../dom.js';
import { getState, update, applySettings, exportJSON, importJSON, resetAll } from '../state.js';
import { toast, confirm } from '../ui.js';
import { todayKey } from '../util.js';
import { go } from '../main.js';

const THEMES = [
  { id: 'midnight', label: 'Midnight', desc: 'Dark, low-glare' },
  { id: 'light', label: 'Light', desc: 'Daytime' },
  { id: 'oled', label: 'OLED', desc: 'Pure black' },
];

const ACCENTS = [
  { id: 'blue', label: 'Blue' },
  { id: 'green', label: 'Green' },
  { id: 'violet', label: 'Violet' },
  { id: 'amber', label: 'Amber' },
  { id: 'rose', label: 'Rose' },
  { id: 'cyan', label: 'Cyan' },
];

export function renderSettings() {
  const s = getState();

  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['Settings']),
    el('div', { class: 'app-subtitle' }, ['Theme · sync · data']),

    // Theme
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-4)' } }, [
      el('div', { class: 'section-title' }, ['Theme']),
    ]),
    el('div', { class: 'card' }, THEMES.map(t =>
      el('div', { class: 'list-item list-item--interactive', on: { click: () => setSetting('theme', t.id) } }, [
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [t.label]),
          el('div', { class: 'list-item-sub' }, [t.desc]),
        ]),
        s.settings.theme === t.id && el('span', { class: 'chip chip--accent' }, ['✓']),
      ])
    )),

    // Accent
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, ['Accent']),
    ]),
    el('div', { class: 'card' }, [
      el('div', { class: 'flex flex-wrap gap-2' }, ACCENTS.map(a =>
        el('button', {
          class: `btn ${s.settings.accent === a.id ? 'btn--primary' : 'btn--ghost'} btn--sm`,
          on: { click: () => setSetting('accent', a.id) }
        }, [a.label])
      )),
    ]),

    // Toggles
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, ['Feedback']),
    ]),
    el('div', { class: 'card' }, [
      toggleRow('Haptics', 'haptics', s),
      toggleRow('Sounds', 'sounds', s),
      toggleRow('Notifications', 'notifications', s),
    ]),

    // Data (v3 §26)
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, ['Data']),
    ]),
    el('div', { class: 'card' }, [
      el('button', { class: 'btn btn--ghost btn--block', on: { click: doExport } }, ['Export JSON']),
      el('button', { class: 'btn btn--ghost btn--block mt-2', on: { click: doImport } }, ['Import JSON']),
      el('button', { class: 'btn btn--danger btn--block mt-2', on: { click: doReset } }, ['Reset all data']),
    ]),

    // About
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, ['About']),
    ]),
    el('div', { class: 'card' }, [
      el('div', { class: 'list-item' }, [el('div', { class: 'list-item-body' }, [el('div', { class: 'list-item-title' }, ['Life OS v3']), el('div', { class: 'list-item-sub' }, ['Operating system for human optimization'])])]),
      el('div', { class: 'list-item' }, [el('div', { class: 'list-item-body' }, [el('div', { class: 'list-item-title' }, ['Local-first']), el('div', { class: 'list-item-sub' }, ['No backend · offline · your data stays on your device'])])]),
    ]),
  ]);
}

function toggleRow(label, key, s) {
  const on = !!s.settings[key];
  return el('div', { class: 'list-item' }, [
    el('div', { class: 'list-item-body' }, [el('div', { class: 'list-item-title' }, [label])]),
    el('button', {
      class: `btn ${on ? 'btn--primary' : 'btn--ghost'} btn--sm`,
      on: { click: () => setSetting(key, !on) }
    }, [on ? 'On' : 'Off']),
  ]);
}

function setSetting(key, value) {
  update(st => { st.settings[key] = value; });
  applySettings();
}

function doExport() {
  const data = exportJSON();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifeos-v3-${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Exported');
}

function doImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { importJSON(reader.result); toast('Imported'); }
      catch (e) { toast('Import failed', { icon: '⚠️' }); }
    };
    reader.readAsText(file);
  };
  input.click();
}

async function doReset() {
  const ok = await confirm({ title: 'Reset all data?', message: 'This cannot be undone. All your data will be lost.', danger: true });
  if (!ok) return;
  resetAll();
  toast('All data reset');
  location.reload();
}
