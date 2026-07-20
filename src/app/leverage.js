// ============================================================
// Life OS v3 — Leverage Engine (v3 §20)
// Every project scores on 5 leverage dimensions:
//   Money, Knowledge, Automation, Network, Brand
// Leverage Index = weighted average (0-10).
// High leverage = disproportionate output per unit input.
// ============================================================

import { getState, update } from './state.js';
import { uid, todayKey } from './util.js';

// ---- 5 leverage dimensions ----
export const LEVERAGE_DIMENSIONS = [
  { id: 'money',      label: 'Money',      icon: '💰', desc: 'Generates income or capital' },
  { id: 'knowledge',  label: 'Knowledge',  icon: '🧠', desc: 'Builds skills or expertise' },
  { id: 'automation', label: 'Automation', icon: '⚙️', desc: 'Works while you sleep' },
  { id: 'network',    label: 'Network',    icon: '🤝', desc: 'Builds relationships or audience' },
  { id: 'brand',      label: 'Brand',      icon: '🌟', desc: 'Builds reputation or authority' },
];

// ---- Calculate leverage index (0-10) ----
export function leverageIndex(scores) {
  if (!scores) return 0;
  const weights = { money: 0.20, knowledge: 0.20, automation: 0.25, network: 0.15, brand: 0.20 };
  let total = 0;
  let weightSum = 0;
  for (const dim of LEVERAGE_DIMENSIONS) {
    const score = scores[dim.id];
    if (score != null && score > 0) {
      total += score * weights[dim.id];
      weightSum += weights[dim.id];
    }
  }
  return weightSum > 0 ? total / weightSum : 0;
}

// ---- Get all projects with leverage scores ----
export function getAllProjects() {
  const s = getState();
  return s.projects || [];
}

// ---- Add a project with leverage scores ----
export function addProject(name, scores = {}) {
  update(st => {
    if (!st.projects) st.projects = [];
    st.projects.push({
      id: uid('proj'),
      name,
      scores,
      leverageIndex: leverageIndex(scores),
      status: 'active',
      created: todayKey(),
    });
  });
}

// ---- Update project leverage scores ----
export function updateProjectScores(id, scores) {
  update(st => {
    const proj = (st.projects || []).find(p => p.id === id);
    if (!proj) return;
    proj.scores = { ...proj.scores, ...scores };
    proj.leverageIndex = leverageIndex(proj.scores);
    proj.updated = todayKey();
  });
}

// ---- Rank projects by leverage ----
export function rankedByLeverage() {
  const projects = getAllProjects();
  return projects.slice().sort((a, b) => (b.leverageIndex || 0) - (a.leverageIndex || 0));
}

// ---- Leverage label ----
export function leverageLabel(score) {
  if (score >= 8) return 'Very High';
  if (score >= 6) return 'High';
  if (score >= 4) return 'Medium';
  if (score >= 2) return 'Low';
  return 'Minimal';
}

// ---- Leverage color class ----
export function leverageColorClass(score) {
  if (score >= 8) return 'compound-score--high';
  if (score >= 6) return 'compound-score--mid';
  return 'compound-score--low';
}
