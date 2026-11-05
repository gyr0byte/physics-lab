# Simulation Spec: Simple Harmonic Motion & Periodic Oscillations

## Metadata

| Field | Value |
|---|---|
| ID | `simple-harmonic-motion` |
| Title | Simple Harmonic Motion — Periodic Oscillations |
| Grade | 12 |
| Area | Mechanics |
| Chapter | Chapter 2: Periodic Motion (CDC First Edition 2025, p. 25) |
| Subject Code | Phy. 102 |
| Status | 📐 Planned |

---

## 1. Physical Concepts Covered

1. **Linear Simple Harmonic Motion (SHM):**
   - Restoring force proportional to displacement: $F = -kx$.
   - Differential equation of linear SHM: $\frac{d^2x}{dt^2} + \omega^2 x = 0$.
2. **Kinematic Relationships & Phase Offsets:**
   - Displacement: $x(t) = A \cos(\omega t + \phi)$.
   - Velocity: $v(t) = -\omega A \sin(\omega t + \phi) = \omega \sqrt{A^2 - x^2}$ ($90^\circ$ phase lead ahead of displacement).
   - Acceleration: $a(t) = -\omega^2 A \cos(\omega t + \phi) = -\omega^2 x(t)$ ($180^\circ$ phase inversion relative to displacement).
3. **Dual Oscillator Modes:**
   - **Horizontal Spring-Mass System:** $T = 2\pi\sqrt{\frac{m}{k}}$, $\omega = \sqrt{\frac{k}{m}}$.
   - **Simple Pendulum (Small Angle):** $T = 2\pi\sqrt{\frac{L}{g}}$, $\omega = \sqrt{\frac{g}{L}}$.
4. **Mechanical Energy Interchange:**
   - Kinetic Energy: $K = \frac{1}{2}mv^2$.
   - Potential Energy: $U = \frac{1}{2}kx^2$ (or $mgL(1 - \cos\theta)$ for pendulum).
   - Total Energy Conservation: $E = K + U = \frac{1}{2}kA^2 = \text{constant}$ in undamped motion.
5. **Damped Oscillations (Optional Damping):**
   - Damping force opposing velocity: $F_d = -bv$.
   - Exponential amplitude decay: $A(t) = A_0 e^{-\gamma t}$, where $\gamma = \frac{b}{2m}$.

---

## 2. Learning Objectives

1. **Verify Period Dependencies:**
   - For a spring-mass: verify $T \propto \sqrt{m}$ and $T \propto 1/\sqrt{k}$; demonstrate independence of period from amplitude $A$ (isochronism).
   - For a simple pendulum: verify $T \propto \sqrt{L}$ and $T \propto 1/\sqrt{g}$; demonstrate independence from bob mass $m$.
2. **Visualize Phase Differences:**
   - Observe maximum velocity $v_{\max} = \omega A$ at the equilibrium point ($x=0$) where acceleration is zero.
   - Observe maximum restoring force and acceleration $a_{\max} = \omega^2 A$ at extreme positions ($x = \pm A$) where velocity is instantaneously zero.
3. **Track Real-Time Energy Conservation:**
   - Watch kinetic and potential energy bars continuously exchange magnitude while total mechanical energy remains invariant.
4. **Contrast Undamped vs. Damped Motion:**
   - Observe constant amplitude oscillations when $b=0$, and gradual logarithmic decrement when $b > 0$.

---

## 3. Variables the Learner Can Change

### Mode: System Selector
- **Spring-Mass System** (Default)
- **Simple Pendulum**

### Spring-Mass System Parameters

| Parameter | Symbol | Unit | Default | Range | Step | Description |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **Mass** | $m$ | kg | 1.0 | 0.2 to 5.0 | 0.2 | Mass of oscillating block |
| **Spring Constant** | $k$ | N/m | 25.0 | 5.0 to 100.0 | 5.0 | Stiffness of the helical spring |
| **Initial Amplitude** | $A$ | m | 0.40 | 0.10 to 1.00 | 0.05 | Maximum displacement from equilibrium |
| **Damping Coeff** | $b$ | $\text{N}\cdot\text{s/m}$ | 0.00 | 0.00 to 0.50 | 0.05 | Friction / viscous drag ($0 = \text{ideal}$) |

### Simple Pendulum Parameters

| Parameter | Symbol | Unit | Default | Range | Step | Description |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **String Length** | $L$ | m | 1.0 | 0.2 to 3.0 | 0.1 | Length from pivot to bob center |
| **Bob Mass** | $m$ | kg | 1.0 | 0.2 to 5.0 | 0.2 | Mass of suspended bob |
| **Initial Angle** | $\theta_0$ | deg | $15^\circ$ | $5^\circ$ to $30^\circ$ | $1^\circ$ | Release angle from vertical |
| **Gravity** | $g$ | $\text{m/s}^2$ | 9.80 | 1.62 to 25.0 | 0.1 | Gravitational acceleration |

### Quick Presets
- **Standard (1 kg, 25 N/m):** $T = 2\pi\sqrt{1/25} = 1.26\text{ s}$, $\omega = 5.0\text{ rad/s}$.
- **Heavy Mass (4 kg, 25 N/m):** Mass quadrupled $\implies T = 2\pi\sqrt{4/25} = 2.51\text{ s}$ (Period exactly doubles).
- **Stiff Spring (1 kg, 100 N/m):** Stiffness quadrupled $\implies T = 2\pi\sqrt{1/100} = 0.63\text{ s}$ (Period exactly halves).
- **Moon Gravity (Pendulum):** $g = 1.62\text{ m/s}^2$.

---

## 4. Measured & Calculated Outputs

| Output Quantity | Symbol | Unit | Model Formula |
|---|:---:|:---:|---|
| **Elapsed Time** | $t$ | s | Clamped running simulation clock |
| **Position / Displacement** | $x$ | m | $x(t) = A e^{-\gamma t} \cos(\omega t)$ |
| **Velocity** | $v$ | m/s | $v(t) = \dot{x}(t)$ |
| **Acceleration** | $a$ | $\text{m/s}^2$ | $a(t) = -\omega_0^2 x(t) - 2\gamma v(t)$ |
| **Restoring Force** | $F_{\text{restore}}$ | N | $F = -k x$ (Spring) or $-mg\sin\theta$ (Pendulum) |
| **Angular Frequency** | $\omega$ | rad/s | $\sqrt{k/m}$ or $\sqrt{g/L}$ |
| **Theoretical Period** | $T$ | s | $2\pi / \omega$ |
| **Frequency** | $f$ | Hz | $1 / T$ |
| **Kinetic Energy** | $K$ | J | $\frac{1}{2} m v^2$ |
| **Potential Energy** | $U$ | J | $\frac{1}{2} k x^2$ or $mgL(1 - \cos\theta)$ |
| **Total Energy** | $E$ | J | $K + U$ |
| **Conservation Badge** | Check | boolean | $E \approx E_0$ verification (green indicator in undamped mode) |

---

## 5. Mathematical & Physical Models

All calculations use strict SI units.

### 5.1 Spring-Mass Model

1. **Natural Angular Frequency & Ideal Period:**
   $$\omega_0 = \sqrt{\frac{k}{m}}, \quad T_0 = \frac{2\pi}{\omega_0} = 2\pi\sqrt{\frac{m}{k}}$$

2. **Damping Parameter:**
   $$\gamma = \frac{b}{2m}$$
   - Undamped case ($\gamma = 0$): $\omega = \omega_0$.
   - Underdamped case ($0 \le \gamma < \omega_0$): $\omega_d = \sqrt{\omega_0^2 - \gamma^2}$.

3. **Analytic Kinematic Equations (Released from rest at $t=0$ with $x(0) = A, v(0) = 0$):**
   - **Undamped ($\gamma = 0$):**
     $$x(t) = A \cos(\omega_0 t)$$
     $$v(t) = -\omega_0 A \sin(\omega_0 t)$$
     $$a(t) = -\omega_0^2 A \cos(\omega_0 t) = -\omega_0^2 x(t)$$
   - **Underdamped ($\gamma > 0$):**
     $$x(t) = A e^{-\gamma t} \left[\cos(\omega_d t) + \frac{\gamma}{\omega_d}\sin(\omega_d t)\right]$$
     $$v(t) = -\frac{A \omega_0^2}{\omega_d} e^{-\gamma t} \sin(\omega_d t)$$
     $$a(t) = -\omega_0^2 x(t) - 2\gamma v(t)$$

4. **Energy Calculations:**
   $$K(t) = \frac{1}{2} m v(t)^2$$
   $$U(t) = \frac{1}{2} k x(t)^2$$
   $$E_{\text{total}}(t) = K(t) + U(t)$$
   In undamped mode:
   $$E_{\text{total}} = \frac{1}{2} k A^2 \equiv \text{constant}$$

### 5.2 Simple Pendulum Model

1. **Small-Angle Approximation ($\theta \le 30^\circ$):**
   $$\omega_0 = \sqrt{\frac{g}{L}}, \quad T = 2\pi\sqrt{\frac{L}{g}}$$
   $$\theta(t) = \theta_0 \cos(\omega_0 t)$$
   $$\Omega(t) = \frac{d\theta}{dt} = -\omega_0 \theta_0 \sin(\omega_0 t)$$
   Linear arc position: $s(t) = L \theta(t)$
   Linear velocity: $v(t) = L \Omega(t)$
   Restoring force: $F_{\text{restore}} = -mg \sin\theta(t)$
   Potential Energy: $U(t) = mgL(1 - \cos\theta(t))$
   Kinetic Energy: $K(t) = \frac{1}{2} m v(t)^2 = \frac{1}{2} m L^2 \Omega(t)^2$

---

## 6. Visual Layout & Component Architecture

### Screen Layout (16:9 Landscape Optimized)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Grade 12 • Mechanics • Chapter 2                                                    [Mode Selector] │
│ Simple Harmonic Motion & Oscillations                                             [Spring / Pendulum]
├──────────────────────────────────────────────────────┬─────────────────────────────────────────────┤
│                                                      │ PARAMETERS                                  │
│                   CANVAS VIEW                        │                                             │
│                                                      │ Mass (m)              ◀   1.0 kg   ▶        │
│  [Anchor Wall]                                       │ Spring Const (k)      ◀   25 N/m   ▶        │
│  ├──/\/\/\/\/\/\/\/\/\──[ Mass Block ]               │ Amplitude (A)         ◀   0.40 m   ▶        │
│                         ↑ x=0 (Eq)                   │ Damping (b)           ◀   0.00     ▶        │
│                                                      │                                             │
│  Vectors:                                            │ QUICK EXPERIMENTS                           │
│  → Restoring Force F = -kx (Red)                     │ [Quadruple Mass (4m)]   [4x Stiff Spring]   │
│  → Velocity v (Cyan)                                 │                                             │
│  → Acceleration a (Green)                            │ [ ▶ Start ]   [ ⏸ Pause ]   [ ↺ Reset ]     │
│                                                      ├─────────────────────────────────────────────┤
│  Energy Bar Gauges:                                  │ MEASUREMENTS                                │
│  [K: ██████  ] [U: ████    ] [E_total: ██████████]   │ Period (T): 1.26 s   Freq: 0.80 Hz          │
│                                                      │ Position (x): +0.32 m                       │
│  Live Kinematics Graph:                              │ Velocity (v): -1.20 m/s                     │
│  ~ Displacement x(t) (Blue)                          │ Accel (a):    -8.00 m/s²                    │
│  ~ Velocity v(t)     (Cyan)                          │ Energy: K=0.72 J, U=1.28 J, E=2.00 J        │
│  ~ Acceleration a(t) (Green)                         │ Law Check: E_total = Constant  ✓            │
└──────────────────────────────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 7. Reusable Engine Components

### Reused As-Is:
1. `Vector2`: 2D vector coordinate calculations.
2. `SimulationClock`: Fixed timestep integration and pause/play handling.
3. `Camera2D`: World-to-screen scaling.
4. `InputManager`: TV remote D-pad input bindings.
5. `SimulationRegistry`: Registry routing for `#simple-harmonic-motion`.
6. `Graph`: Real-time multi-series kinematic curve plotting.

### New Components to Add to `simulation-web`:
1. **`SimpleHarmonicPhysics.ts` (`src/physics/`):**
   - Pure math module with no DOM or rendering dependencies.
   - Analytic state evaluator (`computeSHMState(params, t)`).
   - Period and frequency calculation (`computePeriod(m, k)`, `computePendulumPeriod(L, g)`).
   - Energy calculations (`computeSHMEnergies(params, x, v)`).
2. **`drawSpring` (`src/rendering/CanvasRenderer.ts`):**
   - Renders a realistic coiled helical spring between two world-space coordinates with parameterized coil count, wire thickness, and realistic hook endpoints.
3. **`drawPendulum` (`src/rendering/CanvasRenderer.ts`):**
   - Renders a rigid suspension bracket, tension cord, and circular bob with angle orientation.
4. **`drawEnergyBarPanel` (`src/rendering/CanvasRenderer.ts`):**
   - Canvas-rendered dynamic bar gauges displaying kinetic, potential, and total mechanical energy.

---

## 8. Guided Experiments for Students

### Experiment 1: Dependence of Period on Mass ($T \propto \sqrt{m}$)
1. Set Spring Constant $k = 25\text{ N/m}$, Damping $b = 0$, Amplitude $A = 0.50\text{ m}$.
2. Test $m = 1.0\text{ kg} \implies T = 2\pi\sqrt{1/25} = 1.26\text{ s}$.
3. Quadruple mass to $m = 4.0\text{ kg} \implies T = 2\pi\sqrt{4/25} = 2.51\text{ s}$.
4. Observe that quadrupling the mass exactly doubles the oscillation period ($2\times$).

### Experiment 2: Independence of Period from Amplitude (Isochronism)
1. Keep $m = 1.0\text{ kg}$ and $k = 25\text{ N/m}$.
2. Test $A = 0.20\text{ m} \implies T = 1.26\text{ s}$.
3. Change $A = 0.80\text{ m} \implies T = 1.26\text{ s}$.
4. Observe that the period is completely unaffected by amplitude (fundamental property of linear SHM).

### Experiment 3: Phase Relationships ($x, v, a$)
1. Set the simulation to slow or pause at the extreme position ($x = +A$):
   - Observe $x = +A$ (maximum), $v = 0$, and acceleration $a = -\omega^2 A$ (maximum negative).
2. Step to the equilibrium position ($x = 0$):
   - Observe $x = 0$, velocity is at peak negative ($v = -\omega A$), and acceleration is exactly zero ($a = 0$).
3. Inspect the live kinematic graph to see the $90^\circ$ phase shift between $x(t)$ and $v(t)$, and the $180^\circ$ inversion of $a(t)$.

### Experiment 4: Energy Conservation
1. Observe the live energy bars during undamped oscillation.
2. Note that at $x = \pm A$, $K = 0$ and $U = E_{\text{total}}$.
3. Note that at $x = 0$, $U = 0$ and $K = E_{\text{total}}$.
4. Check that the gold Total Energy bar stays completely static ($E = K + U = \text{constant}$).

---

## 9. Automated Testing Plan (`tests/physics/shm.test.ts`)

Unit tests to validate the physics engine before any UI is hooked up:

1. **Period & Frequency Calculations:**
   - Spring: $T = 2\pi\sqrt{m/k}$ for standard, double mass, and quadruple mass.
   - Pendulum: $T = 2\pi\sqrt{L/g}$ on Earth ($g=9.8$) and Moon ($g=1.62$).
2. **Isochronism:**
   - Verify that varying $A$ produces identical periods.
3. **Kinematic Analytic Accuracy:**
   - $x(0) = A$, $v(0) = 0$, $a(0) = -\omega^2 A$.
   - Quarter period ($t = T/4$): $x(T/4) = 0$, $v(T/4) = -\omega A$, $a(T/4) = 0$.
   - Half period ($t = T/2$): $x(T/2) = -A$, $v(T/2) = 0$, $a(T/2) = +\omega^2 A$.
4. **Differential Equation Invariant:**
   - Test $\frac{a(t)}{x(t)} = -\omega^2$ at all non-zero displacements.
5. **Energy Conservation:**
   - Verify $K(t) + U(t) = \frac{1}{2}kA^2$ to within floating-point tolerance ($10^{-9}$) across all time points in undamped mode.
6. **Damping Behavior:**
   - Verify underdamped amplitude decays exponentially by $e^{-\gamma t}$.
   - Verify total mechanical energy strictly decreases when $b > 0$.
