# Physics Lab — Roadmap, Historical Milestones & Verification Checklists

> Reference companion migrated from `AGENTS.md` to keep agent rules compact while preserving historical project milestones, V2+ backlog items, and detailed QA/spec checklists. For official Grade 11/12 topic mapping, see [curriculum-map.md](curriculum-map.md).

---

## 1. Future Capabilities (Post-Version 1 Backlog)

Reserved for releases after core Grade 11/12 simulations and hardware validation are stable:

- Teacher / classroom presentation mode (guided experiments, parameter locking, compact explanations).
- Saved or favorite simulations and classroom session presets.
- Formative quizzes, self-check prompts, and local progress tracking.
- Optional offline-safe content update mechanism and student companion/mobile remote controller.

---

## 2. Historical Bootstrap & Milestone Roadmap

### Fresh-Repository Foundation Sequence (Archived)
1. Create monorepo skeleton and documentation structure (`android/`, `simulation-web/`, `docs/`, `scripts/`).
2. Create Android TV Compose shell with `WebViewAssetLoader` serving bundled local assets.
3. Build Canvas vertical slice (`Projectile Motion`), browser dev loop, Android WebView integration, and D-pad verification before scaling chapter coverage.

### Early Validation Simulations (Capabilities Exercised)
1. **Projectile Motion** *(done)* — kinematics + vectors + trajectory.
2. **Newton's Second Law** *(done)* — force balance + static/kinetic friction thresholds + vectors.
3. **Simple Harmonic Motion / Spring** *(done)* — periodic motion + damping/forced resonance + graphs.
4. **Work, Energy & Power** *(done)* — incline dynamics + spring compression + energy accounting ledger.
5. **Circular Motion** *(specified)* — rotation + radial/tangential vectors + vertical loops & banking.
6. **Electric Field & Basic Circuits / Ohm's Law** *(planned validation targets)* — vector fields + component topology.

### High-Level Project Milestones
- **Milestone 0:** Repository foundation, Android TV shell, Vite/TS project, offline WebView integration.
- **Milestone 1:** First vertical slice (`Projectile Motion`), physics tests, D-pad controls, 1080p layout (`v0.1.0`).
- **Milestone 2:** Shared engine (`Vector2`, `SimulationClock`, `Camera2D`, `InputManager`, `SimulationRegistry`, `Graph`).
- **Milestone 3:** Engine-validating simulations across mechanics/oscillations (`v0.2.0`–`v0.3.0`+).
- **Milestone 4–5:** Systematic Grade 11 and Grade 12 CDC curriculum coverage ([curriculum-map.md](curriculum-map.md)).
- **Milestone 6:** Teacher presentation tools, guided experiments, and physical Android TV hardware optimization.

### Incremental Classroom Release Loop
```text
Prototype -> Classroom trial -> Collect usability/readability issues -> Refine controls -> Expand library
```

---

## 3. Simulation Mini-Spec Reference Template

Every simulation specification in `docs/simulation-specs/` should concisely cover:

- **Metadata:** Title, ID, Grade (`11` | `12`), Curriculum Area, Chapter/Unit.
- **Learning Objectives & Concepts:** Aligned with Nepal CDC syllabus.
- **Coordinate System & Equations:** Sign conventions, physical equations, explicit assumptions/approximations, and reset state.
- **Adjustable Parameters & Outputs:** Symbols, SI units, defaults, valid min/max bounds, steps, measured readouts, and derived graphs.
- **Boundary Regimes & Invariants:** Strict vs inclusive thresholds, singularities, numerical tolerances, and testable invariants.
- **Interaction & Accessibility:** D-pad focus sequence, keyboard/touch equivalents, classroom readability considerations, and example guided experiments (without blocking free exploration).

---

## 4. Visual, Integration & Hardware Checklists

### Visual Sanity Checklist
- Initial screen, reset state, parameter adjustment, start/pause, back navigation, focus movement, graph scaling/clearing, and resize behavior across 1080p and 4K viewports. Screenshot comparison supplements—never replaces—mathematical tests.

### Android / WebView Integration Checklist (Pre-Release)
```text
[ ] APK installs cleanly
[ ] App launches completely offline (zero runtime network requests)
[ ] WebViewAssetLoader serves local HTML/JS/CSS/assets via virtual HTTPS origin
[ ] Back button navigates cleanly: simulation -> chapter -> grade -> home
[ ] D-pad reaches every interactive control with clear visible focus and no focus traps
[ ] Select/OK triggers actions; Reset and Pause work reliably
[ ] Leaving simulation cleanly stops requestAnimationFrame / clock loops without leaks
[ ] Reopening simulations works repeatedly without stale state
```

### Physical Android TV Hardware Test Record Template
```text
TV Brand / Model:
Android Version & API Level:
Screen Resolution / Overscan Behavior:
RAM (if known):
WebView / Chrome Version:
Observed Frame Pacing / Performance:
Physical IR / Bluetooth Remote D-pad Behavior:
```

### Definition of Done: Simulation
```text
[ ] Mathematical model, SI units, clamping, and initial/reset/pause states verified
[ ] Pure physics invariants covered in Vitest (tolerances, regimes, determinism)
[ ] D-pad controls, visible focus state, and keyboard/touch parity verified
[ ] Measurements and graphs derive strictly from live simulation state
[ ] Resize and offline asset loading verified
[ ] Concise specification and curriculum mapping updated
```

### Definition of Done: Feature / Milestone
```text
[ ] Requirements and architectural layer boundaries preserved
[ ] Implementation modular and complete
[ ] Web CI checks pass (npm test, npm run typecheck, npm run build)
[ ] Android WebView integration verified when Android/assets changed
[ ] Documentation updated from verified code constants and observed outputs
```
