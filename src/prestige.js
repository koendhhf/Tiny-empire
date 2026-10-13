import { prestigeTree, TAP_STREAK_INCREMENT, TAP_STREAK_MAX_FOLLOWUPS } from './data.js';

const MAX_PRESTIGE_BUY_DISCOUNT = 0.5;

function getPurchasedNodes(state) {
  return Array.isArray(state.prestigeTreePurchased) ? state.prestigeTreePurchased : [];
}

export function getTotalPrestigePointsEarned(state) {
  return Math.max(0, state.prestigePointsEarned ?? 0, state.prestigePoints ?? 0);
}

export function canPurchasePrestigeNode(state, nodeId) {
  const node = prestigeTree.find((item) => item.id === nodeId);
  if (!node) return { available: false, node: null, reason: 'That skill is not available.' };

  const purchased = getPurchasedNodes(state);
  if (purchased.includes(node.id)) {
    return { available: false, node, reason: 'Already unlocked.' };
  }

  if (node.prereq && !purchased.includes(node.prereq)) {
    const prerequisite = prestigeTree.find((item) => item.id === node.prereq);
    return {
      available: false,
      node,
      reason: 'Unlock ' + (prerequisite ? prerequisite.name : 'the previous skill') + ' first.',
    };
  }

  if (!Number.isInteger(state.prestigePoints) || state.prestigePoints < node.cost) {
    return {
      available: false,
      node,
      reason: 'Need ' + node.cost + ' prestige point' + (node.cost === 1 ? '' : 's') + '.',
    };
  }

  return { available: true, node, reason: 'Ready to unlock.' };
}

export function purchasePrestigeNode(state, nodeId) {
  const availability = canPurchasePrestigeNode(state, nodeId);
  if (!availability.available) return { changed: false, ...availability };

  state.prestigePoints -= availability.node.cost;
  state.prestigeTreePurchased = [...getPurchasedNodes(state), availability.node.id];
  return { changed: true, ...availability };
}

export function getPrestigeTreeEffects(state) {
  const purchased = new Set(getPurchasedNodes(state));
  const effects = {
    incomePercent: 0,
    tapFlat: 0,
    tapMultiplier: 1,
    tapStreakIncrement: 0,
    boostSeconds: 0,
    offlineHours: 0,
    buyDiscount: 0,
  };
  const effectProperties = {
    income_percent: 'incomePercent',
    tap_flat: 'tapFlat',
    tap_multiplier: 'tapMultiplier',
    tap_streak_increment: 'tapStreakIncrement',
    boost_seconds: 'boostSeconds',
    offline_hours: 'offlineHours',
    buy_discount_percent: 'buyDiscount',
  };

  prestigeTree.forEach((node) => {
    if (!purchased.has(node.id)) return;
    const property = effectProperties[node.effect.type];
    if (!property) return;
    if (node.effect.type === 'tap_multiplier') effects[property] *= node.effect.value;
    else effects[property] += node.effect.value;
  });

  effects.buyDiscount = Math.min(MAX_PRESTIGE_BUY_DISCOUNT, effects.buyDiscount);
  return effects;
}

export function calculateTapComboMultiplier(state, followUps) {
  const safeFollowUps = Number.isFinite(followUps)
    ? Math.max(0, Math.min(TAP_STREAK_MAX_FOLLOWUPS, Math.floor(followUps)))
    : 0;
  const increment = TAP_STREAK_INCREMENT + getPrestigeTreeEffects(state).tapStreakIncrement;
  return 1 + safeFollowUps * increment;
}

