---
name: implement-simulation
description: >-
  Use this skill when scoping, implementing, or verifying a Grade 11 or 12
  physics simulation in Physics Lab across specification, pure TypeScript
  physics, Canvas/D-pad wiring, Vitest invariant suites, and browser QA stages.
---

# Implement and Verify a Physics Lab Simulation

Work through the stages below selectively. **Skip any stage that is already completed**, and **reuse an already-approved specification in `docs/simulation-specs/` without re-auditing or rewriting it** unless a concrete physics, numerical, or requirement issue is found.

## Stage 1: Specification *(Skip if an approved spec already exists)*
1. Confirm chapter alignment in `docs/curriculum-map.md`.
2. Create `docs/simulation-specs/<sim-id>.md`. Write concisely without sacrificing mathematical completeness (no artificial line-count cap):
   - Grade, area, chapter, learning objectives, and simulation ID.
   - Coordinate frame, sign conventions, governing equations, and assumptions.
   - Exact parameter table (symbol, SI unit, default, min/max, step).
   - Regime boundaries (explicit `<`, `=`, `>` transitions and separatrices), numerical tolerances, and singularity guards.
   - Verifiable physics invariants and D-pad focus sequence.
3. Perform one coherent mathematical audit (signs, units, critical equalities, reachable domains) before moving to code and tests rather than iterating in repeated doc-only passes.

## Stage 2: Pure Physics Engine & Vitest Invariants *(Skip if already verified)*
1. Implement `simulation-web/src/physics/<PascalName>Physics.ts` free of DOM/Canvas imports:
   - Export physical constants, parameter bounds/defaults, state initialization, parameter validation/clamping, force/energy helpers, and deterministic step/evaluation functions.
2. Add `simulation-web/tests/physics/<short-name>.test.ts`:
   - Verify analytical identities, conservation/work-energy ledgers, regime boundaries/separatrices, static/kinetic thresholds, clamping, and deterministic repeatability using `toBeCloseTo`.
3. Verify Stage 2 inside `simulation-web/`:
   - Run `npx vitest run tests/physics/<short-name>.test.ts` and inspect results.

## Stage 3: Renderer, Simulation Controller & D-Pad Tests
1. Implement `simulation-web/src/rendering/<PascalName>Renderer.ts` using `Camera2D` / `CanvasRenderer` and `Number.isFinite(...)` guards.
2. Implement `simulation-web/src/simulations/<sim-id>/<PascalName>Simulation.ts` matching `Simulation` in `simulation-web/src/core/Simulation.ts` (`initialize`, `reset`, `start`, `pause`, `tick`, `dispose`). Reuse `SimulationClock`, `InputManager`, and `Graph`.
3. Register the simulation in `simulation-web/src/main.ts` so `#<sim-id>` resolves cleanly.
4. Add `simulation-web/tests/rendering/<short-name>-rendering.test.ts` testing D-pad navigation, parameter steppers, graph tabs, reset, disposal, and Canvas drawing.
5. Verify Stage 3 inside `simulation-web/`:
   - Run `npx vitest run tests/rendering/<short-name>-rendering.test.ts`.

## Stage 4: Browser Visual QA & Milestone Integration
1. Run full web verification inside `simulation-web/` matching `.github/workflows/web-ci.yml`:
   - `npm test`
   - `npm run typecheck`
   - `npm run build`
2. If Canvas visuals, apparatus geometry, or 1080p HUD layout changed, inspect live rendering at `1920x1080` via `npm run dev` (`#<sim-id>`) or a headless Chrome CDP capture script patterned on `scripts/capture-work-energy-qa.mjs`.
3. At integration/release milestones, update `simulation-web/src/curriculum/curriculumData.ts`, `docs/curriculum-map.md`, and `README.md`, verifying parameter ranges, timesteps, and test counts directly against implementation and test output.
4. Skip Android builds (`scripts/copy-web-assets.ps1`, `scripts/build-all.ps1`, Gradle/ADB) unless Android UI, `android/app/src/main/java/com/physicslab/app/data/CurriculumData.kt`, WebView packaging, or an Android release milestone is part of the task.
