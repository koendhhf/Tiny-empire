import assert from 'node:assert/strict';
import test from 'node:test';
import { businesses } from '../src/data.js';
import {
  calculateBuyQuantity,
  calculatePurchaseCost,
  collectPassiveIncome,
} from '../src/economy.js';
import { createInitialState } from '../src/state.js';

test('overflowed business prices stay finite and cannot be bought with capped cash', () => {
  const state = createInitialState();
  state.levels.lemonade = 1e9;
  state.cash = 1e300;

  const price = calculatePurchaseCost(state, businesses[0], 1);

  assert.equal(price, Number.MAX_VALUE);
  assert.equal(Number.isFinite(price), true);
  assert.equal(calculateBuyQuantity(state, businesses[0], 'max'), 0);
});

test('passive earnings and persisted currency stay finite at numeric limits', () => {
  const state = createInitialState();
  state.levels.lemonade = 1e9;
  state.prestigePoints = 1e300;

  const result = collectPassiveIncome(state, Number.MAX_VALUE);

  assert.equal(result.amount, 1e300);
  assert.equal(Number.isFinite(result.amount), true);
  assert.equal(state.cash, 1e300);
  assert.equal(state.lifetime, 1e300);
});

test('purchase pricing and buy-max preserve early-game prices', () => {
  const state = createInitialState();
  state.cash = 100;

  assert.equal(calculatePurchaseCost(state, businesses[0], 0), 0);
  assert.equal(calculatePurchaseCost(state, businesses[0], 1), 24);
  assert.equal(calculatePurchaseCost(state, businesses[0], 2), 53);
  assert.equal(calculateBuyQuantity(state, businesses[0], 'max'), 3);
  assert.equal(calculateBuyQuantity(state, businesses[0], 'invalid'), 0);
});

test('business income remains finite at extreme but valid state values', async () => {
  const { calculateBusinessIncome, calculateBaseIncome } = await import('../src/economy.js');
  const state = createInitialState();
  state.levels.eternal = 1e9;
  state.prestigePoints = 1e300;

  const income = calculateBusinessIncome(state, businesses.at(-1));
  const totalIncome = calculateBaseIncome(state);

  assert.equal(income, 1e300);
  assert.equal(Number.isFinite(income), true);
  assert.equal(Number.isFinite(totalIncome), true);
  assert.ok(totalIncome <= 1e300);
});

