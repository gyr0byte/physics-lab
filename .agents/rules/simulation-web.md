---
trigger: glob
globs: "**/simulation-web/**/*.ts, **/simulation-web/**/*.tsx"
description: TypeScript simulation architecture, numerical stability, and Vitest conventions.
---

# Simulation Web — Engineering & Testing Conventions

Use actual source files in `simulation-web/src/` as the authoritative API reference.

## 1. Layer Separation & Core Reuse
- **Pure physics (`simulation-web/src/physics/<Name>Physics.ts`):** Keep deterministic equations, typed parameter ranges/defaults, input validators, and state step functions free of DOM, `window`, and Canvas dependencies. Export parameter limits and physical constants as the single source of truth.
- **Renderers (`simulation-web/src/rendering/<Name>Renderer.ts`):** Draw Canvas 2D scenes purely from simulation/physics state and `Camera2D` / `CanvasRenderer`. Guard coordinates with `Number.isFinite(...)` before Canvas draw calls.
- **Simulation controllers (`simulation-web/src/simulations/<id>/<Name>Simulation.ts`):** Implement `Simulation` (`simulation-web/src/core/Simulation.ts`):
  `readonly metadata`, `initialize(container)`, `reset()`, `start()`, `pause()`, `tick(timestamp)`, `dispose()`.
  Keep controllers modular instead of merging physics math or monolithic UI builders into one file.
- **Core utilities to reuse rather than reimplement:**
  - `SimulationClock` (`src/core/SimulationClock.ts`) for fixed outer timestepping and pause/reset state.
  - `Camera2D` (`src/core/Camera2D.ts`) and `Vector2` (`src/core/Vector2.ts`) for world-to-screen mapping and 2D math.
  - `InputManager` (`src/core/InputManager.ts`) for D-pad/keyboard action listeners (always detach/cleanup in `dispose()`).
  - `SimulationRegistry` (`src/core/SimulationRegistry.ts`) and hash registration in `src/main.ts` (`#<sim-id>`).
  - `Graph` (`src/components/Graph.ts`) for bounded, unit-labeled analytical plots derived from live state.

## 2. Numerical Stability & Boundary-Condition Handling
- Keep the outer `SimulationClock` fixed interval distinct from smaller internal physics substeps when springs, impulses, or threshold crossings require tighter accuracy.
- Establish coordinate origins, sign conventions (`+theta`, signed velocity/friction/torque), strict vs inclusive regime thresholds (`<`, `=`, `>` at critical speeds or separatrices), and singularity guards (`r = 0`, `0/0` incipient slip, asymptotes) cleanly in the physics module.
- Never clamp legitimate small positive physical quantities (such as an energy radicand `q > 0`) to zero, and never fabricate zero-speed states inside energetically unreachable domains (`q < -eps`). Restrict tolerance clamping strictly to tiny negative floating-point round-off near exact turning boundaries.

## 3. Vitest Conventions & Invariants
- **Physics suites (`simulation-web/tests/physics/<name>.test.ts`):** Assert conservation laws (energy and work-energy ledger invariants), closed-form identities vs numerical integration, breakaway/restick thresholds, critical boundaries/separatrices, determinism under identical parameters/steps, and edge clamping. Use `toBeCloseTo` tolerances rather than brittle exact float comparisons.
- **Rendering & interaction suites (`simulation-web/tests/rendering/<name>-rendering.test.ts`):** Verify initialization, `reset()` restoration, D-pad/keyboard navigation via `InputManager` (`ArrowUp/Down/Left/Right`, `Enter`, `Space`), tab changes, `dispose()`, and finite Canvas draw calls.
