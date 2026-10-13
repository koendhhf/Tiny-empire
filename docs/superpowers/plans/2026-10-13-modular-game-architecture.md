# Modular Game Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize Tiny Empire into dependency-free browser modules while preserving player-visible behavior and existing saves.

**Architecture:** Keep `index.html` as a shell, extract `styles.css`, and use native ES modules under `src/` for static data, state/persistence, economy, progression, view rendering, and app coordination. `app.js` owns browser events and timers, passes the shared state through domain functions, and coordinates rendering and persistence; modules use explicit imports without cycles.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, local storage, GitHub Pages static hosting. No build tool or dependency.

**Spec:** `docs/superpowers/specs/2026-10-13-modular-game-architecture-design.md`

## Global Constraints

- Stage one establishes code boundaries while preserving current gameplay.
- Stage two will add new gameplay systems after the architecture is in place and will receive its own design.
- Keep the site dependency-free and deployable as plain files on GitHub Pages, with no build step.
- Use native browser ES modules, with responsibilities separated by file.
- Use a local HTTP server for local play. Opening `index.html` directly as a `file://` page is not supported after the module refactor.
- Do not change cash balances, prices, multipliers, mission targets/rewards, unlocks, prestige, timing, or any other player-visible rules.
- Keep `tiny-empire-save-v1` and its JSON shape unchanged.
- Preserve current import/export limits, validation, confirmation, and user-facing failure messages.
- Keep the GitHub Pages workflow unchanged and add no dependencies or build tooling.
- Do not add or run automated tests; verification is limited to static code and schema review.
- The delivered project is an extracted archive without Git metadata; do not add commit or push steps.

## Review Focus

- Repository-root and project-page relative paths: `index.html`, `styles.css`, and `src/` modules must resolve when hosted below a path prefix.
- Missing, malformed, and older v1 saves: initialization, normalization, offline earnings, and the save key must remain as before.
- Imported save cancellation, invalid JSON/shape, and files over 100,000 bytes: existing checks and messages must remain intact.
- Re-rendered action controls: buy, upgrade, claim, nav, and show-more actions must still reach the same game operations after DOM replacement.
- Time-based behavior: passive earnings, offline earnings, boost timers, tap-streak expiry, visibility reset, and `pagehide` cleanup must retain their current order and boundaries.

---

### Task 1: Separate the page shell, stylesheet, and module entry

**Files:**
- Modify: `index.html`
- Create: `styles.css`
- Create: `src/app.js`

**Interfaces:**
- `index.html` links `./styles.css` and loads `./src/app.js` with `type="module"`.
- `src/app.js` is the browser entry point and initially contains the existing script body inside its current IIFE.

- [x] **Step 1: Extract the existing stylesheet to `styles.css`**

Copy all rules, custom properties, responsive breakpoints, and reduced-motion rules from the existing `<style>` element without changing declarations. Replace the inline block with `<link rel="stylesheet" href="./styles.css">`.

- [x] **Step 2: Extract the existing script body to `src/app.js`**

Copy the current script body, including the IIFE and its closing call, without changing gameplay logic. Replace the inline script with `<script type="module" src="./src/app.js"></script>`.

- [x] **Step 3: Statically compare extracted content and paths**

Compare the extracted CSS and JavaScript bodies against the preserved pre-refactor snapshot at `.superpowers/sdd/modular-game-architecture/baseline/index.html`; review the HTML for one stylesheet link and one module entry, and confirm all paths are relative. Do not run tests.

### Task 2: Move static definitions and persistence into their modules

**Files:**
- Create: `src/data.js`
- Create: `src/state.js`
- Modify: `src/app.js`

**Interfaces:**
- `src/data.js` exports `businesses`, `upgrades`, `tierThresholds`, `tierNames`, `goals`, `ranks`, `eras`, `legacyMilestones`, `businessMilestones`, `SHORT_SCALE_NAMES`, and the existing balance and tap-streak timing constants (`COST_SCALE`, `PRESTIGE_THRESHOLD`, `TAP_STREAK_WINDOW_MS`, `TAP_STREAK_MAX_FOLLOWUPS`, `TAP_STREAK_INCREMENT`, and `TAP_STREAK_PROGRESS_INTERVAL_MS`).
- `src/state.js` exports `SAVE_KEY`, `createInitialState(now = Date.now())`, `loadState(getStorage, data, now = Date.now())`, `saveState(state, getStorage, now = Date.now())`, `serializeSave(state)`, and `parseImportedSave(text)`.
- `getStorage` is a zero-argument function that returns the browser storage object. Call it inside the module's `try` block so restricted-storage access is handled like the current code.
- `loadState` returns the same normalized v1 state the current loader constructs. Offline earnings are calculated and applied by the app after loading, before first render, using the saved `lastSeen` value. `saveState` returns `{ ok: boolean }`; it never writes to the DOM. The app preserves the current storage-failure message and `_importingSave` guard.
- `serializeSave(state)` returns the same pretty-printed JSON used for downloads; local storage continues to use compact JSON.
- `parseImportedSave` validates the current required shape and returns the parsed object; the app retains file-size and confirmation checks and the current messages.

- [x] **Step 1: Export static game definitions from `src/data.js`**

Move the existing data arrays and tuning constants without changing values, including `businessMilestoneDefs`, tap-streak timing values, number-formatting thresholds, and offline/prestige constants. Use descriptive export names and import aliases where needed.

- [x] **Step 2: Move default state and v1 normalization to `src/state.js`**

Extract the exact initial fields, save key, field defaults, validation, numeric bounds, and array filtering from the current `state` declaration and `load()`. Preserve current behavior for invalid JSON, invalid save shape, and storage exceptions. Accept a storage provider, definition data shaped as `{ businesses, upgrades, goals }`, and the current timestamp so restricted storage access is handled inside the module's `try` block and it can be reviewed without DOM globals. Keep offline-earnings application outside this persistence module.

- [x] **Step 3: Move save serialization to `src/state.js`**

Implement `saveState` with the existing `lastSeen` update and local-storage key. Implement `serializeSave` with the current JSON shape. Return storage success as `{ ok }`; show the existing failure message from `app.js`.

- [x] **Step 4: Delegate import parsing while keeping browser interaction in `app.js`**

Move the existing parsed-object shape check into `parseImportedSave(text)`. Keep the 100,000-byte check, file input reset, confirmation prompt, local-storage write, reload, and user-facing errors in the app coordinator.

- [x] **Step 5: Statically compare the v1 persistence contract**

Compare `SAVE_KEY`, initial-state field names, normalization rules, exported JSON fields, and import validation with the original source. Confirm no transient tap-streak state is serialized. Do not run tests.

### Task 3: Separate economy and progression rules

**Files:**
- Create: `src/economy.js`
- Create: `src/progression.js`
- Modify: `src/app.js`

**Interfaces:**
- Economy calculations accept the current state and explicit inputs, and return values without reading or writing the DOM.
- `calculateBusinessIncome(state, business)`, `calculateBaseIncome(state)`, `calculateIncome(state, now = Date.now())`, `calculateTapGain(state, comboMultiplier = 1)`, `calculatePurchaseCost(state, business, quantity)`, and `calculateBuyQuantity(state, business, mode)` preserve the current formulas and rounding.
- `calculateOfflineEarnings(state, now = Date.now())` returns the existing capped elapsed seconds and 75% base-income reward without mutating state; app startup applies the earned amount and preserves the existing welcome-back message threshold and text. `collectPassiveIncome(state, elapsed, now = Date.now())` applies the current passive-income amount to cash and lifetime and returns `{ changed, amount }`.
- `collectCash(state, comboMultiplier = 1)` applies the existing tap formula, updates cash and lifetime, and returns `{ changed, gain }`.
- `purchaseBusiness(state, id, mode)` returns `{ changed, count, price, business }`; `purchaseUpgrade(state, id)` returns `{ changed, upgrade }`; and `activateRush(state, now = Date.now())` returns `{ changed }`. They do not render, save, or create display strings.
- Progression exports `ensureDailyMissions(state, now = Date.now())`, `getMissionDefinitions(state)`, `getRank(state)`, `getEraProgress(state)`, `getPrestigeReward(state)`, `getDailyReward(state, baseIncome, now = Date.now())`, `recordTap(state)`, `recordLevelsPurchased(state, count)`, `recordRush(state)`, `claimMission(state, id)`, `claimGoal(state, id)`, `claimBusinessMilestone(state, id)`, `claimDailyBonus(state, baseIncome, now = Date.now())`, and `resetForPrestige(state, now = Date.now())`.
- The three `record*` functions update only existing mission counters. Claim operations return `{ changed, mission, reward }`, `{ changed, goal }`, `{ changed, milestone }`, or `{ changed, reward, streak }` as applicable. `resetForPrestige` returns `{ changed, state, reward, points }` so the app can replace its state after confirmation.
- `getMissionDefinitions(state)` and the rank/era/reward lookup functions are read-only. `app.js` calls `ensureDailyMissions` before rendering missions and before mission actions, preserving the current daily-reset timing.
- `view.js` exports pure formatting helpers `formatMoney(value)` and `formatPrecise(value)` for the app to assemble the current status messages. The app preserves their existing wording and uses `showMessage(message)` only to update feed text.
- Confirmation dialogs, status updates, render calls, and persistence stay in `app.js`.
- `progression.js` may import economy calculations for reward calculations; `economy.js` must not import progression.

- [x] **Step 1: Move pure economy calculations to `src/economy.js`**

Move business income, multipliers, tap-gain, cost, and purchase-quantity calculations from `app.js`, preserving operation order, inputs, rounding, and numeric caps. Include passive and offline income calculations using the signatures in this task's Interfaces block. Keep display formatting and purchase labels in `view.js`.

- [x] **Step 2: Move economy state transitions to `src/economy.js`**

Move manual cash collection, passive-income application, business purchase, upgrade purchase, and Rush Hour state changes into the named operations. Preserve eligibility checks and cash/level/boost mutations, and return the specified result values instead of calling `render()`, `save()`, or `say()`. Keep tap/level/rush mission counters in `progression.js`; have `app.js` record the corresponding action after a successful operation.

- [x] **Step 3: Move progression calculations and state transitions to `src/progression.js`**

Move daily-mission setup/claiming, goal claims, business milestones, rank/era lookup, daily rewards, mission counters, and prestige rules. Keep confirmation in `app.js`; preserve current targets, rewards, reset fields, and claimed-progress behavior.

- [x] **Step 4: Route existing action handlers through the rule modules**

Update `app.js` handlers to call the domain operation, record the matching mission action after successful tap/level/rush operations, then render and save only when `changed` is true. Compose the same existing status message from each operation's result and the view formatting helpers. Keep transient tap-streak timing and its progress UI coordination in the app, pass its multiplier only to `collectCash`/`calculateTapGain`, and preserve the tap button's `tap-pop` animation.

- [x] **Step 5: Statically trace rule call sites and dependency direction**

Review all callers of income, tap, purchase, mission, goal, milestone, daily-bonus, boost, and prestige operations. Confirm the formulas and action ordering match the original and no economy/progression import cycle exists. Do not run tests.

### Task 4: Separate rendering from app wiring and complete the module graph

**Files:**
- Create: `src/view.js`
- Modify: `src/app.js`, `index.html`

**Interfaces:**
- `src/view.js` imports static data and read-only economy/progression calculations and exports `renderGame(state, options)`, `renderLiveUI(state, options)`, `renderTimedUI(state)`, `showMessage(message)`, `formatMoney(value)`, and `formatPrecise(value)`. The optional view options carry app-owned `buyMode` and `showAllBusinesses` presentation state. `showMessage` only updates feed text; `app.js` owns the 6.5-second clearing timer.
- View functions read state and update DOM only. They do not mutate state, register game actions, access local storage, or own timers.
- `src/app.js` binds static controls once and handles generated buttons through delegated `data-*` actions. It coordinates state transitions, view refreshes, save results, import/export browser APIs, tap-streak state and timers, the one-second passive-income tick, visibility events, and `pagehide` cleanup.
- The module graph direction is `data.js` → leaf; `state.js` → `data.js`; `economy.js` → `data.js`; `progression.js` → `data.js` and `economy.js`; `view.js` → `data.js`, `economy.js`, and `progression.js`; `app.js` → all modules. No module imports `app.js`.

- [x] **Step 1: Move DOM rendering and status output into `src/view.js`**

Move full, live, and timed UI refresh routines and the feed-message writer. `renderGame(state, options)` and `renderLiveUI(state, options)` read state, static data, and domain calculations but do not mutate state. The app supplies its transient buy mode and expanded-business flag as options. Make daily-state preparation happen in `app.js` before calling the view. Preserve generated markup, labels, accessible attributes, layout classes, number and money formatting, and affordability details. Keep all generated-button actions delegated in `app.js`; view code must not register listeners.

- [x] **Step 2: Move control and lifecycle coordination into `src/app.js`**

Keep browser events, delegated action handling, `FileReader`/download interactions, timers, and startup order in the composition root. Preserve startup order: load state, calculate and apply offline earnings, prepare daily missions as the initial render requires, render, show the offline message when earned, then save. Preserve action order: state update, mission/progression update, render, save, then status message as in the existing flow. Preserve selection/context-menu/gesture suppression and editable-field exceptions, navigation behavior, import reload guard, and tap-streak reset on hidden visibility and `pagehide`.

- [x] **Step 3: Confirm all paths and imports are relative and acyclic**

Inspect every `import` and the HTML entry paths for root and project-page hosting. Confirm the existing GitHub Pages workflow needs no changes and note that local use requires HTTP(S).

### Task 5: Complete the static preservation review

**Files:**
- Review: `index.html`, `styles.css`, and all files in `src/`

- [x] **Step 1: Review the spec criteria against the final module graph**

Use the Review Focus checklist above. Compare the preserved pre-refactor snapshot at `.superpowers/sdd/modular-game-architecture/baseline/index.html` with the refactored save contract, action/event mapping, economic formulas, progression thresholds/rewards, and timer/lifecycle handling. Record any behavior that cannot be verified statically.

- [x] **Step 2: Report verification limits**

State that no automated tests or runtime checks were run, name the static comparisons completed, and flag native-module `file://` incompatibility and any remaining runtime risk.

