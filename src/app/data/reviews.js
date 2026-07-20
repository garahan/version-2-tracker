// ============================================================
// Life OS v3 — Review Templates (v3 §10)
// 5 cadences: weekly, monthly, quarterly, semi-annual, annual.
// Wizard format — one question at a time.
// ============================================================

export const REVIEW_TEMPLATES = {
  weekly: {
    id: 'weekly', name: 'Weekly Review', icon: '🗓️', duration: '30–60 min',
    questions: [
      'What did I ship this week?',
      'What did I learn?',
      'Which protocol worked? Which failed?',
      'What are the top 3 priorities for next week?',
      'What should I say NO to?',
      'Is my cadence right — what should move up or down?',
    ],
  },
  monthly: {
    id: 'monthly', name: 'Monthly Review', icon: '📆', duration: '1–2 hours',
    questions: [
      'KPIs per domain — which are on track, which are behind?',
      'Savings rate this month — on target?',
      'Did I make at least one new contact?',
      'Did I update CV / LinkedIn with new STAR stories?',
      'Did I have a family day this month?',
      'Which projects should be killed?',
      'What did I learn this month worth keeping?',
    ],
  },
  quarterly: {
    id: 'quarterly', name: 'Quarterly Strategy Review', icon: '📊', duration: '3–4 hours',
    questions: [
      'Am I playing the right game?',
      'What is the one bet that would change the next 5 years?',
      'Which competencies am I building? Which are stagnating?',
      'What AI / leverage opportunities am I not using?',
      'What is obsolete and should be killed?',
      'What should scale 10x?',
      'Health — any lagging indicator trending wrong?',
      'Rebalancing — does my portfolio need it?',
      'Salary / rate benchmark — am I priced right?',
    ],
  },
  semiannual: {
    id: 'semiannual', name: 'Semi-annual Audit', icon: '🔍', duration: '4–6 hours',
    questions: [
      'Skill audit — which skills grew, which stagnated?',
      'Language progress — on track?',
      'AI tooling — what should I adopt?',
      'Physical form — stronger than 6 months ago?',
      'Career direction — still right?',
      'Life goals — any change?',
    ],
  },
  annual: {
    id: 'annual', name: 'Annual Life Review', icon: '🎯', duration: '6–8 hours',
    questions: [
      'Have my values changed?',
      'Is my mission still right?',
      'Capital audit — where did each capital grow or shrink?',
      '3 / 5 / 10-year strategy — still right?',
      'Risks — what new risks appeared? What mitigated?',
      'What are my 3-5 goals for next year?',
      'Legacy — what did I advance this year?',
    ],
  },
};

export const REVIEW_ORDER = ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'];
