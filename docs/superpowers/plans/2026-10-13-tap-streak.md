# Tap Streak Combo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Add a visible, short-lived tap combo that rewards consecutive manual taps without changing passive or offline earnings.

**Architecture:** Keep the existing single-page app and put the display, styles, and transient combo state in `index.html`. Add one timer-driven streak controller; `collect()` applies its multiplier to the existing tap amount. No save migration or new dependency is needed.

**Tech Stack:** HTML, CSS, vanilla JavaScript, browser timers and visibility events.

**Spec:** `docs/superpowers/specs/2026-10-13-tap-streak-design.md`

## Global Constraints

- The game remains a single-player, browser-only idle game.
- The first tap in a streak pays the current normal tap amount and displays a 1.0× combo.
- Each following tap within 1.5 seconds of the previous tap extends the streak and adds 0.1 to its multiplier, up to 2.0× after ten follow-up taps.
- The combo multiplies only the cash earned by manual taps.
- Leaving or hiding the page clears the streak.
- The streak is transient and is not written to localStorage or save exports.
- No new dependency, service, account, or backend is introduced; the Pages workflow remains unchanged.

## Review Focus

- First tap and a tap outside the 1.5-second window both start at 1.0×.
- Exactly ten follow-up taps cap the multiplier at 2.0×; extra taps do not increase it.
- The expiry timer returns the display to 1.0× even without another tap.
- Hiding or leaving the page clears the combo timer and transient streak.
- Early-game whole-dollar rounding can make multiple multiplier steps show the same cash payout; the minimum tap gain stays $1.

---

### Task 1: Add the transient tap combo to the Empire screen

**Files:**
- Modify: `index.html` (tap button markup/styles, combo state, `collect()`, and visibility handling)

**Interfaces:**
- `TAP_STREAK_WINDOW_MS = 1500`, `TAP_STREAK_MAX_FOLLOWUPS = 10`, and `TAP_STREAK_INCREMENT = 0.1` are the only balance constants.
- `registerTapStreakTap(now = Date.now())` updates the follow-up count and last-tap time, refreshes the UI, schedules expiry, and returns `1 + min(followUps, 10) * 0.1`.
- `resetTapStreak()` clears the timer and transient count, then displays 1.0× with an empty countdown bar.
- `collect()` uses the returned multiplier in the existing `Math.floor` calculation before applying the existing minimum-$1 rule.

- [x] **Step 1: Add an accessible combo readout below the Collect Cash button**

Add static markup with a multiplier label and a compact progress bar. Give the bar a text label, `role="progressbar"`, and min/max/current ARIA values. Start in the inactive 1.0× state. Keep the control inside the existing hero section so it fits the current mobile layout.

- [x] **Step 2: Style the readout and countdown bar in the existing stylesheet**

Use the existing dark panel, lime accent, and reduced-motion rules. The countdown bar should transition from full to empty over exactly 1500 ms when a tap registers. Keep the label legible on narrow screens.

- [x] **Step 3: Implement the streak state and expiry controller in the existing script**

Add only transient state for follow-up taps, last-tap timestamp, and the expiry timer. Implement `registerTapStreakTap(now = Date.now())` using the exact constants above. A gap of 1500 ms or more resets the follow-up count before processing the new tap. Cap follow-ups at 10. On expiry, call `resetTapStreak()` so the multiplier returns to 1.0× without waiting for another user action.

- [x] **Step 4: Apply the multiplier only in `collect()`**

Keep the existing tap base calculation, insert the combo multiplier before `Math.floor`, and retain `Math.max(1, ...)`. Leave `income()`, business purchases, missions, offline reward, and prestige logic unchanged.

- [x] **Step 5: Clear the combo when the page is hidden or left**

Extend the existing `visibilitychange` handler to call `resetTapStreak()` when visibility becomes hidden. Also register `pagehide` to cover navigation away. Do not add the streak fields to `state`, `save()`, `load()`, or export/import.

- [x] **Step 6: Review the final code against the spec**

Inspect the multiplier boundary, cap, timeout, reduced-motion styling, and visibility cleanup in `index.html`. Confirm by code review that only `collect()` consumes the combo multiplier and the save object shape remains untouched. Do not add or run automated tests for this change.

