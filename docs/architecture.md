# Architecture

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
- `Camera2D` — World coordinates (meters) ↔ screen coordinates (pixels)
- `InputManager` — D-pad/keyboard input abstraction
- `Simulation` — Lifecycle interface: initialize, start, pause, reset, tick, dispose

### Physics Layer

Pure mathematical models, separated from rendering:

- `ProjectilePhysics.ts` — Analytic projectile equations
  - `computeProjectileState(params, time)` — position and velocity at time t
  - `computeRange(params)` — horizontal range
  - `computeMaxHeight(params)` — maximum height
  - `computeTimeOfFlight(params)` — total flight time

### Rendering Layer

Canvas drawing helpers:

- Grid and axes
- Vector arrows (velocity, acceleration)
- Trajectory paths
- Circles (projectile)
- Ground with hatching

### Data Flow

```
D-pad / Keyboard Input
        ↓
  InputManager
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

## WebView Boundary

The WebView is configured for security:

| Setting | Value | Reason |
|---------|-------|--------|
| JavaScript | Enabled | Required for simulation |
| File access | Disabled | Security |
| Content access | Disabled | Security |
| Mixed content | Default (block) | Security |
| JS bridge | None | Not needed for V1 |
| Asset loading | WebViewAssetLoader | Recommended by Android docs |

Content is served from a virtual HTTPS domain:
`https://appassets.androidplatform.net/assets/simulation-web/`

This avoids `file://` URL security issues and follows Android's
[official documentation](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content).

## Build Pipeline

```
simulation-web/
  npm run build → dist/
        ↓
  scripts/copy-web-assets.ps1
        ↓
  android/app/src/main/assets/simulation-web/
        ↓
  gradlew assembleDebug → APK
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
| Min SDK | 21 |
| TypeScript | 6.0.2 |
| Vite | 8.3.x |
| Vitest | 5.0.x |
