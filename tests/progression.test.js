import assert from 'node:assert/strict';
import test from 'node:test';
import {
  claimMission,
  ensureDailyMissions,
  getMissionDefinitions,
  getPrestigeReward,
  recordTap,
  resetForPrestige,
} from '../src/progression.js';
import { createInitialState } from '../src/state.js';

test('daily missions require their target, then can be claimed only once', () => {
  const now = 1_800_000_000_000;
  const state = createInitialState(now);
  ensureDailyMissions(state, now);
  const target = getMissionDefinitions(state).find((mission) => mission.id === 'taps').target;

  assert.equal(claimMission(state, 'taps', now).changed, false);
  for (let tap = 0; tap < target + 3; tap += 1) recordTap(state);

  const firstClaim = claimMission(state, 'taps', now);
  const secondClaim = claimMission(state, 'taps', now);

  assert.equal(state.missionProgress.taps, target);
  assert.equal(firstClaim.changed, true);
  assert.ok(firstClaim.reward > 0);
  assert.equal(secondClaim.changed, false);
});

test('prestige rewards follow the current lifetime earnings formula', () => {
  const state = createInitialState();
  state.lifetime = 300000;
  assert.equal(getPrestigeReward(state), 1);

  state.lifetime = 1200000;
  assert.equal(getPrestigeReward(state), 3);
});

test('prestige reset grants earned points and preserves permanent tree investments', () => {
  const state = createInitialState(1234);
  state.lifetime = 300000;
  state.cash = 5000;
  state.levels.snack = 4;
  state.owned = ['pitch'];
  state.prestigePoints = 2;
  state.prestigePointsEarned = 5;
  state.prestigeTreePurchased = ['pt_capital_seed', 'pt_taps_quick'];

  const result = resetForPrestige(state, 5678);

  assert.equal(result.changed, true);
  assert.equal(result.reward, 1);
  assert.equal(result.state.prestigePoints, 3);
  assert.equal(result.state.prestigePointsEarned, 6);
  assert.deepEqual(result.state.prestigeTreePurchased, ['pt_capital_seed', 'pt_taps_quick']);
  assert.equal(result.state.cash, 0);
  assert.equal(result.state.lifetime, 0);
  assert.equal(result.state.levels.snack, 0);
  assert.deepEqual(result.state.owned, []);
});

