# Life OS v2 — Operating System for Human Optimization

> Not a habit tracker. A system for increasing the rate at which you accumulate all forms of capital — biological, intellectual, financial, social, family, product, reputational — through better decisions, faster learning, and leverage.

Life OS v2 is a **progressive web app** (installable, offline-first, zero backend) that treats your life as a system of 15 interconnected domains organized into 5 levels. Each domain has a Management Card with the same universal schema. Actions are cadenced (daily, weekly, monthly, quarterly, annual), not dumped into an endless list. Feedback loops everywhere: action → measure → correct.

The app embeds **5 evidence-based behavior change mechanisms** from cognitive science research, plus a full review system, decision journal, risk register, lessons log, and spaced repetition.

---

## Table of Contents

1. [What It Is](#what-it-is)
2. [Core Concepts](#core-concepts)
3. [The 15 Domains](#the-15-domains)
4. [The 4 Tabs](#the-4-tabs)
5. [The 8 More-Hub Sections](#the-8-more-hub-sections)
6. [5 Behavior Change Mechanisms](#5-behavior-change-mechanisms)
7. [Scoring & Progression](#scoring--progression)
8. [Cadence Engine](#cadence-engine)
9. [Analytics Engine](#analytics-engine)
10. [Apple Health Integration](#apple-health-integration)
11. [Cloud Sync (GitHub Gist)](#cloud-sync-github-gist)
12. [Notifications](#notifications)
13. [Data & Privacy](#data--privacy)
14. [Installation](#installation)
15. [Project Structure](#project-structure)
16. [Architecture Decisions](#architecture-decisions)
17. [Scientific References](#scientific-references)

---

## What It Is

Life OS v2 is a single-user, local-first PWA. No accounts, no server, no database. All data lives in your browser's `localStorage`. Optional cloud sync via GitHub Gist (free, private, zero-cost).

**Who it's for:** Someone who wants to treat their life like a system — not just track habits, but manage decisions, reviews, risks, learning, and capital accumulation across all life domains.

**What it replaced:** v1 was a single-file habit tracker with 4 daily habits ("the Big 4"). v2 is a complete rebuild into a modular, multi-domain, cadence-driven operating system. v1 data auto-migrates.

---

## Core Concepts

### Three-Layer Architecture (not 5 flat levels)
Life is not divided into "work" and "life" — it's built in 3 layers, like an operating system:

| Layer | Icon | What it means | Domains |
|-------|------|---------------|---------|
| **Operating** | ⚙️ | Foundation + Executive + Capital — the daily work. What runs every day. | Body, Psyche, Environment, Executive Function, Attention, Decisions, 7 Capital domains (13 total) |
| **Strategic** | 🎯 | Direction, resource allocation, game selection. Manages the Operating layer. | Strategy |
| **Legacy** | �️ | Principles, long-term impact, what outlives you. Defines why the system exists. | Legacy |

Strategy manages the Operating System. Legacy defines why it exists.

### Management Cards
Every domain has the same universal schema — a "Management Card" — like aviation, medicine, or fund management checklists:

- **Objective** — what this domain is optimizing for
- **Principles** — rules that govern decisions in this domain
- **Leading Indicators** — causes you can control (sleep hours, deep-work blocks, savings rate)
- **Lagging Indicators** — outcomes that follow (weight, net worth, VO₂max)
- **Actions** — cadenced tasks (daily, weekly, monthly, etc.) with a floor and full version
- **Trigger** — when to act
- **Checklist** — step-by-step for the action
- **SOP** — standard operating procedure (how-to that you'd need in a year)
- **Risk Register** — what could destroy this domain
- **Kill Criteria** — when to stop doing something
- **Review Questions** — asked during reviews
- **Maturity** — 1-5 scale (chaos → list → process → metrics → auto-improvement)

### Floor vs Full
Every daily action has two levels:
- **Full** — the ideal version (e.g., "Gym Day A/B, progressive overload")
- **Floor** — a 2-minute fallback for bad days (e.g., "1 set pushups + squats")

**Rule: Never miss twice. On bad days, do the Floor.** This is the anti-fragility mechanism — a floor completion keeps the streak alive and prevents the "all-or-nothing" spiral.

### Cadence (not list)
Actions are not all daily. They're spread across cadences to minimize daily cognitive load:

| Cadence | When it's due | Typical count |
|---------|---------------|---------------|
| Daily | Every day | 8-12 items |
| Weekly | Sunday | 10-15 items |
| Monthly | First Sunday of the month | 15-25 items |
| Quarterly | First Sunday of Jan/Apr/Jul/Oct | Strategy, health, rebalancing |
| Semi-annual | First Sunday of Jan/Jul | Deep audit |
| Annual | Dec 25 – Jan 7 | Full life review |
| Event-driven | When triggered | On-demand |

The Today tab only shows what's due **today**. Weekly/monthly items appear on their due day and in the Reviews tab.

---

## The 15 Domains

### Level 1 — Foundation 🌱

| Domain | Icon | Objective |
|--------|------|-----------|
| **Body** | 🏋️ | Maximum organism performance into deep old age. Sleep > Nutrition > Exercise > Supplements. |
| **Psyche** | 🧘 | Emotional resilience and cognitive flexibility under stress. Name the emotion before reacting. |
| **Environment** | 🪴 | Physical and digital environment as a force multiplier. Clean space, clean mind. |

### Level 2 — Executive 🧠

| Domain | Icon | Objective |
|--------|------|-----------|
| **Executive Function** | ⚡ | Plan, prioritize, execute. The CEO of your life. |
| **Attention Management** | 🎯 | Deep work, single-screen sessions, distraction audits. Attention is your scarcest resource. |
| **Decision System** | ⚖️ | Decision journal, pre-mortems, OODA loops. Better decisions = better life. |

### Level 3 — Capital 💎

| Domain | Icon | Objective |
|--------|------|-----------|
| **Biological Capital** | ❤️ | Health as capital. VO₂max, HRV, blood panels, strength. |
| **Intellectual Capital** | 📚 | Skills, knowledge, mental models. Deliberate practice, spaced repetition. |
| **Financial Capital** | 💰 | Savings rate, net worth, runway, income sources. |
| **Social Capital** | 🤝 | Network, relationships, weak ties, new contacts. |
| **Family Capital** | 👨‍👩‍👦 | Family time, traditions, presence. |
| **Product Capital** | 🛠️ | What you build. Projects, side hustles, portfolio. |
| **Reputational Capital** | 🌐 | Personal brand, LinkedIn, STAR stories, public work. |

### Level 4 — Strategy 🎯

| Domain | Icon | Objective |
|--------|------|-----------|
| **Strategy** | 🎯 | Where you're going. 3/5/10-year plans, annual goals, bet sizing. |

### Level 5 — Legacy 🏛️

| Domain | Icon | Objective |
|--------|------|-----------|
| **Legacy** | 🏛️ | What outlives you. Children, book, company, open source, educational projects. |

---

## The 4 Tabs

The app has 4 main tabs in the bottom navigation:

### 1. Today ✅
The daily command center. Shows only what's due today.

- **Command Center** — 12 KPIs visible in 60 seconds: streak, points, v2.00 ETA, shields, today's progress, pace, sleep, HRV, steps, deep work, runway, open opportunities
- **Progress ring** — SVG ring showing today's completion percentage around your version number
- **Streak risk nudge** — time-aware, loss-framed warning ("Don't lose your 14-day streak")
- **Never-miss-twice warning** — if yesterday was missed, shows "Don't lose twice in a row"
- **105-day heatmap** — GitHub-style activity grid, click any day for details
- **Actions grouped by domain** — each action shows:
  - Implementation intention ("🔗 After morning coffee → Do 1 set of pushups")
  - Temptation bundle if linked ("🎧 Only listen to podcast during Deep Work")
  - Floor button for bad days
- **Recall practice section** — due spaced repetition cards (if any)
- **Commitments section** — active commitment contracts with points at stake (if any)
- **Reflection card** — mood check-in (5 emoji) + nightly note ("One win, one thing to improve")

### 2. Domains 🧩
Browse all 15 domains organized by level. Tap any domain to open its Management Card in a bottom sheet showing:
- Objective, principles, leading/lagging indicators
- All actions with cadence
- SOP (step-by-step procedure)
- Risk register, kill criteria
- Review questions
- Maturity level (1-5)

### 3. Reviews 📅
Templated review system with 5 cadences:

| Review | Duration | When | Sample questions |
|--------|----------|------|------------------|
| Weekly | 30-60 min | Sunday | "What did I ship? What did I learn? What should I say NO to?" |
| Monthly | 1-2 hours | First Sunday | "KPIs per domain? Savings rate? New contact? STAR story?" |
| Quarterly | 3-4 hours | First Sunday of quarter | "Am I playing the right game? What bet would change 5 years?" |
| Semi-annual | 4-6 hours | First Sunday of Jan/Jul | "Skill audit? Am I stronger than 6 months ago?" |
| Annual | 6-8 hours | Dec 25 – Jan 7 | "Values changed? Mission still right? 3-5 goals for the year?" |

Each review has templated questions. Answers are persisted with timestamps. History shows past reviews.

### 4. More ⋯
Hub for 8 secondary sections (see below).

---

## The 9 More-Hub Sections

### System Health 🩺
Health of the OS itself — not your health, the system's health.
- **OS Health Score** (0-100) — weighted score across 6 checks
- **6 health checks:**
  - Inbox backlog (unprocessed items, aging >7d)
  - Reviews overdue (weekly/monthly/quarterly/annual past due)
  - Risk register staleness (>90d without update)
  - Strategy last review (quarterly review age)
  - Lessons logged (days since last lesson)
  - Decisions pending review (reviewDate passed, no outcome)
- **Entropy Monitor** (0-100, higher = less chaos):
  - Overdue actions (past grace period)
  - Stuck opportunities (open >90d)
  - Unresolved errors (without fix)
  - Aging inbox items (raw >7d)
  - Commitments at risk (deadline today/past)
- Click any check to navigate to the relevant section

### Inbox 📥
GTD-style capture system. Nothing lives only in your head.
- **Capture bar** — type anything, press Enter, it's saved
- **Clarify** — mark items as raw → action → scheduled → archived
- **Counts** — raw, actionable, scheduled, archived

### Decisions ⚖️
Decision journal with pre-mortem and 1-year review cycle.
- Log decisions with: what you decided, why, expected outcome, review date
- Decisions due for review are highlighted (review date passed, no outcome logged)
- Review past decisions: was the outcome as expected? What did you learn?
- Library of all past decisions

### Opportunities 🔮
Kanban pipeline of possibilities (not tasks).
- Columns: Open → Pursuing → Passed → Closed
- Types: job, startup, invest, idea, contact, market, other
- Track what opportunities exist and which you're pursuing

### Lessons 🎓
Lessons learned + error log for pattern detection.
- **Error log** — log failures with root cause and fix
- **Lessons learned** — after any project/decision/purchase: what worked, what didn't, why, what to change in the system

### Recall 🧠
Spaced repetition system using the SM-2 algorithm.
- Create cards (question + answer)
- Review due cards: show question → reveal answer → rate recall quality (0-5)
- SM-2 algorithm schedules next review based on quality
- Stats: total cards, due now, total reviews, retention rate, average ease factor
- Due cards also surface in the Today tab

### Commitments 🔒
Commitment devices — stake points on actions.
- Create a commitment: pick an action, stake points, set deadline
- Points are deducted immediately (held in escrow)
- If you complete the action by deadline: points returned + 10% bonus
- If you fail: points are burned (lost permanently)
- Auto-resolves past-due commitments on app boot
- Stats: active, completed, failed, total staked, total burned, success rate

### Risks 🛡️
Risk register, resilience protocols, anti-goals, and optionality tracker.
- **Anti-goals** — what you will NEVER do (inversion thinking)
- **Risk register** — what could destroy the system, with likelihood and impact
- **Resilience protocols** — pre-written checklists for rare critical events (job loss, health crisis, market crash)
- **Optionality tracker** — runway months, income sources, scarce skills, countries, strong contacts, independent projects

### Settings ⚙️
- **Theme** — Midnight (dark), Light, OLED (pure black)
- **Accent color** — blue, green, violet
- **Haptics** — vibration on toggle (mobile)
- **Sounds** — audio feedback
- **Notifications** — 3 daily reminders (9 AM plan, 2 PM check, 9 PM wind down)
- **Cloud sync** — GitHub Gist backup (push/pull)
- **Temptation bundling** — create bundles linking "want" to "should" activities
- **Data** — export to JSON, import from JSON, reset all data

---

## 5 Behavior Change Mechanisms

The app implements 5 mechanisms from peer-reviewed cognitive science research:

### 1. Implementation Intentions (Gollwitzer 2006)
**What:** If-then plans on all daily actions. "After [cue], I will [response]."
**Where:** Today tab shows "🔗 cue → response" under each incomplete action.
**Example:** "After morning coffee → Do 1 set of pushups + squats"
**Evidence:** Meta-analysis of 94 studies shows 2-3x goal attainment vs. mere goal intentions.
**Coverage:** All daily actions across Body, Executive, Attention, and Psyche domains.

### 2. Spaced Repetition / SM-2 (Cepeda 2008)
**What:** Card-based review system with SM-2 scheduling algorithm.
**Where:** "Recall" section in More hub. Due cards surface in Today tab.
**How it works:**
- Create cards (question + answer)
- Review: rate recall quality 0-5 (blackout → easy)
- SM-2 algorithm: I(1)=1 day, I(2)=6 days, I(n)=I(n-1)×EF
- Ease Factor starts at 2.5, adjusted by quality (min 1.3)
- Quality < 3: reset to relearning (interval = 1 day)
- Quality ≥ 3: advance to next interval
**Evidence:** 40-60% retention gain vs. cramming (Cepeda et al. 2008).

### 3. Loss Aversion Framing (Kahneman & Tversky 1992)
**What:** Streak risk messages reframed from gain to loss.
**Where:** Command Center streak warnings + Today tab nudge.
**Before (gain-framed):** "9pm+ and nothing done. Do the Floor now."
**After (loss-framed):** "Don't lose this day. Do the Floor now — it takes 2 minutes. You're about to lose your 14-day streak."
**Evidence:** Losses loom ~2x larger than equivalent gains (prospect theory).

### 4. Temptation Bundling (Milkman et al. 2013)
**What:** Link a "want" activity (podcast, show, treat) to a "should" activity (gym, deep work).
**Where:** Management in Settings. Bundle suggestions show on action rows in Today.
**Example:** "🎧 Only listen to Huberman podcast during Deep Work block"
**Evidence:** 10-14% increase in exercise when tempting audiobooks restricted to gym.

### 5. Commitment Devices (Thaler 1981, Ashraf 2006)
**What:** Stake points on actions. Fail = points burned. Complete = returned + 10% bonus.
**Where:** "Commitments" section in More hub. Active commitments show in Today tab.
**How it works:**
- Pick an action, stake points, set deadline (1-30 days)
- Points deducted immediately (held in escrow)
- Complete by deadline → points returned + 10% bonus
- Fail → points burned permanently
- Cancel → points still burned (cost of withdrawal)
- Auto-resolves on app boot
**Evidence:** 30-50% behavior increase in field trials (Ashraf et al. 2006 savings study).

---

## Scoring & Progression

### Points
- Full protocol completion = 1 point
- Floor completion = 0.5 points
- Rest day = 1 point (counts as full for streak)
- Missed = 0 points

### Version Number
```
version = 1.00 + totalPoints / 400
```
- Start at v1.00
- Hit v2.00 at 400 points (~100 perfect days)
- The version number is your "life version" — a tangible progress metric

### Streaks
- **Current streak** — consecutive days with score > 0 (or shielded)
- **Best streak** — all-time longest (checks for consecutive days, not just records)
- If today isn't complete yet, streak counts from yesterday

### Streak Shields
- Earned by 7 consecutive complete days (score > 0 or shielded)
- Auto-consumed when a day is missed to protect the streak
- Shield-protected days appear gold on the heatmap
- Tracked: total shields earned, shields available

### Forecast
- Based on 14-day average daily points
- Calculates when v2.00 will be reached
- Requires ≥7 valid days of data (otherwise shows "insufficient data")

---

## Cadence Engine

The cadence engine (`cadence.js`) determines what's due on any given date:

- **Daily** — always due
- **Weekly** — due on Sunday
- **Monthly** — due on the first Sunday within the first 7 days of the month
- **Quarterly** — first Sunday of Jan/Apr/Jul/Oct
- **Semi-annual** — first Sunday of Jan/Jul
- **Annual** — Dec 25 – Jan 7 (catch-up window so you don't miss it if you're away)

**Overdue detection** with grace periods:
- Weekly: 7 days grace
- Monthly: 14 days grace
- Quarterly: 21 days grace
- Annual: 30 days grace

**Midnight rollover:** The app checks every 60 seconds if the date changed (for users who keep the app open past midnight) and re-renders with a "New day" toast.

---

## Analytics Engine

The analytics engine (`analytics.js`) provides:

- **Momentum** — 14-day EWMA (exponentially weighted moving average) per action and per domain, with trend direction (up/down/flat) comparing recent vs. older periods
- **Forecast** — when v2.00 will be reached based on current pace
- **Streak risk** — time-aware, loss-framed risk assessment (high/medium/low)
- **Insights:**
  - Most-skipped action (last 30 days)
  - Best day of week (highest average score)
  - Forecast date for v2.00

---

## Apple Health Integration

The app receives HealthKit data via an **Apple Shortcuts URL bridge** — no native app, no API keys.

**How it works:**
1. An Apple Shortcut reads HealthKit data (steps, sleep, HRV, weight, resting HR, active calories, mindful minutes, water, workout minutes, VO₂max, screen time)
2. The Shortcut opens the app URL with data as query parameters: `?steps=8234&sleep=7.2&hrv=48&workoutMins=45`
3. The app parses parameters, validates value ranges, and updates the metrics store
4. Auto-toggles protocols: 8000+ steps → Move = full, 20+ workout min → Move = full, 10+ mindful min → Wind Down = floor

**Setup:** Create an Apple Shortcut that reads HealthKit and opens the app URL. Add it to your home screen or set up a Time of Day automation for zero-tap daily sync.

**Value validation:** All health values are range-checked (e.g., sleep 0-24h, steps 0-200k, HRV 0-500ms) to reject impossible or malformed data.

---

## Cloud Sync (GitHub Gist)

Zero-cost cloud backup and multi-device sync via GitHub Gist.

**How it works:**
1. Create a GitHub Personal Access Token (gist scope only)
2. Enter token in Settings → Cloud sync
3. Push: creates a private Gist with your state as `lifeos-state.json`
4. Pull: fetches the Gist and imports (with confirmation dialog to prevent overwrites)
5. Gist ID is saved locally for future syncs

**Security:** Token stored locally only. Gists are private. No server involved — direct client-to-GitHub-API.

**Schema validation:** Imported JSON is validated for `schemaVersion` before merging. Invalid data is rejected.

---

## Notifications

Three daily reminders using the Notifications API:

| Time | Message |
|------|---------|
| 9:00 AM | "Plan your day. Pick the top 3." |
| 2:00 PM | "Afternoon check — how is the day going?" |
| 9:00 PM | "Wind down. Did you do the Floor?" |

Uses `setTimeout`-based scheduling (no push server). Re-schedules daily. Gracefully degrades if not supported or permission denied.

---

## Data & Privacy

- **Storage:** All data in `localStorage` under key `lifeos-v2-state`
- **No accounts:** No login, no email, no server
- **No tracking:** No analytics, no telemetry, no cookies
- **No external requests:** Except optional GitHub Gist sync (user-initiated)
- **Export:** Full JSON export at any time (Settings → Export)
- **Import:** Restore from JSON backup (Settings → Import)
- **Reset:** Clear all data with double confirmation
- **Migration:** v1 data (under key `bega-v2-state`) auto-migrates to v2 schema on first load

### State Schema (v2)
```
{
  schemaVersion: 2,
  createdAt, version, totalPoints,
  identity: { name, statements[], northStar{y10,y20,y30}, mission, values[] },
  domains: { [id]: ManagementCard },
  days: { 'YYYY-MM-DD': DayRecord },
  reviews: { weekly[], monthly[], quarterly[], semiannual[], annual[] },
  decisions[], errors[], opportunities[], antiGoals[],
  risks[], resilienceProtocols[], sops[], lessonsLearned[],
  inbox[], tasks[],
  spacedRepetition[],      // SM-2 cards
  temptationBundles[],     // Milkman bundles
  commitments[],           // Thaler commitment contracts
  metrics: { weight[], hrv[], sleep[], vo2max[], screenTime[], steps[], restingHr[], bodyFat[], workouts[], mindfulMinutes[], water[] },
  optionality: { runwayMonths, incomeSources, scarceSkills[], countries[], strongContacts, independentProjects[] },
  infoDiet: { newsMins, socialMins, inboxZero, notificationsAudited },
  shields,
  settings: { theme, accent, sync, gistId, gistToken, onboarded, haptics, sounds, notifications }
}
```

### DayRecord
```
{
  habits: { [actionId]: 'full' | 'floor' | 'rest' | null },
  mood: 1-5 | null,
  note: string,
  wins: string,
  anti: string,
  careerLog: string,
  deepWorkMins: number,
  tasks: string[],
  shielded: boolean
}
```

---

## Installation

### As a PWA (recommended)
1. Open the app URL on your phone
2. iOS: Share → "Add to Home Screen"
3. Android: Chrome menu → "Install app"
4. Launches full-screen, works offline

### Deploy to Vercel
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import the repo — Vercel auto-detects static site (no build command)
4. Deploy
5. Open the URL on your phone → Add to Home Screen

### Run locally
```bash
cd src && python3 -m http.server 8765
# Open http://localhost:8765
```

No build step. No dependencies. No npm install. Pure static ES modules.

---

## Project Structure

```
version-2-tracker/
├── src/
│   ├── index.html              # Shell: app, modal, sheet, toast, confetti hosts
│   ├── manifest.json           # PWA manifest (installable, standalone)
│   ├── service-worker.js       # Offline-first cache (38 assets)
│   ├── vercel.json             # Vercel routing & cache headers
│   │
│   ├── styles/
│   │   ├── tokens.css          # Design tokens (colors, spacing, typography)
│   │   ├── base.css            # Base styles, resets, utilities
│   │   └── components.css      # All components (cards, lists, buttons, nav, etc.)
│   │
│   └── app/
│       ├── main.js             # Entry point: boot, router, render shell, nav
│       ├── state.js            # Single source of truth: schema, persistence, accessors
│       ├── util.js             # Pure utility functions (date, math, formatting)
│       ├── dom.js              # Hyperscript element builder (el, div, span, mount, clear)
│       ├── ui.js               # Transient UI: toasts, modals, sheets, confetti, haptics
│       ├── cadence.js          # Cadence engine: what's due on a given date
│       ├── analytics.js        # Momentum (EWMA), forecast, streak risk, insights
│       ├── health.js           # Apple Health URL bridge (HealthKit → query params → state)
│       ├── sync.js             # GitHub Gist sync (push/pull)
│       ├── notifications.js    # 3 daily reminders via Notifications API
│       ├── onboarding.js       # First-run experience (4 steps)
│       ├── spaced-repetition.js # SM-2 algorithm (add, review, schedule, stats)
│       ├── temptation-bundling.js # Bundle logic (add, log, adherence)
│       ├── commitments.js      # Commitment contracts (create, resolve, stats)
│       ├── system-health.js    # OS health checks + entropy monitor
│       │
│       ├── data/
│       │   └── domains.js      # Default Management Cards for all 15 domains + SOPs
│       │
│       └── render/
│           ├── today.js              # Today tab (actions, reflection, SR, commitments)
│           ├── command-center.js     # 12-KPI dashboard + progress ring
│           ├── heatmap.js            # 105-day GitHub-style activity grid
│           ├── domains.js            # Domain browser + Management Card sheet
│           ├── reviews.js            # 5 review templates + history
│           ├── more.js               # More hub (8 subroutes)
│           ├── inbox.js              # GTD capture → clarify → schedule → archive
│           ├── decisions.js          # Decision journal + pre-mortem + review
│           ├── opportunities.js      # Kanban pipeline (Open → Pursuing → Closed)
│           ├── lessons.js            # Lessons learned + error log
│           ├── spaced-repetition.js  # SR review UI (create, review, stats)
│           ├── commitments.js        # Commitment UI (create, cancel, history)
│           ├── system-health.js      # OS health + entropy monitor view
│           ├── risks.js              # Risks + resilience + anti-goals + optionality
│           └── settings.js           # Theme, sync, bundles, data, reset
│
├── ROADMAP.md                  # Original design vision
├── AUDIT-TIMING.md             # Timing/cadence audit report
├── AUDIT-SCIENCE.md            # Scientific theory audit report
└── README.md                   # This file
```

**Total: ~6,160 lines across 37 files.** No dependencies. No build step.

---

## Architecture Decisions

### No framework, no build step
Pure vanilla JS with ES modules. The `el()` function is a 30-line hyperscript-style element builder that replaces React. No JSX, no bundler, no transpiler. The browser loads modules directly.

### Single source of truth
`state.js` is the only module that reads/writes `localStorage`. All other modules import from it. State changes trigger re-render via a simple pub/sub (`subscribe()`).

### Re-entrancy guards
- `setState()` uses a `_setting` flag to prevent infinite loops from nested calls
- `render()` uses a `_renderToken` to skip stale renders (race condition protection)

### Lazy loading
Each tab's render module is dynamically imported (`import('./render/today.js')`) on first navigation. This keeps the initial load fast.

### Forward compatibility
`reconcile()` merges saved state with defaults, so new fields added in updates are automatically present for existing users without data loss.

### Offline-first
Service worker caches all 38 assets on install. App works fully offline. Online/offline indicator shows status.

---

## Scientific References

1. **Gollwitzer, P. M. (2006).** "Implementation Intentions: Strong Effects of Simple Plans." *American Psychologist*. Meta-analysis: 2-3x goal attainment.
2. **Cepeda, N. J., et al. (2008).** "Spacing effects in learning: A temporal ridgeline of optimal retention." *Psychological Science*. 40-60% retention gain.
3. **Karpicke, J. D., & Roediger, H. L. (2007).** "Repeated retrieval during learning is the key to long-term retention." *Journal of Memory and Language*.
4. **Kahneman, D., & Tversky, A. (1992).** "Advances in prospect theory: Cumulative representation of uncertainty." *Journal of Risk and Uncertainty*. Loss aversion coefficient ~2.0.
5. **Milkman, K. L., Minson, J. A., & Volpp, K. G. (2013).** "Holding the Hunger Games Hostage at the Gym: An Evaluation of Temptation Bundling." *Management Science*. 10-14% exercise increase.
6. **Thaler, R. H., & Shefrin, H. M. (1981).** "An Economic Theory of Self-Control." *Journal of Political Economy*.
7. **Ashraf, N., Karlan, D., & Yin, W. (2006).** "Tying Odysseus to the Mast: Evidence from a Commitment Savings Product." *Quarterly Journal of Economics*. 30-50% savings increase.
8. **Wozniak, P. (1985).** SuperMemo 2 (SM-2) algorithm. Basis for all modern spaced repetition software.
9. **Ericsson, K. A. (1993).** "The Role of Deliberate Practice in the Acquisition of Expert Performance." *Psychological Review*.
10. **Clear, J. (2018).** *Atomic Habits*. Floor concept, "never miss twice."
11. **Newport, C. (2016).** *Deep Work*. Deep work blocks, single-screen sessions.
12. **Allen, D. (2001).** *Getting Things Done*. Inbox → clarify → schedule → archive.
13. **Taleb, N. N. (2012).** *Antifragile*. Anti-goals, kill criteria, resilience protocols.
14. **Attia, P. (2023).** *Outlive*. Medicine 3.0, longevity metrics (VO₂max, HRV, strength).

---

*Life OS v2 · schema v2 · zero backend · zero dependencies · zero build step*
