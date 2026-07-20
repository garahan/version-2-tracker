// ============================================================
// Life OS v2 — Onboarding
// First-run experience. Explains levels + cadence.
// Sets onboarded=true on completion.
// ============================================================

import { el, clear, mount } from './dom.js';
import { setSetting, getState } from './state.js';
import { DOMAINS_BY_LAYER, DOMAINS_BY_LEVEL, LEVELS, LAYERS } from './data/domains.js';

export function renderOnboarding() {
  const root = document.getElementById('onboarding');
  if (!root) return;
  root.classList.remove('hidden');
  clear(root);
  let step = 0;

  const steps = [
    // Step 0: Welcome
    el('div', { class: 'onb-step' }, [
      el('div', { class: 'onb-hero' }, ['⚡']),
      el('h1', { class: 'onb-title' }, ['Life OS v2']),
      el('p', { class: 'onb-sub' }, ['Operating System for Human Optimization.']),
      el('p', { class: 'onb-body' }, [
        'Not a habit tracker. A system for increasing the rate at which you accumulate all forms of capital — biological, intellectual, financial, social — through better decisions, faster learning, and leverage.',
      ]),
      el('button', { class: 'btn btn--primary btn--lg btn--block', on: { click: next } }, ['Begin →']),
    ]),
    // Step 1: The 3 layers
    el('div', { class: 'onb-step' }, [
      el('h2', { class: 'onb-title' }, ['Three layers']),
      el('p', { class: 'onb-sub' }, ['Strategy manages the Operating System. Legacy defines why it exists.']),
      ...DOMAINS_BY_LAYER.map(({ layer, domains }) =>
        el('div', { class: 'card card--pad-sm mb-2' }, [
          el('div', { class: 'flex items-center gap-2' }, [
            el('span', { style: { fontSize: '20px' } }, [layer.icon]),
            el('div', {}, [
              el('div', { class: 'font-semibold' }, [layer.name]),
              el('div', { class: 'text-xs text-mute' }, [domains.map((d) => d.name).join(' · ')]),
            ]),
          ]),
        ])
      ),
      el('button', { class: 'btn btn--primary btn--lg btn--block mt-4', on: { click: next } }, ['Next →']),
    ]),
    // Step 2: Cadence
    el('div', { class: 'onb-step' }, [
      el('h2', { class: 'onb-title' }, ['Cadence, not list']),
      el('p', { class: 'onb-sub' }, ['Less daily, more weekly / monthly / quarterly.']),
      el('div', { class: 'card card--pad-sm mb-2' }, [el('div', { class: 'text-sm' }, ['📅 Daily — 8–12 items. Energy, Big4, deep work, plan, review.'])]),
      el('div', { class: 'card card--pad-sm mb-2' }, [el('div', { class: 'text-sm' }, ['🗓️ Weekly — 10–15. Finance, projects, inbox, plan.'])]),
      el('div', { class: 'card card--pad-sm mb-2' }, [el('div', { class: 'text-sm' }, ['📆 Monthly — 15–25. KPIs, budget, network, family.'])]),
      el('div', { class: 'card card--pad-sm mb-2' }, [el('div', { class: 'text-sm' }, ['📊 Quarterly — strategy, health, rebalancing.'])]),
      el('div', { class: 'card card--pad-sm mb-2' }, [el('div', { class: 'text-sm' }, ['🎯 Annual — full life review.'])]),
      el('button', { class: 'btn btn--primary btn--lg btn--block mt-4', on: { click: next } }, ['Next →']),
    ]),
    // Step 3: Done
    el('div', { class: 'onb-step' }, [
      el('div', { class: 'onb-hero' }, ['🚀']),
      el('h2', { class: 'onb-title' }, ['Ready']),
      el('p', { class: 'onb-body' }, [
        'Start with the Today tab. Tap protocols to complete them. On bad days, tap Floor. Never miss twice.',
      ]),
      el('p', { class: 'onb-body mt-4' }, [
        'Explore Domains to see all 15 systems. Run your first Weekly Review on Sunday.',
      ]),
      el('button', { class: 'btn btn--primary btn--lg btn--block mt-4', on: { click: finish } }, ['Enter Life OS →']),
    ]),
  ];

  function render() {
    clear(root);
    mount(root, steps[step]);
  }

  function next() { step = Math.min(steps.length - 1, step + 1); render(); }
  function finish() {
    setSetting('onboarded', true);
    root.classList.add('hidden');
    window.__lifeosRerender?.();
  }

  render();
}
