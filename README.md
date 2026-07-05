# Version 2 — Daily Build Tracker

Personal habit tracker for installing **Version 2 of me**. One page, no accounts, no dependencies. Data stays in the browser (localStorage). Real PWA — installable, works offline.

## The system

Four daily habits ("the Big 4"), each with a full version and a **Floor** — a tiny fallback for bad days that keeps the streak alive:

| Habit | Full | Floor |
|---|---|---|
| 🏋️ Move | Gym Day A/B, progressive overload | 1 set pushups + squats |
| 🥩 Fuel | ~168 g protein + small surplus | 1 protein meal |
| 💻 Build | Deep-work block on the product | 10 min / 1 commit |
| 🌙 Wind down | Phone out of bedroom, no late scroll | Just the phone rule |

**Rules:** Never miss twice. On bad days, do the Floor.

## Scoring

- Full habit = 1 pt · Floor = 0.5 pt · Perfect day = 4 pts
- Version counter: `v1.00 + total points / 400` → hit **v2.00** at 400 pts (~100 perfect days)
- GitHub-style heatmap = commit history of your days

## Features

### Today tab
- **Hero ring** — four pillar arcs close around your version number as the day completes
- **Habit cards** — tap to complete, floor button for bad days, expandable details
- **Mood check-in** — 5-level emoji selector with nightly reflection
- **Nightly note** — one bad habit today? one win?
- **Daily quote** — rotating motivation
- **Missed yesterday warning** — "never miss twice" reminder
- **Smart Nudge** — contextual, time-aware messages that detect streak risk, skip-day patterns, and health data to suggest the right action at the right time
- **Apple Health sync bar** — shows synced HealthKit data (steps, sleep, HRV, weight, workouts, etc.) with one-tap sync button
- **Health-based suggestions** — priority-coded suggestions generated from real body data (sleep debt, low HRV, sedentary warnings, workout detection, dehydration alerts)
- **Streak Shields** — shield icons showing earned protection from perfect weeks
- **Priority** — set the #1 thing that matters most today
- **North Star** — 10 / 20 / 30 year vision
- **Identity statements** — "I am the kind of person who..."

### Progress tab
- **Overview stats** — streak, best streak, total points, perfect days, avg pts/day, streak shields, floor saves
- **Composite Weekly Score** — weighted math combining habits (50%), mood (20%), anti-habits (15%), priority (15%) with letter grade A+ to F and visual breakdown bars
- **Momentum** — 14-day exponentially weighted moving average per habit showing recent trend direction with colored bars
- **Interactive heatmap** — tap any day to see full breakdown in a bottom sheet modal
- **Body & recovery metrics** — weight, HRV, sleep, screen time with area charts (gradient fills, auto-filled from Apple Health)
- **Mood chart** — 14-day mood trend
- **Habit strength** — per-habit consistency bars
- **Life domains** — Body, Mind, Craft, Connection domain tracking
- **Habit coupling** — implementation intentions ("After [trigger], I [action]") display
- **Insights engine** — most-skipped habit, best day of week, floor save rate, 7-day trend, per-habit mood correlations, skip-day patterns, streak risk warnings
- **Rank ladder** — consistency moves you from Baseline to **Top 2%** (v2.00 at 400 pts)
- **Badges** — streaks, perfect days, floor saves, habit swaps, version milestones, streak shields, comebacks

### Audit tab
- **Week at a glance** — perfect/floor/missed counts for last 7 days
- **Weekly notes review** — last 7 nightly notes with mood tags
- **Habit swap system** — name the trigger, replace the habit
- **Weekly goal** — set a target, track progress bar
- **Swap history** — permanent log of every habit swap

### Settings tab
- **Data export/import** — backup and restore as JSON
- **Accent color picker** — 8 colors to personalize
- **Habit editor** — customize names, icons, subtitles, details, life domains
- **Anti-habits editor** — not-to-do list with replacement actions
- **Habit coupling editor** — "After [trigger], I [action]" implementation intentions
- **Apple Health sync setup** — step-by-step instructions for creating the Apple Shortcut
- **PWA install** — add to home screen for full-screen experience
- **Reset** — clear all data (double confirmation)

## Smart Analytics Engine

- **Momentum scores** — 14-day weighted moving average per habit (recent days count more, 0.85 decay) with trend direction arrows (↑/↓/→) comparing recent vs older periods
- **Streak risk prediction** — time-aware system that checks current hour + habits done. Three levels: high (9pm+ with nothing done), medium (afternoon with 0-1), low (on track)
- **Habit-mood correlations** — for each habit, calculates whether your mood is better on days you do it vs skip it
- **Skip pattern detection** — finds which day of the week you skip each habit most often
- **Composite Weekly Score** — weighted formula: 50% habits + 20% mood + 15% anti-habits + 15% priority, with letter grade and visual breakdown bars. Displayed in the Audit tab.
- **Streak Shields** — earn 1 shield per perfect week (all 7 days complete or rest day). Shields auto-protect your streak on missed days — when a day is missed and shields are available, one is consumed automatically and the streak continues. Shield-protected days appear gold on the heatmap and show a special comeback message.
- **Smart Nudges** — contextual messages that combine streak risk, skip patterns, time of day, and health data

## Apple Health Integration

The app receives HealthKit data via an **Apple Shortcuts URL bridge**:

1. An Apple Shortcut reads HealthKit data (steps, sleep, HRV, weight, resting HR, active calories, mindful minutes, water, workout minutes)
2. The Shortcut opens the app URL with data as parameters: `?steps=8234&sleep=7.2&hrv=48`
3. The app auto-fills metrics and generates smart suggestions based on real body data

**Auto-toggle:** When health data shows sufficient activity (e.g., 8000+ steps or 20+ workout minutes), the app can auto-set Move to FULL. When mindful minutes >= 10, Wind Down floor is auto-set.

**Setup:** Settings → Apple Health sync → follow the step-by-step instructions to create the `BegaHealthSync` shortcut. Add it to your home screen or set up a Time of Day automation for zero-tap daily sync.

## PWA
- **manifest.json** — installable on iOS/Android, standalone display
- **service-worker.js** — offline support, caches all assets
- **Installable** — "Add to Home Screen" or via browser prompt

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Vercel auto-detects the static site — no build command needed
5. Click **Deploy**
6. Open the live URL on your phone → Share → **Add to Home Screen**

## Project structure

```
├── index.html          # The entire app (HTML + CSS + JS)
├── manifest.json       # PWA manifest for installable app
├── service-worker.js   # Offline caching
├── vercel.json         # Vercel routing & cache config
├── .gitignore
└── README.md
```

## Notes

- Data is stored locally in your browser per device. Use Settings → Export to backup.
- Everything is in one `index.html` — edit habits, colors, or point values directly in the file or via Settings.
- No build step, no dependencies, no backend — pure static deployment.
- First-time visitors see an onboarding screen. Clear browser data to see it again.
- Apple Health integration requires iOS Shortcuts app (iOS 16+ recommended for automations).
