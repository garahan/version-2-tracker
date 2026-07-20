// ============================================================
// Life OS v2 — GitHub Gist sync
// Zero-cost cloud backup + multi-device sync.
// Token stored locally only. Uses GitHub REST API v3.
// ============================================================

import { getState, setState, exportJSON, importJSON } from './state.js';
import { lsGet, lsSet } from './util.js';

const API = 'https://api.github.com';
const FILENAME = 'lifeos-state.json';
const GIST_DESC = 'Life OS v2 backup (auto)';

/** Push current state to a Gist (creates one if no gistId set). Returns gist id. */
export async function syncToGist() {
  const s = getState();
  const token = s.settings.gistToken;
  if (!token) throw new Error('No GitHub token set. Add one in Settings → Cloud sync.');
  const json = exportJSON();
  const gistId = s.settings.gistId;

  const body = {
    description: GIST_DESC,
    public: false,
    files: { [FILENAME]: { content: json } },
  };

  const res = await fetch(`${API}/gists${gistId ? `/${gistId}` : ''}`, {
    method: gistId ? 'PATCH' : 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!s.settings.gistId && data.id) {
    setState((st) => { st.settings.gistId = data.id; });
  }
  // Record last sync
  lsSet('lifeos-last-sync', { at: new Date().toISOString(), gistId: data.id });
  return data.id;
}

/** Pull state from the configured Gist and merge into local. */
export async function pullFromGist() {
  const s = getState();
  const token = s.settings.gistToken;
  const gistId = s.settings.gistId;
  if (!token) throw new Error('No GitHub token set.');
  if (!gistId) throw new Error('No Gist ID set. Push first to create one.');

  const res = await fetch(`${API}/gists/${gistId}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = await res.json();
  const file = data.files?.[FILENAME];
  if (!file) throw new Error('Gist has no lifeos-state.json file.');
  const json = file.content;
  importJSON(json);
  lsSet('lifeos-last-sync', { at: new Date().toISOString(), gistId, pulled: true });
}

/** Last sync info (for display). */
export function lastSync() {
  return lsGet('lifeos-last-sync');
}
