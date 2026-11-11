# AGENTS.md — Physics Lab Android TV Application

## 0. Mission & Targets

**Physics Lab** is an offline-first educational Android TV application for secondary-level Grade 11 and Grade 12 Physics following the Nepal Curriculum Development Centre (CDC) syllabus. Its pedagogy is inspired by PhET Interactive Simulations—parameter adjustment, real-time observation, quantitative measurement, and conceptual reasoning—built with **original UI, code, and visual assets** (never a PhET clone or fork).

- **Primary target:** Classroom Android smart TV (16:9 landscape, 1080p baseline / 4K scalable), operated primarily by D-pad/remote control, completely offline after APK installation.
- **Secondary targets:** Desktop browser (`simulation-web/`) for rapid development, Android TV emulator, and Android touch devices during development.

---

## 1. Product Goals & Version 1 Scope

### Must-Have Goals
1. Curriculum-aligned Grade 11–12 interactive simulations grounded in transparent, deterministic physics models rather than decorative animations.
2. Reusable TypeScript simulation engine decoupled from rendering, DOM UI, and the Android shell.
3. Lightweight Kotlin/Compose TV shell hosting bundled offline web assets via `WebViewAssetLoader`.
4. Full D-pad/remote navigability, classroom viewing readability, and fast reset/repeat loops.
5. Physics calculations testable in Vitest independently of Canvas rendering.

### Version 1 Non-Goals
Do **not** introduce unless an explicit requirement changes: backend servers, user accounts, cloud databases, Firebase authentication, analytics platforms, AI tutors/chatbots, online-only simulations, microservices, multiplayer networking, server-side physics, a custom Android graphics engine, or copied PhET code/branding. *(Future V2+ backlog items live in [docs/roadmap-and-checklists.md](docs/roadmap-and-checklists.md).)*

---

## 2. Curriculum Source of Truth

Verify curriculum scope, chapters, and competencies against official Nepal CDC materials rather than arbitrary websites:
- CDC Grades 11–12 Physics Curriculum: https://moecdc.gov.np/storage/gallery/1672125377.pdf
- CDC Secondary Physics Specification Grid: https://moecdc.gov.np/storage/gallery/1674713459.pdf
- CDC e-Library: https://lib.moecdc.gov.np/

Keep curriculum metadata separate from simulation engines using typed data structures (`CurriculumTopic` in `curriculumData.ts` / `CurriculumData.kt`) aligned with [docs/curriculum-map.md](docs/curriculum-map.md). Prioritize concepts where live parameter interaction teaches more than static textbook diagrams.

---

## 3. Architecture & Technology Stack

```text
Android TV Shell (Kotlin + Jetpack Compose for TV + Navigation Compose)
  └── Home → Grade → Chapter → Simulation Launcher
        └── WebView (AndroidX WebKit + WebViewAssetLoader, local HTTPS origin)
              └── Bundled Simulation Web App (TypeScript + Vite + HTML5 Canvas 2D)
                    ├── core/ (Simulation, SimulationClock, Camera2D, Vector2, InputManager, Registry)
                    ├── physics/ (pure math & state transitions)
                    ├── rendering/ (Canvas 2D scenes & vector/apparatus drawing)
                    ├── components/ (reusable controls & bounded Graph)
                    ├── simulations/ & curriculum/
```

- **Android shell:** Kotlin, Jetpack Compose for TV, Navigation Compose, `WebViewAssetLoader`. Zero physics equations or simulation state belong in Kotlin code.
- **Web app:** TypeScript (strict), HTML/CSS, Vite, HTML5 Canvas 2D with `requestAnimationFrame()`. Prefer transparent in-house physics math over heavy third-party engines; adopt PixiJS, Three.js, or Matter.js only when a simulation genuinely demands it.
- **Repository structure:** Preserve the existing `android/`, `simulation-web/`, `docs/`, and `scripts/` layout rather than performing gratuitous rewrites.

---

## 4. Android / WebView Boundary & Offline Security

Serve bundled web assets strictly through `WebViewAssetLoader` (see [docs/architecture.md](docs/architecture.md)). Never use `file://` simulation URLs, and **never**:
- enable universal file access or `setAllowUniversalAccessFromFileURLs(true)`,
- set `MIXED_CONTENT_ALWAYS_ALLOW`,
- load remote code or CDN dependencies at runtime in Version 1,
- expose broad or untrusted native `@JavascriptInterface` bridges.

Keep JavaScript enabled solely for the bundled simulation app. If native-to-web messaging is ever required, restrict it to a minimal typed protocol (`SET_THEME`, `OPEN_SIMULATION`, `PAUSE_SIMULATION`, `RESET_SIMULATION` ↔ `SIMULATION_READY`, `REQUEST_EXIT`, `SIMULATION_ERROR`). Every screen/navigation action must function 100% offline.

---

## 5. Core Simulation Architecture

All simulations implement the shared lifecycle in [`simulation-web/src/core/Simulation.ts`](simulation-web/src/core/Simulation.ts):

```ts
export interface Simulation {
  readonly metadata: SimulationMetadata;
  initialize(container: HTMLElement): void;
  reset(): void;
  start(): void;
  pause(): void;
  tick(timestamp: number): void;
  dispose(): void;
}
```

- **Strict layer separation:** `Input → State/Parameters → Physics Model → State → Renderer → Screen`. Never put physics equations in renderers, UI sliders, or Android code.
- **Registry & state:** Register every simulation in `SimulationRegistry` (`src/main.ts` hash routing `#<sim-id>`). Keep simulation state explicit rather than hidden in DOM nodes; `reset()` restores a clean initial state, `pause()` freezes the clock without losing state, and `dispose()` releases listeners, timers, and animation frames.
- **Component reuse:** Extract shared UI controls or visualization helpers (e.g., `Graph`, `VectorArrow`, steppers) only when at least two simulations genuinely benefit; avoid speculative abstraction hierarchies.

---

## 6. Physics, Numerical Accuracy & Unit System

Physics correctness takes strict priority over visual spectacle.

1. **SI units internally:** Use `m`, `kg`, `s`, `m/s`, `m/s²`, `N`, `J`, `W`, `C`, `A`, `V`, `Ω`, `Hz` across physics modules. Convert or format units only at the presentation layer via a shared formatting layer rather than per-simulation conversions, using consistent scientific notation (e.g., `1.60 × 10⁻¹⁹ C`) and deliberate classroom rounding (avoid false 10-digit precision while preserving full internal precision).
2. **Closed-form & controlled numerical models:** Prefer exact closed-form analytical equations where available; otherwise use well-documented deterministic integrators (semi-implicit Euler or Velocity Verlet) with explicit timestep assumptions, stability bounds, and error tolerances.
3. **No fake physics:** Never move objects along hardcoded cosmetic paths or silently alter equations to make visuals look nicer. Validate/clamp parameters strictly where physical constraints require it, and preserve unreachable-domain/boundary invariants without fabricating unphysical states.
4. **Determinism & stochastic models:** Identical initial states, parameters, and timestep policies must produce identical results. Use seeded randomness for stochastic topics (e.g., decay), displaying large enough samples so students do not confuse one random event with statistical laws.
5. **Pedagogical transparency & graphing:** Derive every displayed measurement and graph strictly from the live simulation state (never a separate dataset). Graphs must have labeled axes with units, sensible scaling, clear legends, reset clearing, optional pause/freeze snapshots, and bounded/downsampled buffers. Expose model assumptions cleanly, keep guided experiments optional without blocking free exploration, and prioritize cause-and-effect inquiry over quiz-style answer checking.
6. **Independent physics tests:** Verify equations, conservation laws, regimes, and boundary conditions in automated unit tests with floating-point tolerances (`toBeCloseTo`), never relying solely on visual checks.

---

## 7. Rendering, Classroom Readability & TV Input

- **Logical world coordinates:** Map physical world coordinates (meters) to Canvas pixels via `Camera2D` so physics runs identically across 1280×720, 1920×1080, and 3840×2160 displays, drawing in a clean layered order (`background → axes/grid → apparatus → physics objects → vectors/trajectories → graphs/labels → overlays`). Keep high-frequency animation inside Canvas rather than rebuilding heavy DOM trees each frame.
- **Classroom TV layout & accessibility (16:9):** Use relative spacing, safe margins, high-contrast scientific palettes, and large typography readable across a classroom. Never encode meaning by color alone—label vectors and multi-series graphs clearly. Avoid rapidly flashing content, provide pause controls for fast simulations, and make what is studied, changeable, observed, measured, and resettable immediately obvious.
- **D-pad primary navigation:** Every interactive control—including any pointer/drag behavior—must be operable with Android TV D-pad (`Up`, `Down`, `Left`, `Right`, `Select/OK`, `Back`, `Home`), such as focused `◀ value ▶` steppers. Provide crisp focus indicators, zero focus traps, adequate selection/touch targets, and clean Back navigation (`simulation → chapter → grade → home`) where `Back` navigates rather than toggles. Touch and keyboard arrows supplement, never replace, D-pad support.

---

## 8. Performance, Memory, Error Handling & Assets

- **Smart TV constraints:** Keep render complexity proportional to visible viewport content, avoid per-frame heap allocations or repeated DOM queries inside `requestAnimationFrame`, and pause simulation clocks and rendering when inactive. Browser/smartphone performance does not prove TV hardware performance—validate on real college TV hardware before classroom rollout.
- **Memory hygiene:** Clean up event listeners, `InputManager` subscriptions, `requestAnimationFrame` handles, WebView references, duplicate images/textures, and bounded buffers in `dispose()` / Android lifecycle hooks.
- **Errors, loading & localization:** Keep startup fast (code-split simulations if bundles become heavy; avoid blocking Android UI), show graceful simulation-level error fallbacks without crashing the host app, log init/runtime/WebView errors cleanly without swallowing exceptions, gate any debug overlay behind a dev flag (no debug banners or release frame-log spam), and keep V1 English copy separated from raw drawing logic for future Nepali (`np`) localization.
- **Originality & IP hygiene:** Maintain `THIRD-PARTY-NOTICES` when external libraries/assets are introduced. Never copy PhET source code, icons, logos, screenshots, or copyrighted textbook diagrams; implement original Nepal-curriculum visuals and behavior independently.

---

## 9. Engineering Standards, Dependencies & Git Conventions

- **Code style & types:** Write concise, modular code (`TypeScript` strict without `any` workarounds; idiomatic lifecycle-safe `Kotlin`/Compose with scoped state and coroutines only for real async work). Never hide compile errors or make unrelated refactors during feature work.
- **Dependencies:** Justify every dependency on need, runtime vs build scope, license compatibility, offline safety, and bundle/APK impact; verify current stable versions rather than copying stale defaults or making unrelated upgrades.
- **Build & CI:** Production Android APKs package compiled Vite assets via `scripts/copy-web-assets.ps1` / `scripts/build-all.ps1`, never localhost/dev URLs (verify release integrity per [docs/architecture.md](docs/architecture.md)). Web CI runs `npm test`, `npm run typecheck`, and `npm run build` in `simulation-web/` ([`.github/workflows/web-ci.yml`](.github/workflows/web-ci.yml)).
- **Git & verification integrity:** Develop features on short-lived `feat/<topic>` branches off `main`, use focused conventional commits (`feat(scope):`, `fix(scope):`, `docs(scope):`, `test(scope):`, `chore(scope):`), and preserve SSH commit signing (`commit.gpgsign = true`). Never fabricate passing tests/builds or claim physical TV compatibility without actual testing.

---

## 10. Workspace Rules, Skills & Reference Docs

- Operational workflow, verification cadence & Git rules: [`.agents/rules/physics-lab-workflow.md`](.agents/rules/physics-lab-workflow.md)
- Simulation web TypeScript & Vitest standards: [`.agents/rules/simulation-web.md`](.agents/rules/simulation-web.md)
- Staged simulation implementation procedure: [`.agents/skills/implement-simulation/SKILL.md`](.agents/skills/implement-simulation/SKILL.md)
- System architecture & WebView security details: [`docs/architecture.md`](docs/architecture.md)
- Curriculum coverage map: [`docs/curriculum-map.md`](docs/curriculum-map.md)
- Simulation specs, historical milestones, backlog & release/TV checklists: [`docs/roadmap-and-checklists.md`](docs/roadmap-and-checklists.md), `docs/simulation-specs/`
