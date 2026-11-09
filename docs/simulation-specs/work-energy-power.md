# Simulation Spec: Work, Energy & Power

## Metadata

| Field | Value |
|---|---|
| ID | `work-energy-power` |
| Title | Work, Energy & Power (Inclined Plane & Spring) |
| Grade | 11 |
| Area | Mechanics |
| Chapter | Chapter 5: Work, Energy & Power |
| Status | 🧪 Step 1: Physics Engine & Specifications Complete |

---

## 1. Pedagogical Scope & Objectives

This simulation models a sliding block on a rigid inclined track with a guided compression spring bumper anchored at the lower end.

### Core Concepts Demonstrated:
1. **Work done by constant forces:** Gravitational component along incline ($W_g = F_g \cdot \Delta s$).
2. **Work done by variable forces:** Hookean spring restoring force ($W_s = -\frac{1}{2}k x_s^2$).
3. **Work-energy theorem:** Net work equals change in kinetic energy ($\Delta K = W_{\text{net}} = W_g + W_s + W_f$).
4. **Kinetic energy ($K$):** Translation kinetic energy of a sliding block ($K = \frac{1}{2}mv^2$).
5. **Gravitational potential energy ($U_g$):** Elevation relative to lower track boundary ($U_g = mg(s_{\max}-s)\sin\theta$).
6. **Elastic potential energy ($U_s$):** Energy stored in spring compression ($U_s = \frac{1}{2}kx_s^2$).
7. **Conservation of mechanical energy:** Conservative exchange between $K$, $U_g$, and $U_s$ when friction is zero.
8. **Conservative vs. non-conservative forces:** Friction dissipates mechanical energy irreversibly into thermal energy ($Q$).
9. **Energy ledger:** Total energy conservation ($K + U_g + U_s + Q = E_0$).
10. **Instantaneous and average power:** $P = F \cdot v$ and $P_{\text{avg}} = W / \Delta t$.

> [!NOTE]
> **Curriculum Boundary:** This simulation specifically addresses work, kinetic/potential energy transformations, thermal dissipation, and power on an incline. Collisions in one and two dimensions (elastic and inelastic collisions) form a distinct pedagogical topic in Chapter 5 and will be developed as a separate future simulation experiment.

---

## 2. Physical Apparatus & Fixed Geometry

The apparatus consists of a rigid, linear inclined guide track of total travel distance $L_{\text{track}} = 5.00\text{ m}$ from the initial release face to the lower rigid end-stop bracket. A guided linear compression spring is mounted at the bottom of the track.

```text
       [Block] s=0 (Release)
         \
          \  Inclined Track (Length = 5.00 m, Angle = θ)
           \
            \
             \
              \  s_c = 3.50 m (Spring Contact Point)
               \   ┌─────────────────────────────┐
                \  │ Spring (L0 = 1.50 m)        │
                 \ │ Solid Height = 0.10 m       │
                  \│ Lower Boundary s_max = 4.90m│
                   └─────────────────────────────┘
```

### Fixed Apparatus Geometry:
- **Track distance to lower anchor:** $L_{\text{track}} = 5.00\text{ m}$
- **Spring natural uncompressed length:** $L_0 = 1.50\text{ m}$
- **Spring solid height (compressed limit):** $L_{\text{solid}} = 0.10\text{ m}$
- **Block length along track:** $L_{\text{block}} = 0.30\text{ m}$
- **Standard gravitational acceleration:** $g = 9.8\text{ m/s}^2$
- **Spring contact position:** $s_c = L_{\text{track}} - L_0 = 3.50\text{ m}$
- **Maximum permissible spring compression:** $x_{\max} = L_0 - L_{\text{solid}} = 1.40\text{ m}$
- **Lower travel boundary (solid height contact):** $s_{\max} = s_c + x_{\max} = 4.90\text{ m}$
- **Upper travel boundary:** $s_{\min} = -0.50\text{ m}$

### Coordinate Convention:
- Displacement coordinate $s$ measures the position of the block's downhill contact face along the track.
- $s = 0\text{ m}$ is the initial release position near the top.
- Positive direction ($+s$) is directed **downhill**.
- Velocity $v = \dot{s}$ is positive downhill and negative uphill.
- Acceleration $a = \ddot{s}$ is positive downhill and negative uphill.

---

## 3. User-Adjustable Parameters

| Parameter | Symbol | Unit | Default | Allowed Range | Step | Description |
|---|---|---|---:|---:|---:|---|
| **Mass** | $m$ | kg | 2.0 | 0.5 – 5.0 | 0.5 | Mass of the sliding block |
| **Incline Angle** | $\theta$ | deg (°) | 25.0 | 10.0 – 45.0 | 5.0 | Incline angle above horizontal |
| **Kinetic Friction** | $\mu_k$ | — | 0.05 | 0.00 – 0.30 | 0.01 | Sliding surface friction coefficient |
| **Static Friction** | $\mu_s$ | — | 0.08 | 0.00 – 0.40 | 0.01 | Breakaway friction coefficient ($\mu_s \ge \mu_k$) |
| **Spring Constant** | $k$ | N/m | 40.0 | 10.0 – 80.0 | 5.0 | Stiffness of the lower bumper spring |
| **Gravity** | $g$ | m/s² | 9.8 | Fixed | — | Standard terrestrial gravity |

---

## 4. Governing Equations

### 4.1 Force Balance
Along the track:
1. **Downhill gravity component:**
   $$F_g = mg \sin\theta$$
2. **Normal reaction perpendicular to track:**
   $$N = mg \cos\theta$$
3. **Spring compression:**
   $$x_s = \max(0, s - s_c)$$
4. **Spring restoring force (acts uphill when compressed):**
   $$F_s = -k x_s$$
5. **Static friction threshold:**
   $$f_{s,\max} = \mu_s N = \mu_s mg \cos\theta$$
6. **Kinetic friction force:**
   $$F_k = -\mu_k N \operatorname{sgn}(v)$$
7. **Net driving force (excluding friction):**
   $$F_{\text{drive}} = F_g + F_s = mg\sin\theta - k x_s$$

### 4.2 Static vs. Kinetic Motion Conditions
- **At rest ($|v| < 10^{-6}\text{ m/s}$):**
  - If $|F_{\text{drive}}| \le f_{s,\max}$:
    $$F_{\text{friction}} = -F_{\text{drive}}, \quad F_{\text{net}} = 0, \quad a = 0 \quad (\text{Block held at rest})$$
  - If $|F_{\text{drive}}| > f_{s,\max}$:
    $$F_{\text{friction}} = -\operatorname{sgn}(F_{\text{drive}}) \mu_k N, \quad F_{\text{net}} = F_{\text{drive}} + F_{\text{friction}}, \quad a = \frac{F_{\text{net}}}{m} \quad (\text{Breakaway})$$
- **In motion ($|v| \ge 10^{-6}\text{ m/s}$):**
  $$F_{\text{friction}} = -\operatorname{sgn}(v) \mu_k N, \quad F_{\text{net}} = F_{\text{drive}} + F_{\text{friction}}, \quad a = \frac{F_{\text{net}}}{m}$$

---

## 5. Energy Accounting & Work Ledger

### 5.1 Energy Quantities
1. **Kinetic Energy:**
   $$K = \frac{1}{2}mv^2$$
2. **Gravitational Potential Energy (reference zero at $s = s_{\max} = 4.90\text{ m}$):**
   $$U_g = mg (s_{\max} - s) \sin\theta$$
3. **Elastic Potential Energy:**
   $$U_s = \frac{1}{2}k x_s^2$$
4. **Accumulated Frictional Thermal Energy:**
   $$Q(t) = \int_0^t \mu_k N |v(\tau)|\, d\tau$$
5. **Total Energy Ledger:**
   $$E_{\text{total}}(t) = K(t) + U_g(t) + U_s(t) + Q(t) = E_0 = mg s_{\max} \sin\theta$$

### 5.2 Work Calculations & Work-Energy Theorem
1. **Work done by gravity:**
   $$W_g = \int_0^s mg\sin\theta\, ds' = mg\sin\theta \cdot s = -\Delta U_g$$
2. **Work done by spring:**
   $$W_s = \int_0^s F_s(s')\, ds' = -\frac{1}{2}k x_s^2 = -\Delta U_s$$
3. **Work done by friction:**
   $$W_f = \int_0^s F_k\, ds' = -Q$$
4. **Work-Energy Theorem:**
   $$W_{\text{net}} = W_g + W_s + W_f = \Delta K = K(t) - K(0)$$

---

## 6. Power Calculations

1. **Instantaneous Power:**
   - Gravity: $P_g = F_g \cdot v = (mg\sin\theta) v$
   - Spring: $P_s = F_s \cdot v = (-k x_s) v$
   - Friction: $P_f = F_{\text{friction}} \cdot v = -\mu_k N |v| \le 0$
   - Net mechanical power: $P_{\text{net}} = F_{\text{net}} \cdot v = \frac{dK}{dt}$
2. **Average Power:**
   $$P_{\text{avg}, i} = \frac{W_i}{\Delta t} \quad (\text{Evaluates to } 0 \text{ when } \Delta t = 0)$$

---

## 7. Numerical Integration & Physical Constraints

1. **Integration Method:**
   Symplectic Velocity Verlet integration with fixed internal substepping ($\Delta t_{\text{sub}} \le 0.001\text{ s}$).
2. **Zero-Crossing Friction Arrest:**
   When deceleration brings velocity across zero within a substep, the exact stop time and position are evaluated analytically. If $|F_{\text{drive}}| \le f_{s,\max}$ at the stop position, the block is arrested cleanly into static equilibrium ($v=0, a=0$), completely preventing artificial chatter.
3. **Travel-Limit Termination:**
   If parameters cause the block to reach $s > 4.90\text{ m}$ (solid height contact) or $s < -0.50\text{ m}$ (upper track limit):
   - The last valid physical state is preserved with its true velocity and acceleration.
   - Status is set to `'exceeded'`.
   - Subsequent integration calls are frozen.
   - No fabricated collisions, clamps, or artificial rebounds are introduced.

---

## 8. Physical Assumptions & Modeling Decisions

- **Sliding Block Model:** Pure linear translation along the track. No wheels, rolling friction, or rotational kinetic energy are present.
- **Uniform Incline:** Friction coefficients $\mu_s, \mu_k$ and incline angle $\theta$ are homogeneous across the entire track.
- **Ideal Linear Spring:** Massless spring obeying Hooke's law up to solid height $L_{\text{solid}} = 0.10\text{ m}$.
- **Zero Inelastic Impact Fabrication:** The model terminates upon solid height contact rather than fabricating a restitution coefficient.
