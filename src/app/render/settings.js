// ============================================================
// Life OS v2 — Settings
// Theme, accent, sync (Gist), export/import, reset.
// ============================================================

import { el } from '../dom.js';
import { getState, setSetting, exportJSON, importJSON, resetState, applySettings } from '../state.js';
import { toast, confirmDialog, openModal, closeModal } from '../ui.js';
import { syncToGist, pullFromGist } from '../sync.js';
import { addBundle, deleteBundle, bundleAdherence } from '../temptation-bundling.js';
import { DOMAIN_LIST } from '../data/domains.js';

const THEMES = [
  { id: 'midnight', label: 'Midnight', swatch: '#0b0d12' },
  { id: 'light',    label: 'Light',    swatch: '#f5f6f8' },
  { id: 'oled',     label: 'OLED',     swatch: '#000000' },
];

const ACCENTS = [
  { id: 'blue',   color: '#007acc' },
  { id: 'green',  color: '#2ea043' },
  { id: 'violet', color: '#8957e5' },
  { id: 'amber',  color: '#d4a543' },
  { id: 'rose',   color: '#e85d75' },
  { id: 'cyan',   color: '#00b8d4' },
  { id: 'lime',   color: '#7cb342' },
  { id: 'slate',  color: '#8b9dad' },
];

export function renderSettings() {
  const s = getState();
  const set = s.settings;

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Settings']),
      el('div', { class: 'app-subtitle' }, ['Theme · sync · data · reset']),
    ]),

    // Theme
    section('Theme', [
      el('div', { class: 'flex gap-2' }, THEMES.map((t) =>
        el('button', {
          class: `btn ${set.theme === t.id ? 'btn--primary' : ''}`,
          style: { flex: 1, flexDirection: 'column', height: 'auto', padding: '12px 8px', gap: '6px' },
          on: { click: () => { setSetting('theme', t.id); rerender(); } }
        }, [
          el('span', { style: { width: '20px', height: '20px', borderRadius: '50%', background: t.swatch, border: '1px solid var(--c-border-strong)' } }),
          t.label,
        ])
      )),
    ]),

    // Accent
    section('Accent', [
      el('div', { class: 'flex gap-2', style: { flexWrap: 'wrap' } }, ACCENTS.map((a) =>
        el('button', {
          class: `btn btn--icon ${set.accent === a.id ? 'btn--primary' : ''}`,
          style: { width: '40px', height: '40px', background: set.accent === a.id ? '' : a.color, borderColor: set.accent === a.id ? '' : 'transparent' },
          on: { click: () => { setSetting('accent', a.id); rerender(); } }
        }, [set.accent === a.id ? '✓' : ''])
      )),
    ]),

    // Sync (Gist)
    section('Cloud sync (GitHub Gist)', [
      el('div', { class: 'field' }, [
        el('div', { class: 'field-label' }, ['Gist ID']),
        el('input', { class: 'field-input', value: set.gistId, placeholder: 'gist id (optional — auto-created on first push)', on: { input: (e) => setSetting('gistId', e.target.value) } }),
      ]),
      el('div', { class: 'field' }, [
        el('div', { class: 'field-label' }, ['GitHub token (stored locally only)']),
        el('input', { class: 'field-input', type: 'password', value: set.gistToken, placeholder: 'ghp_… (needs gist scope)', on: { input: (e) => setSetting('gistToken', e.target.value) } }),
        el('div', { class: 'field-help' }, ['Create at github.com/settings/tokens — only "gist" scope needed.']),
      ]),
      el('div', { class: 'flex gap-2' }, [
        el('button', { class: 'btn btn--primary', style: { flex: 1 }, on: { click: async () => {
          try { const id = await syncToGist(); toast(`Synced to Gist ${id.slice(0, 8)}`); rerender(); }
          catch (e) { toast(`Sync failed: ${e.message}`, { icon: '⚠️' }); }
        } } }, ['↑ Push to Gist']),
        el('button', { class: 'btn', style: { flex: 1 }, on: { click: async () => {
          if (!(await confirmDialog({ title: 'Pull from Gist?', message: 'This will overwrite your local data with the version from the Gist. Continue?', confirmText: 'Pull & overwrite' }))) return;
          try { await pullFromGist(); toast('Pulled from Gist'); rerender(); }
          catch (e) { toast(`Pull failed: ${e.message}`, { icon: '⚠️' }); }
        } } }, ['↓ Pull from Gist']),
      ]),
    ]),

    // Data
    section('Data', [
      el('div', { class: 'flex gap-2' }, [
        el('button', { class: 'btn', style: { flex: 1 }, on: { click: exportData } }, ['↓ Export JSON']),
        el('button', { class: 'btn', style: { flex: 1 }, on: { click: importData } }, ['↑ Import JSON']),
      ]),
    ]),

    // Danger
    section('Danger zone', [
      el('button', { class: 'btn btn--danger btn--block', on: { click: async () => {
        if (await confirmDialog({ title: 'Reset everything?', message: 'This permanently deletes all your data. Export first if you want a backup.', confirmText: 'Reset all data', danger: true })) {
          if (await confirmDialog({ title: 'Are you absolutely sure?', message: 'This cannot be undone.', confirmText: 'Yes, reset', danger: true })) {
            resetState();
            applySettings();
            toast('All data reset');
            rerender();
          }
        }
      } } }, ['Reset all data']),
    ]),

    // Temptation Bundling (Milkman et al.)
    section('Temptation Bundling', [
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [
          el('div', { class: 'card-icon' }, ['🎧']),
          el('div', {}, [
            el('div', { class: 'card-title' }, ['Bundle wants with shoulds']),
            el('div', { class: 'card-subtitle' }, ['Only allow yourself a "want" during a "should" — 10-14% behavior increase (Milkman 2013)']),
          ]),
        ]),
        el('div', { class: 'list' }, (s.temptationBundles || []).map((b) =>
          el('div', { class: 'list-item' }, [
            el('div', { class: 'list-item-body' }, [
              el('div', { class: 'list-item-title' }, [`🎧 Only ${b.want} during ${b.should}`]),
              el('div', { class: 'list-item-sub' }, [`Adherence: ${Math.round(bundleAdherence(b.id) * 100)}%`]),
            ]),
            el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => { deleteBundle(b.id); toast('Bundle removed'); rerender(); } } }, ['🗑']),
          ])
        )),
        el('button', { class: 'btn btn--ghost', style: { width: '100%', marginTop: '8px' }, on: { click: () => bundleModal(s) } }, ['+ New bundle']),
      ]),
    ]),

    el('div', { class: 'text-center text-mute mt-6', style: { fontSize: 'var(--fs-meta)' } }, [
      'Life OS v2 · schema v2 · ', `v${s.version.toFixed(2)}`,
    ]),
  ]);
}

function section(title, children) {
  return el('section', { class: 'page-section' }, [
    el('div', { class: 'section-head' }, [el('div', { class: 'section-title' }, [title])]),
    ...children,
  ]);
}

function exportData() {
  const json = exportJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: `lifeos-backup-${new Date().toISOString().slice(0,10)}.json` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Exported');
}

function importData() {
  const inp = el('input', { type: 'file', accept: 'application/json', style: { display: 'none' } });
  inp.onchange = () => {
    const file = inp.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        importJSON(reader.result);
        applySettings();
        toast('Imported');
        rerender();
      } catch (e) {
        toast(`Import failed: ${e.message}`, { icon: '⚠️' });
      }
    };
    reader.readAsText(file);
  };
  document.body.appendChild(inp);
  inp.click();
  inp.remove();
}

function rerender() { window.__lifeosRerender?.(); }

function bundleModal(s) {
  let want = '', should = '', actionId = null;
  // Collect all daily actions for linking
  const dailyActions = [];
  for (const dom of DOMAIN_LIST) {
    for (const a of (dom.actions || [])) {
      if (a.cadence === 'daily') dailyActions.push({ id: a.id, label: `${dom.icon} ${a.name}`, domain: dom.name });
    }
  }
  const content = el('div', { style: { minWidth: '320px' } }, [
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, ['Want (tempting activity)']),
      el('input', { class: 'field-input', placeholder: 'Listen to favorite podcast', on: { input: (e) => { want = e.target.value; } } }),
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, ['Should (productive activity)']),
      el('input', { class: 'field-input', placeholder: 'Deep Work block', on: { input: (e) => { should = e.target.value; } } }),
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, ['Link to action (optional)']),
      el('select', { class: 'field-input', on: { change: (e) => { actionId = e.target.value || null; } } }, [
        el('option', { value: '' }, ['— None —']),
        ...dailyActions.map((a) => el('option', { value: a.id }, [a.label])),
      ]),
    ]),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: () => closeModal() } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        if (!want.trim() || !should.trim()) { toast('Fill in both fields'); return; }
        addBundle({ want: want.trim(), should: should.trim(), actionId });
        closeModal();
        toast('Bundle created 🎧');
        rerender();
      } } }, ['Create']),
    ]),
  ]);
  openModal(content, { title: 'New Temptation Bundle' });
}
