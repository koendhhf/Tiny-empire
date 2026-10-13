import {
  businesses,
  upgrades,
  legacyMilestones,
  businessMilestones,
} from './data.js';

function owns(state, id) {
  return state.owned.includes(id);
}

function calculateGlobalMultiplier(state) {
  return upgrades
    .filter((upgrade) => upgrade.effect === 'global' && owns(state, upgrade.id))
    .reduce((multiplier, upgrade) => multiplier * upgrade.mult, 1);
}

function calculateLegacyIncomeBonus(state) {
  return legacyMilestones.reduce(
    (sum, milestone) =>
      sum + (state.prestigeCount >= milestone.count ? milestone.incomeBonus || 0 : 0),
    0,
  );
}

function calculatePrestigeMultiplier(state) {
  return (
    (1 + Math.max(0, state.prestigePoints) * 0.1) *
    (1 + calculateLegacyIncomeBonus(state))
  );
}

function calculateLegacyTapMultiplier(state) {
  return legacyMilestones.reduce(
    (multiplier, milestone) =>
      state.prestigeCount >= milestone.count
        ? multiplier * (milestone.tapMultiplier || 1)
        : multiplier,
    1,
  );
}

export function getLegacyBoostSeconds(state) {
  return legacyMilestones.reduce(
    (sum, milestone) =>
      sum + (state.prestigeCount >= milestone.count ? milestone.boostSeconds || 0 : 0),
    0,
  );
}

function getLegacyOfflineHours(state) {
  return legacyMilestones.reduce(
    (sum, milestone) =>
      sum + (state.prestigeCount >= milestone.count ? milestone.offlineHours || 0 : 0),
    0,
  );
}

export function calculateTapMultiplier(state) {
  return (
    upgrades
      .filter((upgrade) => upgrade.effect === 'tap' && owns(state, upgrade.id))
      .reduce((multiplier, upgrade) => multiplier * upgrade.mult, 1) *
    calculateLegacyTapMultiplier(state)
  );
}

export function calculateIncomeMultiplier(state) {
  return (
    calculateGlobalMultiplier(state) *
    calculatePrestigeMultiplier(state) *
    calculateBusinessMilestoneMultiplier(state)
  );
}

function calculateBusinessMilestoneMultiplier(state) {
  return (state.businessMilestonesClaimed || []).reduce((multiplier, id) => {
    const milestone = businessMilestones.find((item) => item.id === id);
    return multiplier * (1 + (milestone ? milestone.bonus || 0 : 0));
  }, 1);
}

export function calculateBusinessIncome(state, business) {
  const level = state.levels[business.id] || 0;
  if (!level) return 0;

  let value =
    business.base *
    level *
    Math.pow(
      2,
      upgrades.filter(
        (upgrade) => upgrade.effect === 'business' && upgrade.business === business.id && owns(state, upgrade.id),
      ).length,
    );
  if (business.id === 'lemonade' && owns(state, 'recipes')) {
    value *= upgrades.find((upgrade) => upgrade.id === 'recipes').mult;
  }

  return (
    value *
    calculateGlobalMultiplier(state) *
    calculatePrestigeMultiplier(state) *
    calculateBusinessMilestoneMultiplier(state)
  );
}

export function calculateBaseIncome(state) {
  return businesses.reduce((sum, business) => sum + calculateBusinessIncome(state, business), 0);
}

export function calculateIncome(state, now = Date.now()) {
  return calculateBaseIncome(state) * (now < state.boostUntil ? 2 : 1);
}

export function calculateTapGain(state, comboMultiplier = 1) {
  return Math.max(
    1,
    Math.floor(
      calculateTapMultiplier(state) *
        (1 + Math.floor((state.levels.lemonade - 1) * 0.25)) *
        comboMultiplier,
    ),
  );
}

export function calculatePurchaseCost(state, business, quantity) {
  if (quantity <= 0) return 0;
  const level = state.levels[business.id] || 0;
  const growth = business.costGrowth || 1.15;
  const first = business.cost * Math.pow(growth, level);
  if (Math.abs(growth - 1) < 1e-9) return Math.ceil(first * quantity);
  return Math.ceil((first * (Math.pow(growth, quantity) - 1)) / (growth - 1));
}

export function calculateBuyQuantity(state, business, mode) {
  if (mode !== 'max') return Number(mode);
  let low = 0;
  let high = 1;
  while (high < 100000 && calculatePurchaseCost(state, business, high) <= state.cash) high *= 2;
  high = Math.min(100000, high);
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (calculatePurchaseCost(state, business, middle) <= state.cash) low = middle;
    else high = middle;
  }
  return low;
}

export function calculateOfflineEarnings(state, now = Date.now()) {
  const elapsed = Math.min(
    (4 + getLegacyOfflineHours(state)) * 60 * 60,
    Math.max(0, (now - state.lastSeen) / 1000),
  );
  return { elapsed, earned: calculateBaseIncome(state) * elapsed * 0.75 };
}

export function collectPassiveIncome(state, elapsed, now = Date.now()) {
  const amount = calculateIncome(state, now) * elapsed;
  if (amount > 0) {
    state.cash += amount;
    state.lifetime += amount;
  }
  return { changed: amount > 0, amount };
}

export function collectCash(state, comboMultiplier = 1) {
  const gain = calculateTapGain(state, comboMultiplier);
  state.cash += gain;
  state.lifetime += gain;
  return { changed: true, gain };
}

export function purchaseBusiness(state, id, mode) {
  const business = businesses.find((item) => item.id === id);
  if (!business) return { changed: false, count: 0, price: 0, business: null };

  const count = calculateBuyQuantity(state, business, mode);
  const price = calculatePurchaseCost(state, business, count);
  if (
    count < 1 ||
    (mode !== 'max' && state.cash < price) ||
    ((state.levels[id] || 0) === 0 && state.lifetime < business.unlock)
  ) {
    return { changed: false, count, price, business };
  }

  state.cash -= price;
  state.levels[id] = (state.levels[id] || 0) + count;
  return { changed: true, count, price, business };
}

export function purchaseUpgrade(state, id) {
  const upgrade = upgrades.find((item) => item.id === id);
  if (
    !upgrade ||
    owns(state, id) ||
    state.cash < upgrade.cost ||
    (upgrade.business && (state.levels[upgrade.business] || 0) < upgrade.threshold)
  ) {
    return { changed: false, upgrade: null };
  }

  state.cash -= upgrade.cost;
  state.owned.push(id);
  return { changed: true, upgrade };
}

export function activateRush(state, now = Date.now()) {
  if (now < state.boostUntil || now < state.boostCooldownUntil) return { changed: false };
  state.boostUntil = now + (30000 + getLegacyBoostSeconds(state) * 1000);
  state.boostCooldownUntil = now + 300000;
  return { changed: true };
}


