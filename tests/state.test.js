import assert from 'node:assert/strict';
import test from 'node:test';
import { businesses, upgrades, goals } from '../src/data.js';
import { ensureDailyMissions } from '../src/progression.js';
import {
  SAVE_KEY,
  createInitialState,
  loadState,
  parseImportedSave,
  saveState,
  serializeSave,
} from '../src/state.js';

function createStorage(value = null) {
  return {
    value,
    getItem(key) {
      return key === SAVE_KEY ? this.value : null;
    },
    setItem(key, nextValue) {
      if (key === SAVE_KEY) this.value = nextValue;
    },
  };
}

test('valid progress survives save, load, export, and import round trips', () => {
  const now = 1_800_000_000_000;
  const storage = createStorage();
  const state = createInitialState(now);
  ensureDailyMissions(state, now);
  state.cash = 1234;
  state.lifetime = 9876;
  state.levels.snack = 4;
  state.owned = ['pitch'];
  state.claimed = ['g10'];
  state.prestigePoints = 2;
  state.prestigePointsEarned = 3;
  state.prestigeTreePurchased = ['pt_capital_seed'];
  state.dailyStreak = 7;

  assert.equal(saveState(state, () => storage, now).ok, true);
  const loaded = loadState(() => storage, { businesses, upgrades, goals }, now + 1000);
  const imported = parseImportedSave(serializeSave(loaded), now + 1000);

  assert.equal(loaded.cash, 1234);
  assert.equal(loaded.lifetime, 9876);
  assert.equal(loaded.levels.snack, 4);
  assert.deepEqual(loaded.owned, ['pitch']);
  assert.deepEqual(loaded.claimed, ['g10']);
  assert.equal(loaded.prestigePoints, 2);
  assert.equal(loaded.prestigePointsEarned, 3);
  assert.deepEqual(loaded.prestigeTreePurchased, ['pt_capital_seed']);
  assert.equal(loaded.dailyStreak, 7);
  assert.deepEqual(imported, loaded);
});

test('malformed local storage is ignored without crashing', () => {
  const state = loadState(
    () => createStorage('{not valid json'),
    { businesses, upgrades, goals },
    1234,
  );

  assert.equal(state.cash, 0);
  assert.equal(state.lifetime, 0);
  assert.equal(state.levels.lemonade, 1);
  assert.equal(state.lastSeen, 1234);
});

test('partial saves without mission targets receive safe mission defaults', () => {
  const now = 1234;
  const partialSave = {
    cash: 30,
    lifetime: 50,
    levels: { lemonade: 1 },
  };
  const backup = JSON.stringify(partialSave);

  assert.doesNotThrow(() => parseImportedSave(backup, now));
  const imported = parseImportedSave(backup, now);
  assert.ok([10, 15, 20].includes(imported.missionTargets.taps));
  assert.ok([3, 5, 7].includes(imported.missionTargets.levels));

  const loaded = loadState(
    () => createStorage(backup),
    { businesses, upgrades, goals },
    now,
  );
  assert.equal(loaded.cash, 30);
  assert.equal(loaded.lifetime, 50);
});

test('older saves migrate prestige points and new tree progress round-trips', () => {
  const oldSave = createInitialState(1234);
  oldSave.prestigePoints = 2;
  delete oldSave.prestigePointsEarned;
  delete oldSave.prestigeTreePurchased;
  const migrated = parseImportedSave(JSON.stringify(oldSave), 1234);

  assert.equal(migrated.prestigePointsEarned, 2);
  assert.deepEqual(migrated.prestigeTreePurchased, []);

  const progressed = createInitialState(1234);
  progressed.prestigePoints = 1;
  progressed.prestigePointsEarned = 3;
  progressed.prestigeTreePurchased = ['pt_capital_seed'];
  const restored = parseImportedSave(serializeSave(progressed), 1234);

  assert.equal(restored.prestigePoints, 1);
  assert.equal(restored.prestigePointsEarned, 3);
  assert.deepEqual(restored.prestigeTreePurchased, ['pt_capital_seed']);
  assert.throws(
    () => parseImportedSave(JSON.stringify({ ...progressed, prestigeTreePurchased: ['future_node'] }), 1234),
    Error,
  );
});

test('malformed, unknown, or out-of-range imported saves are rejected', () => {
  const valid = createInitialState(1234);
  const invalidCases = [
    '{',
    JSON.stringify({ cash: 0, lifetime: 0 }),
    JSON.stringify({ ...valid, levels: { ...valid.levels, unknownShop: 1 } }),
    JSON.stringify({ ...valid, cash: -1 }),
    JSON.stringify({ ...valid, lifetime: -1 }),
    JSON.stringify({ ...valid, cash: 1e301 }),
    JSON.stringify({ ...valid, owned: ['unknownUpgrade'] }),
    JSON.stringify({ ...valid, claimed: ['unknownGoal'] }),
    JSON.stringify({ ...valid, prestigeCount: 1.5 }),
    JSON.stringify({ ...valid, missionTargets: { taps: '<img src=x>', levels: 3 } }),
  ];

  invalidCases.forEach((backup) => {
    assert.throws(() => parseImportedSave(backup, 1234), Error);
  });
});

