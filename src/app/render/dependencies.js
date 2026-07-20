// ============================================================
// Life OS v3 — Dependency Engine (v3 §18)
// Visual graph: everything affects something.
// Sleep → Energy → Deep Work → Career → Income → Investment → Freedom
// ============================================================

import { el } from '../dom.js';
import { go } from '../main.js';

const CHAINS = [
  ['Sleep', 'Energy', 'Deep Work', 'Career', 'Income', 'Investment', 'Freedom'],
  ['Nutrition', 'Body', 'Healthspan', 'Longevity'],
  ['Attention', 'Deep Work', 'Product Capital', 'Reputational Capital', 'Opportunities'],
  ['Reflection', 'Decisions', 'Strategy', 'Goals', 'Projects'],
  ['Family', 'Relationships', 'Satisfaction', 'Identity'],
];

export function renderDependencies() {
  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['Dependencies']),
    el('div', { class: 'app-subtitle' }, ['Everything affects something']),
    el('div', { style: { marginTop: 'var(--sp-4)' } }, CHAINS.map((chain, i) =>
      el('div', { class: 'card', style: { marginBottom: 'var(--sp-3)' } }, [
        el('div', { class: 'overline mb-3' }, [`Chain ${i + 1}`]),
        el('div', { class: 'dep-graph' }, chain.map((node, j) =>
          el('div', {}, [
            el('div', { class: 'dep-node' }, [node]),
            j < chain.length - 1 && el('div', { class: 'dep-arrow' }, ['↓']),
          ])
        )),
      ])
    )),
  ]);
}
