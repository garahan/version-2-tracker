// ============================================================
// Life OS v3 — Automation Engine
// Auto-derives metrics from completed actions. No manual entry needed.
//
// When you toggle an action done, the system automatically:
//   - Counts deep work minutes (from action.estMins)
//   - Tracks sleep hours (from action metadata)
//   - Counts steps (from action metadata)
//   - Updates energy/mood (from reflection)
//   - Calculates financial runway from savings rate
//   - Updates net worth trajectory
//   - Calculates domain scores from completion rates
//
// Also seeds realistic sample data on first run so the app
// isn't empty.
// ============================================================

import { getState, update, updateSilent } from './state.js';
import { todayKey, daysAgoKey, fmtNum } from './util.js';
import { allDomains } from './data/domains.js';

// ---- Auto-derive today's KPIs from completed actions ----
export function autoDeriveKPIs(state) {
  const t = todayKey();
  const day = state.days[t];
  if (!day) return state;

  const doneActions = Object.entries(day.actions).filter(([_, st]) => st === 'full' || st === 'rest' || st === 'floor');
  let deepWorkMins = 0;
  let steps = 0;
  let sleepHours = null;

  // Find action metadata from domains
  for (const [actionId, st] of doneActions) {
    const action = findAction(state, actionId);
    if (!action) continue;
    const mins = (st === 'floor' ? Math.round(action.estMins * 0.3) : action.estMins) || 0;
    // Deep work actions
    if (actionId.includes('deep') || action.name?.toLowerCase().includes('deep work')) {
      deepWorkMins += mins;
    }
    // Sleep actions
    if (actionId.includes('sleep') || action.name?.toLowerCase().includes('sleep')) {
      sleepHours = action.targetHours || 7.5;
    }
    // Steps/walking
    if (actionId.includes('walk') || actionId.includes('move') || action.name?.toLowerCase().includes('walk')) {
      steps += action.targetSteps || 8000;
    }
  }

  // Auto-update day metrics
  if (deepWorkMins > 0) day.deepWorkMins = deepWorkMins;
  if (sleepHours) {
    if (!state.metrics) state.metrics = {};
    if (!state.metrics.sleep) state.metrics.sleep = [];
    const existing = state.metrics.sleep.find(m => m.date === t);
    if (!existing) state.metrics.sleep.push({ date: t, value: sleepHours });
  }
  if (steps > 0) {
    if (!state.metrics) state.metrics = {};
    if (!state.metrics.steps) state.metrics.steps = [];
    const existing = state.metrics.steps.find(m => m.date === t);
    if (!existing) state.metrics.steps.push({ date: t, value: steps });
  }

  // Auto-calculate energy from mood + sleep + deep work
  if (day.mood && sleepHours) {
    const energy = Math.round(Math.min(10, (day.mood * 1.5 + sleepHours * 0.4 + (deepWorkMins > 0 ? 1 : 0))));
    if (!state.northStar) state.northStar = {};
    state.northStar.energy = energy;
  }

  return state;
}

// ---- Find an action by ID across all domains ----
function findAction(state, actionId) {
  for (const domain of allDomains()) {
    const userDomain = state.domains?.[domain.id] || domain;
    if (userDomain.actions) {
      const action = userDomain.actions.find(a => a.id === actionId);
      if (action) return action;
    }
  }
  return null;
}

// ---- Auto-calculate financial runway from savings ----
export function autoCalcRunway(state) {
  if (!state.northStar) state.northStar = {};
  const netWorth = state.northStar.netWorth || 0;
  const monthlyExpenses = state.northStar.monthlyExpenses || 0;
  if (monthlyExpenses > 0) {
    const runway = Math.round(netWorth / monthlyExpenses);
    if (!state.optionality) state.optionality = {};
    state.optionality.runwayMonths = runway;
  }
  return state;
}

// ---- Auto-calculate domain scores from completion rate (30-day) ----
export function autoDomainScores(state) {
  const scores = {};
  const today = todayKey();
  let totalActions = 0;
  let totalDone = 0;

  for (const domain of allDomains()) {
    let domainTotal = 0;
    let domainDone = 0;
    // Check last 30 days
    for (let i = 0; i < 30; i++) {
      const key = daysAgoKey(i);
      const day = state.days[key];
      if (!day || !day.actions) continue;
      for (const action of (domain.actions || [])) {
        if (day.actions[action.id]) {
          domainTotal++;
          totalActions++;
          const st = day.actions[action.id];
          if (st === 'full' || st === 'rest') {
            domainDone++;
            totalDone++;
          } else if (st === 'floor') {
            domainDone += 0.5;
            totalDone += 0.5;
          }
        }
      }
    }
    scores[domain.id] = domainTotal > 0 ? Math.round((domainDone / domainTotal) * 100) : 0;
  }

  return scores;
}

// ---- Auto-calculate life satisfaction from domain average ----
export function autoLifeSatisfaction(state) {
  const scores = autoDomainScores(state);
  const vals = Object.values(scores).filter(v => v > 0);
  if (vals.length === 0) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round((avg / 20) * 10) / 10; // 0-5 scale
}

// ---- Auto-calculate deep work hours (30-day) ----
export function autoDeepWorkHours(state) {
  let totalMins = 0;
  for (let i = 0; i < 30; i++) {
    const key = daysAgoKey(i);
    const day = state.days[key];
    if (day?.deepWorkMins) totalMins += day.deepWorkMins;
  }
  return Math.round((totalMins / 60) * 10) / 10;
}

// ---- Auto-calculate learning velocity (weekly hours) ----
export function autoLearningVelocity(state) {
  let totalMins = 0;
  for (let i = 0; i < 7; i++) {
    const key = daysAgoKey(i);
    const day = state.days[key];
    if (!day || !day.actions) continue;
    for (const [actionId, st] of Object.entries(day.actions)) {
      if (st !== 'full' && st !== 'rest') continue;
      const action = findAction(state, actionId);
      if (!action) continue;
      if (actionId.includes('read') || actionId.includes('know') || actionId.includes('learn') ||
          action.name?.toLowerCase().includes('read') || action.name?.toLowerCase().includes('learn')) {
        totalMins += action.estMins || 0;
      }
    }
  }
  return Math.round((totalMins / 60) * 10) / 10;
}

// ---- Seed realistic sample data on first run ----
export function seedSampleData(state) {
  const t = todayKey();
  if (!state.metrics) state.metrics = {};
  if (!state.northStar) state.northStar = {};

  // Seed last 14 days of metrics with realistic values
  for (let i = 13; i >= 0; i--) {
    const key = daysAgoKey(i);
    if (!state.days[key]) state.days[key] = { actions: {}, mood: 0, win: '', lesson: '' };

    // Vary data realistically
    const variance = Math.sin(i * 0.7) * 0.15;
    const sleepHours = +(7.5 + variance).toFixed(1);
    const hrvValue = Math.round(48 + variance * 10);
    const stepsValue = Math.round(8500 + variance * 2000);
    const energyVal = Math.round(7 + variance * 2);

    // Sleep
    if (!state.metrics.sleep) state.metrics.sleep = [];
    if (!state.metrics.sleep.find(m => m.date === key)) {
      state.metrics.sleep.push({ date: key, value: sleepHours });
    }
    // HRV
    if (!state.metrics.hrv) state.metrics.hrv = [];
    if (!state.metrics.hrv.find(m => m.date === key)) {
      state.metrics.hrv.push({ date: key, value: hrvValue });
    }
    // Steps
    if (!state.metrics.steps) state.metrics.steps = [];
    if (!state.metrics.steps.find(m => m.date === key)) {
      state.metrics.steps.push({ date: key, value: stepsValue });
    }

    // Deep work minutes (weekdays more, weekends less)
    const dayOfWeek = new Date(key.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const deepMins = isWeekday ? Math.round(150 + variance * 60) : Math.round(60 + variance * 30);
    state.days[key].deepWorkMins = deepMins;

    // Mood (slightly random but trending up)
    state.days[key].mood = Math.max(1, Math.min(5, Math.round(3.5 + variance * 1.5)));

    // Mark some actions as done for past days
    if (i > 0) {
      const sampleActions = ['body_zone2', 'att_deep', 'psy_mindful', 'nutr_water'];
      for (const actId of sampleActions) {
        if (Math.random() > 0.3) {
          state.days[key].actions[actId] = 'full';
        } else if (Math.random() > 0.5) {
          state.days[key].actions[actId] = 'floor';
        }
      }
    }
  }

  // Seed North Star metrics
  state.northStar.netWorth = state.northStar.netWorth || 285000;
  state.northStar.monthlyExpenses = state.northStar.monthlyExpenses || 4200;
  state.northStar.savingsRate = state.northStar.savingsRate || 32;
  state.northStar.energy = state.northStar.energy || 7;
  state.northStar.vo2max = state.northStar.vo2max || 48;
  state.northStar.healthspan = state.northStar.healthspan || 85;
  state.northStar.learningVelocity = state.northStar.learningVelocity || 8;
  state.northStar.deepWorkHours = autoDeepWorkHours(state);
  state.northStar.relationshipScore = state.northStar.relationshipScore || 4;
  state.northStar.optionality = state.northStar.optionality || 3;
  state.northStar.freedomScore = state.northStar.freedomScore || 3;
  state.northStar.lifeSatisfaction = autoLifeSatisfaction(state) || 3.5;

  // Seed optionality
  if (!state.optionality) state.optionality = {};
  state.optionality.runwayMonths = Math.round(state.northStar.netWorth / state.northStar.monthlyExpenses);
  state.optionality.incomeSources = state.optionality.incomeSources || 2;
  state.optionality.strongContacts = state.optionality.strongContacts || 15;

  // Seed some opportunities
  if (!state.opportunities || state.opportunities.length === 0) {
    state.opportunities = [
      { id: 'opp1', name: 'Promotion to Senior Eng', status: 'active', upside: '+40k/yr', downside: 'More stress', probability: 0.60, expectedValue: 24000, leverage: 'High', timeCost: 3 },
      { id: 'opp2', name: 'Side SaaS project', status: 'exploring', upside: '+10k/mo potential', downside: '500h investment', probability: 0.20, expectedValue: 8000, leverage: 'Very High', timeCost: 6 },
      { id: 'opp3', name: 'Angel investment in startup', status: 'waiting', upside: '10x return', downside: 'Lose 50k', probability: 0.15, expectedValue: 25000, leverage: 'High', timeCost: 2 },
    ];
  }

  // Seed a few risks
  if (!state.risks || state.risks.length === 0) {
    state.risks = [
      { id: 'rsk1', risk: 'Job loss in recession', likelihood: 2, impact: 4, mitigation: '6-month emergency fund + side income', status: 'open', date: t },
      { id: 'rsk2', risk: 'Health crisis (cardiovascular)', likelihood: 2, impact: 5, mitigation: 'Zone 2 training + regular bloodwork', status: 'open', date: t },
    ];
  }

  // Seed anti-goals
  if (!state.antiGoals || state.antiGoals.length === 0) {
    state.antiGoals = [
      { id: 'ag1', text: 'Never work for a toxic boss' },
      { id: 'ag2', text: 'Never skip sleep for work' },
      { id: 'ag3', text: 'Never stop learning' },
    ];
  }

  // Seed resilience protocols
  if (!state.resilienceProtocols || state.resilienceProtocols.length === 0) {
    state.resilienceProtocols = [
      { id: 'rp1', name: 'Job loss protocol', steps: '1. Emergency fund (6mo) 2. Update resume 3. Network outreach 4. Skill audit 5. Apply to 5/week' },
      { id: 'rp2', name: 'Health crisis protocol', steps: '1. Get second opinion 2. Research specialists 3. Insurance check 4. Treatment plan 5. Support network' },
    ];
  }

  // Seed black swan plans
  if (!state.blackSwans || state.blackSwans.length === 0) {
    state.blackSwans = [
      { id: 'bs1', event: 'Market crash (50% drop)', trigger: 'S&P drops 20% in a week', plan: '1. Don\'t sell 2. Rebalance 3. Buy index funds 4. Cut discretionary spending 5. Maintain emergency fund', lastReviewed: t },
      { id: 'bs2', event: 'Pandemic/lockdown', trigger: 'WHO declares global emergency', plan: '1. Stock essentials (30d) 2. Go remote 3. Maintain fitness routine 4. Virtual social connections 5. Focus on deep work', lastReviewed: t },
    ];
  }

  // Seed spaced repetition cards
  if (!state.spacedRepetition || state.spacedRepetition.length === 0) {
    state.spacedRepetition = [
      { id: 'sr1', question: 'What is the Pareto Principle?', answer: '80% of results come from 20% of efforts. Focus on high-leverage activities.', ease: 2.5, interval: 6, reviews: 3, nextDue: daysAgoKey(-3) },
      { id: 'sr2', question: 'What is an implementation intention?', answer: 'An if-then plan: "If situation X arises, then I will do Y." Increases goal completion by 2-3x.', ease: 2.6, interval: 12, reviews: 5, nextDue: daysAgoKey(-7) },
      { id: 'sr3', question: 'What is Bayesian updating?', answer: 'Updating your beliefs proportionally to new evidence. Prior + new data = posterior probability.', ease: 2.4, interval: 1, reviews: 1, nextDue: t },
    ];
  }

  // Seed commitments
  if (!state.commitments || state.commitments.length === 0) {
    state.commitments = [
      { id: 'cm1', action: 'No alcohol for 30 days', status: 'active', deadline: daysAgoKey(-20), stake: 100, created: daysAgoKey(10) },
    ];
  }

  // Seed decisions
  if (!state.decisions || state.decisions.length === 0) {
    state.decisions = [
      { id: 'dec1', decision: 'Switch to remote-first work', context: 'Post-pandemic, want flexibility', assumptions: ['Remote is sustainable', 'Can maintain visibility'], confidence: 7, alternatives: 'Hybrid, full office', expectedResult: 'Better work-life balance', probability: 75, reviewDate: daysAgoKey(-90), outcome: '', date: daysAgoKey(30) },
    ];
  }

  // Seed lessons
  if (!state.lessonsLearned || state.lessonsLearned.length === 0) {
    state.lessonsLearned = [
      { id: 'ls1', project: 'Q2 product launch', whatWorked: 'Daily standups kept team aligned', whatFailed: 'Underestimated testing time', why: 'No buffer in schedule', changes: 'Add 20% time buffer to all future launches', date: daysAgoKey(45) },
    ];
  }

  // Seed projects for leverage engine
  if (!state.projects || state.projects.length === 0) {
    state.projects = [
      { id: 'proj1', name: 'Build SaaS app', scores: { money: 8, knowledge: 7, automation: 9, network: 5, brand: 6 }, leverageIndex: 7.0, status: 'active', date: daysAgoKey(20) },
      { id: 'proj2', name: 'Write technical blog', scores: { money: 2, knowledge: 6, automation: 3, network: 7, brand: 8 }, leverageIndex: 5.2, status: 'active', date: daysAgoKey(10) },
      { id: 'proj3', name: 'Open source library', scores: { money: 1, knowledge: 8, automation: 4, network: 9, brand: 9 }, leverageIndex: 6.2, status: 'active', date: daysAgoKey(5) },
    ];
  }

  // Auto-derive today's KPIs
  state = autoDeriveKPIs(state);
  state = autoCalcRunway(state);

  return state;
}

// ---- Run all auto-derivations (call after any state change) ----
export function runAutomation(state) {
  state = autoDeriveKPIs(state);
  state = autoCalcRunway(state);
  if (state.northStar) {
    state.northStar.deepWorkHours = autoDeepWorkHours(state);
    state.northStar.learningVelocity = autoLearningVelocity(state);
    const sat = autoLifeSatisfaction(state);
    if (sat) state.northStar.lifeSatisfaction = sat;
  }
  return state;
}
