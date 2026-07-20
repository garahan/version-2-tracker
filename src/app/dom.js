// ============================================================
// Life OS v3 — DOM helpers
// Minimal, no framework. Tagged helpers for common cases.
// ============================================================

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'on') {
      for (const [evt, fn] of Object.entries(v)) node.addEventListener(evt, fn);
    }
    else if (k === 'html') node.innerHTML = v;
    else if (k in node) {
      try { node[k] = v; } catch { node.setAttribute(k, v); }
    } else node.setAttribute(k, v);
  }
  mount(node, children);
  return node;
}

export function div(cls, children) { return el('div', { class: cls }, children); }
export function span(cls, children) { return el('span', { class: cls }, children); }
export function btn(cls, label, on) { return el('button', { class: cls, on: on ? { click: on } : {} }, [label]); }

export function mount(parent, children) {
  if (children == null) return;
  if (!Array.isArray(children)) children = [children];
  for (const c of children) {
    if (c == null || c === false) continue;
    if (typeof c === 'string' || typeof c === 'number') parent.appendChild(document.createTextNode(String(c)));
    else parent.appendChild(c);
  }
}

export function clear(node) {
  while (node && node.firstChild) node.removeChild(node.firstChild);
}

export function $(sel, root = document) { return root.querySelector(sel); }
export function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

// ---- SVG helpers ----
export function svg(viewBox, attrs, children = []) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('viewBox', viewBox);
  for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
  mount(node, children);
  return node;
}

export function svgEl(tag, attrs) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v != null) node.setAttribute(k, v);
  }
  return node;
}

// ---- Toggle (Apple-style cycle: empty → full → floor → rest) ----
export function toggle(state, on) {
  const t = el('button', { class: `check check--${state || ''}`, on: on ? { click: on } : {} });
  if (state === 'full' || state === 'done') t.textContent = '✓';
  else if (state === 'floor') t.textContent = '½';
  else if (state === 'rest') t.textContent = 'R';
  return t;
}
