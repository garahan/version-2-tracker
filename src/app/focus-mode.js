// ============================================================
// Life OS v3 — Focus Mode (v3 §25)
// One button. UI disappears. Only: Current Action, Timer, Start, Exit.
// ============================================================

import { el, clear, mount, $ } from './dom.js';
import { toast } from './ui.js';
import { getState, setDayAction } from './state.js';
import { dueToday } from './cadence.js';
import { todayKey } from './util.js';

let _timer = null;
let _remaining = 0;
let _running = false;
let _current = null;

export function enterFocusMode() {
  const s = getState();
  const t = todayKey();
  const due = dueToday().filter(({ action }) => {
    const day = s.days[t] || { actions: {} };
    return !day.actions[action.id];
  });
  if (!due.length) {
    toast('Nothing due — enjoy the calm �️');
    return;
  }
  _current = due[0];
  _remaining = 45 * 60;
  _running = false;
  render();
}

function render() {
  let host = $('#focus-host');
  if (!host) {
    host = el('div', { id: 'focus-host' });
    document.body.appendChild(host);
  }
  clear(host);
  const node = el('div', { class: 'focus-mode' }, [
    el('button', { class: 'focus-mode-close', on: { click: exitFocusMode } }, ['Exit']),
    el('div', { class: 'focus-mode-label' }, ['Current action']),
    el('div', { class: 'focus-mode-action' }, [_current.action.name]),
    el('div', { class: 'focus-mode-timer', id: 'focus-timer' }, [fmtTime(_remaining)]),
    el('button', { class: 'focus-mode-btn', id: 'focus-btn', on: { click: toggle } }, [_running ? 'Pause' : 'Start']),
  ]);
  mount(host, [node]);
}

function toggle() {
  if (_running) {
    _running = false;
    clearInterval(_timer);
    _timer = null;
  } else {
    _running = true;
    _timer = setInterval(() => {
      _remaining--;
      if (_remaining <= 0) {
        clearInterval(_timer);
        _running = false;
        _remaining = 0;
        complete();
      }
      const tEl = $('#focus-timer');
      if (tEl) tEl.textContent = fmtTime(_remaining);
      const btn = $('#focus-btn');
      if (btn) btn.textContent = _running ? 'Pause' : 'Start';
    }, 1000);
  }
  const btn = $('#focus-btn');
  if (btn) btn.textContent = _running ? 'Pause' : 'Start';
}

function complete() {
  const t = todayKey();
  setDayAction(t, _current.action.id, 'full');
  toast('Focus block complete ✓', { icon: '🎯' });
  exitFocusMode();
}

function fmtTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function exitFocusMode() {
  if (_timer) { clearInterval(_timer); _timer = null; }
  _running = false;
  const host = $('#focus-host');
  if (host) host.remove();
}
