// ============================================================
// Life OS v3 — Leverage Engine page (v3 §20)
// Every project scores on Money/Knowledge/Automation/Network/Brand.
// ============================================================

import { el } from '../dom.js';
import { getState, update } from '../state.js';
import { go } from '../main.js';
import { LEVERAGE_DIMENSIONS, leverageIndex, leverageLabel, leverageColorClass, rankedByLeverage } from '../leverage.js';
import { toast, prompt, sheet } from '../ui.js';
import { todayKey, uid, fmtDate } from '../util.js';

export function renderLeverage() {
  const projects = rankedByLeverage();
  const avgLeverage = projects.length
    ? projects.reduce((sum, p) => sum + (p.leverageIndex || 0), 0) / projects.length
    : 0;

  return el('div', { class: 'page' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('button', { class: 'btn btn--ghost btn--sm', on: { click: () => go('more') } }, ['‹ Back']),
    ]),
    el('div', { class: 'app-title', style: { marginTop: 'var(--sp-2)' } }, ['Leverage']),
    el('div', { class: 'app-subtitle' }, ['Score projects on 5 dimensions']),

    // Avg leverage
    el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, [
      el('div', { class: 'overline' }, ['Avg leverage index']),
      el('div', { style: { fontSize: 'var(--fs-display)', fontWeight: 'var(--fw-bold)', fontVariantNumeric: 'tabular-nums' } }, [avgLeverage.toFixed(1)]),
      el('div', { class: 'text-mute text-meta' }, [leverageLabel(avgLeverage)]),
    ]),

    // 5 dimensions legend
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, ['Dimensions']),
    ]),
    el('div', { class: 'card' }, LEVERAGE_DIMENSIONS.map(dim =>
      el('div', { class: 'list-item' }, [
        el('div', { class: 'list-item-icon' }, [dim.icon]),
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [dim.label]),
          el('div', { class: 'list-item-sub' }, [dim.desc]),
        ]),
      ])
    )),

    el('button', { class: 'btn btn--primary btn--block', style: { marginTop: 'var(--sp-4)' }, on: { click: addProjectFlow } }, ['+ Score a project']),

    // Ranked projects
    el('div', { class: 'section-head', style: { marginTop: 'var(--sp-6)' } }, [
      el('div', { class: 'section-title' }, [`Projects (${projects.length})`]),
    ]),
    el('div', { class: 'card' }, projects.length === 0
      ? [el('div', { class: 'empty' }, [el('div', { class: 'empty-icon' }, ['⚡']), el('div', { class: 'empty-title' }, ['No projects scored yet'])])]
      : projects.map(p => el('div', { class: 'list-item', on: { click: () => openProject(p) } }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [p.name]),
            el('div', { class: 'list-item-sub' }, [
              `Leverage: ${p.leverageIndex?.toFixed(1) || '0.0'}/10 · ${leverageLabel(p.leverageIndex || 0)}`,
              p.updated ? ` · updated ${fmtDate(p.updated)}` : '',
            ]),
          ]),
          el('span', { class: `compound-score ${leverageColorClass(p.leverageIndex || 0)}` }, [`↗ ${p.leverageIndex?.toFixed(1) || '0.0'}`]),
        ]))
    ),
  ]);
}

async function addProjectFlow() {
  const name = await prompt({ title: 'Project name', label: 'What project?', placeholder: 'e.g. Build SaaS app' });
  if (!name) return;
  const scores = {};
  for (const dim of LEVERAGE_DIMENSIONS) {
    const val = await prompt({ title: `${dim.icon} ${dim.label}`, label: `${dim.desc} — score 0-10`, initial: '5' });
    scores[dim.id] = Math.max(0, Math.min(10, parseInt(val || '0', 10)));
  }
  update(st => {
    if (!st.projects) st.projects = [];
    st.projects.push({
      id: uid('proj'), name, scores,
      leverageIndex: leverageIndex(scores),
      status: 'active', created: todayKey(),
    });
  });
  toast('Project scored');
}

function openProject(p) {
  const body = el('div', {}, [
    el('div', { class: 'card card--pad-sm mb-4' }, [
      el('div', { class: 'overline' }, ['Leverage index']),
      el('div', { style: { fontSize: 'var(--fs-page)', fontWeight: 'var(--fw-bold)' } }, [p.leverageIndex?.toFixed(1) || '0.0', ' / 10']),
      el('div', { class: 'text-mute text-meta' }, [leverageLabel(p.leverageIndex || 0)]),
    ]),
    el('div', { class: 'overline mb-2' }, ['Dimension scores']),
    ...LEVERAGE_DIMENSIONS.map(dim => {
      const score = p.scores?.[dim.id] || 0;
      return el('div', { class: 'list-item' }, [
        el('div', { class: 'list-item-icon' }, [dim.icon]),
        el('div', { class: 'list-item-body' }, [
          el('div', { class: 'list-item-title' }, [dim.label]),
          el('div', { class: 'bar bar--sm', style: { width: '100px', marginTop: 'var(--sp-2)' } }, [
            el('div', { class: `bar-fill ${score >= 7 ? 'bar-fill--done' : score >= 4 ? 'bar-fill--floor' : 'bar-fill--danger'}`, style: { width: (score * 10) + '%' } }),
          ]),
        ]),
        el('span', { class: 'text-meta font-bold' }, [String(score)]),
      ]);
    }),
  ]);
  sheet({ title: p.name, body });
}
