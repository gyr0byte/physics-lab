# Testing Report: First Vertical Slice (Projectile Motion)

**Date:** November 2, 2026  
**Milestone:** Projectile Motion First Android Runtime Milestone  
**Target:** Grade 11 Kinematics — Projectile Motion  
**Package:** `com.physicslab.app` (v0.1.0)

---

## 1. Executive Summary

This report documents the verification and testing of the first vertical slice of **Physics Lab**, comprising the core TypeScript simulation engine, the Grade 11 Projectile Motion simulation, and the Android TV/Mobile application shell.

Testing covers physics accuracy, numerical determinism, rendering, responsive layout adaptation, touch/remote interaction, and WebView asset loading.

---

## 2. Verification Status Matrix

| Category | Status | Details |
|---|---|---|
| **Physical Samsung Galaxy S21 FE** | ✅ **Verified** | Tested on physical hardware (`[ANDROID-TEST-DEVICE]`, Android 14) via ADB |
| **Desktop / Browser Testing** | ✅ **Verified** | Vitest suite (61/61 passing), Vite dev & production preview |
| **Viewport & Resolution Testing** | ✅ **Verified** | Native 2340×1080 (19.5:9) and simulated 1920×1080 (16:9 TV baseline) |
| **Physical Android TV Hardware** | ⏳ **PENDING** | **Not yet tested on physical Android TV hardware** (hardware pending) |
| **Remaining Device Requirements** | ⏳ **PENDING** | Remote D-pad hardware verification, overscan safe margin check |

> [!IMPORTANT]
> Physical Android TV verification is explicitly marked as **PENDING**. Testing to date was conducted on a physical Samsung Galaxy S21 FE device and via viewport simulation. Physical smart TV testing with a physical remote control will be performed as soon as TV hardware is connected.

---

## 3. Verified on Physical Samsung Galaxy S21 FE

* **Device:** Samsung Galaxy S21 FE 5G (SM-G990B/DS)
* **Serial:** `[ANDROID-TEST-DEVICE]`
* **OS:** Android 14 (One UI 6.1, API 34)
* **Screen Resolution:** 2340 × 1080 pixels (DPR: 2.625)
* **Build Tested:** `app-debug.apk` (AGP 9.4.0, Gradle 9.6.1)

### Test Cases & Results

1. **Out-of-the-Box Fresh Launch (Layout Fix Verification)**
   - **Method:** `adb shell am force-stop com.physicslab.app` followed by launch to Kinematics &rarr; Projectile Motion.
   - **Observation:** Simulation screen opened immediately without a black screen. No DevTools intervention, DOM manipulation, or manual scripts required.
   - **Metrics:** Container `#app` measured `889 × 411 px` (CSS), HTML5 Canvas backing store measured `2333 × 1078 px` (accounting for DPR 2.625).

2. **Interactive Parameter Adjustment (Touch Input)**
   - **Method:** Tapped the `▶` stepper control on the Launch Angle parameter row.
   - **Observation:** Launch Angle adjusted from 45° to 47°. Parameter display updated instantaneously. Trajectory guide path dynamically recomputed and redrew to reflect the new angle.

3. **Live Launch & Animation (Physics & Rendering)**
   - **Method:** Tapped "Start" control button.
   - **Observation:** Projectile launched from origin `(0, 0)` with initial velocity components $v_{0x} = 17.7\text{ m/s}$ and $v_{0y} = 19.0\text{ m/s}$. Motion followed a smooth 60fps trajectory.
   - **Vectors:** Dynamic velocity vector arrow $\vec{v}$ rendered continuously throughout flight, correctly tangential to the trajectory. Projectile landed at $x = 70.0\text{ m}$.

4. **Real-Time Measurement Panel**
   - **Method:** Inspected the measurements panel during flight and after landing.
   - **Observation:** Live elapsed time, position coordinates $(x, y)$, current speed, and velocity components $(v_x, v_y)$ updated every frame during flight. Initial parameters and theoretical values (Range $R$, Max Height $H$, Time of Flight $T$) displayed accurately.

5. **Simulation Reset**
   - **Method:** Tapped "Reset" control button.
   - **Observation:** Simulation clock reset to $t = 0.00\text{ s}$, projectile returned to origin `(0, 0)`, velocity vector reset to initial launch orientation, and trajectory trail cleared ready for the next run.

6. **Navigation & Lifecycle Management**
   - **Method:** Performed system back gesture to exit `SimulationScreen` to `ChapterScreen`, then re-entered `SimulationScreen`.
   - **Observation:** Compose `BackHandler` and `DisposableEffect` cleanly released WebView resources (`stopLoading()`, `onPause()`, `destroy()`). Re-entering initialized a fresh simulation instance with no duplicate `requestAnimationFrame` loops or memory leaks.

---

## 4. Verified Through Desktop & Browser Testing

1. **Automated Unit Tests (Vitest)**
   - **Total Tests:** 61 tests across 4 test suites.
   - **Result:** 61 passed (100% pass rate).
   - **Suites:**
     - `tests/physics/projectile.test.ts` (19 tests): Analytic projectile equations, range, max height, time of flight, 0° horizontal launch, 90° vertical launch, conservation of energy invariants, symmetry, and error bounds.
     - `tests/core/vector2.test.ts` (17 tests): Vector arithmetic, normalization, dot product, distance, magnitude, immutability, zero-vector edge cases.
     - `tests/core/clock.test.ts` (12 tests): Fixed-timestep accumulator, pause/resume, reset, time scaling, step counting, frame delta clamping.
     - `tests/core/camera2d.test.ts` (13 tests): World-to-screen and screen-to-world transformations, zoom, origin offset, `fitWorld` safe dimension clamping.

2. **Web Build & Asset Packaging (Vite)**
   - **Result:** Successfully builds production bundle via `npm run build`.
   - **Bundle Size:** Single compact bundle (`index-*.js` ~25 KB, `index-*.css` ~2.5 KB).
   - **Module Compatibility:** Custom Vite plugin `stripCrossorigin` removes `crossorigin` attributes from `<script>` tags, preventing Chromium CORS rejections on local Android assets.

---

## 5. Verified Through Viewport & Resolution Testing

1. **Ultrawide Mobile Viewport (2340 × 1080, ~19.5:9)**
   - **Status:** Verified on physical hardware.
   - **Behavior:** Canvas automatically filled viewport height and available horizontal width; controls remained easily touchable with proper padding and safe margins.

2. **Standard 16:9 Landscape TV Resolution (1920 × 1080)**
   - **Method:** Overrode device display resolution via ADB:
     ```bash
     adb shell wm size 1080x1920
     ```
     (In landscape orientation, physical viewport is exactly 1920 × 1080 pixels).
   - **Observation:** Layout adapted to 16:9 aspect ratio. The viewport-anchored CSS (`position: fixed; inset: 0`) pinned cleanly to the display boundaries. Canvas, controls, and measurement panels maintained balanced proportions suitable for 1080p classroom displays.
   - **Cleanup:** Reset display size via `adb shell wm size reset`.

---

## 6. Physical Android TV Hardware (PENDING)

* **Status:** ⏳ **PENDING**
* **Remaining Verification Steps:**
  1. Connect a physical Android TV device (or smart TV running Android TV OS).
  2. Install `app-debug.apk` via ADB over Wi-Fi (`adb connect <tv-ip>`).
  3. Verify application launch from the Android TV Leanback launcher home screen.
  4. Test full navigation using a physical hardware D-pad remote:
     - Up / Down between parameter controls and action buttons.
     - Left / Right to adjust parameters (`◀` / `▶`).
     - OK / Select to activate Start / Pause / Reset.
     - Remote Back button to navigate back through Chapter &rarr; Grade &rarr; Home.
  5. Validate visibility, contrast, and font readability from standard classroom viewing distances (3 to 6 meters).
  6. Verify overscan margins on TV displays that crop outer viewport edges.

---

## 7. Still Pending / Next Phase Roadmap

1. **Physical Android TV Hardware Testing:** As documented in Section 6.
2. **Multi-Simulation Navigation Bridge:** Dynamic simulation routing in `SimulationScreen.kt` when subsequent Grade 11/12 simulations are added.
3. **Release Build Signing & Verification:** Generating a signed release APK and verifying `WebView.setWebContentsDebuggingEnabled(false)` in release mode.
