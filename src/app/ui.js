// ============================================================
// Life OS v2 — UI host: toasts, modals, sheets, confetti
// Single source for transient UI. Used by every render module.
// ============================================================

import { el, clear, mount, $ } from './dom.js';
import { uid } from './util.js';

// ---- Haptics ----

function haptic(ms = 10) {
  try {
    import('./state.js').then(({ getState }) => {
      const s = getState();
      if (s.settings.haptics && navigator.vibrate) navigator.vibrate(ms);
    });
  } catch {}
}

// ---- Toasts ----

let toastWrap = null;

function ensureToastWrap() {
  if (!toastWrap) toastWrap = $('#toast-wrap');
  return toastWrap;
}

export function toast(message, opts = {}) {
  const { duration = 2400, icon = '' } = opts;
  haptic(10);
  const wrap = ensureToastWrap();
  const t = el('div', { class: 'toast' }, [icon ? `${icon} ` : '', message]);
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .3s, transform .3s';
    t.style.opacity = '0';
    t.style.transform = 'translateY(8px)';
    setTimeout(() => t.remove(), 320);
  }, duration);
}

// ---- Modal ----

let modalHost = null, overlayHost = null;
let modalStack = [];

function ensureHosts() {
  if (!modalHost) modalHost = $('#modal');
  if (!overlayHost) overlayHost = $('#overlay');
  return { modalHost, overlayHost };
}

export function openModal(content, opts = {}) {
  const { modalHost, overlayHost } = ensureHosts();
  clear(modalHost);
  const close = el('button', { class: 'btn btn--ghost btn--icon', style: { position: 'absolute', top: '12px', right: '12px' }, on: { click: () => closeModal() } }, ['×']);
  const inner = el('div', {}, [close, content]);
  mount(modalHost, inner);
  modalHost.classList.add('modal--open');
  overlayHost.classList.add('overlay--open');
  overlayHost.onclick = () => closeModal();
  modalStack.push(opts.onClose);
  return modalHost;
}

export function closeModal() {
  const { modalHost, overlayHost } = ensureHosts();
  modalHost.classList.remove('modal--open');
  overlayHost.classList.remove('overlay--open');
  overlayHost.onclick = null;
  const cb = modalStack.pop();
  if (typeof cb === 'function') cb();
}

// ---- Sheet (bottom) ----

let sheetHost = null;
let sheetStack = [];

function ensureSheet() {
  if (!sheetHost) sheetHost = $('#sheet');
  return sheetHost;
}

export function openSheet(content, opts = {}) {
  const { modalHost, overlayHost } = ensureHosts();
  const sh = ensureSheet();
  clear(sh);
  const handle = el('div', { class: 'sheet-handle' });
  const title = opts.title ? el('h2', { class: 'sheet-title' }, [opts.title]) : null;
  const close = el('button', { class: 'btn btn--ghost btn--icon', style: { position: 'absolute', top: '12px', right: '12px' }, on: { click: () => closeSheet() } }, ['×']);
  mount(sh, [handle, close, title, content].filter(Boolean));
  sh.classList.add('sheet--open');
  overlayHost.classList.add('overlay--open');
  overlayHost.onclick = () => closeSheet();
  sheetStack.push(opts.onClose);
  return sh;
}

export function closeSheet() {
  const { overlayHost } = ensureHosts();
  const sh = ensureSheet();
  sh.classList.remove('sheet--open');
  overlayHost.classList.remove('overlay--open');
  overlayHost.onclick = null;
  const cb = sheetStack.pop();
  if (typeof cb === 'function') cb();
}

export function closeAll() {
  closeModal();
  closeSheet();
}

// ---- Confetti ----

const COLORS = ['#007acc', '#4caf85', '#d4a543', '#e85d75', '#c262d4', '#ffd166'];

export function confetti(count = 80) {
  haptic([10, 30, 10]);
  const host = $('#confetti');
  if (!host) return;
  host.classList.remove('hidden');
  for (let i = 0; i < count; i++) {
    const piece = el('div', { class: 'confetti-piece', style: {
      left: `${Math.random() * 100}%`,
      background: COLORS[i % COLORS.length],
      animationDelay: `${Math.random() * 0.4}s`,
      animationDuration: `${1.6 + Math.random() * 1.2}s`,
      transform: `rotate(${Math.random() * 360}deg)`,
    } });
    host.appendChild(piece);
    setTimeout(() => piece.remove(), 3000);
  }
  setTimeout(() => host.classList.add('hidden'), 3200);
}

// ---- Confirm dialog (promise-based) ----

export function confirmDialog({ title = 'Confirm', message = '', confirmText = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const body = el('div', {}, [
      el('h3', { class: 'text-lg font-bold mb-3' }, [title]),
      message ? el('p', { class: 'text-sm text-soft mb-4' }, [message]) : null,
      el('div', { class: 'flex gap-2 justify-end' }, [
        el('button', { class: 'btn btn--ghost', on: { click: () => { closeModal(); resolve(false); } } }, ['Cancel']),
        el('button', { class: `btn ${danger ? 'btn--danger' : 'btn--primary'}`, on: { click: () => { closeModal(); resolve(true); } } }, [confirmText]),
      ]),
    ]);
    openModal(body, { onClose: () => resolve(false) });
  });
}

// ---- Prompt dialog (promise-based) ----

export function promptDialog({ title = 'Enter', label = '', placeholder = '', initial = '', confirmText = 'Save' }) {
  return new Promise((resolve) => {
    const inp = el('input', { class: 'field-input', value: initial, placeholder });
    const body = el('div', {}, [
      el('h3', { class: 'text-lg font-bold mb-3' }, [title]),
      label ? el('div', { class: 'field-label mb-2' }, [label]) : null,
      inp,
      el('div', { class: 'flex gap-2 justify-end mt-4' }, [
        el('button', { class: 'btn btn--ghost', on: { click: () => { closeModal(); resolve(null); } } }, ['Cancel']),
        el('button', { class: 'btn btn--primary', on: { click: () => { closeModal(); resolve(inp.value); } } }, [confirmText]),
      ]),
    ]);
    openModal(body);
    setTimeout(() => { inp.focus(); inp.select(); }, 100);
  });
}
