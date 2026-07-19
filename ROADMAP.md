# Life OS v2 — Roadmap

> From "habit tracker" to **Operating System for Human Optimization**.
> Core thesis: the system's job is not to do more tasks, but to **increase the rate of capital accumulation** (biological, intellectual, financial, social, family, product, reputational) through better decisions, faster learning, and leverage. Health → thinking → decisions → capital → freedom → better long-term bets. A closed positive feedback loop = compounding.

---

## 0. Design principles (non-negotiable)

1. **Minimal daily load.** 8–12 daily items max. Everything else lives on weekly / monthly / quarterly / annual cadences. Cognitive load is the enemy of adherence.
2. **Leading > lagging.** Track causes (sleep hours, deep-work blocks, savings rate), not just outcomes (weight, net worth).
3. **Same card for every domain.** One universal "Management Card" schema (see §2). The system is uniform, like aviation / medicine / fund management.
4. **Cadence-based, not list-based.** Daily / Weekly / Monthly / Quarterly / Semi-annual / Annual / Event-driven.
5. **Feedback loops everywhere.** Action → measure → correct. No action without a metric; no metric without a review.
6. **Anti-fragility built in.** Anti-goals, kill criteria, risk register, resilience protocols, error log.
7. **Learning > output.** Lessons Learned turns every project/decision into a system upgrade.
8. **Zero backend by default.** localStorage + optional GitHub Gist sync. No accounts. PWA, offline-first.
9. **Maturity model per domain.** L1 chaos → L2 list → L3 process → L4 metrics → L5 auto-improvement. The UI shows current level and next step.
10. **SOPs for everything.** If you'd have to remember "how I did this" in a year, it's an SOP.

---

## 1. Architecture — by levels, not spheres

```
┌──────────────────────────────────────────────────────────────┐
│ LEVEL 5 — LEGACY                       (annual + event)       │
│   children · book · company · capital · archive ·            │
│   open source · fund · educational project                   │
├──────────────────────────────────────────────────────────────┤
│ LEVEL 4 — STRATEGY                     (quarterly)            │
│   right game? · one 5-year bet · scarce competencies ·       │
│   AI opportunities · what to kill · what to scale            │
├──────────────────────────────────────────────────────────────┤
│ LEVEL 3 — CAPITAL PRODUCTION           (monthly + weekly)     │
│   biological · intellectual · financial · social ·           │
│   family · product · reputational                            │
├──────────────────────────────────────────────────────────────┤
│ LEVEL 2 — EXECUTIVE SYSTEM             (daily + weekly)       │
│   executive function · attention mgmt · decision system      │
├──────────────────────────────────────────────────────────────┤
│ LEVEL 1 — FOUNDATION                   (daily)                │
│   biology · psyche · environment                            │
└──────────────────────────────────────────────────────────────┘
```

Each level contains **domains**. Each domain has a **Management Card** (§2). Each domain has a **maturity level** (§3). Each domain has **cadenced actions** (§4).

---

## 2. Universal Management Card (one schema for every domain)

Every domain — Body, Finance, Career, Family, etc. — is stored as the same shape:

| Field | Meaning |
|---|---|
| `id` | stable slug, e.g. `body`, `finance` |
| `level` | 1–5 (which architectural level it belongs to) |
| `objective` | why this domain exists |
| `principles` | decision rules (array) |
| `leadingIndicators` | controllable inputs (each = `{name, target, unit, cadence}`) |
| `laggingIndicators` | outcomes (each = `{name, unit, source}`) |
| `actions` | regular actions, each tagged with cadence |
| `trigger` | when to run |
| `checklist` | how to run it (SOP body) |
| `automation` | what's automated / could be |
| `riskRegister` | what can go wrong + mitigation |
| `killCriteria` | when to change approach |
| `reviewQuestions` | asked at review time |
| `sop` | full Standard Operating Procedure (steps, duration, when) |
| `maturity` | 1–5 (see §3) |
| `history` | append-only log of metric readings + reviews |

This is the **single source of truth** for a domain. The UI is generated from it.

---

## 3. Maturity model (per domain, 1–5)

```
L1  Chaos          — no system, ad-hoc
L2  List           — tasks written down
L3  Process        — repeatable process exists
L4  Metrics        — KPIs tracked, reviewed
L5  Auto-improve   — system improves itself via feedback loops
```

UI shows current level + the single next-step action to reach L+1.

Example — Finance:
- L1: don't know how much money I have
- L2: keep a budget
- L3: investment strategy written down
- L4: KPIs tracked (savings rate, runway, CAGR)
- L5: auto-rebalance, auto-invest, monthly review automated

---

## 4. Cadence system

| Interval | Max items | What | Time |
|---|---|---|---|
| Daily (AM 5–10 min) | 8–12 | energy, sleep, Big4, key task of day | 5–10 min |
| Daily (PM 5–10 min) | — | evening review, career log 1 line, gratitude | 5–10 min |
| Weekly (Sun PM) | 10–15 | finance, projects, inbox, admin, plan next week | 30–90 min |
| Monthly (1st Sun) | 15–25 | KPIs all domains, STAR stories, budget, network, family | 1–2 h |
| Quarterly (Jan/Apr/Jul/Oct) | 20–30 | strategy, health, investments, risks, project audit | 3–4 h |
| Semi-annual (Jan/Jul) | — | deep audit: skills, career, fitness, systems | 4–6 h |
| Annual (Dec or birthday) | — | full life review: values, mission, capital, 3/5/10y plan | 6–8 h |
| Event-driven | — | RSU/ESPP · income change · birth · move · illness · big purchase · project end | on event |

**Attention-cost rule:** the slower a metric changes, the rarer it's reviewed.

---

## 5. The 15 scientific mechanisms (built into the system)

| # | Mechanism | Where it lives |
|---|---|---|
| 1 | Feedback loops | every action has a metric + review |
| 2 | Leading vs lagging | each card has both |
| 3 | Anti-goals | dedicated Anti-Goals section per domain + global |
| 4 | Kill criteria | per project + per domain |
| 5 | Error log | global, searchable, pattern-detected |
| 6 | Decision library | big decisions logged + reviewed at 1y |
| 7 | Opportunity pipeline | separate from tasks — vacancies, startups, ideas, contacts |
| 8 | Knowledge mgmt | PARA/Zettelkasten/MOC hooks, link-out + index |
| 9 | Automation first | every recurring process asks: automate / delegate / kill |
| 10 | Energy management | tracked alongside time — sleep, fatigue, caffeine, stress |
| 11 | Annual life review | full audit template |
| 12 | Risk register | per domain + global, with mitigation plan |
| 13 | Optionality tracker | runway months, income sources, scarce skills, countries, contacts, independent projects |
| 14 | Information diet | news budget, social budget, inbox zero, notification audit |
| 15 | Resilience protocols | pre-written checklists for rare critical events |

---

## 6. Three meta-systems

1. **Command Center** — one dashboard, 10–15 KPIs visible in 60 seconds (sleep, deep work, net worth, runway, VO₂max, HRV, active projects, strategic contacts, etc.).
2. **Inbox → Clarify → Schedule → Archive** — every new commitment/idea/problem flows through this. No mental loose ends.
3. **Lessons Learned** — after every project / big decision / purchase, answer 4 questions: what worked / what didn't / why / what to change in the system.

---

## 7. Data model (state schema v2)

```jsonc
{
  "schemaVersion": 2,
  "version": "v1.42",            // overall life version
  "identity": { "statements": [], "northStar": { "y10":"", "y20":"", "y30":"" } },
  "domains": {
    "body":         { /* Management Card */ },
    "psyche":       { /* Management Card */ },
    "environment":  { /* Management Card */ },
    "executive":    { /* Management Card */ },
    "attention":    { /* Management Card */ },
    "decisions":    { /* Management Card */ },
    "bioCapital":   { /* Management Card */ },
    "intelCapital": { /* Management Card */ },
    "finCapital":   { /* Management Card */ },
    "socCapital":   { /* Management Card */ },
    "familyCapital":{ /* Management Card */ },
    "prodCapital":  { /* Management Card */ },
    "repCapital":   { /* Management Card */ },
    "strategy":     { /* Management Card */ },
    "legacy":       { /* Management Card */ }
  },
  "days": { "2026-07-19": { "habits":{}, "mood":4, "note":"", "tasks":[], "deepWorkMins":0, "careerLog":"" } },
  "reviews": {
    "weekly":   [{ "date":"", "answers":{} }],
    "monthly":  [],
    "quarterly":[],
    "annual":   []
  },
  "decisions":     [{ "id":"", "date":"", "decision":"", "expected":"", "reviewDate":"", "outcome":"" }],
  "errors":        [{ "id":"", "date":"", "what":"", "rootCause":"", "pattern":"" }],
  "opportunities": [{ "id":"", "type":"job|startup|invest|idea|contact|market", "title":"", "status":"open|pursued|passed|closed", "notes":"" }],
  "antiGoals":     [{ "id":"", "rule":"", "why":"", "enforced":"always|event" }],
  "risks":         [{ "id":"", "domain":"", "risk":"", "likelihood":1-5, "impact":1-5, "mitigation":"", "protocolId":"" }],
  "resilienceProtocols": [{ "id":"", "trigger":"", "checklist":[] }],
  "sops":          [{ "id":"", "domain":"", "title":"", "when":"", "duration":"", "steps":[] }],
  "lessonsLearned":[{ "id":"", "projectId":"", "worked":"", "didntWork":"", "why":"", "systemChange":"" }],
  "optionality":   { "runwayMonths":0, "incomeSources":0, "scarceSkills":[], "countries":[], "strongContacts":0, "independentProjects":[] },
  "infoDiet":      { "newsMins":0, "socialMins":0, "inboxZero":true, "notificationsAudited":"" },
  "metrics":       { "weight":[], "hrv":[], "sleep":[], "vo2max":[], "screenTime":[], "steps":[] },
  "settings":      { "accent":"", "sync":"gist", "gistId":"", "theme":"" }
}
```

Migration: on first load of v2, the existing v1 state (Big4 + days + mood + notes) is mapped into `domains.body.actions` + `days`. Nothing is lost.

---

## 8. UI structure (tabs → levels)

```
┌────────────────────────────────────────────────────────────┐
│ COMMAND CENTER  (always-visible top dashboard)             │
│   10–15 KPIs · version · runway · streak · today's ring    │
├────────────────────────────────────────────────────────────┤
│ TODAY          daily actions across all domains            │
│ INBOX          capture → clarify → schedule → archive      │
│ DOMAINS        browse all 15 domains as Management Cards   │
│ CADENCE        what's due today/this week/this month/quarter│
│ DECISIONS      decision journal + library                  │
│ OPPORTUNITIES  pipeline                                    │
│ REVIEWS        weekly / monthly / quarterly / annual       │
│ LESSONS        lessons learned + error log                 │
│ RISKS          risk register + resilience protocols        │
│ SETTINGS       sync · export · editors · reset             │
└────────────────────────────────────────────────────────────┘
```

Bottom nav stays 4–5 tabs; the rest are reachable from a hub.

---

## 9. Build approach

**Decision:** split the single 2,925-line `index.html` into a small set of static ES modules. No bundler, no build step, still deploys as static on Vercel.

```
src/
├── index.html              shell + <script type="module">
├── styles/
│   ├── base.css
│   ├── components.css
│   └── themes.css
├── app/
│   ├── main.js             init + router
│   ├── state.js            schema, load/save, migrate v1→v2
│   ├── domains.js          default Management Cards for all 15
│   ├── cadence.js          what's due when
│   ├── render/
│   │   ├── command-center.js
│   │   ├── today.js
│   │   ├── inbox.js
│   │   ├── domain-card.js
│   │   ├── decisions.js
│   │   ├── opportunities.js
│   │   ├── reviews.js
│   │   ├── lessons.js
│   │   ├── risks.js
│   │   └── settings.js
│   ├── analytics.js        momentum, correlations, forecast, maturity
│   ├── health.js           Apple Shortcuts URL bridge
│   ├── sync.js             GitHub Gist sync
│   └── notifications.js    service-worker push
├── manifest.json
├── service-worker.js
└── vercel.json
```

Vercel serves `src/` as static root. Service worker caches all module files.

---

## 10. Phased plan

### Phase 0 — Stabilize (before any new code)
- [ ] Review & commit current uncommitted changes (or discard).
- [ ] Tag current state as `v1-final`.
- [ ] Create `src/` structure, move existing code in (mechanical split, no behavior change).
- [ ] Verify app still works end-to-end.
- [ ] Add a basic Playwright smoke test (loads app, taps a habit, asserts state).

### Phase 1 — Schema v2 + migration
- [ ] Define `state.js` with schema v2 (§7).
- [ ] Write v1→v2 migrator (Big4 → `domains.body`, days preserved).
- [ ] Default Management Cards for all 15 domains (§1) — content first, UI later.
- [ ] Smoke test: load v1 data, assert migration correctness.

### Phase 2 — Command Center + Domains browser
- [ ] Command Center dashboard (10–15 KPIs).
- [ ] Domains tab: list all 15, tap → Management Card view (read-only first).
- [ ] Maturity level indicator per domain + next-step hint.
- [ ] Editable objective / principles / actions.

### Phase 3 — Cadence engine
- [ ] Cadence computation: given today's date, what's due across all domains?
- [ ] "Today" tab rebuilt from cadence (replaces hardcoded Big4).
- [ ] Weekly / Monthly / Quarterly / Annual review flows with templated questions.
- [ ] Reminders via Notifications API + service worker.

### Phase 4 — Decisions, Opportunities, Lessons, Errors
- [ ] Decision journal: log decision, expected outcome, review date.
- [ ] Decision library: 1-year review prompt, outcome vs expected.
- [ ] Opportunity pipeline (kanban-ish: open / pursued / passed / closed).
- [ ] Lessons Learned form (4 questions) tied to projects/decisions.
- [ ] Error log with pattern detection (same root cause > once → flag).

### Phase 5 — Risk, Resilience, Anti-Goals, Optionality
- [ ] Risk register (likelihood × impact heatmap).
- [ ] Resilience protocols (pre-written checklists, event-triggered).
- [ ] Anti-goals (global + per domain), with "enforced: always/event".
- [ ] Optionality tracker (runway, income sources, scarce skills, countries, contacts, projects).

### Phase 6 — SOPs + Knowledge + Automation
- [ ] SOP editor per domain (steps, duration, when).
- [ ] SOP run-mode: step-through checklist with timer.
- [ ] Knowledge mgmt hooks (link out to external second-brain; local index of notes).
- [ ] Automation-first audit: every recurring action asks automate/delegate/kill.

### Phase 7 — Sync + multi-device
- [ ] GitHub Gist sync (export = push private gist, import = pull).
- [ ] QR code clone for quick device-to-device.
- [ ] Conflict resolution (last-write-wins per key, with timestamp).

### Phase 8 — Analytics v2
- [ ] Per-domain momentum (EWMAs).
- [ ] Leading vs lagging correlation views.
- [ ] Forecast: "at current pace, v2.00 on <date>".
- [ ] Maturity progression over time.
- [ ] Lessons-learned → system-change tracker (closed loop visible).

### Phase 9 — Polish & PWA
- [ ] Themes (light / OLED / palettes).
- [ ] iOS widget via manifest.
- [ ] Haptics + sound on completion.
- [ ] Onboarding redesigned for v2 (levels + cadence explained).
- [ ] Offline-first audit, service-worker versioning.

### Phase 10 — Event-driven triggers
- [ ] Event handler: RSU/ESPP vesting → run finance SOP.
- [ ] Income change → recompute budget + savings rate.
- [ ] Project end → post-mortem + lessons learned.
- [ ] Big purchase → decision journal entry.
- [ ] Illness/injury → adjust training + recovery SOP.

---

## 11. What NOT to do (guardrails)

- Don't add a backend unless sync via Gist proves insufficient.
- Don't add accounts/auth — Gist token is enough.
- Don't bloat daily load. If a new item would push daily > 12, it must displace something or move to weekly.
- Don't track lagging indicators daily. They go on weekly/monthly.
- Don't build features without a Management Card home — everything has a place.
- Don't ship without a migration path from v1.

---

## 12. Success metrics for the system itself

- Daily adherence > 80% over 90 days (otherwise the system is too heavy).
- Weekly review completed 4/4 weeks.
- Monthly review completed 12/12 months.
- At least 1 system-change per quarter from Lessons Learned.
- Maturity level of at least 3 domains reaches L4 within 12 months.
- v2.00 reached within ~100 perfect days (kept from v1).
