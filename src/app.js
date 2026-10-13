import {
  businesses,
  upgrades,
  goals,
  PRESTIGE_THRESHOLD,
  TAP_STREAK_WINDOW_MS,
  TAP_STREAK_MAX_FOLLOWUPS,
  TAP_STREAK_INCREMENT,
  TAP_STREAK_PROGRESS_INTERVAL_MS,
} from './data.js';
import {
  SAVE_KEY,
  createInitialState,
  loadState,
  saveState,
  serializeSave,
  parseImportedSave,
} from './state.js';
import {
  calculateBaseIncome,
  calculateOfflineEarnings,
  addEarnings,
  collectPassiveIncome,
  collectCash,
  purchaseBusiness,
  purchaseUpgrade,
  activateRush,
} from './economy.js';
import {
  localDateKey,
  ensureDailyMissions,
  getPrestigeReward,
  claimMission,
  claimGoal,
  claimBusinessMilestone,
  recordTap,
  recordLevelsPurchased,
  recordRush,
  claimDailyBonus,
  resetForPrestige,
} from './progression.js';
import {
  formatMoney,
  formatPrecise,
  renderTapComboProgress,
  renderTapCombo,
  playTapAnimation,
  renderGame,
  renderLiveUI,
  renderTimedUI,
  showMessage,
} from './view.js';

let state = createInitialState();
let lastTick = Date.now();
let feedTimer = null;
let showAllBusinesses = false;
let buyMode = '1';
let tapStreakFollowUps = 0;
let tapStreakLastAt = 0;
let tapStreakTimer = null;
let tapStreakProgressTimer = null;
let offlineMessage = '';

const $ = (id) => document.getElementById(id);

function saveGame() {
  if (window._importingSave) return;
  const result = saveState(state, () => localStorage, Date.now());
  if (!result.ok) showStatus('Could not save on this device. Check your browser storage settings.');
}

function showStatus(message) {
  showMessage(message);
  if (feedTimer) clearTimeout(feedTimer);
  feedTimer = setTimeout(() => showMessage(''), 6500);
}

function loadGame() {
  state = loadState(
    () => localStorage,
    { businesses, upgrades, goals },
    Date.now(),
  );
  const { earned } = calculateOfflineEarnings(state, Date.now());
  if (earned >= 0.1) {
    addEarnings(state, earned);
    offlineMessage = 'Welcome back! Your businesses earned ' + formatPrecise(earned) + ' while you were away.';
  }
}

function render() {
  const focusedAction = captureRenderFocus();
  ensureDailyMissions(state, Date.now());
  renderGame(state, { buyMode, showAllBusinesses });
  restoreRenderFocus(focusedAction);
}

function captureRenderFocus() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return null;
  if (active.id === 'showAllBusinesses') return { id: 'showFewerBusinesses' };
  if (active.id === 'showFewerBusinesses') return { id: 'showAllBusinesses' };

  for (const attribute of [
    'data-buy',
    'data-upgrade',
    'data-claim',
    'data-claim-business-milestone',
    'data-claim-mission',
  ]) {
    if (active.hasAttribute(attribute)) {
      return { attribute, value: active.getAttribute(attribute) };
    }
  }
  return null;
}

function restoreRenderFocus(target) {
  if (!target) return;
  if (target.id) {
    document.getElementById(target.id)?.focus({ preventScroll: true });
    return;
  }

  const selectors = {
    'data-buy': '[data-buy]',
    'data-upgrade': '[data-upgrade]',
    'data-claim': '[data-claim]',
    'data-claim-business-milestone': '[data-claim-business-milestone]',
    'data-claim-mission': '[data-claim-mission]',
  };
  const action = Array.from(document.querySelectorAll(selectors[target.attribute] || ''))
    .find((element) => element.getAttribute(target.attribute) === target.value);
  if (action && !action.disabled) {
    action.focus({ preventScroll: true });
    return;
  }

  const fallback = action?.closest('.biz, .milestone, .mission') || $('#upgrades');
  fallback?.focus({ preventScroll: true });
}

function updateLiveUI() {
  renderLiveUI(state, { buyMode });
}

function updateTapComboProgress() {
  renderTapComboProgress(tapStreakLastAt, Date.now());
}

function resetTapStreak() {
  if (tapStreakTimer) clearTimeout(tapStreakTimer);
  if (tapStreakProgressTimer) clearInterval(tapStreakProgressTimer);
  tapStreakTimer = null;
  tapStreakProgressTimer = null;
  tapStreakFollowUps = 0;
  tapStreakLastAt = 0;
  renderTapCombo(1, false, tapStreakLastAt);
}

function registerTapStreakTap(now = Date.now()) {
  const continues =
    tapStreakLastAt > 0 && now >= tapStreakLastAt && now - tapStreakLastAt < TAP_STREAK_WINDOW_MS;
  tapStreakFollowUps = continues
    ? Math.min(TAP_STREAK_MAX_FOLLOWUPS, tapStreakFollowUps + 1)
    : 0;
  tapStreakLastAt = now;
  const multiplier = 1 + tapStreakFollowUps * TAP_STREAK_INCREMENT;
  if (tapStreakTimer) clearTimeout(tapStreakTimer);
  if (tapStreakProgressTimer) clearInterval(tapStreakProgressTimer);
  renderTapCombo(multiplier, true, tapStreakLastAt, now);
  tapStreakTimer = setTimeout(resetTapStreak, TAP_STREAK_WINDOW_MS);
  tapStreakProgressTimer = setInterval(updateTapComboProgress, TAP_STREAK_PROGRESS_INTERVAL_MS);
  return multiplier;
}

function collect() {
  ensureDailyMissions(state, Date.now());
  const oldLifetime = state.lifetime;
  const comboMultiplier = registerTapStreakTap();
  const result = collectCash(state, comboMultiplier);
  recordTap(state);
  playTapAnimation();
  const unlockedBusiness = businesses.some(
    (business) => oldLifetime < business.unlock && state.lifetime >= business.unlock,
  );
  if (unlockedBusiness) render();
  else updateLiveUI();
  saveGame();
  showStatus(
    'Nice! You collected ' + formatMoney(result.gain) + '. Combo multiplier: ' +
      comboMultiplier.toFixed(1) + 'x. Keep it growing!',
  );
}

function buy(id) {
  const result = purchaseBusiness(state, id, buyMode);
  if (!result.changed) return;
  ensureDailyMissions(state, Date.now());
  recordLevelsPurchased(state, result.count);
  render();
  saveGame();
  showStatus(
    result.business.name + ' upgraded ' + result.count + ' level' +
      (result.count === 1 ? '' : 's') + ' for ' + formatMoney(result.price) +
      '. Your empire is growing!',
  );
}

function buyUpgrade(id) {
  const result = purchaseUpgrade(state, id);
  if (!result.changed) return;
  render();
  saveGame();
  showStatus(result.upgrade.name + ' purchased! ' + result.upgrade.desc);
}

function collectMission(id) {
  ensureDailyMissions(state, Date.now());
  const result = claimMission(state, id, Date.now());
  if (!result.changed) return;
  render();
  saveGame();
  showStatus(
    'Daily mission complete: ' + result.mission.title + '! ' +
      formatMoney(result.reward) + ' bonus added.',
  );
}

function collectGoal(id) {
  const result = claimGoal(state, id);
  if (!result.changed) return;
  render();
  saveGame();
  showStatus(
    'Goal complete: ' + result.goal.title + '! Bonus ' +
      formatMoney(result.goal.reward) + ' added to your cash.',
  );
}

function collectBusinessMilestone(id) {
  const result = claimBusinessMilestone(state, id);
  if (!result.changed) return;
  render();
  saveGame();
  showStatus(
    'Business milestone complete: ' + result.milestone.title + '! ' +
      formatMoney(result.milestone.reward) + ' bonus cash and a permanent ' +
      Math.round(result.milestone.bonus * 100) + '% income boost for this run.',
  );
}

function startBoost() {
  const now = Date.now();
  const result = activateRush(state, now);
  if (!result.changed) return;
  ensureDailyMissions(state, now);
  recordRush(state);
  render();
  saveGame();
  showStatus('Rush Hour is on! Your business income is doubled for 30 seconds.');
}

function collectDaily() {
  const result = claimDailyBonus(state, calculateBaseIncome(state), Date.now());
  if (!result.changed) return;
  render();
  saveGame();
  showStatus(
    'Daily delivery collected: ' + formatMoney(result.reward) + '! Day ' +
      result.streak + ' streak. Return tomorrow to keep your streak and grow the bonus.',
  );
}

function prestige() {
  const reward = getPrestigeReward(state);
  if (state.lifetime < PRESTIGE_THRESHOLD || reward < 1) return;
  const confirmed = confirm(
    'Prestige for ' + reward + ' permanent point' + (reward === 1 ? '' : 's') +
      '? Cash, business levels, upgrades and goals reset. Your permanent prestige bonus will be ' +
      ((state.prestigePoints + reward) * 10) + '%.',
  );
  if (!confirmed) return;
  const result = resetForPrestige(state, Date.now());
  if (!result.changed) return;
  state = result.state;
  lastTick = Date.now();
  render();
  saveGame();
  showStatus(
    'Prestige complete! Your next empire earns ' + (result.points * 10) +
      '% more business income permanently.',
  );
}

function exportSave() {
  saveGame();
  const blob = new Blob([serializeSave(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'tiny-empire-save-' + localDateKey() + '.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showStatus('Save backup exported. Keep the JSON file somewhere safe.');
}

function importSave(event) {
  const file = event.target.files && event.target.files[0];
  event.target.value = '';
  if (!file) return;
  if (file.size > 100000) {
    showStatus('That save file is too large to import.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = parseImportedSave(String(reader.result || ''));
      if (
        !confirm(
          'Import this save and replace progress on this device?\n\n' +
            'Lifetime earned: ' + formatMoney(imported.lifetime) + '\n' +
            'Current cash: ' + formatMoney(imported.cash) + '\n' +
            'Prestige points: ' + imported.prestigePoints + '\n\n' +
            'Export your current save first if you want to keep it.',
        )
      ) {
        return;
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(imported));
      window._importingSave = true;
      location.reload();
    } catch {
      showStatus('Could not import that save. Choose a valid Tiny Empire JSON backup.');
    }
  };
  reader.onerror = () => showStatus('Could not read that file. Please try again.');
  reader.readAsText(file);
}

function resetGame() {
  if (!confirm('Start a brand-new empire? This will erase your saved progress on this device.')) return;
  state = createInitialState();
  state.missionTargets = null;
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // The next normal save will report storage errors through the game feed.
  }
  render();
  showStatus('Fresh start! Build your tiny empire.');
}

function handleDelegatedClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const action = target.closest(
    '[data-buy], [data-upgrade], [data-claim], [data-claim-business-milestone], [data-claim-mission], #showAllBusinesses, #showFewerBusinesses',
  );
  if (!action || action.disabled) return;

  if (action.matches('#showAllBusinesses')) {
    showAllBusinesses = true;
    render();
  } else if (action.matches('#showFewerBusinesses')) {
    showAllBusinesses = false;
    render();
  } else if (action.hasAttribute('data-buy')) {
    buy(action.dataset.buy);
  } else if (action.hasAttribute('data-upgrade')) {
    buyUpgrade(action.dataset.upgrade);
  } else if (action.hasAttribute('data-claim')) {
    collectGoal(action.dataset.claim);
  } else if (action.hasAttribute('data-claim-business-milestone')) {
    collectBusinessMilestone(action.dataset.claimBusinessMilestone);
  } else if (action.hasAttribute('data-claim-mission')) {
    collectMission(action.dataset.claimMission);
  }
}

function isEditableTarget(target) {
  return Boolean(
    target &&
      target.closest &&
      target.closest(
        'input,textarea,select,[contenteditable="true"],[contenteditable=""],[contenteditable="plaintext-only"]',
      ),
  );
}

function bindInputSuppression() {
  ['contextmenu', 'selectstart', 'copy', 'cut', 'dragstart', 'dblclick'].forEach((type) => {
    document.addEventListener(type, (event) => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    });
  });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((type) => {
    document.addEventListener(
      type,
      (event) => {
        if (!isEditableTarget(event.target)) event.preventDefault();
      },
      { passive: false },
    );
  });

  let touchStartY = 0;
  document.addEventListener(
    'touchstart',
    (event) => {
      if (event.touches.length === 1) touchStartY = event.touches[0].clientY;
    },
    { passive: true },
  );
  document.addEventListener(
    'touchmove',
    (event) => {
      if (
        event.touches.length === 1 &&
        window.scrollY <= 0 &&
        event.touches[0].clientY > touchStartY &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
      }
    },
    { passive: false },
  );
}

function bindControls() {
  document.addEventListener('click', handleDelegatedClick);
  document.querySelectorAll('[data-buy-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      buyMode = button.dataset.buyMode;
      render();
    });
  });

  $('exportSaveBtn').addEventListener('click', exportSave);
  $('importSaveBtn').addEventListener('click', () => $('importSaveFile').click());
  $('importSaveFile').addEventListener('change', importSave);
  $('tapBtn').addEventListener('click', collect);
  $('prestigeBtn').addEventListener('click', prestige);
  $('boostBtn').addEventListener('click', startBoost);
  $('dailyBtn').addEventListener('click', collectDaily);
  $('resetBtn').addEventListener('click', resetGame);

  document.querySelectorAll('[data-nav-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.navTarget;
      if (!document.querySelector('[data-screen="' + key + '"]')) return;
      document.querySelectorAll('[data-nav-target]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        if (active) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
      });
      document.querySelectorAll('[data-screen]').forEach((screen) => {
        screen.classList.toggle('active', screen.dataset.screen === key);
      });
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  });
}

function startPassiveIncomeTimer() {
  setInterval(() => {
    const now = Date.now();
    const elapsed = Math.min(3, Math.max(0, (now - lastTick) / 1000));
    lastTick = now;
    const oldLifetime = state.lifetime;
    const { amount } = collectPassiveIncome(state, elapsed);
    if (amount > 0) {
      const newlyUnlocked = businesses.some(
        (business) => oldLifetime < business.unlock && state.lifetime >= business.unlock,
      );
      if (newlyUnlocked) render();
      else updateLiveUI();
    } else {
      renderTimedUI(state);
    }
    saveGame();
  }, 1000);
}

bindInputSuppression();
bindControls();
loadGame();
ensureDailyMissions(state, Date.now());
render();
if (offlineMessage) showStatus(offlineMessage);
saveGame();
startPassiveIncomeTimer();

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    resetTapStreak();
    saveGame();
  } else {
    lastTick = Date.now();
  }
});
window.addEventListener('pagehide', resetTapStreak);

