# AGENTS.md — Physics Lab Android TV Application

## 0. Mission

You are the coding agent for **Physics Lab**, an offline-first educational Android TV application for a college in Nepal.

The application provides interactive physics simulations for **Grade 11 and Grade 12** students following the Nepal secondary-level Physics curriculum. The user experience should be inspired by the *learning approach* of PhET Interactive Simulations: students change parameters, observe physical behavior, measure results, and form conclusions.

Do **not** make a clone of PhET. Build an original application with original UI, original visual assets, original code where practical, and a reusable simulation engine.

Primary target:
- Android-powered smart TV used in a classroom/college.
- Remote control / D-pad is the primary input method.
- 16:9 landscape display is the default assumption.
- The app must work without an internet connection after installation.

Secondary development targets:
- Desktop browser during development for rapid simulation iteration.
- Android emulator or Android TV test device.

---

## 1. Product Goals

### Must-have goals

1. Provide curriculum-aligned interactive simulations for Grade 11 and Grade 12 Physics.
2. Make abstract physics concepts visually understandable.
3. Use physically meaningful mathematical models rather than decorative animations.
4. Make every simulation usable with an Android TV remote/D-pad.
5. Make the app offline-first.
6. Build a reusable TypeScript simulation engine so new simulations do not require rewriting the rendering and interaction system.
7. Keep the main Android application lightweight and focused on TV navigation, packaging, settings, and the simulation container.
8. Make simulations readable from a classroom viewing distance.
9. Make reset/repeat/exploration fast and obvious.
10. Keep physics calculations testable independently from rendering.

### Nice-to-have later

- Teacher/demo mode.
- Guided experiments.
- Short conceptual explanations.
- Saved/favorite simulations.
- Quizzes and formative assessment.
- Progress tracking.
- Optional remote content update mechanism.
- Optional student companion/mobile controller.

Do not build these before the core simulation engine and first simulations are solid.

---

## 2. Non-Goals for Version 1

Do NOT introduce these unless a concrete requirement appears:

- Backend server.
- User accounts.
- Cloud database.
- Firebase authentication.
- Analytics platform.
- AI tutor/chatbot.
- Online-only simulations.
- Microservices.
- Complex multiplayer architecture.
- Server-side physics calculations.
- A full custom Android graphics engine.
- A copy/fork of PhET's entire codebase.

The first production architecture should be capable of running completely offline from the APK.

---

## 3. Source-of-Truth Curriculum

The curriculum must be treated as a separate concern from the rendering engine.

The current project is intended for Nepal Grade 11/12 Physics, so curriculum coverage must be verified against official Curriculum Development Centre (CDC) material rather than guessed from random websites or from one textbook.

Useful official references:
- Nepal CDC Physics, Grades 11 and 12 curriculum: https://moecdc.gov.np/storage/gallery/1672125377.pdf
- Nepal CDC Secondary Level Curriculum / Physics specification-grid material: https://moecdc.gov.np/storage/gallery/1674713459.pdf
- CDC e-library: https://lib.moecdc.gov.np/

The exact chapter/unit structure used by the college should be confirmed before claiming complete curriculum coverage. Textbooks may arrange content differently from the official curriculum.

### Curriculum workflow

For each topic:

1. Identify the official curriculum area/unit.
2. Identify the learning outcomes or competencies where available.
3. Identify the mathematical relationships students are expected to use.
4. Decide whether the concept benefits from simulation.
5. Define one or more simulation experiences.
6. Define measurable outputs.
7. Define guided experiment prompts.
8. Add the simulation to a curriculum manifest.

Do not hardcode curriculum structure throughout UI components. Keep it in data/configuration so chapter names/order can be updated without rewriting simulations.

Suggested curriculum data shape:

```ts
export interface CurriculumTopic {
  id: string;
  grade: 11 | 12;
  area: string;
  chapter: string;
  title: string;
  learningObjectives: string[];
  simulationIds: string[];
  order: number;
}
```

---

## 4. Technology Direction

### Android shell

Preferred stack:

- Kotlin.
- Android Studio.
- Jetpack Compose for TV / Android TV optimized Compose APIs where appropriate.
- Navigation Compose or an equivalent simple navigation approach.
- WebView to host the simulation application.
- AndroidX WebKit / WebViewAssetLoader for packaged local web content.

Use current stable versions that are compatible with the project and target devices. Do not blindly copy old dependency versions from tutorials. Check current official Android documentation when selecting versions.

Android TV documentation currently provides Compose for TV support, and TV interaction assumes a D-pad/remote workflow.

References:
- https://developer.android.com/training/tv
- https://developer.android.com/training/tv/get-started/controllers
- https://developer.android.com/training/tv/get-started/navigation
- https://developer.android.com/develop/ui/views/layout/webapps/load-local-content

### Simulation application

Preferred stack:

- TypeScript.
- HTML/CSS.
- Vite.
- HTML5 Canvas for 2D simulations.
- WebGL/PixiJS only where it materially helps performance or rendering complexity.
- Three.js only for simulations that genuinely benefit from 3D.
- `requestAnimationFrame()` for the render loop.
- Native mathematical/physics code wherever the physics is simple enough to own and verify.

Do not introduce a large physics library just because it exists. For educational simulations, transparent equations and controlled numerical models are often preferable.

Potential libraries are optional:
- PixiJS for complex 2D rendering.
- Three.js for selected 3D simulations.
- Matter.js only when a general rigid-body engine is genuinely useful.

No library is mandatory merely because it is popular.

---

## 5. High-Level Architecture

Use this conceptual architecture:

```text
Android TV Application
│
├── Compose for TV UI
│   ├── Home
│   ├── Grade 11
│   ├── Grade 12
│   ├── Areas / Chapters
│   ├── Simulation launcher
│   └── Settings / About
│
└── WebView
    │
    └── Local bundled web application
        │
        ├── TypeScript UI
        ├── Simulation registry
        ├── Simulation engine
        ├── Physics models
        ├── Renderers
        ├── Input abstraction
        └── Curriculum data
```

The simulation web app should be independently runnable in a desktop browser during development.

The Android app should not contain physics equations scattered across Kotlin UI code.

---

## 6. Android/WebView Boundary

Treat the Android/WebView boundary as an explicit interface.

### Default mode

The simulation is entirely local and runs inside WebView.

Use WebViewAssetLoader to serve bundled content rather than `file://` URLs. Android documentation specifically recommends WebViewAssetLoader for local in-app content and discourages enabling broad file URL access.

Reference:
https://developer.android.com/develop/ui/views/layout/webapps/load-local-content

### Security rules

- Do not enable universal file access.
- Do not set `setAllowUniversalAccessFromFileURLs(true)`.
- Do not use `MIXED_CONTENT_ALWAYS_ALLOW`.
- Do not load arbitrary remote code into the production simulation WebView.
- Do not inject untrusted content with JavaScript interfaces.
- Keep JavaScript enabled only because the bundled simulation app requires it.
- Prefer a local-only WebView configuration for Version 1.

### Native ↔ JavaScript bridge

Avoid a bridge unless a real requirement exists.

If Android must communicate with the simulation layer, define a minimal typed message protocol such as:

```text
Android -> Web
  SET_THEME
  OPEN_SIMULATION
  PAUSE_SIMULATION
  RESET_SIMULATION

Web -> Android
  SIMULATION_READY
  REQUEST_EXIT
  SIMULATION_ERROR
```

Never expose a broad or unsafe native API to JavaScript.

---

## 7. Project Structure

Use a monorepo-like structure unless the actual repository already dictates otherwise:

```text
physics-lab/
│
├── android/
│   ├── app/
│   └── ...
│
├── simulation-web/
│   ├── src/
│   │   ├── core/
│   │   ├── physics/
│   │   ├── rendering/
│   │   ├── input/
│   │   ├── ui/
│   │   ├── components/
│   │   ├── simulations/
│   │   ├── curriculum/
│   │   └── main.ts
│   ├── public/
│   ├── assets/
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docs/
│   ├── curriculum-map.md
│   ├── architecture.md
│   ├── simulation-specs/
│   └── qa/
│
├── scripts/
│
├── AGENTS.md
├── README.md
└── LICENSE / THIRD-PARTY-NOTICES as appropriate
```

If the existing repository has a different structure, preserve good existing organization rather than performing a gratuitous rewrite.

---

## 8. Core Simulation Architecture

Every simulation should implement a common lifecycle.

Conceptually:

```ts
export interface Simulation {
  id: string;
  metadata: SimulationMetadata;
  initialize(): void;
  reset(): void;
  update(dt: number): void;
  render(ctx: RenderContext): void;
  handleInput(event: InputEvent): void;
  dispose(): void;
}
```

The exact API may differ after implementation, but the separation of responsibilities is mandatory.

### Separate these layers

```text
Input
  ↓
Simulation state / parameters
  ↓
Physics model
  ↓
Simulation state
  ↓
Renderer
  ↓
Screen
```

Do not let rendering code become the physics model.

Do not let UI slider code directly implement equations.

Do not let Android code calculate simulation state.

---

## 9. Simulation Engine Responsibilities

The reusable engine should eventually own:

- Fixed/update timestep handling.
- Simulation clock.
- Pause/resume.
- Reset.
- World coordinates.
- Screen/world coordinate conversion.
- Scaling and zoom where appropriate.
- Basic vector math.
- Units.
- Measurement helpers.
- Graphing.
- Labels and annotations.
- Input abstraction.
- Selection/focus state.
- Render layers.
- Simulation lifecycle.
- Debug instrumentation.

Potential core classes:

```text
Vector2
Vector3
Transform2D
SimulationClock
SimulationWorld
PhysicsObject
Particle
Force
Measurement
GraphSeries
Camera2D
InputManager
SimulationRegistry
UnitFormatter
```

Only create classes when they represent meaningful reusable concepts. Avoid abstract-class proliferation.

---

## 10. Numerical and Physics Rules

The application is educational software. Physics correctness is more important than visual spectacle.

### General rules

1. Define quantities with units.
2. Prefer SI units internally.
3. Convert to display units only at the presentation layer.
4. Keep equations explicit and reviewable.
5. Use deterministic calculations whenever possible.
6. Clamp or validate user input where physical constraints require it.
7. Explain approximations.
8. Add automated tests for equations and invariants.
9. Do not fake physically meaningful output by manually moving graphics along a pre-authored path.
10. Do not silently alter equations to make an animation look better.

### Time integration

For simple models, use a clear numerical integration approach.

Where appropriate:

```text
semi-implicit Euler
or
analytic equations
```

Analytic equations should be preferred when the curriculum model has a clean closed-form solution and using them makes behavior easier to verify.

For more complex numerical systems, document:
- timestep assumptions,
- stability considerations,
- units,
- approximations,
- expected error tolerance.

### Example: projectile motion

For idealized projectile motion without air resistance:

```text
vx = v0 * cos(theta)
vy = v0 * sin(theta)

x(t) = x0 + vx * t
y(t) = y0 + vy * t - 0.5 * g * t^2
```

Do not hardcode a visually convenient parabola.

---

## 11. Unit System

Internally use SI units unless a model has a specific educational reason not to.

Examples:

```text
length      -> m
mass        -> kg
time        -> s
velocity    -> m/s
acceleration-> m/s²
force       -> N
energy      -> J
power       -> W
charge      -> C
current     -> A
voltage     -> V
resistance  -> Ω
frequency   -> Hz
wavelength  -> m
```

Create a unit-formatting layer so that display strings are consistent.

Do not build unit conversions into every simulation independently.

---

## 12. Rendering Model

For 2D simulations, default to Canvas.

Use a logical coordinate system instead of tying physics directly to pixels.

Example:

```text
physics world
    ↓
world-to-screen transform
    ↓
Canvas pixels
```

This allows the same simulation to work at:
- 1280×720
- 1920×1080
- 3840×2160

without changing physics.

### Render order

A typical render pipeline may be:

```text
background
reference grid / axes
static apparatus
physics objects
vectors
trajectories
measurements
graphs
labels
interaction overlays
controls
```

Do not redraw DOM-heavy UI every animation frame unless necessary.

Keep high-frequency simulation rendering inside Canvas/WebGL.

---

## 13. Responsive TV Layout

Design for landscape TV first.

Primary assumption:
- 16:9
- 1080p baseline
- 4K-compatible scaling

Do not position every control with hard-coded pixel coordinates.

Use:
- logical layout areas,
- relative sizing,
- scalable typography,
- safe margins,
- consistent spacing tokens.

Text must remain readable from a classroom viewing distance.

Avoid tiny desktop-style controls.

---

## 14. Android TV Input Rules

The remote/D-pad is the primary interaction mechanism.

The app must support operation with the basic controls expected from Android TV:

- Up
- Down
- Left
- Right
- Select/OK
- Back
- Home

Android TV documentation states that applications must support D-pad input and that Back should navigate backward through the app rather than act as a toggle.

Reference:
https://developer.android.com/training/tv/get-started/controllers

### Input design

Every interactive control must be reachable with the D-pad.

Example:

```text
Angle

        ◀   45°   ▶
```

rather than requiring dragging a mouse across a tiny HTML slider.

Controls may additionally support:
- keyboard arrows during development,
- mouse during browser development,
- touch where useful.

But touch must never be the only input method.

### Focus

At all times, the user should know which control has focus.

Use a strong but non-distracting focus indicator.

Never create focus traps.

Never require a mouse to exit a simulation.

Back should return:

```text
simulation -> chapter list -> grade list -> home
```

and eventually to the Android TV home screen through normal system navigation.

Reference:
https://developer.android.com/training/tv/get-started/navigation

---

## 15. Touch/Pointer vs D-pad in Simulations

Some concepts are naturally drag-based, e.g. moving a charge, object, ray source, or protractor.

For TV, every drag interaction needs a D-pad equivalent.

Possible pattern:

```text
SELECT object
LEFT/RIGHT/UP/DOWN move object
SELECT confirm
```

or:

```text
focus parameter
LEFT/RIGHT adjust value
```

Do not build a simulation that is excellent with a mouse but unusable with a remote.

---

## 16. UI/UX Principles

The UI should feel like an educational laboratory, not an enterprise dashboard.

### Preferred characteristics

- Clean.
- High contrast.
- Spacious.
- Calm.
- Scientific.
- Modern.
- Minimal distraction.
- Consistent across simulations.

### Avoid

- Excessive gradients.
- Tiny cards.
- Dense tables.
- Excessive animation in menus.
- Decorative elements competing with the experiment.
- Complex menus.
- Long paragraphs inside the simulation viewport.

### Every simulation should make these obvious

1. What am I studying?
2. What can I change?
3. What am I observing?
4. What can I measure?
5. How do I reset it?

---

## 17. Standard Simulation Screen

A reusable layout should normally contain:

```text
┌────────────────────────────────────────────────────────┐
│ Simulation title                              Back      │
├────────────────────────────────────────────────────────┤
│                                                        │
│                                                        │
│                  SIMULATION VIEW                       │
│                                                        │
│                                                        │
├────────────────────────────────────────────────────────┤
│ PARAMETERS                                             │
│                                                        │
│ Value A      ◀────────────●──────────▶                 │
│ Value B      ◀────────●──────────────▶                 │
│ Value C      ◀──────────────●────────▶                 │
│                                                        │
│ [ Start ] [ Pause ] [ Reset ]                          │
├────────────────────────────────────────────────────────┤
│ Measurements / Graph / Concept                          │
└────────────────────────────────────────────────────────┘
```

Not every simulation must use exactly this layout; reuse patterns where appropriate.

---

## 18. Educational Design Requirements

Every completed simulation needs a written mini-spec before implementation.

Required fields:

```text
Title
Grade
Curriculum area
Chapter/unit
Concepts
Learning objectives
Variables the learner can change
Measured outputs
Equations/model
Assumptions
Expected observations
Possible experiments
Reset state
Input map
Accessibility/readability considerations
```

### Example experiment prompt

```text
Experiment: Effect of Launch Angle

1. Set velocity to 20 m/s.
2. Try 30°.
3. Try 45°.
4. Try 60°.
5. Compare the range.
6. Explain why the result changes.
```

Do not confuse a guided experiment with the simulation itself. The simulation should still support free exploration.

---

## 19. First Simulation Priority

The first full implementation should be **Projectile Motion**.

It should include:

- initial speed,
- launch angle,
- gravity,
- start,
- pause,
- reset,
- projectile motion,
- trajectory,
- velocity vector,
- acceleration vector,
- time,
- x/y position,
- range,
- maximum height,
- visually useful axis/scale,
- basic graphing or measurement output.

Possible extension later:
- Earth/Moon/custom gravity,
- launch height,
- horizontal launch,
- trajectory comparison,
- idealized air resistance.

Do not add every extension before the baseline simulation is correct and tested.

---

## 20. Second and Early Validation Simulations

After Projectile Motion, build several simulations that test reuse of the architecture:

1. Newton's Second Law.
2. Friction.
3. Circular Motion.
4. Simple Harmonic Motion / Spring.
5. Electric Field.
6. Basic Circuit / Ohm's Law.

These should intentionally exercise different engine capabilities:

```text
Projectile Motion
→ kinematics + vectors + graph

Newton's Second Law
→ force + vectors + parameter changes

Friction
→ forces + state changes + thresholds

Circular Motion
→ rotation + vectors + path

SHM
→ periodic motion + graph

Electric Field
→ vector field + charge interactions

Circuit
→ components + topology + calculations
```

Only after these work should large-scale chapter coverage begin.

---

## 21. Reusable Components

Build reusable controls and visualization components instead of custom copies.

Potential components:

### Input components

- TVSlider
- StepperControl
- Toggle
- SelectControl
- NumericParameter
- PlayPauseButton
- ResetButton
- ModeSelector

### Visualization components

- VectorArrow
- Axis
- Grid
- Particle
- Box
- Spring
- Pendulum
- Charge
- Wire
- Lens
- Mirror
- Ray
- FieldArrow
- Graph
- Ruler
- Protractor
- Label
- Legend
- MeasurementPanel

Create components when at least two simulations genuinely benefit from them.

---

## 22. Simulation Registry

Do not hardcode routing to each simulation in multiple places.

Use a registry conceptually similar to:

```ts
interface SimulationDefinition {
  id: string;
  title: string;
  grade: 11 | 12;
  area: string;
  chapter: string;
  create: () => Simulation;
}
```

Then:

```ts
simulationRegistry.register(projectileMotionDefinition);
simulationRegistry.register(newtonsSecondLawDefinition);
```

The UI can resolve simulations by ID.

This will make adding dozens of simulations manageable.

---

## 23. State Management

Keep simulation state explicit.

Example:

```ts
interface ProjectileState {
  time: number;
  position: Vector2;
  velocity: Vector2;
  angle: number;
  initialSpeed: number;
  gravity: number;
  running: boolean;
}
```

Do not rely on hidden mutable DOM state.

Reset should restore a well-defined initial state.

Pause should freeze the simulation clock without destroying state.

---

## 24. Determinism

Where practical, simulations should be deterministic.

Given:

```text
same initial state
same parameters
same timestep policy
```

results should be reproducible.

This is important for automated tests and educational trust.

Use seeded randomness for simulations that intentionally require randomness.

---

## 25. Randomness

For simulations such as quantum experiments or random decay:

- use a clear random source,
- optionally expose a reproducibility/debug seed,
- never claim a single run demonstrates a statistically reliable conclusion,
- display enough trials/data to let students observe distributions.

For example, a radioactive-decay simulation should not confuse one particle's random decay time with the predictable statistical behavior of a large sample.

---

## 26. Graphing

Graphs are educational tools, not decoration.

A graph component should support:

- labeled x/y axes,
- units,
- sensible scaling,
- clear legend when multiple series exist,
- reset/clear behavior,
- sampled data rather than unlimited memory growth,
- optional pause/freeze snapshot.

Do not let a graph retain millions of points indefinitely.

Use downsampling or a bounded buffer for long-running experiments.

---

## 27. Performance Requirements

The application runs on a smart TV, where hardware can be significantly weaker or more constrained than a developer laptop.

### Baseline goals

- Smooth interaction.
- No visible stutter during ordinary parameter changes.
- Avoid unnecessary allocations inside the animation loop.
- Avoid rebuilding large UI structures every frame.
- Keep render complexity proportional to what is visible.
- Pause simulation and animation work when the simulation screen is not active.

### Frame loop

Avoid patterns like:

```ts
requestAnimationFrame(() => {
  createHundredsOfObjects();
  queryTheDOMRepeatedly();
  allocateLargeArrays();
});
```

Prefer preallocated/reused objects and predictable data flow where profiling shows it matters.

### Performance validation

Test on the actual college TV as early as possible.

A browser running on a powerful laptop is not sufficient evidence of TV performance.

---

## 28. Memory Management

Watch for:

- event listener leaks,
- animation loops continuing after navigation,
- WebView references held after destruction,
- graph arrays growing forever,
- simulation objects not disposed,
- image/texture duplication.

Every simulation should have a cleanup/dispose path.

---

## 29. Asset Policy

Prefer:

- programmatic/vector-style graphics,
- original diagrams,
- openly licensed assets with documented licenses,
- simple generated textures/icons where appropriate.

Keep asset licensing traceable.

Maintain a `THIRD-PARTY-NOTICES` or equivalent inventory for external assets and libraries.

Never silently copy:
- PhET icons,
- PhET logos,
- screenshots,
- UI graphics,
- proprietary textbook diagrams,
- copyrighted images from random websites.

---

## 30. PhET Reference Policy

PhET is a design and educational reference, not the product to clone.

Useful for studying:
- interaction patterns,
- simulation pedagogy,
- parameter exploration,
- visualization strategies,
- graphing,
- conceptual experiments.

PhET's official licensing page currently states that regular HTML simulation files are distributed under CC BY-NC 4.0 with attribution requirements, and its site separately discusses other licensing arrangements. PhET's source repositories also have their own license requirements.

References:
- https://phet.colorado.edu/en/licensing
- https://phet.colorado.edu/en/about/source-code
- https://github.com/phetsims/phet-info/blob/main/doc/phet-development-overview.md

### Critical rule

Do not copy or adapt PhET source code merely because it is public.

Before using any third-party PhET code/assets:
1. identify the exact repository/license,
2. determine whether the intended use is compatible,
3. preserve required notices,
4. document the dependency,
5. do not copy branding or imply endorsement.

When in doubt, implement the behavior independently.

---

## 31. Originality Rule

The project should have its own:

- application name,
- branding,
- color system,
- icons,
- interaction design where practical,
- code architecture,
- educational activity text,
- visual assets.

The goal is to create a Nepal-curriculum-focused physics laboratory, not a repackaged version of an existing simulation website.

---

## 32. Accessibility and Classroom Readability

The app is viewed at a distance.

Therefore:

- Prefer large labels.
- Avoid low-contrast text.
- Do not communicate meaning using color alone.
- Keep essential controls visible.
- Make focus obvious.
- Use readable scientific notation.
- Use large enough touch/selection targets even though D-pad is primary.
- Avoid rapidly flashing content.
- Provide pause controls for fast simulations.

Graphs and vectors must have labels or legends when colors alone would otherwise be ambiguous.

---

## 33. Typography and Math Rendering

Physics notation must be readable:

```text
v₀
θ
g
Δx
Δt
F = ma
E = mc²
λ
μ₀
ε₀
```

Use a consistent strategy for mathematical notation rather than mixing arbitrary Unicode, images, and HTML in every simulation.

For complex equations, consider MathJax or a lightweight math-rendering strategy only if needed. Do not add a large dependency for a few simple equations.

---

## 34. Error Handling

Failures must be understandable.

### Development

Show useful errors in logs and diagnostics.

### Production

Avoid crashing the entire app because a single simulation failed to initialize.

A simulation-level failure should ideally show:

```text
This simulation could not be loaded.
Please return to the chapter and try again.
```

and log diagnostic details for developers.

Do not silently swallow exceptions.

---

## 35. Loading Behavior

Simulation launch should feel immediate.

For heavy simulations:

```text
launch
  ↓
loading state
  ↓
initialize assets
  ↓
SIMULATION READY
```

Do not block the entire Android UI on long JavaScript setup.

Avoid unnecessary large startup bundles. Code-split simulations if bundle size becomes meaningful.

---

## 36. Offline Requirements

Version 1 must not require internet access to:

- open the home screen,
- browse chapters,
- launch simulations,
- run physics calculations,
- read educational text,
- use core controls.

All required simulation code/assets must be bundled.

Do not introduce CDN dependencies into production builds unless there is a specific offline-compatible packaging reason.

Avoid runtime network requests entirely for Version 1 unless explicitly required.

---

## 37. Data Model

Keep content separate from code where possible.

Example:

```text
curriculum.json
simulation metadata JSON/TS
experiment definitions
localized strings
```

A simulation's model should not contain a giant hardcoded block of chapter navigation text.

Example:

```ts
{
  id: "projectile-motion",
  title: "Projectile Motion",
  grade: 11,
  area: "Mechanics",
  chapter: "Kinematics",
  objectives: [...],
  experiments: [...]
}
```

---

## 38. Localization

The app language is **English** for Version 1.

However, do not hardcode every visible string directly into drawing functions.

Use a small localization layer so Nepali language support can be added later without rewriting simulations.

Suggested:

```text
locales/
  en.json
  np.json (future)
```

Version 1 only requires English content.

---

## 39. Development Workflow

When implementing a new feature:

1. Inspect the repository.
2. Understand existing architecture before modifying it.
3. Identify the smallest useful change.
4. Implement the model first.
5. Add tests for physics/math.
6. Implement rendering.
7. Implement input.
8. Test browser behavior.
9. Test Android/WebView behavior.
10. Test D-pad behavior.
11. Profile only where necessary.
12. Update documentation.

Do not make unrelated refactors during feature work.

---

## 40. Agent Behavior

The coding agent should behave as a senior engineer and physics-software collaborator.

### Before coding

- Inspect the repository.
- Look for existing AGENTS.md, README.md, package files, Gradle files, and architecture docs.
- Preserve existing good work.
- Check whether the requested feature already exists.
- Identify affected layers.

### When requirements are ambiguous

Choose the simplest design consistent with the product goals, but document important assumptions.

Do not invent curriculum facts, physics claims, or dependency requirements without verification.

### When a requested approach is flawed

Explain the technical problem and propose a better implementation rather than blindly following it.

### Never

- fabricate successful builds,
- claim tests passed when they were not run,
- claim TV compatibility without testing or explaining the limitation,
- hide compile errors,
- replace working architecture with a new stack without need,
- add dependencies without justification,
- copy third-party code without checking its license.

---

## 41. Code Style

Use clear, boring, maintainable code.

Prefer:

- small functions,
- explicit names,
- immutable data where practical,
- type-safe APIs,
- early validation,
- limited global state,
- documented mathematical formulas,
- comments that explain *why*, not obvious *what*.

Avoid:

- giant files,
- 1,000-line React-style components,
- global mutable state everywhere,
- magic constants,
- copy/paste simulation implementations,
- premature abstraction,
- unnecessarily clever math code.

---

## 42. TypeScript Rules

Use strict TypeScript.

Recommended direction:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

Exact compiler options may adapt to the repository, but type safety should not be intentionally weakened to make code compile.

Avoid `any` unless there is a documented reason.

Prefer discriminated unions for input/events/state machines when useful.

---

## 43. Kotlin Rules

Use idiomatic Kotlin and Android architecture.

Prefer:

- immutable state,
- lifecycle-aware components,
- Compose state appropriately scoped,
- coroutines only when they solve a real asynchronous problem,
- clear separation between Android UI and WebView integration.

Avoid turning the Android layer into the simulation engine.

---

## 44. Physics Test Strategy

Every important physics model needs tests independent from the UI.

Examples for projectile motion:

- `theta = 0` behaves as horizontal launch.
- `theta = 90°` has zero horizontal component.
- Range is near the expected analytical value under ideal assumptions.
- Maximum height is near the expected analytical value.
- Increasing initial velocity increases range for otherwise equal ideal conditions.
- Gravity affects vertical motion in the expected direction.

Use tolerances for floating-point comparisons.

Example:

```ts
expect(actual).toBeCloseTo(expected, 3);
```

Do not use exact equality for most floating-point physics calculations.

---

## 45. Visual Test Strategy

For important simulations, test:

- initial screen,
- reset state,
- parameter adjustment,
- start/pause,
- back navigation,
- focus movement,
- graph behavior,
- resize behavior,
- 1080p layout,
- 4K scaling where available.

Screenshot comparison can be useful, but visual correctness should not replace mathematical tests.

---

## 46. Android/Web Integration Test Checklist

Before considering Version 1 stable, verify:

```text
[ ] APK installs
[ ] App launches offline
[ ] WebView loads local simulation
[ ] JavaScript works
[ ] Local CSS/JS/images load
[ ] No network request is required
[ ] Back exits simulation correctly
[ ] D-pad reaches every visible control
[ ] Select activates controls
[ ] Focus indicator is visible
[ ] Reset works
[ ] Pause works
[ ] No simulation loop continues after exit
[ ] App survives reopening simulation
[ ] App can return to home
```

---

## 47. Actual Device Testing

A real TV test is mandatory before release.

At minimum test on the actual college Android TV hardware as early as possible.

Record:

```text
TV brand/model:
Android version:
API level:
Resolution:
RAM if known:
WebView/Chrome version:
Observed performance:
Input behavior:
```

If a hardware limitation affects architecture, document it.

Do not optimize for an imaginary television specification indefinitely.

---

## 48. Build Artifacts

The project should eventually produce:

```text
Debug APK
Release APK/AAB as appropriate

Web simulation development build
Web simulation production build
```

The Android build should package the production web build.

Do not accidentally ship development server URLs or debug-only assets.

---

## 49. Production Build Integrity

Before release, verify:

- no localhost URLs,
- no dev server URLs,
- no unnecessary debug logging,
- no test chapter placeholders,
- no broken asset paths,
- no missing fonts/images,
- no accidental internet dependency,
- version number updated,
- app icon and branding present,
- legal notices present where required.

---

## 50. Documentation Requirements

Maintain:

### `README.md`

Include:
- project purpose,
- architecture diagram,
- setup instructions,
- development commands,
- Android build instructions,
- Web simulation development instructions,
- TV deployment instructions,
- contribution guidelines.

### `docs/architecture.md`

Document:
- Android/WebView boundary,
- simulation engine architecture,
- input system,
- rendering system,
- data model,
- build pipeline.

### `docs/curriculum-map.md`

Track:

```text
Grade
Area
Chapter/unit
Concept
Simulation
Status
Notes
```

Example status values:

```text
planned
specified
prototype
implemented
tested
curriculum-reviewed
release-ready
```

---

## 51. Simulation Specification Template

Every new simulation should have a specification in `docs/simulation-specs/`.

Use:

```md
# Projectile Motion

## Curriculum
- Grade: 11
- Area: Mechanics
- Chapter/unit: ...

## Learning objectives
- ...

## Core model
- ...

## Equations
- ...

## Assumptions
- ...

## Parameters
- ...

## Measurements
- ...

## Interactive controls
- ...

## D-pad mapping
- ...

## Guided experiments
- ...

## Reset state
- ...

## Tests
- ...

## Known limitations
- ...
```

---

## 52. Simulation Prioritization

Do not treat every physics concept as equally suited to simulation.

Prioritize concepts where interaction reveals something difficult to see from a static diagram.

High-value examples:

- projectile motion,
- vector addition,
- force and motion,
- collisions,
- circular motion,
- SHM,
- waves,
- interference,
- diffraction,
- electric fields,
- field lines,
- circuits,
- electromagnetic induction,
- ray optics,
- photoelectric effect,
- nuclear decay.

Some definitions/formulas may be better handled as explanatory content rather than forced into a simulation.

Do not inflate the simulation count for vanity metrics.

---

## 53. Physics Model Transparency

Each simulation should have an optional “Model / Assumptions” area accessible to the user or teacher.

Example:

```text
Model assumptions

• Air resistance is ignored.
• Gravitational acceleration is constant.
• Earth is treated as flat over the simulated distance.
• Objects are treated as point masses.
```

This prevents students from treating the simulation as reality rather than a model.

---

## 54. Educational Integrity

Do not optimize simulations to produce textbook answers by hiding complexity.

Students should be able to see cause and effect.

Prefer:

```text
change parameter
→ observe model change
→ measure
→ compare
→ reason
```

rather than:

```text
enter answer
→ app tells student if correct
```

Assessment features may be added later, but exploration is core to Version 1.

---

## 55. Error and Approximation Display

When appropriate, display rounded values deliberately.

Internally keep adequate precision.

Example:

```text
Internal: 10.193679...
Display: 10.19 m
```

Avoid false precision such as showing:

```text
10.1936793847 m
```

for a classroom simulation unless the precision is pedagogically meaningful.

---

## 56. Scientific Notation

Use standard scientific notation for very large/small quantities.

Examples:

```text
1.60 × 10⁻¹⁹ C
6.63 × 10⁻³⁴ J·s
```

Keep notation consistent across simulations.

---

## 57. Graph and Measurement Philosophy

Where a graph teaches the concept, make it responsive to the simulation.

For example:

```text
position vs time
velocity vs time
acceleration vs time
```

should update from the actual simulation state.

Never generate a graph from a separate hardcoded dataset while the animation uses another model.

The displayed measurements must come from the same source of truth as the simulation.

---

## 58. Debug Mode

A development-only debug mode may expose:

```text
FPS
simulation time
real dt
object count
canvas resolution
world scale
physics parameters
```

Do not expose distracting debug data in production.

A debug toggle can be controlled through a development query parameter or build flag.

---

## 59. Logging

Log enough to diagnose:

- simulation initialization,
- simulation errors,
- Android/WebView failures,
- unexpected input/state transitions.

Do not spam logs every animation frame in production.

---

## 60. Dependency Policy

Every new dependency must answer:

1. What concrete problem does it solve?
2. Is it needed at runtime or build time?
3. Is its license compatible with the project?
4. Does it work offline?
5. Does it increase APK/bundle size meaningfully?
6. Could the feature be implemented more simply in-house?

Prefer small, well-maintained dependencies.

Do not add libraries merely because a tutorial used them.

---

## 61. Versioning Policy

Do not hardcode old dependency versions from the original project plan.

When initializing/updating dependencies:

1. Check current official Android documentation for Android libraries.
2. Check current package registry/package documentation for web libraries.
3. Prefer a coherent, compatible dependency set.
4. Document important version choices.
5. Avoid unnecessary upgrades in unrelated changes.

---

## 62. Browser Development

The simulation web app should support a fast development loop:

```text
npm install
npm run dev
```

or the equivalent commands established by the project.

A developer should be able to work on a simulation in a normal browser without building an APK for every change.

This is one of the key reasons the simulation layer is TypeScript/HTML5.

---

## 63. Build Pipeline Concept

Use:

```text
TypeScript source
      ↓
Vite build
      ↓
production web assets
      ↓
Android assets
      ↓
APK/AAB
```

Automate copying of the web production build into the Android project's assets directory where practical.

Do not manually copy random files after every build.

---

## 64. CI (Later)

Once the project is stable, CI should validate:

```text
TypeScript typecheck
Unit tests
Web production build
Android compile
Lint
```

A CI pipeline is valuable, but do not spend the initial project phase building elaborate CI before there is working application code.

---

## 65. Git Rules

Use focused commits.

Examples:

```text
feat: add projectile motion model
feat: add reusable vector arrows
feat: add TV stepper control
feat: integrate web build into Android assets
fix: stop animation loop on simulation exit
test: add projectile motion equations
```

Do not mix unrelated formatting, architecture rewrites, and features in one commit.

---

## 66. Branching

Simple project workflow is preferred:

```text
main
  └── feature/<short-description>
```

Do not create elaborate branching strategies unless the team grows enough to need them.

---

## 67. Milestone Plan

### Milestone 0 — Repository foundation

- Android project.
- Web simulation project.
- WebView integration.
- Offline local asset loading.
- Basic TV navigation.
- Basic build pipeline.

### Milestone 1 — First simulation

- Projectile Motion.
- Physics tests.
- D-pad controls.
- Reset/pause/start.
- Measurements.
- 1080p layout.

### Milestone 2 — Reusable engine

- Vector utilities.
- Coordinate transforms.
- Graph component.
- Input manager.
- Registry.
- Reusable parameter controls.

### Milestone 3 — 5–8 simulations

Choose simulations that validate different engine capabilities.

### Milestone 4 — Grade 11 coverage

Map every official curriculum area to one or more simulations/content experiences.

### Milestone 5 — Grade 12 coverage

Same process.

### Milestone 6 — Teacher/classroom refinement

- Guided experiments.
- Improved navigation.
- Better explanations.
- Real-device performance work.

---

## 68. Definition of Done: Simulation

A simulation is not done because it renders.

It is done only when:

```text
[ ] Correct mathematical model
[ ] Units verified
[ ] Initial state defined
[ ] Reset implemented
[ ] Pause implemented
[ ] Parameters validated
[ ] D-pad controls implemented
[ ] Focus state visible
[ ] Measurements correct
[ ] Graphs (if required) derive from simulation state
[ ] Resize tested
[ ] Offline tested
[ ] Unit tests written
[ ] Visual sanity check completed
[ ] Documentation written
[ ] Curriculum mapping added
```

---

## 69. Definition of Done: Feature

A feature is done when:

```text
[ ] Requirements understood
[ ] Architecture impact considered
[ ] Implementation complete
[ ] Typecheck/build passes
[ ] Tests pass
[ ] Android integration works where relevant
[ ] D-pad behavior works where relevant
[ ] No obvious performance regression
[ ] Documentation updated
```

---

## 70. Handling Large Features

For large requests such as “build all Grade 11 mechanics”: do not generate dozens of low-quality implementations in one pass.

Instead:

1. Create/confirm the curriculum map.
2. Group concepts by reusable mechanics.
3. Write simulation specs.
4. Build one representative simulation.
5. Refine shared components.
6. Implement the next few simulations.
7. Test the architecture before scaling further.

Quality and reuse matter more than raw simulation count.

---

## 71. What “PhET-like” Means Here

Interpret “PhET-like” as:

- interactive,
- exploratory,
- visual,
- responsive,
- experimentally useful,
- concept-focused,
- parameter-driven,
- measurable.

Do NOT interpret it as:

- copy PhET UI,
- copy PhET code,
- copy PhET assets,
- reproduce PhET branding,
- make a visual imitation.

---

## 72. Example Simulation Families

The following are candidate simulation families, not a rigid final curriculum list.

### Mechanics

- Vector Addition
- Kinematics
- Projectile Motion
- Newton's Laws
- Friction
- Work and Energy
- Momentum and Collisions
- Circular Motion
- Gravitation
- Elasticity
- Fluid Mechanics

### Heat and Thermodynamics

- Thermal Expansion
- Gas Laws
- Molecular Motion
- Heat Transfer
- Thermodynamic Processes
- P-V diagrams
- Heat Engines

### Waves / Oscillations

- Spring
- Simple Pendulum
- SHM
- Damping
- Resonance
- Transverse/Longitudinal Waves
- Standing Waves
- Sound
- Doppler Effect

### Electricity

- Charge interactions
- Electric field
- Potential
- Capacitor
- Ohm's law
- Series/parallel circuits
- Kirchhoff's laws

### Magnetism / EM

- Magnetic field of wire
- Solenoid
- Magnetic force
- Motor
- Generator
- Electromagnetic induction
- Transformer
- AC concepts

### Optics

- Reflection
- Refraction
- Snell's law
- Mirrors
- Lenses
- Optical instruments
- Interference
- Diffraction
- Polarization

### Modern Physics

- Photoelectric effect
- Atomic models
- Spectra
- Radioactive decay
- Nuclear binding energy
- Mass-energy equivalence
- Basic quantum concepts

The final list must be derived from the official curriculum map.

---

## 73. Avoiding Feature Creep

When a simulation has:

```text
core model
+ controls
+ measurements
+ reset
```

get that working first.

Then add:

```text
vectors
graphs
guided experiment
advanced mode
```

Only after the basic simulation is stable.

Do not turn the first simulation into the entire product.

---

## 74. Future Teacher Mode

Design the architecture so a future teacher mode could:

- hide advanced controls,
- lock parameters,
- show a presentation-friendly layout,
- run guided scenarios,
- project a preconfigured state.

Do not implement this now unless requested.

---

## 75. Future Mobile/Remote Control

A future architecture could allow a phone to control the TV, but Version 1 should not require it.

Do not add networking solely because it could be useful later.

Keep the core simulation API independent of the input source so a future remote controller can reuse it.

---

## 76. Future Data/Assessment Layer

If assessment is added later, assessment should consume simulation state rather than implement duplicate physics.

For example:

```text
simulation state
      ↓
assessment evaluator
      ↓
question/result
```

not:

```text
simulation physics
assessment physics
```

with two independent implementations that can disagree.

---

## 77. Release Strategy

Do not wait until all Grade 11/12 simulations are complete before testing with teachers/students.

Early releases should be small:

```text
Prototype
→ classroom trial
→ collect issues
→ improve controls/readability
→ add simulations
```

The real TV and classroom context should influence UX decisions early.

---

## 78. Technical Decision Rule

When choosing between two approaches, prefer the one that is:

1. Easier to verify mathematically.
2. Easier to test.
3. Easier to use with a D-pad.
4. More reliable offline.
5. Easier to reuse across simulations.
6. Easier to maintain by a small student/developer team.

Do not optimize for theoretical scalability that the actual project does not need.

---

## 79. First Tasks for a Fresh Repository

If the repository is empty, the agent should work in this order:

### Task 1
Create the project skeleton and this documentation structure.

### Task 2
Create the Android TV shell with a simple Compose UI.

### Task 3
Create the TypeScript/Vite simulation project.

### Task 4
Make the Android WebView load the bundled web app using WebViewAssetLoader.

### Task 5
Make an extremely simple Canvas demo render inside the WebView.

### Task 6
Implement the shared simulation lifecycle.

### Task 7
Implement Projectile Motion.

### Task 8
Test it in a desktop browser.

### Task 9
Test it inside Android WebView.

### Task 10
Test D-pad interaction.

### Task 11
Only then begin expanding the simulation library.

---

## 80. Final Principle

The project succeeds when a physics teacher can stand in front of a classroom TV, select a Grade 11/12 topic with a remote, start an experiment, change a variable, observe the physical consequences, and explain the concept from what students see.

A large number of simulations is not itself success.

A reusable engine + correct physics + clear interaction + curriculum alignment + reliable TV operation is the foundation.

Build those foundations first.
