# Life OS

A private, offline-ready daily operating system for turning long-term priorities into a focused plan for today.

[Open the app](https://version-2-tracker.vercel.app)

## What makes it useful

- **Focused Today plan** — eight starter actions, configurable up to ten.
- **Manageable review cadence** — at most three weekly, monthly, or quarterly actions are added on a due day.
- **Floor mode** — use the smallest useful version of an action on difficult days.
- **Daily planning** — time-slotted actions, personal completion history, calendar-aware scheduling, and a lightweight to-do list.
- **Reflection and learning** — mood, wins, lessons, reviews, decision journal, recall cards, and analytics.
- **Training tools** — gym logging, home workouts, progressive overload, focus mode, and a guided night routine.
- **Local-first privacy** — no account or backend. Data stays in browser storage unless the user explicitly exports or syncs it.
- **Offline PWA** — installable and usable without a network after the first visit.

Life OS starts with an empty history. It never generates fake health, financial, streak, or opportunity data.

## Daily plan

The default plan covers energy, focus, movement, relationships, and recovery:

1. Morning sunlight
2. Water
3. Deep work
4. Movement
5. Post-meal walk
6. Quality conversation
7. Wind down
8. Evening reflection

Change these under **More → Settings → Daily plan**. The limit is intentionally ten actions.

## Data and backup

All primary data is stored under `lifeos.v3` in browser `localStorage`. Schema migrations preserve existing data and create a safety snapshot before import or migration.

Users can:

- export and import a JSON backup;
- optionally sync a private backup through GitHub Gist;
- optionally encrypt an exported payload with a passphrase;
- import Apple Health and Calendar values through an iOS Shortcut.

Never commit GitHub tokens, personal exports, or health data to this repository.

## Development

No build step or framework is required.

```bash
python3 -m http.server 4173 --directory src
```

Open `http://localhost:4173`.

Run the full validation suite:

```bash
npm run check
```

This checks every JavaScript file for syntax errors and runs the core Node test suite. GitHub Actions runs the same checks on pull requests and pushes to `main`.

## Project structure

```text
src/
  index.html             App shell
  manifest.json          PWA metadata
  service-worker.js      Offline asset cache
  styles/                Design tokens and components
  app/
    main.js              Boot and navigation
    state.js             Persistence and migrations
    cadence.js           Daily and review-plan selection
    day-plan.js          Time-slot personalization
    automation.js        Derived metrics
    render/              Screen renderers
    data/                Domain and review definitions
tests/
  core.test.js           Cadence, plan-size, deduplication, and time tests
vercel.json              Deployment and security headers
```

## Deployment

Vercel serves `src/` as the output directory. Every non-production branch receives a preview deployment through the Git integration; `main` is production.

## Privacy model

- No analytics SDK
- No advertising
- No account required
- No server-side database
- No automatic transmission of tracker data
- Content Security Policy restricts connections to the app origin and the GitHub API used for optional Gist sync

The user remains responsible for retaining an export or enabling backup before clearing browser storage or changing devices.
