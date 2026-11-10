# Simulation Spec: Circular Motion

## Metadata

| Field | Value |
|---|---|
| ID | `circular-motion` |
| Title | Circular Motion (Kinematics, Dynamics, Banked Curves & Vertical Loops) |
| Grade | 11 |
| Area | Mechanics |
| Chapter | Chapter 6: Circular Motion |
| Status | 📋 Specification Phase Complete (Audited & Rigorously Corrected) |

---

## 1. Pedagogical Scope & Objectives

This specification defines the complete educational architecture for **Circular Motion** in Grade 11 Secondary-Level Physics, compliant with the official Curriculum Development Centre (CDC) Nepal syllabus (*Physics Grade 11 (2024)*, Chapter 6, pp. 132–153).

The simulation allows students to experiment with both horizontal and vertical curvilinear motion, investigate the relationships between angular and linear kinematics, decompose forces producing centripetal acceleration, explore the mechanics of banked roads, and observe conical pendulum periods.

### Core Curriculum Competencies:
1. **Angular Kinematics:** Define angular displacement ($\theta$), angular velocity ($\omega = \frac{d\theta}{dt}$), and angular acceleration ($\alpha = \frac{d\omega}{dt}$). Counter-clockwise rotation is taken as positive ($\omega > 0$).
2. **Linear-to-Angular Relationships:** Rigorously distinguish signed tangential velocity $v_t = r\omega$ from scalar speed $v = |\vec{v}| = r|\omega|$, alongside arc displacement $s = r\theta$, and tangential acceleration $a_t = r\alpha$.
3. **Uniform Circular Motion (UCM):** Demonstrate constant angular speed ($\alpha = 0, a_t = 0$) where velocity vector direction changes continuously, driven by purely radial inward centripetal acceleration ($a_c = \frac{v^2}{r} = r\omega^2$). The vector form $\vec{a}_c = -r\omega^2\hat{r}$ strictly directs toward the rotation center regardless of the sign of $\omega$.
4. **Centripetal Force Nature:** Demonstrate that centripetal force is **not** an independent, mysterious interaction, but the **net inward radial force resultant** provided by real physical agents (string tension, surface normal force, friction, or gravity component).
5. **Rotating-Frame Clarification:** Establish that centrifugal force does not exist in an inertial laboratory frame. Any rotating-frame explanation must be explicitly labeled as an apparent/fictitious pseudo-force.
6. **Non-Uniform Circular Motion:** Model simultaneous tangential and radial accelerations, computing the resultant acceleration vector $\vec{a} = \vec{a}_c + \vec{a}_t = -r\omega^2\hat{r} + r\alpha\hat{\theta}$ with magnitude $|\vec{a}| = \sqrt{a_c^2 + a_t^2} = r\sqrt{\omega^4 + \alpha^2}$ and direction properly handling signed $\omega$ and $\alpha$.
7. **Motion in a Vertical Circle:**
   - Unified coordinate convention: $\theta = 0$ corresponds to the **lowest (bottom) point**, $\theta = \pi$ corresponds to the **highest (top) point**, and height above lowest point is $h(\theta) = R(1 - \cos\theta)$.
   - Verify mechanical energy conservation: $E = \frac{1}{2}mv^2 + mgR(1 - \cos\theta) = \text{constant}$.
   - Radial tension equation: $T(\theta) = \frac{mv(\theta)^2}{R} + mg\cos\theta$.
   - Comprehensive boundary conditions:
     1. $v_0 = 0$: Bob at rest at bottom ($h = 0, T = mg$).
     2. $v_0 < \sqrt{2gR}$: Stable oscillatory pendulum regime ($h < R, \theta < \pi/2, T > 0$ strictly at all times).
     3. $v_0 = \sqrt{2gR}$: Boundary state where bob reaches horizontal position $\theta = \pi/2$ ($h = R$) with simultaneous $v = 0$ and $T = 0$.
     4. $\sqrt{2gR} < v_0 < \sqrt{5gR}$: Slackening regime. Tension vanishes ($T = 0$) at $\cos\theta_{\text{slack}} = -\frac{v_0^2 - 2gR}{3gR} \in (\pi/2, \pi)$. The bob transitions into free parabolic projectile motion under gravity until the string taut transition condition ($|\vec{r}| \ge R$ and $\vec{r}\cdot\vec{v} > 0$) is satisfied, at which point an impulsive radial arrest sets $\vec{v}_{\text{taut}} = v_\theta\hat{\theta}$ with kinetic energy loss $\Delta E = \frac{1}{2}m(\vec{v}\cdot\hat{r})^2$.
     5. $v_0 \ge \sqrt{5gR}$: Complete circular loop without slackening ($T \ge 0$ throughout), satisfying the classic invariant $T_{\text{bottom}} - T_{\text{top}} = 6mg$.
8. **Level & Banked Road Dynamics:**
   - Level circular track: Centripetal force supplied solely by static friction ($v_{\max} = \sqrt{\mu_s rg}$).
   - Ideal frictionless banked curve: Optimal design speed $v_{\text{opt}} = \sqrt{rg\tan\theta}$ where normal force component $N\sin\theta$ provides exact centripetal requirement without lateral tire shear.
   - Banked curve with friction: Upper speed threshold $v_{\max} = \sqrt{rg \frac{\mu_s + \tan\theta}{1 - \mu_s\tan\theta}}$ and lower slip-down threshold $v_{\min} = \sqrt{rg \frac{\tan\theta - \mu_s}{1 + \mu_s\tan\theta}}$ (for $\tan\theta > \mu_s$).
9. **Conical Pendulum:**
   - Bob suspended by string of length $L$ circulating in a horizontal plane with semi-vertical angle $\theta$ and orbital radius $r = L\sin\theta$.
   - Balance of vertical tension component against gravity ($T\cos\theta = mg$) and horizontal component providing centripetal force ($T\sin\theta = m\omega^2 r$).
   - Mass-independent time period: $T_{\text{period}} = 2\pi\sqrt{\frac{L\cos\theta}{g}} = 2\pi\sqrt{\frac{h}{g}}$.
   - Exact small-angle relation $\frac{T_{\text{conical}}}{T_{\text{small-angle}}} = \sqrt{\cos\theta}$, giving a small-angle deviation within $0.1\%$ for $\theta \le 3^\circ$ and $0.2\%$ for $\theta \le 5^\circ$ (where deviation is $1 - \sqrt{\cos 5^\circ} \approx 0.19\%$).

---

## 2. Product Architecture & 4 Simulation Modes

To ensure clarity without overwhelming the 1080p classroom TV screen, Circular Motion is structured into **four focused apparatus modes**, accessible via a top mode-selector bar:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  MODE SELECTOR: [ 1. Horizontal Kinematics ] [ 2. Vertical Circle ]   │
│                 [ 3. Banked Road Curve    ] [ 4. Conical Pendulum ]   │
└────────────────────────────────────────────────────────────────────────┘
```

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Grade 11 • Mechanics • Chapter 6: Circular Motion            [ Ready ] │
├──────────────────────────┬─────────────────────────┬───────────────────┤
│ PARAMETERS               │ APPARATUS VIEWPORT      │ LIVE MEASUREMENTS │
│ Radius (r)     ◀ 2.0m ▶  │                         │                   │
│ Ang. Speed (ω) ◀ 3.0/s ▶ │  (Canvas 2D Viewport    │ ω:    3.00 rad/s  │
│ Tang. Acc. (α) ◀ 0.0/s²▶ │   with vector arrows,   │ v_t:  6.00 m/s    │
│ Mass (m)       ◀ 1.0kg ▶ │   particle, trail, and  │ |v|:  6.00 m/s    │
│ Friction (μs)  ◀ 0.50 ▶  │   reference axes)       │ a_c: 18.00 m/s²   │
│ Friction (μk)  ◀ 0.35 ▶  │                         │ a_t:  0.00 m/s²   │
│                          │                         │ F_c: 18.00 N      │
│ [ Start ] [ Reset ]      │                         ├───────────────────┤
│                          │                         │ REAL-TIME GRAPHS  │
│ PRESETS                  │                         │ [ω-t] [a-t] [F-θ] │
│ 1. Uniform Circular      │                         │                   │
│ 2. Angular Acceleration  │                         │                   │
└──────────────────────────┴─────────────────────────┴───────────────────┘
```

---

## 3. Detailed Mode Specifications

### 3.1 Mode 1: Horizontal Turntable & Kinematics (Uniform & Non-Uniform)

#### A. Physical Apparatus & Layout
An overhead bird's-eye view of a calibrated circular track/turntable with concentric radius rings ($0.5\text{ m}$ to $5.0\text{ m}$) centered at origin $(X_0, Y_0) = (0, 0)$. A particle/puck of mass $m$ travels along the circular path at radius $r$.

```text
               +Y
                |          v_t * θ_hat (tangential)
                |        ▲
                |       /
                |     [●]  Particle (r, θ)
                |    / |
                |   /  | a_c * (-r_hat) (radial inward)
                |  /   ▼
                | / r
                |/ θ
  --------------+---------------- +X
                |
                |
                |
```

#### B. Coordinate System & Unit Vectors
- Origin $(0, 0)$ is at the circular turntable center.
- Polar coordinates: $\vec{r}(t) = r\hat{r}$, where $\hat{r} = \cos\theta\,\hat{i} + \sin\theta\,\hat{j}$.
- Unit tangent vector (counter-clockwise): $\hat{\theta} = -\sin\theta\,\hat{i} + \cos\theta\,\hat{j}$.
- Signed tangential velocity: $v_t(t) = r\omega(t)$.
- Scalar speed: $v(t) = |\vec{v}(t)| = r|\omega(t)|$.
- Velocity vector: $\vec{v}(t) = v_t(t)\hat{\theta} = -r\omega\sin\theta\,\hat{i} + r\omega\cos\theta\,\hat{j}$.
- Centripetal acceleration:
  $$\vec{a}_c(t) = -r\omega^2\hat{r} = -\frac{v^2}{r}\hat{r} = -r\omega^2(\cos\theta\,\hat{i} + \sin\theta\,\hat{j})$$
  Magnitude is strictly $a_c = \frac{v^2}{r} = r\omega^2$. Note: $a_c$ is always directed radially inward towards the origin, independent of the sign of $\omega$.
- Tangential acceleration:
  $$\vec{a}_t(t) = r\alpha\hat{\theta} = a_t\hat{\theta} = -r\alpha\sin\theta\,\hat{i} + r\alpha\cos\theta\,\hat{j}$$
  where $a_t = r\alpha$ is signed. If $\alpha > 0$, $\vec{a}_t$ points counter-clockwise; if $\alpha < 0$, it points clockwise.
- Resultant acceleration:
  $$\vec{a}(t) = \vec{a}_c(t) + \vec{a}_t(t) = -r\omega^2\hat{r} + r\alpha\hat{\theta}$$
  Magnitude: $|\vec{a}| = \sqrt{a_c^2 + a_t^2} = \sqrt{(r\omega^2)^2 + (r\alpha)^2} = r\sqrt{\omega^4 + \alpha^2}$.

#### C. User-Adjustable Parameters

| Parameter | Symbol | Unit | Default | Range | Step | Description |
|---|---|---|---:|---:|---:|---|
| **Radius** | $r$ | m | 2.0 | 0.5 – 5.0 | 0.1 | Orbit radius |
| **Initial Angular Velocity** | $\omega_0$ | rad/s | 2.0 | -10.0 – +10.0 | 0.5 | Initial angular speed ($\pm$ direction) |
| **Angular Acceleration** | $\alpha$ | rad/s² | 0.0 | -5.0 – +5.0 | 0.2 | Rate of change of $\omega$ |
| **Particle Mass** | $m$ | kg | 1.0 | 0.1 – 5.0 | 0.1 | Mass of circulating body |
| **Static Friction Coeff.** | $\mu_s$ | — | 0.50 | 0.05 – 1.00 | 0.05 | Breakaway threshold for unattached puck |
| **Kinetic Friction Coeff.** | $\mu_k$ | — | 0.35 | 0.05 – 0.80 | 0.05 | Kinetic friction coefficient ($\mu_k \le \mu_s$) |
| **Attachment Mode** | — | — | `Tether` | `Tether` / `Friction Surface` | — | Tether cord vs surface friction |

#### D. Attachment Modes & Governing Equations

1. **Mode A: `Tether` (Central Inextensible Cord / Motorized Guide):**
   - The puck is mechanically constrained to move along a circular path of radius $r$.
   - A motorized central actuator or circular guide enforces the angular acceleration $\alpha$, even when $\alpha \ne 0$.
   - The radial cord tension supplies the exact required inward centripetal force:
     $$T_{\text{radial}} = m a_c = m r \omega^2$$
   - The tangential actuator/guide supplies the required tangential force:
     $$F_t = m a_t = m r \alpha$$
   - Net force on puck: $F_{\text{net}} = m\sqrt{(r\omega^2)^2 + (r\alpha)^2}$. No radial or tangential detachment occurs.

2. **Mode B: `Friction Surface` (Unattached Puck on Rotating Turntable):**
   - The turntable rotates in the inertial laboratory frame with angular velocity $\vec{\omega}_{\text{table}} = \omega(t)\hat{k}$ and angular acceleration $\vec{\alpha}_{\text{table}} = \alpha\hat{k}$.
   - **Static Adherence Regime (No Slip):**
     While the puck does not slip relative to the turntable, it co-rotates at fixed radius $r$:
     $$\theta(t + \Delta t) = \theta(t) + \omega(t)\Delta t + \frac{1}{2}\alpha\Delta t^2, \quad \omega(t + \Delta t) = \omega(t) + \alpha\Delta t$$
     To maintain this motion, static friction $\vec{f}_s$ must provide both the centripetal and tangential accelerations:
     $$\vec{F}_{\text{required}} = -m r \omega^2\hat{r} + m r \alpha\hat{\theta}$$
     $$F_{\text{required}} = |\vec{F}_{\text{required}}| = m\sqrt{(r\omega^2)^2 + (r\alpha)^2}$$
     Maximum available static friction:
     $$f_{s,\max} = \mu_s N = \mu_s m g$$
   - **Static Breakaway Criterion:**
     The puck breaks away from static circular adherence if:
     $$F_{\text{required}} > f_{s,\max} \iff m\sqrt{(r\omega^2)^2 + (r\alpha)^2} > \mu_s m g \iff \sqrt{(r\omega^2)^2 + (r\alpha)^2} > \mu_s g$$
   - **Post-Breakaway Kinetic Slip Dynamics:**
     Once breakaway occurs, the puck becomes an independent body sliding across the rotating surface in the 2D plane.
     At any instant $t$, let the puck's position in the inertial frame be $\vec{r} = (x, y)$ and velocity be $\vec{v}_{\text{puck}} = (v_x, v_y)$.
     The velocity of the rotating turntable surface directly beneath the puck at position $\vec{r}$ is:
     $$\vec{v}_{\text{surface}} = \vec{\omega}_{\text{table}} \times \vec{r} = (-\omega_{\text{table}} y)\,\hat{i} + (\omega_{\text{table}} x)\,\hat{j}$$
     The relative slip velocity between the puck and the turntable surface is:
     $$\vec{v}_{\text{rel}} = \vec{v}_{\text{puck}} - \vec{v}_{\text{surface}}$$
     When $|\vec{v}_{\text{rel}}| > 0$, kinetic friction opposes this relative motion:
     $$\vec{F}_k = -\mu_k m g \frac{\vec{v}_{\text{rel}}}{|\vec{v}_{\text{rel}}|}$$
     The puck's acceleration in the inertial frame is given by:
     $$\vec{a}_{\text{puck}} = \frac{\vec{F}_k}{m} = -\mu_k g \frac{\vec{v}_{\text{rel}}}{|\vec{v}_{\text{rel}}|}$$
     Integrated with time step $\Delta t = 0.002\text{ s}$ via Velocity Verlet or semi-implicit Euler.
   - **Zero-Relative-Velocity Transition (Re-adherence / Resticking):**
     If $|\vec{v}_{\text{rel}}| \le \epsilon_v$ (where $\epsilon_v = 10^{-3}\text{ m/s}$), and the static force required to hold the puck at its instantaneous radius $r' = |\vec{r}|$ satisfies:
     $$m\sqrt{(r'\omega_{\text{table}}^2)^2 + (r'\alpha_{\text{table}})^2} \le \mu_s m g$$
     the relative slip ceases ($\vec{v}_{\text{rel}} = \vec{0}$), and the puck re-adheres to the rotating turntable at radius $r'$. Otherwise, the puck continues slipping until it leaves the turntable boundary ($r > R_{\text{turntable}} = 5.0\text{ m}$) or comes to rest.

#### E. Vector Visualizations (Toggled via Overlay Checkboxes)
- Velocity vector $\vec{v}$ (Cyan, tangential: $v_t\hat{\theta}$).
- Centripetal acceleration $\vec{a}_c$ (Mint green, radially inward toward center: $-r\omega^2\hat{r}$).
- Tangential acceleration $\vec{a}_t$ (Amber, along tangent: $r\alpha\hat{\theta}$).
- Resultant acceleration $\vec{a}_{\text{net}}$ (White, vector sum $\vec{a}_c + \vec{a}_t$).
- Centripetal tension / friction force vector $\vec{F}$ (Yellow, inward).

---

### 3.2 Mode 2: Motion in a Vertical Circle (Gravity & String Slackening)

#### A. Physical Apparatus & Layout
A vertical plane apparatus showing a mass $m$ attached to a pivot $(0, 0)$ by a light inextensible string of length $R$. Terrestrial gravity $g = 9.8\text{ m/s}^2$ acts vertically downward ($-Y$).

```text
                  [Top: θ = π]
                      (●)
                    /  |  \
                   /   |   \
                  /    |    \
                 /     |R    \
                /      |      \
               |       O       |  Pivot (0,0)
                \      |      /
                 \     |     /
                  \    |    /
                   \   |   /
                    \  |  /
                      (●)
                 [Bottom: θ = 0]
```

#### B. Unified Coordinate Definition & Conventions
- Polar angle $\theta$:
  - $\theta = 0\text{ rad}$ corresponds to the **lowest (bottom) point**.
  - $\theta = \pi/2\text{ rad}$ corresponds to the **horizontal position**.
  - $\theta = \pi\text{ rad}$ corresponds to the **highest (top) point**.
- Position coordinates:
  $$x(\theta) = R\sin\theta, \quad y(\theta) = -R\cos\theta$$
- Elevation above the lowest point ($y(0) = -R$):
  $$h(\theta) = y(\theta) - (-R) = R(1 - \cos\theta)$$
- Mechanical Energy Conservation:
  $$E = \frac{1}{2}m v_0^2 = \frac{1}{2}m v(\theta)^2 + mgh(\theta) = \frac{1}{2}m v(\theta)^2 + mgR(1 - \cos\theta)$$
  $$v(\theta) = \sqrt{v_0^2 - 2gR(1 - \cos\theta)}$$
- Radial Dynamic Equilibrium & String Tension:
  Inward centripetal acceleration is $a_c = \frac{v^2}{R}$. The forces acting along the inward radial direction are tension $T$ (always inward along the string) and the radial component of gravity $mg\cos\theta$ (inward in lower half $\theta < \pi/2$ where $\cos\theta > 0$, outward in upper half $\theta > \pi/2$ where $\cos\theta < 0$):
  $$F_{\text{inward}} = T + mg\cos\theta = \frac{mv^2}{R}$$
  $$T(\theta) = \frac{mv(\theta)^2}{R} + mg\cos\theta$$
  - At bottom ($\theta = 0$): $\cos 0 = 1 \implies T_{\text{bottom}} = \frac{mv_0^2}{R} + mg$.
  - At horizontal ($\theta = \pi/2$): $\cos(\pi/2) = 0 \implies T_{\text{horiz}} = \frac{mv_{\text{horiz}}^2}{R} = \frac{m(v_0^2 - 2gR)}{R}$.
  - At top ($\theta = \pi$): $\cos\pi = -1 \implies T_{\text{top}} = \frac{mv_{\text{top}}^2}{R} - mg$.

#### C. User-Adjustable Parameters

| Parameter | Symbol | Unit | Default | Range | Step | Description |
|---|---|---|---:|---:|---:|---|
| **Radius / String Length** | $R$ | m | 1.5 | 0.5 – 3.0 | 0.1 | Length of string |
| **Initial Bottom Velocity** | $v_0$ | m/s | 9.0 | 0.0 – 15.0 | 0.2 | Speed at $\theta = 0$ |
| **Bob Mass** | $m$ | kg | 1.0 | 0.1 – 5.0 | 0.1 | Mass of rotating bob |
| **Linkage Type** | — | — | `Flexible String` | `Flexible String` / `Rigid Rod` | — | Slackens at $T \le 0$ vs rigid |
| **Gravity** | $g$ | m/s² | 9.8 | Fixed | — | Terrestrial gravity |

#### D. Boundary Regimes & Physics Principles

1. **Regime 1: Zero Velocity ($v_0 = 0$)**
   - The bob rests statically at the bottom position ($\theta = 0, h = 0$).
   - Velocity $v = 0$, tension $T = mg$.

2. **Regime 2: Pure Pendulum Oscillation ($0 < v_0 < \sqrt{2gR}$)**
   - The initial energy is insufficient to reach the horizontal line ($h_{\max} = \frac{v_0^2}{2g} < R$).
   - The bob oscillates symmetrically between $-\theta_{\max}$ and $+\theta_{\max}$, where:
     $$\cos\theta_{\max} = 1 - \frac{v_0^2}{2gR} > 0 \implies \theta_{\max} < \frac{\pi}{2}$$
   - Because $\theta \le \theta_{\max} < \frac{\pi}{2}$, $\cos\theta > 0$ everywhere along the trajectory.
   - Tension $T(\theta) = \frac{mv^2}{R} + mg\cos\theta > 0$ strictly at all times, reaching a minimum at turning points: $T_{\min} = mg\cos\theta_{\max} > 0$. The string never slackens.

3. **Regime 3: Exact Horizontal Threshold ($v_0 = \sqrt{2gR}$)**
   - The bob reaches exactly the horizontal position $\theta = \pi/2$ ($h = R$).
   - At $\theta = \pi/2$: $v = \sqrt{2gR - 2gR} = 0$, and $\cos(\pi/2) = 0 \implies T = 0$.
   - The bob momentarily comes to rest at the horizontal with zero tension, then falls backward into oscillatory motion.

4. **Regime 4: String Slackening & Projectile Fall ($\sqrt{2gR} < v_0 < \sqrt{5gR}$)**
   - The bob reaches the upper semicircle ($\theta > \pi/2$), where $\cos\theta < 0$.
   - Because $v_0 < \sqrt{5gR}$, tension drops to zero ($T = 0$) *before* speed reaches zero, at a slack angle $\theta_{\text{slack}} \in (\pi/2, \pi)$:
     $$T(\theta_{\text{slack}}) = 0 \implies \frac{mv_{\text{slack}}^2}{R} + mg\cos\theta_{\text{slack}} = 0 \implies v_{\text{slack}}^2 = -gR\cos\theta_{\text{slack}}$$
     Substituting into energy conservation:
     $$-gR\cos\theta_{\text{slack}} = v_0^2 - 2gR(1 - \cos\theta_{\text{slack}})$$
     $$\cos\theta_{\text{slack}} = -\frac{v_0^2 - 2gR}{3gR}$$
   - Since $\sqrt{2gR} < v_0 < \sqrt{5gR}$, we have $0 < v_0^2 - 2gR < 3gR$, guaranteeing $-1 < \cos\theta_{\text{slack}} < 0$ and $\frac{\pi}{2} < \theta_{\text{slack}} < \pi$.
   - **Projectile Flight:** At $\theta_{\text{slack}}$, the flexible string becomes slack ($T = 0$). The bob leaves circular motion and travels along a free parabolic trajectory under gravity:
     $$\vec{a}(t) = -g\hat{j}$$
     $$\vec{r}(t) = \vec{r}_{\text{slack}} + \vec{v}_{\text{slack}} \Delta t - \frac{1}{2}g(\Delta t)^2\hat{j}$$
     $$\vec{v}(t) = \vec{v}_{\text{slack}} - g\Delta t\,\hat{j}$$
     where $\vec{r}_{\text{slack}} = R\sin\theta_{\text{slack}}\hat{i} - R\cos\theta_{\text{slack}}\hat{j}$ and $\vec{v}_{\text{slack}} = v_{\text{slack}}(\cos\theta_{\text{slack}}\hat{i} + \sin\theta_{\text{slack}}\hat{j})$.
   - **Slack-to-Taut Transition Condition:**
     While in projectile flight, the distance from pivot is $|\vec{r}(t)| < R$.
     The transition occurs at the exact moment the projectile path reaches string length:
     $$|\vec{r}(t)| \ge R \quad \text{and} \quad \vec{r}(t) \cdot \vec{v}(t) > 0$$
     (i.e., radius is fully extended and the velocity vector has an outward radial component).
   - **Impulsive Radial Arrest & Energy Loss:**
     The light inextensible string cannot stretch, producing an impulsive tension shock along $\hat{r} = \frac{\vec{r}}{|\vec{r}|}$.
     The outward radial velocity component $v_r = \vec{v} \cdot \hat{r} > 0$ is instantaneously arrested to zero:
     $$\vec{v}_{\text{taut}} = v_\theta \hat{\theta} = (\vec{v} \cdot \hat{\theta})\hat{\theta}$$
     where $\hat{\theta} = -\frac{y}{R}\hat{i} + \frac{x}{R}\hat{j}$.
     The radial kinetic energy is dissipated into inelastic string jerk:
     $$\Delta E_{\text{lost}} = \frac{1}{2}m v_r^2 = \frac{1}{2}m (\vec{v} \cdot \hat{r})^2$$
     The bob resumes circular motion along the perimeter with reduced mechanical energy $E_{\text{new}} = \frac{1}{2}m v_\theta^2 + mgh$.

5. **Regime 5: Complete Vertical Loop ($v_0 \ge \sqrt{5gR}$)**
   - The bob successfully traverses the highest point ($\theta = \pi$) without the string going slack ($T_{\text{top}} \ge 0$).
   - At the top:
     $$v_{\text{top}} = \sqrt{v_0^2 - 4gR} \ge \sqrt{gR}$$
     $$T_{\text{top}} = \frac{mv_{\text{top}}^2}{R} - mg \ge 0$$
   - **Theoretical Tension Invariant:**
     For any complete loop, the difference between bottom tension and top tension is strictly independent of speed:
     $$T_{\text{bottom}} - T_{\text{top}} = \left(\frac{m v_0^2}{R} + mg\right) - \left(\frac{m (v_0^2 - 4gR)}{R} - mg\right) = 4mg + 2mg = 6mg$$

6. **Rigid Rod Constraint (`Linkage Type = Rigid Rod`):**
   - A rigid rod can exert normal thrust ($T < 0$, acting in compression).
   - The bob cannot slacken or enter projectile flight.
   - The critical threshold to complete a loop is purely kinematic: $v_{\text{top}} \ge 0 \implies v_{0,\text{crit}} = \sqrt{4gR} = 2\sqrt{gR}$.
   - If $v_0 < 2\sqrt{gR}$, the bob oscillates smoothly like an inverted pendulum.

---

### 3.3 Mode 3: Vehicle on Level & Banked Curves

#### A. Physical Apparatus & Layout
A dual-view display:
1. **Left Half (Top-Down Track View):** Overhead roadway showing vehicle radius $r$, trajectory path, skid warning boundaries, and steering angle.
2. **Right Half (Cross-Sectional Incline View):** Transverse view of vehicle of mass $m$ on roadway banked at angle $\theta$ above horizontal, showing contact tires, normal reaction $\vec{N}$, weight $m\vec{g}$, and static friction force $\vec{f}_s$ along the road surface.

```text
       Top-Down Overhead View             Cross-Section Incline View
      ========================           ============================
              . - ~ - .                               ^ N
          .               .                           |   /
        .                   .                         |  /
       .         r           .                 \      | /
      . --------[Car]         .                 \   [CAR]  --> f_s (down incline)
       .                     .                   \   /  \
        .                   .                     \ /____\_______ θ (Bank Angle)
          .               .                        \
              . - ~ - .                             \
```

#### B. User-Adjustable Parameters

| Parameter | Symbol | Unit | Default | Range | Step | Description |
|---|---|---|---:|---:|---:|---|
| **Curve Radius** | $r$ | m | 40.0 | 10.0 – 100.0 | 5.0 | Roadway radius of curvature |
| **Vehicle Speed** | $v$ | m/s | 15.0 | 0.0 – 40.0 | 1.0 | Speed of vehicle ($0\text{--}144\text{ km/h}$) |
| **Banking Angle** | $\theta$ | deg (°) | 15.0 | 0.0 – 45.0 | 1.0 | Roadway transverse banking angle |
| **Static Friction** | $\mu_s$ | — | 0.40 | 0.00 – 0.90 | 0.05 | Tire-road static friction coefficient |
| **Vehicle Mass** | $m$ | kg | 1200 | 500 – 2500 | 100 | Mass of vehicle |

#### C. Governing Equations & Regimes

1. **Horizontal and Vertical Force Equilibrium:**
   - Vertical balance (no vertical acceleration):
     $$N\cos\theta - f_s\sin\theta - mg = 0 \quad (\text{if } f_s \text{ acts down incline})$$
     $$N\cos\theta + f_s\sin\theta - mg = 0 \quad (\text{if } f_s \text{ acts up incline})$$
   - Radial horizontal force providing centripetal acceleration:
     $$F_c = \frac{m v^2}{r} = N\sin\theta + f_s\cos\theta \quad (\text{if } f_s \text{ acts down incline})$$
     $$F_c = \frac{m v^2}{r} = N\sin\theta - f_s\cos\theta \quad (\text{if } f_s \text{ acts up incline})$$

2. **Case A: Level Road ($\theta = 0^\circ$):**
   $$N = mg, \quad f_s = \frac{mv^2}{r}$$
   - Slip occurs if $f_s > \mu_s N$:
     $$v_{\max} = \sqrt{\mu_s r g}$$

3. **Case B: Ideal (Frictionless) Banking ($f_s = 0$):**
   $$N\cos\theta = mg \implies N = \frac{mg}{\cos\theta}$$
   $$F_c = N\sin\theta = mg\tan\theta = \frac{mv^2}{r}$$
   $$\tan\theta = \frac{v_{\text{opt}}^2}{rg} \implies v_{\text{opt}} = \sqrt{rg\tan\theta}$$
   - If vehicle travels at exactly $v = v_{\text{opt}}$, zero lateral friction is required. Tires experience no lateral wear.

4. **Case C: Banked Road with Static Friction ($\mu_s > 0$):**
   - **Tendency to skid outward ($v > v_{\text{opt}}$):** Friction $f_s$ acts **downward along the incline**:
     $$f_s = \frac{m(v^2/r)\cos\theta - mg\sin\theta}{\cos\theta + (v^2/rg)\sin\theta}$$
     Maximum safe speed before outward skidding occurs when $f_s = \mu_s N$:
     $$v_{\max} = \sqrt{rg \left(\frac{\tan\theta + \mu_s}{1 - \mu_s\tan\theta}\right)}$$
     *(Provided $\mu_s \tan\theta < 1$; if $\mu_s \tan\theta \ge 1$, the vehicle will never skid outward regardless of speed).*
   - **Tendency to slide inward ($v < v_{\text{opt}}$):** Friction $f_s$ acts **upward along the incline**:
     Minimum safe speed to prevent sliding down into the median (only relevant when $\tan\theta > \mu_s$):
     $$v_{\min} = \sqrt{rg \left(\frac{\tan\theta - \mu_s}{1 + \mu_s\tan\theta}\right)}$$
     *(If $\tan\theta \le \mu_s$, gravity component along incline cannot overcome static friction; $v_{\min} = 0$, car remains parked securely).*

5. **Stability & Skid HUD Badges:**
   - `SAFE: Balanced (v = v_opt)` (Cyan)
   - `SAFE: Friction Prevents Outward Skid` (Green)
   - `SAFE: Friction Prevents Inward Slide` (Green)
   - `⚠️ SKID OUTWARD (v > v_max)` (Red banner)
   - `⚠️ SLIDE INWARD (v < v_min)` (Orange banner)

---

### 3.4 Mode 4: Conical Pendulum

#### A. Physical Apparatus & Layout
A side-angle 3D orthographic projection showing a ceiling pivot at $(0, H)$, a light inextensible cord of length $L$ inclined at semi-vertical angle $\theta$, and a bob of mass $m$ revolving steadily in a horizontal circle of radius $r = L\sin\theta$ at vertical depth $h = L\cos\theta$ below the pivot.

```text
                     Ceiling
                  ══════╤══════  (0, H)
                        │\
                        │ \
                        │  \  Length L
                        │ θ \
                      h │    \
                        │     \
                        │      \
     Horizontal Circle  ├───────(●) Bob (m)
            (radius r)  │   r    ▲
                        │        │  v (into page)
```

#### B. User-Adjustable Parameters

| Parameter | Symbol | Unit | Default | Range | Step | Description |
|---|---|---|---:|---:|---:|---|
| **String Length** | $L$ | m | 1.5 | 0.5 – 3.0 | 0.1 | Length of suspension cord |
| **Semi-Vertical Angle** | $\theta$ | deg (°) | 30.0 | 5.0 – 80.0 | 1.0 | Angle between cord and vertical |
| **Bob Mass** | $m$ | kg | 0.5 | 0.1 – 2.0 | 0.1 | Mass of pendulum bob |
| **Gravity** | $g$ | m/s² | 9.8 | Fixed | — | Terrestrial gravity |

#### C. Governing Equations & Physics Invariants

1. **Geometric Relations:**
   $$r = L\sin\theta, \quad h = L\cos\theta$$
2. **Force Balance:**
   - Vertical equilibrium:
     $$T\cos\theta = mg \implies T = \frac{mg}{\cos\theta}$$
   - Horizontal centripetal force:
     $$F_c = T\sin\theta = mg\tan\theta$$
3. **Required Angular Velocity & Speed:**
   $$F_c = m\omega^2 r = m\omega^2(L\sin\theta) = mg\tan\theta$$
   $$\omega = \sqrt{\frac{g\tan\theta}{r}} = \sqrt{\frac{g\tan\theta}{L\sin\theta}} = \sqrt{\frac{g}{L\cos\theta}} = \sqrt{\frac{g}{h}}$$
   $$v = \omega r = \sqrt{gL\frac{\sin^2\theta}{\cos\theta}}$$
4. **Time Period of Revolution:**
   $$T_{\text{period}} = \frac{2\pi}{\omega} = 2\pi\sqrt{\frac{L\cos\theta}{g}} = 2\pi\sqrt{\frac{h}{g}}$$
   - **Key Educational Insight:** The time period of a conical pendulum depends only on the **vertical depth $h$** of the orbit below the pivot point, completely independent of the bob's mass $m$.
5. **Small-Angle Relation & Approximation Tolerance:**
   The exact ratio of conical pendulum period to the simple small-angle pendulum period $T_0 = 2\pi\sqrt{L/g}$ is:
   $$\frac{T_{\text{conical}}}{T_0} = \sqrt{\cos\theta}$$
   - For $\theta = 5.0^\circ$:
     $$\cos(5^\circ) \approx 0.9961947, \quad \sqrt{\cos(5^\circ)} \approx 0.9980955$$
     $$\text{Relative Deviation} = 1 - \sqrt{\cos(5^\circ)} \approx 0.001905 = 0.1905\% \approx 0.2\%$$
   - For $\theta = 3.0^\circ$:
     $$\cos(3^\circ) \approx 0.9986295, \quad \sqrt{\cos(3^\circ)} \approx 0.9993145$$
     $$\text{Relative Deviation} = 1 - \sqrt{\cos(3^\circ)} \approx 0.000685 = 0.0685\% < 0.1\%$$
   - **Rigorous Tolerance Specification:**
     A strict $0.1\%$ agreement threshold holds for semi-vertical angles $\theta \le 3^\circ$ (or $\le 3.6^\circ$). At the default lower limit $\theta = 5^\circ$, the actual deviation is $\approx 0.19\%$, which is justified by and compliant with a $0.2\%$ tolerance threshold.

---

## 4. Multi-Tab Real-Time Graphs

To match the high analytical standard set by `work-energy-power`, each mode provides a dedicated tabbed graph section in the right panel:

### Mode 1 Graphs:
1. **Angular Speed vs. Time ($\omega-t$):** Plots instantaneous $\omega(t)$ and theoretical slope $\alpha$.
2. **Accelerations vs. Time ($a-t$):** Centripetal acceleration $a_c(t) = r\omega^2$, tangential acceleration $a_t(t) = r\alpha$, and net magnitude $a_{\text{net}}(t) = \sqrt{a_c^2 + a_t^2}$.
3. **Trajectory Phase ($x-y$):** Real-time circular $(x, y)$ orbital trace and breakaway tangent path.

### Mode 2 Graphs:
1. **Tension vs. Angle ($T-\theta$):** Plots instantaneous tension $T(\theta) = \frac{mv^2}{R} + mg\cos\theta$ against polar angle $\theta \in [0, 2\pi]$, showing peak at bottom ($\theta = 0$) and minimum at top ($\theta = \pi$), with explicit $T = 0$ slack boundary.
2. **Speed vs. Angle ($v-\theta$):** Compares kinetic profile against critical speeds $\sqrt{gR}$ and $\sqrt{5gR}$.
3. **Energy vs. Time ($E-t$):** Continuous verification that total mechanical energy $E = K + U_g$ remains constant (or tracks step-down dissipation upon string taut jerk).

### Mode 3 Graphs:
1. **Lateral Friction vs. Speed ($f_s-v$):** Plots lateral friction force as a function of speed $v \in [0, v_{\max}]$, highlighting zero-friction crossing at $v = v_{\text{opt}}$ and static limit $f_{s,\max} = \mu_s N$.
2. **Forces vs. Banking Angle ($F-\theta$):** Shows trade-off between normal reaction component $N\sin\theta$ and friction requirement across angles $0^\circ\text{--}45^\circ$.

### Mode 4 Graphs:
1. **Period vs. Angle ($T_{\text{period}}-\theta$):** Plots $T_{\text{period}} = 2\pi\sqrt{\frac{L\cos\theta}{g}}$ illustrating monotonic decrease as angle widens.
2. **Tension vs. Angle ($T-\theta$):** Hyperbolic tension curve $T = \frac{mg}{\cos\theta}$, demonstrating asymptotic divergence toward $\theta = 90^\circ$.

---

## 5. Controls, Remote Navigation & D-pad Order

### Input Abstraction Architecture
The simulation will utilize the established `InputManager` listening to standard key events:
- D-pad Up / Down / Left / Right
- Enter / OK (`select`)
- Space (`play/pause`)
- Back (`escape` / host back navigation)

### D-pad Focus Sequence (Per Mode):
1. **Mode Switcher Tabs** (Indices 0–3): `Horizontal`, `Vertical`, `Banked`, `Conical`.
2. **Parameter Steppers** (Indices 4–9):
   - Mass, Radius/Length, Speed/Angular Speed, Acceleration/Angle, Static Friction, Kinetic Friction.
   - D-pad Left / Right decrements/increments values by standard steps.
3. **Action Buttons** (Indices 10–11):
   - `Start / Pause` button
   - `Reset` button
4. **Quick Presets** (Indices 12–14): Mode-specific benchmark experiments.
5. **Graph Tabs** (Indices 15–17): Switch analytical visualization tabs.

---

## 6. Mathematical Invariants & Test Case Matrix

The following test suites must be created to verify the numerical engine prior to rendering:

| Test ID | Module | Physical Invariant / Equation | Acceptance Criteria |
|---|---|---|---|
| `CM-INV-01` | Kinematics | $s = r\theta, v_t = r\omega, v = r\|\omega\|, a_t = r\alpha$ | Exact equality within $10^{-9}$ floating tolerance, properly distinguishing signed velocity from scalar speed. |
| `CM-INV-02` | Kinematics | $a_c = v^2/r = r\omega^2, \vec{a}_c = -r\omega^2\hat{r}$ | Exact inward radial vector equality across all $r > 0$ and signed $\omega$. |
| `CM-INV-03` | Non-Uniform | $\vec{a} = \vec{a}_c + \vec{a}_t$, $\|\vec{a}\|^2 = a_c^2 + a_t^2$ | Pythagorean orthogonal sum holds for arbitrary signed $\omega$ and $\alpha \ne 0$. |
| `CM-INV-04` | Turntable Friction | $F_{\text{required}} = m\sqrt{(r\omega^2)^2 + (r\alpha)^2} > \mu_s mg$ | Static breakaway condition verified, followed by relative slip acceleration $\vec{a} = -\mu_k g \frac{\vec{v}_{\text{rel}}}{\|\vec{v}_{\text{rel}}\|}$. |
| `CM-INV-05` | Vertical Circle | $E(\theta) = \frac{1}{2}m v(\theta)^2 + mgR(1 - \cos\theta) = E_0$ | Mechanical energy conserved within $0.01\%$ across full loop ($\theta = 0$ at bottom). |
| `CM-INV-06` | Vertical Circle | $T_{\text{bottom}} - T_{\text{top}} = 6mg$ | Holds identically for any complete loop with $v_{\text{top}} \ge \sqrt{gR}$ ($v_0 \ge \sqrt{5gR}$). |
| `CM-INV-07` | Vertical Circle | Slack angle $\cos\theta_{\text{slack}} = -\frac{v_0^2 - 2gR}{3gR}$ | Tension reaches $0.0\text{ N}$ at $\theta_{\text{slack}}$, triggers projectile flight, and executes taut arrest at $\|\vec{r}\| \ge R, \vec{r}\cdot\vec{v}>0$ with $\vec{v}_{\text{taut}} = v_\theta\hat{\theta}$. |
| `CM-INV-08` | Banked Curve | Frictionless speed $v_{\text{opt}} = \sqrt{rg\tan\theta}$ | Computed friction $f_s \equiv 0.0\text{ N}$ when $v = v_{\text{opt}}$. |
| `CM-INV-09` | Banked Curve | $v_{\max} = \sqrt{rg \frac{\tan\theta + \mu_s}{1 - \mu_s\tan\theta}}$ | $f_s$ exactly equals $\mu_s N$ at upper boundary ($\mu_s\tan\theta < 1$). |
| `CM-INV-10` | Banked Curve | $v_{\min} = \sqrt{rg \frac{\tan\theta - \mu_s}{1 + \mu_s\tan\theta}}$ | $f_s$ exactly equals $-\mu_s N$ at lower boundary when $\tan\theta > \mu_s$. |
| `CM-INV-11` | Conical Pendulum | $T_{\text{period}} = 2\pi\sqrt{\frac{L\cos\theta}{g}} = 2\pi\sqrt{\frac{h}{g}}$ | Independence of mass: changing $m$ alters tension but leaves $T_{\text{period}}$ unchanged. |
| `CM-INV-12` | Conical Pendulum | Small angle limit: $\frac{T_{\text{conical}}}{T_0} = \sqrt{\cos\theta}$ | Deviation $\le 0.1\%$ for $\theta \le 3^\circ$; deviation $\le 0.2\%$ for $\theta \le 5^\circ$ ($1 - \sqrt{\cos 5^\circ} \approx 0.19\%$). |

---

## 7. Numerical Stability & Edge Cases

1. **Singularities at Zero Radius:** Clamp $r \ge 0.10\text{ m}$ to prevent $\frac{v^2}{r}$ division by zero.
2. **Steep Banking Asymptote:** When $\mu_s \tan\theta \ge 1.0$, $v_{\max} \to \infty$; the engine must handle this gracefully without emitting `NaN` or `Infinity`, displaying `No Outward Skid Limit`.
3. **Vertical Loop Energy Deficit:** If $v_0 < \sqrt{2gR}$, top cannot be reached; avoid taking square root of negative numbers when computing $v(\theta)$ by clamping radicand to zero.
4. **Time Integration:** Semi-implicit Euler or Velocity Verlet integration with fixed sub-stepping ($\Delta t = 0.002\text{ s}$) to prevent numerical orbit drift over long run times.
5. **Non-Finite Protection:** All Canvas coordinates must pass `Number.isFinite(...)` validation before invoking Canvas drawing APIs.

---

## 8. Alignment with Architecture & AGENTS.md

- **Separation of Layers:** Physics calculations (`CircularMotionPhysics.ts`) will reside strictly in `src/physics/` independent of DOM and Canvas.
- **Renderer Decoupling:** Canvas apparatus views will reside in `src/rendering/CircularMotionRenderer.ts`.
- **Simulation Lifecycle:** Lifecycle adheres to standard `initialize()`, `start()`, `pause()`, `reset()`, `tick()`, `dispose()` contract.
- **TV & Remote First:** High-contrast 1080p layout readable from a classroom viewing distance, full D-pad support, and offline-first execution via `WebViewAssetLoader`.
