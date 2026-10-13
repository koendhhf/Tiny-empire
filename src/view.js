import {
  businesses,
  upgrades,
  tierThresholds,
  goals,
  ranks,
  legacyMilestones,
  businessMilestones,
  SHORT_SCALE_NAMES,
  PRESTIGE_THRESHOLD,
  TAP_STREAK_WINDOW_MS,
} from './data.js';
import {
  calculateBusinessIncome,
  calculateBaseIncome,
  calculateIncome,
  calculateIncomeMultiplier,
  calculateTapMultiplier,
  calculatePurchaseCost,
  calculateBuyQuantity,
  getLegacyBoostSeconds,
} from './economy.js';
import {
  localDateKey,
  yesterdayDateKey,
  getMissionDefinitions,
  getRank,
  getEraProgress,
  getPrestigeReward,
  getDailyReward,
  getTotalBusinessLevels,
} from './progression.js';

const $ = (id) => document.getElementById(id);
function trimFixed(value, digits = 2) {
  return value.toFixed(digits).replace(/\.?0+$/, '');
}

function formatNumbers(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return '—';
  if (!Number.isFinite(number)) return number < 0 ? '-Infinity' : 'Infinity';
  const sign = number < 0 ? '-' : '';
  const absolute = Math.abs(number);
  if (absolute < 1000) return sign + (Number.isInteger(absolute) ? String(absolute) : trimFixed(absolute, 2));
  if (absolute < 1e6) return sign + Math.round(absolute).toLocaleString('en-US');
  if (absolute > 1e36) return sign + absolute.toExponential(2).replace('e+', 'e');
  for (const unit of SHORT_SCALE_NAMES) {
    if (absolute >= unit.value) return sign + trimFixed(absolute / unit.value, 2) + ' ' + unit.name;
  }
  return sign + absolute.toExponential(2).replace('e+', 'e');
}

export function formatMoney(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return value < 0 ? '-$∞' : '$∞';
  if (Math.abs(value) >= 1e6) return (value < 0 ? '-$' : '$') + formatNumbers(Math.abs(value));
  if (Math.abs(value) >= 1e4) return (value < 0 ? '-$' : '$') + trimFixed(Math.abs(value) / 1e3, 1) + 'K';
  return (value < 0 ? '-$' : '$') + Math.floor(Math.abs(value)).toLocaleString('en-US');
}

export function formatPrecise(amount) {
  if (amount >= 1e6) return formatMoney(amount);
  return '$' + (amount < 10 ? amount.toFixed(1) : amount.toLocaleString('en-US', { maximumFractionDigits: 0 }));
}

function owns(state, id) {
  return state.owned.includes(id);
}

function getBuyLabel(state, business, count, buyMode) {
  const verb = state.levels[business.id] ? 'Upgrade' : 'Buy';
  if (buyMode === 'max') return count > 0 ? verb + ' ×' + count : verb + ' Max';
  return count > 1 ? verb + ' ×' + count : verb;
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

export function renderTapComboProgress(lastTapAt, now = Date.now()) {
  const track = $('tapComboTrack');
  const fill = $('tapComboFill');
  if (!track || !fill) return;
  const active = lastTapAt > 0;
  if (prefersReducedMotion()) {
    track.setAttribute('aria-label', 'Tap combo active');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '1');
    track.setAttribute('aria-valuenow', active ? '1' : '0');
    track.setAttribute('aria-valuetext', active ? 'Tap combo active' : 'No active combo');
    fill.style.transition = 'none';
    fill.style.width = active ? '100%' : '0%';
    return;
  }
  const remaining = active ? Math.max(0, TAP_STREAK_WINDOW_MS - (now - lastTapAt)) : 0;
  track.setAttribute('aria-label', 'Tap combo time remaining');
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', String(TAP_STREAK_WINDOW_MS));
  track.setAttribute('aria-valuenow', String(remaining));
  track.setAttribute(
    'aria-valuetext',
    active ? (remaining / 1000).toFixed(1) + ' seconds remaining' : 'No active combo',
  );
}

export function renderTapCombo(multiplier, active, lastTapAt, now = Date.now()) {
  const label = $('tapComboLabel');
  const hint = $('tapComboHint');
  const fill = $('tapComboFill');
  if (!label || !hint || !fill) return;
  label.textContent = 'Tap combo ×' + multiplier.toFixed(1);
  hint.textContent = active ? 'Tap again before the bar empties' : 'Tap within 1.5 seconds to build a streak';
  renderTapComboProgress(lastTapAt, now);
  fill.style.transition = 'none';
  fill.style.width = active ? '100%' : '0%';
  void fill.offsetWidth;
  if (active && !prefersReducedMotion()) {
    fill.style.transition = '';
    fill.style.width = '0%';
  }
}

export function playTapAnimation() {
  const button = $('tapBtn');
  if (!button) return;
  button.classList.remove('tap-pop');
  void button.offsetWidth;
  button.classList.add('tap-pop');
}

export function showMessage(message) {
  const feed = $('feed');
  if (feed) feed.textContent = message;
}

function createElement(tagName, className = '', text = '') {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function syncChildren(container, children) {
  children.forEach((child, index) => {
    const current = container.children[index];
    if (current !== child) container.insertBefore(child, current || null);
  });
  while (container.children.length > children.length) {
    container.lastElementChild.remove();
  }
}

function createLegacyMilestoneRow(milestone) {
  const row = createElement('div', 'milestone');
  row.dataset.legacyMilestone = String(milestone.count);
  const check = createElement('div', 'check');
  const copy = createElement('div', 'milestone-copy');
  const title = createElement('b');
  const description = createElement('small');
  copy.append(title, description);
  const chip = createElement('span', 'chip');
  row.append(check, copy, chip);
  return row;
}

function renderLegacyMilestones(state) {
  const container = $('legacyPanel');
  const currentRows = new Map(
    Array.from(container.children).map((row) => [row.dataset.legacyMilestone, row]),
  );
  const rows = legacyMilestones.map((milestone) => {
    const id = String(milestone.count);
    const row = currentRows.get(id) || createLegacyMilestoneRow(milestone);
    const active = state.prestigeCount >= milestone.count;
    row.classList.toggle('done', active);
    row.querySelector('.check').textContent = active ? '✓' : String(milestone.count);
    row.querySelector('b').textContent = milestone.icon + ' ' + milestone.name;
    row.querySelector('small').textContent = milestone.desc;
    row.querySelector('.chip').textContent = active ? 'Unlocked' : 'Prestige ' + milestone.count;
    return row;
  });
  syncChildren(container, rows);

  const unlocked = legacyMilestones.filter((milestone) => state.prestigeCount >= milestone.count).length;
  container.setAttribute(
    'aria-label',
    unlocked + ' of ' + legacyMilestones.length + ' legacy milestones unlocked',
  );
}

function updateCompactUnlock(state, next) {
  const title = $('compactUnlockTitle');
  const detail = $('compactUnlockText');
  const bar = $('compactUnlockProgress');
  if (!next) {
    title.textContent = 'All businesses unlocked';
    detail.textContent = 'Your empire has reached every business.';
    bar.style.width = '100%';
    return;
  }
  const previous = businesses[businesses.indexOf(next) - 1];
  const start = previous ? previous.unlock : 0;
  const progress = Math.max(0, Math.min(100, ((state.lifetime - start) / (next.unlock - start)) * 100));
  title.textContent = 'Next: ' + next.icon + ' ' + next.name;
  detail.textContent =
    formatMoney(state.lifetime) + ' / ' + formatMoney(next.unlock) + ' lifetime earned · ' + Math.floor(progress) + '%';
  bar.style.width = progress + '%';
}

function updateEra(state) {
  const { current, next, progress } = getEraProgress(state);
  $('eraIcon').textContent = current.icon;
  $('eraName').textContent = current.name;
  $('eraDesc').textContent = current.desc;
  $('eraNext').textContent = next ? 'Next: ' + formatMoney(next.value) : 'All eras reached';
  $('eraProgress').style.width = progress + '%';
}

function updateUpgradeIndicator(state) {
  const indicator = $('upgradeAvailableIndicator');
  if (!indicator) return;
  const available = upgrades.some(
    (upgrade) =>
      !owns(state, upgrade.id) &&
      state.cash >= upgrade.cost &&
      (!upgrade.business || (state.levels[upgrade.business] || 0) >= upgrade.threshold),
  );
  indicator.hidden = !available;
  const nav = indicator.closest('[data-nav-target="upgrades"]');
  if (nav) nav.setAttribute('aria-label', available ? 'Upgrades — upgrade available' : 'Upgrades');
}

function updateSpecialButtons(state, now = Date.now()) {
  const active = now < state.boostUntil;
  const cooldown = now < state.boostCooldownUntil;
  const claimed = state.dailyClaimDate === localDateKey(now);
  $('boostBtn').disabled = active || cooldown;
  $('boostHint').textContent = active
    ? 'ACTIVE · ' + Math.ceil((state.boostUntil - now) / 1000) + ' sec'
    : cooldown
      ? 'Ready in ' + Math.ceil((state.boostCooldownUntil - now) / 1000) + ' sec'
      : '2× income for ' + (30 + getLegacyBoostSeconds(state)) + ' sec';
  $('dailyBtn').disabled = claimed;
  $('dailyHint').textContent = claimed
    ? 'Come back tomorrow · ' + (state.dailyStreak || 1) + '-day streak'
    : 'Claim ' +
      formatMoney(getDailyReward(state, calculateBaseIncome(state), now)) +
      ' · ' +
      (state.dailyClaimDate === yesterdayDateKey(now) ? (state.dailyStreak || 0) + 1 : 1) +
      '-day streak';
}

function updatePrestige(state) {
  const reward = getPrestigeReward(state);
  const eligible = state.lifetime >= PRESTIGE_THRESHOLD && reward > 0;
  $('prestigeTitle').textContent = state.prestigePoints
    ? 'Permanent boost: +' + state.prestigePoints * 10 + '% income'
    : 'Your next run can be stronger';
  $('prestigeDescription').textContent = eligible
    ? 'Prestige now to gain ' + reward + ' point' + (reward === 1 ? '' : 's') + '. Your cash, businesses, upgrades and goals reset.'
    : 'Reach ' +
      formatMoney(PRESTIGE_THRESHOLD) +
      ' lifetime earned in one run. Each prestige point adds 10% income permanently.';
  $('prestigeProgress').style.width = Math.min(100, (state.lifetime / PRESTIGE_THRESHOLD) * 100) + '%';
  $('prestigeBtn').disabled = !eligible;
  $('prestigeRewardLabel').textContent = eligible
    ? '+' + reward + ' prestige point' + (reward === 1 ? '' : 's')
    : formatMoney(Math.max(0, PRESTIGE_THRESHOLD - state.lifetime)) + ' to go';
}

export function renderTimedUI(state) {
  updateSpecialButtons(state);
  updatePrestige(state);
}

function createMissionRow(mission) {
  const row = document.createElement('div');
  row.className = 'mission';
  row.tabIndex = -1;
  row.dataset.missionId = mission.id;

  const icon = document.createElement('div');
  icon.className = 'mission-icon';
  icon.setAttribute('aria-hidden', 'true');

  const copy = document.createElement('div');
  copy.className = 'mission-copy';
  const title = document.createElement('b');
  const description = document.createElement('small');
  const track = document.createElement('div');
  track.className = 'progress-track';
  track.setAttribute('role', 'progressbar');
  const fill = document.createElement('div');
  fill.className = 'progress-fill';
  track.append(fill);
  const detail = document.createElement('small');
  detail.className = 'mission-progress';
  copy.append(title, description, track, detail);

  const button = document.createElement('button');
  button.className = 'buy';
  button.type = 'button';
  button.dataset.claimMission = mission.id;
  row.append(icon, copy, button);
  return row;
}

function renderDailyMissions(state) {
  const missions = getMissionDefinitions(state);
  const container = $('dailyMissions');
  const completed = missions.filter((mission) => state.missionClaimed.includes(mission.id)).length;
  $('missionSummary').textContent = completed + ' / ' + missions.length + ' complete';

  missions.forEach((mission) => {
    let row = Array.from(container.children).find((item) => item.dataset.missionId === mission.id);
    if (!row) {
      row = createMissionRow(mission);
      container.append(row);
    }

    const claimed = state.missionClaimed.includes(mission.id);
    const ready = mission.progress >= mission.target;
    const current = Math.max(0, Math.min(mission.target, mission.progress));
    const percent = Math.max(0, Math.min(100, (current / mission.target) * 100));
    row.classList.toggle('done', claimed);
    row.querySelector('.mission-icon').textContent = claimed ? '✓' : mission.icon;
    row.querySelector('.mission-copy b').textContent = mission.title;
    row.querySelector('.mission-copy > small').textContent = mission.desc;
    row.querySelector('.progress-fill').style.width = percent + '%';
    const track = row.querySelector('.progress-track');
    track.setAttribute('aria-label', mission.title + ' progress');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', String(mission.target));
    track.setAttribute('aria-valuenow', String(current));
    track.setAttribute('aria-valuetext', current + ' of ' + mission.target);
    row.querySelector('.mission-progress').textContent =
      current + ' / ' + mission.target + ' · Reward ' + formatMoney(mission.reward);
    const button = row.querySelector('button');
    button.disabled = !ready || claimed;
    button.textContent = claimed ? 'Done' : ready ? 'Claim' : 'In progress';
  });

  Array.from(container.children).forEach((row) => {
    if (!missions.some((mission) => mission.id === row.dataset.missionId)) row.remove();
  });

  const goal = goals.find((item) => !state.claimed.includes(item.id));
  if (goal) {
    const progress = Math.min(100, (state.lifetime / goal.value) * 100);
    $('longGoalTitle').textContent = goal.title;
    $('longGoalDetail').textContent = goal.desc + ' Reward: ' + formatMoney(goal.reward);
    $('longGoalProgressText').textContent = Math.floor(progress) + '%';
    $('longGoalProgress').style.width = progress + '%';
  } else {
    $('longGoalTitle').textContent = 'All long-term goals claimed';
    $('longGoalDetail').textContent = 'You have completed every lifetime milestone.';
    $('longGoalProgressText').textContent = '100%';
    $('longGoalProgress').style.width = '100%';
  }
}

function createBusinessRow(business) {
  const row = createElement('article', 'biz');
  row.dataset.businessRow = business.id;
  row.tabIndex = -1;

  const icon = createElement('div', 'biz-icon');
  icon.setAttribute('aria-hidden', 'true');
  const copy = createElement('div', 'biz-copy');
  const title = createElement('h3');
  const description = createElement('p', 'desc');
  const level = createElement('div', 'level');
  level.append(createElement('span', 'level-value'), createElement('span', 'unlock'));

  const progress = createElement('div', 'level-progress');
  const progressLabel = createElement('span', 'level-progress-label');
  const track = createElement('div', 'progress-track');
  track.append(createElement('div', 'progress-fill'));
  progress.append(progressLabel, track);
  copy.append(title, description, level, progress);

  const button = createElement('button', 'buy');
  button.type = 'button';
  button.append(createElement('span', 'buy-label'), createElement('span', 'price'));
  row.append(icon, copy, button);
  return row;
}

function updateBusinessRow(row, business, state, buyMode) {
  const level = state.levels[business.id] || 0;
  const unlocked = state.lifetime >= business.unlock || level > 0;
  const count = calculateBuyQuantity(state, business, buyMode);
  const price = calculatePurchaseCost(state, business, count || 1);
  const affordable = count > 0 && (buyMode === 'max' || state.cash >= price);
  const rate = calculateBusinessIncome(state, business);
  const nextTier = tierThresholds.find((threshold) => threshold > level);
  const canAffordNext = state.cash >= calculatePurchaseCost(state, business, 1) && unlocked;

  row.classList.toggle('locked', !unlocked);
  row.classList.toggle('affordable', canAffordNext);
  row.querySelector('.biz-icon').textContent = business.icon;
  row.querySelector('h3').textContent = business.name;
  row.querySelector('.desc').textContent = business.desc;
  row.querySelector('.level-value').textContent = level
    ? 'Level ' + level + ' · ' + formatPrecise(rate) + '/s' +
      (nextTier ? ' · ×2 at ' + nextTier : ' · All tiers reached')
    : '';
  row.querySelector('.unlock').textContent = level
    ? ''
    : 'Unlock at ' + formatMoney(business.unlock) + ' lifetime earned';

  const progress = Math.max(0, Math.min(100, (state.lifetime / Math.max(1, business.unlock)) * 100));
  const progressRow = row.querySelector('.level-progress');
  progressRow.hidden = unlocked;
  progressRow.querySelector('.level-progress-label').textContent = Math.floor(progress) + '%';
  progressRow.querySelector('.progress-fill').style.width = progress + '%';

  const button = row.querySelector('[data-buy]') || row.querySelector('button');
  button.dataset.buy = business.id;
  button.disabled = !unlocked || !affordable;
  button.querySelector('.buy-label').textContent = getBuyLabel(state, business, count, buyMode);
  button.querySelector('.price').textContent = formatMoney(price);
}

function renderBusinesses(state, buyMode, showAllBusinesses) {
  const container = $('businesses');
  const ownedBusinesses = businesses.filter((business) => (state.levels[business.id] || 0) > 0);
  const nextAvailable = businesses
    .filter((business) => state.lifetime >= business.unlock && (state.levels[business.id] || 0) === 0)
    .slice(0, 2);
  const nextLocked = businesses
    .filter((business) => state.lifetime < business.unlock && (state.levels[business.id] || 0) === 0)
    .slice(0, 2);
  const visible = showAllBusinesses
    ? businesses
    : [...new Set([...ownedBusinesses, ...nextAvailable, ...nextLocked])].sort(
        (first, second) => businesses.indexOf(first) - businesses.indexOf(second),
      );
  const existing = new Map(
    Array.from(container.children)
      .filter((row) => row.dataset.businessRow)
      .map((row) => [row.dataset.businessRow, row]),
  );
  const rows = visible.map((business) => {
    const row = existing.get(business.id) || createBusinessRow(business);
    updateBusinessRow(row, business, state, buyMode);
    return row;
  });

  let moreButton = container.querySelector('.biz-more');
  const shouldShowMore = businesses.length > visible.length;
  if (showAllBusinesses || shouldShowMore) {
    if (!moreButton) {
      moreButton = createElement('button', 'biz-more');
      moreButton.type = 'button';
    }
    moreButton.id = showAllBusinesses ? 'showFewerBusinesses' : 'showAllBusinesses';
    moreButton.setAttribute('aria-controls', 'businesses');
    moreButton.setAttribute('aria-expanded', String(showAllBusinesses));
    moreButton.textContent = showAllBusinesses
      ? 'Show fewer businesses'
      : 'Show all ' + businesses.length + ' businesses · ' + visible.length + ' shown';
    rows.push(moreButton);
  }
  syncChildren(container, rows);
}

function createUpgradeButton(upgrade) {
  const button = createElement('button', 'upgrade');
  button.type = 'button';
  button.dataset.upgrade = upgrade.id;
  const icon = createElement('span', 'u-icon');
  icon.setAttribute('aria-hidden', 'true');
  button.append(icon, createElement('b'), createElement('small'), createElement('span', 'u-price'));
  return button;
}

function renderUpgrades(state) {
  const container = $('upgrades');
  const visible = upgrades.filter(
    (upgrade) =>
      !upgrade.business ||
      upgrade.threshold == null ||
      (state.levels[upgrade.business] || 0) >= upgrade.threshold ||
      owns(state, upgrade.id),
  );
  const existing = new Map(
    Array.from(container.children).map((button) => [button.dataset.upgrade, button]),
  );
  const rows = visible.map((upgrade) => {
    const button = existing.get(upgrade.id) || createUpgradeButton(upgrade);
    const ownedUpgrade = owns(state, upgrade.id);
    const level = upgrade.business ? state.levels[upgrade.business] || 0 : 0;
    const locked = Boolean(upgrade.business && level < upgrade.threshold);
    button.classList.toggle('owned', ownedUpgrade);
    button.classList.toggle('locked-tier', locked);
    button.querySelector('.u-icon').textContent = upgrade.icon;
    button.querySelector('b').textContent = upgrade.name;
    button.querySelector('small').textContent = upgrade.desc;
    button.querySelector('.u-price').textContent = ownedUpgrade
      ? '✓ Purchased'
      : locked
        ? 'Own ' + upgrade.threshold + ' · ' + formatMoney(upgrade.cost)
        : formatMoney(upgrade.cost);
    button.disabled = ownedUpgrade || locked || state.cash < upgrade.cost;
    return button;
  });
  syncChildren(container, rows);
}

function createGoalRow(goal) {
  const row = createElement('div', 'milestone');
  row.dataset.goalRow = goal.id;
  row.tabIndex = -1;
  const check = createElement('div', 'check');
  const copy = createElement('div', 'milestone-copy');
  const title = createElement('b');
  const description = createElement('small');
  const track = createElement('div', 'progress-track');
  track.append(createElement('div', 'progress-fill'));
  copy.append(title, description, track);
  const button = createElement('button', 'buy');
  button.type = 'button';
  button.dataset.claim = goal.id;
  button.append(createElement('span', 'claim-label'), createElement('span', 'price'));
  row.append(check, copy, button);
  return row;
}

function renderGoals(state) {
  const container = $('milestones');
  const existing = new Map(
    Array.from(container.children).map((row) => [row.dataset.goalRow, row]),
  );
  const rows = goals.map((goal) => {
    const row = existing.get(goal.id) || createGoalRow(goal);
    const done = state.lifetime >= goal.value;
    const claimed = state.claimed.includes(goal.id);
    const progress = Math.min(100, (state.lifetime / goal.value) * 100);
    row.classList.toggle('done', claimed);
    row.querySelector('.check').textContent = claimed ? '✓' : done ? '!' : '·';
    row.querySelector('b').textContent = goal.title;
    row.querySelector('small').textContent = goal.desc;
    row.querySelector('.progress-fill').style.width = progress + '%';
    const button = row.querySelector('[data-claim]');
    button.disabled = !done || claimed;
    button.querySelector('.claim-label').textContent = claimed ? 'Claimed' : done ? 'Claim' : 'Reward';
    button.querySelector('.price').textContent = formatMoney(goal.reward);
    return row;
  });
  syncChildren(container, rows);
}

function createBusinessMilestoneRow(milestone) {
  const row = createElement('div', 'milestone');
  row.dataset.businessMilestoneRow = milestone.id;
  row.tabIndex = -1;
  const check = createElement('div', 'check');
  const copy = createElement('div', 'milestone-copy');
  const title = createElement('b');
  const description = createElement('small');
  const track = createElement('div', 'progress-track');
  track.append(createElement('div', 'progress-fill'));
  const note = createElement('small', 'business-milestone-note');
  copy.append(title, description, track, note);
  const button = createElement('button', 'buy');
  button.type = 'button';
  button.dataset.claimBusinessMilestone = milestone.id;
  button.append(createElement('span', 'claim-label'), createElement('span', 'price'));
  row.append(check, copy, button);
  return row;
}

function renderBusinessMilestones(state) {
  const container = $('businessMilestones');
  const totalLevels = getTotalBusinessLevels(state);
  const claimedMilestones = state.businessMilestonesClaimed || [];
  const existing = new Map(
    Array.from(container.children).map((row) => [row.dataset.businessMilestoneRow, row]),
  );
  const rows = businessMilestones.map((milestone) => {
    const row = existing.get(milestone.id) || createBusinessMilestoneRow(milestone);
    const done = totalLevels >= milestone.levels;
    const claimed = claimedMilestones.includes(milestone.id);
    const progress = Math.min(100, (totalLevels / milestone.levels) * 100);
    row.classList.toggle('done', claimed);
    row.querySelector('.check').textContent = claimed ? '✓' : done ? '!' : milestone.icon;
    row.querySelector('b').textContent = milestone.title;
    row.querySelector('small').textContent = milestone.desc;
    row.querySelector('.progress-fill').style.width = progress + '%';
    row.querySelector('.business-milestone-note').textContent =
      Math.min(totalLevels, milestone.levels) + ' / ' + milestone.levels + ' total levels';
    const button = row.querySelector('[data-claim-business-milestone]');
    button.disabled = !done || claimed;
    button.querySelector('.claim-label').textContent = claimed ? 'Claimed' : done ? 'Claim' : 'Reward';
    button.querySelector('.price').textContent = formatMoney(milestone.reward);
    return row;
  });
  syncChildren(container, rows);
}

export function renderGame(state, options = {}) {
  const buyMode = options.buyMode || '1';
  const showAllBusinesses = Boolean(options.showAllBusinesses);
  renderDailyMissions(state);

  $('cash').textContent = formatMoney(state.cash);
  $('income').textContent = '+' + formatPrecise(calculateIncome(state)) + ' / second';
  $('lifetime').textContent = formatMoney(state.lifetime);
  $('businessCount').textContent = businesses.reduce(
    (sum, business) => sum + (state.levels[business.id] || 0),
    0,
  );
  const rank = getRank(state);
  $('empireLevel').textContent = String(ranks.indexOf(rank) + 1);
  $('rankChip').textContent = rank.icon + ' ' + rank.name;
  $('multiplierChip').textContent =
    '⚡ Income ×' + calculateIncomeMultiplier(state).toLocaleString('en-US', { maximumFractionDigits: 2 });
  $('tapHint').textContent =
    'Each tap earns ' + formatMoney(Math.max(1, Math.floor(calculateTapMultiplier(state)))) +
    ' · chain taps for a bigger payout';

  const next = businesses.find((business) => state.lifetime < business.unlock && business.id !== 'lemonade');
  $('nextUnlock').textContent = next ? 'Next unlock: ' + formatMoney(next.unlock) : 'All businesses unlocked';
  updateEra(state);
  updateCompactUnlock(state, next);

  renderBusinesses(state, buyMode, showAllBusinesses);

  document.querySelectorAll('[data-buy-mode]').forEach((button) => {
    const active = button.dataset.buyMode === buyMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  renderUpgrades(state);
  renderGoals(state);
  renderBusinessMilestones(state);
  renderTimedUI(state);
  renderLegacyMilestones(state);
  updateUpgradeIndicator(state);
}

export function renderLiveUI(state, options = {}) {
  const buyMode = options.buyMode || '1';
  const showAllBusinesses = Boolean(options.showAllBusinesses);
  renderDailyMissions(state);
  $('cash').textContent = formatMoney(state.cash);
  $('income').textContent = '+' + formatPrecise(calculateIncome(state)) + ' / second';
  $('lifetime').textContent = formatMoney(state.lifetime);
  $('businessCount').textContent = businesses.reduce(
    (sum, business) => sum + (state.levels[business.id] || 0),
    0,
  );
  const rank = getRank(state);
  $('empireLevel').textContent = String(ranks.indexOf(rank) + 1);
  $('rankChip').textContent = rank.icon + ' ' + rank.name;
  const next = businesses.find((business) => state.lifetime < business.unlock && business.id !== 'lemonade');
  $('nextUnlock').textContent = next ? 'Next unlock: ' + formatMoney(next.unlock) : 'All businesses unlocked';
  updateEra(state);
  updateCompactUnlock(state, next);
  renderBusinesses(state, buyMode, showAllBusinesses);
  renderUpgrades(state);
  renderGoals(state);
  renderBusinessMilestones(state);
  updateUpgradeIndicator(state);

  renderTimedUI(state);
}

