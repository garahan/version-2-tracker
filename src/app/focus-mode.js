// ============================================================
// Life OS v2 — Focus Mode
// Strips interface to just: next action + timer.
// No KPIs, no tabs, no cards, no distractions.
// ============================================================

import { el } from './dom.js';
import { getState, getDay, setDayField } from './state.js';
import { todayKey, fmtDate } from './util.js';
import { dueToday, todayProgress } from './cadence.js';
import { toast } from './ui.js';

let _focusEl = null;
let _timerInterval = null;
let _timerSeconds = 0;
let _timerRunning = false;

/**
 * Enter Focus Mode.
 * Finds the next incomplete action and shows only that + a timer.
 */
export function enterFocusMode() {
  const s = getState();
  const t = todayKey();
  const due = dueToday();
  const day = getDay(t);

  // Find next incomplete action
  const next = due.find(({ action }) => {
    const v = day.habits[action.id];
    return v !== 'full' && v !== 'rest' && v !== 'floor';
  });

  if (!next) {
    toast('All done for today! 🎉');
    return;
  }

  renderFocusMode(next.action, t);
}

function renderFocusMode(action, key) {
  // Remove existing
  exitFocusMode();

  _focusEl = el('div', { class: 'focus-mode', id: 'focus-mode' }, [
    // Close button
    el('button', { class: 'focus-mode-close', on: { click: exitFocusMode } }, ['✕']),

    // Label
    el('div', { class: 'focus-mode-label' }, ["Today's next action"]),

    // Action name
    el('div', { class: 'focus-mode-action' }, [`${action.icon || ''} ${action.name}`]),

    // Timer
    el('div', { class: 'focus-mode-timer', id: 'focus-timer' }, ['45:00']),

    // Start button
    el('button', { class: 'focus-mode-btn', id: 'focus-start', on: { click: toggleTimer } }, ['Start']),

    // Complete button
    el('button', {
      class: 'focus-mode-btn',
      style: { background: 'var(--c-success)', marginTop: 'var(--sp-3)' },
      on: { click: () => completeAction(action, key) }
    }, ['Mark Done']),
  ]);

  document.body.appendChild(_focusEl);
  _timerSeconds = 45 * 60;
  updateTimerDisplay();
}

function toggleTimer() {
  _timerRunning = !_timerRunning;
  const btn = document.getElementById('focus-start');
  if (_timerRunning) {
    btn.textContent = 'Pause';
    _timerInterval = setInterval(() => {
      if (_timerSeconds > 0) {
        _timerSeconds--;
        updateTimerDisplay();
      } else {
        // Timer done
        _timerRunning = false;
        clearInterval(_timerInterval);
        const timerEl = document.getElementById('focus-timer');
        if (timerEl) timerEl.style.color = 'var(--c-success)';
        const startBtn = document.getElementById('focus-start');
        if (startBtn) startBtn.textContent = 'Restart';
        toast('Focus session complete! 🎉');
      }
    }, 1000);
  } else {
    btn.textContent = 'Resume';
    clearInterval(_timerInterval);
  }
}

function updateTimerDisplay() {
  const el = document.getElementById('focus-timer');
  if (!el) return;
  const m = Math.floor(_timerSeconds / 60);
  const s = _timerSeconds % 60;
  el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function completeAction(action, key) {
  import('./state.js').then(({ setDayAction }) => {
    setDayAction(key, action.id, 'full');
    toast(`${action.name} ✓`, { icon: '✅' });
    exitFocusMode();
    // Re-enter for next action
    setTimeout(() => enterFocusMode(), 300);
  });
}

export function exitFocusMode() {
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }
  _timerRunning = false;
  if (_focusEl && _focusEl.parentNode) {
    _focusEl.parentNode.removeChild(_focusEl);
  }
  _focusEl = null;
}
