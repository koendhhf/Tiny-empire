import {
  businesses,
  goals,
  ranks,
  eras,
  legacyMilestones,
  businessMilestones,
  PRESTIGE_THRESHOLD,
} from './data.js';
import { addCash, addEarnings, calculateBaseIncome } from './economy.js';

export function localDateKey(now = Date.now()) {
  const date = new Date(now);
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

export function yesterdayDateKey(now = Date.now()) {
  const date = new Date(now);
  date.setDate(date.getDate() - 1);
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

export function ensureDailyMissions(state, now = Date.now()) {
  const today = localDateKey(now);
  if (state.missionDay !== today) {
    const day = Number(today.slice(-2)) || 1;
    state.missionDay = today;
    state.missionProgress = { taps: 0, levels: 0, rush: 0 };
    state.missionClaimed = [];
    state.missionTargets = { taps: 10 + (day % 3) * 5, levels: 3 + (day % 3) * 2 };
  }
  if (!state.missionProgress || typeof state.missionProgress !== 'object') {
    state.missionProgress = { taps: 0, levels: 0, rush: 0 };
  }
  if (!state.missionTargets || typeof state.missionTargets !== 'object') {
    const day = Number(today.slice(-2)) || 1;
    state.missionTargets = { taps: 10 + (day % 3) * 5, levels: 3 + (day % 3) * 2 };
  }
  state.missionClaimed = Array.isArray(state.missionClaimed) ? state.missionClaimed : [];
}

export function getMissionDefinitions(state) {
  const targets = state.missionTargets;
  const progress = state.missionProgress;
  return [
    {
      id: 'taps',
      icon: '👆',
      title: 'Hands-on founder',
      desc: 'Collect cash ' + targets.taps + ' times.',
      target: targets.taps,
      progress: progress.taps || 0,
      reward: Math.max(3, Math.floor(Math.max(100, state.lifetime) * 0.001)),
    },
    {
      id: 'levels',
      icon: '🏪',
      title: 'Expand the empire',
      desc: 'Buy ' + targets.levels + ' business levels.',
      target: targets.levels,
      progress: progress.levels || 0,
      reward: Math.max(5, Math.floor(Math.max(250, state.lifetime) * 0.0015)),
    },
    {
      id: 'rush',
      icon: '⚡',
      title: 'Rush hour',
      desc: 'Activate Rush Hour once today.',
      target: 1,
      progress: progress.rush || 0,
      reward: Math.max(8, Math.floor(Math.max(500, state.lifetime) * 0.0025)),
    },
  ];
}

export function getRank(state) {
  let current = ranks[0];
  ranks.forEach((rank) => {
    if (state.lifetime >= rank.value) current = rank;
  });
  return current;
}

export function getEraProgress(state) {
  let current = eras[0];
  let next = null;
  for (let index = 0; index < eras.length; index += 1) {
    if (state.lifetime >= eras[index].value) current = eras[index];
    else {
      next = eras[index];
      break;
    }
  }
  const prior = current.value;
  const upper = next ? next.value : current.value;
  const progress = next
    ? Math.max(0, Math.min(100, ((state.lifetime - prior) / (upper - prior)) * 100))
    : 100;
  return { current, next, progress };
}

export function getPrestigeReward(state) {
  return Math.floor(Math.sqrt(Math.max(0, state.lifetime) / PRESTIGE_THRESHOLD) * 1.5);
}

export function getDailyReward(state, baseIncome = calculateBaseIncome(state), now = Date.now()) {
  const base = Math.max(10, Math.min(1000000000, Math.floor(10 + baseIncome * 5)));
  const nextStreak =
    state.dailyClaimDate === yesterdayDateKey(now) ? Math.max(0, state.dailyStreak || 0) + 1 : 1;
  return Math.floor(base * (1 + Math.min(5, Math.max(0, nextStreak - 1)) * 0.1));
}

export function recordTap(state) {
  state.missionProgress.taps = Math.min(
    state.missionTargets.taps,
    (state.missionProgress.taps || 0) + 1,
  );
}

export function recordLevelsPurchased(state, count) {
  state.missionProgress.levels = Math.min(
    state.missionTargets.levels,
    (state.missionProgress.levels || 0) + count,
  );
}

export function recordRush(state) {
  state.missionProgress.rush = Math.min(1, (state.missionProgress.rush || 0) + 1);
}

export function claimMission(state, id, now = Date.now()) {
  ensureDailyMissions(state, now);
  const mission = getMissionDefinitions(state).find((item) => item.id === id);
  if (!mission || mission.progress < mission.target || state.missionClaimed.includes(id)) {
    return { changed: false, mission: null, reward: 0 };
  }
  state.missionClaimed.push(id);
  addEarnings(state, mission.reward);
  return { changed: true, mission, reward: mission.reward };
}

export function claimGoal(state, id) {
  const goal = goals.find((item) => item.id === id);
  if (!goal || state.lifetime < goal.value || state.claimed.includes(id)) {
    return { changed: false, goal: null };
  }
  state.claimed.push(id);
  addEarnings(state, goal.reward);
  return { changed: true, goal };
}

export function getTotalBusinessLevels(state) {
  return businesses.reduce((sum, business) => sum + (state.levels[business.id] || 0), 0);
}

export function claimBusinessMilestone(state, id) {
  const milestone = businessMilestones.find((item) => item.id === id);
  if (
    !milestone ||
    getTotalBusinessLevels(state) < milestone.levels ||
    (state.businessMilestonesClaimed || []).includes(id)
  ) {
    return { changed: false, milestone: null };
  }
  state.businessMilestonesClaimed.push(id);
  addCash(state, milestone.reward);
  return { changed: true, milestone };
}

export function claimDailyBonus(state, baseIncome = calculateBaseIncome(state), now = Date.now()) {
  const today = localDateKey(now);
  if (state.dailyClaimDate === today) {
    return { changed: false, reward: 0, streak: state.dailyStreak || 1 };
  }
  const reward = getDailyReward(state, baseIncome, now);
  state.dailyStreak =
    state.dailyClaimDate === yesterdayDateKey(now)
      ? Math.min(36500, Math.max(0, state.dailyStreak || 0) + 1)
      : 1;
  state.dailyClaimDate = today;
  addEarnings(state, reward);
  return { changed: true, reward, streak: state.dailyStreak };
}

export function resetForPrestige(state, now = Date.now()) {
  const reward = getPrestigeReward(state);
  if (state.lifetime < PRESTIGE_THRESHOLD || reward < 1) {
    return { changed: false, state, reward, points: state.prestigePoints };
  }

  const points = state.prestigePoints + reward;
  const prestigeCount = Math.min(1e9, state.prestigeCount + 1);
  const levels = {};
  businesses.forEach((business) => {
    levels[business.id] = business.id === 'lemonade' ? 1 : 0;
  });
  const nextState = {
    cash: 0,
    lifetime: 0,
    levels,
    owned: [],
    claimed: [],
    businessMilestonesClaimed: [],
    prestigePoints: points,
    prestigeCount,
    lastSeen: now,
    dailyClaimDate: state.dailyClaimDate,
    dailyStreak: state.dailyStreak || 0,
    boostUntil: 0,
    boostCooldownUntil: 0,
    missionDay: state.missionDay,
    missionProgress: state.missionProgress,
    missionTargets: state.missionTargets,
    missionClaimed: state.missionClaimed,
  };
  return { changed: true, state: nextState, reward, points };
}

