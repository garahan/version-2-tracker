// ============================================================
// Life OS v2 — DOM helpers
// Tiny hyperscript-style element builder.
// ============================================================

/**
 * Create an element.
 * @param {string} tag - tag name, e.g. 'div'
 * @param {object} [props] - attributes + props (class, dataset, on, etc.)
 * @param {(string|Node)[]} [children] - child nodes or strings
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class' || key === 'className') {
      node.className = value;
    } else if (key === 'dataset') {
      for (const [dk, dv] of Object.entries(value)) node.dataset[dk] = dv;
    } else if (key === 'on' || key === 'events') {
      for (const [evt, fn] of Object.entries(value)) node.addEventListener(evt, fn);
    } else if (key === 'style' && typeof value === 'object') {
      for (const [sk, sv] of Object.entries(value)) node.style[sk] = sv;
    } else if (key === 'html') {
      node.innerHTML = value;
    } else if (key === 'text') {
      node.textContent = value;
    } else if (key in node && key !== 'list') {
      try { node[key] = value; } catch { node.setAttribute(key, value); }
    } else {
      node.setAttribute(key, value);
    }
  }
  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  if (children == null) return;
  if (typeof children === 'string' || typeof children === 'number') {
    node.appendChild(document.createTextNode(String(children)));
    return;
  }
  if (!Array.isArray(children)) {
    node.appendChild(children);
    return;
  }
  for (const c of children) {
    if (c == null || c === false) continue;
    if (typeof c === 'string' || typeof c === 'number') {
      node.appendChild(document.createTextNode(String(c)));
    } else if (Array.isArray(c)) {
      appendChildren(node, c);
    } else {
      node.appendChild(c);
    }
  }
}

/** Shortcut: el('div', ..., ...). */
export const div = (props, children) => el('div', props, children);
export const span = (props, children) => el('span', props, children);
export const p = (props, children) => el('p', props, children);
export const h1 = (props, children) => el('h1', props, children);
export const h2 = (props, children) => el('h2', props, children);
export const h3 = (props, children) => el('h3', props, children);
export const button = (props, children) => el('button', props, children);
export const input = (props) => el('input', props);
export const textarea = (props) => el('textarea', props);
export const section = (props, children) => el('section', props, children);
export const header = (props, children) => el('header', props, children);
export const footer = (props, children) => el('footer', props, children);
export const nav = (props, children) => el('nav', props, children);
export const ul = (props, children) => el('ul', props, children);
export const li = (props, children) => el('li', props, children);
export const label = (props, children) => el('label', props, children);

/** Empty a node. */
export const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); return node; };

/** Replace children of a node. */
export const mount = (node, children) => { clear(node); appendChildren(node, children); return node; };

/** SVG helper for icons / charts. */
export function svg(viewBox, props, children) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('viewBox', viewBox);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') node.setAttribute('class', v);
    else node.setAttribute(k, v);
  }
  for (const c of children || []) node.appendChild(c);
  return node;
}

export function svgEl(name, props) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [k, v] of Object.entries(props || {})) node.setAttribute(k, v);
  return node;
}

/** Query within a node. */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Apple-style toggle switch.
 * @param {{state: 'full'|'floor'|'rest'|null, onFull: Function, onFloor: Function, onRest: Function}} opts
 * @returns {HTMLElement}
 */
export function toggle({ state, onFull, onFloor, onRest }) {
  const cls = state === 'full' ? 'toggle--on'
    : state === 'floor' ? 'toggle--floor'
    : state === 'rest' ? 'toggle--rest'
    : '';
  const btn = el('button', {
    class: `toggle ${cls}`,
    role: 'switch',
    'aria-checked': state !== null ? 'true' : 'false',
    on: {
      click: (e) => {
        e.stopPropagation();
        if (state === null || state === undefined) { onFull?.(); }
        else if (state === 'full') { onFloor?.(); }
        else if (state === 'floor') { onRest?.(); }
        else { onFull?.(); }
      },
    },
  });
  return btn;
}
