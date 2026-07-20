Subagent 5d5f7453 completed successfully:

Now I have a comprehensive understanding of the codebase. Let me compile the detailed audit report of all timing and cadence bugs found.

---

# TIMING & CADENCE LOGIC DEEP AUDIT REPORT

## CRITICAL BUGS

### 1. **bestStreak() - Does not check for consecutive days**
- **File**: `/Users/bega/version-2-tracker/src/app/state.js`
- **Lines**: 362-374
- **Severity**: CRITICAL
- **Bug**: The function iterates through sorted day keys and increments streak while score > 0 or shielded. However, if there are gaps in the data (missing day records), the streak incorrectly continues across the gap.
- **Example**: Days = [Jan 1 (score 4), Jan 3 (score 4)]. No Jan 2 record. `bestStreak()` counts 2, but the actual streak is 1 (broken on Jan 2).
- **Code**:
```javascript
export function bestStreak() {
  const keys = Object.keys(getState().days).sort();
  let best = 0, cur = 0;
  for (const k of keys) {
    if (dayScore(k) > 0 || getState().days[k].shielded) {
      cur++;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}
```
- **Fix**: Check that each consecutive key is exactly 1 day apart from the previous:
```javascript
export function bestStreak() {
  const keys = Object.keys(getState().days).sort();
  let best = 0, cur = 0;
  let prevKey = null;
  for (const k of keys) {
    if (prevKey && daysBetween(prevKey, k) !== 1) {
      cur = 0; // Gap detected, reset streak
    }
    if (dayScore(k) > 0 || getState().days[k].shielded) {
      cur++;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
    prevKey = k;
  }
  return best;
}
```

### 2. **checkShieldEarned() - Does not check for consecutive days**
- **File**: `/Users/bega/version-2-tracker/src/app/state.js`
- **Lines**: 314-334
- **Severity**: CRITICAL
- **Bug**: Checks last 7 day records using `keys.slice(-7)`, but if there are gaps (missing days), it can award a shield incorrectly.
- **Example**: `s.days` has [Jan 1, Jan 2, Jan 4, Jan 5, Jan 6, Jan 7, Jan 8]. `slice(-7)` = [Jan 2, Jan 4, Jan 5, Jan 6, Jan 7, Jan 8]. That's 7 records but spans 7 calendar days with a gap on Jan 3. The check passes even though Jan 3 had no activity.
- **Code**:
```javascript
export function checkShieldEarned() {
  const s = getState();
  const keys = Object.keys(s.days).sort();
  if (keys.length < 7) return false;
  const last7 = keys.slice(-7);
  const allComplete = last7.every((k) => dayScore(k) > 0 || s.days[k].shielded);
  // ...
}
```
- **Fix**: Use `lastNDays(7)` from util.js which generates consecutive day keys, and check each:
```javascript
export function checkShieldEarned() {
  const s = getState();
  const t = todayKey();
  const last7 = lastNDays(7); // Generates consecutive keys from 6 days ago to today
  const allComplete = last7.every((k) => {
    const day = s.days[k];
    return day && (dayScore(k) > 0 || day.shielded);
  });
  if (allComplete) {
    const weekKey = last7[0];
    if (!s._shieldWeeksAwarded?.includes(weekKey)) {
      setState((st) => {
        st.shields = (st.shields || 0) + 1;
        st._shieldWeeksAwarded = st._shieldWeeksAwarded || [];
        st._shieldWeeksAwarded.push(weekKey);
      });
      return true;
    }
  }
  return false;
}
```

---

## HIGH BUGS

### 3. **overdue() - Weekly actions become overdue too early**
- **File**: `/Users/bega/version-2-tracker/src/app/cadence.js`
- **Lines**: 95-110
- **Severity**: HIGH
- **Bug**: For weekly actions due Sunday, if today is Wednesday, `lastDueDate('weekly')` returns last Sunday. Since `dueKey < today` (Sunday < Wednesday), the action is marked overdue. But the user has until NEXT Sunday to complete this week's review, not last Sunday's. The logic conflates "missed last week's review" with "this week's review is overdue".
- **Code**:
```javascript
export function overdue() {
  const s = getState();
  const t = todayKey();
  const out = [];
  for (const dom of Object.values(s.domains)) {
    for (const action of dom.actions || []) {
      if (action.cadence === 'daily' || action.cadence === 'event') continue;
      if (!isCompletedThisCycle(action, t)) {
        const dueKey = lastDueDate(action.cadence, t);
        if (dueKey && dueKey < t) out.push({ domain: dom, action, dueKey });
      }
    }
  }
  return out;
}
```
- **Fix**: For weekly cadence, only mark overdue if more than 7 days have passed since the due date:
```javascript
export function overdue() {
  const s = getState();
  const t = todayKey();
  const out = [];
  for (const dom of Object.values(s.domains)) {
    for (const action of dom.actions || []) {
      if (action.cadence === 'daily' || action.cadence === 'event') continue;
      if (!isCompletedThisCycle(action, t)) {
        const dueKey = lastDueDate(action.cadence, t);
        if (dueKey && dueKey < t) {
          // For weekly, allow 7-day grace period
          const daysOverdue = daysBetween(dueKey, t);
          if (action.cadence === 'weekly' && daysOverdue < 7) continue;
          // For monthly+, allow appropriate grace period
          if (['monthly', 'quarterly', 'semiannual', 'annual'].includes(action.cadence) && daysOverdue < 14) continue;
          out.push({ domain: dom, action, dueKey });
        }
      }
    }
  }
  return out;
}
```

### 4. **Day boundary/rollover - No midnight detection**
- **File**: `/Users/bega/version-2-tracker/src/app/main.js`
- **Lines**: 37-43
- **Severity**: HIGH
- **Bug**: The app only re-renders on state changes via the subscribe mechanism. If the user keeps the app open past midnight, the "Today" tab continues showing yesterday's data until a state change triggers re-render. This can cause confusion where habits marked at 11:59 PM appear on the wrong day's view.
- **Code**:
```javascript
let raf = null;
subscribe(() => {
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => { render(); });
});
```
- **Fix**: Add a setInterval to check for day rollover every minute:
```javascript
let lastTodayKey = todayKey();
setInterval(() => {
  const current = todayKey();
  if (current !== lastTodayKey) {
    lastTodayKey = current;
    render(); // Force re-render on day change
  }
}, 60000); // Check every minute
```

---

## MEDIUM BUGS

### 5. **Perfect day detection - Counts floor as full**
- **File**: `/Users/bega/version-2-tracker/src/app/render/today.js`
- **Lines**: 90-94
- **Severity**: MEDIUM (UX issue)
- **Bug**: The condition `prog.done + prog.floor === prog.due` triggers confetti for a "perfect day" even if some habits were done as floor (0.5 points). A day with 3 full + 1 floor triggers "perfect day" but semantically is not perfect.
- **Code**:
```javascript
if (next === 'full') {
  const prog = todayProgress();
  if (prog.due > 0 && prog.done + prog.floor === prog.due) {
    confetti();
    toast('Perfect day. 🎉', { icon: '⭐' });
    // ...
  }
}
```
- **Fix**: Require all habits to be full (or rest) for perfect day:
```javascript
if (next === 'full') {
  const prog = todayProgress();
  if (prog.due > 0 && prog.done === prog.due && prog.floor === 0) {
    confetti();
    toast('Perfect day. 🎉', { icon: '⭐' });
    // ...
  }
}
```

### 6. **Annual review - No catch-up mechanism**
- **File**: `/Users/bega/version-2-tracker/src/app/cadence.js`
- **Lines**: 33
- **Severity**: MEDIUM
- **Bug**: Annual review is due `m === 11 && dt >= 25` (Dec 25-31). If the user doesn't open the app during this window, they miss the annual review entirely. There's no catch-up mechanism to show it as due in early January.
- **Code**:
```javascript
case 'annual': return m === 11 && dt >= 25;
```
- **Fix**: Extend the annual review window into early January:
```javascript
case 'annual': {
  // Dec 25-31 OR Jan 1-7 of the following year
  if (m === 11 && dt >= 25) return true;
  if (m === 0 && dt <= 7) return true;
  return false;
}
```

### 7. **Semiannual review - Inconsistent with documentation**
- **File**: `/Users/bega/version-2-tracker/src/app/cadence.js`
- **Lines**: 29-32
- **Severity**: MEDIUM
- **Bug**: The code uses `dt <= 7 && wd === 0` (first Sunday within first 7 days) for semiannual, but the comment in domains.js says "Jan/Jul" without specifying the day logic. This is inconsistent with the clear "first Sunday" pattern used for monthly/quarterly.
- **Code**:
```javascript
case 'semiannual': {
  const isStart = m === 0 || m === 6;
  return isStart && dt <= 7 && wd === 0;
}
```
- **Fix**: Add clarifying comment or align with documentation. The current logic is actually correct (first Sunday of Jan/Jul), but should be documented clearly.

### 8. **Forecast with insufficient data**
- **File**: `/Users/bega/version-2-tracker/src/app/analytics.js`
- **Lines**: 49-61
- **Severity**: MEDIUM (UX issue)
- **Bug**: If user has < 14 days of data, `lastNDays(14)` returns 14 keys but most have no day record (score 0). The average is very low, leading to very far forecast dates (e.g., "Infinity days"). This is not helpful to new users.
- **Code**:
```javascript
export function forecast() {
  const s = getState();
  const remaining = Math.max(0, 400 - s.totalPoints);
  if (remaining <= 0) return { date: null, days: 0, remaining: 0, pace: 0 };
  const keys = lastNDays(14);
  const pts = keys.map((k) => dayScore(k));
  const avg = pts.reduce((x, y) => x + y, 0) / 14;
  if (avg <= 0) return { date: null, days: Infinity, remaining, pace: 0 };
  // ...
}
```
- **Fix**: Count only days with actual data, and require minimum data:
```javascript
export function forecast() {
  const s = getState();
  const remaining = Math.max(0, 400 - s.totalPoints);
  if (remaining <= 0) return { date: null, days: 0, remaining: 0, pace: 0 };
  const keys = lastNDays(14);
  const pts = keys.map((k) => dayScore(k));
  const validDays = pts.filter(p => p > 0).length;
  if (validDays < 7) return { date: null, days: null, remaining, pace: null, insufficient: true };
  const avg = pts.reduce((x, y) => x + y, 0) / 14;
  if (avg <= 0) return { date: null, days: Infinity, remaining, pace: 0 };
  const days = Math.ceil(remaining / avg);
  const date = addDays(todayKey(), days);
  return { date, days, remaining: round(remaining, 1), pace: round(avg, 2) };
}
```

### 9. **Weekly review cycle boundary confusion**
- **File**: `/Users/bega/version-2-tracker/src/app/cadence.js`
- **Lines**: 133-143
- **Severity**: MEDIUM (UX issue)
- **Bug**: `isCompletedThisCycle()` walks from `lastDueDate()` to today. If today is Wednesday, `lastDueDate('weekly')` returns last Sunday (3 days ago). If the user did the weekly action on Saturday (4 days ago, before the cycle start), it's not counted. This is technically correct but may confuse users who think "I did my weekly review recently".
- **Code**:
```javascript
export function isCompletedThisCycle(action, key = todayKey()) {
  const s = getState();
  const dueKey = lastDueDate(action.cadence, key);
  if (!dueKey) return false;
  for (let k = dueKey; k <= key; k = addDays(k, 1)) {
    const day = s.days[k];
    if (day && day.habits && day.habits[action.id]) return true;
  }
  return false;
}
```
- **Fix**: This is technically correct behavior (each week is a separate cycle), but consider adding a grace period or clearer UI messaging to explain the cycle boundary.

---

## LOW BUGS / UX ISSUES

### 10. **Week start day hardcoded to Sunday**
- **File**: `/Users/bega/version-2-tracker/src/app/cadence.js` (line 23), `/Users/bega/version-2-tracker/src/app/util.js` (line 58)
- **Severity**: LOW (UX issue)
- **Bug**: Code uses Sunday (wd === 0) as week start throughout. This is US convention. Many countries use Monday as week start (ISO 8601). No configurability.
- **Code**:
```javascript
case 'weekly': return wd === 0; // Sunday
```
```javascript
export const startOfWeek = (key) => {
  const d = parseKey(key);
  d.setDate(d.getDate() - d.getDay()); // d.getDay() = 0 for Sunday
  return dateKey(d);
};
```
- **Fix**: Add a user setting for week start day and use it consistently:
```javascript
// In state.js settings:
weekStart: 'sunday', // 'sunday' | 'monday'

// In util.js:
export const startOfWeek = (key) => {
  const s = getState();
  const weekStart = s.settings.weekStart || 'sunday';
  const d = parseKey(key);
  const offset = weekStart === 'monday' ? (d.getDay() + 6) % 7 : d.getDay();
  d.setDate(d.getDate() - offset);
  return dateKey(d);
};
```

### 11. **Event cadence - No trigger mechanism**
- **File**: `/Users/bega/version-2-tracker/src/app/cadence.js`
- **Lines**: 34
- **Severity**: LOW (UX issue)
- **Bug**: `case 'event': return false;` means event-driven actions are never "due". But there's no documented mechanism for how users trigger event-driven actions. They appear in the UI but are never shown as due.
- **Code**:
```javascript
case 'event': return false;
```
- **Fix**: Either remove event cadence if unused, or add a manual trigger mechanism in the UI (e.g., a "Mark as done" button that appears regardless of due date).

### 12. **Insights "best day of week" uses sparse data**
- **File**: `/Users/bega/version-2-tracker/src/app/analytics.js`
- **Lines**: 100-113
- **Severity**: LOW (UX issue)
- **Bug**: Uses `Object.keys(s.days)` which only includes days with records. If user has sparse data (e.g., only recorded Mondays and Fridays for a month), the "best day" calculation is biased toward those days.
- **Code**:
```javascript
const dayScores = {};
for (const k of Object.keys(s.days)) {
  const wd = dow(k);
  dayScores[wd] = dayScores[wd] || [];
  dayScores[wd].push(dayScore(k));
}
```
- **Fix**: Use `lastNDays(30)` or similar to get a consistent time window:
```javascript
const dayScores = {};
for (const k of lastNDays(30)) {
  const wd = dow(k);
  dayScores[wd] = dayScores[wd] || [];
  dayScores[wd].push(dayScore(k));
}
```

### 13. **Perfect day confetti fires on toggle off/on**
- **File**: `/Users/bega/version-2-tracker/src/app/render/today.js`
- **Lines**: 85-103
- **Severity**: LOW (UX issue)
- **Bug**: If user toggles a habit off then on, confetti fires again. Minor annoyance.
- **Code**:
```javascript
function toggle(action, key) {
  const day = getDay(key);
  const cur = day.habits[action.id] || null;
  const next = cur === 'full' ? null : 'full';
  setDayAction(key, action.id, next);
  if (next === 'full') {
    const prog = todayProgress();
    if (prog.due > 0 && prog.done + prog.floor === prog.due) {
      confetti();
      // ...
    }
  }
}
```
- **Fix**: Track whether confetti already fired for this day:
```javascript
// In state.js, add to day record:
// confettiFired: false

// In toggle:
if (next === 'full') {
  const prog = todayProgress();
  if (prog.due > 0 && prog.done + prog.floor === prog.due && !day.confettiFired) {
    setDayField(key, 'confettiFired', true);
    confetti();
    // ...
  }
}
```

---

## EDGE CASES (NOT BUGS, BUT WORTH NOTING)

### 14. **Monthly/quarterly first Sunday logic**
- **File**: `/Users/bega/version-2-tracker/src/app/cadence.js`
- **Lines**: 24, 26-27
- **Severity**: EDGE CASE
- **Issue**: Uses `dt <= 7 && wd === 0` (first Sunday within first 7 days). This works correctly for all month start patterns, but is fragile. If the logic changes slightly, edge cases could break.
- **Status**: Current implementation is correct. No fix needed, but add unit tests for edge cases (month starts on Sunday, Monday, Tuesday, etc.).

### 15. **Time zone handling**
- **File**: `/Users/bega/version-2-tracker/src/app/util.js`
- **Lines**: 7-10, 20-24
- **Severity**: EDGE CASE
- **Issue**: `todayKey()` and `parseKey()` use local time. If user travels across time zones, "today" shifts. Could cause double-counting or missed days.
- **Status**: This is acceptable for a single-device app. No fix needed unless multi-device sync is added.

### 16. **400-day search window in lastDueDate/nextDueDate**
- **File**: `/Users/bega/version-2-tracker/src/app/cadence.js`
- **Lines**: 115, 176
- **Severity**: EDGE CASE
- **Issue**: Walks 400 days forward/backward. For annual cadence, this is sufficient (365 < 400). But if cadences longer than annual are added, this would fail.
- **Status**: Current implementation is correct for existing cadences. No fix needed.

---

## SUMMARY

**CRITICAL**: 2 bugs (streak calculations don't check consecutive days)
**HIGH**: 2 bugs (overdue logic, midnight rollover)
**MEDIUM**: 5 bugs (perfect day, annual catch-up, semiannual docs, forecast data, cycle boundary)
**LOW**: 4 bugs (week start, event trigger, insights bias, confetti spam)
**EDGE CASES**: 3 (first Sunday logic, time zones, 400-day window)

The most critical issues are the streak/shield calculations that don't account for gaps in day records. These can lead to incorrect statistics being displayed to users. The overdue logic also needs adjustment to avoid marking weekly actions as overdue too early.