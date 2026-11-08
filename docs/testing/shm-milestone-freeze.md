# Testing & QA Report: SHM Milestone Freeze & Regression Verification

**Date:** November 8, 2026  
**Milestone:** `v0.2.0-shm-android-verified`  
**Package:** `com.physicslab.app` (v0.2.0)  
**Target Hardware:** Samsung Galaxy S21 FE (`[ANDROID-TEST-DEVICE]`, SM-G990E, Android 16 / SDK 36)  
**Baseline TV Viewport:** 16:9 Landscape baseline ($2340 \times 1080$, DPR $\approx 2.625$)

---

## 1. Executive Summary

This report documents the milestone freeze verification for **Version 0.2.0** of the Physics Lab application. This milestone covers:
1. Full implementation and Android runtime verification of **Grade 12, Chapter 2: Periodic Motion (Simple Harmonic Motion and Resonance)** across all 4 modes.
2. Independent precision verification of the displacement resonance peak frequency ($\Omega_{\text{peak}}$).
3. Full end-to-end regression verification of existing Grade 11 simulations:
   - **Kinematics — Projectile Motion**
   - **Dynamics — Newton's Second Law ($F_{\text{net}} = m \cdot a$)**
4. Navigation hierarchy, lifecycle backgrounding, restoring, reopening, high-DPI scaling, and offline operation via `WebViewAssetLoader`.

---

## 2. Hardware Verification Matrix

| Target Platform | Status | Details |
|---|---|---|
| **Samsung Galaxy S21 FE** | ✅ **Verified** | Physical device (`[ANDROID-TEST-DEVICE]`, Android 16, One UI 8.0) |
| **Android TV D-pad Navigation** | ✅ **Verified (Emulated)** | D-pad KeyEvents (19 Up, 20 Down, 21 Left, 22 Right, 23 Center/Select, 4 Back) |
| **Touch Controls** | ✅ **Verified** | Touch steppers, direct row focusing, quick-experiment buttons, start/pause/reset |
| **Physical Android TV Device** | ⏳ **PENDING** | Awaiting physical smart TV classroom hardware & physical IR/Bluetooth remote |
| **Overscan TV Margins** | ⏳ **PENDING** | Safe margin verification on physical TV panels with overscan enabled |

> [!IMPORTANT]
> Testing was conducted on a physical Samsung Galaxy S21 FE running Android 16 with Android TV D-pad key event emulation. Physical smart TV testing with a physical remote control remains an outstanding task pending access to classroom smart TV hardware.

---

## 3. SHM Resonance Precision Verification

The displacement resonance peak condition was independently audited against the Nepal secondary curriculum theoretical model:

\[
\ddot{x} + 2\gamma\dot{x} + \omega_0^2 x = \frac{F_0}{m}\cos(\Omega t)
\]

For the standard default parameters:
- $m = 1.0\text{ kg}$
- $k = 25.0\text{ N/m}$
- $b = 0.20\text{ N}\cdot\text{s/m}$
- $F_0 = 2.0\text{ N}$

### Frequency Calculations:
- Natural angular frequency:
  \[
  \omega_0 = \sqrt{\frac{k}{m}} = \sqrt{\frac{25}{1}} = 5.000000\text{ rad/s}
  \]
- Damping factor:
  \[
  \gamma = \frac{b}{2m} = \frac{0.20}{2.0} = 0.100000\text{ s}^{-1}
  \]
- Displacement resonance peak angular frequency:
  \[
  \Omega_{\text{peak}} = \sqrt{\omega_0^2 - 2\gamma^2} = \sqrt{25.0 - 2(0.01)} = \sqrt{24.98} \approx 4.9979995998\text{ rad/s} \approx 4.998\text{ rad/s}
  \]
- Damped natural angular frequency:
  \[
  \omega_d = \sqrt{\omega_0^2 - \gamma^2} = \sqrt{25.0 - 0.01} = \sqrt{24.99} \approx 4.9989999\text{ rad/s}
  \]

### Result:
- The peak is calculated strictly via $\sqrt{\omega_0^2 - 2\gamma^2}$, fully independent of $\omega_0$.
- Verified via unit test `tests/physics/shm.test.ts` (160/160 passing).
- While UI rounding displays $5.00\text{ rad/s}$, the internal numerical solver and curve peak evaluator retain the exact $4.9979996\text{ rad/s}$ value.

---

## 4. Grade 11 Projectile Motion Regression

Tested on Samsung Galaxy S21 FE via ADB & Touch:

1. **Curriculum Navigation & Launch:**
   - Navigated from Home $\to$ Grade 11 $\to$ Mechanics $\to$ `Kinematics — Projectile Motion`.
   - Loaded instantaneously via `WebViewAssetLoader` (local cache).
   - Screenshot: `docs/qa/regression/04-projectile-initial.png`.
2. **Parameters & Default State:**
   - Initial speed $25\text{ m/s}$, launch angle $45^\circ$, gravity $9.81\text{ m/s}^2$.
   - Theoretical dashed trajectory, axes ($x, y$ in meters), and initial velocity components ($v_0, v_{0x}, v_{0y}$) displayed with high contrast.
3. **Execution & Controls:**
   - Activated `▶ Start` via D-pad (`KEYCODE_DPAD_CENTER` / keyevent 23).
   - Projectile traveled smoothly along the parabolic trajectory.
   - Dynamic vectors rendered in real time ($v_y, v_x, g$) along with maximum height label $H = 15.9\text{ m}$.
   - Screenshot: `docs/qa/regression/05-projectile-running.png`.
4. **Pause, Landing & Reset:**
   - Paused and verified projectile landing at $R = 63.7\text{ m}$.
   - Reset via D-pad navigation to `↺ Reset` returning the projectile to $(0,0)$ and clearing the rolling graph.
   - Screenshots: `docs/qa/regression/06-projectile-paused.png`, `docs/qa/regression/07-projectile-reset.png`.
5. **D-pad Parameter Adjustment:**
   - Navigated focus to Launch Angle and adjusted value to $47^\circ$ via `KEYCODE_DPAD_RIGHT`.
   - Trajectory guide automatically recalculated and updated.
   - Screenshot: `docs/qa/regression/08-projectile-param-adjusted.png`.
6. **Back Navigation & Reopening:**
   - `KEYCODE_BACK` cleanly returned to Grade 11 Mechanics topic list.
   - Reopened Projectile Motion; verified clean re-initialization with zero memory or animation leaks.
   - Screenshots: `docs/qa/regression/09-back-to-g11-topics.png`, `docs/qa/regression/17-reopened-projectile.png`.

---

## 5. Grade 11 Newton's Second Law Regression

Tested on Samsung Galaxy S21 FE via ADB & Touch:

1. **Curriculum Navigation & Launch:**
   - Navigated from Mechanics $\to$ `Dynamics — Newton's Laws`.
   - Loaded cleanly.
   - Screenshot: `docs/qa/regression/11-newton-initial.png`.
2. **Parameters & Live Measurements:**
   - Applied Force $+20.0\text{ N}$, Mass $5.0\text{ kg}$, Friction Coeff $\mu = 0.10$.
   - Live checks confirmed: $F_{\text{net}} = 15.8\text{ N}$, $a = 3.17\text{ m/s}^2$, $F_{\text{net}} = m \cdot a$ verified ($15.8\text{ N} = 15.8\text{ N} \checkmark$).
3. **Motion & Dynamic Tracking Camera:**
   - Started simulation. Mass block accelerated smoothly across the rail.
   - Cyan velocity vector ($v$), green acceleration vector ($a$), amber net force vector ($F_{\text{net}}$), and friction vector ($f$) rendered dynamically.
   - Status badge toggled to "Running".
   - Screenshot: `docs/qa/regression/12-newton-running.png`.
4. **Pause & Reset:**
   - Paused at $t = 24.78\text{ s}$ ($x = 973.26\text{ m}, v = 78.49\text{ m/s}$).
   - Reset cleanly back to $t = 0.00\text{ s}, x = 0.00\text{ m}, v = 0.00\text{ m/s}$.
   - Screenshots: `docs/qa/regression/13-newton-paused.png`, `docs/qa/regression/14-newton-reset.png`.
5. **Parameter Adjustment (Double Mass):**
   - Tapped quick experiment `Double Mass (2m)`.
   - Mass adjusted to $10.0\text{ kg}$. Friction force increased to $-8.3\text{ N}$, net force dropped to $11.7\text{ N}$, and acceleration updated to $1.17\text{ m/s}^2$.
   - Real-time invariant confirmed: $11.7\text{ N} = 11.7\text{ N} \checkmark$.
   - Screenshot: `docs/qa/regression/15-newton-param-adjusted.png`.
6. **Back Navigation:**
   - Back key returned cleanly to Grade 11 Mechanics.
   - Screenshot: `docs/qa/regression/16-back-from-newton.png`.

---

## 6. Build and Test Suite Summary

- **Vitest Unit & Rendering Suite:** 160 / 160 passing (9 test suites)
- **TypeScript Typecheck:** Clean (`tsc --noEmit`, 0 errors)
- **Vite Production Bundle:** `dist/assets/index-DrV5jlBc.js` (92.81 kB, gzip 22.75 kB)
- **Android Gradle Build:** `.\gradlew.bat assembleDebug` SUCCESS in 24s (`app-debug.apk`)
- **Offline Integrity:** Zero external HTTP/HTTPS calls; 100% packaged local assets.
