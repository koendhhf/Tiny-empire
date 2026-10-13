import { businesses, upgrades, goals, businessMilestones } from './data.js';

export const SAVE_KEY = 'tiny-empire-save-v1';

const MAX_CURRENCY = 1e300;
const MAX_BUSINESS_LEVEL = 1e9;
const MAX_PRESTIGE_POINTS = 1e300;
const MAX_COUNTER = 1e9;
const MAX_DAILY_STREAK = 36500;
const MAX_TIMESTAMP = 8.64e15;
const MAX_FUTURE_TIMESTAMP_MS = 24 * 60 * 60 * 1000;
const MISSION_IDS = new Set(['taps', 'levels', 'rush']);
const MISSION_TARGETS = { taps: [10, 15, 20], levels: [3, 5, 7] };

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function invalidSave(message = 'Invalid save') {
  throw new Error(message);
}

function validateNumber(value, label, maximum, integer = false) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > maximum ||
    (integer && !Number.isInteger(value))
  ) {
    invalidSave('Invalid ' + label);
  }
  return value;
}

function normalizeNumber(value, fallback, maximum, integer = false) {
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  const bounded = Math.max(0, Math.min(maximum, number));
  return integer ? Math.floor(bounded) : bounded;
}

function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function normalizeDateKey(value, strict, label) {
  if (value === undefined || value === '') return '';
  if (isDateKey(value)) return value;
  if (strict) invalidSave('Invalid ' + label);
  return '';
}

function normalizeIdList(value, allowedIds, strict, label) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    if (strict) invalidSave('Invalid ' + label);
    return [];
  }
  const result = [];
  value.forEach((id) => {
    if (typeof id === 'string' && allowedIds.has(id)) {
      if (!result.includes(id)) result.push(id);
    } else if (strict) {
      invalidSave('Invalid ' + label);
    }
  });
  return result;
}

function normalizeTimestamp(value, fallback, now, strict, label) {
  if (value === undefined || value === null) return fallback;
  const maximum = Math.min(MAX_TIMESTAMP, now + MAX_FUTURE_TIMESTAMP_MS);
  if (strict) {
    validateNumber(value, label, maximum);
    return value;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return Math.min(maximum, number);
}

function defaultMissionTargets(day, now) {
  const key = isDateKey(day) ? day : localDateKey(now);
  const dayNumber = Number(key.slice(-2)) || 1;
  return { taps: 10 + (dayNumber % 3) * 5, levels: 3 + (dayNumber % 3) * 2 };
}

function normalizeMissionProgress(value, strict) {
  if (value === undefined || value === null) return { taps: 0, levels: 0, rush: 0 };
  if (!isRecord(value)) {
    if (strict) invalidSave('Invalid mission progress');
    return { taps: 0, levels: 0, rush: 0 };
  }
  const result = {};
  ['taps', 'levels', 'rush'].forEach((key) => {
    const count = value[key];
    if (count === undefined) result[key] = 0;
    else if (strict) result[key] = validateNumber(count, 'mission progress', MAX_COUNTER, true);
    else result[key] = normalizeNumber(count, 0, MAX_COUNTER, true);
  });
  if (strict && Object.keys(value).some((key) => !['taps', 'levels', 'rush'].includes(key))) {
    invalidSave('Invalid mission progress');
  }
  return result;
}

function normalizeMissionTargets(value, fallback, strict) {
  if (value === undefined || value === null) return fallback;
  if (!isRecord(value)) {
    if (strict) invalidSave('Invalid mission targets');
    return fallback;
  }
  const result = { ...fallback };
  Object.entries(MISSION_TARGETS).forEach(([key, allowed]) => {
    if (value[key] === undefined) return;
    const target = value[key];
    if (Number.isInteger(target) && allowed.includes(target)) result[key] = target;
    else if (strict) invalidSave('Invalid mission targets');
  });
  if (strict && Object.keys(value).some((key) => !Object.prototype.hasOwnProperty.call(MISSION_TARGETS, key))) {
    invalidSave('Invalid mission targets');
  }
  return result;
}

function createNormalizedState(saved, data, now, strict) {
  if (!isRecord(saved) || !isRecord(saved.levels)) invalidSave();

  const businessList = data.businesses || businesses;
  const upgradeList = data.upgrades || upgrades;
  const goalList = data.goals || goals;
  const knownBusinessIds = new Set(businessList.map((item) => item.id));
  const knownUpgradeIds = new Set(upgradeList.map((item) => item.id));
  const knownGoalIds = new Set(goalList.map((item) => item.id));
  const knownBusinessMilestoneIds = new Set(businessMilestones.map((item) => item.id));

  if (strict) {
    validateNumber(saved.cash, 'cash', MAX_CURRENCY);
    validateNumber(saved.lifetime, 'lifetime earnings', MAX_CURRENCY);
    if (Object.keys(saved.levels).some((id) => !knownBusinessIds.has(id))) {
      invalidSave('Unknown business in save');
    }
  }

  const state = createInitialState(now);
  state.cash = normalizeNumber(saved.cash, 0, MAX_CURRENCY);
  state.lifetime = normalizeNumber(saved.lifetime, 0, MAX_CURRENCY);
  businessList.forEach((business) => {
    const value = saved.levels[business.id];
    if (strict && value !== undefined) {
      validateNumber(value, 'business level', MAX_BUSINESS_LEVEL, true);
    }
    state.levels[business.id] = Math.max(
      business.id === 'lemonade' ? 1 : 0,
      normalizeNumber(value, business.id === 'lemonade' ? 1 : 0, MAX_BUSINESS_LEVEL, true),
    );
  });

  state.owned = normalizeIdList(saved.owned, knownUpgradeIds, strict, 'owned upgrades');
  state.claimed = normalizeIdList(saved.claimed, knownGoalIds, strict, 'claimed goals');
  state.businessMilestonesClaimed = normalizeIdList(
    saved.businessMilestonesClaimed,
    knownBusinessMilestoneIds,
    strict,
    'business milestones',
  );
  state.prestigePoints = strict
    ? validateNumber(saved.prestigePoints ?? 0, 'prestige points', MAX_PRESTIGE_POINTS, true)
    : normalizeNumber(saved.prestigePoints, 0, MAX_PRESTIGE_POINTS, true);
  state.prestigeCount = strict
    ? validateNumber(saved.prestigeCount ?? 0, 'prestige count', MAX_COUNTER, true)
    : normalizeNumber(saved.prestigeCount, 0, MAX_COUNTER, true);
  state.lastSeen = normalizeTimestamp(saved.lastSeen, now, now, strict, 'last seen time');
  state.dailyClaimDate = normalizeDateKey(saved.dailyClaimDate, strict, 'daily claim date');
  state.dailyStreak = strict
    ? validateNumber(saved.dailyStreak ?? 0, 'daily streak', MAX_DAILY_STREAK, true)
    : normalizeNumber(saved.dailyStreak, 0, MAX_DAILY_STREAK, true);
  state.boostUntil = normalizeTimestamp(saved.boostUntil, 0, now, strict, 'Rush Hour time');
  state.boostCooldownUntil = normalizeTimestamp(
    saved.boostCooldownUntil,
    0,
    now,
    strict,
    'Rush Hour cooldown',
  );
  state.missionDay = normalizeDateKey(saved.missionDay, strict, 'mission date');
  state.missionProgress = normalizeMissionProgress(saved.missionProgress, strict);
  state.missionTargets = normalizeMissionTargets(
    saved.missionTargets,
    defaultMissionTargets(state.missionDay, now),
    strict,
  );
  state.missionClaimed = normalizeIdList(saved.missionClaimed, MISSION_IDS, strict, 'claimed missions');

  return state;
}

export function createInitialState(now = Date.now()) {
  const levels = {};
  businesses.forEach((business) => {
    levels[business.id] = business.id === 'lemonade' ? 1 : 0;
  });

  return {
    cash: 0,
    lifetime: 0,
    levels,
    owned: [],
    claimed: [],
    businessMilestonesClaimed: [],
    prestigePoints: 0,
    prestigeCount: 0,
    lastSeen: now,
    dailyClaimDate: '',
    dailyStreak: 0,
    boostUntil: 0,
    boostCooldownUntil: 0,
    missionDay: '',
    missionProgress: { taps: 0, levels: 0, rush: 0 },
    missionTargets: null,
    missionClaimed: [],
  };
}

export function loadState(getStorage, data, now = Date.now()) {
  let state = createInitialState(now);

  try {
    const raw = getStorage().getItem(SAVE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (isRecord(saved) && Number.isFinite(saved.cash) && isRecord(saved.levels)) {
        state = createNormalizedState(saved, data, now, false);
      }
    }
  } catch {
    state.lastSeen = now;
  }

  return state;
}

export function saveState(state, getStorage, now = Date.now()) {
  state.lastSeen = now;
  try {
    getStorage().setItem(SAVE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function serializeSave(state) {
  return JSON.stringify(state, null, 2);
}

export function parseImportedSave(text, now = Date.now()) {
  const imported = JSON.parse(text);
  if (!isRecord(imported) || typeof imported.cash !== 'number' || !isRecord(imported.levels)) {
    invalidSave();
  }
  if (typeof imported.lifetime !== 'number') invalidSave('Invalid lifetime earnings');
  return createNormalizedState(imported, { businesses, upgrades, goals }, now, true);
}

