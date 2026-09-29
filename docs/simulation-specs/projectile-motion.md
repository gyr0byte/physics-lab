# Simulation Spec: Projectile Motion

## Metadata

| Field | Value |
|-------|-------|
| ID | `projectile-motion` |
| Title | Projectile Motion |
| Grade | 11 |
| Area | Mechanics |
| Chapter | Kinematics |
| Status | ✅ Implemented |

## Concepts

- Projectile motion under uniform gravity
- Decomposition of velocity into horizontal and vertical components
- Parabolic trajectory
- Independence of horizontal and vertical motion
- Time of flight, range, maximum height

## Learning Objectives

1. Understand how launch angle affects range and height
2. Observe that horizontal velocity remains constant
3. Observe that vertical velocity changes due to gravity
4. Verify that 45° maximizes range for a given speed
5. Verify that complementary angles (e.g., 30° and 60°) yield the same range
6. Relate the mathematical equations to visual behavior

## Variables the Learner Can Change

| Parameter | Unit | Default | Range | Step |
|-----------|------|---------|-------|------|
| Initial Speed | m/s | 25 | 1–80 | 1 |
| Launch Angle | ° | 45 | 0–90 | 1 |
| Gravity | m/s² | 9.81 | 1–25 | 0.1 |

## Measured Outputs

- Elapsed time (s)
- Position (x, y) in meters
- Velocity magnitude (m/s)
- Horizontal velocity vₓ (m/s)
- Vertical velocity vᵧ (m/s)
- Horizontal range R (m)
- Maximum height H (m)
- Time of flight T (s)

## Equations / Model

Idealized projectile motion, no air resistance:

```
vx = v₀ · cos(θ)
vy₀ = v₀ · sin(θ)

x(t) = x₀ + vx · t
y(t) = y₀ + vy₀ · t − ½ · g · t²

vy(t) = vy₀ − g · t

Range:       R = v₀² · sin(2θ) / g
Max Height:  H = (v₀ · sin(θ))² / (2g)
Time of Flight: T = 2 · v₀ · sin(θ) / g
```

## Assumptions

- No air resistance
- Flat ground at launch height
- Uniform gravitational field
- Point particle

## Expected Observations

1. Higher speed → longer range and higher trajectory
2. 45° angle → maximum range for given speed
3. Steeper angles → higher but shorter range
4. Shallower angles → lower but also shorter range
5. Lower gravity → longer flight time and greater range
6. Horizontal velocity is constant throughout flight
7. Vertical velocity is zero at maximum height

## Example Experiments

### Experiment 1: Effect of Launch Angle

1. Set speed to 25 m/s, gravity to 9.81 m/s²
2. Launch at 30°, note the range
3. Launch at 45°, note the range
4. Launch at 60°, note the range
5. Compare results: 45° should have the longest range
6. Note that 30° and 60° have the same range

### Experiment 2: Effect of Gravity

1. Set speed to 25 m/s, angle to 45°
2. Launch with g = 9.81 m/s² (Earth), note the range
3. Launch with g = 1.62 m/s² (Moon), note the range
4. The Moon range should be ~6× the Earth range

## Input Map

| Control | D-pad Action |
|---------|-------------|
| Select parameter | ↑ ↓ |
| Adjust value | ← → |
| Start simulation | Navigate to Start, press Enter |
| Pause | Navigate to Pause, press Enter |
| Reset | Navigate to Reset, press Enter |
| Toggle play/pause | Space |

## Reset State

- Time = 0
- Position = (0, 0)
- Velocity = (0, 0)
- Trajectory cleared
- Graph cleared
- Parameters preserved

## Accessibility / Readability

- Large parameter values readable from classroom distance
- High-contrast dark theme
- Clear vector arrows (velocity = green, vx = orange, vy = red, gravity = purple)
- Predicted trajectory shown as dashed line before launch
- Range and max height markers displayed on canvas
