# Architecture

## Product Scope & Design Philosophy

Physics Lab is an **interactive physics simulation application**, inspired by PhET Interactive Simulations, specifically engineered for offline classroom Android TV displays at Shree Public High School, Dharan-12, Sunsari, Nepal.

- **Primary Goal:** Hands-on parameter manipulation, live physics calculations, real-time Canvas visualization, vector displays, and measurements.
- **Explicit Non-Goals:** Physics Lab is **not** an online textbook, learning management system, notes platform, or assessment engine. It contains no student login, cloud sync, grading, essay lessons, or digital textbook reproductions.
- **Curriculum Role:** Nepal CDC curriculum documents in `docs/curriculum/` serve as an internal developer reference for mapping simulation opportunities and ensuring mathematical/academic accuracy. Application runtime data stores only concise chapter metadata for navigation and simulation launching.

## Overview

Physics Lab uses a two-layer architecture:

```
┌──────────────────────────────────────┐
│        Android TV Application        │
│                                      │
│   Kotlin + Jetpack Compose for TV    │
│   ┌──────────────────────────────┐   │
│   │  Home → Grade → Chapter      │   │
│   │  → SimulationScreen          │   │
│   └──────────────────────────────┘   │
│                 │                     │
│                 ▼                     │
│   ┌──────────────────────────────┐   │
│   │         WebView              │   │
│   │  WebViewAssetLoader          │   │
│   │  (local HTTPS domain)        │   │
│   └──────────────────────────────┘   │
│                 │                     │
│                 ▼                     │
│   ┌──────────────────────────────┐   │
│   │  Bundled Web Assets          │   │
│   │  assets/simulation-web/      │   │
│   └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

## Android Layer

**Responsibility:** TV navigation shell, WebView hosting.

- `MainActivity.kt` — Single Compose activity
- `NavGraph.kt` — Home → Grade → Chapter → Simulation navigation
- `HomeScreen.kt` — Grade selection
- `GradeScreen.kt` — Curriculum areas for a grade
- `ChapterScreen.kt` — Topics and simulation launcher
- `SimulationScreen.kt` — WebView container
- `CurriculumData.kt` — Curriculum structure (data, not UI)

**Does NOT contain:** Physics equations, simulation rendering, simulation state.

## Web Layer (simulation-web)

**Responsibility:** Simulation physics, rendering, controls, state.

### Core Engine

Minimal set of abstractions used by all simulations:

- `Vector2` — 2D vector math (position, velocity, acceleration)
- `SimulationClock` — Fixed-timestep time management with pause/resume/reset
- `Camera2D` — World coordinates (meters) ↔ screen coordinates (pixels) with origin tracking
- `InputManager` — D-pad/keyboard input abstraction
- `Simulation` — Lifecycle interface: initialize, start, pause, reset, tick, dispose
- `SimulationRegistry` — Central registry mapping simulation IDs to metadata and factory functions

### Physics Layer

Pure mathematical models, separated from rendering:

- `ProjectilePhysics.ts` — Analytic projectile equations
  - `computeProjectileState(params, time)` — position and velocity at time t
  - `computeRange(params)` — horizontal range
  - `computeMaxHeight(params)` — maximum height
  - `computeTimeOfFlight(params)` — total flight time
- `NewtonsSecondLawPhysics.ts` — Force equilibrium and dynamics equations
  - `computeForcesAndAcceleration(params, currentVelocity)` — normal, weight, static/kinetic friction, net force, acceleration
  - `stepNewtonsSecondLaw(currentState, params, dt)` — semi-implicit Euler step with zero-crossing friction arrest
  - `createInitialNewtonsSecondLawState(params)` — initial static state
- `SimpleHarmonicPhysics.ts` — Numerical and analytical periodic motion models
  - Free spring oscillation: vertical spring-mass equilibrium $Y_{\text{eq}} = -(L_0 + \Delta l + h_{\text{block}}/2)$, Hooke's law restoring force, acceleration $a = -(k/m)x$, velocity, and energy breakdown ($E_k, E_p, E_{\text{total}}$)
  - Simple pendulum: angular motion $\theta(t) = \theta_0 \cos(\omega t)$ in the small-angle regime ($\theta \le 15^\circ$), natural frequency $\omega = \sqrt{g/L}$, bob coordinates, and tangential/radial vectors
  - Damped oscillation: viscous damping with coefficient $b$, damping ratio $\gamma = b/(2m)$, and damped angular frequency $\omega_d = \sqrt{\omega_0^2 - \gamma^2}$, covering underdamped, critically damped, and overdamped regimes with energy dissipation
  - Forced oscillation: external periodic driving force $F(t) = F_0 \cos(\Omega t)$, combined complementary and particular solutions, phase lag $\delta$, and transient-to-steady-state evolution
  - Mechanical resonance: steady-state amplitude response $A(\Omega) = \frac{F_0/m}{\sqrt{(\omega_0^2 - \Omega^2)^2 + 4\gamma^2\Omega^2}}$, resonant peak frequency $\Omega_r = \sqrt{\omega_0^2 - 2\gamma^2}$, half-power bandwidth $\Delta \omega \approx 2\gamma$, and air-track horizontal apparatus travel-limit state preservation

### Rendering Layer

Canvas drawing modules and specialized apparatus renderers:

- `CanvasRenderer.ts` — Core 2D canvas drawing primitives:
  - Grid and coordinate axes with unit graduations
  - Vector arrows (velocity, acceleration, applied force, friction, net force)
  - Trajectory paths and projectile circles
  - Ground and ceiling surfaces with diagonal hatching
  - Horizontal distance track with major/minor graduations
  - Sliding crate with mass label
- `SHMRenderer.ts` — Specialized periodic motion apparatus and analytical visualization:
  - Coiled spring drawing with dynamic coil count, pitch, and end-brackets for vertical and horizontal configurations
  - Suspended pendulum pivot, rod/string, and spherical bob with tangential and radial vector overlays
  - Mass block on air-track guide rail with reference equilibrium indicators
  - Live analytical energy bar displays ($E_k, E_p, E_{\text{total}}$) with conservation checks
  - Real-time phase space $(x, v)$ trajectory and position-time $x(t)$ waveforms
  - Analytical resonance curve $A(\Omega)$ with live driving frequency marker $\Omega$ and peak resonance indicators
  - Physical travel-limit boundary lines and boundary-exceeded status alerts

### Simulation Registry & Dynamic URL Hash Routing

The web application supports multiple simulations through a decoupled registry pattern:

```
Android NavGraph / SimulationScreen.kt
              │
              │  loadUrl("https://appassets.androidplatform.net/assets/simulation-web/index.html#simple-harmonic-motion")
              ▼
WebView (Virtual HTTPS domain)
              │
              │  window.location.hash
              ▼
main.ts (hashchange listener)
  1. Cleanly dispose active simulation (listeners, clocks, canvas)
  2. Resolve simulation factory from SimulationRegistry
  3. Instantiate and initialize target simulation
```

#### Implemented Simulations in Registry:
1. `projectile-motion` (`ProjectileMotionSimulation.ts`) — Grade 11, Chapter 3: Kinematics
2. `newtons-second-law` (`NewtonsSecondLawSimulation.ts`) — Grade 11, Chapter 4: Dynamics
3. `simple-harmonic-motion` (`SimpleHarmonicMotionSimulation.ts`) — Grade 12, Chapter 2: Periodic Motion

This ensures:
- Adding new simulations requires zero modifications to navigation routing or WebView shell configuration.
- Navigating between simulations inside WebView tears down previous animation frames, preventing memory leaks.
- Desktop browser development directly supports bookmarkable/shareable URLs (e.g. `http://localhost:5173/#projectile-motion`, `http://localhost:5173/#newtons-second-law`, `http://localhost:5173/#simple-harmonic-motion`).

### Data Flow

```
D-pad / Keyboard / Touch Input
        ↓
  InputManager / Event Handlers
        ↓
  Parameter adjustment
        ↓
  Physics model (pure math)
        ↓
  Simulation state
        ↓
  Canvas renderer + DOM measurements
        ↓
  Screen
```

## Viewport-Anchored Layout Architecture

Inside an embedded Android `WebView` where parents have `overflow: hidden`, standard CSS units like `100vh` and `100vw` often compute to `0px` because the WebView's layout engine initializes the viewport size asynchronously.

To eliminate layout collapse permanently across both Android TV (16:9) and mobile displays (e.g. 19.5:9):
1. **Viewport Anchoring:** The root `#app` container uses:
   ```css
   #app {
     position: fixed;
     inset: 0;
     width: 100%;
     height: 100%;
     overflow: hidden;
   }
   ```
2. **Deterministic Canvas Sizing:** Canvas dimensions are calculated only after the parent container has non-zero computed layout dimensions via `getBoundingClientRect()`. A `ResizeObserver` and `window.resize` handler dynamically update the canvas backing store scaled by `window.devicePixelRatio`.
3. **Safe Camera Bounds:** `Camera2D.fitWorld()` clamps margins to `Math.max(1, ...)` ensuring no divide-by-zero or negative scales occur during initial frame measurement.

## Dual Input Model (TV D-Pad & Mobile Touch)

To support both classroom Android TV operation (remote D-pad) and physical development/testing devices (touchscreens):
- **TV D-pad Navigation:** Parameter rows and action buttons participate in standard keyboard/D-pad tab indices (`tabIndex = 0`). Arrow keys (`ArrowLeft` / `ArrowRight`) adjust parameters; `Enter` or `Space` triggers actions.
- **Mobile Touch Controls:** Every parameter row contains touchable stepper arrow buttons (`◀` and `▶`) with `-webkit-tap-highlight-color: transparent` and safe touch padding. Tapping a row focuses the parameter; tapping steppers immediately increments/decrements.
- **Compose Navigation:** Jetpack Compose cards use `.clickable { ... }` so they work with both TV D-pad focus click events and phone touch taps.

## WebView Boundary & Asset Loading

The WebView is strictly configured for security and offline reliability:

| Setting | Value | Reason |
|---------|-------|--------|
| JavaScript | Enabled | Required for simulation engine |
| File access | Disabled (`false`) | Security: prevents unauthorized local file access |
| Content access | Disabled (`false`) | Security: prevents content provider leaks |
| Mixed content | Blocked (`MIXED_CONTENT_NEVER_ALLOW`) | Security: prevents loading remote HTTP assets |
| Cache mode | `LOAD_NO_CACHE` | Ensures latest bundled assets load after updates |
| JS bridge | None | Not needed; keeps attack surface minimal |
| Asset loading | `WebViewAssetLoader` | Official Android recommendation for bundled assets |

Content is served from a virtual HTTPS domain:  
`https://appassets.androidplatform.net/assets/simulation-web/`

### WebViewAssetLoader Technical Requirements

1. **Status Code Enforcement:** When customizing response headers (such as `Access-Control-Allow-Origin: *`), Android's `WebResourceResponse` requires an explicit status code call:
   ```kotlin
   response.setStatusCodeAndReasonPhrase(200, "OK")
   ```
   Without this, Chromium rejects responses with `ERR_INVALID_HTTP_RESPONSE`.
2. **Explicit MIME Types:** JavaScript modules (`<script type="module">`) strictly require `application/javascript`. Custom MIME resolution maps `.js`, `.mjs`, `.css`, `.html`, `.json`, and `.svg` correctly.
3. **CORS Attribute Removal:** Vite's default `<script type="module" crossorigin>` triggers Chromium CORS checks on local virtual domains. The `stripCrossorigin` Vite build plugin strips the `crossorigin` attribute from generated HTML.

## Debugging & Diagnostics Policy

- **Debug-Only Inspection:** `WebView.setWebContentsDebuggingEnabled(true)` is strictly guarded by `if (BuildConfig.DEBUG)` in `MainActivity.kt`. In production/release builds, WebView remote inspection is completely disabled.
- **No Diagnostic Overlays:** Production simulations contain no DOM diagnostic overlays, experimental test code, or debug banners.
- **Logcat ChromeClient:** In debug builds, `WebChromeClient.onConsoleMessage` redirects web console messages to Logcat under tag `SimulationWebView`.

## Lifecycle & Memory Management

- **Back Navigation:** `BackHandler` in `SimulationScreen.kt` intercepts system and gesture back events, navigating back to `ChapterScreen` rather than crashing or terminating the task unexpectedly.
- **Resource Disposal:** When leaving the simulation screen, `DisposableEffect(Unit)` and `AndroidView.onRelease` invoke `stopLoading()`, `onPause()`, `destroy()`, and clear references, cleanly stopping the animation frame loop and releasing native graphics memory.

## Build Pipeline

```
simulation-web/
  npm run build → dist/
        ↓
  scripts/copy-web-assets.ps1
        ↓
  android/app/src/main/assets/simulation-web/
        ↓
  gradlew assembleDebug --no-daemon → APK
```

## Version Compatibility

| Component | Version |
|-----------|---------|
| AGP | 9.4.0 |
| Gradle | 9.6.1 |
| Kotlin | 2.1.20 |
| Compose BOM | 2026.09.00 |
| Compose for TV | 1.1.0 |
| JDK | 17 |
| Target SDK | 37 |
| Min SDK | 23 |
| TypeScript | 6.0.2 |
| Vite | 8.3.x |
| Vitest | 5.0.x |

## Production Build Integrity

Before shipping an APK/AAB release, verify:

- No localhost or dev server URLs in bundled assets.
- No unnecessary debug logging, test chapter placeholders, or production debug banners.
- No broken asset paths, missing fonts/images, or accidental runtime CDN/network dependencies.
- Version code/name updated, TV banner/app icon present, and `THIRD-PARTY-NOTICES` / license notices current.

## Future Architecture Boundaries (V2+)

Future classroom features should compose cleanly on top of Version 1 without rewriting simulation models:

- **Teacher / Presentation Mode:** Hide advanced controls, lock parameters, and launch preconfigured guided states via simulation configuration rather than forked physics code.
- **Mobile Companion Controller:** Keep core simulation APIs decoupled from input source (`InputManager`) so network/remote input events require no changes to physics modules.
- **Formative Assessment Layer:** Evaluate student answers by reading live simulation state rather than duplicating independent physics equations (`simulation state -> assessment evaluator -> result`).

