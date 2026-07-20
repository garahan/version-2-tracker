// ============================================================
// Life OS v3 — Onboarding (first run)
// ============================================================

import { el, clear, mount, $ } from './dom.js';
import { update, applySettings } from './state.js';

const STEPS = [
  { hero: '⚡', title: 'Life OS', sub: 'Operating system for human optimization', body: 'Not a habit tracker. Not a to-do app. A system that compounds every form of capital through better decisions, feedback loops, and leverage.' },
  { hero: '🌱', title: '22 domains, 3 layers', sub: 'Foundation · Executive · Capital · Strategy · Legacy', body: 'Every domain uses the same universal management card: Objective, Principles, Indicators, Actions, Cadence, Risks, Kill Criteria, Maturity.' },
  { hero: '📅', title: 'Cadence, not list', sub: 'Only high-ROI actions are daily', body: 'Everything else moves upward: weekly, monthly, quarterly, annual. Daily actions fit in 5–10 minutes. Reviews carry the strategic work.' },
  { hero: '🎯', title: 'Today is the default', sub: 'Everything else supports Today', body: 'Open the app for 30 seconds each day. The system quietly guides better decisions over decades through the mathematics of compounding.' },
];

export function renderOnboarding() {
  let step = 0;
  const host = $('#onboarding');
  if (!host) return;
  host.classList.remove('hidden');
  render();

  function render() {
    clear(host);
    const s = STEPS[step];
    const isLast = step === STEPS.length - 1;
    mount(host, [
      el('div', { class: 'onb-step' }, [
        el('div', { class: 'onb-hero' }, [s.hero]),
        el('div', { class: 'onb-title' }, [s.title]),
        el('div', { class: 'onb-sub' }, [s.sub]),
        el('div', { class: 'onb-body' }, [s.body]),
        el('div', { class: 'wizard-progress', style: { marginTop: 'var(--sp-6)' } }, STEPS.map((_, i) =>
          el('div', { class: `wizard-dot ${i < step ? 'wizard-dot--done' : i === step ? 'wizard-dot--active' : ''}` })
        )),
        el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-8)', width: '100%' } }, [
          step > 0 && el('button', { class: 'btn btn--ghost btn--block', on: { click: () => { step--; render(); } } }, ['Back']),
          el('button', { class: 'btn btn--primary btn--block', on: { click: () => {
            if (isLast) { finish(); return; }
            step++; render();
          } } }, [isLast ? 'Begin' : 'Next']),
        ]),
      ]),
    ]);
  }

  function finish() {
    update(st => { st.settings.onboarded = true; });
    applySettings();
    host.classList.add('hidden');
    clear(host);
    window.__lifeosRerender && window.__lifeosRerender();
  }
}
