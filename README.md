# Version 2 — Daily Build Tracker

Personal habit tracker for installing **Version 2 of me**. One page, no accounts, no dependencies. Data stays in the browser (localStorage).

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

- **Rank ladder** — consistency moves you from Baseline to **Top 2%** (v2.00 at 400 pts)
- **Hero ring** — four pillar arcs close around your version number as the day completes
- **Metrics with sparklines** — log weight, HRV, sleep, screen time against your targets
- **Badges** — streaks, perfect days, floor saves, habit swaps
- **Weekly audit tab** — reads your last 7 nightly notes, commit habit swaps
- **Rank-up celebrations** with confetti
- **App-style bottom navigation** — Today / Progress / Audit
- **PWA-ready** — installable on mobile via "Add to Home Screen"

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Vercel auto-detects the static site — no build command needed
5. Click **Deploy**
6. Open the live URL on your phone → Share → **Add to Home Screen**

## Project structure

```
├── index.html      # The entire app (HTML + CSS + JS)
├── vercel.json     # Vercel routing & cache config
├── .gitignore
└── README.md
```

## Notes

- Data is stored locally in your browser per device. Clearing browser data resets progress.
- Everything is in one `index.html` — edit habits, colors, or point values directly in the file.
- No build step, no dependencies, no backend — pure static deployment.
