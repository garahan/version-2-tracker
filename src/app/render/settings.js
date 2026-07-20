// ============================================================
// Life OS v3 — Settings (v3 §26)
// Theme, accent, haptics, sounds, notifications, sync, data.
// ============================================================

import { el } from '../dom.js';
import { getState, update, applySettings, exportJSON, importJSON, resetAll } from '../state.js';
import { toast, confirm, prompt } from '../ui.js';
import { todayKey, fmtDate } from '../util.js';
import { go } from '../main.js';
import { isConfigured, createBackup, pushBackup, pullBackup, testToken } from '../gist-sync.js';
import { isEncrypted, enableEncryption, disableEncryption } from '../crypto.js';

const THEMES = [
  { id: 'midnight', label: 'Midnight', desc: 'Dark, low-glare' },
  { id: 'light', label: 'Light', desc: 'Daytime' },
  { id: 'oled', label: 'OLED', desc: 'Pure black' },
];

const ACCENTS = [
  { id: 'indigo', label: 'Indigo' },
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

    // Sync — GitHub Gist backup (v3 §26)
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, ['Sync · GitHub Gist']),
    ]),
    el('div', { class: 'card' }, [
      el('div', { class: 'list-item' }, [
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, ['Status']),
          el('div', { class: 'list-item-sub' }, [
            isConfigured()
              ? `Connected · Gist: ${s.settings.gistId?.substring(0, 8)}…`
              : 'Not configured',
            s.settings.lastSync ? ` · Last: ${fmtDate(s.settings.lastSync)}` : '',
          ]),
        ]),
        isConfigured()
          ? el('span', { class: 'chip chip--healthy' }, ['✓'])
          : el('span', { class: 'chip chip--attention' }, ['Off']),
      ]),
      el('button', { class: 'btn btn--ghost btn--block mt-2', on: { click: setupSync } }, [isConfigured() ? 'Reconfigure token' : 'Connect GitHub']),
      isConfigured() && el('button', { class: 'btn btn--primary btn--block mt-2', on: { click: doPush } }, ['Push backup now']),
      isConfigured() && el('button', { class: 'btn btn--ghost btn--block mt-2', on: { click: doPull } }, ['Pull from gist']),
    ]),

    // Encryption (v3 §26 — encryption-ready)
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, ['Encryption']),
    ]),
    el('div', { class: 'card' }, [
      el('div', { class: 'list-item' }, [
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, ['At-rest encryption']),
          el('div', { class: 'list-item-sub' }, [
            isEncrypted()
              ? 'AES-256-GCM · PBKDF2 (100k iterations)'
              : 'Plain JSON · enable to encrypt your data with a passphrase',
          ]),
        ]),
        isEncrypted()
          ? el('span', { class: 'chip chip--healthy' }, ['🔒'])
          : el('span', { class: 'chip' }, ['Off']),
      ]),
      !isEncrypted()
        ? el('button', { class: 'btn btn--ghost btn--block mt-2', on: { click: enableEnc } }, ['Enable encryption'])
        : el('button', { class: 'btn btn--danger btn--block mt-2', on: { click: disableEnc } }, ['Disable encryption']),
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

// ---- Gist sync handlers ----
async function setupSync() {
  const token = await prompt({
    title: 'GitHub Gist sync',
    label: 'Paste a personal access token (classic) with "gist" scope',
    placeholder: 'ghp_…',
  });
  if (!token) return;
  toast('Testing token…');
  try {
    const username = await testToken(token);
    if (!username) { toast('Invalid token', { icon: '⚠️' }); return; }
    update(st => { st.settings.gistToken = token.trim(); });
    toast(`Connected as @${username}`);
    // Create initial backup if no gist ID
    if (!getState().settings.gistId) {
      toast('Creating initial backup…');
      const id = await createBackup();
      toast(`Backup created (gist ${id.substring(0, 8)}…)`);
    }
  } catch (e) {
    toast('Sync setup failed: ' + e.message, { icon: '⚠️' });
  }
}

async function doPush() {
  toast('Pushing backup…');
  try {
    await pushBackup();
    toast('Backup pushed ✓');
  } catch (e) {
    toast('Push failed: ' + e.message, { icon: '⚠️' });
  }
}

async function doPull() {
  const ok = await confirm({ title: 'Pull from gist?', message: 'This replaces your local data with the gist version.', danger: true });
  if (!ok) return;
  toast('Pulling…');
  try {
    await pullBackup();
    toast('Pulled ✓ — reloading');
    setTimeout(() => location.reload(), 800);
  } catch (e) {
    toast('Pull failed: ' + e.message, { icon: '⚠️' });
  }
}

// ---- Encryption handlers ----
async function enableEnc() {
  const pass = await prompt({ title: 'Set passphrase', label: 'Choose a passphrase to encrypt your data at rest', placeholder: '••••••••' });
  if (!pass) return;
  const confirm2 = await prompt({ title: 'Confirm passphrase', label: 'Re-enter to confirm', placeholder: '••••••••' });
  if (pass !== confirm2) { toast('Passphrases do not match', { icon: '⚠️' }); return; }
  try {
    const data = exportJSON();
    await enableEncryption(pass, data);
    toast('Encryption enabled 🔒');
  } catch (e) {
    toast('Encryption failed: ' + e.message, { icon: '⚠️' });
  }
}

async function disableEnc() {
  const ok = await confirm({ title: 'Disable encryption?', message: 'Your data will be stored as plain JSON again.', danger: true });
  if (!ok) return;
  disableEncryption();
  toast('Encryption disabled');
}
