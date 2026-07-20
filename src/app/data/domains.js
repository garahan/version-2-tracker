// ============================================================
// Life OS v3 — Domain Architecture
// 22 domains across 5 levels / 3 layers.
// Every domain uses the SAME 17-field universal management card
// (v3 §6): Objective, Principles, Leading Indicators, Lagging
// Indicators, Actions, Cadence, Trigger, Checklist, SOP,
// Automation, Risk Register, Kill Criteria, Experiments,
// Review Questions, Dependencies, Resources, Maturity.
// ============================================================

// ---- 3-Layer Architecture (v3 §4) ----
// Operating = Foundation + Executive + Capital (daily work)
// Strategic = Strategy (controls Operations)
// Legacy    = Legacy (gives meaning to Strategy)
export const LAYERS = {
  operating: { id: 'operating', name: 'Operating', icon: '⚙️', desc: 'Foundation + Executive + Capital — daily work', levels: [1, 2, 3] },
  strategic: { id: 'strategic', name: 'Strategic', icon: '🎯', desc: 'Direction, resource allocation, game selection', levels: [4] },
  legacy:    { id: 'legacy',    name: 'Legacy',    icon: '🏛️', desc: 'Principles, long-term impact, what outlives you', levels: [5] },
};
export const LAYER_ORDER = ['operating', 'strategic', 'legacy'];

// ---- 5 Levels ----
export const LEVELS = {
  1: { id: 1, name: 'Foundation', icon: '🌱' },
  2: { id: 2, name: 'Executive',  icon: '🧠' },
  3: { id: 3, name: 'Capital',    icon: '💎' },
  4: { id: 4, name: 'Strategy',   icon: '🎯' },
  5: { id: 5, name: 'Legacy',     icon: '🏛️' },
};

// ---- Cadences (v3 §7) ----
export const CADENCE = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
  quarterly: 'Quarterly', semiannual: 'Semi-annual',
  annual: 'Annual', event: 'Event-driven',
};
export const CADENCE_ORDER = ['daily', 'weekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'event'];

// ---- Universal card factory ----
const card = (d) => ({
  maturity: 1,
  principles: [],
  leadingIndicators: [],
  laggingIndicators: [],
  actions: [],
  trigger: '',
  checklist: [],
  sop: '',
  automation: [],
  riskRegister: [],
  killCriteria: [],
  experiments: [],
  reviewQuestions: [],
  dependencies: [],
  resources: [],
  ...d,
});

// ---- Action factory ----
const act = (d) => ({
  floor: '', full: '', cue: '', response: '', implementationIntention: '',
  estMins: 5, compoundScore: 5, ...d,
});

// ============================================================
// LEVEL 1 — FOUNDATION (6 domains)
// ============================================================
export const DEFAULT_DOMAINS = {

  // ---- Body (training + performance + recovery) ----
  body: card({
    id: 'body', level: 1, name: 'Body', icon: '🏋️',
    objective: 'Maximum organism performance into deep old age.',
    principles: [
      'Sleep > Nutrition > Exercise > Supplements.',
      'Never miss twice. On bad days, do the Floor.',
      'Progressive overload or maintenance — never atrophy.',
    ],
    leadingIndicators: [
      { name: 'Sleep hours', target: 7.5, unit: 'h', cadence: 'daily' },
      { name: 'Steps', target: 8000, unit: 'steps', cadence: 'daily' },
      { name: 'Workouts', target: 4, unit: '/wk', cadence: 'weekly' },
      { name: 'Zone 2', target: 180, unit: 'min', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'VO₂max', unit: 'mL/kg/min', source: 'health' },
      { name: 'HRV', unit: 'ms', source: 'health' },
      { name: 'Body fat', unit: '%', source: 'manual' },
      { name: 'Resting HR', unit: 'bpm', source: 'health' },
    ],
    actions: [
      act({ id: 'body_move', name: 'Move', cadence: 'daily', icon: '🏋️', floor: '1 set pushups + squats', full: 'Gym Day A/B', cue: 'After morning coffee', response: 'Movement practice', implementationIntention: 'If I finish morning coffee, then I will move', estMins: 20, compoundScore: 9 }),
      act({ id: 'body_wind', name: 'Wind Down', cadence: 'daily', icon: '🌙', floor: 'Phone out of bedroom', full: 'No late scroll + lights dim', cue: 'At 21:30', response: 'Phone out, lights dim', implementationIntention: 'If it is 21:30, then I will remove my phone from the bedroom', estMins: 5, compoundScore: 9 }),
      act({ id: 'body_sun', name: 'Sunlight', cadence: 'daily', icon: '☀️', floor: '5 min', full: '15 min morning sun', cue: 'After waking', response: 'Step outside', implementationIntention: 'If I wake up, then I will get sunlight within 30 min', estMins: 10, compoundScore: 7 }),
      act({ id: 'body_mobility', name: 'Mobility', cadence: 'daily', icon: '🤸', floor: '5 min', full: '10 min routine', cue: 'After shower', response: 'Mobility work', implementationIntention: 'If I finish my shower, then I will do mobility', estMins: 5, compoundScore: 6 }),
      act({ id: 'body_zone2', name: 'Zone 2 cardio', cadence: 'weekly', icon: '🚴', floor: '60 min', full: '180 min', estMins: 60, compoundScore: 8 }),
      act({ id: 'body_strength', name: 'Strength session', cadence: 'weekly', icon: '💪', floor: '1', full: '2', estMins: 60, compoundScore: 9 }),
      act({ id: 'body_weight', name: 'Weigh-in', cadence: 'weekly', icon: '⚖️', estMins: 1, compoundScore: 3 }),
    ],
    trigger: 'Morning, post-work, evening',
    checklist: ['Lay out clothes night before', 'Phone in kitchen overnight', 'Water bottle filled'],
    sop: 'Mon/Wed/Fri: Gym Day A (squat, bench, row). Tue/Sat: Zone 2. Thu: mobility + rest.',
    automation: ['Apple Watch', 'Health app'],
    riskRegister: [
      { risk: 'Sleep deprivation', mitigation: 'Hard wind-down at 21:30' },
      { risk: 'Overtraining', mitigation: 'Deload every 4th week' },
      { risk: 'Injury', mitigation: 'Form > weight; warm up always' },
    ],
    killCriteria: ['No progress on any lagging indicator for 2 quarters → reprogram'],
    experiments: [{ name: 'Cold exposure 2 min post-shower', status: 'active' }],
    reviewQuestions: ['What most degraded my energy this week?', 'Which training block is stale?'],
    dependencies: ['psyche', 'nutrition'],
    resources: ['Attia "Outlive"', 'Huberman podcast'],
  }),

  // ---- Nutrition ----
  nutrition: card({
    id: 'nutrition', level: 1, name: 'Nutrition', icon: '🥩',
    objective: 'Fuel that supports performance, longevity, and body composition.',
    principles: [
      'Protein first, every meal.',
      'Whole foods > supplements.',
      'Caloric discipline when cutting; surplus when building.',
    ],
    leadingIndicators: [
      { name: 'Protein', target: 168, unit: 'g', cadence: 'daily' },
      { name: 'Water', target: 3, unit: 'L', cadence: 'daily' },
      { name: 'Meals logged', target: 3, unit: '/day', cadence: 'daily' },
    ],
    laggingIndicators: [
      { name: 'Body fat', unit: '%', source: 'manual' },
      { name: 'Weight', unit: 'kg', source: 'manual' },
      { name: 'Fasting glucose', unit: 'mg/dL', source: 'bloods' },
    ],
    actions: [
      act({ id: 'nutr_protein', name: 'Protein meal', cadence: 'daily', icon: '🥩', floor: '1 protein meal', full: '30g+ per meal', cue: 'Before each meal', response: 'Check protein first', implementationIntention: 'If I sit down to eat, then I will check protein first', estMins: 1, compoundScore: 8 }),
      act({ id: 'nutr_water', name: 'Water', cadence: 'daily', icon: '💧', floor: '2 L', full: '3 L', cue: 'After bathroom', response: 'Drink a glass', implementationIntention: 'If I return from the bathroom, then I will drink water', estMins: 1, compoundScore: 5 }),
      act({ id: 'nutr_log', name: 'Log meals', cadence: 'daily', icon: '📝', floor: '1 meal', full: 'All meals', cue: 'After eating', response: 'Log in Cronometer', implementationIntention: 'If I finish eating, then I will log the meal', estMins: 3, compoundScore: 6 }),
    ],
    trigger: 'Each meal',
    checklist: ['30g protein per meal', 'Vegetables or fruit with lunch/dinner', 'No liquid calories'],
    sop: 'Breakfast: eggs + oats. Lunch: chicken + rice + veg. Dinner: fish + veg. Snack: greek yogurt.',
    automation: ['Cronometer', 'Apple Health'],
    riskRegister: [{ risk: 'Under-eating during cuts', mitigation: 'Never cut below 80% maintenance' }],
    killCriteria: ['Sustained energy crashes for 2 weeks → reprogram macros'],
    experiments: [{ name: 'Time-restricted eating 14:10', status: 'planned' }],
    reviewQuestions: ['Did I hit protein every day?', 'Where did I drift?'],
    dependencies: ['body'],
    resources: ['Cronometer', 'Attia "Outlive" ch. 10'],
  }),

  // ---- Medical (longevity checks, bloods, screenings) ----
  medical: card({
    id: 'medical', level: 1, name: 'Medical', icon: '🩸',
    objective: 'Medicine 3.0: detect and reverse disease before symptoms.',
    principles: ['Measure before managing.', 'Prevention > treatment.', 'Annual deep panel; quarterly basics.'],
    leadingIndicators: [
      { name: 'Checkups done', target: 1, unit: '/yr', cadence: 'annual' },
      { name: 'Bloods done', target: 4, unit: '/yr', cadence: 'quarterly' },
    ],
    laggingIndicators: [
      { name: 'ApoB', unit: 'mg/dL', source: 'bloods' },
      { name: 'HbA1c', unit: '%', source: 'bloods' },
      { name: 'Fasting insulin', unit: 'mIU/L', source: 'bloods' },
    ],
    actions: [
      act({ id: 'med_bloods', name: 'Blood panel', cadence: 'quarterly', icon: '🩸', estMins: 30, compoundScore: 7 }),
      act({ id: 'med_dexa', name: 'DEXA / Ningen Dock', cadence: 'annual', icon: '🏥', estMins: 120, compoundScore: 8 }),
      act({ id: 'med_dental', name: 'Dental check', cadence: 'annual', icon: '🦷', estMins: 60, compoundScore: 5 }),
      act({ id: 'med_derma', name: 'Dermatology', cadence: 'annual', icon: '🩺', estMins: 30, compoundScore: 5 }),
    ],
    trigger: 'Quarterly / annual calendar',
    checklist: ['Book appointment', 'Fast 12h before bloods', 'Bring prior results'],
    sop: 'Q1: full panel + ApoB. Q2: DEXA. Q3: follow-up + dental. Q4: derma + annual physical.',
    automation: ['Calendar reminders'],
    riskRegister: [{ risk: 'Silent metabolic dysfunction', mitigation: 'Quarterly glucose + insulin' }],
    killCriteria: ['All markers optimal for 2 years → reduce to semi-annual'],
    experiments: [],
    reviewQuestions: ['Any marker trending wrong?', 'What follow-up is overdue?'],
    dependencies: ['body', 'nutrition'],
    resources: ['Attia "Outlive"', 'Peter Attia podcast'],
  }),

  // ---- Psyche (stress, emotions, mental flexibility, recovery) ----
  psyche: card({
    id: 'psyche', level: 1, name: 'Psyche', icon: '🧘',
    objective: 'Emotional resilience and cognitive flexibility under stress.',
    principles: [
      'Name the emotion before reacting.',
      'Stoic dichotomy: control what you can, accept what you cannot.',
      'Reflection turns experience into wisdom.',
    ],
    leadingIndicators: [
      { name: 'Mood check-ins', target: 2, unit: '/day', cadence: 'daily' },
      { name: 'Reflection notes', target: 7, unit: '/wk', cadence: 'weekly' },
      { name: 'Mindful minutes', target: 10, unit: 'min', cadence: 'daily' },
    ],
    laggingIndicators: [
      { name: 'Avg mood (14d)', unit: '1-5' },
      { name: 'Stress events', unit: 'count' },
    ],
    actions: [
      act({ id: 'psy_mood', name: 'Mood check-in', cadence: 'daily', icon: '😊', cue: 'After lunch', response: 'Rate 1-5 + name emotion', implementationIntention: 'If I finish lunch, then I will check my mood', estMins: 1, compoundScore: 6 }),
      act({ id: 'psy_note', name: 'Evening reflection', cadence: 'daily', icon: '📝', cue: 'Before bed', response: 'One win, one lesson', implementationIntention: 'If I get into bed, then I will write one win and one lesson', estMins: 3, compoundScore: 8 }),
      act({ id: 'psy_mindful', name: 'Mindful minutes', cadence: 'daily', icon: '🧘', floor: '3 min', full: '10 min', cue: 'After waking', response: 'Breathe / meditate', implementationIntention: 'If I wake up, then I will sit for mindful minutes', estMins: 10, compoundScore: 7 }),
      act({ id: 'psy_journal', name: 'Journal', cadence: 'weekly', icon: '📖', estMins: 15, compoundScore: 7 }),
    ],
    trigger: 'Morning, midday, evening',
    checklist: ['Name the emotion', 'Locate it in the body', 'Choose response, not reaction'],
    sop: 'Morning: 10 min breath. Midday: mood check. Evening: 1 win + 1 lesson.',
    automation: [],
    riskRegister: [{ risk: 'Chronic stress', mitigation: 'Daily reflection + weekly journal' }],
    killCriteria: ['Avg mood < 2.5 for 2 weeks → seek support'],
    experiments: [{ name: 'Box breathing 4-4-4-4 before sleep', status: 'active' }],
    reviewQuestions: ['What triggered the strongest emotion this week?', 'What pattern keeps recurring?'],
    dependencies: ['body', 'identity'],
    resources: ['Stoicism', 'Huberman emotion episodes'],
  }),

  // ---- Identity ----
  identity: card({
    id: 'identity', level: 1, name: 'Identity', icon: '🪞',
    objective: 'A deliberate identity that makes the right actions the default.',
    principles: [
      'Every action is a vote for who you become.',
      'Identity statements > goals.',
      'Re-audit semi-annually.',
    ],
    leadingIndicators: [
      { name: 'Identity reviews', target: 2, unit: '/yr', cadence: 'semiannual' },
      { name: 'Statements written', target: 5, unit: 'count', cadence: 'semiannual' },
    ],
    laggingIndicators: [
      { name: 'Identity coherence', unit: '1-5' },
      { name: 'Value-behavior alignment', unit: '1-5' },
    ],
    actions: [
      act({ id: 'id_audit', name: 'Identity audit', cadence: 'semiannual', icon: '🪞', estMins: 60, compoundScore: 8 }),
      act({ id: 'id_statements', name: 'Refine identity statements', cadence: 'semiannual', icon: '✍️', estMins: 30, compoundScore: 7 }),
    ],
    trigger: 'First Sunday of Jan / Jul',
    checklist: ['List current identity statements', 'Check each against behavior', 'Rewrite outdated ones'],
    sop: 'Write 5-7 "I am the kind of person who..." statements. Score each 1-5 for alignment with last 6 months of behavior. Rewrite.',
    automation: [],
    riskRegister: [{ risk: 'Identity drift', mitigation: 'Semi-annual audit' }],
    killCriteria: ['Statements unchanged for 2 years → force rewrite'],
    experiments: [],
    reviewQuestions: ['Who have I become in the last 6 months?', 'Which statement no longer fits?'],
    dependencies: ['psyche', 'strategy_vision'],
    resources: ['Clear "Atomic Habits"', 'Clear "3 Signs of a Miserable Job"'],
  }),

  // ---- Environment (physical + digital + home + workspace) ----
  environment: card({
    id: 'environment', level: 1, name: 'Environment', icon: '🪴',
    objective: 'A physical and digital environment that makes the right action the default.',
    principles: [
      'Clean space, clean mind.',
      'Default environment drives default behavior.',
      'Reduce friction for good actions; add friction for bad.',
    ],
    leadingIndicators: [
      { name: 'Workspace resets', target: 1, unit: '/wk', cadence: 'weekly' },
      { name: 'Inbox Zero', target: 1, unit: '/wk', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'Screen time', unit: 'h/day', source: 'health' },
      { name: 'Notifications', unit: 'count', source: 'manual' },
    ],
    actions: [
      act({ id: 'env_ws', name: 'Workspace reset', cadence: 'weekly', icon: '🧹', estMins: 15, compoundScore: 5 }),
      act({ id: 'env_inbox', name: 'Inbox Zero', cadence: 'weekly', icon: '📭', estMins: 20, compoundScore: 5 }),
      act({ id: 'env_notif', name: 'Notification audit', cadence: 'monthly', icon: '🔕', estMins: 15, compoundScore: 6 }),
      act({ id: 'env_unsub', name: 'Unsubscribe purge', cadence: 'quarterly', icon: '🗑️', estMins: 20, compoundScore: 4 }),
    ],
    trigger: 'Sunday morning',
    checklist: ['Clear desk', 'Close unused tabs', 'Mute non-essential notifications'],
    sop: 'Sunday: 15 min workspace reset + 20 min inbox zero. Monthly: notification audit. Quarterly: unsubscribe purge.',
    automation: ['Focus mode schedule', 'Notification summaries'],
    riskRegister: [{ risk: 'Digital overload', mitigation: 'Notification audit monthly' }],
    killCriteria: ['Screen time > 6h/day for 2 weeks → hard reset'],
    experiments: [{ name: 'Grayscale phone display', status: 'planned' }],
    reviewQuestions: ['What environment change would make the biggest difference?'],
    dependencies: ['psyche'],
    resources: ['Newport "Digital Minimalism"'],
  }),

  // ============================================================
  // LEVEL 2 — EXECUTIVE (3 domains)
  // ============================================================

  // ---- Attention ----
  attention: card({
    id: 'attention', level: 2, name: 'Attention', icon: '🎯',
    objective: 'Protect and direct attention as the scarcest resource.',
    principles: [
      'Single-screen, single-task.',
      'Deep work blocks are non-negotiable.',
      'Distraction audits reveal the truth.',
    ],
    leadingIndicators: [
      { name: 'Deep work hours', target: 3, unit: 'h/day', cadence: 'daily' },
      { name: 'Distraction audits', target: 1, unit: '/wk', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'Shipped work', unit: 'count' },
      { name: 'Screen time', unit: 'h/day', source: 'health' },
    ],
    actions: [
      act({ id: 'att_deep', name: 'Deep Work block', cadence: 'daily', icon: '🎧', floor: '25 min', full: '90 min', cue: 'After morning planning', response: 'Single-task deep work', implementationIntention: 'If I finish planning, then I will start a deep work block', estMins: 90, compoundScore: 10 }),
      act({ id: 'att_single', name: 'Single-screen session', cadence: 'daily', icon: '🖥️', floor: '1 session', full: '3 sessions', cue: 'When opening laptop', response: 'One window, one task', implementationIntention: 'If I open my laptop, then I will work in one window', estMins: 60, compoundScore: 7 }),
      act({ id: 'att_audit', name: 'Distraction audit', cadence: 'weekly', icon: '🔍', estMins: 15, compoundScore: 6 }),
    ],
    trigger: 'Morning, after planning',
    checklist: ['Phone in another room', 'Notifications off', 'One window open', 'Timer running'],
    sop: 'Block 1: 90 min after planning. Block 2: 90 min after lunch. Block 3: 60 min afternoon.',
    automation: ['Focus mode', 'Website blockers'],
    riskRegister: [{ risk: 'Attention fragmentation', mitigation: 'Single-screen sessions + audits' }],
    killCriteria: ['Deep work < 1h/day for 2 weeks → restructure day'],
    experiments: [{ name: 'Pomodoro 50/10 vs 90/20', status: 'active' }],
    reviewQuestions: ['What stole my attention this week?', 'Which block was hardest to protect?'],
    dependencies: ['environment', 'psyche'],
    resources: ['Newport "Deep Work"'],
  }),

  // ---- Decision System ----
  decisions: card({
    id: 'decisions', level: 2, name: 'Decision System', icon: '⚖️',
    objective: 'Maximize decision quality through structured thinking and review.',
    principles: [
      'Journal every major decision.',
      'Pre-mortem before, post-mortem after.',
      'Bayesian update on every outcome.',
    ],
    leadingIndicators: [
      { name: 'Decisions journaled', target: 1, unit: '/wk', cadence: 'weekly' },
      { name: 'Pre-mortems', target: 1, unit: '/wk', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'Decision quality', unit: '1-5' },
      { name: 'Outcome vs expected', unit: '%' },
    ],
    actions: [
      act({ id: 'dec_log', name: 'Log decision', cadence: 'event', icon: '⚖️', estMins: 10, compoundScore: 8 }),
      act({ id: 'dec_pre', name: 'Pre-mortem', cadence: 'event', icon: '🔮', estMins: 15, compoundScore: 7 }),
      act({ id: 'dec_post', name: 'Post-mortem', cadence: 'event', icon: '📋', estMins: 20, compoundScore: 8 }),
      act({ id: 'dec_review', name: 'Review 1y decisions', cadence: 'monthly', icon: '🔄', estMins: 30, compoundScore: 7 }),
    ],
    trigger: 'Before any decision with >1 week of consequences',
    checklist: ['Context', 'Assumptions', 'Alternatives', 'Expected result', 'Probability', 'Review date'],
    sop: 'For each major decision: write context, alternatives, expected outcome, confidence %, review date. On review date: log actual outcome, update.',
    automation: [],
    riskRegister: [{ risk: 'Outcome bias', mitigation: 'Judge decision quality, not just outcome' }],
    killCriteria: ['No decisions journaled for 1 month → force one'],
    experiments: [],
    reviewQuestions: ['Which decision had the biggest gap between expected and actual?', 'What assumption was most wrong?'],
    dependencies: ['attention'],
    resources: ['Kahneman "Thinking Fast and Slow"'],
  }),

  // ---- Knowledge System ----
  knowledge: card({
    id: 'knowledge', level: 2, name: 'Knowledge System', icon: '📚',
    objective: 'Capture, organize, and compound knowledge through deliberate practice + spaced repetition.',
    principles: [
      'Capture everything; review regularly.',
      'Spaced repetition beats cramming.',
      'Deliberate practice > passive reading.',
    ],
    leadingIndicators: [
      { name: 'Cards reviewed', target: 10, unit: '/day', cadence: 'daily' },
      { name: 'Reading', target: 30, unit: 'min', cadence: 'daily' },
      { name: 'Skill practice', target: 60, unit: 'min', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'Retention rate', unit: '%' },
      { name: 'Skills acquired', unit: 'count' },
    ],
    actions: [
      act({ id: 'know_read', name: 'Read', cadence: 'daily', icon: '📖', floor: '10 min', full: '30 min', cue: 'After dinner', response: 'Read + capture', implementationIntention: 'If I finish dinner, then I will read for 30 min', estMins: 30, compoundScore: 8 }),
      act({ id: 'know_capture', name: 'Capture notes', cadence: 'daily', icon: '✍️', floor: '1 note', full: '3 notes', cue: 'After reading', response: 'Write to inbox', implementationIntention: 'If I finish reading, then I will capture key ideas', estMins: 5, compoundScore: 7 }),
      act({ id: 'know_review', name: 'Review cards (SM-2)', cadence: 'daily', icon: '🧠', floor: '5 cards', full: '10+ cards', cue: 'After morning coffee', response: 'Review due cards', implementationIntention: 'If I finish morning coffee, then I will review due cards', estMins: 15, compoundScore: 9 }),
      act({ id: 'know_practice', name: 'Skill practice', cadence: 'weekly', icon: '🎯', estMins: 60, compoundScore: 8 }),
      act({ id: 'know_audit', name: 'Skill audit', cadence: 'semiannual', icon: '🔍', estMins: 60, compoundScore: 7 }),
    ],
    trigger: 'Morning (review), evening (read), weekly (practice)',
    checklist: ['Capture to inbox', 'Clarify within 24h', 'Convert to SR card if durable'],
    sop: 'Daily: review due cards + read 30 min + capture. Weekly: 60 min deliberate practice. Semi-annual: skill audit.',
    automation: ['SM-2 scheduler'],
    riskRegister: [{ risk: 'Capture without review', mitigation: 'Daily review block' }],
    killCriteria: ['Retention < 70% for 2 weeks → reduce new cards'],
    experiments: [{ name: 'Cloze deletion vs Q&A cards', status: 'active' }],
    reviewQuestions: ['What did I learn this week worth keeping?', 'Which skill is stagnating?'],
    dependencies: ['attention', 'intelCapital'],
    resources: ['Cepeda 2008', 'Wozniak "SuperMemo"'],
  }),

  // ============================================================
  // LEVEL 3 — CAPITAL (7 domains)
  // ============================================================

  bioCapital: card({
    id: 'bioCapital', level: 3, name: 'Biological Capital', icon: '❤️',
    objective: 'Compounding health, energy, strength, and longevity as capital.',
    principles: ['Health is the base layer of all capital.', 'Measure quarterly, act daily.'],
    leadingIndicators: [
      { name: 'Health syncs', target: 7, unit: '/wk', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'VO₂max', unit: 'mL/kg/min', source: 'health' },
      { name: 'HRV', unit: 'ms', source: 'health' },
      { name: 'Grip strength', unit: 'kg', source: 'manual' },
    ],
    actions: [
      act({ id: 'bio_sync', name: 'Sync Apple Health', cadence: 'daily', icon: '⌚', estMins: 1, compoundScore: 4 }),
      act({ id: 'bio_qcheck', name: 'Quarterly health check', cadence: 'quarterly', icon: '🩺', estMins: 60, compoundScore: 8 }),
    ],
    trigger: 'Daily sync, quarterly review',
    checklist: ['Sync watch', 'Review trends', 'Flag any decline'],
    sop: 'Daily: Apple Health sync. Quarterly: review all lagging indicators, flag any decline > 10%.',
    automation: ['Apple Health'],
    riskRegister: [{ risk: 'Silent decline', mitigation: 'Quarterly checks' }],
    killCriteria: ['Any lagging indicator declining for 2 quarters → escalate'],
    experiments: [],
    reviewQuestions: ['Which metric is trending wrong?'],
    dependencies: ['body', 'nutrition', 'medical'],
    resources: ['Attia "Outlive"'],
  }),

  intelCapital: card({
    id: 'intelCapital', level: 3, name: 'Intellectual Capital', icon: '📚',
    objective: 'Compounding skills, mental models, and expertise.',
    principles: ['Deliberate practice > volume.', 'Teach to consolidate.', 'Spaced repetition for retention.'],
    leadingIndicators: [
      { name: 'Deep practice hours', target: 5, unit: 'h/wk', cadence: 'weekly' },
      { name: 'Cards created', target: 5, unit: '/wk', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'Skills at mastery', unit: 'count' },
      { name: 'Retention rate', unit: '%' },
    ],
    actions: [
      act({ id: 'intel_practice', name: 'Skill practice', cadence: 'weekly', icon: '🎯', estMins: 60, compoundScore: 9 }),
      act({ id: 'intel_teach', name: 'Teach / write', cadence: 'monthly', icon: '✍️', estMins: 60, compoundScore: 8 }),
      act({ id: 'intel_audit', name: 'Skill audit', cadence: 'semiannual', icon: '🔍', estMins: 90, compoundScore: 7 }),
    ],
    trigger: 'Weekly practice, monthly teach, semi-annual audit',
    checklist: ['Pick one skill', 'Set practice goal', 'Log session'],
    sop: 'Weekly: 60 min deliberate practice on current focus skill. Monthly: write or teach what I learned.',
    automation: ['SM-2'],
    riskRegister: [{ risk: 'Skill stagnation', mitigation: 'Semi-annual audit' }],
    killCriteria: ['No practice for 4 weeks → drop or recommit'],
    experiments: [],
    reviewQuestions: ['Which skill is compounding fastest?', 'Which is stagnating?'],
    dependencies: ['knowledge'],
    resources: ['Ericsson "Peak"'],
  }),

  finCapital: card({
    id: 'finCapital', level: 3, name: 'Financial Capital', icon: '💰',
    objective: 'Maximize long-term capital via savings rate, diversification, and patience.',
    principles: ['Savings rate > income.', 'Time in market > timing.', 'Diversify; rebalance quarterly.'],
    leadingIndicators: [
      { name: 'Savings rate', target: 30, unit: '%', cadence: 'monthly' },
      { name: 'Budget reviews', target: 1, unit: '/mo', cadence: 'monthly' },
    ],
    laggingIndicators: [
      { name: 'Net worth', unit: 'currency', source: 'manual' },
      { name: 'Runway', unit: 'months', source: 'manual' },
    ],
    actions: [
      act({ id: 'fin_budget', name: 'Budget review', cadence: 'monthly', icon: '📊', estMins: 30, compoundScore: 7 }),
      act({ id: 'fin_nw', name: 'Net worth update', cadence: 'monthly', icon: '💰', estMins: 15, compoundScore: 6 }),
      act({ id: 'fin_rebal', name: 'Rebalancing', cadence: 'quarterly', icon: '⚖️', estMins: 60, compoundScore: 8 }),
      act({ id: 'fin_tax', name: 'Tax planning', cadence: 'quarterly', icon: '🧾', estMins: 30, compoundScore: 6 }),
      act({ id: 'fin_alloc', name: 'Asset allocation review', cadence: 'annual', icon: '🗺️', estMins: 90, compoundScore: 8 }),
      act({ id: 'fin_estate', name: 'Estate planning', cadence: 'annual', icon: '📜', estMins: 60, compoundScore: 7 }),
    ],
    trigger: 'Monthly / quarterly / annual',
    checklist: ['Update accounts', 'Check savings rate', 'Rebalance if >5% drift'],
    sop: 'Monthly: budget + net worth. Quarterly: rebalance + tax. Annual: allocation + estate.',
    automation: ['NISA / iDeCo auto-transfers'],
    riskRegister: [
      { risk: 'Inflation', mitigation: 'Equity + real assets allocation' },
      { risk: 'Concentration', mitigation: 'Diversify; no single position > 10%' },
    ],
    killCriteria: ['Savings rate < 15% for 3 months → restructure'],
    experiments: [{ name: 'Increase iDeCo to max', status: 'active' }],
    reviewQuestions: ['Is my savings rate on track?', 'Any position too concentrated?'],
    dependencies: ['bioCapital'],
    resources: ['Bogleheads wiki', 'Bernstein "If You Can"'],
  }),

  socCapital: card({
    id: 'socCapital', level: 3, name: 'Social Capital', icon: '🤝',
    objective: 'Build reputation, trust, mentors, and a strong network.',
    principles: ['Give before asking.', 'Weak ties carry opportunity.', 'Audit contacts quarterly.'],
    leadingIndicators: [
      { name: 'Reach-outs', target: 3, unit: '/wk', cadence: 'weekly' },
      { name: 'New contacts', target: 1, unit: '/mo', cadence: 'monthly' },
    ],
    laggingIndicators: [
      { name: 'Strong contacts', unit: 'count' },
      { name: 'Mentors', unit: 'count' },
    ],
    actions: [
      act({ id: 'soc_reach', name: 'Reach out', cadence: 'weekly', icon: '📨', estMins: 15, compoundScore: 7 }),
      act({ id: 'soc_new', name: 'New contact', cadence: 'monthly', icon: '🤝', estMins: 30, compoundScore: 6 }),
      act({ id: 'soc_audit', name: 'Audit contact list', cadence: 'quarterly', icon: '📇', estMins: 30, compoundScore: 5 }),
    ],
    trigger: 'Weekly',
    checklist: ['Pick 3 people', 'Send genuine message', 'Log response'],
    sop: 'Weekly: reach out to 3 people (1 strong, 1 weak, 1 new). Monthly: 1 new contact. Quarterly: audit list.',
    automation: [],
    riskRegister: [{ risk: 'Network decay', mitigation: 'Quarterly audit' }],
    killCriteria: ['No reach-outs for 4 weeks → recommit'],
    experiments: [],
    reviewQuestions: ['Who did I help this week?', 'Which relationship is decaying?'],
    dependencies: ['repCapital'],
    resources: ['Reid Hoffman "The Start-up of You"'],
  }),

  familyCapital: card({
    id: 'familyCapital', level: 3, name: 'Family Capital', icon: '👨‍👩‍👦',
    objective: 'Strong relationships, family traditions, and a multi-generational archive.',
    principles: ['Presence > presents.', 'Traditions compound.', 'Archive family history.'],
    leadingIndicators: [
      { name: 'Quality conversations', target: 1, unit: '/day', cadence: 'daily' },
      { name: 'Family days', target: 1, unit: '/mo', cadence: 'monthly' },
    ],
    laggingIndicators: [
      { name: 'Relationship score', unit: '1-5' },
    ],
    actions: [
      act({ id: 'fam_conv', name: 'Quality conversation', cadence: 'daily', icon: '💬', floor: '10 min', full: '30 min', cue: 'After dinner', response: 'Phone away, talk', implementationIntention: 'If I finish dinner, then I will have a phone-free conversation', estMins: 20, compoundScore: 9 }),
      act({ id: 'fam_day', name: 'Family day', cadence: 'monthly', icon: '🎉', estMins: 240, compoundScore: 8 }),
      act({ id: 'fam_edu', name: 'Education review', cadence: 'quarterly', icon: '🎓', estMins: 30, compoundScore: 7 }),
      act({ id: 'fam_archive', name: 'Archive family history', cadence: 'quarterly', icon: '🗂️', estMins: 60, compoundScore: 6 }),
    ],
    trigger: 'Daily, monthly, quarterly',
    checklist: ['Phone away', 'Listen first', 'No problem-solving unless asked'],
    sop: 'Daily: 1 quality conversation. Monthly: 1 family day. Quarterly: education review + archive.',
    automation: [],
    riskRegister: [{ risk: 'Drift from absence', mitigation: 'Daily presence + monthly family day' }],
    killCriteria: ['Relationship score < 3 for 2 weeks → intervene'],
    experiments: [],
    reviewQuestions: ['Did I show up fully this week?', 'Which tradition needs reviving?'],
    dependencies: ['psyche'],
    resources: ['Gottman research'],
  }),

  prodCapital: card({
    id: 'prodCapital', level: 3, name: 'Product Capital', icon: '🛠️',
    objective: 'Build durable assets: code, projects, content, services, automations.',
    principles: ['Ship > polish.', 'Kill criteria prevent sunk cost.', 'Leverage compounds.'],
    leadingIndicators: [
      { name: 'Commits', target: 5, unit: '/wk', cadence: 'weekly' },
      { name: 'Project reviews', target: 1, unit: '/wk', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'Shipped projects', unit: 'count' },
      { name: 'Leverage index', unit: '0-25' },
    ],
    actions: [
      act({ id: 'prod_commit', name: 'Commit code', cadence: 'daily', icon: '💻', floor: '1 commit', full: '5+ commits', cue: 'During deep work block', response: 'Ship code', implementationIntention: 'If I start a deep work block, then I will commit code', estMins: 60, compoundScore: 9 }),
      act({ id: 'prod_review', name: 'Project review', cadence: 'weekly', icon: '🔍', estMins: 30, compoundScore: 7 }),
      act({ id: 'prod_kill', name: 'Kill criteria audit', cadence: 'quarterly', icon: '☠️', estMins: 30, compoundScore: 8 }),
    ],
    trigger: 'Daily deep work block',
    checklist: ['Pick one project', 'Define done for session', 'Commit before stopping'],
    sop: 'Daily: commit during deep work. Weekly: review all projects. Quarterly: kill criteria audit.',
    automation: ['Git', 'CI'],
    riskRegister: [{ risk: 'Abandoned projects', mitigation: 'Quarterly kill audit' }],
    killCriteria: ['No commits for 30 days → kill or recommit'],
    experiments: [{ name: 'Open-source one internal tool', status: 'planned' }],
    reviewQuestions: ['Which project is closest to shipping?', 'Which is stale?'],
    dependencies: ['attention', 'intelCapital'],
    resources: ['Paul Graham essays'],
  }),

  repCapital: card({
    id: 'repCapital', level: 3, name: 'Reputational Capital', icon: '🌐',
    objective: 'Public reputation as a durable, compounding asset.',
    principles: ['Public work compounds.', 'STAR stories make value legible.', 'Consistency > virality.'],
    leadingIndicators: [
      { name: 'Public posts', target: 1, unit: '/mo', cadence: 'monthly' },
      { name: 'Talks / podcasts', target: 1, unit: '/qtr', cadence: 'quarterly' },
    ],
    laggingIndicators: [
      { name: 'Followers', unit: 'count' },
      { name: 'Inbound opportunities', unit: 'count' },
    ],
    actions: [
      act({ id: 'rep_post', name: 'Public post', cadence: 'monthly', icon: '✍️', estMins: 90, compoundScore: 7 }),
      act({ id: 'rep_talk', name: 'Talk / podcast', cadence: 'quarterly', icon: '🎤', estMins: 120, compoundScore: 8 }),
      act({ id: 'rep_portfolio', name: 'Portfolio update', cadence: 'quarterly', icon: '📂', estMins: 60, compoundScore: 6 }),
    ],
    trigger: 'Monthly / quarterly',
    checklist: ['Pick one idea', 'Write draft', 'Edit once', 'Publish'],
    sop: 'Monthly: 1 public post. Quarterly: 1 talk or podcast + portfolio update.',
    automation: [],
    riskRegister: [{ risk: 'Invisibility', mitigation: 'Monthly publishing cadence' }],
    killCriteria: ['No public work for 3 months → force one post'],
    experiments: [],
    reviewQuestions: ['What did I publish this month?', 'What inbound came from it?'],
    dependencies: ['prodCapital', 'socCapital'],
    resources: ['Show Your Work — Austin Kleon'],
  }),

  // ============================================================
  // LEVEL 4 — STRATEGY (4 domains)
  // ============================================================

  strategy_vision: card({
    id: 'strategy_vision', level: 4, name: 'Vision', icon: '🔭',
    objective: 'Long-term direction: 3 / 5 / 10-year horizon.',
    principles: ['Vision before goals.', 'Re-validate annually.', 'Bet on one big change per year.'],
    leadingIndicators: [
      { name: 'Vision reviews', target: 1, unit: '/yr', cadence: 'annual' },
    ],
    laggingIndicators: [
      { name: 'Vision clarity', unit: '1-5' },
      { name: 'Year-on-year progress', unit: '1-5' },
    ],
    actions: [
      act({ id: 'vis_annual', name: 'Annual vision review', cadence: 'annual', icon: '🔭', estMins: 240, compoundScore: 10 }),
      act({ id: 'vis_quarterly', name: 'Quarterly vision check', cadence: 'quarterly', icon: '🧭', estMins: 60, compoundScore: 8 }),
    ],
    trigger: 'Annual review window + quarterly',
    checklist: ['Re-read 10-year vision', 'Score progress', 'Adjust 3-year horizon'],
    sop: 'Annual: rewrite 3/5/10-year vision. Quarterly: check progress, adjust 3-year.',
    automation: [],
    riskRegister: [{ risk: 'Vision drift', mitigation: 'Annual review' }],
    killCriteria: ['Vision unchanged for 3 years → force rewrite'],
    experiments: [],
    reviewQuestions: ['Is the 10-year vision still right?', 'What changed this year?'],
    dependencies: ['identity', 'strategy_goals'],
    resources: ['Christensen "How Will You Measure Your Life"'],
  }),

  strategy_goals: card({
    id: 'strategy_goals', level: 4, name: 'Goals', icon: '🎯',
    objective: 'Annual goals derived from vision; reviewed quarterly.',
    principles: ['3-5 goals max.', 'Each goal has leading + lagging indicators.', 'Quarterly kill or scale.'],
    leadingIndicators: [
      { name: 'Goal reviews', target: 4, unit: '/yr', cadence: 'quarterly' },
    ],
    laggingIndicators: [
      { name: 'Goals on track', unit: 'count' },
      { name: 'Goals achieved', unit: 'count' },
    ],
    actions: [
      act({ id: 'goal_set', name: 'Set annual goals', cadence: 'annual', icon: '🎯', estMins: 120, compoundScore: 9 }),
      act({ id: 'goal_review', name: 'Quarterly goal review', cadence: 'quarterly', icon: '📊', estMins: 90, compoundScore: 8 }),
    ],
    trigger: 'Annual + quarterly',
    checklist: ['3-5 goals max', 'Each has metric', 'Each has owner action'],
    sop: 'Annual: set 3-5 goals from vision. Quarterly: review each, kill or scale.',
    automation: [],
    riskRegister: [{ risk: 'Too many goals', mitigation: 'Hard cap at 5' }],
    killCriteria: ['Goal with no progress for 2 quarters → kill'],
    experiments: [],
    reviewQuestions: ['Which goal is behind?', 'Which should be killed?'],
    dependencies: ['strategy_vision', 'strategy_projects'],
    resources: ['Doerr "Measure What Matters"'],
  }),

  strategy_projects: card({
    id: 'strategy_projects', level: 4, name: 'Projects', icon: '📦',
    objective: 'Active projects that move goals; killed when no longer serve.',
    principles: ['One bet that changes 5 years.', 'Kill criteria prevent sunk cost.', 'Leverage score per project.'],
    leadingIndicators: [
      { name: 'Project reviews', target: 1, unit: '/wk', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'Projects shipped', unit: 'count' },
      { name: 'Avg leverage index', unit: '0-25' },
    ],
    actions: [
      act({ id: 'proj_review', name: 'Project review', cadence: 'weekly', icon: '🔍', estMins: 30, compoundScore: 7 }),
      act({ id: 'proj_kill', name: 'Kill / scale audit', cadence: 'quarterly', icon: '⚖️', estMins: 60, compoundScore: 8 }),
    ],
    trigger: 'Weekly + quarterly',
    checklist: ['List active projects', 'Score leverage', 'Flag stale ones'],
    sop: 'Weekly: review each project. Quarterly: kill or scale based on leverage + progress.',
    automation: [],
    riskRegister: [{ risk: 'Project sprawl', mitigation: 'Quarterly kill audit' }],
    killCriteria: ['No progress for 30 days → kill or recommit'],
    experiments: [],
    reviewQuestions: ['Which project has highest leverage?', 'Which is draining?'],
    dependencies: ['strategy_goals', 'prodCapital'],
    resources: ['Allen "Getting Things Done"'],
  }),

  strategy_resources: card({
    id: 'strategy_resources', level: 4, name: 'Resource Allocation', icon: '📊',
    objective: 'Allocate time, money, and attention deliberately across goals.',
    principles: ['Budget = values made visible.', 'Time-block the week.', 'Quarterly reallocation.'],
    leadingIndicators: [
      { name: 'Weekly planning', target: 1, unit: '/wk', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'Time on goals', unit: '%' },
      { name: 'Money on goals', unit: '%' },
    ],
    actions: [
      act({ id: 'res_plan', name: 'Weekly planning', cadence: 'weekly', icon: '🗓️', estMins: 30, compoundScore: 8 }),
      act({ id: 'res_alloc', name: 'Quarterly reallocation', cadence: 'quarterly', icon: '📊', estMins: 90, compoundScore: 8 }),
    ],
    trigger: 'Sunday + quarterly',
    checklist: ['Review last week', 'Time-block next week', 'Align with goals'],
    sop: 'Sunday: 30 min planning. Quarterly: reallocate time + money across goals.',
    automation: ['Calendar'],
    riskRegister: [{ risk: 'Misallocation', mitigation: 'Quarterly reallocation' }],
    killCriteria: ['< 50% time on goals for 4 weeks → restructure'],
    experiments: [],
    reviewQuestions: ['Did my week match my goals?', 'Where did time leak?'],
    dependencies: ['strategy_goals', 'finCapital', 'attention'],
    resources: ['Newport "Time-Block Planner"'],
  }),

  // ============================================================
  // LEVEL 5 — LEGACY (2 domains)
  // ============================================================

  legacy: card({
    id: 'legacy', level: 5, name: 'Legacy', icon: '🏛️',
    objective: 'What outlives you: children, work, capital, archive, open source, fund.',
    principles: ['Build for decades, not quarters.', 'Teach what you learn.', 'Open source what you build.'],
    leadingIndicators: [
      { name: 'Legacy reviews', target: 1, unit: '/yr', cadence: 'annual' },
    ],
    laggingIndicators: [
      { name: 'Legacy assets', unit: 'count' },
    ],
    actions: [
      act({ id: 'leg_annual', name: 'Annual legacy review', cadence: 'annual', icon: '🏛️', estMins: 240, compoundScore: 10 }),
      act({ id: 'leg_archive', name: 'Archive update', cadence: 'quarterly', icon: '🗂️', estMins: 60, compoundScore: 6 }),
      act({ id: 'leg_oss', name: 'Open source contribution', cadence: 'quarterly', icon: '🔓', estMins: 120, compoundScore: 7 }),
    ],
    trigger: 'Annual + quarterly',
    checklist: ['List legacy assets', 'Score durability', 'Pick one to advance'],
    sop: 'Annual: review what will outlive you. Quarterly: archive + open source.',
    automation: [],
    riskRegister: [{ risk: 'No durable assets', mitigation: 'Annual review' }],
    killCriteria: ['No legacy asset advanced for 1 year → force one'],
    experiments: [],
    reviewQuestions: ['What will outlive me?', 'What did I advance this year?'],
    dependencies: ['strategy_vision', 'familyCapital', 'prodCapital'],
    resources: ['Brooks "The Second Mountain"'],
  }),

  values: card({
    id: 'values', level: 5, name: 'Values', icon: '💎',
    objective: 'Explicit values that govern decisions and trade-offs.',
    principles: ['Values are tested by trade-offs.', 'Re-validate annually.', 'Write them down.'],
    leadingIndicators: [
      { name: 'Value reviews', target: 1, unit: '/yr', cadence: 'annual' },
    ],
    laggingIndicators: [
      { name: 'Value-behavior alignment', unit: '1-5' },
    ],
    actions: [
      act({ id: 'val_annual', name: 'Annual values review', cadence: 'annual', icon: '💎', estMins: 120, compoundScore: 9 }),
    ],
    trigger: 'Annual review window',
    checklist: ['List current values', 'Test each against a recent trade-off', 'Rewrite if needed'],
    sop: 'Annual: list 5-7 values. For each, recall a recent decision where it was tested. Rewrite if behavior diverged.',
    automation: [],
    riskRegister: [{ risk: 'Stated vs lived values diverge', mitigation: 'Annual review with trade-off test' }],
    killCriteria: ['Values unchanged for 3 years → force rewrite'],
    experiments: [],
    reviewQuestions: ['Which value was tested this year?', 'Did I live it?'],
    dependencies: ['identity', 'legacy'],
    resources: ['Haidt "The Righteous Mind"'],
  }),
};

// ---- Helper: get domain by id ----
export function getDomain(id) {
  return DEFAULT_DOMAINS[id] || null;
}

// ---- Helper: all domains as array ----
export function allDomains() {
  return Object.values(DEFAULT_DOMAINS);
}

// ---- Helper: domains by level ----
export function domainsByLevel(level) {
  return allDomains().filter(d => d.level === level);
}

// ---- Helper: domains by layer ----
export function domainsByLayer(layerId) {
  const layer = LAYERS[layerId];
  if (!layer) return [];
  return allDomains().filter(d => layer.levels.includes(d.level));
}
