import assert from 'node:assert/strict';
import test from 'node:test';
import { PRESTIGE_EFFECT_TYPES, prestigeTree, prestigeTreeBranches } from '../src/data.js';
import { createInitialState } from '../src/state.js';
import {
  canPurchasePrestigeNode,
  calculateTapComboMultiplier,
  getPrestigeTreeEffects,
  purchasePrestigeNode,
} from '../src/prestige.js';

test('prestige tree defines unique, tiered nodes with supported effects', () => {
  const ids = prestigeTree.map((node) => node.id);

  assert.equal(ids.length, 12);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(prestigeTreeBranches.map((branch) => branch.id), ['capital', 'taps', 'operations']);

  prestigeTree.forEach((node) => {
    assert.ok(node.name);
    assert.ok(node.desc);
    assert.ok(Number.isInteger(node.cost) && node.cost >= 1);
    assert.ok(PRESTIGE_EFFECT_TYPES.includes(node.effect.type));
    assert.ok(Number.isFinite(node.effect.value));
    assert.ok(node.tier >= 1 && node.tier <= 4);
  });
});

test('prestige nodes require points and prerequisites, and purchases are one-time', () => {
  const state = createInitialState(1234);
  state.prestigePoints = 4;
  state.prestigePointsEarned = 4;

  const locked = canPurchasePrestigeNode(state, 'pt_capital_wholesale');
  assert.equal(locked.available, false);
  assert.equal(locked.reason, 'Unlock Seed Capital first.');

  const first = purchasePrestigeNode(state, 'pt_capital_seed');
  assert.equal(first.changed, true);
  assert.equal(state.prestigePoints, 3);
  assert.equal(state.prestigePointsEarned, 4);
  assert.deepEqual(state.prestigeTreePurchased, ['pt_capital_seed']);

  const second = purchasePrestigeNode(state, 'pt_capital_wholesale');
  assert.equal(second.changed, true);
  assert.equal(state.prestigePoints, 1);
  assert.equal(purchasePrestigeNode(state, 'pt_capital_seed').changed, false);
  assert.equal(purchasePrestigeNode(state, 'pt_capital_compound').changed, false);
  assert.equal(state.prestigePoints, 1);
});

test('tree effects add income and tap bonuses and compose rush, offline, and discounts', () => {
  const state = createInitialState(1234);
  state.prestigeTreePurchased = [
    'pt_capital_seed',
    'pt_capital_wholesale',
    'pt_taps_quick',
    'pt_taps_touch',
    'pt_taps_streak',
    'pt_ops_shift',
    'pt_ops_night_crew',
  ];

  assert.deepEqual(getPrestigeTreeEffects(state), {
    incomePercent: 0.05,
    tapFlat: 1,
    tapMultiplier: 1.5,
    tapStreakIncrement: 0.05,
    boostSeconds: 10,
    offlineHours: 1,
    buyDiscount: 0.06,
  });
});

test('Streak School raises each tap combo step without changing its cap', () => {
  const state = createInitialState(1234);
  state.prestigeTreePurchased = ['pt_taps_streak'];

  assert.equal(calculateTapComboMultiplier(state, 0), 1);
  assert.equal(calculateTapComboMultiplier(state, 1), 1.15);
  assert.equal(calculateTapComboMultiplier(state, 10), 2.5);
  assert.equal(calculateTapComboMultiplier(state, 100), 2.5);
});

