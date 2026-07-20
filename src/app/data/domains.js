// ============================================================
// Life OS v2 — Default Management Cards for all 15 domains
// Each domain follows the universal schema:
//   id, level, name, icon, color, objective, principles,
//   leadingIndicators, laggingIndicators, actions (cadenced),
//   trigger, checklist, automation, riskRegister, killCriteria,
//   reviewQuestions, sop, maturity (1-5), history
// ============================================================

export const LEVELS = {
  1: { id: 1, name: 'Foundation',     color: 'l1', icon: '🌱' },
  2: { id: 2, name: 'Executive',      color: 'l2', icon: '🧠' },
  3: { id: 3, name: 'Capital',        color: 'l3', icon: '💎' },
  4: { id: 4, name: 'Strategy',       color: 'l4', icon: '🎯' },
  5: { id: 5, name: 'Legacy',         color: 'l5', icon: '🏛️' },
};

// ============================================================
// Three-Layer Architecture
// Strategy manages the Operating System.
// Legacy defines why the system exists.
// Operating is the daily work (Foundation + Executive + Capital).
// ============================================================

export const LAYERS = {
  operating:  { id: 'operating',  name: 'Operating',  icon: '⚙️', desc: 'Foundation + Executive + Capital — daily work', levels: [1, 2, 3] },
  strategic:  { id: 'strategic',  name: 'Strategic',  icon: '🎯', desc: 'Direction, resource allocation, game selection',  levels: [4] },
  legacy:     { id: 'legacy',     name: 'Legacy',     icon: '🏛️', desc: 'Principles, long-term impact, what outlives you',  levels: [5] },
};

export const LAYER_ORDER = ['operating', 'strategic', 'legacy'];

export const CADENCE = {
  daily:    'Daily',
  weekly:   'Weekly',
  monthly:  'Monthly',
  quarterly:'Quarterly',
  semiannual: 'Semi-annual',
  annual:   'Annual',
  event:    'Event-driven',
};

const card = (data) => ({
  maturity: 1,
  history: [],
  principles: [],
  leadingIndicators: [],
  laggingIndicators: [],
  actions: [],
  trigger: '',
  checklist: [],
  automation: [],
  riskRegister: [],
  killCriteria: [],
  reviewQuestions: [],
  sop: null,
  ...data,
});

export const DEFAULT_DOMAINS = {
  // ============ LEVEL 1 — FOUNDATION ============
  body: card({
    id: 'body', level: 1, name: 'Body', icon: '🏋️', color: 'l1',
    objective: 'Maximum organism performance into deep old age.',
    principles: [
      'Sleep > Nutrition > Exercise > Supplements (never in reverse).',
      'Never miss twice. On bad days, do the Floor.',
      'Progressive overload or maintenance — never atrophy.',
    ],
    leadingIndicators: [
      { name: 'Sleep hours',      target: 7.5, unit: 'h',     cadence: 'daily' },
      { name: 'Protein',          target: 168, unit: 'g',     cadence: 'daily' },
      { name: 'Steps',            target: 8000, unit: 'steps',cadence: 'daily' },
      { name: 'Workouts',         target: 4,   unit: 'wk',    cadence: 'weekly' },
      { name: 'Zone 2 cardio',    target: 180, unit: 'min',   cadence: 'weekly' },
      { name: 'Mobility',         target: 5,   unit: 'min',   cadence: 'daily' },
    ],
    laggingIndicators: [
      { name: 'VO₂max',     unit: 'mL/kg/min', source: 'health' },
      { name: 'HRV',        unit: 'ms',        source: 'health' },
      { name: 'Body fat',   unit: '%',         source: 'manual' },
      { name: 'Grip strength', unit: 'kg',     source: 'manual' },
      { name: 'Resting HR', unit: 'bpm',       source: 'health' },
      { name: 'DEXA',       unit: 'score',     source: 'annual' },
    ],
    actions: [
      { id: 'body_move',  name: 'Move (Big4)',     cadence: 'daily',  floor: '1 set pushups + squats', full: 'Gym Day A/B, progressive overload', icon: '🏋️',
        cue: 'After morning coffee', response: 'Do 1 set of pushups + squats (floor) or gym session (full)',
        implementationIntention: 'If I finish my morning coffee, then I will do my movement practice' },
      { id: 'body_fuel',  name: 'Fuel (Big4)',     cadence: 'daily',  floor: '1 protein meal',         full: '~168g protein + small surplus',     icon: '🥩',
        cue: 'Before each meal', response: 'Ensure 30g+ protein per meal',
        implementationIntention: 'If I sit down to eat, then I will check protein content first' },
      { id: 'body_wind',  name: 'Wind Down (Big4)',cadence: 'daily',  floor: 'Phone out of bedroom',   full: 'No late scroll + phone rule',       icon: '🌙',
        cue: 'At 9:30 PM', response: 'Phone out of bedroom, lights dim',
        implementationIntention: 'If the clock hits 9:30 PM, then I will take my phone out of the bedroom' },
      { id: 'body_water', name: 'Water',           cadence: 'daily',  floor: '2 L',                    full: '3 L',                               icon: '💧',
        cue: 'After bathroom break', response: 'Drink a glass of water',
        implementationIntention: 'If I return from the bathroom, then I will drink one glass of water' },
      { id: 'body_sun',   name: 'Sunlight',        cadence: 'daily',  floor: '5 min',                  full: '15 min morning sun',                icon: '☀️',
        cue: 'Right after waking', response: 'Step outside for sunlight',
        implementationIntention: 'If I wake up, then I will step outside for sunlight within 30 min' },
      { id: 'body_mobility', name: 'Mobility',     cadence: 'daily',  floor: '5 min',                  full: '10 min full routine',               icon: '🤸',
        cue: 'After shower', response: '5 min mobility routine',
        implementationIntention: 'If I finish my shower, then I will do 5 min of mobility work' },
      { id: 'body_skincare', name: 'Skincare',     cadence: 'daily',  floor: 'AM',                     full: 'AM + PM',                           icon: '🧴',
        cue: 'After brushing teeth', response: 'Apply skincare',
        implementationIntention: 'If I finish brushing teeth, then I will apply skincare' },
      { id: 'body_zone2', name: 'Zone 2 cardio',   cadence: 'weekly', floor: '60 min',                 full: '180 min',                           icon: '🚴' },
      { id: 'body_strength', name: 'Strength session', cadence: 'weekly', floor: '1',                  full: '2',                                  icon: '💪' },
      { id: 'body_weight', name: 'Weigh-in',       cadence: 'weekly', icon: '⚖️' },
      { id: 'body_photo',  name: 'Progress photo', cadence: 'monthly', icon: '📸' },
      { id: 'body_measure', name: 'Measurements',  cadence: 'monthly', icon: '📏' },
      { id: 'body_bloods', name: 'Blood panel',    cadence: 'quarterly', icon: '🩸' },
      { id: 'body_dexa',   name: 'DEXA / Ningen Dock', cadence: 'annual', icon: '🏥' },
      { id: 'body_dental', name: 'Dental check',   cadence: 'annual', icon: '🦷' },
      { id: 'body_derma',  name: 'Dermatology',    cadence: 'annual', icon: '🩺' },
    ],
    trigger: 'Morning, post-work, evening',
    automation: ['Apple Watch', 'Health app', 'Withings', 'Cronometer'],
    riskRegister: [
      { risk: 'Sleep deprivation', mitigation: 'Hard wind-down at 21:30' },
      { risk: 'Overtraining / injury', mitigation: 'Deload every 4th week' },
      { risk: 'Burnout', mitigation: 'Rest day weekly, Floor on bad days' },
    ],
    killCriteria: ['No progress on any lagging indicator for 2 consecutive quarters → reprogram'],
    reviewQuestions: ['What most degraded my energy this week?', 'Which training block is stale?'],
  }),

  psyche: card({
    id: 'psyche', level: 1, name: 'Psyche', icon: '🧘', color: 'l1',
    objective: 'Emotional resilience and cognitive flexibility under stress.',
    principles: [
      'Name the emotion before reacting to it.',
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
      { id: 'psy_mood', name: 'Mood check-in', cadence: 'daily', icon: '😊',
        cue: 'After lunch', response: 'Rate mood 1-5 and name the dominant emotion',
        implementationIntention: 'If I finish lunch, then I will check in with my mood and name the emotion' },
      { id: 'psy_note', name: 'Evening reflection', cadence: 'daily', icon: '📝',
        cue: 'Before bed', response: 'One win, one thing to improve',
        implementationIntention: 'If I am getting into bed, then I will write one win and one improvement' },
      { id: 'psy_mindful', name: 'Mindful minutes', cadence: 'daily', floor: '5 min', full: '10+ min', icon: '🌬️',
        cue: 'After waking', response: '5-10 min breath meditation',
        implementationIntention: 'If I wake up, then I will sit for 5 min of mindful breathing before checking phone' },
      { id: 'psy_journal', name: 'Long-form journal', cadence: 'weekly', icon: '📖' },
    ],
    trigger: 'Morning + evening',
    reviewQuestions: ['What pattern in my emotional reactions showed up this week?', 'What trigger do I keep avoiding?'],
  }),

  environment: card({
    id: 'environment', level: 1, name: 'Environment', icon: '🪴', color: 'l1',
    objective: 'A physical and digital environment that makes the right action the default.',
    principles: [
      'Default design > willpower. Make good easy, bad hard.',
      'Digital minimalism: every app earns its slot.',
      'Zero visual noise in work and sleep spaces.',
    ],
    leadingIndicators: [
      { name: 'Inbox Zero', target: 1, unit: '/wk', cadence: 'weekly' },
      { name: 'Notification audit', target: 1, unit: '/mo', cadence: 'monthly' },
      { name: 'Screen time', target: 120, unit: 'min', cadence: 'daily' },
    ],
    laggingIndicators: [
      { name: 'Avg screen time', unit: 'min' },
      { name: 'Apps installed', unit: 'count' },
    ],
    actions: [
      { id: 'env_inbox', name: 'Inbox Zero', cadence: 'weekly', icon: '📭' },
      { id: 'env_notif', name: 'Notification audit', cadence: 'monthly', icon: '🔕' },
      { id: 'env_clean', name: 'Workspace reset', cadence: 'weekly', icon: '🧹' },
      { id: 'env_unsub', name: 'Unsubscribe purge', cadence: 'quarterly', icon: '✂️' },
    ],
    trigger: 'Sunday review',
    riskRegister: [
      { risk: 'Notification creep', mitigation: 'Monthly audit + Do Not Disturb defaults' },
      { risk: 'Phone in bedroom', mitigation: 'Charger outside bedroom' },
    ],
    reviewQuestions: ['Which environment friction caused the most friction this week?'],
  }),

  // ============ LEVEL 2 — EXECUTIVE ============
  executive: card({
    id: 'executive', level: 2, name: 'Executive Function', icon: '⚡', color: 'l2',
    objective: 'Reliable self-control, working memory, planning, and task switching.',
    principles: [
      'Decide once, execute many. Reduce daily decisions.',
      'Single-task. Context-switching is a tax.',
      'Plan the day before the day starts.',
    ],
    leadingIndicators: [
      { name: 'Deep Work blocks', target: 2, unit: '/day', cadence: 'daily' },
      { name: 'Plan-of-day done', target: 1, unit: '/day', cadence: 'daily' },
      { name: 'Evening review', target: 1, unit: '/day', cadence: 'daily' },
    ],
    laggingIndicators: [
      { name: 'Deep Work hours / wk', unit: 'h' },
      { name: 'Tasks completed / wk', unit: 'count' },
    ],
    actions: [
      { id: 'exec_build', name: 'Build (Big4)', cadence: 'daily', floor: '10 min / 1 commit', full: 'Deep-work block on product', icon: '💻',
        cue: 'After morning planning', response: 'Open IDE and make 1 commit (floor) or do a deep-work block (full)',
        implementationIntention: 'If I finish planning my day, then I will open my IDE and start building' },
      { id: 'exec_plan', name: 'Plan the day', cadence: 'daily', icon: '🗺️',
        cue: 'After first coffee', response: 'Pick top 3 tasks, block calendar',
        implementationIntention: 'If I finish my first coffee, then I will plan my top 3 tasks for the day' },
      { id: 'exec_review', name: 'Evening review', cadence: 'daily', icon: '🌙',
        cue: 'Before closing laptop', response: 'Review what happened, log wins',
        implementationIntention: 'If I am about to close my laptop for the day, then I will do a 5-min evening review' },
      { id: 'exec_top3', name: 'Top 3 tasks', cadence: 'daily', icon: '⭐',
        cue: 'During morning planning', response: 'Identify the 3 tasks that matter most',
        implementationIntention: 'If I am planning my day, then I will identify the 3 tasks that matter most' },
    ],
    trigger: 'Morning (plan), Evening (review)',
    reviewQuestions: ['Which task did I avoid most this week — and why?'],
  }),

  attention: card({
    id: 'attention', level: 2, name: 'Attention Management', icon: '🎯', color: 'l2',
    objective: 'Protect and direct attention as the scarcest resource.',
    principles: [
      'Deep Work > shallow work. Always.',
      'Single-tasking. No exceptions during blocks.',
      'Distraction audit weekly — what stole attention?',
    ],
    leadingIndicators: [
      { name: 'Deep Work mins', target: 120, unit: 'min', cadence: 'daily' },
      { name: 'Distraction-free sessions', target: 4, unit: '/wk', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'Shallow work hrs', unit: 'h' },
      { name: 'Focus quality (self-rated)', unit: '1-5' },
    ],
    actions: [
      { id: 'att_deep', name: 'Deep Work block', cadence: 'daily', floor: '25 min', full: '90 min', icon: '🧠',
        cue: 'After lunch (1 PM)', response: 'Phone in drawer, single tab, timer on',
        implementationIntention: 'If I finish lunch, then I will start a Deep Work block with phone in drawer' },
      { id: 'att_audit', name: 'Distraction audit', cadence: 'weekly', icon: '🔍' },
      { id: 'att_singlescreen', name: 'Single-screen session', cadence: 'daily', icon: '🖥️',
        cue: 'Before any focused work', response: 'Close all tabs except the one needed',
        implementationIntention: 'If I am about to start focused work, then I will close all tabs except one' },
    ],
    trigger: 'Pre-defined blocks',
    reviewQuestions: ['What broke my focus most often this week?'],
  }),

  decisions: card({
    id: 'decisions', level: 2, name: 'Decision System', icon: '⚖️', color: 'l2',
    objective: 'Maximize decision quality through structured thinking and review.',
    principles: [
      'Log the decision and the expected outcome before acting.',
      'Second-order: "and then what?"',
      'Inversion: what would guarantee failure?',
      'Pre-mortem before big bets; post-mortem after.',
      'Bayesian updating: revise with new evidence.',
    ],
    leadingIndicators: [
      { name: 'Decisions logged', target: 1, unit: '/wk', cadence: 'weekly' },
      { name: 'Pre-mortems done', target: 1, unit: '/mo', cadence: 'monthly' },
    ],
    laggingIndicators: [
      { name: 'Decision accuracy (1y review)', unit: '%' },
      { name: 'Regret count', unit: 'count' },
    ],
    actions: [
      { id: 'dec_log', name: 'Log a decision', cadence: 'event', icon: '📝' },
      { id: 'dec_premortem', name: 'Pre-mortem', cadence: 'event', icon: '🔮' },
      { id: 'dec_postmortem', name: 'Post-mortem', cadence: 'event', icon: '⚰️' },
      { id: 'dec_review', name: 'Review 1y-old decisions', cadence: 'monthly', icon: '📅' },
    ],
    trigger: 'Any decision with > 1 month of consequences',
    reviewQuestions: ['Which decision would I reverse if I could? Why?', 'What evidence am I ignoring?'],
  }),

  // ============ LEVEL 3 — CAPITAL ============
  bioCapital: card({
    id: 'bioCapital', level: 3, name: 'Biological Capital', icon: '❤️', color: 'l3',
    objective: 'Compounding health, energy, strength, and longevity.',
    principles: [
      'Health is the meta-capital — without it, all others decay.',
      'Measure leading indicators daily; lagging quarterly.',
      'Train for the 80-year horizon, not the 8-week one.',
    ],
    leadingIndicators: [
      { name: 'Sleep', target: 7.5, unit: 'h', cadence: 'daily' },
      { name: 'HRV', target: 50, unit: 'ms', cadence: 'daily' },
      { name: 'Workouts', target: 4, unit: '/wk', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'VO₂max', unit: 'mL/kg/min' },
      { name: 'Resting HR', unit: 'bpm' },
      { name: 'Body fat', unit: '%' },
    ],
    actions: [
      { id: 'biocap_track', name: 'Sync Apple Health', cadence: 'daily', icon: '⌚' },
      { id: 'biocap_qcheck', name: 'Quarterly health check', cadence: 'quarterly', icon: '🩺' },
    ],
    trigger: 'Daily + quarterly',
    reviewQuestions: ['Which biological metric is trending wrong?'],
  }),

  intelCapital: card({
    id: 'intelCapital', level: 3, name: 'Intellectual Capital', icon: '📚', color: 'l3',
    objective: 'Compounding skills, mental models, and expertise.',
    principles: [
      'Deliberate practice > reps.',
      'Read less, retain more — build a second brain.',
      'Teach to learn.',
    ],
    leadingIndicators: [
      { name: 'Deep learning mins', target: 30, unit: 'min', cadence: 'daily' },
      { name: 'Notes captured', target: 5, unit: '/wk', cadence: 'weekly' },
    ],
    laggingIndicators: [
      { name: 'Skills at L4+', unit: 'count' },
      { name: 'Books finished', unit: '/yr' },
    ],
    actions: [
      { id: 'intcap_read', name: 'Read / learn', cadence: 'daily', floor: '10 min', full: '45 min', icon: '📖' },
      { id: 'intcap_note', name: 'Capture to second brain', cadence: 'daily', icon: '🗂️' },
      { id: 'intcap_skill', name: 'Skill deep-practice', cadence: 'weekly', icon: '🎯' },
      { id: 'intcap_review', name: 'Skill audit', cadence: 'semiannual', icon: '🔍' },
    ],
    trigger: 'Daily blocks',
    reviewQuestions: ['Which skill is decaying from disuse?'],
  }),

  finCapital: card({
    id: 'finCapital', level: 3, name: 'Financial Capital', icon: '💰', color: 'l3',
    objective: 'Maximize long-term capital via savings rate, diversification, and patience.',
    principles: [
      'Savings rate > income.',
      'Auto-invest. Never rely on willpower to invest.',
      'Time in market > timing the market.',
      'Margin of safety: always 6+ months runway.',
    ],
    leadingIndicators: [
      { name: 'Savings rate', target: 30, unit: '%', cadence: 'monthly' },
      { name: 'Auto-invest set', target: 1, unit: 'bool', cadence: 'monthly' },
    ],
    laggingIndicators: [
      { name: 'Net worth', unit: 'currency' },
      { name: 'Financial runway', unit: 'months' },
      { name: 'Portfolio CAGR', unit: '%' },
    ],
    actions: [
      { id: 'fincap_review', name: 'Portfolio review', cadence: 'weekly', icon: '📊' },
      { id: 'fincap_budget', name: 'Budget review', cadence: 'monthly', icon: '🧾' },
      { id: 'fincap_nisa', name: 'NISA contribution', cadence: 'monthly', icon: '🇯🇵' },
      { id: 'fincap_ideco', name: 'iDeCo contribution', cadence: 'monthly', icon: '🏦' },
      { id: 'fincap_networth', name: 'Net worth update', cadence: 'monthly', icon: '📈' },
      { id: 'fincap_rebal', name: 'Rebalancing', cadence: 'quarterly', icon: '⚖️' },
      { id: 'fincap_tax', name: 'Tax planning', cadence: 'quarterly', icon: '🧾' },
      { id: 'fincap_alloc', name: 'Asset allocation review', cadence: 'annual', icon: '🗺️' },
      { id: 'fincap_estate', name: 'Estate planning', cadence: 'annual', icon: '📜' },
    ],
    trigger: 'Sunday (weekly), 1st Sun (monthly), quarter start, year-end',
    automation: ['Auto-purchase ETF', 'Auto-pay bills', 'Auto-transfer savings'],
    riskRegister: [
      { risk: 'Too much cash drag', mitigation: 'Cap cash at 6 months runway' },
      { risk: 'Concentration in single stock', mitigation: 'Rebalance quarterly, no single > 10%' },
      { risk: 'Panic selling', mitigation: 'Pre-commit: no sells during > 10% drawdown without 48h cooldown' },
    ],
    killCriteria: ['Strategy underperforms benchmark by > 5% over 3 years → revise'],
    reviewQuestions: ['Where is capital working least efficiently?', 'Am I holding cash beyond margin of safety?'],
    sop: {
      title: 'Portfolio Review',
      when: 'Every Sunday',
      duration: '15 min',
      steps: [
        'Check total balance',
        'Check cash position',
        'Check allocation vs target',
        'Review major news affecting holdings',
        'Do NOT make emotional changes',
        'Update Net Worth',
      ],
    },
  }),

  socCapital: card({
    id: 'socCapital', level: 3, name: 'Social Capital', icon: '🤝', color: 'l3',
    objective: 'Build reputation, trust, mentors, and a strong network.',
    principles: [
      'Give before asking.',
      'Maintain via systems, not memory.',
      'Quality > quantity. 50 strong ties beat 500 weak ones.',
    ],
    leadingIndicators: [
      { name: 'Reach-outs', target: 2, unit: '/wk', cadence: 'weekly' },
      { name: 'New useful contacts', target: 1, unit: '/mo', cadence: 'monthly' },
    ],
    laggingIndicators: [
      { name: 'Strong contacts', unit: 'count' },
      { name: 'Mentors', unit: 'count' },
    ],
    actions: [
      { id: 'soccap_reach', name: 'Reach out to old contact', cadence: 'weekly', icon: '✉️' },
      { id: 'soccap_new', name: 'Make 1 new useful contact', cadence: 'monthly', icon: '🤝' },
      { id: 'soccap_audit', name: 'Audit contact list', cadence: 'quarterly', icon: '📋' },
    ],
    trigger: 'Weekly + monthly',
    reviewQuestions: ['Which relationship is decaying from neglect?'],
  }),

  familyCapital: card({
    id: 'familyCapital', level: 3, name: 'Family Capital', icon: '👨‍👩‍👦', color: 'l3',
    objective: 'Strong relationships, family traditions, and a multi-generational archive.',
    principles: [
      'Presence > presents.',
      'Traditions compound. Create them young.',
      'Archive memories — photos, videos, letters.',
    ],
    leadingIndicators: [
      { name: 'Quality conversation', target: 1, unit: '/day', cadence: 'daily' },
      { name: 'Time with child', target: 60, unit: 'min', cadence: 'daily' },
      { name: 'Family day', target: 1, unit: '/mo', cadence: 'monthly' },
    ],
    laggingIndicators: [
      { name: 'Family satisfaction', unit: '1-5' },
      { name: 'Archive entries', unit: 'count' },
    ],
    actions: [
      { id: 'famcap_talk', name: 'Quality conversation', cadence: 'daily', icon: '💬' },
      { id: 'famcap_child', name: 'Time with child', cadence: 'daily', icon: '🧒' },
      { id: 'famcap_day', name: 'Family day', cadence: 'monthly', icon: '🏡' },
      { id: 'famcap_archive', name: 'Photo / video archive', cadence: 'quarterly', icon: '🎞️' },
      { id: 'famcap_edu', name: 'Review child education', cadence: 'quarterly', icon: '🎓' },
    ],
    trigger: 'Daily + monthly',
    reviewQuestions: ['What family tradition do I want to install this year?'],
  }),

  prodCapital: card({
    id: 'prodCapital', level: 3, name: 'Product Capital', icon: '🛠️', color: 'l3',
    objective: 'Build durable assets: code, projects, content, services, automations.',
    principles: [
      'Ship > polish. Iterate in public.',
      'Leverage: code and media work while you sleep.',
      'Every project has kill criteria from day 1.',
    ],
    leadingIndicators: [
      { name: 'Commits', target: 5, unit: '/wk', cadence: 'weekly' },
      { name: 'Ship events', target: 1, unit: '/mo', cadence: 'monthly' },
    ],
    laggingIndicators: [
      { name: 'Active projects', unit: 'count' },
      { name: 'Revenue / users', unit: 'mixed' },
    ],
    actions: [
      { id: 'prodcap_commit', name: 'Commit to product', cadence: 'daily', icon: '⌨️' },
      { id: 'prodcap_review', name: 'Project review', cadence: 'weekly', icon: '📋' },
      { id: 'prodcap_kill', name: 'Kill criteria audit', cadence: 'quarterly', icon: '✂️' },
    ],
    trigger: 'Daily + weekly',
    reviewQuestions: ['Which project should be killed?', 'Which should be scaled?'],
  }),

  repCapital: card({
    id: 'repCapital', level: 3, name: 'Reputational Capital', icon: '🌐', color: 'l3',
    objective: 'Public reputation as a durable, compounding asset.',
    principles: [
      'Public work compounds. Private work doesn\'t.',
      'Consistency > virality.',
      'Reputation is built slowly, lost quickly.',
    ],
    leadingIndicators: [
      { name: 'Public posts', target: 2, unit: '/mo', cadence: 'monthly' },
      { name: 'Talks / podcasts', target: 1, unit: '/qtr', cadence: 'quarterly' },
    ],
    laggingIndicators: [
      { name: 'Followers (quality)', unit: 'count' },
      { name: 'Inbound opportunities', unit: 'count' },
    ],
    actions: [
      { id: 'repcap_post', name: 'Public post', cadence: 'monthly', icon: '✍️' },
      { id: 'repcap_talk', name: 'Talk / podcast / demo', cadence: 'quarterly', icon: '🎤' },
      { id: 'repcap_portfolio', name: 'Update portfolio', cadence: 'quarterly', icon: '📁' },
    ],
    trigger: 'Monthly + quarterly',
    reviewQuestions: ['What did I ship in public this quarter?'],
  }),

  // ============ LEVEL 4 — STRATEGY ============
  strategy: card({
    id: 'strategy', level: 4, name: 'Strategy', icon: '🎯', color: 'l4',
    objective: 'Play the right game. Make the one bet that changes the next 5 years.',
    principles: [
      'Strategy is what you say NO to.',
      'Bet on scarce competencies that AI amplifies.',
      'Kill projects without regret when kill criteria hit.',
    ],
    leadingIndicators: [
      { name: 'Strategy review done', target: 1, unit: '/qtr', cadence: 'quarterly' },
    ],
    laggingIndicators: [
      { name: '5-year bet progress', unit: '%' },
      { name: 'Killed projects', unit: 'count' },
    ],
    actions: [
      { id: 'strat_review', name: 'Quarterly strategy review', cadence: 'quarterly', icon: '🎯' },
      { id: 'strat_kill', name: 'Kill / scale decisions', cadence: 'quarterly', icon: '✂️' },
      { id: 'strat_compet', name: 'Scarce competencies audit', cadence: 'quarterly', icon: '💎' },
      { id: 'strat_ai', name: 'AI opportunity review', cadence: 'quarterly', icon: '🤖' },
    ],
    trigger: 'Quarter start (Jan/Apr/Jul/Oct)',
    reviewQuestions: [
      'Am I playing the right game?',
      'What one bet would change the next 5 years?',
      'Which competencies will be most valuable?',
      'What is becoming obsolete?',
      'What should I kill? Scale?',
    ],
  }),

  // ============ LEVEL 5 — LEGACY ============
  legacy: card({
    id: 'legacy', level: 5, name: 'Legacy', icon: '🏛️', color: 'l5',
    objective: 'What outlives you: children, work, capital, archive, open source, fund.',
    principles: [
      'Plan for the 100-year horizon.',
      'Plant trees you\'ll never sit under.',
      'Archive everything. Future-you and future-them will thank you.',
    ],
    leadingIndicators: [
      { name: 'Legacy contributions', target: 1, unit: '/qtr', cadence: 'quarterly' },
    ],
    laggingIndicators: [
      { name: 'Legacy assets', unit: 'count' },
    ],
    actions: [
      { id: 'leg_review', name: 'Annual legacy review', cadence: 'annual', icon: '🏛️' },
      { id: 'leg_archive', name: 'Family / life archive', cadence: 'quarterly', icon: '📦' },
      { id: 'leg_open', name: 'Open source / educational contribution', cadence: 'quarterly', icon: '🌍' },
    ],
    trigger: 'Annual + quarterly',
    reviewQuestions: [
      'What will outlive me?',
      'What am I building that my grandchildren will benefit from?',
    ],
  }),
};

// ---- Default SOPs for domains that don't have one ----
const DEFAULT_SOPS = {
  body: {
    title: 'Morning Body Routine', when: 'Daily, morning', duration: '15 min',
    steps: ['Weigh in (weekly)', 'Sunlight 5–15 min', 'Mobility 5–10 min', 'Skincare AM', 'Plan workout or do Floor', 'Log protein target'],
  },
  psyche: {
    title: 'Evening Reflection', when: 'Daily, evening', duration: '5 min',
    steps: ['Mood check-in (1–5)', 'One win today', 'One thing to improve', 'Name one emotion felt today', 'Gratitude: one sentence'],
  },
  environment: {
    title: 'Workspace Reset', when: 'Sunday evening', duration: '10 min',
    steps: ['Clear desk', 'Close all browser tabs not needed Monday', 'Inbox Zero', 'Notification audit (monthly)', 'Plan Monday top 3'],
  },
  executive: {
    title: 'Daily Planning', when: 'Daily, morning', duration: '5 min',
    steps: ['Review calendar', 'Pick top 3 tasks', 'Block 1–2 Deep Work sessions', 'Identify the #1 thing that matters most', 'Decline anything not on the plan'],
  },
  attention: {
    title: 'Deep Work Session', when: 'Daily, pre-defined block', duration: '90 min',
    steps: ['Phone in another room / DND', 'Single tab, single task', 'Timer: 90 min', 'No context switching until timer ends', 'Log minutes in Career Log'],
  },
  decisions: {
    title: 'Pre-mortem', when: 'Before any decision with > 1 month consequences', duration: '20 min',
    steps: ['Write the decision and expected outcome', 'Imagine it failed in 1 year — what went wrong?', 'List 3 ways it could fail', 'For each, what would prevent it?', 'Set review date', 'Log in Decision Journal'],
  },
  bioCapital: {
    title: 'Quarterly Health Check', when: 'Quarterly', duration: '2 hours',
    steps: ['Book blood panel', 'Book dermatology', 'Book dental', 'Review training plan', 'Update lagging indicators', 'Compare to last quarter'],
  },
  intelCapital: {
    title: 'Weekly Learning Review', when: 'Sunday', duration: '20 min',
    steps: ['What did I learn this week?', 'Capture 5 notes to second brain', 'Which skill needs deliberate practice?', 'Schedule practice block', 'Read 1 chapter / paper'],
  },
  finCapital: {
    title: 'Portfolio Review', when: 'Every Sunday', duration: '15 min',
    steps: ['Check total balance', 'Check cash position', 'Check allocation vs target', 'Review major news affecting holdings', 'Do NOT make emotional changes', 'Update Net Worth'],
  },
  socCapital: {
    title: 'Weekly Reach-out', when: 'Sunday', duration: '10 min',
    steps: ['Pick 2 contacts to reach out to', 'Send a message — give value first', 'Log new contacts this month', 'Audit contact list quarterly'],
  },
  familyCapital: {
    title: 'Family Day', when: 'Monthly, 1st Sunday', duration: 'Full day',
    steps: ['No work phone before noon', 'Plan one activity together', 'Quality conversation (no screens)', 'Photo / video for archive', 'Plan next month\'s family day'],
  },
  prodCapital: {
    title: 'Project Review', when: 'Sunday', duration: '20 min',
    steps: ['For each active project: what shipped?', 'What is blocked?', 'Check kill criteria — has it been met?', 'Decide: kill, continue, or scale', 'Plan next week\'s #1 priority per project'],
  },
  repCapital: {
    title: 'Public Output Session', when: 'Monthly', duration: '2 hours',
    steps: ['Pick one thing shipped this month', 'Write a post / record a demo', 'Update portfolio', 'Update LinkedIn if relevant', 'Schedule next public output'],
  },
  strategy: {
    title: 'Quarterly Strategy Review', when: 'Quarter start (Jan/Apr/Jul/Oct)', duration: '3–4 hours',
    steps: ['Am I playing the right game?', 'What one bet changes the next 5 years?', 'Which competencies are becoming scarce?', 'Which AI opportunities am I acting on?', 'What to kill? What to scale?', 'Write 3–5 goals for the quarter'],
  },
  legacy: {
    title: 'Annual Legacy Review', when: 'December or birthday', duration: '6–8 hours',
    steps: ['Values — have they changed?', 'Mission — do I still want this?', 'Capital audit (all 7 forms)', '3 / 5 / 10 year strategy', 'What could destroy the system?', 'Plan 3–5 main goals for the year', 'What did I build that outlives me?'],
  },
};

// Fill in missing SOPs
for (const [id, sop] of Object.entries(DEFAULT_SOPS)) {
  if (DEFAULT_DOMAINS[id] && !DEFAULT_DOMAINS[id].sop) {
    DEFAULT_DOMAINS[id].sop = sop;
  }
}

/** Flat ordered list of domains by level. */
export const DOMAIN_LIST = Object.values(DEFAULT_DOMAINS).sort(
  (a, b) => a.level - b.level || a.id.localeCompare(b.id)
);

/** Domains grouped by level. */
export const DOMAINS_BY_LEVEL = [1, 2, 3, 4, 5].map((lvl) => ({
  level: LEVELS[lvl],
  domains: DOMAIN_LIST.filter((d) => d.level === lvl),
}));

/** Domains grouped by layer (3-layer architecture). */
export const DOMAINS_BY_LAYER = LAYER_ORDER.map((layerId) => ({
  layer: LAYERS[layerId],
  domains: DOMAIN_LIST.filter((d) => LAYERS[layerId].levels.includes(d.level)),
}));
