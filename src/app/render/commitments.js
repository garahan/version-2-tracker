// ============================================================
// Life OS v2 — Commitments view
// Stake points on actions. Fail = lose points. Complete = bonus.
// Scientific basis: Thaler (1981), Ashraf et al. (2006)
// ============================================================

import { el } from '../dom.js';
import { getState } from '../state.js';
import { toast, openModal, closeModal, confirmDialog } from '../ui.js';
import { createCommitment, cancelCommitment, activeCommitments, commitmentStats, resolveCommitments } from '../commitments.js';
import { DOMAIN_LIST } from '../data/domains.js';
import { todayKey, fmtDate } from '../util.js';

export function renderCommitments() {
  // Resolve any past-due commitments
  resolveCommitments();

  const s = getState();
  const active = activeCommitments();
  const stats = commitmentStats();
  const all = s.commitments || [];

  return el('div', { class: 'page' }, [
    el('header', { class: 'app-header' }, [
      el('div', { class: 'app-title' }, ['Commitments']),
      el('div', { class: 'app-subtitle' }, ['Stake points on actions · 30-50% behavior increase (Ashraf 2006)']),
    ]),

    // Stats
    el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', { class: 'card-icon' }, ['📊']),
        el('div', { class: 'card-title' }, ['Overview']),
      ]),
      el('div', { class: 'bento' }, [
        kpi('🔒', 'Active', String(stats.active)),
        kpi('✅', 'Completed', String(stats.completed)),
        kpi('❌', 'Failed', String(stats.failed)),
        kpi('🔥', 'Burned', String(stats.totalBurned)),
        kpi('💰', 'Staked', String(stats.totalStaked)),
        kpi('📈', 'Success', stats.successRate > 0 ? `${Math.round(stats.successRate * 100)}%` : '—'),
      ]),
    ]),

    // Active commitments
    el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, [`Active · ${active.length}`]),
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => createModal() } }, ['+ New commitment']),
    ]),

    active.length === 0
      ? el('div', { class: 'card' }, [
          el('div', { class: 'empty' }, [
            el('div', { class: 'empty-icon' }, ['🔒']),
            el('div', { class: 'empty-title' }, ['No active commitments']),
            el('div', { class: 'empty-body' }, ['Stake points on an action. If you fail, you lose the points. If you succeed, you get them back + 10% bonus.']),
            el('button', { class: 'btn btn--primary', on: { click: () => createModal() } }, ['+ Make a commitment']),
          ]),
        ])
      : el('div', { class: 'list' }, active.map((c) => activeRow(c))),

    // History
    all.filter((c) => c.status !== 'active').length > 0 && el('div', { class: 'section-head' }, [
      el('div', { class: 'section-title' }, ['History']),
    ]),
    all.filter((c) => c.status !== 'active').length > 0 && el('div', { class: 'list' },
      all.filter((c) => c.status !== 'active').slice(-10).reverse().map((c) => historyRow(c))
    ),
  ]);
}

function activeRow(c) {
  const daysLeft = Math.ceil((new Date(c.deadline) - new Date(todayKey())) / 86400000);
  const urgent = daysLeft <= 0;
  return el('div', { class: 'list-item' }, [
    el('div', { class: 'list-item-icon', style: { fontSize: '20px' } }, ['🔒']),
    el('div', { class: 'list-item-body' }, [
      el('div', { class: 'list-item-title' }, [c.actionName]),
      el('div', { class: 'list-item-sub' }, [
        `Stake: ${c.stake} pts · `,
        urgent ? 'Deadline: TODAY' : `Deadline: ${fmtDate(c.deadline)} (${daysLeft}d left)`,
      ]),
    ]),
    el('button', { class: 'btn btn--ghost btn--sm', on: { click: async () => {
      if (await confirmDialog({ title: 'Cancel commitment?', message: `You will lose ${c.stake} points. Continue?`, confirmText: 'Cancel & lose points' })) {
        cancelCommitment(c.id);
        toast('Commitment cancelled — points burned 🔥');
        window.__lifeosRerender?.();
      }
    } } }, ['Cancel']),
  ]);
}

function historyRow(c) {
  const icon = c.status === 'completed' ? '✅' : c.status === 'failed' ? '❌' : '🚫';
  const label = c.status === 'completed' ? `Completed +${c.stake * 0.1} bonus` : c.status === 'failed' ? `Failed — ${c.stake} pts burned` : 'Cancelled';
  return el('div', { class: 'list-item' }, [
    el('div', { class: 'list-item-icon', style: { fontSize: '20px' } }, [icon]),
    el('div', { class: 'list-item-body' }, [
      el('div', { class: 'list-item-title' }, [c.actionName]),
      el('div', { class: 'list-item-sub' }, [label, ' · ', fmtDate(c.resolvedAt || c.createdAt)]),
    ]),
  ]);
}

function kpi(icon, label, value) {
  return el('div', { class: 'card card--pad-sm bento-cell' }, [
    el('div', { class: 'flex items-center gap-2 mb-2' }, [
      el('span', { style: { fontSize: '14px' } }, [icon]),
      el('span', { class: 'text-xs text-mute uppercase' }, [label]),
    ]),
    el('div', { class: 'stat-value', style: { fontSize: 'var(--fs-xl)' } }, [value]),
  ]);
}

function createModal() {
  let actionId = '', actionName = '', stake = 10, deadlineDays = 1;
  const dailyActions = [];
  for (const dom of DOMAIN_LIST) {
    for (const a of (dom.actions || [])) {
      if (a.cadence === 'daily') dailyActions.push({ id: a.id, label: `${dom.icon} ${a.name}` });
    }
  }
  const content = el('div', { style: { minWidth: '320px' } }, [
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, ['Action to commit to']),
      el('select', { class: 'field-input', on: { change: (e) => {
        actionId = e.target.value;
        actionName = e.target.selectedOptions[0]?.textContent || '';
      } } }, [
        el('option', { value: '' }, ['— Select action —']),
        ...dailyActions.map((a) => el('option', { value: a.id }, [a.label])),
      ]),
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, [`Stake (points) — current: ${getState().totalPoints.toFixed(1)}`]),
      el('input', { type: 'number', class: 'field-input', value: '10', min: '1', max: '100', on: { input: (e) => { stake = Number(e.target.value) || 0; } } }),
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, ['Deadline (days from now)']),
      el('input', { type: 'number', class: 'field-input', value: '1', min: '1', max: '30', on: { input: (e) => { deadlineDays = Number(e.target.value) || 1; } } }),
    ]),
    el('div', { class: 'field-help' }, [
      'If you complete the action by the deadline, you get your points back + 10% bonus. ',
      'If you fail, the points are burned. This creates real cost to procrastination.',
    ]),
    el('div', { class: 'flex gap-2 justify-end' }, [
      el('button', { class: 'btn btn--ghost', on: { click: () => closeModal() } }, ['Cancel']),
      el('button', { class: 'btn btn--primary', on: { click: () => {
        if (!actionId) { toast('Select an action'); return; }
        if (stake < 1) { toast('Stake must be at least 1'); return; }
        if (stake > getState().totalPoints) { toast('Not enough points to stake'); return; }
        createCommitment({ actionId, actionName, stake, deadlineDays });
        closeModal();
        toast(`Committed! ${stake} pts staked on ${actionName} 🔒`);
        window.__lifeosRerender?.();
      } } }, ['Commit']),
    ]),
  ]);
  openModal(content, { title: 'New Commitment' });
}
