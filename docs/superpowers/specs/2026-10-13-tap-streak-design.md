# Tap Streak Combo Design

Date: 2026-10-13

## Goal

Make manual play in Tiny Empire feel more responsive and rewarding by giving consecutive taps a visible, short-lived bonus. The game remains a single-player, browser-only idle game.

## Current behavior

The Empire screen has a large Collect Cash button. Each activation adds cash based on tap upgrades, prestige tap bonuses, and lemonade levels. Taps animate the button and count toward a daily mission, but consecutive taps have no additional effect. Passive business income continues independently.

## Proposed behavior

- The first tap in a streak pays the current normal tap amount and displays a 1.0× combo.
- Each following tap within 1.5 seconds of the previous tap extends the streak and adds 0.1 to its multiplier, up to 2.0× after ten follow-up taps.
- Taps after the 1.5-second window start a fresh streak at 1.0×.
- The tap area shows the current multiplier and a compact countdown/progress bar. After the window expires, the display returns to 1.0× even if the player does not tap again.
- The multiplier is applied to the existing manual-tap amount before its existing integer rounding and minimum-$1 rule. At very low tap values, several combo steps may round to the same cash amount.
- Leaving or hiding the page clears the streak. The streak is transient and is not written to localStorage or save exports.
- The combo multiplies only the cash earned by manual taps. It does not change passive income, offline earnings, business pricing, mission progress, or prestige rewards.
- Existing tap animation and daily tap mission behavior continue to work.

## Scope

Changes are limited to the existing page markup, styling, and JavaScript in `index.html`. No new dependency, service, account, backend, or save format is introduced. The Pages workflow remains unchanged.

## Acceptance criteria

1. Manual taps made within 1.5 seconds visibly build the combo, with the multiplier capped at 2.0×.
2. Tap earnings use the displayed combo multiplier together with existing tap bonuses, subject to the existing whole-dollar rounding and minimum-$1 behavior.
3. After the streak expires, the display returns to 1.0× and the next tap starts a fresh streak.
4. The progress bar communicates the remaining streak time and the combo is usable on narrow screens and with keyboard/screen-reader navigation.
5. Passive and offline income calculations are unchanged.
6. Hiding the page clears the combo, and reloading the game never restores a previous combo.
7. Existing saved games and save exports remain compatible.

