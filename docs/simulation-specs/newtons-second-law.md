# Simulation Spec: Newton's Second Law of Motion

## Metadata

| Field | Value |
|-------|-------|
| ID | `newtons-second-law` |
| Title | Newton's Second Law of Motion |
| Grade | 11 |
| Area | Mechanics |
| Chapter | Newton's Laws of Motion |
| Status | ✅ Implemented |

## Concepts

- Newton's Second Law: $F_{\text{net}} = m \times a$
- Net force vs. applied force
- Static friction and breakaway threshold ($f_{s,\max} = \mu_s N$)
- Kinetic friction opposing motion ($f_k = \mu_k N$)
- Normal force ($N = mg$) and weight ($W = mg$)
- Acceleration as response to net unbalanced force
- Deceleration to rest and friction arrest (zero-crossing without numerical oscillation)

## Learning Objectives

1. Verify that acceleration is directly proportional to net force for constant mass ($a \propto F_{\text{net}}$).
2. Verify that acceleration is inversely proportional to mass for constant net force ($a \propto 1/m$).
3. Distinguish clearly between applied force ($F_{\text{app}}$), friction force ($f$), and net force ($F_{\text{net}}$).
4. Observe static friction holding an object at rest until $|F_{\text{app}}| > f_{s,\max}$.
5. Observe kinetic friction retarding motion and bringing the object to rest when applied force is removed.
6. Relate real-time visual vector representations ($F_{\text{app}}$, $f$, $F_{\text{net}}$, $a$, $v$) to numeric measurements and graphs.

## Variables the Learner Can Change

| Parameter | Unit | Default | Range | Step | Description |
|-----------|------|---------|-------|------|-------------|
| Applied Force ($F$) | N | 20.0 | -50 to +50 | 5.0 | Horizontal applied push/pull (+ right, - left) |
| Mass ($m$) | kg | 5.0 | 1.0 to 20.0 | 1.0 | Inertial mass of the sliding block |
| Friction Coeff ($\mu$) | dimensionless | 0.10 | 0.00 to 0.50 | 0.05 | Surface roughness coefficient (0 = frictionless) |

Quick-action presets available:
- **Frictionless ($\mu=0$):** Instantly zeros friction to observe pure $a = F/m$.
- **Double Mass ($2m$):** Instantly doubles current mass (clamped to 20 kg) to directly test inverse proportionality $a \to a/2$.

## Measured Outputs

- Elapsed time ($t$) in seconds (s)
- Horizontal position ($x$) in meters (m)
- Horizontal velocity ($v$) in meters per second (m/s)
- Horizontal acceleration ($a$) in meters per second squared (m/s²)
- Mass ($m$) in kilograms (kg)
- Applied force ($F_{\text{app}}$) in Newtons (N)
- Friction force ($f$) in Newtons (N)
- Net force ($F_{\text{net}}$) in Newtons (N)
- Static friction threshold ($f_{s,\max}$) in Newtons (N)
- Normal force ($N = mg$) and weight ($W = mg$) in Newtons (N)
- Motion status: `Static (At Rest)`, `Moving Right`, or `Moving Left`
- Live verification check: $F_{\text{net}} = m \times a$ displayed in green checkmark

## Equations / Model

All internal calculations use SI units.

### 1. Vertical equilibrium:
$$N = m \cdot g, \quad W = m \cdot g$$
where $g = 9.8\text{ m/s}^2$.

### 2. Friction thresholds:
- Static friction limit: $f_{s,\max} = \mu \cdot N = \mu \cdot m \cdot g$
- Kinetic friction magnitude: $f_k = 0.85 \cdot \mu \cdot N$ (standard secondary curriculum model where $\mu_k \approx 0.85 \mu_s$)

### 3. Force computation & static/dynamic transition:
- **At rest ($|v| < 10^{-4}\text{ m/s}$):**
  - If $|F_{\text{app}}| \le f_{s,\max}$:
    $$f = -F_{\text{app}}, \quad F_{\text{net}} = 0\text{ N}, \quad a = 0\text{ m/s}^2$$
  - If $|F_{\text{app}}| > f_{s,\max}$:
    $$f = -\operatorname{sgn}(F_{\text{app}}) \cdot f_k, \quad F_{\text{net}} = F_{\text{app}} + f, \quad a = \frac{F_{\text{net}}}{m}$$
- **In motion ($|v| \ge 10^{-4}\text{ m/s}$):**
  - Kinetic friction opposes instantaneous velocity direction:
    $$f = -\operatorname{sgn}(v) \cdot f_k, \quad F_{\text{net}} = F_{\text{app}} + f, \quad a = \frac{F_{\text{net}}}{m}$$

### 4. Time integration:
Semi-implicit Euler integration:
$$v(t + \Delta t) = v(t) + a(t) \cdot \Delta t$$
$$x(t + \Delta t) = x(t) + v(t + \Delta t) \cdot \Delta t$$

### 5. Numerical stability / Zero-crossing arrest:
When kinetic friction causes deceleration, if $v$ changes sign over a timestep $\Delta t$ and $|F_{\text{app}}| \le f_{s,\max}$, the object is clamped to exact rest ($v=0, a=0$) to prevent unphysical numerical fluttering around zero velocity.

## Assumptions

- One-dimensional rectilinear motion along a flat horizontal track.
- Uniform gravitational field ($g = 9.8\text{ m/s}^2$).
- Coulomb friction model with distinct static threshold and kinetic coefficient.
- Rigid sliding crate; no tipping or rotational degrees of freedom.

## Expected Observations

1. **Frictionless surface ($\mu = 0$):** Any non-zero applied force produces continuous acceleration $a = F/m$. Net force equals applied force. Velocity grows linearly.
2. **Static friction threshold:** Applying $F_{\text{app}} = 5\text{ N}$ on a $5\text{ kg}$ mass with $\mu = 0.20$ ($f_{s,\max} = 9.8\text{ N}$) results in $f = -5\text{ N}$, $F_{\text{net}} = 0\text{ N}$, and $a = 0\text{ m/s}^2$. The crate does not budge.
3. **Overcoming friction:** Increasing applied force past $9.8\text{ N}$ causes static friction to break, switching to kinetic friction, resulting in forward acceleration.
4. **Effect of mass doubling:** For a constant net force, pressing "Double Mass (2m)" halves the measured acceleration $a$.
5. **Deceleration & stopping:** When applied force is set to $0\text{ N}$ while moving, kinetic friction exerts a retarding force $f_k$, smoothly bringing the crate to a complete stop and holding it static.

## Example Experiments

### Experiment 1: Verifying $a \propto F_{\text{net}}$ (Constant Mass)
1. Set Mass $m = 5.0\text{ kg}$ and Friction $\mu = 0$ (Frictionless).
2. Set Applied Force $F = 10\text{ N}$, click Start, and observe acceleration: $a = 2.00\text{ m/s}^2$.
3. Reset. Set Applied Force $F = 20\text{ N}$, click Start, and observe: $a = 4.00\text{ m/s}^2$.
4. Reset. Set Applied Force $F = 40\text{ N}$, click Start, and observe: $a = 8.00\text{ m/s}^2$.
5. Observe that doubling the force exactly doubles the acceleration ($a \propto F$).

### Experiment 2: Verifying $a \propto 1/m$ (Constant Force)
1. Set Friction $\mu = 0$ and Applied Force $F = 20\text{ N}$.
2. Test $m = 2.0\text{ kg} \implies a = 10.00\text{ m/s}^2$.
3. Test $m = 4.0\text{ kg} \implies a = 5.00\text{ m/s}^2$.
4. Test $m = 10.0\text{ kg} \implies a = 2.00\text{ m/s}^2$.
5. Plot or compare acceleration against mass to verify the inverse relationship.

### Experiment 3: Static Friction and Breakaway
1. Set Mass $m = 10.0\text{ kg}$, Friction $\mu = 0.30$.
2. Calculate expected static friction threshold: $f_{s,\max} = 0.30 \times 10 \times 9.8 = 29.4\text{ N}$.
3. Set $F_{\text{app}} = 15\text{ N}$, press Start: observe $a = 0$, crate stays static, $f = -15\text{ N}$.
4. Increase $F_{\text{app}}$ in steps: at $25\text{ N}$, still static ($f = -25\text{ N}$).
5. Increase $F_{\text{app}}$ to $30\text{ N}$ ($> 29.4\text{ N}$): crate breaks away and begins accelerating.

## Input Map

| Control | D-pad / Keyboard Action | Mobile Touch / Mouse |
|---------|-------------------------|----------------------|
| Navigate controls | ↑ ↓ | Tap / Click element |
| Adjust parameter value | ← → (with focused slider) | Tap / Drag slider or stepper |
| Start simulation | Select Start button (Enter / OK) | Tap Start |
| Pause / Resume | Select Pause button (Enter / OK) or Space | Tap Pause / Resume |
| Reset simulation | Select Reset button (Enter / OK) | Tap Reset |
| Frictionless preset | Select "Frictionless (μ=0)" (Enter / OK) | Tap preset button |
| Double Mass preset | Select "Double Mass (2m)" (Enter / OK) | Tap preset button |

## Reset State

- Time $t = 0.00\text{ s}$
- Position $x = 0.00\text{ m}$
- Velocity $v = 0.00\text{ m/s}$
- Camera tracking reset to track origin ($x = 0$)
- Velocity and acceleration history cleared from graph
- Current parameter values ($m, F, \mu$) preserved

## Accessibility / Readability

- High-contrast color-coded vector arrows:
  - Applied Force: Royal Blue (`#3b82f6`)
  - Friction Force: Bright Red (`#ef4444`)
  - Net Force: Gold / Amber (`#f59e0b`)
  - Acceleration: Bright Green (`#22c55e`)
  - Velocity: Bright Cyan (`#06b6d4`)
- Arrow vertical offsets prevent visual clutter and label overlap even at high velocities.
- Dynamic camera tracking follows the sliding crate continuously across meters of track with 1 m and 5 m graduation marks.
- Live verification card displays $F_{\text{net}} = m \times a$ with a green badge confirming physical law compliance in real time.
- Large typography readable from a 10-foot classroom distance on landscape displays.
