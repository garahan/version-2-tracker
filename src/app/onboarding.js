// ============================================================
// Life OS v3 — Onboarding (first run)
// ============================================================

import { el, clear, mount, $ } from './dom.js';
import { update, applySettings } from './state.js';

const STEPS = [
  { hero: '⚡', title: 'Build a better day', sub: 'A calm, private daily operating system', body: 'Choose a few actions that matter, finish the smallest useful version on hard days, and learn from your real history.' },
  { hero: '🎯', title: 'Start with eight', sub: 'A focused plan, not 47 obligations', body: 'Your starter plan covers energy, focus, movement, relationships and recovery. Weekly work is capped so Sunday still feels usable.' },
  { hero: '🔒', title: 'Your data stays yours', sub: 'Local-first · offline-ready · exportable', body: 'The app starts empty and never invents health, financial or progress data. Add only what is true for you.' },
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
        isLast && el('div', { class: 'onb-trust' }, [
          el('span', {}, ['✓ No account']),
          el('span', {}, ['✓ No fake history']),
          el('span', {}, ['✓ Works offline']),
        ]),
        el('div', { class: 'wizard-progress', style: { marginTop: 'var(--sp-6)' } }, STEPS.map((_, i) =>
          el('div', { class: `wizard-dot ${i < step ? 'wizard-dot--done' : i === step ? 'wizard-dot--active' : ''}` })
        )),
        el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-8)', width: '100%' } }, [
          step > 0 && el('button', { class: 'btn btn--ghost btn--block', on: { click: () => { step--; render(); } } }, ['Back']),
          el('button', { class: 'btn btn--primary btn--block', on: { click: () => {
            if (isLast) { finish(); return; }
            step++; render();
          } } }, [isLast ? 'Start my day' : 'Next']),
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
