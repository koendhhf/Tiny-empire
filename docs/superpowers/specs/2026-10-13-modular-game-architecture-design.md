# Tiny Empire Modular Game Architecture

Date: 2026-10-13

## Goal

Make the existing Tiny Empire code easier to understand and extend before adding more gameplay systems. This stage reorganizes the implementation without changing the game players see or how their saves work.

## Approved direction

- Stage one establishes code boundaries while preserving current gameplay.
- Stage two will add new gameplay systems after the architecture is in place and will receive its own design.
- Keep the site dependency-free and deployable as plain files on GitHub Pages, with no build step.
- Use native browser ES modules, with responsibilities separated by file.
- Use a local HTTP server for local play. Opening `index.html` directly as a `file://` page is not supported after the module refactor.

## Current structure

The delivered game is a single `index.html` containing the page markup, all CSS, game data, save handling, economy and progression rules, DOM rendering, event handlers, and timers. The GitHub Pages workflow uploads the repository root as static site files, so it can serve additional relative CSS and JavaScript files without workflow changes.

## Target structure

```text
index.html
styles.css
src/
  data.js
  state.js
  economy.js
  progression.js
  view.js
  app.js
```

### Responsibilities

- `index.html` holds the page shell and links to `styles.css` and `src/app.js` as a module entry point.
- `styles.css` holds the existing styles and responsive/reduced-motion rules.
- `src/data.js` exports the existing businesses, upgrades, goals, ranks, eras, milestones, and balance constants.
- `src/state.js` owns initial and loaded game state plus the existing save/load serialization boundary. It preserves the current save key and serialized field shape. Browser storage failures are reported to the app as results/errors rather than by writing to the DOM.
- `src/economy.js` owns cash, income, tap, purchase-price, upgrade, and boost calculations and operations. It receives state and data through explicit arguments/imports and does not access the DOM.
- `src/progression.js` owns daily missions, unlocks, goals, milestones, ranks, eras, and prestige rules. It can use economy calculations, while economy does not import progression, preventing a circular dependency.
- `src/view.js` owns DOM rendering and user-facing status updates. It does not mutate game state or register gameplay actions.
- `src/app.js` is the composition root. It loads and saves state, applies offline earnings, binds static and delegated events, calls economy/progression operations, refreshes the view, and owns the passive-income and visibility timers.

### Data flow

```text
Browser input or timer
        ↓
      app.js ─────── state.js (load/save)
        ↓
 economy.js / progression.js
        ↓
  updated game state
        ↓
      view.js
```

Modules use explicit exports/imports and avoid cycles. DOM, timers, file inputs, and local storage stay at the app or persistence boundaries. Existing button behavior and status messages remain the same, including the tap-streak combo added in the prior stage.

## Compatibility and behavior constraints

- Do not change cash balances, prices, multipliers, mission targets/rewards, unlocks, prestige, timing, or any other player-visible rules.
- Keep `tiny-empire-save-v1` and its JSON shape unchanged. Existing local saves and exported JSON files must remain readable; new runtime-only state such as the tap streak stays out of persistence.
- Preserve current import/export limits, validation, confirmation, and user-facing failure messages.
- Keep the GitHub Pages workflow unchanged and add no dependencies or build tooling.
- Serve CSS and module files by relative paths so both repository-root and project-page hosting work.
- Use a local static HTTP server when running the modular game locally; direct `file://` loading is intentionally unsupported.

## Out of scope

- New gameplay systems, balancing changes, visual redesign, and save-schema migrations.
- A package manager, bundler, framework, server, account system, or backend.
- Editing or triggering a GitHub Pages deployment.

## Verification and known limits

No automated tests will be added or run for this stage. Review the module graph and changed call sites statically, compare the save key and serialization fields against the current source, and inspect all existing UI actions and timer/lifecycle wiring after extraction. Static review cannot establish runtime equivalence; that limitation must be reported. No commit can be made because the delivered copy is an extracted archive without Git metadata.

## Acceptance criteria

1. The page shell, styles, data, state/persistence, game rules, rendering, and startup/event wiring are separated into the target files.
2. The native ES module graph has no circular imports and uses no added dependency or build step.
3. Existing player-visible gameplay rules and UI actions are preserved.
4. Existing v1 saves and exports retain their key and serialized fields and remain compatible.
5. The existing GitHub Pages workflow can deploy the new relative files unchanged.
6. Direct `file://` loading is documented as unsupported; local play uses a static HTTP server.
7. Static review covers the module graph, save schema, UI event mapping, and timers, with the lack of runtime/test verification stated clearly.

