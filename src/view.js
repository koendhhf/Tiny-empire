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

function renderLegacyMilestones(state) {
  const unlocked = legacyMilestones.filter((milestone) => state.prestigeCount >= milestone.count).length;
  $('legacyPanel').innerHTML = legacyMilestones
    .map((milestone) => {
      const active = state.prestigeCount >= milestone.count;
      return (
        '<div class="milestone ' +
        (active ? 'done' : '') +
        '"><div class="check">' +
        (active ? '✓' : milestone.count) +
        '</div><div style="min-width:0;flex:1"><b>' +
        milestone.icon +
        ' ' +
        milestone.name +
        '</b><small>' +
        milestone.desc +
        '</small></div><span class="chip">' +
        (active ? 'Unlocked' : 'Prestige ' + milestone.count) +
        '</span></div>'
      );
    })
    .join('');
  $('legacyPanel').setAttribute(
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

function renderDailyMissions(state) {
  const missions = getMissionDefinitions(state);
  const completed = missions.filter((mission) => state.missionClaimed.includes(mission.id)).length;
  $('missionSummary').textContent = completed + ' / ' + missions.length + ' complete';
  $('dailyMissions').innerHTML = missions
    .map((mission) => {
      const claimed = state.missionClaimed.includes(mission.id);
      const ready = mission.progress >= mission.target;
      return (
        '<div class="mission ' +
        (claimed ? 'done' : '') +
        '"><div class="mission-icon" aria-hidden="true">' +
        (claimed ? '✓' : mission.icon) +
        '</div><div class="mission-copy"><b>' +
        mission.title +
        '</b><small>' +
        mission.desc +
        '</small><div class="progress-track"><div class="progress-fill" style="width:' +
        Math.min(100, (mission.progress / mission.target) * 100) +
        '%"></div></div><small>' +
        Math.min(mission.progress, mission.target) +
        ' / ' +
        mission.target +
        ' · Reward ' +
        formatMoney(mission.reward) +
        '</small></div><button class="buy" data-claim-mission="' +
        mission.id +
        '" ' +
        (!ready || claimed ? 'disabled' : '') +
        '>' +
        (claimed ? 'Done' : ready ? 'Claim' : 'In progress') +
        '</button></div>'
      );
    })
    .join('');

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

  const ownedBusinesses = businesses.filter((business) => (state.levels[business.id] || 0) > 0);
  const nextAvailable = businesses
    .filter((business) => state.lifetime >= business.unlock && (state.levels[business.id] || 0) === 0)
    .slice(0, 2);
  const nextLocked = businesses
    .filter((business) => state.lifetime < business.unlock && (state.levels[business.id] || 0) === 0)
    .slice(0, 2);
  const visibleBusinesses = showAllBusinesses
    ? businesses
    : [...new Set([...ownedBusinesses, ...nextAvailable, ...nextLocked])].sort(
        (first, second) => businesses.indexOf(first) - businesses.indexOf(second),
      );
  $('businesses').innerHTML =
    visibleBusinesses
      .map((business) => {
        const level = state.levels[business.id] || 0;
        const unlocked = state.lifetime >= business.unlock || level > 0;
        const count = calculateBuyQuantity(state, business, buyMode);
        const price = calculatePurchaseCost(state, business, count || 1);
        const affordable = count > 0 && (buyMode === 'max' || state.cash >= price);
        const rate = calculateBusinessIncome(state, business);
        const nextTier = tierThresholds.find((threshold) => threshold > level);
        const canAffordNext = state.cash >= calculatePurchaseCost(state, business, 1) && unlocked;
        const levelText = level
          ? 'Level ' +
            level +
            ' · ' +
            formatPrecise(rate) +
            '/s' +
            (nextTier ? ' · ×2 at ' + nextTier : ' · All tiers reached')
          : '<span class="unlock">Unlock at ' + formatMoney(business.unlock) + ' lifetime earned</span>';
        const progress = Math.min(100, (state.lifetime / Math.max(1, business.unlock)) * 100);
        return (
          '<article class="biz ' +
          (!unlocked ? 'locked ' : '') +
          (canAffordNext ? 'affordable' : '') +
          '"><div class="biz-icon" aria-hidden="true">' +
          business.icon +
          '</div><div><h3>' +
          business.name +
          '</h3><p class="desc">' +
          business.desc +
          '</p><div class="level">' +
          levelText +
          '</div>' +
          (!unlocked
            ? '<div class="level-progress"><span>' +
              Math.floor(progress) +
              '%</span><div class="progress-track"><div class="progress-fill" style="width:' +
              progress +
              '%"></div></div></div>'
            : '') +
          '</div><button class="buy" data-buy="' +
          business.id +
          '" ' +
          (!unlocked || !affordable ? 'disabled' : '') +
          '><span class="buy-label">' +
          getBuyLabel(state, business, count, buyMode) +
          '</span><span class="price">' +
          formatMoney(price) +
          '</span></button></article>'
        );
      })
      .join('') +
    (!showAllBusinesses && businesses.length > visibleBusinesses.length
      ? '<button type="button" class="biz-more" id="showAllBusinesses">Show all ' +
        businesses.length +
        ' businesses · ' +
        visibleBusinesses.length +
        ' shown</button>'
      : showAllBusinesses
        ? '<button type="button" class="biz-more" id="showFewerBusinesses">Show fewer businesses</button>'
        : '');

  document.querySelectorAll('[data-buy-mode]').forEach((button) => {
    const active = button.dataset.buyMode === buyMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  $('upgrades').innerHTML = upgrades
    .filter(
      (upgrade) =>
        !upgrade.business ||
        upgrade.threshold == null ||
        (state.levels[upgrade.business] || 0) >= upgrade.threshold ||
        owns(state, upgrade.id),
    )
    .map((upgrade) => {
      const has = owns(state, upgrade.id);
      const level = upgrade.business ? state.levels[upgrade.business] || 0 : 0;
      const locked = Boolean(upgrade.business && level < upgrade.threshold);
      return (
        '<button class="upgrade ' +
        (has ? 'owned' : '') +
        ' ' +
        (locked ? 'locked-tier' : '') +
        '" data-upgrade="' +
        upgrade.id +
        '" ' +
        (has || locked || state.cash < upgrade.cost ? 'disabled' : '') +
        '><span class="u-icon" aria-hidden="true">' +
        upgrade.icon +
        '</span><b>' +
        upgrade.name +
        '</b><small>' +
        upgrade.desc +
        '</small><span class="u-price">' +
        (has ? '✓ Purchased' : locked ? 'Own ' + upgrade.threshold + ' · ' + formatMoney(upgrade.cost) : formatMoney(upgrade.cost)) +
        '</span></button>'
      );
    })
    .join('');

  $('milestones').innerHTML = goals
    .map((goal) => {
      const done = state.lifetime >= goal.value;
      const claimed = state.claimed.includes(goal.id);
      const progress = Math.min(100, (state.lifetime / goal.value) * 100);
      return (
        '<div class="milestone ' +
        (claimed ? 'done' : '') +
        '"><div class="check">' +
        (claimed ? '✓' : done ? '!' : '·') +
        '</div><div style="min-width:0;flex:1"><b>' +
        goal.title +
        '</b><small>' +
        goal.desc +
        '</small><div class="progress-track"><div class="progress-fill" data-goal-progress="' +
        goal.id +
        '" style="width:' +
        progress +
        '%"></div></div></div><button class="buy" data-claim="' +
        goal.id +
        '" ' +
        (!done || claimed ? 'disabled' : '') +
        '>' +
        (claimed ? 'Claimed' : done ? 'Claim' : 'Reward') +
        '<span class="price">' +
        formatMoney(goal.reward) +
        '</span></button></div>'
      );
    })
    .join('');

  const totalLevels = getTotalBusinessLevels(state);
  $('businessMilestones').innerHTML = businessMilestones
    .map((milestone) => {
      const done = totalLevels >= milestone.levels;
      const claimed = (state.businessMilestonesClaimed || []).includes(milestone.id);
      const progress = Math.min(100, (totalLevels / milestone.levels) * 100);
      return (
        '<div class="milestone ' +
        (claimed ? 'done' : '') +
        '"><div class="check">' +
        (claimed ? '✓' : done ? '!' : milestone.icon) +
        '</div><div style="min-width:0;flex:1"><b>' +
        milestone.title +
        '</b><small>' +
        milestone.desc +
        '</small><div class="progress-track"><div class="progress-fill" style="width:' +
        progress +
        '%"></div></div><small class="business-milestone-note">' +
        Math.min(totalLevels, milestone.levels) +
        ' / ' +
        milestone.levels +
        ' total levels</small></div><button class="buy" data-claim-business-milestone="' +
        milestone.id +
        '" ' +
        (!done || claimed ? 'disabled' : '') +
        '>' +
        (claimed ? 'Claimed' : done ? 'Claim' : 'Reward') +
        '<span class="price">' +
        formatMoney(milestone.reward) +
        '</span></button></div>'
      );
    })
    .join('');

  renderTimedUI(state);
  renderLegacyMilestones(state);
  updateUpgradeIndicator(state);
}

export function renderLiveUI(state, options = {}) {
  const buyMode = options.buyMode || '1';
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

  document.querySelectorAll('[data-buy]').forEach((button) => {
    const business = businesses.find((item) => item.id === button.dataset.buy);
    if (business) {
      const level = state.levels[business.id] || 0;
      const count = calculateBuyQuantity(state, business, buyMode);
      const total = calculatePurchaseCost(state, business, count || 1);
      const affordable = count > 0 && (buyMode === 'max' || state.cash >= total);
      const unlocked = state.lifetime >= business.unlock || level > 0;
      const canAffordNext = state.cash >= calculatePurchaseCost(state, business, 1) && unlocked;
      button.closest('.biz')?.classList.toggle('affordable', canAffordNext);
      button.disabled = !affordable || (!level && state.lifetime < business.unlock);
      const label = button.querySelector('.buy-label');
      const price = button.querySelector('.price');
      if (label) label.textContent = getBuyLabel(state, business, count, buyMode);
      if (price) price.textContent = formatMoney(total);
    }
  });

  document.querySelectorAll('[data-upgrade]').forEach((button) => {
    const upgrade = upgrades.find((item) => item.id === button.dataset.upgrade);
    if (upgrade) button.disabled = owns(state, upgrade.id) || state.cash < upgrade.cost;
  });
  updateUpgradeIndicator(state);

  document.querySelectorAll('[data-claim]').forEach((button) => {
    const goal = goals.find((item) => item.id === button.dataset.claim);
    if (goal) button.disabled = state.lifetime < goal.value || state.claimed.includes(goal.id);
  });
  document.querySelectorAll('[data-goal-progress]').forEach((bar) => {
    const goal = goals.find((item) => item.id === bar.dataset.goalProgress);
    if (goal) bar.style.width = Math.min(100, (state.lifetime / goal.value) * 100) + '%';
  });

  renderTimedUI(state);
}

