// ============================================================
// Life OS v3 — Commitments (v3 §5 commitment devices)
// Stake points on actions. Fail = burned. Complete = +10%.
// ============================================================

import { el } from '../dom.js';
import { getState, update } from '../state.js';
import { todayKey, uid, fmtDate, addDays } from '../util.js';
import { toast, prompt, confirm } from '../ui.js';
import { go } from '../main.js';

export function renderCommitments() {
  const s = getState();
  const commitments = s.commitments || [];
  const active = commitments.filter(c => c.status === 'active');
  const completed = commitments.filter(c => c.status === 'completed');
  const failed = commitments.filter(c => c.status === 'failed');
  const totalStaked = commitments.reduce((sum, c) => sum + (c.stake || 0), 0);
  const totalBurned = commitments.filter(c => c.status === 'failed').reduce((sum, c) => sum + (c.stake || 0), 0);
  const successRate = commitments.length ? Math.round((completed.length / commitments.length) * 100) : 0;

  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['Commitments']),
    el('div', { class: 'app-subtitle' }, ['Stake points on actions']),

    // Stats
    el('div', { class: 'bento', style: { marginTop: 'var(--sp-4)' } }, [
      el('div', { class: 'card card--pad-sm' }, [el('div', { class: 'stat-label' }, ['Active']), el('div', { class: 'stat-value' }, [String(active.length)])]),
      el('div', { class: 'card card--pad-sm' }, [el('div', { class: 'stat-label' }, ['Completed']), el('div', { class: 'stat-value', style: { color: 'var(--c-healthy)' } }, [String(completed.length)])]),
      el('div', { class: 'card card--pad-sm' }, [el('div', { class: 'stat-label' }, ['Failed']), el('div', { class: 'stat-value', style: { color: 'var(--c-danger)' } }, [String(failed.length)])]),
      el('div', { class: 'card card--pad-sm' }, [el('div', { class: 'stat-label' }, ['Success rate']), el('div', { class: 'stat-value' }, [successRate + '%'])]),
      el('div', { class: 'card card--pad-sm' }, [el('div', { class: 'stat-label' }, ['Total staked']), el('div', { class: 'stat-value' }, [String(totalStaked)])]),
      el('div', { class: 'card card--pad-sm' }, [el('div', { class: 'stat-label' }, ['Total burned']), el('div', { class: 'stat-value', style: { color: 'var(--c-danger)' } }, [String(totalBurned)])]),
    ]),

    el('button', { class: 'btn btn--primary btn--block', style: { marginTop: 'var(--sp-4)' }, on: { click: addCommitment } }, ['+ New commitment']),

    // Active
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, [`Active (${active.length})`]),
    ]),
    el('div', { class: 'card' }, active.length === 0
      ? [el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['🔒']), el('div', { class: 'empty-title' }, ['No active commitments'])])]
      : active.map(c => el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [c.action || c.name]),
            el('div', { class: 'list-item-sub' }, [`Stake: ${c.stake} pts · deadline ${fmtDate(c.deadline)}`]),
          ]),
          el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => cancel(c.id) } }, ['Cancel']),
        ]))
    ),
  ]);
}

async function addCommitment() {
  const action = await prompt({ title: 'Action', label: 'What action are you committing to?', placeholder: 'e.g. Deep Work block' });
  if (!action) return;
  const stake = parseInt(await prompt({ title: 'Stake', label: 'Points to stake', initial: '10' }) || '10', 10);
  const days = parseInt(await prompt({ title: 'Deadline', label: 'Days from now', initial: '7' }) || '7', 10);
  update(st => {
    st.commitments.push({
      id: uid('com'), action, stake: stake || 10,
      deadline: addDays(todayKey(), days || 7),
      status: 'active', created: todayKey(),
    });
    st.totalPoints = Math.max(0, (st.totalPoints || 0) - (stake || 10));
  });
  toast('Commitment created — points staked');
}

async function cancel(id) {
  const ok = await confirm({ title: 'Cancel commitment?', message: 'Staked points will be burned.', danger: true });
  if (!ok) return;
  update(st => {
    const c = st.commitments.find(x => x.id === id);
    if (!c) return;
    c.status = 'failed';
  });
  toast('Commitment cancelled — points burned', { icon: '🔥' });
}

// Auto-resolve past-due commitments (called on boot)
export function resolveCommitments() {
  const today = todayKey();
  update(st => {
    for (const c of (st.commitments || [])) {
      if (c.status === 'active' && c.deadline < today) {
        c.status = 'failed';
      }
    }
  });
}
