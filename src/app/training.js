// ============================================================
// Life OS v3 — Training Log
// Workout tracking with sets/reps, 2-min rest timer with visual
// countdown, exercise visuals (SVG body diagrams), smart check-ins.
//
// Exercises have visual diagrams so you don't need to know names.
// Timer runs between sets with circular countdown + audio cue.
// Smart tracking suggests next exercise based on muscle groups.
// ============================================================

import { el, svg, svgEl } from './dom.js';
import { getState, update, updateSilent } from './state.js';
import { todayKey, fmtDate, uid } from './util.js';
import { toast, sheet, closeAll } from './ui.js';

// ---- Exercise library with visuals ----
// Each exercise has: name, muscle group, SVG visual, default sets/reps
export const EXERCISES = {
  pushup: {
    name: 'Push-up',
    muscle: 'Chest',
    sets: 3, reps: 12,
    visual: 'pushup',
  },
  squat: {
    name: 'Bodyweight Squat',
    muscle: 'Legs',
    sets: 3, reps: 15,
    visual: 'squat',
  },
  pullup: {
    name: 'Pull-up',
    muscle: 'Back',
    sets: 3, reps: 8,
    visual: 'pullup',
  },
  plank: {
    name: 'Plank',
    muscle: 'Core',
    sets: 3, reps: 30, // seconds
    isTimed: true,
    visual: 'plank',
  },
  lunge: {
    name: 'Lunge',
    muscle: 'Legs',
    sets: 3, reps: 10,
    visual: 'lunge',
  },
  dip: {
    name: 'Dips',
    muscle: 'Triceps',
    sets: 3, reps: 10,
    visual: 'dip',
  },
  row: {
    name: 'Inverted Row',
    muscle: 'Back',
    sets: 3, reps: 10,
    visual: 'row',
  },
  pike: {
    name: 'Pike Push-up',
    muscle: 'Shoulders',
    sets: 3, reps: 8,
    visual: 'pike',
  },
  curl: {
    name: 'Bicep Curl',
    muscle: 'Arms',
    sets: 3, reps: 12,
    visual: 'curl',
  },
  deadlift: {
    name: 'Deadlift',
    muscle: 'Posterior Chain',
    sets: 3, reps: 8,
    visual: 'deadlift',
  },
  bench: {
    name: 'Bench Press',
    muscle: 'Chest',
    sets: 3, reps: 8,
    visual: 'bench',
  },
  ohp: {
    name: 'Overhead Press',
    muscle: 'Shoulders',
    sets: 3, reps: 8,
    visual: 'ohp',
  },
  row_barbell: {
    name: 'Barbell Row',
    muscle: 'Back',
    sets: 3, reps: 10,
    visual: 'row_barbell',
  },
  legpress: {
    name: 'Leg Press',
    muscle: 'Legs',
    sets: 3, reps: 12,
    visual: 'legpress',
  },

  // ---- Hypertrophy split (5-day program) ----
  // Day 1: PUSH
  db_lateral_raise: {
    name: 'Seated DB Lateral Raise',
    muscle: 'Shoulders',
    sets: 4, reps: 12,
    visual: 'lateral_raise',
  },
  incline_bench: {
    name: 'Incline Barbell Press',
    muscle: 'Chest',
    sets: 3, reps: 8,
    visual: 'incline_bench',
  },
  db_shoulder_press: {
    name: 'Seated DB Shoulder Press',
    muscle: 'Shoulders',
    sets: 3, reps: 10,
    visual: 'shoulder_press',
  },
  chest_press_machine: {
    name: 'Seated Chest Machine Press',
    muscle: 'Chest',
    sets: 3, reps: 10,
    visual: 'chest_press',
  },
  cable_flye: {
    name: 'High-to-Low Cable Flye',
    muscle: 'Chest',
    sets: 3, reps: 12,
    visual: 'cable_flye',
  },
  rope_tricep_ext: {
    name: 'Overhead Rope Extensions',
    muscle: 'Triceps',
    sets: 3, reps: 12,
    visual: 'rope_tricep',
  },
  weighted_dip: {
    name: 'Weighted Dip',
    muscle: 'Triceps',
    sets: 3, reps: 8,
    visual: 'dip',
  },

  // Day 2: PULL
  chest_supported_row: {
    name: 'Chest-Supported Machine Row',
    muscle: 'Back',
    sets: 3, reps: 10,
    visual: 'chest_row',
  },
  lat_pulldown: {
    name: 'Straight Bar Lat Pulldown',
    muscle: 'Back',
    sets: 3, reps: 10,
    visual: 'lat_pulldown',
  },
  cable_row: {
    name: 'Wide Grip Cable Row',
    muscle: 'Back',
    sets: 3, reps: 10,
    visual: 'cable_row',
  },
  rear_delt_flye: {
    name: 'Cable Rear Delt Flyes',
    muscle: 'Shoulders',
    sets: 3, reps: 15,
    visual: 'rear_delt_flye',
  },
  hammer_curl: {
    name: 'Dumbbell Hammer Curls',
    muscle: 'Arms',
    sets: 3, reps: 12,
    visual: 'hammer_curl',
  },
  high_cable_curl: {
    name: 'High Cable Curls',
    muscle: 'Arms',
    sets: 3, reps: 12,
    visual: 'high_cable_curl',
  },

  // Day 3: LOWER
  quad_extension: {
    name: 'Quad Extension',
    muscle: 'Legs',
    sets: 3, reps: 12,
    visual: 'quad_ext',
  },
  hack_squat: {
    name: 'Hack Squat',
    muscle: 'Legs',
    sets: 3, reps: 10,
    visual: 'hack_squat',
  },
  rdl: {
    name: 'Barbell RDL',
    muscle: 'Posterior Chain',
    sets: 3, reps: 10,
    visual: 'rdl',
  },
  hamstring_curl: {
    name: 'Hamstring Curl',
    muscle: 'Legs',
    sets: 3, reps: 12,
    visual: 'hamstring_curl',
  },
  walking_lunge: {
    name: 'Walking Lunges',
    muscle: 'Legs',
    sets: 3, reps: 12,
    visual: 'lunge',
  },
  calf_raise: {
    name: 'Standing Calf Raises',
    muscle: 'Legs',
    sets: 4, reps: 15,
    visual: 'calf_raise',
  },

  // Day 5: DELTS + ARMS
  machine_lateral_raise: {
    name: 'Seated Machine Lateral Raise',
    muscle: 'Shoulders',
    sets: 4, reps: 12,
    visual: 'lateral_raise',
  },
  bb_shoulder_press: {
    name: 'Seated Barbell Shoulder Press',
    muscle: 'Shoulders',
    sets: 3, reps: 8,
    visual: 'shoulder_press',
  },
  chest_supported_lateral: {
    name: 'Chest-Supported DB Lateral Raise',
    muscle: 'Shoulders',
    sets: 3, reps: 15,
    visual: 'lateral_raise',
  },
  face_pull: {
    name: 'Rope Face Pulls',
    muscle: 'Shoulders',
    sets: 3, reps: 15,
    visual: 'face_pull',
  },
  ez_tricep_ext: {
    name: 'EZ Bar Tricep Extensions',
    muscle: 'Triceps',
    sets: 3, reps: 10,
    visual: 'ez_tricep',
  },
  incline_db_curl: {
    name: 'Incline Dumbbell Curls',
    muscle: 'Arms',
    sets: 3, reps: 12,
    visual: 'incline_curl',
  },
  skull_crusher: {
    name: 'Dumbbell Skull Crusher',
    muscle: 'Triceps',
    sets: 3, reps: 12,
    visual: 'skull_crusher',
  },

  // Day 6: CHEST + BACK
  close_grip_pulldown: {
    name: 'Close Grip Pulldown',
    muscle: 'Back',
    sets: 3, reps: 10,
    visual: 'lat_pulldown',
  },
  smith_chest_press: {
    name: 'Flat Smith Machine Chest Press',
    muscle: 'Chest',
    sets: 3, reps: 8,
    visual: 'bench',
  },
  db_row: {
    name: 'Single Arm Dumbbell Row',
    muscle: 'Back',
    sets: 3, reps: 10,
    visual: 'db_row',
  },
  pec_dec_flye: {
    name: 'Pec Dec Flye',
    muscle: 'Chest',
    sets: 3, reps: 12,
    visual: 'cable_flye',
  },
};

// ---- Muscle group colors ----
export const MUSCLE_COLORS = {
  'Chest':           '#ef4444',
  'Legs':            '#22c55e',
  'Back':            '#3b82f6',
  'Core':            '#f97316',
  'Triceps':         '#a855f7',
  'Shoulders':       '#06b6d4',
  'Arms':            '#ec4899',
  'Posterior Chain': '#f59e0b',
};

// ---- Exercise SVG visuals (simple body diagrams) ----
export const VISUALS = {
  // PUSH-UP: person horizontal, arms pushing body up from ground
  pushup: [
    // Ground line
    svgEl('line', { x1: 5, y1: 46, x2: 75, y2: 46, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Body (horizontal line - head to feet)
    svgEl('line', { x1: 18, y1: 28, x2: 62, y2: 30, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Head
    svgEl('circle', { cx: 16, cy: 27, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Arms (from shoulders down to ground)
    svgEl('line', { x1: 24, y1: 29, x2: 24, y2: 44, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 30, y1: 29, x2: 30, y2: 44, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Down arrow (showing push direction = down then up)
    svgEl('path', { d: 'M40 18 v8 M37 23 l3 3 l3 -3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],
  // SQUAT: person standing, knees bent, hips back
  squat: [
    // Ground line
    svgEl('line', { x1: 5, y1: 48, x2: 75, y2: 48, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Head
    svgEl('circle', { cx: 40, cy: 10, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso (slightly leaning forward)
    svgEl('line', { x1: 40, y1: 15, x2: 38, y2: 28, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Hips
    svgEl('circle', { cx: 38, cy: 29, r: 3, fill: 'currentColor', opacity: 0.8 }),
    // Thighs (bent, going down and outward)
    svgEl('line', { x1: 38, y1: 30, x2: 30, y2: 38, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    svgEl('line', { x1: 38, y1: 30, x2: 46, y2: 38, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Calves (straight down to ground)
    svgEl('line', { x1: 30, y1: 38, x2: 30, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 46, y1: 38, x2: 46, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Arms (forward for balance)
    svgEl('line', { x1: 40, y1: 18, x2: 52, y2: 22, stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Down arrow (squat down)
    svgEl('path', { d: 'M58 20 v8 M55 25 l3 3 l3 -3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],
  // PULL-UP: person hanging from bar, pulling up
  pullup: [
    // Bar (horizontal line at top with supports)
    svgEl('line', { x1: 8, y1: 8, x2: 72, y2: 8, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 8, y1: 4, x2: 8, y2: 8, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    svgEl('line', { x1: 72, y1: 4, x2: 72, y2: 8, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    // Arms (reaching up to bar)
    svgEl('line', { x1: 34, y1: 18, x2: 34, y2: 9, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 46, y1: 18, x2: 46, y2: 9, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Head
    svgEl('circle', { cx: 40, cy: 20, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 25, x2: 40, y2: 38, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Legs (hanging straight down)
    svgEl('line', { x1: 40, y1: 38, x2: 35, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 40, y1: 38, x2: 45, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Up arrow (pulling body up)
    svgEl('path', { d: 'M60 35 v-8 M57 30 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],
  // PLANK: person horizontal on forearms, straight body
  plank: [
    // Ground line
    svgEl('line', { x1: 5, y1: 46, x2: 75, y2: 46, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Body (straight horizontal line)
    svgEl('line', { x1: 20, y1: 30, x2: 64, y2: 32, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Head
    svgEl('circle', { cx: 17, cy: 29, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Forearm (from elbow on ground up to shoulder)
    svgEl('line', { x1: 24, y1: 44, x2: 24, y2: 31, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 24, y1: 44, x2: 30, y2: 44, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Legs (toes on ground)
    svgEl('line', { x1: 62, y1: 33, x2: 64, y2: 45, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Clock icon (hold position)
    svgEl('circle', { cx: 50, cy: 18, r: 6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.4 }),
    svgEl('line', { x1: 50, y1: 18, x2: 50, y2: 14, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.4 }),
    svgEl('line', { x1: 50, y1: 18, x2: 53, y2: 18, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.4 }),
  ],
  // LUNGE: person in split stance, one leg forward one back, knee down
  lunge: [
    // Ground line
    svgEl('line', { x1: 5, y1: 48, x2: 75, y2: 48, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Head
    svgEl('circle', { cx: 38, cy: 10, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso (upright)
    svgEl('line', { x1: 38, y1: 15, x2: 38, y2: 28, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Front leg (bent forward, thigh and calf)
    svgEl('line', { x1: 38, y1: 28, x2: 52, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    svgEl('line', { x1: 52, y1: 36, x2: 52, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Back leg (extended back, knee bent)
    svgEl('line', { x1: 38, y1: 28, x2: 24, y2: 38, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    svgEl('line', { x1: 24, y1: 38, x2: 22, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Arms (on hips)
    svgEl('line', { x1: 38, y1: 20, x2: 30, y2: 24, stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.5 }),
    svgEl('line', { x1: 38, y1: 20, x2: 46, y2: 24, stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.5 }),
  ],
  // DIPS: person on parallel bars, body between bars, arms straight
  dip: [
    // Two parallel bars
    svgEl('line', { x1: 18, y1: 10, x2: 18, y2: 46, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    svgEl('line', { x1: 62, y1: 10, x2: 62, y2: 46, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Head
    svgEl('circle', { cx: 40, cy: 16, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 21, x2: 40, y2: 34, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Arms (straight, hands on bars)
    svgEl('line', { x1: 40, y1: 23, x2: 20, y2: 12, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 40, y1: 23, x2: 60, y2: 12, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Legs (hanging down, bent)
    svgEl('line', { x1: 40, y1: 34, x2: 35, y2: 42, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 40, y1: 34, x2: 45, y2: 42, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Down arrow (dip down)
    svgEl('path', { d: 'M70 20 v8 M67 25 l3 3 l3 -3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],
  // INVERTED ROW: person under bar, body horizontal, pulling up
  row: [
    // Bar at top
    svgEl('line', { x1: 8, y1: 8, x2: 72, y2: 8, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Arms (reaching up to bar)
    svgEl('line', { x1: 28, y1: 28, x2: 28, y2: 10, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 52, y1: 28, x2: 52, y2: 10, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Body (horizontal, head to feet)
    svgEl('line', { x1: 25, y1: 30, x2: 60, y2: 34, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Head
    svgEl('circle', { cx: 23, cy: 30, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Legs (extending down to ground)
    svgEl('line', { x1: 58, y1: 34, x2: 62, y2: 46, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Heels on ground
    svgEl('line', { x1: 58, y1: 46, x2: 66, y2: 46, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Ground line
    svgEl('line', { x1: 50, y1: 47, x2: 72, y2: 47, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Up arrow (pulling chest to bar)
    svgEl('path', { d: 'M40 44 v-8 M37 39 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],
  // PIKE PUSH-UP: inverted V, hands on ground, hips high, head down
  pike: [
    // Ground line
    svgEl('line', { x1: 5, y1: 46, x2: 75, y2: 46, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Body (inverted V - from hands up to hips then down to feet)
    svgEl('line', { x1: 22, y1: 44, x2: 40, y2: 14, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 40, y1: 14, x2: 58, y2: 44, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Head (down near hands)
    svgEl('circle', { cx: 28, cy: 38, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Arms (hands on ground)
    svgEl('line', { x1: 30, y1: 36, x2: 22, y2: 44, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Down arrow (head goes down toward ground)
    svgEl('path', { d: 'M40 28 v8 M37 33 l3 3 l3 -3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],
  // BICEP CURL: arm with dumbbell, curling up
  curl: [
    // Shoulder/torso
    svgEl('line', { x1: 15, y1: 15, x2: 15, y2: 40, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.6 }),
    // Upper arm (hanging down)
    svgEl('line', { x1: 15, y1: 18, x2: 15, y2: 32, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Forearm (curled up toward shoulder)
    svgEl('line', { x1: 15, y1: 32, x2: 35, y2: 22, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Dumbbell
    svgEl('rect', { x: 33, y: 18, width: 6, height: 10, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    svgEl('circle', { cx: 36, cy: 19, r: 3, fill: 'currentColor', opacity: 0.8 }),
    svgEl('circle', { cx: 36, cy: 27, r: 3, fill: 'currentColor', opacity: 0.8 }),
    // Bicep bulge
    svgEl('circle', { cx: 20, cy: 28, r: 5, fill: 'currentColor', opacity: 0.3 }),
    // Curved arrow showing curl motion
    svgEl('path', { d: 'M45 35 Q35 40 25 35', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.3 }),
    svgEl('path', { d: 'M27 34 l-2 1 l1 2', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.3 }),
  ],
  // DEADLIFT: person bent over, barbell on ground, lifting
  deadlift: [
    // Ground line
    svgEl('line', { x1: 5, y1: 47, x2: 75, y2: 47, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Barbell on ground
    svgEl('line', { x1: 12, y1: 45, x2: 68, y2: 45, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('circle', { cx: 12, cy: 43, r: 4, fill: 'currentColor', opacity: 0.7 }),
    svgEl('circle', { cx: 68, cy: 43, r: 4, fill: 'currentColor', opacity: 0.7 }),
    // Head
    svgEl('circle', { cx: 52, cy: 12, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso (bent forward at angle)
    svgEl('line', { x1: 52, y1: 17, x2: 40, y2: 32, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Arms (reaching down to bar)
    svgEl('line', { x1: 44, y1: 24, x2: 35, y2: 44, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 46, y1: 26, x2: 45, y2: 44, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Legs (bent, knees over bar)
    svgEl('line', { x1: 40, y1: 32, x2: 38, y2: 40, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    svgEl('line', { x1: 38, y1: 40, x2: 38, y2: 46, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Up arrow (lift up)
    svgEl('path', { d: 'M60 38 v-8 M57 33 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],
  // BENCH PRESS: person lying on bench, barbell above chest
  bench: [
    // Bench (horizontal line)
    svgEl('line', { x1: 15, y1: 40, x2: 65, y2: 40, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Bench legs
    svgEl('line', { x1: 20, y1: 40, x2: 20, y2: 47, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    svgEl('line', { x1: 60, y1: 40, x2: 60, y2: 47, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    // Ground line
    svgEl('line', { x1: 5, y1: 48, x2: 75, y2: 48, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Head (on bench)
    svgEl('circle', { cx: 22, cy: 37, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Body (lying on bench)
    svgEl('line', { x1: 27, y1: 38, x2: 58, y2: 38, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Arms (reaching up to bar)
    svgEl('line', { x1: 32, y1: 38, x2: 32, y2: 24, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 48, y1: 38, x2: 48, y2: 24, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Barbell above chest
    svgEl('line', { x1: 18, y1: 22, x2: 62, y2: 22, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('circle', { cx: 18, cy: 22, r: 4, fill: 'currentColor', opacity: 0.7 }),
    svgEl('circle', { cx: 62, cy: 22, r: 4, fill: 'currentColor', opacity: 0.7 }),
    // Legs (bent, feet on ground)
    svgEl('line', { x1: 56, y1: 38, x2: 58, y2: 44, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.6 }),
    svgEl('line', { x1: 58, y1: 44, x2: 62, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.6 }),
  ],
  // OVERHEAD PRESS: standing, barbell pressed overhead
  ohp: [
    // Ground line
    svgEl('line', { x1: 5, y1: 48, x2: 75, y2: 48, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Barbell overhead
    svgEl('line', { x1: 15, y1: 8, x2: 65, y2: 8, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('circle', { cx: 15, cy: 8, r: 4, fill: 'currentColor', opacity: 0.7 }),
    svgEl('circle', { cx: 65, cy: 8, r: 4, fill: 'currentColor', opacity: 0.7 }),
    // Arms (straight up to bar)
    svgEl('line', { x1: 35, y1: 22, x2: 28, y2: 10, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 45, y1: 22, x2: 52, y2: 10, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Head
    svgEl('circle', { cx: 40, cy: 18, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 23, x2: 40, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Legs (standing)
    svgEl('line', { x1: 40, y1: 36, x2: 34, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 40, y1: 36, x2: 46, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Up arrow (press up)
    svgEl('path', { d: 'M70 30 v-8 M67 25 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],
  // BARBELL ROW: bent over, pulling barbell to chest
  row_barbell: [
    // Head
    svgEl('circle', { cx: 55, cy: 12, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso (bent forward at 45°)
    svgEl('line', { x1: 55, y1: 17, x2: 35, y2: 32, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Arms (hanging down to bar)
    svgEl('line', { x1: 40, y1: 24, x2: 35, y2: 42, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 44, y1: 26, x2: 45, y2: 42, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Barbell
    svgEl('line', { x1: 15, y1: 43, x2: 60, y2: 43, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('circle', { cx: 15, cy: 43, r: 4, fill: 'currentColor', opacity: 0.7 }),
    svgEl('circle', { cx: 60, cy: 43, r: 4, fill: 'currentColor', opacity: 0.7 }),
    // Legs (slightly bent)
    svgEl('line', { x1: 35, y1: 32, x2: 33, y2: 42, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    svgEl('line', { x1: 33, y1: 42, x2: 33, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Ground line
    svgEl('line', { x1: 5, y1: 48, x2: 75, y2: 48, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Up arrow (pull bar to chest)
    svgEl('path', { d: 'M68 35 v-8 M65 30 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],
  // LEG PRESS: seated, pushing platform with feet
  legpress: [
    // Seat back (angled)
    svgEl('line', { x1: 12, y1: 10, x2: 18, y2: 30, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Seat bottom
    svgEl('line', { x1: 18, y1: 30, x2: 30, y2: 30, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Head (seated)
    svgEl('circle', { cx: 15, cy: 14, r: 4, fill: 'currentColor', opacity: 0.9 }),
    // Torso (against seat back)
    svgEl('line', { x1: 16, y1: 18, x2: 20, y2: 28, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Legs (extended toward platform)
    svgEl('line', { x1: 28, y1: 28, x2: 48, y2: 28, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Feet (on platform)
    svgEl('line', { x1: 48, y1: 25, x2: 48, y2: 32, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Platform
    svgEl('line', { x1: 52, y1: 15, x2: 52, y2: 42, stroke: 'currentColor', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Arrow (push direction)
    svgEl('path', { d: 'M60 28 h8 M65 25 l3 3 l-3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // ---- Hypertrophy split visuals ----

  // LATERAL RAISE: person standing, arms raising out to sides
  lateral_raise: [
    // Head
    svgEl('circle', { cx: 40, cy: 10, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 15, x2: 40, y2: 32, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Legs
    svgEl('line', { x1: 40, y1: 32, x2: 34, y2: 46, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 40, y1: 32, x2: 46, y2: 46, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Arms raised out to sides (horizontal)
    svgEl('line', { x1: 40, y1: 18, x2: 18, y2: 18, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 40, y1: 18, x2: 62, y2: 18, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Dumbbells
    svgEl('rect', { x: 14, y: 15, width: 5, height: 7, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    svgEl('rect', { x: 61, y: 15, width: 5, height: 7, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    // Up arrows
    svgEl('path', { d: 'M22 28 v-6 M19 25 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
    svgEl('path', { d: 'M58 28 v-6 M55 25 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // INCLINE BENCH: person on incline bench, pressing barbell up
  incline_bench: [
    // Incline bench (angled)
    svgEl('line', { x1: 18, y1: 38, x2: 50, y2: 22, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    svgEl('line', { x1: 18, y1: 38, x2: 18, y2: 47, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    svgEl('line', { x1: 50, y1: 22, x2: 55, y2: 47, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    // Ground
    svgEl('line', { x1: 5, y1: 48, x2: 75, y2: 48, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Head (at top of incline)
    svgEl('circle', { cx: 50, cy: 18, r: 4, fill: 'currentColor', opacity: 0.95 }),
    // Torso along incline
    svgEl('line', { x1: 49, y1: 22, x2: 22, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Arms pressing up
    svgEl('line', { x1: 32, y1: 28, x2: 32, y2: 12, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.8 }),
    svgEl('line', { x1: 42, y1: 25, x2: 42, y2: 10, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Barbell above
    svgEl('line', { x1: 24, y1: 8, x2: 50, y2: 8, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.95 }),
    svgEl('circle', { cx: 24, cy: 8, r: 3, fill: 'currentColor', opacity: 0.8 }),
    svgEl('circle', { cx: 50, cy: 8, r: 3, fill: 'currentColor', opacity: 0.8 }),
    // Up arrow
    svgEl('path', { d: 'M62 22 v-8 M59 17 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // SHOULDER PRESS: seated, pressing dumbbells overhead
  shoulder_press: [
    // Head
    svgEl('circle', { cx: 40, cy: 14, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 19, x2: 40, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Seat
    svgEl('line', { x1: 30, y1: 38, x2: 50, y2: 38, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    svgEl('line', { x1: 30, y1: 38, x2: 30, y2: 47, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    // Legs
    svgEl('line', { x1: 40, y1: 36, x2: 32, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.6 }),
    // Arms pressing up
    svgEl('line', { x1: 40, y1: 22, x2: 28, y2: 8, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 40, y1: 22, x2: 52, y2: 8, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Dumbbells at top
    svgEl('rect', { x: 24, y: 4, width: 6, height: 8, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    svgEl('rect', { x: 50, y: 4, width: 6, height: 8, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    // Up arrow
    svgEl('path', { d: 'M64 22 v-8 M61 17 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // CHEST PRESS MACHINE: seated, pushing handles forward
  chest_press: [
    // Head
    svgEl('circle', { cx: 18, cy: 16, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso (seated, leaning back)
    svgEl('line', { x1: 20, y1: 20, x2: 26, y2: 34, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Seat back
    svgEl('line', { x1: 14, y1: 12, x2: 24, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Seat
    svgEl('line', { x1: 24, y1: 36, x2: 38, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Arms pushing forward
    svgEl('line', { x1: 24, y1: 24, x2: 50, y2: 24, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 24, y1: 28, x2: 50, y2: 28, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Handles
    svgEl('rect', { x: 50, y: 21, width: 4, height: 10, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    // Push arrow
    svgEl('path', { d: 'M58 26 h8 M63 23 l3 3 l-3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // CABLE FLYE: person standing, arms sweeping in from high to low
  cable_flye: [
    // Cable towers (two vertical lines on sides)
    svgEl('line', { x1: 8, y1: 4, x2: 8, y2: 46, stroke: 'currentColor', 'stroke-width': 2.5, opacity: 0.5 }),
    svgEl('line', { x1: 72, y1: 4, x2: 72, y2: 46, stroke: 'currentColor', 'stroke-width': 2.5, opacity: 0.5 }),
    // Pulleys (high)
    svgEl('circle', { cx: 8, cy: 10, r: 2, fill: 'currentColor', opacity: 0.7 }),
    svgEl('circle', { cx: 72, cy: 10, r: 2, fill: 'currentColor', opacity: 0.7 }),
    // Cables (diagonal to hands)
    svgEl('line', { x1: 8, y1: 10, x2: 32, y2: 30, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.5 }),
    svgEl('line', { x1: 72, y1: 10, x2: 48, y2: 30, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.5 }),
    // Head
    svgEl('circle', { cx: 40, cy: 14, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 19, x2: 40, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Legs
    svgEl('line', { x1: 40, y1: 36, x2: 34, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 40, y1: 36, x2: 46, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Arms sweeping in (meeting at chest)
    svgEl('line', { x1: 40, y1: 22, x2: 32, y2: 30, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 40, y1: 22, x2: 48, y2: 30, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Inward arrow
    svgEl('path', { d: 'M22 38 l6 0 M27 36 l1 2 l-1 2', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // ROPE TRICEP EXTENSION: overhead rope pushdown
  rope_tricep: [
    // Cable tower top
    svgEl('line', { x1: 30, y1: 4, x2: 50, y2: 4, stroke: 'currentColor', 'stroke-width': 2.5, opacity: 0.5 }),
    // Rope hanging down
    svgEl('line', { x1: 40, y1: 4, x2: 40, y2: 20, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.5 }),
    // Head
    svgEl('circle', { cx: 40, cy: 14, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 19, x2: 40, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Legs
    svgEl('line', { x1: 40, y1: 36, x2: 34, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 40, y1: 36, x2: 46, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Arms overhead then bent (triceps extension)
    svgEl('line', { x1: 40, y1: 19, x2: 32, y2: 14, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 40, y1: 19, x2: 48, y2: 14, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 32, y1: 14, x2: 36, y2: 28, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 48, y1: 14, x2: 44, y2: 28, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Rope ends
    svgEl('circle', { cx: 36, cy: 28, r: 2, fill: 'currentColor', opacity: 0.8 }),
    svgEl('circle', { cx: 44, cy: 28, r: 2, fill: 'currentColor', opacity: 0.8 }),
    // Down arrow
    svgEl('path', { d: 'M60 24 v8 M57 29 l3 3 l3 -3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // CHEST-SUPPORTED ROW: lying prone on incline, pulling
  chest_row: [
    // Incline bench
    svgEl('line', { x1: 16, y1: 38, x2: 50, y2: 22, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    svgEl('line', { x1: 16, y1: 38, x2: 16, y2: 47, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    svgEl('line', { x1: 50, y1: 22, x2: 55, y2: 47, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    // Ground
    svgEl('line', { x1: 5, y1: 48, x2: 75, y2: 48, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Head (at top, prone)
    svgEl('circle', { cx: 50, cy: 18, r: 4, fill: 'currentColor', opacity: 0.95 }),
    // Torso along incline
    svgEl('line', { x1: 49, y1: 22, x2: 22, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Arms pulling back (rowing)
    svgEl('line', { x1: 35, y1: 28, x2: 24, y2: 22, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 40, y1: 30, x2: 30, y2: 26, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Dumbbell/handle
    svgEl('rect', { x: 20, y: 19, width: 6, height: 5, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    // Pull arrow
    svgEl('path', { d: 'M60 28 h-8 M55 25 l-3 3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // LAT PULLDOWN: seated, pulling bar down to chest
  lat_pulldown: [
    // Cable tower top
    svgEl('line', { x1: 20, y1: 4, x2: 60, y2: 4, stroke: 'currentColor', 'stroke-width': 2.5, opacity: 0.5 }),
    // Cable
    svgEl('line', { x1: 40, y1: 4, x2: 40, y2: 18, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.5 }),
    // Bar at chest level (pulled down)
    svgEl('line', { x1: 24, y1: 18, x2: 56, y2: 18, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.95 }),
    // Head
    svgEl('circle', { cx: 40, cy: 14, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 19, x2: 40, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Seat
    svgEl('line', { x1: 30, y1: 38, x2: 50, y2: 38, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Legs (thighs horizontal, calves down — seated position)
    svgEl('line', { x1: 40, y1: 36, x2: 56, y2: 38, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 56, y1: 38, x2: 56, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Arms pulling bar down
    svgEl('line', { x1: 40, y1: 19, x2: 28, y2: 18, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 40, y1: 19, x2: 52, y2: 18, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Down arrow
    svgEl('path', { d: 'M68 22 v8 M65 27 l3 3 l3 -3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // CABLE ROW: seated, pulling handle
  cable_row: [
    // Floor/seat
    svgEl('line', { x1: 5, y1: 48, x2: 75, y2: 48, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Seat
    svgEl('line', { x1: 14, y1: 38, x2: 32, y2: 38, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Feet platform
    svgEl('line', { x1: 56, y1: 38, x2: 56, y2: 30, stroke: 'currentColor', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Head
    svgEl('circle', { cx: 20, cy: 16, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso (slight forward lean)
    svgEl('line', { x1: 22, y1: 20, x2: 28, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Legs (extended to platform)
    svgEl('line', { x1: 28, y1: 36, x2: 54, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Arms pulling handle
    svgEl('line', { x1: 26, y1: 26, x2: 44, y2: 30, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 26, y1: 30, x2: 44, y2: 34, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Handle
    svgEl('rect', { x: 44, y: 28, width: 4, height: 8, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    // Cable to platform
    svgEl('line', { x1: 48, y1: 32, x2: 56, y2: 34, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.5 }),
    // Pull arrow
    svgEl('path', { d: 'M62 26 h-8 M57 23 l-3 3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // REAR DELT FLYE: standing, arms back spreading
  rear_delt_flye: [
    // Head
    svgEl('circle', { cx: 40, cy: 12, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 17, x2: 40, y2: 34, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Legs
    svgEl('line', { x1: 40, y1: 34, x2: 34, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 40, y1: 34, x2: 46, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Arms back (extending behind, angled)
    svgEl('line', { x1: 40, y1: 20, x2: 22, y2: 26, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 40, y1: 20, x2: 58, y2: 26, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Dumbbells
    svgEl('rect', { x: 17, y: 23, width: 6, height: 7, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    svgEl('rect', { x: 57, y: 23, width: 6, height: 7, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    // Back arrows
    svgEl('path', { d: 'M14 38 h-6 M11 35 l-3 3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
    svgEl('path', { d: 'M66 38 h6 M69 35 l3 3 l-3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // HAMMER CURL: arm with neutral-grip dumbbell
  hammer_curl: [
    // Shoulder/torso
    svgEl('line', { x1: 15, y1: 15, x2: 15, y2: 40, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.6 }),
    // Upper arm
    svgEl('line', { x1: 15, y1: 18, x2: 15, y2: 32, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Forearm (curled up, neutral grip — vertical dumbbell)
    svgEl('line', { x1: 15, y1: 32, x2: 32, y2: 22, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Dumbbell (vertical, hammer grip)
    svgEl('rect', { x: 30, y: 14, width: 5, height: 12, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    // Bicep bulge
    svgEl('circle', { cx: 20, cy: 28, r: 5, fill: 'currentColor', opacity: 0.3 }),
    // Curl arrow
    svgEl('path', { d: 'M44 35 Q34 40 24 35', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.3 }),
    svgEl('path', { d: 'M26 34 l-2 1 l1 2', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.3 }),
  ],

  // HIGH CABLE CURL: standing, curling from high cable
  high_cable_curl: [
    // Cable tower top
    svgEl('line', { x1: 28, y1: 4, x2: 52, y2: 4, stroke: 'currentColor', 'stroke-width': 2.5, opacity: 0.5 }),
    // Two cables from sides
    svgEl('line', { x1: 28, y1: 4, x2: 24, y2: 22, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.5 }),
    svgEl('line', { x1: 52, y1: 4, x2: 56, y2: 22, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.5 }),
    // Head
    svgEl('circle', { cx: 40, cy: 14, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 19, x2: 40, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Legs
    svgEl('line', { x1: 40, y1: 36, x2: 34, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 40, y1: 36, x2: 46, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Arms curled (forearms up)
    svgEl('line', { x1: 40, y1: 22, x2: 24, y2: 22, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 40, y1: 22, x2: 56, y2: 22, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Handles
    svgEl('rect', { x: 21, y: 19, width: 5, height: 7, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    svgEl('rect', { x: 54, y: 19, width: 5, height: 7, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    // Curl arrows
    svgEl('path', { d: 'M22 36 v-8 M19 31 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // QUAD EXTENSION: seated on machine, extending legs
  quad_ext: [
    // Seat
    svgEl('line', { x1: 14, y1: 28, x2: 30, y2: 28, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    svgEl('line', { x1: 14, y1: 12, x2: 14, y2: 28, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Head
    svgEl('circle', { cx: 18, cy: 14, r: 4, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 19, y1: 18, x2: 22, y2: 27, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Thighs (horizontal)
    svgEl('line', { x1: 22, y1: 27, x2: 44, y2: 27, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Calves (extended forward)
    svgEl('line', { x1: 44, y1: 27, x2: 64, y2: 27, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Pad under ankle
    svgEl('line', { x1: 62, y1: 24, x2: 68, y2: 24, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Ground
    svgEl('line', { x1: 5, y1: 47, x2: 75, y2: 47, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Up/forward arrow
    svgEl('path', { d: 'M58 38 h8 M63 35 l3 3 l-3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // HACK SQUAT: person on hack squat machine, shoulders under pads
  hack_squat: [
    // Machine frame (angled)
    svgEl('line', { x1: 20, y1: 6, x2: 60, y2: 46, stroke: 'currentColor', 'stroke-width': 2.5, opacity: 0.4 }),
    // Shoulder pads (top)
    svgEl('line', { x1: 16, y1: 8, x2: 28, y2: 8, stroke: 'currentColor', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Head
    svgEl('circle', { cx: 38, cy: 14, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso (leaning back on sled)
    svgEl('line', { x1: 38, y1: 19, x2: 42, y2: 32, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Thighs (bent)
    svgEl('line', { x1: 42, y1: 32, x2: 32, y2: 38, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Calves
    svgEl('line', { x1: 32, y1: 38, x2: 32, y2: 46, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Feet
    svgEl('line', { x1: 30, y1: 46, x2: 38, y2: 46, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Ground
    svgEl('line', { x1: 5, y1: 47, x2: 75, y2: 47, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Down arrow
    svgEl('path', { d: 'M58 22 v8 M55 27 l3 3 l3 -3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // RDL: barbell Romanian deadlift — hips back, bar to mid-thigh
  rdl: [
    // Ground
    svgEl('line', { x1: 5, y1: 47, x2: 75, y2: 47, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Head
    svgEl('circle', { cx: 56, cy: 14, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso (hinged forward ~45°)
    svgEl('line', { x1: 54, y1: 18, x2: 40, y2: 32, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Hips
    svgEl('circle', { cx: 40, cy: 32, r: 3, fill: 'currentColor', opacity: 0.8 }),
    // Legs (slight bend)
    svgEl('line', { x1: 40, y1: 32, x2: 38, y2: 46, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Arms hanging straight down with bar
    svgEl('line', { x1: 46, y1: 24, x2: 46, y2: 42, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Barbell at mid-thigh
    svgEl('line', { x1: 38, y1: 40, x2: 54, y2: 40, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.95 }),
    svgEl('circle', { cx: 38, cy: 40, r: 3, fill: 'currentColor', opacity: 0.8 }),
    svgEl('circle', { cx: 54, cy: 40, r: 3, fill: 'currentColor', opacity: 0.8 }),
    // Hinge arrow (hips back)
    svgEl('path', { d: 'M22 30 h-8 M17 27 l-3 3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // HAMSTRING CURL: seated or lying, legs curling back
  hamstring_curl: [
    // Seat (lying prone bench)
    svgEl('line', { x1: 10, y1: 24, x2: 50, y2: 24, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Head (prone)
    svgEl('circle', { cx: 14, cy: 22, r: 4, fill: 'currentColor', opacity: 0.95 }),
    // Torso on bench
    svgEl('line', { x1: 18, y1: 24, x2: 44, y2: 24, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Thighs (horizontal off bench)
    svgEl('line', { x1: 44, y1: 24, x2: 58, y2: 28, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Calves (curled back up)
    svgEl('line', { x1: 58, y1: 28, x2: 56, y2: 14, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Pad
    svgEl('circle', { cx: 56, cy: 14, r: 2, fill: 'currentColor', opacity: 0.8 }),
    // Ground
    svgEl('line', { x1: 5, y1: 47, x2: 75, y2: 47, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Curl arrow
    svgEl('path', { d: 'M64 30 v-8 M61 25 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // CALF RAISE: person on toes, heels up
  calf_raise: [
    // Ground
    svgEl('line', { x1: 5, y1: 47, x2: 75, y2: 47, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Head
    svgEl('circle', { cx: 40, cy: 8, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 13, x2: 40, y2: 32, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Legs (straight)
    svgEl('line', { x1: 40, y1: 32, x2: 40, y2: 42, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Feet (on toes, heels raised)
    svgEl('line', { x1: 40, y1: 42, x2: 48, y2: 46, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Arms (holding weight at sides)
    svgEl('line', { x1: 40, y1: 18, x2: 32, y2: 32, stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.5 }),
    svgEl('line', { x1: 40, y1: 18, x2: 48, y2: 32, stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.5 }),
    // Dumbbells
    svgEl('rect', { x: 29, y: 30, width: 5, height: 6, rx: 1, fill: 'currentColor', opacity: 0.9 }),
    svgEl('rect', { x: 46, y: 30, width: 5, height: 6, rx: 1, fill: 'currentColor', opacity: 0.9 }),
    // Up arrow (heels rising)
    svgEl('path', { d: 'M58 40 v-8 M55 35 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // FACE PULL: rope to face, pulling apart
  face_pull: [
    // Cable tower (high)
    svgEl('line', { x1: 30, y1: 4, x2: 50, y2: 4, stroke: 'currentColor', 'stroke-width': 2.5, opacity: 0.5 }),
    // Cable
    svgEl('line', { x1: 40, y1: 4, x2: 40, y2: 16, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.5 }),
    // Head
    svgEl('circle', { cx: 40, cy: 18, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 23, x2: 40, y2: 38, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Legs
    svgEl('line', { x1: 40, y1: 38, x2: 34, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 40, y1: 38, x2: 46, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Arms pulling rope to face, spreading out
    svgEl('line', { x1: 40, y1: 20, x2: 24, y2: 18, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 40, y1: 20, x2: 56, y2: 18, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Rope ends
    svgEl('circle', { cx: 24, cy: 18, r: 2, fill: 'currentColor', opacity: 0.8 }),
    svgEl('circle', { cx: 56, cy: 18, r: 2, fill: 'currentColor', opacity: 0.8 }),
    // Outward arrows
    svgEl('path', { d: 'M18 26 h-6 M15 23 l-3 3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // EZ BAR TRICEP EXTENSION: lying or seated, EZ bar overhead
  ez_tricep: [
    // Head
    svgEl('circle', { cx: 40, cy: 14, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso
    svgEl('line', { x1: 40, y1: 19, x2: 40, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Legs
    svgEl('line', { x1: 40, y1: 36, x2: 34, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    svgEl('line', { x1: 40, y1: 36, x2: 46, y2: 47, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Arms overhead
    svgEl('line', { x1: 40, y1: 19, x2: 32, y2: 8, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 40, y1: 19, x2: 48, y2: 8, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // EZ bar (curved)
    svgEl('path', { d: 'M22 8 Q40 4 58 8', stroke: 'currentColor', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', opacity: 0.95 }),
    // Plates
    svgEl('circle', { cx: 22, cy: 8, r: 4, fill: 'currentColor', opacity: 0.7 }),
    svgEl('circle', { cx: 58, cy: 8, r: 4, fill: 'currentColor', opacity: 0.7 }),
    // Down arrow (lowering behind head)
    svgEl('path', { d: 'M68 22 v8 M65 27 l3 3 l3 -3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // INCLINE DB CURL: lying back on incline, arms hanging
  incline_curl: [
    // Incline bench (reversed — head low)
    svgEl('line', { x1: 18, y1: 22, x2: 50, y2: 38, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    svgEl('line', { x1: 18, y1: 22, x2: 18, y2: 47, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    svgEl('line', { x1: 50, y1: 38, x2: 55, y2: 47, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    // Ground
    svgEl('line', { x1: 5, y1: 48, x2: 75, y2: 48, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Head (low end)
    svgEl('circle', { cx: 20, cy: 18, r: 4, fill: 'currentColor', opacity: 0.95 }),
    // Torso along incline
    svgEl('line', { x1: 22, y1: 22, x2: 48, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Arms hanging down (full stretch)
    svgEl('line', { x1: 30, y1: 26, x2: 26, y2: 42, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 38, y1: 30, x2: 34, y2: 44, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Dumbbells
    svgEl('rect', { x: 23, y: 41, width: 5, height: 7, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    svgEl('rect', { x: 31, y: 43, width: 5, height: 7, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    // Curl arrow
    svgEl('path', { d: 'M58 38 Q50 44 42 38', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.3 }),
  ],

  // SKULL CRUSHER: lying on bench, EZ bar over forehead
  skull_crusher: [
    // Bench
    svgEl('line', { x1: 14, y1: 36, x2: 60, y2: 36, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }),
    svgEl('line', { x1: 18, y1: 36, x2: 18, y2: 47, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    svgEl('line', { x1: 56, y1: 36, x2: 56, y2: 47, stroke: 'currentColor', 'stroke-width': 2, opacity: 0.4 }),
    // Ground
    svgEl('line', { x1: 5, y1: 48, x2: 75, y2: 48, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Head on bench
    svgEl('circle', { cx: 22, cy: 33, r: 4, fill: 'currentColor', opacity: 0.95 }),
    // Body on bench
    svgEl('line', { x1: 26, y1: 34, x2: 52, y2: 34, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    // Arms up holding bar over forehead
    svgEl('line', { x1: 26, y1: 32, x2: 26, y2: 18, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    svgEl('line', { x1: 32, y1: 32, x2: 32, y2: 18, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // EZ bar at forehead level
    svgEl('line', { x1: 18, y1: 18, x2: 40, y2: 18, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.95 }),
    svgEl('circle', { cx: 18, cy: 18, r: 3, fill: 'currentColor', opacity: 0.7 }),
    svgEl('circle', { cx: 40, cy: 18, r: 3, fill: 'currentColor', opacity: 0.7 }),
    // Down arrow (lowering to forehead)
    svgEl('path', { d: 'M52 22 v8 M49 27 l3 3 l3 -3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],

  // DB ROW: bent over single arm row
  db_row: [
    // Ground
    svgEl('line', { x1: 5, y1: 47, x2: 75, y2: 47, stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.2 }),
    // Head
    svgEl('circle', { cx: 50, cy: 12, r: 5, fill: 'currentColor', opacity: 0.95 }),
    // Torso (hinged forward ~horizontal)
    svgEl('line', { x1: 48, y1: 16, x2: 30, y2: 30, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }),
    // Legs (split stance)
    svgEl('line', { x1: 30, y1: 30, x2: 22, y2: 46, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    svgEl('line', { x1: 30, y1: 30, x2: 40, y2: 46, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.7 }),
    // Supporting arm (on knee/bench)
    svgEl('line', { x1: 32, y1: 22, x2: 22, y2: 32, stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.6 }),
    // Rowing arm (pulling dumbbell up)
    svgEl('line', { x1: 44, y1: 22, x2: 52, y2: 14, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.95 }),
    // Dumbbell
    svgEl('rect', { x: 50, y: 10, width: 6, height: 8, rx: 1, fill: 'currentColor', opacity: 0.95 }),
    // Up arrow
    svgEl('path', { d: 'M62 24 v-8 M59 19 l3 -3 l3 3', stroke: 'currentColor', 'stroke-width': 1.5, fill: 'none', opacity: 0.35 }),
  ],
};

// ---- Render exercise visual ----
export function exerciseVisual(visualKey, size = 48, color = 'var(--c-accent-text)') {
  const elements = (VISUALS[visualKey] || VISUALS.pushup).map(n => n.cloneNode(true));
  return svg({ viewBox: '0 0 80 50', width: size, height: size * 0.625, style: { color } }, elements);
}

// ---- Get today's training log ----
export function getTodayLog(state, dateKey) {
  if (!state.trainingLog) state.trainingLog = {};
  if (!state.trainingLog[dateKey]) {
    state.trainingLog[dateKey] = { exercises: [], completed: false, startTime: null };
  }
  return state.trainingLog[dateKey];
}

// ---- Smart suggestion: which exercise to do next ----
function suggestNextExercise(log) {
  const doneMuscles = new Set(log.exercises.filter(e => e.completed).map(e => EXERCISES[e.id]?.muscle).filter(Boolean));
  // Find an exercise targeting a muscle group not yet worked
  const candidates = Object.entries(EXERCISES).filter(([id, ex]) => !doneMuscles.has(ex.muscle));
  if (candidates.length === 0) return null;
  // Prefer compound movements (Chest, Back, Legs) first
  const priority = ['Chest', 'Back', 'Legs', 'Posterior Chain', 'Shoulders', 'Core', 'Triceps', 'Arms'];
  for (const muscle of priority) {
    const found = candidates.find(([_, ex]) => ex.muscle === muscle);
    if (found) return { id: found[0], ...found[1] };
  }
  return { id: candidates[0][0], ...candidates[0][1] };
}

// ---- Main training log section for Today ----
export function trainingLogSection(s, t) {
  const log = getTodayLog(s, t);
  const completedExercises = log.exercises.filter(e => e.completed);
  const totalSets = completedExercises.reduce((sum, e) => sum + (e.sets?.length || 0), 0);
  const totalReps = completedExercises.reduce((sum, e) =>
    sum + (e.sets?.reduce((ss, set) => ss + (set.reps || 0), 0) || 0), 0);
  const suggestion = suggestNextExercise(log);

  return el('div', { class: 'card', style: { marginTop: 'var(--sp-4)' } }, [
    el('div', { class: 'card-head' }, [
      el('div', { class: 'card-icon', style: { background: 'var(--c-foundation-soft)', color: 'var(--c-foundation)' } }, ['🏋️']),
      el('div', {}, [
        el('div', { class: 'card-title' }, ['Training Log']),
        el('div', { class: 'card-subtitle' }, [
          completedExercises.length > 0
            ? `${completedExercises.length} exercises · ${totalSets} sets · ${totalReps} reps`
            : 'Start your workout',
        ]),
      ]),
      el('button', {
        class: 'btn btn--ghost btn--sm',
        on: { click: () => openTrainingSheet(t) }
      }, ['+ Add']),
    ]),

    // Completed exercises with visuals
    completedExercises.length > 0 && el('div', { class: 'list', style: { marginTop: 'var(--sp-2)' } },
      completedExercises.map(ex => {
        const def = EXERCISES[ex.id];
        if (!def) return null;
        const muscleColor = MUSCLE_COLORS[def.muscle] || 'var(--c-accent-text)';
        return el('div', { class: 'list-item', style: { alignItems: 'flex-start' } }, [
          // Visual
          el('div', { style: { flexShrink: 0, marginRight: 'var(--sp-3)' } }, [
            exerciseVisual(def.visual, 56, muscleColor),
          ]),
          el('div', { class: 'list-item-body', style: { flex: 1 } }, [
            el('div', { class: 'list-item-title' }, [def.name]),
            el('div', { class: 'list-item-sub' }, [
              el('span', { style: { color: muscleColor } }, [def.muscle]),
              ` · ${ex.sets?.length || 0} sets`,
            ]),
            // Set badges
            ex.sets && ex.sets.length > 0 && el('div', { class: 'flex gap-1', style: { marginTop: 'var(--sp-1)', flexWrap: 'wrap', gap: 'var(--sp-1)' } },
              ex.sets.map((set, i) =>
                el('span', {
                  class: 'chip chip--healthy',
                  style: { fontSize: '10px', height: '18px', padding: '0 6px' }
                }, [`S${i + 1}: ${set.reps}${def.isTimed ? 's' : ''}`])
              )
            ),
          ]),
          el('span', { class: 'chip chip--healthy' }, ['✓']),
        ]);
      }).filter(Boolean)
    ),

    // Smart suggestion
    suggestion && completedExercises.length > 0 && el('div', {
      style: {
        marginTop: 'var(--sp-3)',
        padding: 'var(--sp-3)',
        background: 'var(--c-foundation-soft)',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--c-foundation-border)',
      }
    }, [
      el('div', { class: 'flex items-center gap-2' }, [
        el('span', { style: { fontSize: 'var(--fs-meta)' } }, ['💡']),
        el('div', { style: { flex: 1, fontSize: 'var(--fs-sub)' } }, [
          'Next: ',
          el('span', { style: { fontWeight: 'var(--fw-semibold)' } }, [suggestion.name]),
          ` (${suggestion.muscle})`,
        ]),
        el('button', {
          class: 'btn btn--ghost btn--sm',
          on: { click: () => openExerciseSheet(suggestion.id, t) }
        }, ['Add']),
      ]),
    ]),

    // Empty state
    completedExercises.length === 0 && el('div', { class: 'empty', style: { padding: 'var(--sp-4)' } }, [
      el('div', { style: { fontSize: '32px', marginBottom: 'var(--sp-2)' } }, ['🏋️']),
      el('div', { class: 'empty-title' }, ['No workout logged today']),
      el('div', { class: 'empty-body', style: { marginTop: 'var(--sp-1)' } }, [
        'Tap + Add to start tracking sets, reps, and rest timers.',
      ]),
      suggestion && el('button', {
        class: 'btn btn--primary btn--sm',
        style: { marginTop: 'var(--sp-3)' },
        on: { click: () => openExerciseSheet(suggestion.id, t) }
      }, [`Start with ${suggestion.name}`]),
    ]),

    // Check-in button
    el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-3)' } }, [
      el('button', {
        class: `btn ${log.completed ? 'btn--ghost' : 'btn--primary'} btn--sm btn--block`,
        on: { click: () => {
          update(st => {
            const l = getTodayLog(st, t);
            l.completed = !l.completed;
            if (l.completed) {
              l.endTime = Date.now();
              toast('Workout complete! 💪', { icon: '🏋️' });
            }
          });
        } }
      }, [log.completed ? '✓ Workout done' : 'Mark workout complete']),
    ]),
  ]);
}

// ---- Training sheet (exercise picker) ----
function openTrainingSheet(dateKey) {
  const muscleGroups = [...new Set(Object.values(EXERCISES).map(e => e.muscle))];
  const body = el('div', {}, [
    el('div', { class: 'text-mute text-meta', style: { marginBottom: 'var(--sp-3)' } }, ['Pick an exercise']),
    ...muscleGroups.map(muscle => {
      const exercises = Object.entries(EXERCISES).filter(([_, ex]) => ex.muscle === muscle);
      const color = MUSCLE_COLORS[muscle] || 'var(--c-accent-text)';
      return el('div', { style: { marginBottom: 'var(--sp-4)' } }, [
        el('div', {
          class: 'overline',
          style: { color, marginBottom: 'var(--sp-2)' }
        }, [muscle]),
        el('div', { class: 'list' }, exercises.map(([id, ex]) =>
          el('div', {
            class: 'list-item',
            on: { click: () => { closeAll(); setTimeout(() => openExerciseSheet(id, dateKey), 300); } }
          }, [
            el('div', { style: { flexShrink: 0, marginRight: 'var(--sp-3)' } }, [
              exerciseVisual(ex.visual, 48, color),
            ]),
            el('div', { class: 'list-item-body' }, [
              el('div', { class: 'list-item-title' }, [ex.name]),
              el('div', { class: 'list-item-sub' }, [`${ex.sets} × ${ex.reps}${ex.isTimed ? 's' : ''}`]),
            ]),
            el('span', { class: 'text-mute' }, ['›']),
          ])
        )),
      ]);
    }),
  ]);
  sheet({ title: 'Add Exercise', body });
}

// ---- Exercise sheet (log sets + rest timer) ----
let restTimerInterval = null;

function openExerciseSheet(exerciseId, dateKey) {
  const def = EXERCISES[exerciseId];
  if (!def) return;
  const s = getState();
  const log = getTodayLog(s, dateKey);
  let exercise = log.exercises.find(e => e.id === exerciseId);
  if (!exercise) {
    exercise = { id: exerciseId, sets: [], completed: false };
  }

  const muscleColor = MUSCLE_COLORS[def.muscle] || 'var(--c-accent-text)';

  function renderSheet() {
    const body = el('div', {}, [
      // Visual + name
      el('div', { class: 'flex items-center gap-3', style: { marginBottom: 'var(--sp-4)' } }, [
        el('div', { style: { flexShrink: 0 } }, [exerciseVisual(def.visual, 80, muscleColor)]),
        el('div', {}, [
          el('div', { style: { fontSize: 'var(--fs-section)', fontWeight: 'var(--fw-bold)' } }, [def.name]),
          el('div', { style: { color: muscleColor, fontSize: 'var(--fs-sub)' } }, [def.muscle]),
          el('div', { class: 'text-mute text-meta' }, [`Target: ${def.sets} × ${def.reps}${def.isTimed ? 's' : ''}`]),
        ]),
      ]),

      // Sets log
      el('div', { class: 'section-head', style: { marginTop: 'var(--sp-2)' } }, [
        el('div', { class: 'section-title' }, [`Sets (${exercise.sets.length})`]),
      ]),
      exercise.sets.length > 0 && el('div', { class: 'list' }, exercise.sets.map((set, i) =>
        el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item-body' }, [
            el('div', { class: 'list-item-title' }, [`Set ${i + 1}: ${set.reps}${def.isTimed ? 's' : ''} reps`]),
            el('div', { class: 'list-item-sub' }, [set.weight ? `${set.weight} kg` : 'Bodyweight']),
          ]),
          el('button', {
            class: 'btn btn--ghost btn--sm',
            on: { click: () => { exercise.sets.splice(i, 1); renderSheet(); } }
          }, ['×']),
        ])
      )),

      // Add set button
      el('button', {
        class: 'btn btn--primary btn--block',
        style: { marginTop: 'var(--sp-3)' },
        on: { click: () => {
          const lastSet = exercise.sets[exercise.sets.length - 1];
          const reps = lastSet ? lastSet.reps : def.reps;
          const weight = lastSet ? lastSet.weight : null;
          exercise.sets.push({ reps, weight });
          // Save to state
          update(st => {
            const l = getTodayLog(st, dateKey);
            let ex = l.exercises.find(e => e.id === exerciseId);
            if (!ex) { ex = { id: exerciseId, sets: [], completed: false }; l.exercises.push(ex); }
            ex.sets = exercise.sets;
            if (!l.startTime) l.startTime = Date.now();
          });
          renderSheet();
          // Start rest timer
          startRestTimer(120, muscleColor);
        } }
      }, [`+ Log Set (${exercise.sets.length + 1})`]),

      // Custom reps input
      el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-3)' } }, [
        el('input', {
          type: 'number',
          placeholder: 'Custom reps',
          style: {
            flex: 1, background: 'var(--c-bg-elev-2)', border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)', padding: 'var(--sp-2) var(--sp-3)', color: 'var(--c-text)',
            fontSize: 'var(--fs-body)',
          },
          id: 'custom-reps-input',
        }),
        el('input', {
          type: 'number',
          placeholder: 'kg (optional)',
          style: {
            flex: 1, background: 'var(--c-bg-elev-2)', border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)', padding: 'var(--sp-2) var(--sp-3)', color: 'var(--c-text)',
            fontSize: 'var(--fs-body)',
          },
          id: 'custom-weight-input',
        }),
        el('button', {
          class: 'btn btn--ghost btn--sm',
          on: { click: () => {
            const repsInput = document.getElementById('custom-reps-input');
            const weightInput = document.getElementById('custom-weight-input');
            const reps = parseInt(repsInput?.value, 10);
            const weight = weightInput?.value ? parseFloat(weightInput.value) : null;
            if (!reps || reps <= 0) { toast('Enter reps first'); return; }
            exercise.sets.push({ reps, weight });
            update(st => {
              const l = getTodayLog(st, dateKey);
              let ex = l.exercises.find(e => e.id === exerciseId);
              if (!ex) { ex = { id: exerciseId, sets: [], completed: false }; l.exercises.push(ex); }
              ex.sets = exercise.sets;
              if (!l.startTime) l.startTime = Date.now();
            });
            if (repsInput) repsInput.value = '';
            if (weightInput) weightInput.value = '';
            renderSheet();
            startRestTimer(120, muscleColor);
          } }
        }, ['Log']),
      ]),

      // Mark exercise complete
      exercise.sets.length > 0 && el('button', {
        class: 'btn btn--ghost btn--block',
        style: { marginTop: 'var(--sp-3)' },
        on: { click: () => {
          exercise.completed = true;
          update(st => {
            const l = getTodayLog(st, dateKey);
            let ex = l.exercises.find(e => e.id === exerciseId);
            if (!ex) { ex = { id: exerciseId, sets: [], completed: false }; l.exercises.push(ex); }
            ex.sets = exercise.sets;
            ex.completed = true;
          });
          closeAll();
          toast(`${def.name} complete! ✓`, { icon: '🏋️' });
        } }
      }, ['✓ Exercise done']),
    ]);
    sheet({ title: def.name, body });
  }

  renderSheet();
}

// ---- Rest timer (2 minutes with visual countdown) ----
function startRestTimer(seconds, color) {
  if (restTimerInterval) clearInterval(restTimerInterval);
  let remaining = seconds;

  const timerBody = el('div', { style: { textAlign: 'center', padding: 'var(--sp-4)' } }, [
    // Circular countdown
    svg({ viewBox: '0 0 120 120', width: 120, height: 120, style: { margin: '0 auto' } }, [
      svgEl('circle', { cx: 60, cy: 60, r: 54, fill: 'none', stroke: 'var(--c-bg-elev-3)', 'stroke-width': 8 }),
      svgEl('circle', {
        id: 'rest-timer-ring',
        cx: 60, cy: 60, r: 54, fill: 'none',
        stroke: color || 'var(--c-foundation)',
        'stroke-width': 8,
        'stroke-linecap': 'round',
        'stroke-dasharray': 2 * Math.PI * 54,
        'stroke-dashoffset': 0,
        transform: 'rotate(-90 60 60)',
        style: { transition: 'stroke-dashoffset 1s linear' },
      }),
    ]),
    el('div', {
      id: 'rest-timer-text',
      style: {
        fontSize: 'var(--fs-display)', fontWeight: 'var(--fw-bold)',
        fontVariantNumeric: 'tabular-nums', marginTop: 'var(--sp-3)',
        color: color || 'var(--c-foundation)',
      }
    }, [formatTime(remaining)]),
    el('div', { class: 'text-mute text-meta', style: { marginTop: 'var(--sp-1)' } }, ['Rest time']),
    el('div', { class: 'flex gap-2', style: { marginTop: 'var(--sp-4)' } }, [
      el('button', {
        class: 'btn btn--ghost btn--sm',
        on: { click: () => { remaining = Math.max(0, remaining - 15); updateTimerDisplay(); } }
      }, ['-15s']),
      el('button', {
        class: 'btn btn--ghost btn--sm',
        on: { click: () => { remaining += 15; updateTimerDisplay(); } }
      }, ['+15s']),
      el('button', {
        class: 'btn btn--primary btn--sm',
        on: { click: () => { clearInterval(restTimerInterval); restTimerInterval = null; closeAll(); } }
      }, ['Skip']),
    ]),
  ]);

  sheet({ title: 'Rest', body });

  function updateTimerDisplay() {
    const text = document.getElementById('rest-timer-text');
    const ring = document.getElementById('rest-timer-ring');
    if (text) text.textContent = formatTime(remaining);
    if (ring) {
      const progress = remaining / seconds;
      const circumference = 2 * Math.PI * 54;
      ring.style.strokeDashoffset = circumference * (1 - progress);
    }
  }

  restTimerInterval = setInterval(() => {
    remaining--;
    updateTimerDisplay();
    if (remaining <= 0) {
      clearInterval(restTimerInterval);
      restTimerInterval = null;
      // Audio cue
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch {}
      // Vibrate
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      closeAll();
      toast('Rest over! Next set 🔥', { icon: '⏱️' });
    }
  }, 1000);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ---- Get training stats for analytics ----
export function trainingStats(state, days = 30) {
  let totalWorkouts = 0;
  let totalSets = 0;
  let totalReps = 0;
  let totalMinutes = 0;
  const muscleGroups = {};

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const log = state.trainingLog?.[key];
    if (log && log.exercises.length > 0) {
      if (log.completed) totalWorkouts++;
      for (const ex of log.exercises) {
        const def = EXERCISES[ex.id];
        if (!def) continue;
        totalSets += ex.sets?.length || 0;
        totalReps += ex.sets?.reduce((s, set) => s + (set.reps || 0), 0) || 0;
        muscleGroups[def.muscle] = (muscleGroups[def.muscle] || 0) + (ex.sets?.length || 0);
      }
      if (log.startTime && log.endTime) {
        totalMinutes += Math.round((log.endTime - log.startTime) / 60000);
      }
    }
  }

  return { totalWorkouts, totalSets, totalReps, totalMinutes, muscleGroups };
}
