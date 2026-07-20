// ============================================================
// Life OS v3 — GitHub Gist Backup (v3 §26)
// Zero-cost cloud backup + multi-device sync via GitHub Gists.
// Uses a personal access token (classic) with gist scope.
// ============================================================

import { getState, update, save } from './state.js';
import { todayKey } from './util.js';

const GIST_API = 'https://api.github.com/gists';
const FILENAME = 'lifeos-v3-backup.json';

// ---- Check if sync is configured ----
export function isConfigured() {
  const s = getState();
  return !!(s.settings.gistToken && s.settings.gistId);
}

// ---- Create a new secret gist with the current state ----
export async function createBackup() {
  const s = getState();
  if (!s.settings.gistToken) throw new Error('No GitHub token. Add one in Settings → Sync.');
  const body = {
    description: 'Life OS v3 backup',
    public: false,
    files: { [FILENAME]: { content: JSON.stringify(s, null, 2) } },
  };
  const resp = await fetch(GIST_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${s.settings.gistToken}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`GitHub API error: ${resp.status} ${err}`);
  }
  const gist = await resp.json();
  update(st => {
    st.settings.gistId = gist.id;
    st.settings.lastSync = todayKey();
  });
  return gist.id;
}

// ---- Push current state to existing gist ----
export async function pushBackup() {
  const s = getState();
  if (!s.settings.gistToken) throw new Error('No GitHub token.');
  if (!s.settings.gistId) return createBackup();
  const body = {
    files: { [FILENAME]: { content: JSON.stringify(s, null, 2) } },
  };
  const resp = await fetch(`${GIST_API}/${s.settings.gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${s.settings.gistToken}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`GitHub API error: ${resp.status} ${err}`);
  }
  update(st => { st.settings.lastSync = todayKey(); });
}

// ---- Pull state from gist and replace local ----
export async function pullBackup() {
  const s = getState();
  if (!s.settings.gistToken) throw new Error('No GitHub token.');
  if (!s.settings.gistId) throw new Error('No gist ID. Create a backup first.');
  const resp = await fetch(`${GIST_API}/${s.settings.gistId}`, {
    headers: {
      'Authorization': `Bearer ${s.settings.gistToken}`,
      'Accept': 'application/vnd.github+json',
    },
  });
  if (!resp.ok) throw new Error(`GitHub API error: ${resp.status}`);
  const gist = await resp.json();
  const file = gist.files?.[FILENAME];
  if (!file) throw new Error('Backup file not found in gist.');
  const data = JSON.parse(file.content);
  // Replace local state with pulled data
  update(st => {
    Object.assign(st, data);
    st.settings.lastSync = todayKey();
  });
  return data;
}

// ---- Test token validity ----
export async function testToken(token) {
  const resp = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
  });
  if (!resp.ok) return null;
  const user = await resp.json();
  return user.login;
}
