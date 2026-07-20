// ============================================================
// Life OS v2 — Suggestion Engine
// Generates fresh "to do" and "not to do" suggestions each time.
// Draws from a large pool of science-backed protocols + anti-goals.
// Never repeats the same set twice in a row.
// ============================================================

import { getState } from './state.js';
import { todayKey, hour } from './util.js';
import { dueToday } from './cadence.js';

// ---- TO DO pool (science-backed protocols) ----
const TO_DO_POOL = [
  // Body
  { text: 'Drink 500ml of water now — dehydration drops cognitive performance 10-15%', icon: '💧', domain: 'body', source: 'Hydration' },
  { text: 'Do 20 squats right now — boosts blood flow to prefrontal cortex for 2 hours', icon: '🏋️', domain: 'body', source: 'Movement' },
  { text: 'Take a 10-minute walk outside — sunlight sets circadian rhythm, improves sleep tonight', icon: '☀️', domain: 'body', source: 'Light' },
  { text: 'Do 4-7-8 breathing for 2 minutes: inhale 4s, hold 7s, exhale 8s. Drops cortisol fast', icon: '🌬️', domain: 'psyche', source: 'Breathing' },
  { text: 'Stand up and stretch for 3 minutes — sitting >6h/day negates gym gains', icon: '🧘', domain: 'body', source: 'Movement' },
  { text: 'Eat 30g of protein within 30 min of waking — stabilizes blood sugar all day', icon: '🥚', domain: 'body', source: 'Nutrition' },
  { text: 'Take a cold shower (or 30s cold at end) — increases norepinephrine 250%, boosts focus', icon: '🚿', domain: 'body', source: 'Cold exposure' },
  { text: 'Do 1 set of pushups to failure — triggers myokine release, brain-derived neurotrophic factor', icon: '💪', domain: 'body', source: 'Strength' },

  // Executive
  { text: 'Write your top 3 priorities for tomorrow before bed — reduces decision fatigue on wake', icon: '📝', domain: 'executive', source: 'Planning' },
  { text: 'Do a 2-minute brain dump: write everything on your mind. Frees working memory.', icon: '🧠', domain: 'executive', source: 'Capture' },
  { text: 'Single-task for 25 minutes. Phone in another room. Timer on.', icon: '⏱️', domain: 'attention', source: 'Deep work' },
  { text: 'Close all browser tabs except one. Each tab drains 2% of attention.', icon: '🗂️', domain: 'attention', source: 'Focus' },
  { text: 'Plan your week on Sunday evening — 30 min saves 3 hours of scattered decisions', icon: '📅', domain: 'executive', source: 'Weekly planning' },
  { text: 'Write down the ONE thing that would make today a success. Do it first.', icon: '🎯', domain: 'executive', source: 'Priority' },
  { text: 'Do the hardest task first (eat the frog). Willpower is highest in the morning.', icon: '🐸', domain: 'executive', source: 'Priority' },
  { text: 'Set a 90-minute deep work block. No phone, no email, no Slack. Just one task.', icon: '🎧', domain: 'attention', source: 'Deep work' },
  { text: 'Review your calendar for tomorrow. Cancel anything that does not serve a goal.', icon: '📆', domain: 'executive', source: 'Calendar audit' },
  { text: 'Write tomorrow as if it already happened: "Today I shipped X, learned Y, said no to Z."', icon: '✍️', domain: 'executive', source: 'Pre-scription' },

  // Psyche
  { text: 'Name the emotion you are feeling right now. Labeling reduces amygdala activation by 50%.', icon: '🏷️', domain: 'psyche', source: 'Emotion labeling' },
  { text: 'Write 3 things you are grateful for. Specific, not generic. Boosts mood for 6 hours.', icon: '🙏', domain: 'psyche', source: 'Gratitude' },
  { text: 'Do a 10-minute meditation. Even 10 min changes gray matter density in 8 weeks.', icon: '🧘', domain: 'psyche', source: 'Meditation' },
  { text: 'Call someone you care about. Social connection is the strongest predictor of longevity.', icon: '📞', domain: 'psyche', source: 'Connection' },
  { text: 'Write down one win from today. Small wins compound into self-efficacy.', icon: '🏆', domain: 'psyche', source: 'Win logging' },
  { text: 'Spend 5 minutes in nature. Even a park bench reduces rumination and negative thoughts.', icon: '🌳', domain: 'psyche', source: 'Nature' },
  { text: 'Do a "fear setting" exercise: what is the worst that happens? How would you recover?', icon: '😱', domain: 'psyche', source: 'Stoicism' },

  // Capital
  { text: 'Track one expense today. Awareness alone reduces spending by 15%.', icon: '💰', domain: 'finCapital', source: 'Financial' },
  { text: 'Read 10 pages of a non-fiction book. 10 pages/day = 12 books/year.', icon: '📚', domain: 'intelCapital', source: 'Learning' },
  { text: 'Send one message to someone in your network you have not talked to in 30 days.', icon: '💬', domain: 'socCapital', source: 'Network' },
  { text: 'Write one STAR story (Situation, Task, Action, Result). You will need it for interviews.', icon: '⭐', domain: 'repCapital', source: 'Career' },
  { text: 'Spend 15 minutes learning a new skill. Compounding: 15 min/day = 91 hours/year.', icon: '🎓', domain: 'intelCapital', source: 'Skill building' },
  { text: 'Review your portfolio: is any project draining energy without ROI? Kill it.', icon: '🔪', domain: 'prodCapital', source: 'Kill criteria' },
  { text: 'Update one line on your LinkedIn or CV. Small updates prevent big panic later.', icon: '📄', domain: 'repCapital', source: 'Reputation' },
  { text: 'Save the receipt of one purchase. If you would not buy it again, return it.', icon: '🧾', domain: 'finCapital', source: 'Financial' },
  { text: 'Write down one thing you learned this week. Lessons compound into wisdom.', icon: '💡', domain: 'intelCapital', source: 'Lessons' },
  { text: 'Audit your subscriptions. Cancel one you have not used in 30 days.', icon: '🔍', domain: 'finCapital', source: 'Financial' },

  // Strategy
  { text: 'Ask: "If I could only do ONE thing this month, what would it be?" Then do it.', icon: '1️⃣', domain: 'strategy', source: 'Prioritization' },
  { text: 'Write your 10-year vision in 3 sentences. Re-read monthly. Adjust quarterly.', icon: '🔮', domain: 'strategy', source: 'Vision' },
  { text: 'Ask: "What would I stop doing if I had 6 months to live?" Stop doing it.', icon: '⏳', domain: 'strategy', source: 'Inversion' },
  { text: 'Write down 3 bets you are making right now. Rate each: high/medium/low confidence.', icon: '🎲', domain: 'strategy', source: 'Bet sizing' },
  { text: 'Do a pre-mortem: imagine this project failed. Why? Fix that before starting.', icon: '🕵️', domain: 'strategy', source: 'Pre-mortem' },
];

// ---- NOT TO DO pool (anti-goals, elimination) ----
const NOT_TO_DO_POOL = [
  { text: 'Do not check social media before noon. It hijacks your dopamine system for the day.', icon: '🚫', source: 'Attention' },
  { text: 'Do not check email first thing. Reactive mode kills proactive deep work.', icon: '📧', source: 'Attention' },
  { text: 'Do not say yes to anything today without 24 hours of thought. "Let me get back to you."', icon: '🛑', source: 'Decisions' },
  { text: 'Do not eat sugar before noon. Glucose spike + crash = 3 hours of brain fog.', icon: '🍰', source: 'Nutrition' },
  { text: 'Do not drink coffee within 90 min of waking. Let cortisol do its natural morning peak.', icon: '☕', source: 'Nutrition' },
  { text: 'Do not look at your phone in bed. Blue light delays melatonin 90 min, wrecks sleep.', icon: '📱', source: 'Sleep' },
  { text: 'Do not multitask. It reduces IQ by 10 points and doubles error rate.', icon: '🔀', source: 'Attention' },
  { text: 'Do not work past 7 PM. Diminishing returns + you steal from tomorrow\'s energy.', icon: '🌆', source: 'Energy' },
  { text: 'Do not skip a meal to "save time." You lose 2 hours of cognitive performance.', icon: '⏰', source: 'Nutrition' },
  { text: 'Do not check news more than once. Most news is noise. Signal is rare.', icon: '📰', source: 'Information diet' },
  { text: 'Do not complain today. Complaints rewire your brain for negativity. State facts instead.', icon: '😤', source: 'Mindset' },
  { text: 'Do not compare yourself to others. Compare yourself to who you were 30 days ago.', icon: '⚖️', source: 'Mindset' },
  { text: 'Do not buy anything online today that costs more than $50. Wait 48 hours.', icon: '🛒', source: 'Financial' },
  { text: 'Do not hit snooze. Snooze fragments sleep cycles and you wake up groggier.', icon: '⏰', source: 'Sleep' },
  { text: 'Do not have more than 2 coffees. Past 200mg caffeine, anxiety rises and sleep quality drops.', icon: '☕', source: 'Nutrition' },
  { text: 'Do not scroll feeds for more than 10 min today. Set a timer. Stop when it rings.', icon: '⏲️', source: 'Attention' },
  { text: 'Do not make important decisions when hungry. Glucose depletion impairs judgment.', icon: '🍽️', source: 'Decisions' },
  { text: 'Do not make important decisions when tired. Sleep deprivation = mild alcohol impairment.', icon: '😴', source: 'Decisions' },
  { text: 'Do not agree to a meeting without an agenda. No agenda = no meeting.', icon: '📅', source: 'Time' },
  { text: 'Do not work on more than 3 projects simultaneously. Context switching kills throughput.', icon: '🗂️', source: 'Focus' },
  { text: 'Do not drink alcohol tonight. Even 1 drink reduces REM sleep by 20% and next-day focus.', icon: '🍷', source: 'Sleep' },
  { text: 'Do not eat within 3 hours of bed. Digestion raises core temperature, delays sleep onset.', icon: '🍽️', source: 'Sleep' },
  { text: 'Do not check your phone during conversations. Presence is the rarest currency.', icon: '💬', source: 'Connection' },
  { text: 'Do not avoid the hard conversation. Delaying it costs more energy than having it.', icon: '🗣️', source: 'Courage' },
  { text: 'Do not optimize something that is not broken. Move to the next bottleneck instead.', icon: '🔧', source: 'Strategy' },
  { text: 'Do not read more than 1 book at a time. Finish, extract lessons, then start the next.', icon: '📖', source: 'Learning' },
  { text: 'Do not check stock prices more than once a day. Volatility noise triggers bad decisions.', icon: '📈', source: 'Financial' },
  { text: 'Do not say "I am busy." Say what you are doing instead. Busy is not an identity.', icon: '🚫', source: 'Mindset' },
  { text: 'Do not eat in front of a screen. Mindless eating = 25% more calories consumed.', icon: '🖥️', source: 'Nutrition' },
  { text: 'Do not skip your evening reflection. Unprocessed days accumulate into unexamined years.', icon: '🪞', source: 'Reflection' },
];

// Track last suggestions to avoid repeating
let _lastToDos = [];
let _lastNotToDos = [];

/**
 * Generate fresh suggestions — different every time.
 * @param {number} count - how many of each type (default 3)
 * @returns {{todos: Array, notTodos: Array}}
 */
export function generateSuggestions(count = 3) {
  const s = getState();
  const t = todayKey();
  const h = hour();
  const day = s.days[t] || { habits: {} };
  const due = dueToday();

  // Filter out suggestions for actions already done today
  const availableTodos = TO_DO_POOL.filter((item) => {
    // Don't suggest deep work if already done
    if (item.source === 'Deep work' && day.habits?.exec_build) return false;
    if (item.source === 'Movement' && day.habits?.body_move) return false;
    // Don't suggest planning if already done
    if (item.source === 'Planning' && day.habits?.exec_plan) return false;
    return true;
  });

  // Filter out not-to-dos that are time-inappropriate
  const availableNotTodos = NOT_TO_DO_POOL.filter((item) => {
    // Don't suggest "no coffee after 2pm" if it's morning
    if (item.text.includes('coffee') && h < 14 && item.text.includes('200mg')) return true;
    // Don't suggest "no phone in bed" if it's not evening
    if (item.source === 'Sleep' && h < 18 && h > 9) return false;
    return true;
  });

  // Pick random, excluding last batch
  const todos = pickRandom(availableTodos, count, _lastToDos);
  const notTodos = pickRandom(availableNotTodos, count, _lastNotToDos);

  _lastToDos = todos;
  _lastNotToDos = notTodos;

  return { todos, notTodos };
}

/**
 * Pick N random items from pool, excluding items in `exclude` list.
 */
function pickRandom(pool, n, exclude = []) {
  const excludeTexts = new Set(exclude.map((i) => i.text));
  const available = pool.filter((i) => !excludeTexts.has(i.text));
  // If not enough available, reset and use full pool
  const source = available.length >= n ? available : pool;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
