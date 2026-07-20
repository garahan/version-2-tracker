// ============================================================
// Life OS v3 — UI primitives: toast, modal, sheet, confirm,
// prompt, confetti. Stack-based overlays.
// ============================================================

import { el, clear, mount, $ } from './dom.js';

// ---- Toast ----
export function toast(msg, opts = {}) {
  const wrap = $('#toast-wrap');
  if (!wrap) return;
  // Cap at 3
  while (wrap.children.length >= 3) wrap.removeChild(wrap.firstChild);
  const t = el('div', { class: 'toast' }, [opts.icon ? `${opts.icon} ${msg}` : msg]);
  wrap.appendChild(t);
  if (navigator.vibrate && opts.haptics !== false) navigator.vibrate(10);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity var(--dur-base)';
    setTimeout(() => t.remove(), 300);
  }, opts.duration || 2400);
}

// ---- Overlay stack ----
const _stack = [];

function openOverlay(node, kind) {
  const overlay = $('#overlay');
  overlay.classList.add('overlay--open');
  overlay.onclick = () => closeAll();
  const host = kind === 'sheet' ? $('#sheet') : $('#modal');
  clear(host);
  mount(host, [node]);
  host.classList.add(kind === 'sheet' ? 'sheet--open' : 'modal--open');
  _stack.push({ kind, host });
}

export function closeAll() {
  const overlay = $('#overlay');
  overlay.classList.remove('overlay--open');
  overlay.onclick = null;
  for (const { kind, host } of _stack) {
    host.classList.remove(kind === 'sheet' ? 'sheet--open' : 'modal--open');
    setTimeout(() => clear(host), 240);
  }
  _stack.length = 0;
}

// ---- Modal ----
export function modal({ title, body, onClose }) {
  const head = el('div', { class: 'modal-head' }, [
    el('div', { style: { fontSize: 'var(--fs-section)', fontWeight: 'var(--fw-semibold)' } }, [title || '']),
    el('button', { class: 'modal-close', on: { click: () => { closeAll(); onClose && onClose(); } } }, ['×']),
  ]);
  const node = el('div', {}, [head, el('div', { class: 'modal-body' }, [body])]);
  openOverlay(node, 'modal');
  return node;
}

// ---- Sheet ----
export function sheet({ title, body, onClose }) {
  const handle = el('div', { class: 'sheet-handle' });
  const titleEl = title ? el('div', { class: 'sheet-title' }, [title]) : null;
  const close = el('button', { class: 'modal-close', style: { position: 'absolute', top: 'var(--sp-2)', right: 'var(--sp-3)' }, on: { click: () => { closeAll(); onClose && onClose(); } } }, ['×']);
  const inner = el('div', { class: 'sheet-body' }, [body]);
  const node = el('div', {}, [handle, titleEl, close, inner]);
  openOverlay(node, 'sheet');
  return node;
}

// ---- Confirm (promise) ----
export function confirm({ title, message, danger }) {
  return new Promise((resolve) => {
    const body = el('div', {}, [
      message && el('p', { style: { color: 'var(--c-text-soft)', marginBottom: 'var(--sp-4)' } }, [message]),
      el('div', { class: 'flex gap-2' }, [
        el('button', { class: 'btn btn--ghost btn--block', on: { click: () => { closeAll(); resolve(false); } } }, ['Cancel']),
        el('button', { class: `btn ${danger ? 'btn--danger' : 'btn--primary'} btn--block`, on: { click: () => { closeAll(); resolve(true); } } }, [danger ? 'Delete' : 'Confirm']),
      ]),
    ]);
    modal({ title: title || 'Confirm', body });
  });
}

// ---- Prompt (promise) ----
export function prompt({ title, label, placeholder, initial }) {
  return new Promise((resolve) => {
    const input = el('input', { class: 'field-input', placeholder: placeholder || '', value: initial || '' });
    const body = el('div', {}, [
      label && el('div', { class: 'field-label' }, [label]),
      input,
      el('div', { class: 'flex gap-2 mt-4' }, [
        el('button', { class: 'btn btn--ghost btn--block', on: { click: () => { closeAll(); resolve(null); } } }, ['Cancel']),
        el('button', { class: 'btn btn--primary btn--block', on: { click: () => { closeAll(); resolve(input.value); } } }, ['Save']),
      ]),
    ]);
    modal({ title: title || 'Prompt', body });
    setTimeout(() => input.focus(), 100);
  });
}

// ---- Confetti (v3 §10 — review completion) ----
export function confetti(count = 80) {
  const host = $('#confetti');
  if (!host) return;
  host.classList.remove('hidden');
  clear(host);
  // Use the 5 semantic colors + accent
  const colors = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'];
  for (let i = 0; i < count; i++) {
    const piece = el('div', { class: 'confetti-piece', style: {
      left: `${Math.random() * 100}%`,
      background: colors[i % colors.length],
      animationDelay: `${Math.random() * 0.5}s`,
      animationDuration: `${2.5 + Math.random() * 1.2}s`,
      transform: `rotate(${Math.random() * 360}deg)`,
    } });
    host.appendChild(piece);
  }
  if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
  setTimeout(() => { host.classList.add('hidden'); clear(host); }, 3200);
}
