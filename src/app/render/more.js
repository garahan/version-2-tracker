// ============================================================
// Life OS v3 — More Hub (v3 §11)
// Grid layout. Hub for secondary sections.
// ============================================================

import { el } from '../dom.js';
import { getState } from '../state.js';
import { systemHealth } from '../system-health.js';
import { entropyMonitor } from '../system-health.js';
import { todayKey } from '../util.js';
import { setSubroute, currentSub } from '../main.js';

const TILES = [
  { id: 'system-health', icon: '🩺', label: 'System Health', desc: 'OS health · entropy', badge: 'health' },
  { id: 'analytics',     icon: '📈', label: 'Analytics',     desc: 'Momentum · trends · forecast', badge: null },
  { id: 'dependencies',  icon: '🔗', label: 'Dependencies',  desc: 'How domains affect each other', badge: null },
  { id: 'inbox',         icon: '📥', label: 'Inbox',         desc: 'Capture · clarify · archive', badge: 'inbox' },
  { id: 'decisions',     icon: '⚖️', label: 'Decisions',     desc: 'Journal · pre-mortem', badge: 'decisions' },
  { id: 'opportunities', icon: '🔮', label: 'Opportunities', desc: 'Pipeline of possibilities', badge: 'opps' },
  { id: 'lessons',       icon: '🎓', label: 'Lessons',       desc: 'Lessons · error log', badge: 'lessons' },
  { id: 'recall',        icon: '🧠', label: 'Recall',        desc: 'Spaced repetition · SM-2', badge: 'recall' },
  { id: 'commitments',   icon: '🔒', label: 'Commitments',   desc: 'Stake points on actions', badge: 'commitments' },
  { id: 'risks',         icon: '🛡️', label: 'Risks',         desc: 'Register · protocols · anti-goals · black swan', badge: 'risks' },
  { id: 'leverage',      icon: '⚡', label: 'Leverage',      desc: 'Score projects on 5 dimensions', badge: 'leverage' },
  { id: 'reviews',       icon: '📅', label: 'Reviews',       desc: 'Weekly · monthly · quarterly', badge: 'reviews' },
  { id: 'settings',      icon: '⚙️', label: 'Settings',      desc: 'Theme · sync · data', badge: null },
];

export function renderMore() {
  const s = getState();
  const health = systemHealth();
  const entropy = entropyMonitor();
  const t = todayKey();

  const badges = {
    health: { value: health.score, cls: health.score >= 70 ? 'more-tile-badge--healthy' : health.score >= 40 ? 'more-tile-badge--warning' : 'more-tile-badge--critical' },
    inbox: { value: s.inbox.filter(i => (i.status || 'raw') !== 'archived').length, cls: '' },
    decisions: { value: s.decisions.filter(d => !d.outcome && d.reviewDate && d.reviewDate < t).length, cls: 'more-tile-badge--warning' },
    opps: { value: s.opportunities.length, cls: '' },
    lessons: { value: s.lessonsLearned.length, cls: '' },
    recall: { value: (s.spacedRepetition || []).filter(c => c.nextDue && c.nextDue <= t).length, cls: 'more-tile-badge--accent' },
    commitments: { value: (s.commitments || []).filter(c => c.status === 'active').length, cls: '' },
    risks: { value: s.risks.length, cls: '' },
    leverage: { value: (s.projects || []).length, cls: '' },
    reviews: { value: (s.reviews?.weekly?.length || 0) + (s.reviews?.monthly?.length || 0), cls: '' },
  };

  return el('div', { class: 'page' }, [
    el('div', { class: 'app-title' }, ['More']),
    el('div', { class: 'app-subtitle' }, ['Engines · systems · settings']),
    el('div', { class: 'more-grid', style: { marginTop: 'var(--sp-4)' } }, TILES.map(tile => {
      const badge = tile.badge ? badges[tile.badge] : null;
      return el('div', { class: 'more-tile', on: { click: () => setSubroute(tile.id) } }, [
        badge && badge.value > 0 && el('div', { class: `more-tile-badge ${badge.cls}` }, [String(badge.value)]),
        el('div', { class: 'more-tile-icon' }, [tile.icon]),
        el('div', { class: 'more-tile-label' }, [tile.label]),
        el('div', { class: 'more-tile-desc' }, [tile.desc]),
      ]);
    })),
  ]);
}

// ---- Subroute dispatcher ----
export async function renderSubroute(id) {
  const map = {
    'system-health': () => import('./system-health.js').then(m => m.renderSystemHealth()),
    'analytics':     () => import('./analytics.js').then(m => m.renderAnalytics()),
    'dependencies':  () => import('./dependencies.js').then(m => m.renderDependencies()),
    'inbox':         () => import('./inbox.js').then(m => m.renderInbox()),
    'decisions':     () => import('./decisions.js').then(m => m.renderDecisions()),
    'opportunities': () => import('./opportunities.js').then(m => m.renderOpportunities()),
    'lessons':       () => import('./lessons.js').then(m => m.renderLessons()),
    'recall':        () => import('./recall.js').then(m => m.renderRecall()),
    'commitments':   () => import('./commitments.js').then(m => m.renderCommitments()),
    'risks':         () => import('./risks.js').then(m => m.renderRisks()),
    'leverage':      () => import('./leverage.js').then(m => m.renderLeverage()),
    'reviews':       () => import('./reviews.js').then(m => m.renderReviews()),
    'settings':      () => import('./settings.js').then(m => m.renderSettings()),
  };
  const fn = map[id];
  if (!fn) return null;
  return await fn();
}
