import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
};

const { dueToday, isDueOn, MAX_CADENCED_ACTIONS, MAX_DAILY_ACTIONS } =
  await import('../src/app/cadence.js');
const { fmtHour } = await import('../src/app/day-plan.js');
const { getState, setDayAction } = await import('../src/app/state.js');
const { todayKey } = await import('../src/app/util.js');

test('Sunday plan stays focused and contains no duplicate actions', () => {
  const sunday = new Date(2026, 6, 26, 12);
  const due = dueToday(sunday);
  const ids = due.map(({ action }) => action.id);
  const daily = due.filter(({ action }) => action.cadence === 'daily');
  const cadenced = due.filter(({ action }) => action.cadence !== 'daily');

  assert.ok(daily.length <= MAX_DAILY_ACTIONS);
  assert.ok(cadenced.length <= MAX_CADENCED_ACTIONS);
  assert.equal(new Set(ids).size, ids.length);
});

test('cadence rules select the intended review dates', () => {
  assert.equal(isDueOn('weekly', new Date(2026, 6, 26)), true);
  assert.equal(isDueOn('weekly', new Date(2026, 6, 27)), false);
  assert.equal(isDueOn('monthly', new Date(2026, 7, 2)), true);
  assert.equal(isDueOn('monthly', new Date(2026, 7, 9)), false);
});

test('time formatter correctly carries rounded minutes into next hour', () => {
  assert.equal(fmtHour(21.99), '22:00');
  assert.equal(fmtHour(9.08), '09:05');
  assert.equal(fmtHour(-2), '00:00');
});

test('action scoring applies deltas without duplicating points', () => {
  const key = todayKey();
  setDayAction(key, 'body_sun', 'full');
  assert.equal(getState().totalPoints, 1);

  setDayAction(key, 'body_sun', 'floor');
  assert.equal(getState().totalPoints, 0.5);

  setDayAction(key, 'body_sun', null);
  assert.equal(getState().totalPoints, 1);
});
