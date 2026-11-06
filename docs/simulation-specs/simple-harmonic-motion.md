# Simulation Spec: Simple Harmonic Motion & Periodic Oscillations

## Metadata

| Field | Value |
|---|---|
| ID | `simple-harmonic-motion` |
| Title | Simple Harmonic Motion — Periodic Oscillations |
| Grade | 12 |
| Area | Mechanics |
| Chapter | Chapter 2: Periodic Motion (CDC First Edition 2025, starting page 25) |
| Subject Code | Phy. 102 |
| Status | 📐 Planned |
| Academic Authority | Curriculum Development Centre (CDC), Sanothimi, Bhaktapur, Nepal |

---

## 1. Curriculum Context & CDC Syllabus Mapping

This simulation directly addresses the learning competencies defined in **Nepal CDC Physics Grade 12 (First Edition 2025)**, Chapter 2 (*Periodic Motion*), pp. 25–44:

- **Subtopic 2.1:** Definition of Simple Harmonic Motion (SHM), characteristics, restoring force ($F = -kx$).
- **Subtopic 2.2:** Kinematics of SHM: displacement $x(t)$, velocity $v(t)$, acceleration $a(t)$ as sinusoidal functions; phase constants.
- **Subtopic 2.4:** Differential equation of linear SHM: $\frac{d^2 x}{dt^2} + \omega^2 x = 0$.
- **Subtopic 2.5:** Kinetic, potential, and total mechanical energy transformations in SHM.
- **Subtopic 2.6:** **Vertical spring-mass system** (primary apparatus) and static extension ($\Delta l = mg/k$); horizontal spring-mass comparison.
- **Subtopic 2.7:** Simple pendulum time period ($T = 2\pi\sqrt{L/g}$) and the small-angle approximation ($\sin\theta \approx \theta$) vs. exact nonlinear pendulum.
- **Subtopic 2.9:** Free, damped, and forced oscillations; mechanical resonance and amplitude-frequency response.

---

## 2. Educational Modes Structure

To provide comprehensive curriculum coverage without cluttering the screen or overwhelming classroom TV remote interaction, the simulation is structured into **four dedicated educational modes**:

```
Mode Selector (D-pad accessible tabs)
├── 1. Free Oscillation (Ideal SHM)
│    ├── System A: Vertical Spring-Mass (Primary CDC Model)
│    ├── System B: Simple Pendulum (Small-Angle vs. Nonlinear Comparison)
│    └── System C: Horizontal Spring-Mass (Optional Comparison)
├── 2. Damped Oscillation (Viscous resistance, exponential envelope, energy dissipation)
├── 3. Forced Oscillation (External periodic driver, transient vs. steady-state)
└── 4. Mechanical Resonance (Frequency response curve A(Ω), resonance peak, Q-factor)
```

---

## 3. Mathematical Modelling & Physics Formulations

All calculations use strict SI units ($m\text{ in kg}, x\text{ in m}, k\text{ in N/m}, t\text{ in s}, g\text{ in m/s}^2$).

### 3.1 Mode 1: Free Oscillation — Vertical Spring-Mass (Primary Model)

#### Physical Apparatus & Static Equilibrium
A helical spring of spring constant $k$ and natural unstretched length $L_0$ is suspended vertically from a rigid ceiling clamp at $y = 0$. When a mass $m$ is attached:

1. **Static Equilibrium Extension ($\Delta l$):**
   At rest, the downward gravitational force balances the upward elastic restoring force:
   $$F_g + F_s = 0 \implies mg - k\Delta l = 0$$
   $$\Delta l = \frac{mg}{k}$$
   The static equilibrium position is located at vertical coordinate:
   $$y_{\text{eq}} = L_0 + \Delta l = L_0 + \frac{mg}{k}$$

2. **Equation of Motion for Vertical Oscillation:**
   Let $y$ be the instantaneous vertical position of the mass, and define displacement $x$ relative to the **static equilibrium position**:
   $$x(t) = y(t) - y_{\text{eq}}$$
   The net vertical force acting on the mass is:
   $$F_{\text{net}} = mg - k(y - L_0) = mg - k(y_{\text{eq}} + x - L_0)$$
   Substituting $y_{\text{eq}} - L_0 = \Delta l = \frac{mg}{k}$:
   $$F_{\text{net}} = mg - k\left(\frac{mg}{k} + x\right) = mg - mg - kx = -kx$$
   Applying Newton's Second Law:
   $$m \frac{d^2 x}{dt^2} = -kx \implies \frac{d^2 x}{dt^2} + \omega_0^2 x = 0, \quad \text{where } \omega_0 = \sqrt{\frac{k}{m}}$$

3. **Invariance of Oscillation Period with Gravity:**
   The natural frequency and period depend exclusively on mass and spring stiffness:
   $$T = 2\pi\sqrt{\frac{m}{k}}, \quad f = \frac{1}{T} = \frac{1}{2\pi}\sqrt{\frac{k}{m}}$$
   > **Curriculum Insight:** Gravity determines the static elongation $\Delta l = mg/k$, but has **zero effect** on the oscillation period $T$. Students can adjust gravity (Earth $9.8\text{ m/s}^2$, Moon $1.62\text{ m/s}^2$) to observe equilibrium elongation changing while the oscillation frequency remains strictly constant.

4. **Analytical Kinematic Equations (Release from Rest at $t=0$ with displacement $x(0) = A$):**
   $$x(t) = A \cos(\omega_0 t)$$
   $$v(t) = \dot{x}(t) = -\omega_0 A \sin(\omega_0 t)$$
   $$a(t) = \ddot{x}(t) = -\omega_0^2 A \cos(\omega_0 t) = -\omega_0^2 x(t)$$

5. **Phase Relationships:**
   - Velocity leads displacement by $90^\circ$ ($\pi/2\text{ rad}$):
     $$v(t) = \omega_0 A \cos\left(\omega_0 t + \frac{\pi}{2}\right)$$
   - Acceleration is $180^\circ$ ($\pi\text{ rad}$) out of phase with displacement:
     $$a(t) = \omega_0^2 A \cos(\omega_0 t + \pi) = -\omega_0^2 x(t)$$
   - At equilibrium ($x = 0$): speed is maximum ($|v_{\max}| = \omega_0 A$) and acceleration is zero ($a = 0$).
   - At extreme positions ($x = \pm A$): speed is zero ($v = 0$) and acceleration magnitude is maximum ($|a_{\max}| = \omega_0^2 A$).

6. **Energy Formulation for Vertical Spring:**
   - Kinetic Energy: $K = \frac{1}{2}mv^2$
   - Elastic Potential Energy: $U_s = \frac{1}{2}k(\Delta l + x)^2 = \frac{1}{2}k(\Delta l)^2 + k\Delta l x + \frac{1}{2}kx^2$
   - Gravitational Potential Energy (reference at $y_{\text{eq}}$): $U_g = -mgx$
   - Total Potential Energy:
     $$U(x) = U_s + U_g = \frac{1}{2}k(\Delta l)^2 + (k\Delta l - mg)x + \frac{1}{2}kx^2$$
     Because $k\Delta l = mg$, the linear cross-term $(k\Delta l - mg)x$ identically vanishes:
     $$U(x) = \frac{1}{2}k(\Delta l)^2 + \frac{1}{2}kx^2$$
     Referencing potential energy to zero at equilibrium ($x = 0$):
     $$U(x) = \frac{1}{2}kx^2$$
   - Total Mechanical Energy:
     $$E = K + U = \frac{1}{2}mv^2 + \frac{1}{2}kx^2 = \frac{1}{2}kA^2 \equiv \text{constant}$$

---

### 3.2 Mode 1: Free Oscillation — Simple Pendulum (Small-Angle vs. Exact Nonlinear)

#### Physical Setup
A point mass $m$ is suspended by a light, inextensible cord of length $L$ from a frictionless pivot. Deflection from the vertical is angle $\theta$.

1. **Exact Nonlinear Equation of Motion:**
   The tangential component of gravity provides the restoring torque:
   $$\tau = -mgL\sin\theta = I \frac{d^2\theta}{dt^2} = (mL^2) \frac{d^2\theta}{dt^2}$$
   $$\frac{d^2\theta}{dt^2} + \frac{g}{L}\sin\theta = 0$$

2. **Small-Angle SHM Approximation ($\sin\theta \approx \theta$):**
   For small angular deflections (typically $\theta \le 15^\circ \approx 0.26\text{ rad}$), $\sin\theta \approx \theta - \frac{\theta^3}{6} \approx \theta$:
   $$\frac{d^2\theta}{dt^2} + \omega_0^2 \theta = 0, \quad \text{where } \omega_0 = \sqrt{\frac{g}{L}}$$
   $$T_0 = 2\pi\sqrt{\frac{L}{g}}, \quad \theta(t) = \theta_0 \cos(\omega_0 t)$$
   Linear arc position: $s(t) = L\theta(t) \implies s(t) = s_0 \cos(\omega_0 t)$, where $s_0 = L\theta_0$.
   Linear velocity: $v(t) = L\dot{\theta}(t) = -\omega_0 L \theta_0 \sin(\omega_0 t)$.

3. **Comparison with Exact Nonlinear Pendulum:**
   For larger angles (tested up to $\theta_0 = 30^\circ$ and optionally $60^\circ$), the simulation integrates the exact nonlinear differential equation:
   $$\ddot{\theta} = -\frac{g}{L}\sin\theta$$
   The exact period is given by the complete elliptic integral of the first kind $K(k)$:
   $$T = 4\sqrt{\frac{L}{g}} K\left(\sin^2\frac{\theta_0}{2}\right) \approx T_0 \left(1 + \frac{1}{16}\theta_0^2 + \frac{11}{3072}\theta_0^4 + \dots\right)$$

   | Release Angle $\theta_0$ | Small-Angle Period $T_0$ ($L=1\text{ m}, g=9.8$) | Exact Period $T_{\text{exact}}$ | Relative Discrepancy |
   |:---:|:---:|:---:|:---:|
   | **$5^\circ$ ($0.087\text{ rad}$)** | $2.007\text{ s}$ | $2.008\text{ s}$ | $+0.05\%$ (Negligible) |
   | **$15^\circ$ ($0.262\text{ rad}$)** | $2.007\text{ s}$ | $2.016\text{ s}$ | $+0.43\%$ (Standard lab limit) |
   | **$30^\circ$ ($0.524\text{ rad}$)** | $2.007\text{ s}$ | $2.042\text{ s}$ | $+1.74\%$ (Noticeable phase drift) |
   | **$60^\circ$ ($1.047\text{ rad}$)** | $2.007\text{ s}$ | $2.154\text{ s}$ | $+7.32\%$ (Strong nonlinear elongation) |

   > **Curriculum Insight:** Students can toggle a "Small-Angle SHM vs. Exact Nonlinear" ghost trail overlay to directly watch the exact pendulum fall behind the linear sinusoidal model as amplitude increases.

4. **Pendulum Energy:**
   - Kinetic Energy: $K = \frac{1}{2}m v^2 = \frac{1}{2}mL^2 \dot{\theta}^2$
   - Exact Gravitational Potential Energy: $U(\theta) = mgL(1 - \cos\theta)$
   - Small-angle approximation: $U(\theta) \approx \frac{1}{2}mgL\theta^2 = \frac{1}{2} \left(\frac{mg}{L}\right) s^2$
   - Total Energy: $E = K + U = mgL(1 - \cos\theta_0) \equiv \text{constant}$.

---

### 3.3 Mode 2: Damped Oscillation

When an oscillating spring-mass experiences a viscous retarding force proportional to velocity ($F_d = -b v$ where $b$ is the damping coefficient in $\text{N}\cdot\text{s/m}$ or $\text{kg/s}$):

$$m \frac{d^2 x}{dt^2} + b \frac{dx}{dt} + k x = 0$$
$$\frac{d^2 x}{dt^2} + 2\gamma \frac{dx}{dt} + \omega_0^2 x = 0$$

where:
- $\omega_0 = \sqrt{\frac{k}{m}}$ is the undamped natural angular frequency.
- $\gamma = \frac{b}{2m}$ is the damping factor ($[\text{s}^{-1}]$).
- $\zeta = \frac{\gamma}{\omega_0} = \frac{b}{2\sqrt{km}}$ is the dimensionless damping ratio.

#### Underdamped Regime ($0 \le \gamma < \omega_0$ or $0 \le \zeta < 1$):
The damped angular frequency is:
$$\omega_d = \sqrt{\omega_0^2 - \gamma^2} = \omega_0 \sqrt{1 - \zeta^2}$$
Damped period:
$$T_d = \frac{2\pi}{\omega_d} > T_0$$

#### Exact Analytical Kinematics (Release from Rest: $x(0) = A, v(0) = 0$):
Applying initial conditions to the general solution $x(t) = e^{-\gamma t}(C_1 \cos\omega_d t + C_2 \sin\omega_d t)$:
$$x(0) = C_1 = A$$
$$v(0) = -\gamma C_1 + \omega_d C_2 = 0 \implies C_2 = \frac{\gamma}{\omega_d} A$$

Thus, the **exact analytical solution** is:
$$x(t) = A e^{-\gamma t} \left[\cos(\omega_d t) + \frac{\gamma}{\omega_d} \sin(\omega_d t)\right]$$
$$v(t) = -\frac{A \omega_0^2}{\omega_d} e^{-\gamma t} \sin(\omega_d t)$$
$$a(t) = \ddot{x}(t) = -\omega_0^2 x(t) - 2\gamma v(t)$$

#### Amplitude Envelope & Energy Dissipation:
- **Exponential Amplitude Envelope:**
  $$x_{\text{envelope}}(t) = \pm A \sqrt{1 + \left(\frac{\gamma}{\omega_d}\right)^2} e^{-\gamma t} = \pm \frac{A \omega_0}{\omega_d} e^{-\gamma t}$$
- **Mechanical Energy Dissipation:**
  Rate of work done against damping:
  $$\frac{dE}{dt} = \frac{d}{dt}\left(\frac{1}{2}mv^2 + \frac{1}{2}kx^2\right) = m v \dot{v} + k x v = v(m a + k x) = v(-b v) = -b v^2 \le 0$$
  Total instantaneous mechanical energy $E(t) = K(t) + U(t)$ strictly decreases over time.
  Dissipated thermal energy:
  $$E_{\text{dissipated}}(t) = E_0 - (K(t) + U(t)) = \int_0^t b v(\tau)^2 d\tau$$
  > **Curriculum Insight:** The energy bar chart dynamically displays a red/orange "Thermal / Dissipated Energy" bar growing in exact parity with the depletion of $E = K + U$.

---

### 3.4 Mode 3: Forced Oscillation

An external periodic driving force $F(t) = F_0 \cos(\Omega t)$ of angular frequency $\Omega$ and amplitude $F_0$ acts on the damped oscillator:

$$m \frac{d^2 x}{dt^2} + b \frac{dx}{dt} + k x = F_0 \cos(\Omega t)$$
$$\frac{d^2 x}{dt^2} + 2\gamma \frac{dx}{dt} + \omega_0^2 x = \frac{F_0}{m} \cos(\Omega t)$$

#### Complete Solution (Transient + Steady-State):
$$x(t) = x_{\text{transient}}(t) + x_{\text{steady}}(t)$$

1. **Transient Term $x_{\text{transient}}(t)$:**
   Governed by natural damped frequency $\omega_d$; exponentially decays to zero ($e^{-\gamma t} \to 0$) after a few periods ($t \gg 1/\gamma$).
2. **Steady-State Response $x_{\text{steady}}(t)$:**
   Persists indefinitely, oscillating strictly at the **driving frequency $\Omega$**:
   $$x_{\text{steady}}(t) = A(\Omega) \cos(\Omega t - \delta)$$
   where:
   - **Steady-State Amplitude:**
     $$A(\Omega) = \frac{F_0 / m}{\sqrt{(\omega_0^2 - \Omega^2)^2 + 4\gamma^2 \Omega^2}}$$
   - **Phase Lag $\delta$:**
     $$\tan\delta = \frac{2\gamma \Omega}{\omega_0^2 - \Omega^2}, \quad \delta \in [0, \pi]$$
     - At low frequency ($\Omega \ll \omega_0$): $\delta \approx 0$ (in phase with driver).
     - At resonance ($\Omega = \omega_0$): $\delta = \pi/2 = 90^\circ$ (quarter-cycle lag).
     - At high frequency ($\Omega \gg \omega_0$): $\delta \to \pi = 180^\circ$ (completely out of phase).

---

### 3.5 Mode 4: Mechanical Resonance

Resonance occurs when the driving frequency $\Omega$ approaches the natural frequency, producing a dramatic amplification of steady-state oscillation.

1. **Resonant Frequency for Amplitude:**
   Maximizing $A(\Omega)$ by minimizing the denominator $g(\Omega) = (\omega_0^2 - \Omega^2)^2 + 4\gamma^2 \Omega^2$:
   $$\frac{d}{d\Omega}\left[(\omega_0^2 - \Omega^2)^2 + 4\gamma^2 \Omega^2\right] = 2(\omega_0^2 - \Omega^2)(-2\Omega) + 8\gamma^2 \Omega = 0$$
   $$-4\Omega (\omega_0^2 - \Omega^2 - 2\gamma^2) = 0$$
   For $\gamma < \frac{\omega_0}{\sqrt{2}}$:
   $$\Omega_{\text{res}} = \sqrt{\omega_0^2 - 2\gamma^2} = \omega_0 \sqrt{1 - 2\zeta^2}$$
   For light damping ($\gamma \ll \omega_0$):
   $$\Omega_{\text{res}} \approx \omega_0$$

2. **Maximum Amplitude at Resonance:**
   $$A_{\max} = A(\Omega_{\text{res}}) = \frac{F_0}{2m\gamma \sqrt{\omega_0^2 - \gamma^2}} = \frac{F_0}{b \omega_d}$$
   For undamped case ($b \to 0$): $A_{\max} \to \infty$ (theoretically unbounded).

3. **Quality Factor ($Q$) and Resonance Bandwidth:**
   $$Q = \frac{\omega_0}{2\gamma} = \frac{\sqrt{km}}{b} = \frac{1}{2\zeta}$$
   - **High $Q$ (Light Damping):** Tall, narrow, sharp resonance peak.
   - **Low $Q$ (Heavy Damping):** Broad, shallow resonance peak with shifted maximum.

4. **Resonance Curve Display:**
   The Canvas renders an interactive **Amplitude vs. Driving Frequency ($A\text{ vs. }\Omega$)** curve. The current driving frequency is highlighted as a dynamic tracking point along the curve, demonstrating how tuning $\Omega \to \omega_0$ drives the system into peak oscillation.

---

## 4. Parameter Validation & Boundary Constraints

All user-adjustable sliders enforce strict physical constraints:

| Parameter | Symbol | Unit | Default | Valid Range | Step | Physical Justification & Validation Constraint |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **Mass** | $m$ | kg | 1.00 | 0.20 to 5.00 | 0.10 | Must be strictly positive ($m > 0$). Range matches typical classroom spring apparatus. |
| **Spring Constant** | $k$ | N/m | 25.0 | 5.0 to 100.0 | 5.0 | Must be strictly positive ($k > 0$). $25\text{ N/m}$ gives clean, easily countable periods ($T \approx 1.26\text{ s}$). |
| **Initial Amplitude** | $A$ | m | 0.30 | 0.05 to 0.60 | 0.05 | Restricted so mass does not exceed ceiling clamp ($y > 0$) or clip bottom viewport ($y_{\max} \le 2.0\text{ m}$). |
| **Damping Coeff** | $b$ | $\text{N}\cdot\text{s/m}$ | 0.00 | 0.00 to 1.00 | 0.05 | $b \ge 0$. Max $b=1.0$ ensures $\zeta = \frac{b}{2\sqrt{km}} \le \frac{1.0}{2\sqrt{5 \times 0.2}} = 0.5 < 1$ (strictly underdamped). |
| **Pendulum Length** | $L$ | m | 1.00 | 0.30 to 2.50 | 0.10 | Must be strictly positive ($L > 0$). $L = 1.00\text{ m}$ gives standard "seconds pendulum" behavior ($T \approx 2.0\text{ s}$). |
| **Pendulum Angle** | $\theta_0$ | deg | $12^\circ$ | $2^\circ$ to $30^\circ$ | $1^\circ$ | Default $12^\circ$ stays safely in small-angle regime ($0.27\%$ error). $30^\circ$ enables nonlinear comparison. |
| **Gravity** | $g$ | $\text{m/s}^2$ | 9.80 | 1.62 to 24.79 | 0.10 | Presets: Moon (1.62), Earth (9.80), Jupiter (24.79). Validates period gravity dependence. |
| **Driving Freq** | $\Omega$ | rad/s | 5.00 | 1.00 to 15.00 | 0.20 | Spans across resonance $\omega_0 = \sqrt{25/1} = 5.00\text{ rad/s}$ ($f \approx 0.80\text{ Hz}$). |
| **Driver Force** | $F_0$ | N | 2.00 | 0.50 to 10.00 | 0.50 | Sufficient force to demonstrate steady-state amplitude without visual clipping. |

### Visual Coordinate Bounds Check for Vertical Spring
- Ceiling anchor: $y_{\text{anchor}} = 0.20\text{ m}$.
- Natural length: $L_0 = 0.40\text{ m}$.
- Static equilibrium: $y_{\text{eq}} = L_0 + \frac{mg}{k}$.
  - At $m = 1.0\text{ kg}, k = 25\text{ N/m}$: $\Delta l = 0.392\text{ m} \implies y_{\text{eq}} = 0.792\text{ m}$.
  - Maximum possible extension ($m=5.0\text{ kg}, k=50\text{ N/m}, A=0.4\text{ m}$): $y_{\max} = 0.40 + 0.98 + 0.40 = 1.78\text{ m}$.
- Camera2D world viewport is scaled to $Y \in [-0.1, 2.0]\text{ m}$, ensuring complete on-screen visibility at all times.

---

## 5. Visual Layout & TV Remote Interaction

### 16:9 Landscape Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Grade 12 • Mechanics • Periodic Motion                                      [MODE TABS: D-PAD ↑/↓] │
│ Simple Harmonic Motion & Resonance          [Free Oscillation] [Damped] [Forced] [Resonance Curve] │
├──────────────────────────────────────────────────────┬─────────────────────────────────────────────┤
│                                                      │ PARAMETERS (D-pad Focus)                    │
│                 VERTICAL CANVAS VIEW                 │                                             │
│                                                      │ [System: Vertical Spring ▼]                 │
│  ══════════════ [Ceiling Support] ═══════════════    │                                             │
│         │                                            │ Mass (m)              ◀   1.0 kg   ▶        │
│         § Unstretched L₀ = 0.40 m                    │ Spring Const (k)      ◀  25.0 N/m  ▶        │
│      ─────── [Natural Length Marker]                 │ Amplitude (A)         ◀   0.30 m   ▶        │
│         §                                            │ Damping (b)           ◀   0.00     ▶        │
│         § Static Elongation Δl = mg/k = 0.39 m       │                                             │
│      - - - - [Equilibrium Line y_eq] - - - - -       │ QUICK EXPERIMENTS                           │
│         │                                            │ [Quadruple Mass]  [Moon Gravity g=1.62]     │
│       ┌───┐                                          │                                             │
│       │ m │ (Displacement x from y_eq)               │ [ ▶ Start ]   [ ⏸ Pause ]   [ ↺ Reset ]     │
│       └───┘                                          ├─────────────────────────────────────────────┤
│         ↓  v (Cyan Arrow)                            │ LIVE MEASUREMENTS                           │
│         ↑  F_restore = -kx (Red Arrow)               │ Period (T): 1.26 s   Freq (f): 0.796 Hz     │
│         ↑  a = -ω²x (Green Arrow)                    │ Position (x): +0.24 m                       │
│                                                      │ Velocity (v): -0.92 m/s                     │
│  LIVE ENERGY BAR GAUGES                              │ Accel (a):    -6.00 m/s²                    │
│  Kinetic (K):   ██████                       0.42 J  │ Kinetic (K):   0.42 J                       │
│  Potential (U): ██████████                   0.72 J  │ Potential (U): 0.72 J                       │
│  Total (E):     ████████████████             1.14 J  │ Total (E):     1.14 J (Constant ✓)          │
│  (Thermal Dissipation shown in Damped Mode)          │ Phase: v leads x by 90°                     │
│                                                      ├─────────────────────────────────────────────┤
│  REAL-TIME KINEMATICS GRAPH / RESONANCE PLOT         │ LAW COMPLIANCE                              │
│  ~ Displacement x(t) [Blue]                          │ m·x'' = -k·x verified in real time          │
│  ~ Velocity v(t)     [Cyan]                          │ 1.00·(-6.00) = -(25.0)·(0.24) = -6.00 N ✓   │
│  ~ Acceleration a(t) [Green]                         │                                             │
└──────────────────────────────────────────────────────┴─────────────────────────────────────────────┘
```

### Visual Representations & Color Palette
- **Spring Coil:** Silver-white helical path (`#e2e8f0`, lineWidth: 2.5) with realistic circular loops.
- **Natural Length Line:** Amber dashed horizontal line with label "$L_0$ (Unstretched)".
- **Static Equilibrium Line:** Cyan dashed horizontal line with label "$y_{\text{eq}}$ (Equilibrium)".
- **Vector Arrows:**
  - Restoring Force ($\vec{F}_{\text{restore}}$): Red (`#ef4444`) with label "$F_s$".
  - Velocity ($\vec{v}$): Cyan (`#06b6d4`) with label "$v$".
  - Acceleration ($\vec{a}$): Bright Green (`#22c55e`) with label "$a$".
  - Driving Force ($\vec{F}_{\text{drive}}$): Magenta (`#d946ef`) in Forced mode.
- **Energy Bars:**
  - Kinetic ($K$): Emerald Green (`#10b981`).
  - Potential ($U$): Royal Blue (`#3b82f6`).
  - Total ($E$): Gold (`#f59e0b`).
  - Dissipated / Thermal ($E_{\text{thermal}}$): Crimson (`#f43f5e`).

---

## 6. Reusable Engine Architecture & New Components

### 6.1 Reused Engine Core
- `Vector2` (`src/core/Vector2.ts`): Vector operations for position, velocity, and force arrows.
- `SimulationClock` (`src/core/SimulationClock.ts`): Fixed-timestep simulation loop with play/pause/reset.
- `Camera2D` (`src/core/Camera2D.ts`): Screen-to-world conversion; anchored viewport for vertical spring and pendulum.
- `InputManager` (`src/core/InputManager.ts`): Full TV D-pad navigation and key event management.
- `Graph` (`src/components/Graph.ts`): Multi-series live time graph for $x(t), v(t), a(t)$, and frequency sweep curves.
- `SimulationRegistry` (`src/core/SimulationRegistry.ts`): Registration under `#simple-harmonic-motion`.

### 6.2 New Modules to Implement
1. **`SimpleHarmonicPhysics.ts` (`src/physics/`):**
   - Independent mathematical module (zero DOM / Canvas dependencies).
   - Functions:
     - `computeSpringEquilibrium(m, k, g): number`
     - `computeSpringPeriod(m, k): { omega0: number; period: number; frequency: number }`
     - `computePendulumPeriod(L, g): { omega0: number; period: number; frequency: number }`
     - `computeIdealSpringState(params, t): SHMState`
     - `computeDampedSpringState(params, t): DampedSHMState`
     - `computeForcedSteadyState(params, Omega, t): ForcedSHMState`
     - `computeResonanceCurve(params, omegaRange): ResonancePoint[]`
     - `stepNonlinearPendulum(state, dt, L, g): PendulumState` (RK4 / Verlet integration)
     - `computeEnergies(m, k, x, v): EnergyBreakdown`
2. **`CanvasRenderer.ts` Extensions:**
   - `drawVerticalSpring(ctx, camera, startWorld, endWorld, coils, radiusPx, options)`:
     Generates a smooth, physical coiled helix extending from ceiling anchor to mass hook.
   - `drawPendulum(ctx, camera, pivotWorld, lengthWorld, angleRad, bobRadiusPx, options)`:
     Draws ceiling bracket, suspension line, circular bob, and optional small-angle ghost reference.
   - `drawEnergyBars(ctx, rect, K, U, E_total, E_dissipated)`:
     Draws proportional stacked / grouped energy gauges with numeric labels.
   - `drawReferenceLines(ctx, camera, naturalLengthY, equilibriumY)`:
     Draws clean labeled reference markers for $L_0$ and $y_{\text{eq}}$.

---

## 7. Automated Testing Strategy (`tests/physics/shm.test.ts`)

A dedicated Vitest test suite will validate physical and numerical correctness:

### 1. Vertical Spring Statics & Period Invariance
- Verify static elongation formula: $\Delta l = \frac{mg}{k}$ for varied $(m, k, g)$.
- Verify period formula: $T = 2\pi\sqrt{m/k}$.
- **Gravity Independence:** Verify that changing $g$ from $9.8\text{ m/s}^2$ to $1.62\text{ m/s}^2$ (Moon) or $24.8\text{ m/s}^2$ (Jupiter) leaves $T$ identical to within floating-point epsilon ($10^{-12}$).
- **Isochronism:** Verify period is independent of initial amplitude $A$.

### 2. Analytical Kinematic Invariants
- Verify initial conditions: $x(0) = A$, $v(0) = 0$, $a(0) = -\omega_0^2 A$.
- Verify quarter period ($t = T/4$): $x(T/4) = 0$, $v(T/4) = -\omega_0 A$, $a(T/4) = 0$.
- Verify half period ($t = T/2$): $x(T/2) = -A$, $v(T/2) = 0$, $a(T/2) = +\omega_0^2 A$.
- Verify the SHM differential equation invariant:
  $$\left|\frac{a(t)}{x(t)} + \omega_0^2\right| < 10^{-10} \quad \forall t \text{ where } |x(t)| > 10^{-4}\text{ m}$$

### 3. Mechanical Energy Conservation (Undamped)
- Verify $K(t) = \frac{1}{2}mv(t)^2$ and $U(t) = \frac{1}{2}kx(t)^2$.
- Verify $K(t) + U(t) = \frac{1}{2}kA^2$ to within $10^{-9}\text{ J}$ across 100 sample points over 5 complete periods.
- Verify $K=0, U=E$ at turning points ($x = \pm A$), and $U=0, K=E$ at equilibrium ($x=0$).

### 4. Simple Pendulum & Nonlinear Divergence
- Verify small-angle period: $T_0 = 2\pi\sqrt{L/g}$.
- Verify mass independence: doubling bob mass leaves pendulum period unchanged.
- Verify small-angle vs. exact nonlinear agreement: at $\theta_0 = 5^\circ$, period discrepancy $< 0.1\%$.
- Verify nonlinear period elongation: at $\theta_0 = 30^\circ$, exact period $> T_0$ by approx $1.7\%$.

### 5. Damped Oscillation Verification
- Verify initial velocity is exactly zero: $v(0) = 0$ using the correct phase-adjusted formula:
  $$x(t) = A e^{-\gamma t} \left[\cos(\omega_d t) + \frac{\gamma}{\omega_d}\sin(\omega_d t)\right]$$
- Verify amplitude decay conforms to envelope $\frac{A\omega_0}{\omega_d} e^{-\gamma t}$.
- Verify damped angular frequency: $\omega_d = \sqrt{\omega_0^2 - \gamma^2} < \omega_0$.
- Verify mechanical energy strictly dissipates: $E(t_2) < E(t_1)$ for any $t_2 > t_1$.

### 6. Forced Oscillation & Resonance Verification
- Verify steady-state amplitude formula $A(\Omega)$ across $\Omega \in [0.5 \omega_0, 2.0 \omega_0]$.
- Verify resonance peak occurs at $\Omega_{\text{res}} = \sqrt{\omega_0^2 - 2\gamma^2}$.
- Verify phase lag at natural frequency: $\delta(\omega_0) = \frac{\pi}{2} = 90^\circ$.
- Verify damping effect on resonance: smaller damping $b$ yields higher $Q$ and taller, narrower resonance peak.

---

## 8. Guided Classroom Experiments

1. **Experiment 1: Effect of Gravity on a Vertical Spring**
   - Release $1.0\text{ kg}$ mass on a $25\text{ N/m}$ spring on Earth ($g=9.8$). Observe $\Delta l = 0.39\text{ m}, T = 1.26\text{ s}$.
   - Switch to Moon ($g=1.62$). Observe $\Delta l = 0.065\text{ m}$, but $T$ remains exactly $1.26\text{ s}$!
2. **Experiment 2: Small-Angle Pendulum vs. Large Angle**
   - Release pendulum at $10^\circ$ and measure $T$.
   - Release at $30^\circ$ and enable the nonlinear comparison ghost. Observe the nonlinear pendulum gradually lagging behind the linear SHM projection.
3. **Experiment 3: Mechanical Resonance Hunting**
   - Set $m=1\text{ kg}, k=25\text{ N/m} \implies \omega_0 = 5.0\text{ rad/s}$.
   - Start driver at $\Omega = 2.0\text{ rad/s}$ ($A \approx 0.09\text{ m}$).
   - Increment $\Omega$ toward $5.0\text{ rad/s}$. Observe the block's steady-state amplitude surge to peak resonance ($A > 1.0\text{ m}$).
   - Increase $\Omega$ to $8.0\text{ rad/s}$. Observe amplitude collapse back down.
