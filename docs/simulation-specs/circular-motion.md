# Simulation Spec: Circular Motion

## Metadata

| Field | Value |
|---|---|
| ID | `circular-motion` |
| Title | Circular Motion (Kinematics, Dynamics, Banked Curves & Vertical Loops) |
| Grade | 11 |
| Area | Mechanics |
| Chapter | Chapter 6: Circular Motion |
| Status | 📋 Specification Phase Complete |

---

## 1. Pedagogical Scope & Objectives

This specification defines the complete educational architecture for **Circular Motion** in Grade 11 Secondary-Level Physics, compliant with the official Curriculum Development Centre (CDC) Nepal syllabus (*Physics Grade 11 (2024)*, Chapter 6, pp. 132–153).

The simulation allows students to experiment with both horizontal and vertical curvilinear motion, investigate the relationships between angular and linear kinematics, decompose forces producing centripetal acceleration, explore the mechanics of banked roads, and observe conical pendulum periods.

### Core Curriculum Competencies:
1. **Angular Kinematics:** Define angular displacement ($\theta$), angular velocity ($\omega = \frac{d\theta}{dt}$), and angular acceleration ($\alpha = \frac{d\omega}{dt}$).
2. **Linear-to-Angular Relationships:** Rigorously verify $s = r\theta$, $v = r\omega$, and tangential acceleration $a_t = r\alpha$.
3. **Uniform Circular Motion (UCM):** Demonstrate constant angular speed ($\alpha = 0, a_t = 0$) where velocity vector direction changes continuously, driven by purely radial centripetal acceleration ($a_c = \frac{v^2}{r} = \omega^2 r = v\omega$).
4. **Centripetal Force Nature:** Demonstrate that centripetal force is **not** an independent, mysterious interaction, but the **vector resultant (net inward radial force)** provided by real physical agents (string tension, surface normal force, friction, or gravity component).
5. **Rotating-Frame Clarification:** Establish that centrifugal force does not exist in an inertial laboratory frame. Any rotating-frame explanation must be explicitly labeled as an apparent/pseudo-force.
6. **Non-Uniform Circular Motion:** Model simultaneous tangential and radial accelerations, computing the resultant acceleration vector $\vec{a} = \vec{a}_c + \vec{a}_t$ with magnitude $|\vec{a}| = \sqrt{a_c^2 + a_t^2}$ and direction $\phi = \arctan(a_t / a_c)$.
7. **Motion in a Vertical Circle:**
   - Investigate tension variation across the circle: $T(\theta) = \frac{m v^2}{r} - mg\cos\theta$ (where $\theta = 0$ is top).
   - Verify energy conservation: $E = \frac{1}{2}mv^2 + mg(r - r\cos\theta) = \text{constant}$.
   - Identify critical top velocity ($v_{\text{top},\text{crit}} = \sqrt{rg}$) and critical bottom velocity ($v_{\text{bottom},\text{crit}} = \sqrt{5rg}$).
   - Prove the classic theoretical invariant: $T_{\text{bottom}} - T_{\text{top}} = 6mg$.
   - Model flexible string slackening ($T \le 0$) transitioning into parabolic projectile motion under gravity versus rigid rod constraints.
8. **Level & Banked Road Dynamics:**
   - Level circular track: Centripetal force supplied solely by static friction ($v_{\max} = \sqrt{\mu_s rg}$).
   - Ideal frictionless banked curve: Optimal design speed $v_{\text{opt}} = \sqrt{rg\tan\theta}$ where normal force component $N\sin\theta$ provides exact centripetal requirement without lateral tire shear.
   - Banked curve with friction: Upper speed threshold $v_{\max} = \sqrt{rg \frac{\mu_s + \tan\theta}{1 - \mu_s\tan\theta}}$ and lower slip-down threshold $v_{\min} = \sqrt{rg \frac{\tan\theta - \mu_s}{1 + \mu_s\tan\theta}}$ (for $\tan\theta > \mu_s$).
9. **Conical Pendulum:**
   - Bob suspended by string of length $L$ circulating in a horizontal plane with semi-vertical angle $\theta$ and orbital radius $r = L\sin\theta$.
   - Balance of vertical tension component against gravity ($T\cos\theta = mg$) and horizontal component providing centripetal force ($T\sin\theta = m\omega^2 r$).
   - Verify mass-independent time period: $T_{\text{period}} = 2\pi\sqrt{\frac{L\cos\theta}{g}} = 2\pi\sqrt{\frac{h}{g}}$.

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
│ Ang. Speed (ω) ◀ 3.0/s ▶ │  (Canvas 2D Viewport    │ ω:   3.00 rad/s   │
│ Tang. Acc. (α) ◀ 0.0/s²▶ │   with vector arrows,   │ v:   6.00 m/s     │
│ Mass (m)       ◀ 1.0kg ▶ │   particle, trail, and  │ a_c: 18.00 m/s²   │
│                          │   reference axes)       │ a_t:  0.00 m/s²   │
│ [ Start ] [ Reset ]      │                         │ F_c: 18.00 N      │
│                          │                         ├───────────────────┤
│ PRESETS                  │                         │ REAL-TIME GRAPHS  │
│ 1. Uniform Circular      │                         │ [ω-t] [a-t] [F-θ] │
│ 2. Angular Acceleration  │                         │                   │
└──────────────────────────┴─────────────────────────┴───────────────────┘
```

---

## 3. Detailed Mode Specifications

### 3.1 Mode 1: Horizontal Turntable & Kinematics (Uniform & Non-Uniform)

#### A. Physical Apparatus & Layout
An overhead bird's-eye view of a calibrated circular track/turntable with concentric radius rings ($0.5\text{ m}$ to $5.0\text{ m}$) centered at $(X_0, Y_0) = (0, 0)$. A particle/puck of mass $m$ travels along the circular perimeter at radius $r$.

```text
               +Y
                |          v (tangential)
                |        ▲
                |       /
                |     [●]  Particle (r, θ)
                |    / |
                |   /  | a_c (radial)
                |  /   ▼
                | / r
                |/ θ
  --------------+---------------- +X
                |
                |
                |
```

#### B. Coordinate System & Sign Conventions
- Origin $(0, 0)$ is at the circular center.
- Position vector: $\vec{r}(t) = r\cos\theta\,\hat{i} + r\sin\theta\,\hat{j}$.
- Velocity vector: $\vec{v}(t) = -r\omega\sin\theta\,\hat{i} + r\omega\cos\theta\,\hat{j}$.
- Centripetal acceleration vector: $\vec{a}_c(t) = -\omega^2 \vec{r} = -\frac{v^2}{r}\hat{r}$.
- Tangential acceleration vector: $\vec{a}_t(t) = -r\alpha\sin\theta\,\hat{i} + r\alpha\cos\theta\,\hat{j} = a_t \hat{\theta}$.
- Counter-clockwise rotation is defined as positive ($\omega > 0, \Delta\theta > 0$).

#### C. User-Adjustable Parameters

| Parameter | Symbol | Unit | Default | Range | Step | Description |
|---|---|---|---:|---:|---:|---|
| **Radius** | $r$ | m | 2.0 | 0.5 – 5.0 | 0.1 | Orbit radius |
| **Initial Angular Velocity** | $\omega_0$ | rad/s | 2.0 | -10.0 – +10.0 | 0.5 | Initial angular speed |
| **Angular Acceleration** | $\alpha$ | rad/s² | 0.0 | -5.0 – +5.0 | 0.2 | Rate of change of $\omega$ |
| **Particle Mass** | $m$ | kg | 1.0 | 0.1 – 5.0 | 0.1 | Mass of circulating body |
| **Static Friction Coeff.** | $\mu_s$ | — | 0.50 | 0.05 – 1.00 | 0.05 | Friction limit if unattached |
| **Attachment Mode** | — | — | `Tether` | `Tether` / `Friction Surface` | — | Tether cord vs surface friction |

#### D. Governing Equations & Numerical State
State: $[\theta, \omega]$.

1. **Angular kinematics update:**
   $$\theta(t + \Delta t) = \theta(t) + \omega(t)\Delta t + \frac{1}{2}\alpha\Delta t^2$$
   $$\omega(t + \Delta t) = \omega(t) + \alpha\Delta t$$
2. **Linear quantities:**
   $$s(t) = r \cdot \theta(t), \quad v(t) = r \cdot |\omega(t)|$$
   $$a_c(t) = \frac{v^2}{r} = r\omega^2, \quad a_t(t) = r\alpha$$
   $$a_{\text{net}}(t) = \sqrt{a_c^2 + a_t^2}, \quad \phi = \arctan\left(\frac{a_t}{a_c}\right)$$
3. **Forces:**
   - Inward centripetal force requirement: $F_c = m a_c = m r \omega^2$.
   - Forward tangential force requirement: $F_t = m a_t = m r \alpha$.
   - Total force required: $F_{\text{net}} = m \sqrt{a_c^2 + a_t^2}$.
4. **Friction Slip Boundary (if Mode = `Friction Surface`):**
   - Maximum available static friction: $f_{s,\max} = \mu_s m g$.
   - Slip condition: If $F_{\text{net}} > f_{s,\max}$, the puck breaks away tangentially along its instantaneous velocity vector:
     $$\vec{v}_{\text{break}} = \vec{v}(t_{\text{slip}}), \quad \vec{r}(t) = \vec{r}_{\text{slip}} + \vec{v}_{\text{break}}(t - t_{\text{slip}})$$
     with friction deceleration $-\mu_k g \hat{v}$.

#### E. Vector Visualizations (Toggled via Overlay Checkboxes)
- Velocity vector $\vec{v}$ (Cyan, tangential).
- Centripetal acceleration $\vec{a}_c$ (Mint green, radially inward toward center).
- Tangential acceleration $\vec{a}_t$ (Amber, along tangent).
- Resultant acceleration $\vec{a}_{\text{net}}$ (White, composite vector).
- Centripetal tension / friction force vector $\vec{F}_c$ (Yellow, inward).

---

### 3.2 Mode 2: Motion in a Vertical Circle (Gravity & String Slackening)

#### A. Physical Apparatus & Layout
A vertical plane apparatus showing a mass $m$ attached to a pivot $(0, 0)$ by a light inextensible string of length $R$. Gravity $g = 9.8\text{ m/s}^2$ acts vertically downward ($-Y$).

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

#### B. Coordinate Definition
- $\theta = 0\text{ rad}$ corresponds to the **lowest (bottom) point**.
- $\theta = \pi\text{ rad}$ corresponds to the **highest (top) point**.
- Position:
  $$x(\theta) = R\sin\theta, \quad y(\theta) = -R\cos\theta$$
- Elevation above lowest point:
  $$h(\theta) = y(\theta) - y(0) = R(1 - \cos\theta)$$

#### C. User-Adjustable Parameters

| Parameter | Symbol | Unit | Default | Range | Step | Description |
|---|---|---|---:|---:|---:|---|
| **Radius / String Length** | $R$ | m | 1.5 | 0.5 – 3.0 | 0.1 | Length of string |
| **Initial Bottom Velocity** | $v_0$ | m/s | 9.0 | 0.0 – 15.0 | 0.2 | Speed at $\theta = 0$ |
| **Bob Mass** | $m$ | kg | 1.0 | 0.1 – 5.0 | 0.1 | Mass of rotating bob |
| **Linkage Type** | — | — | `Flexible String` | `Flexible String` / `Rigid Rod` | — | Slackens at $T \le 0$ vs rigid |
| **Gravity** | $g$ | m/s² | 9.8 | Fixed | — | Terrestrial gravity |

#### D. Governing Equations & Physics Principles

1. **Mechanical Energy Conservation:**
   $$E = \frac{1}{2}m v_0^2 = \frac{1}{2}m v(\theta)^2 + mgh(\theta)$$
   $$v(\theta) = \sqrt{v_0^2 - 2gR(1 - \cos\theta)}$$
2. **Radial Force Balance & String Tension:**
   Centripetal force is provided by the vector sum of string tension $T$ and the radial component of weight:
   $$F_{\text{radial}} = T - mg\cos\theta = \frac{m v^2}{R}$$
   $$T(\theta) = \frac{m v(\theta)^2}{R} + mg\cos\theta$$
   - At the **bottom** ($\theta = 0$):
     $$T_{\text{bottom}} = \frac{m v_0^2}{R} + mg$$
   - At the **top** ($\theta = \pi$):
     $$v_{\text{top}} = \sqrt{v_0^2 - 4gR}$$
     $$T_{\text{top}} = \frac{m v_{\text{top}}^2}{R} - mg$$
   - At horizontal ($\theta = \pi/2$):
     $$T_{\text{horiz}} = \frac{m v_{\text{horiz}}^2}{R}$$
3. **Critical Thresholds (Flexible String):**
   - **Full Circle Execution:** Requires $T_{\text{top}} \ge 0 \implies v_{\text{top}} \ge \sqrt{gR}$.
     $$v_{0,\text{crit}} = \sqrt{5gR}$$
   - **Tension Difference for Complete Loops:**
     $$T_{\text{bottom}} - T_{\text{top}} = \left(\frac{m v_0^2}{R} + mg\right) - \left(\frac{m v_{\text{top}}^2}{R} - mg\right) = \frac{m(4gR)}{R} + 2mg = 6mg$$
   - **Oscillation Regime without Slackening:**
     If $v_0 \le \sqrt{2gR}$, the bob does not reach the horizontal line ($h \le R$, $\theta \le \pi/2$). It executes pendulum oscillation with $T > 0$ everywhere.
   - **String Slackening & Projectile Fall Regime:**
     If $\sqrt{2gR} < v_0 < \sqrt{5gR}$, tension drops to zero ($T = 0$) at some angle $\theta_{\text{slack}}$ between $\pi/2$ and $\pi$:
     $$\cos\theta_{\text{slack}} = -\frac{v_0^2 - 2gR}{3gR}$$
     At this exact instant, the string becomes slack! The bob leaves circular motion and transitions into **free projectile motion under gravity**:
     $$\vec{a} = -g\hat{j}, \quad \vec{r}(t) = \vec{r}_{\text{slack}} + \vec{v}_{\text{slack}}\Delta t - \frac{1}{2}g\Delta t^2\hat{j}$$
     until distance from pivot again reaches $R$ (string snaps taut again, dissipating radial velocity).
4. **Rigid Rod Regime (Toggleable):**
   - A rigid rod can support compression ($T < 0$).
   - Critical speed at top is purely kinematic: $v_{\text{top}} \ge 0 \implies v_{0,\text{crit}} = \sqrt{4gR} = 2\sqrt{gR}$.

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
A side-angle 3D orthographic projection showing a ceiling pivot at $(0, H)$, a light inextensible cord of length $L$ inclined at semi-vertical angle $\theta$, and a bob of mass $m$ revolving steadily in a horizontal circle of radius $r = L\sin\theta$ at depth $h = L\cos\theta$.

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
     $$F_c = T\sin\theta = (mg\tan\theta)$$
3. **Required Angular Velocity & Speed:**
   $$F_c = m\omega^2 r = m\omega^2(L\sin\theta) = mg\tan\theta$$
   $$\omega = \sqrt{\frac{g\tan\theta}{r}} = \sqrt{\frac{g\tan\theta}{L\sin\theta}} = \sqrt{\frac{g}{L\cos\theta}} = \sqrt{\frac{g}{h}}$$
   $$v = \omega r = \sqrt{gL\frac{\sin^2\theta}{\cos\theta}}$$
4. **Time Period of Revolution:**
   $$T_{\text{period}} = \frac{2\pi}{\omega} = 2\pi\sqrt{\frac{L\cos\theta}{g}} = 2\pi\sqrt{\frac{h}{g}}$$
   - **Key Educational Insight:** The time period of a conical pendulum depends only on the **vertical depth $h$** of the orbit below the pivot point, completely independent of the bob's mass $m$.
   - As $\theta \to 0^\circ$, $T_{\text{period}} \to 2\pi\sqrt{\frac{L}{g}}$ (recovering the exact small-angle simple pendulum formula).
   - As $\theta \to 90^\circ$, $T \to \infty$ and $T_{\text{period}} \to 0$ (tension approaches infinity).

---

## 4. Multi-Tab Real-Time Graphs

To match the high analytical standard set by `work-energy-power`, each mode provides a dedicated tabbed graph section in the right panel:

### Mode 1 Graphs:
1. **Angular Speed vs. Time ($\omega-t$):** Plots instantaneous $\omega(t)$ and theoretical slope $\alpha$.
2. **Accelerations vs. Time ($a-t$):** Centripetal acceleration $a_c(t)$, tangential acceleration $a_t(t)$, and net magnitude $a_{\text{net}}(t)$.
3. **Trajectory Phase ($x-y$):** Real-time circular $(x, y)$ orbital trace.

### Mode 2 Graphs:
1. **Tension vs. Angle ($T-\theta$):** Plots instantaneous tension $T(\theta)$ against polar angle $\theta \in [0, 2\pi]$, showing peak at bottom ($\theta = 0$) and minimum at top ($\theta = \pi$), with explicit $T = 0$ slack boundary.
2. **Speed vs. Angle ($v-\theta$):** Compares kinetic profile against critical speeds $\sqrt{gR}$ and $\sqrt{5gR}$.
3. **Energy vs. Time ($E-t$):** Continuous verification that total mechanical energy $E = K + U_g$ remains constant.

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
2. **Parameter Steppers** (Indices 4–8):
   - Mass, Radius/Length, Speed/Angular Speed, Acceleration/Angle, Friction.
   - D-pad Left / Right decrements/increments values by standard steps.
3. **Action Buttons** (Indices 9–10):
   - `Start / Pause` button
   - `Reset` button
4. **Quick Presets** (Indices 11–13): Mode-specific benchmark experiments.
5. **Graph Tabs** (Indices 14–16): Switch analytical visualization tabs.

---

## 6. Mathematical Invariants & Test Case Matrix

The following test suites must be created to verify the numerical engine prior to rendering:

| Test ID | Module | Physical Invariant / Equation | Acceptance Criteria |
|---|---|---|---|
| `CM-INV-01` | Kinematics | $s = r\theta, v = r\omega, a_t = r\alpha$ | Exact equality within $10^{-9}$ floating tolerance. |
| `CM-INV-02` | Kinematics | $a_c = v^2/r = \omega^2 r = v\omega$ | Triple equivalence equality across all $r > 0, \omega$. |
| `CM-INV-03` | Non-Uniform | $a_{\text{net}}^2 = a_c^2 + a_t^2$ | Pythagorean orthogonal sum holds for arbitrary $\alpha \ne 0$. |
| `CM-INV-04` | Vertical Circle | $E(\theta) = \frac{1}{2}m v(\theta)^2 + mgR(1 - \cos\theta) = E_0$ | Mechanical energy conserved within $0.01\%$ across full loop. |
| `CM-INV-05` | Vertical Circle | $T_{\text{bottom}} - T_{\text{top}} = 6mg$ | Holds identically for any complete loop with $v_{\text{top}} \ge \sqrt{gR}$. |
| `CM-INV-06` | Vertical Circle | Slack angle $\cos\theta_{\text{slack}} = -\frac{v_0^2 - 2gR}{3gR}$ | Tension strictly reaches $0.0\text{ N}$ at calculated $\theta_{\text{slack}}$. |
| `CM-INV-07` | Banked Curve | Frictionless speed $v_{\text{opt}} = \sqrt{rg\tan\theta}$ | Computed friction $f_s \equiv 0.0\text{ N}$ when $v = v_{\text{opt}}$. |
| `CM-INV-08` | Banked Curve | $v_{\max} = \sqrt{rg \frac{\tan\theta + \mu_s}{1 - \mu_s\tan\theta}}$ | $f_s$ exactly equals $\mu_s N$ at upper boundary. |
| `CM-INV-09` | Banked Curve | $v_{\min} = \sqrt{rg \frac{\tan\theta - \mu_s}{1 + \mu_s\tan\theta}}$ | $f_s$ exactly equals $-\mu_s N$ at lower boundary when $\tan\theta > \mu_s$. |
| `CM-INV-10` | Conical Pendulum | $T_{\text{period}} = 2\pi\sqrt{\frac{L\cos\theta}{g}}$ | Independence of mass: changing $m$ alters tension but leaves $T_{\text{period}}$ unchanged. |
| `CM-INV-11` | Conical Pendulum | Small angle limit: $\lim_{\theta \to 0} T_{\text{period}} = 2\pi\sqrt{L/g}$ | Reconverges to simple pendulum formula within $0.1\%$ for $\theta \le 5^\circ$. |

---

## 7. Numerical Stability & Edge Cases

1. **Singularities at Zero Radius:** Clamp $r \ge 0.10\text{ m}$ to prevent $\frac{v^2}{r}$ division by zero.
2. **Steep Banking Asymptote:** When $\mu_s \tan\theta \ge 1.0$, $v_{\max} \to \infty$; the engine must handle this gracefully without emitting `NaN` or `Infinity`, displaying `No Outward Skid Limit`.
3. **Vertical Loop Energy Deficit:** If $v_0 < \sqrt{2gR}$, top cannot be reached; avoid taking square root of negative numbers when computing $v(\theta)$ by clamping radicand to zero.
4. **Time Integration:** Semi-implicit Euler or analytic closed-form integration with fixed sub-stepping ($\Delta t = 0.002\text{ s}$) to prevent numerical orbit drift over long run times.
5. **Non-Finite Protection:** All Canvas coordinates must pass `areFinite(x, y, ...)` validation before invoking Canvas drawing APIs.

---

## 8. Alignment with Architecture & AGENTS.md

- **Separation of Layers:** Physics calculations (`CircularMotionPhysics.ts`) will reside strictly in `src/physics/` independent of DOM and Canvas.
- **Renderer Decoupling:** Canvas apparatus views will reside in `src/rendering/CircularMotionRenderer.ts`.
- **Simulation Lifecycle:** Lifecycle adheres to standard `initialize()`, `start()`, `pause()`, `reset()`, `tick()`, `dispose()` contract.
- **TV & Remote First:** High-contrast 1080p layout readable from a classroom viewing distance, full D-pad support, and offline-first execution via `WebViewAssetLoader`.
