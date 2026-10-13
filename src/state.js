import { businesses, upgrades, goals } from './data.js';

export const SAVE_KEY = 'tiny-empire-save-v1';

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
    missionClaimed: [],
  };
}

export function loadState(getStorage, data, now = Date.now()) {
  let state = createInitialState(now);

  try {
    const raw = getStorage().getItem(SAVE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && typeof saved.cash === 'number' && saved.levels) {
        const safeLevels = {};
        data.businesses.forEach((business) => {
          safeLevels[business.id] = Math.max(
            business.id === 'lemonade' ? 1 : 0,
            Math.floor(Number(saved.levels[business.id]) || 0),
          );
        });

        state = {
          cash: Math.max(0, Number(saved.cash) || 0),
          lifetime: Math.max(0, Number(saved.lifetime) || 0),
          levels: safeLevels,
          owned: Array.isArray(saved.owned)
            ? saved.owned.filter((id) => data.upgrades.some((upgrade) => upgrade.id === id))
            : [],
          claimed: Array.isArray(saved.claimed)
            ? saved.claimed.filter((id) => data.goals.some((goal) => goal.id === id))
            : [],
          lastSeen: Number(saved.lastSeen) || now,
          dailyClaimDate: typeof saved.dailyClaimDate === 'string' ? saved.dailyClaimDate : '',
          boostUntil: Number(saved.boostUntil) || 0,
          boostCooldownUntil: Number(saved.boostCooldownUntil) || 0,
          dailyStreak: Math.max(0, Math.floor(Number(saved.dailyStreak) || 0)),
          prestigePoints: Math.max(0, Math.floor(Number(saved.prestigePoints) || 0)),
          prestigeCount: Math.max(0, Math.floor(Number(saved.prestigeCount) || 0)),
          businessMilestonesClaimed: Array.isArray(saved.businessMilestonesClaimed)
            ? saved.businessMilestonesClaimed
            : [],
          missionDay: typeof saved.missionDay === 'string' ? saved.missionDay : '',
          missionProgress:
            saved.missionProgress && typeof saved.missionProgress === 'object'
              ? saved.missionProgress
              : { taps: 0, levels: 0, rush: 0 },
          missionTargets:
            saved.missionTargets && typeof saved.missionTargets === 'object'
              ? saved.missionTargets
              : null,
          missionClaimed: Array.isArray(saved.missionClaimed) ? saved.missionClaimed : [],
        };
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

export function parseImportedSave(text) {
  const imported = JSON.parse(text);
  if (
    !imported ||
    typeof imported.cash !== 'number' ||
    !imported.levels ||
    typeof imported.levels !== 'object'
  ) {
    throw new Error('Invalid save');
  }
  return imported;
}
