import { describe, it, expect } from 'vitest';
import {
  computeStaticElongation,
  computeSpringNaturalFrequencies,
  computePendulumFrequencies,
  computeDampedFrequencies,
  computeIdealSpringState,
  computeDampedSpringState,
  computeSteadyStateAmplitude,
  computePhaseLag,
  computeResonancePeak,
  computeResonanceCurve,
  stepForcedOscillatorRK4,
  computeSmallAnglePendulumState,
  stepNonlinearPendulumRK4,
  transformToWorldCoordinates,
  computeAutoCameraBounds,
  transformToHorizontalWorldCoordinates,
  computeHorizontalAutoCameraBounds,
  validateSpringParams,
  validateForcedTrajectory,
  DEFAULT_SPRING_PARAMS,
  DEFAULT_PENDULUM_PARAMS,
  DEFAULT_FORCED_SPRING_PARAMS,
  DEFAULT_DRIVER_PARAMS,
  UNDAMPED_RESONANCE_PRESET,
  MAX_ENVELOPE_DAMPING_RATIO,
  SPRING_SOLID_HEIGHT,
  HORIZONTAL_NATURAL_LENGTH,
  HORIZONTAL_MAX_OPERATING_LENGTH,
  HORIZONTAL_RAIL_LENGTH,
  HORIZONTAL_MAX_COMPRESSION,
  HORIZONTAL_MAX_EXTENSION,
  HORIZONTAL_MAX_TRAVEL,
  HORIZONTAL_BLOCK_WIDTH,
  ForcedIntegrationState,
  PendulumState,
} from '../../src/physics/SimpleHarmonicPhysics';

describe('SimpleHarmonicPhysics — Official Nepal CDC Grade 12 Chapter 2', () => {
  // ==========================================================================
  // Suite 1: Vertical Spring Statics & Period Invariance
  // ==========================================================================
  describe('1. Vertical Spring Statics & Invariants', () => {
    it('calculates correct static equilibrium extension Δl = mg/k', () => {
      // 1.0 kg on 25 N/m spring, g = 9.80 m/s²
      const deltaL = computeStaticElongation(1.0, 25.0, 9.80);
      expect(deltaL).toBeCloseTo(0.392, 4);

      // 2.0 kg on 50 N/m spring, Moon g = 1.62 m/s²
      const deltaLMoon = computeStaticElongation(2.0, 50.0, 1.62);
      expect(deltaLMoon).toBeCloseTo(0.0648, 4);
    });

    it('calculates exact natural frequency and period: T = 2π√(m/k)', () => {
      // m = 1.0 kg, k = 25.0 N/m => ω0 = 5.0 rad/s, T = 2π/5 ≈ 1.2566 s
      const { omega0, period, frequency } = computeSpringNaturalFrequencies(1.0, 25.0);
      expect(omega0).toBeCloseTo(5.0, 6);
      expect(period).toBeCloseTo((2.0 * Math.PI) / 5.0, 6);
      expect(frequency).toBeCloseTo(5.0 / (2.0 * Math.PI), 6);
    });

    it('verifies period invariance with gravity (Earth vs. Moon vs. Jupiter)', () => {
      // Oscillation frequency depends ONLY on mass and stiffness, NOT on gravity
      const earthFreq = computeSpringNaturalFrequencies(1.0, 25.0);
      const moonDeltaL = computeStaticElongation(1.0, 25.0, 1.62);
      const earthDeltaL = computeStaticElongation(1.0, 25.0, 9.80);
      const jupiterDeltaL = computeStaticElongation(1.0, 25.0, 24.79);

      // Elongations must be completely different
      expect(moonDeltaL).toBeLessThan(earthDeltaL);
      expect(earthDeltaL).toBeLessThan(jupiterDeltaL);

      // But natural oscillation period remains identical
      expect(earthFreq.period).toBeCloseTo((2.0 * Math.PI) / 5.0, 12);
    });

    it('verifies period scaling rules (quadrupled mass and quadrupled stiffness)', () => {
      const base = computeSpringNaturalFrequencies(1.0, 25.0);

      // Quadruple mass => period exactly doubles
      const quadMass = computeSpringNaturalFrequencies(4.0, 25.0);
      expect(quadMass.period).toBeCloseTo(2.0 * base.period, 6);

      // Quadruple stiffness => period exactly halves
      const quadStiffness = computeSpringNaturalFrequencies(1.0, 100.0);
      expect(quadStiffness.period).toBeCloseTo(0.5 * base.period, 6);
    });
  });

  // ==========================================================================
  // Suite 2: Parameter Validation Consistency & Edge Cases
  // ==========================================================================
  describe('2. Parameter Validation Consistency', () => {
    it('accepts valid configurations and strictly preserves Δl = mg/k', () => {
      const res = validateSpringParams({
        mass: 1.0,
        springConstant: 25.0,
        gravity: 9.80,
        naturalLength: 0.40,
        initialDisplacement: 0.20,
      });

      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.staticElongation).toBeCloseTo(0.392, 4);
    });

    it('rejects configurations exceeding apparatus elongation limit (1.80 m)', () => {
      // 3.0 kg on Jupiter with 10 N/m => deltaL = 3.0 * 24.79 / 10 = 7.437 m
      const res = validateSpringParams({
        mass: 3.0,
        springConstant: 10.0,
        gravity: 24.79,
        initialDisplacement: 0.10,
      });

      expect(res.valid).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errors[0]).toContain('exceeds maximum allowable apparatus limit');
      expect(res.staticElongation).toBeNull();
    });

    it('rejects initial displacement exceeding vertical apparatus travel limit', () => {
      // L0 = 0.40, deltaL = 0.392 => total rest length = 0.792 m
      // L_solid = 0.10 m => travel clearance = 0.792 - 0.10 = 0.692 m
      // Max allowed amplitude = 0.85 * 0.692 = 0.5882 m
      // Requesting 0.80 m exceeds travel limit towards ceiling mount
      const res = validateSpringParams({
        mass: 1.0,
        springConstant: 25.0,
        gravity: 9.80,
        naturalLength: 0.40,
        initialDisplacement: 0.80,
      });

      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('vertical apparatus travel limit'))).toBe(true);
    });

    it('rejects a 2 m horizontal oscillation with the old 0.40 m natural length', () => {
      // With old natural length L0 = 0.40 m and solid height L_solid = 0.10 m,
      // maximum compression is 0.40 - 0.10 = 0.30 m.
      // An oscillation of 2.0 m in compression would give L = 0.40 - 2.0 = -1.60 m (physically impossible).
      const oldGeom = validateSpringParams(
        {
          mass: 1.0,
          springConstant: 25.0,
          naturalLength: 0.40,
          initialDisplacement: -2.0,
        },
        { orientation: 'horizontal' }
      );

      expect(oldGeom.valid).toBe(false);
      expect(oldGeom.errors.some(e => e.includes('horizontal spring solid height limit'))).toBe(true);

      // Trajectory probe with old geometry also fails
      const trajOld = validateForcedTrajectory(
        {
          mass: 1.0,
          springConstant: 25.0,
          naturalLength: 0.40,
          dampingCoefficient: 0.20,
          initialDisplacement: 0.0,
        },
        { driverForce: 2.0, drivingFrequency: 5.0 },
        { travelLimit: 0.40 - SPRING_SOLID_HEIGHT } // 0.30 m limit
      );
      expect(trajOld.valid).toBe(false);
      expect(trajOld.exceededAtTime).not.toBeNull();
    });

    it('supports the intended 2 m oscillation with revised horizontal geometry (L0_h = 2.50 m)', () => {
      // Default horizontal spring has L0_h = 2.50 m, L_solid = 0.10 m.
      // At max compression x = -2.0 m: L_min = 2.50 - 2.0 = 0.50 m >= 0.10 m (solid height) ✓
      const compRes = validateSpringParams(
        {
          mass: 1.0,
          springConstant: 25.0,
          initialDisplacement: -2.0,
        },
        { orientation: 'horizontal' }
      );
      expect(compRes.valid).toBe(true);
      expect(compRes.staticElongation).toBe(0.0);

      // At max extension x = +2.0 m: L_max = 2.50 + 2.0 = 4.50 m <= 5.50 m (max operating length) ✓
      const extRes = validateSpringParams(
        {
          mass: 1.0,
          springConstant: 25.0,
          initialDisplacement: 2.0,
        },
        { orientation: 'horizontal' }
      );
      expect(extRes.valid).toBe(true);

      // Binding travel limit is min(2.40, 3.00, 3.50) = 2.40 m
      expect(HORIZONTAL_MAX_COMPRESSION).toBe(2.40);
      expect(HORIZONTAL_MAX_EXTENSION).toBe(3.00);
      expect(HORIZONTAL_MAX_TRAVEL).toBe(2.40);
    });

    it('enforces maximum operating length (5.50 m) and rail travel limits on horizontal apparatus', () => {
      // L0_h = 2.50 m, L_max_op = 5.50 m => max allowed extension is 3.00 m.
      // Requesting x0 = +3.20 m gives L = 5.70 m > 5.50 m, which must be rejected:
      const exceedOperating = validateSpringParams(
        {
          mass: 1.0,
          springConstant: 25.0,
          initialDisplacement: 3.20,
        },
        { orientation: 'horizontal' }
      );
      expect(exceedOperating.valid).toBe(false);
      expect(exceedOperating.errors.some(e => e.includes('maximum operating length'))).toBe(true);

      // Guide rail length is 6.00 m => rail limit from equilibrium is 6.00 - 2.50 = 3.50 m.
      // Requesting x0 = +4.20 m with custom L0=2.0 m (rail limit 4.0 m) exceeds guide rail travel:
      const exceedRail = validateSpringParams(
        {
          mass: 1.0,
          springConstant: 25.0,
          naturalLength: 2.00,
          initialDisplacement: 4.20,
        },
        { orientation: 'horizontal' }
      );
      expect(exceedRail.valid).toBe(false);
      expect(exceedRail.errors.some(e => e.includes('horizontal guide rail travel'))).toBe(true);
    });

    it('validates complete forced-oscillation trajectory for default experiment and resonance', () => {
      // 1. Default forced experiment (Ω = 4.0 rad/s, off-resonance)
      const defaultTraj = validateForcedTrajectory(
        DEFAULT_FORCED_SPRING_PARAMS,
        DEFAULT_DRIVER_PARAMS
      );
      expect(defaultTraj.valid).toBe(true);
      expect(defaultTraj.exceededAtTime).toBeNull();
      // Steady-state amplitude is ~0.22 m; transient peak reaches ~0.383 m
      expect(defaultTraj.steadyStateAmplitude).toBeCloseTo(0.220, 2);
      expect(defaultTraj.peakDisplacement).toBeLessThan(0.45);
      expect(defaultTraj.peakDisplacement).toBeGreaterThan(defaultTraj.steadyStateAmplitude); // Transient overshoot demonstrated!
      expect(defaultTraj.transientOvershootFactor).toBeGreaterThan(1.5);
      expect(defaultTraj.peakDisplacement).toBeLessThan(HORIZONTAL_MAX_TRAVEL); // Well within 2.40 m limit ✓

      // 2. Forced resonance experiment (Ω_res ≈ 4.998 rad/s, near resonance)
      const omegaRes = Math.sqrt(24.98); // sqrt(omega0^2 - 2*gamma^2)
      const resTraj = validateForcedTrajectory(
        DEFAULT_FORCED_SPRING_PARAMS,
        { driverForce: 2.0, drivingFrequency: omegaRes }
      );
      expect(resTraj.valid).toBe(true);
      expect(resTraj.exceededAtTime).toBeNull();
      // Peak displacement reaches ~1.995 m, staying within HORIZONTAL_MAX_TRAVEL = 2.40 m ✓
      expect(resTraj.peakDisplacement).toBeCloseTo(2.00, 1);
      expect(resTraj.peakDisplacement).toBeLessThan(HORIZONTAL_MAX_TRAVEL);
    });

    it('throws explicit Error for non-positive or non-finite inputs in computeIdealSpringState and computeDampedSpringState', () => {
      // Negative/zero mass
      expect(() => computeIdealSpringState({ mass: 0, springConstant: 25.0, initialDisplacement: 0.1 }, 0)).toThrow(/Invalid physical parameters/);
      expect(() => computeIdealSpringState({ mass: -1.0, springConstant: 25.0, initialDisplacement: 0.1 }, 0)).toThrow(/Invalid physical parameters/);
      expect(() => computeDampedSpringState({ mass: 0, springConstant: 25.0, initialDisplacement: 0.1 }, 0)).toThrow(/Invalid physical parameters/);
      expect(() => computeDampedSpringState({ mass: -1.0, springConstant: 25.0, initialDisplacement: 0.1 }, 0)).toThrow(/Invalid physical parameters/);

      // Non-positive stiffness
      expect(() => computeIdealSpringState({ mass: 1.0, springConstant: 0, initialDisplacement: 0.1 }, 0)).toThrow(/Invalid physical parameters/);
      expect(() => computeIdealSpringState({ mass: 1.0, springConstant: -25.0, initialDisplacement: 0.1 }, 0)).toThrow(/Invalid physical parameters/);
      expect(() => computeDampedSpringState({ mass: 1.0, springConstant: 0, initialDisplacement: 0.1 }, 0)).toThrow(/Invalid physical parameters/);
      expect(() => computeDampedSpringState({ mass: 1.0, springConstant: -25.0, initialDisplacement: 0.1 }, 0)).toThrow(/Invalid physical parameters/);

      // Non-finite displacement or time
      expect(() => computeIdealSpringState({ mass: 1.0, springConstant: 25.0, initialDisplacement: NaN }, 0)).toThrow(/Invalid physical parameters/);
      expect(() => computeIdealSpringState({ mass: 1.0, springConstant: 25.0, initialDisplacement: 0.1 }, NaN)).toThrow(/Invalid physical parameters/);
      expect(() => computeDampedSpringState({ mass: 1.0, springConstant: 25.0, initialDisplacement: NaN }, 0)).toThrow(/Invalid physical parameters/);
      expect(() => computeDampedSpringState({ mass: 1.0, springConstant: 25.0, initialDisplacement: 0.1 }, NaN)).toThrow(/Invalid physical parameters/);
    });

    it('returns NaN for invalid parameters in computeSteadyStateAmplitude while returning 0 for F0 = 0', () => {
      const validDriver = { driverForce: 2.0, drivingFrequency: 4.0 };
      const validSpring = { mass: 1.0, springConstant: 25.0, dampingCoefficient: 0.2 };

      // Invalid mass / stiffness / force / damping / frequency => NaN
      expect(Number.isNaN(computeSteadyStateAmplitude({ ...validSpring, mass: 0 }, validDriver))).toBe(true);
      expect(Number.isNaN(computeSteadyStateAmplitude({ ...validSpring, mass: -1.0 }, validDriver))).toBe(true);
      expect(Number.isNaN(computeSteadyStateAmplitude({ ...validSpring, mass: NaN }, validDriver))).toBe(true);
      expect(Number.isNaN(computeSteadyStateAmplitude({ ...validSpring, springConstant: 0 }, validDriver))).toBe(true);
      expect(Number.isNaN(computeSteadyStateAmplitude({ ...validSpring, springConstant: -25.0 }, validDriver))).toBe(true);
      expect(Number.isNaN(computeSteadyStateAmplitude({ ...validSpring, dampingCoefficient: -0.2 }, validDriver))).toBe(true);
      expect(Number.isNaN(computeSteadyStateAmplitude(validSpring, { driverForce: -2.0, drivingFrequency: 4.0 }))).toBe(true);
      expect(Number.isNaN(computeSteadyStateAmplitude(validSpring, { driverForce: 2.0, drivingFrequency: NaN }))).toBe(true);

      // F0 === 0 is valid physical zero forcing => returns 0.0, even at resonance
      expect(computeSteadyStateAmplitude(validSpring, { driverForce: 0, drivingFrequency: 5.0 })).toBe(0.0);
    });

    it('rejects non-finite inputs: NaN, Infinity, and negative values', () => {
      expect(validateSpringParams({ mass: NaN, springConstant: 25.0, initialDisplacement: 0.1 }).valid).toBe(false);
      expect(validateSpringParams({ mass: Infinity, springConstant: 25.0, initialDisplacement: 0.1 }).valid).toBe(false);
      expect(validateSpringParams({ mass: -1.0, springConstant: 25.0, initialDisplacement: 0.1 }).valid).toBe(false);
      expect(validateSpringParams({ mass: 1.0, springConstant: 0.0, initialDisplacement: 0.1 }).valid).toBe(false);
      expect(validateSpringParams({ mass: 1.0, springConstant: -25.0, initialDisplacement: 0.1 }).valid).toBe(false);
      expect(validateSpringParams({ mass: 1.0, springConstant: 25.0, dampingCoefficient: -0.5, initialDisplacement: 0.1 }).valid).toBe(false);
      expect(validateSpringParams({ mass: 1.0, springConstant: 25.0, initialDisplacement: NaN }).valid).toBe(false);
    });

    it('verifies maximum possible damping ratio across valid parameter envelope is strictly underdamped', () => {
      // m in [0.2, 3.0], k in [10, 100], b in [0, 1.0]
      // zeta_max = 1 / (2 * sqrt(10 * 0.2)) ≈ 0.3536
      expect(MAX_ENVELOPE_DAMPING_RATIO).toBeCloseTo(0.353553, 5);
      expect(MAX_ENVELOPE_DAMPING_RATIO).toBeLessThan(1.0 / Math.SQRT2); // < 0.7071
      expect(MAX_ENVELOPE_DAMPING_RATIO).toBeLessThan(1.0); // Strictly underdamped
    });
  });

  // ==========================================================================
  // Suite 3: Analytical Kinematic Invariants
  // ==========================================================================
  describe('3. Ideal SHM Kinematic Invariants', () => {
    const params = { ...DEFAULT_SPRING_PARAMS, initialDisplacement: 0.30 };
    const { period, omega0 } = computeSpringNaturalFrequencies(params.mass, params.springConstant);

    it('satisfies initial conditions at t = 0 (x(0) = A, v(0) = 0, a(0) = -ω0²A)', () => {
      const state = computeIdealSpringState(params, 0);
      expect(state.displacement).toBeCloseTo(0.30, 8);
      expect(state.velocity).toBeCloseTo(0.0, 8);
      expect(state.acceleration).toBeCloseTo(-omega0 * omega0 * 0.30, 8);
      expect(state.restoringForce).toBeCloseTo(-params.springConstant * 0.30, 8);
    });

    it('satisfies quarter period t = T/4 (x = 0, v = -v_max, a = 0)', () => {
      const state = computeIdealSpringState(params, period / 4.0);
      expect(state.displacement).toBeCloseTo(0.0, 8);
      expect(state.velocity).toBeCloseTo(-omega0 * 0.30, 8);
      expect(state.acceleration).toBeCloseTo(0.0, 8);
      expect(state.restoringForce).toBeCloseTo(0.0, 8);
    });

    it('satisfies half period t = T/2 (x = -A, v = 0, a = +ω0²A)', () => {
      const state = computeIdealSpringState(params, period / 2.0);
      expect(state.displacement).toBeCloseTo(-0.30, 8);
      expect(state.velocity).toBeCloseTo(0.0, 8);
      expect(state.acceleration).toBeCloseTo(omega0 * omega0 * 0.30, 8);
      expect(state.restoringForce).toBeCloseTo(params.springConstant * 0.30, 8);
    });

    it('satisfies three-quarters period t = 3T/4 (x = 0, v = +v_max, a = 0)', () => {
      const state = computeIdealSpringState(params, (3.0 * period) / 4.0);
      expect(state.displacement).toBeCloseTo(0.0, 8);
      expect(state.velocity).toBeCloseTo(omega0 * 0.30, 8);
      expect(state.acceleration).toBeCloseTo(0.0, 8);
    });

    it('satisfies differential equation invariant: a(t) / x(t) = -ω0² at all points', () => {
      for (let i = 1; i <= 50; i++) {
        const t = (i / 50.0) * period;
        const state = computeIdealSpringState(params, t);
        if (Math.abs(state.displacement) > 1e-4) {
          const ratio = state.acceleration / state.displacement;
          expect(ratio).toBeCloseTo(-omega0 * omega0, 6);
        }
      }
    });
  });

  // ==========================================================================
  // Suite 4: Mechanical Energy Conservation (Undamped)
  // ==========================================================================
  describe('4. Undamped Mechanical Energy Conservation', () => {
    const params = { ...DEFAULT_SPRING_PARAMS, initialDisplacement: 0.30 };
    const { period } = computeSpringNaturalFrequencies(params.mass, params.springConstant);
    const expectedTotalEnergy = 0.5 * params.springConstant * 0.30 * 0.30; // 0.5 * 25 * 0.09 = 1.125 J

    it('conserves total mechanical energy across multiple cycles to within 1e-9 J', () => {
      for (let i = 0; i <= 100; i++) {
        const t = (i / 100.0) * 5.0 * period; // 5 full periods
        const state = computeIdealSpringState(params, t);

        expect(state.kineticEnergy).toBeGreaterThanOrEqual(0);
        expect(state.effectivePotentialEnergy).toBeGreaterThanOrEqual(0);
        expect(state.totalMechanicalEnergy).toBeCloseTo(expectedTotalEnergy, 8);
      }
    });

    it('verifies pure potential energy at extremes and pure kinetic energy at equilibrium', () => {
      const extreme = computeIdealSpringState(params, 0);
      expect(extreme.effectivePotentialEnergy).toBeCloseTo(expectedTotalEnergy, 8);
      expect(extreme.kineticEnergy).toBeCloseTo(0.0, 8);

      const equilibrium = computeIdealSpringState(params, period / 4.0);
      expect(equilibrium.effectivePotentialEnergy).toBeCloseTo(0.0, 8);
      expect(equilibrium.kineticEnergy).toBeCloseTo(expectedTotalEnergy, 8);
    });
  });

  // ==========================================================================
  // Suite 5: Simple Pendulum & Nonlinear Divergence
  // ==========================================================================
  describe('5. Simple Pendulum & Nonlinear Comparison', () => {
    it('verifies small-angle pendulum period T = 2π√(L/g) and distinct mass independence', () => {
      // Test 3 distinct masses: 0.2 kg, 1.0 kg, 4.0 kg
      const p1 = computePendulumFrequencies(1.0, 9.80);
      const expectedT = (2.0 * Math.PI) * Math.sqrt(1.0 / 9.80);
      expect(p1.period).toBeCloseTo(expectedT, 6);

      // Verify formula with different parameter definitions
      const stateM1 = computeSmallAnglePendulumState({ length: 1.0, mass: 0.2, gravity: 9.80, initialAngleRad: 0.1 }, 1.0);
      const stateM2 = computeSmallAnglePendulumState({ length: 1.0, mass: 1.0, gravity: 9.80, initialAngleRad: 0.1 }, 1.0);
      const stateM3 = computeSmallAnglePendulumState({ length: 1.0, mass: 4.0, gravity: 9.80, initialAngleRad: 0.1 }, 1.0);

      // Angular positions and periods must be identical regardless of mass
      expect(stateM1.angleRad).toBeCloseTo(stateM2.angleRad, 10);
      expect(stateM2.angleRad).toBeCloseTo(stateM3.angleRad, 10);
    });

    it('strictly conserves linearized energy E = K + U_approx = 0.5·mgL·θ0² in small-angle model', () => {
      const theta0 = (10.0 * Math.PI) / 180.0;
      const params = { length: 1.0, mass: 1.5, gravity: 9.80, initialAngleRad: theta0 };
      const expectedLinearEnergy = 0.5 * params.mass * params.gravity * params.length * theta0 * theta0;

      for (let t = 0; t <= 4.0; t += 0.1) {
        const state = computeSmallAnglePendulumState(params, t);
        expect(state.totalEnergy).toBeCloseTo(expectedLinearEnergy, 8);
        expect(state.potentialEnergy).toBeCloseTo(state.approximatePotentialEnergy!, 8);
      }
    });

    it('matches exact nonlinear RK4 integration at small angle (θ0 = 5°)', () => {
      const theta0 = (5.0 * Math.PI) / 180.0;
      const params = { length: 1.0, mass: 1.0, gravity: 9.80, initialAngleRad: theta0 };
      const { period: T0 } = computePendulumFrequencies(params.length, params.gravity);

      let state: PendulumState = {
        time: 0,
        angleRad: theta0,
        angleDeg: 5.0,
        angularVelocity: 0,
        angularAcceleration: -(params.gravity / params.length) * Math.sin(theta0),
        linearDisplacement: params.length * theta0,
        linearVelocity: 0,
        restoringTorque: -params.mass * params.gravity * params.length * Math.sin(theta0),
        kineticEnergy: 0,
        potentialEnergy: params.mass * params.gravity * params.length * (1.0 - Math.cos(theta0)),
        totalEnergy: params.mass * params.gravity * params.length * (1.0 - Math.cos(theta0)),
      };

      const dt = 0.001;
      const steps = Math.round(T0 / dt);
      for (let s = 0; s < steps; s++) {
        state = stepNonlinearPendulumRK4(state, params, dt);
      }

      // After exactly 1 small-angle period T0, nonlinear pendulum is within 0.1% of initial angle
      expect(state.angleRad).toBeCloseTo(theta0, 2);
    });

    it('demonstrates nonlinear period elongation at large angle (θ0 = 30°)', () => {
      const theta0 = (30.0 * Math.PI) / 180.0;
      const params = { length: 1.0, mass: 1.0, gravity: 9.80, initialAngleRad: theta0 };
      const { period: T0 } = computePendulumFrequencies(params.length, params.gravity);

      let state: PendulumState = {
        time: 0,
        angleRad: theta0,
        angleDeg: 30.0,
        angularVelocity: 0,
        angularAcceleration: -(params.gravity / params.length) * Math.sin(theta0),
        linearDisplacement: params.length * theta0,
        linearVelocity: 0,
        restoringTorque: -params.mass * params.gravity * params.length * Math.sin(theta0),
        kineticEnergy: 0,
        potentialEnergy: params.mass * params.gravity * params.length * (1.0 - Math.cos(theta0)),
        totalEnergy: params.mass * params.gravity * params.length * (1.0 - Math.cos(theta0)),
      };

      const dt = 0.001;
      const steps = Math.round(T0 / dt);
      for (let s = 0; s < steps; s++) {
        state = stepNonlinearPendulumRK4(state, params, dt);
      }

      // At t = T0, because exact period T_exact > T0 by approx 1.74%, the pendulum has NOT yet finished its cycle:
      expect(state.angleRad).toBeLessThan(theta0);
      expect(state.angleRad).toBeGreaterThan(0.9 * theta0);
    });

    it('conserves energy in nonlinear pendulum RK4 integration', () => {
      const theta0 = (20.0 * Math.PI) / 180.0;
      const params = { length: 1.0, mass: 1.0, gravity: 9.80, initialAngleRad: theta0 };
      const initialEnergy = params.mass * params.gravity * params.length * (1.0 - Math.cos(theta0));

      let state: PendulumState = {
        time: 0,
        angleRad: theta0,
        angleDeg: 20.0,
        angularVelocity: 0,
        angularAcceleration: 0,
        linearDisplacement: params.length * theta0,
        linearVelocity: 0,
        restoringTorque: 0,
        kineticEnergy: 0,
        potentialEnergy: initialEnergy,
        totalEnergy: initialEnergy,
      };

      const dt = 0.002;
      for (let s = 0; s < 1000; s++) {
        state = stepNonlinearPendulumRK4(state, params, dt);
      }

      expect(state.totalEnergy).toBeCloseTo(initialEnergy, 5);
    });
  });

  // ==========================================================================
  // Suite 6: Damped Oscillation (Underdamped, Critical & Overdamped)
  // ==========================================================================
  describe('6. Damped Oscillation Regimes (Exact Solutions)', () => {
    describe('Underdamped Regime (γ < ω0)', () => {
      const params = {
        ...DEFAULT_SPRING_PARAMS,
        dampingCoefficient: 0.40,
        initialDisplacement: 0.30,
      };

      it('verifies initial velocity is exactly zero at release from rest (v(0) = 0)', () => {
        const state0 = computeDampedSpringState(params, 0);
        expect(state0.regime).toBe('underdamped');
        expect(state0.displacement).toBeCloseTo(0.30, 8);
        expect(state0.velocity).toBeCloseTo(0.0, 8);
      });

      it('verifies damped angular frequency ωd < ω0 and damped period Td > T0', () => {
        const damped = computeDampedFrequencies(params.mass, params.springConstant, params.dampingCoefficient);
        expect(damped.regime).toBe('underdamped');
        expect(damped.omegaD).toBeLessThan(damped.omega0);
        expect(damped.periodD).toBeGreaterThan(damped.period0);
      });

      it('verifies envelope decay and amplitude bounds', () => {
        for (let t = 0; t <= 5.0; t += 0.5) {
          const state = computeDampedSpringState(params, t);
          expect(Math.abs(state.displacement)).toBeLessThanOrEqual(state.envelope + 1e-6);
        }
      });

      it('verifies mechanical energy strictly dissipates over time: E(t2) < E(t1)', () => {
        let previousEnergy = 0.5 * params.springConstant * params.initialDisplacement * params.initialDisplacement;

        for (let t = 0.2; t <= 4.0; t += 0.2) {
          const state = computeDampedSpringState(params, t);
          expect(state.totalMechanicalEnergy).toBeLessThan(previousEnergy + 1e-9);
          expect(state.dissipatedEnergy).toBeGreaterThanOrEqual(0);
          previousEnergy = state.totalMechanicalEnergy;
        }
      });
    });

    describe('Critically Damped Regime (γ = ω0)', () => {
      // m = 1.0 kg, k = 25.0 N/m => ω0 = 5.0 rad/s => b_crit = 2mω0 = 10.0 N·s/m
      const params = {
        mass: 1.0,
        springConstant: 25.0,
        dampingCoefficient: 10.0,
        initialDisplacement: 0.30,
      };

      it('verifies critical damping classification and exact rest release (v(0) = 0)', () => {
        const freq = computeDampedFrequencies(params.mass, params.springConstant, params.dampingCoefficient);
        expect(freq.regime).toBe('critically-damped');
        expect(freq.dampingRatio).toBeCloseTo(1.0, 6);

        const state0 = computeDampedSpringState(params, 0);
        expect(state0.regime).toBe('critically-damped');
        expect(state0.displacement).toBeCloseTo(0.30, 8);
        expect(state0.velocity).toBeCloseTo(0.0, 8);
      });

      it('satisfies the differential equation of motion identically: a + 2γv + ω0²x = 0', () => {
        const omega0 = 5.0;
        const gamma = 5.0;

        for (let t = 0.1; t <= 3.0; t += 0.3) {
          const state = computeDampedSpringState(params, t);
          const residual = state.acceleration + 2.0 * gamma * state.velocity + omega0 * omega0 * state.displacement;
          expect(Math.abs(residual)).toBeLessThan(1e-10);
        }
      });

      it('exhibits monotonic return to equilibrium without oscillating', () => {
        for (let t = 0.1; t <= 3.0; t += 0.2) {
          const state = computeDampedSpringState(params, t);
          expect(state.displacement).toBeGreaterThan(0); // Never crosses zero
          expect(state.displacement).toBeLessThan(0.30);
        }
      });
    });

    describe('Overdamped Regime (γ > ω0)', () => {
      // m = 1.0 kg, k = 25.0 N/m, b = 15.0 N·s/m => γ = 7.5 > 5.0
      const params = {
        mass: 1.0,
        springConstant: 25.0,
        dampingCoefficient: 15.0,
        initialDisplacement: 0.30,
      };

      it('verifies overdamped classification and exact rest release (v(0) = 0)', () => {
        const freq = computeDampedFrequencies(params.mass, params.springConstant, params.dampingCoefficient);
        expect(freq.regime).toBe('overdamped');
        expect(freq.dampingRatio).toBeGreaterThan(1.0);

        const state0 = computeDampedSpringState(params, 0);
        expect(state0.regime).toBe('overdamped');
        expect(state0.displacement).toBeCloseTo(0.30, 8);
        expect(state0.velocity).toBeCloseTo(0.0, 8);
      });

      it('satisfies the differential equation of motion identically: a + 2γv + ω0²x = 0', () => {
        const omega0 = 5.0;
        const gamma = 7.5;

        for (let t = 0.1; t <= 3.0; t += 0.3) {
          const state = computeDampedSpringState(params, t);
          const residual = state.acceleration + 2.0 * gamma * state.velocity + omega0 * omega0 * state.displacement;
          expect(Math.abs(residual)).toBeLessThan(1e-10);
        }
      });

      it('remains numerically stable, finite, and non-NaN at long elapsed times and heavy overdamping', () => {
        // m = 1.0 kg, k = 25.0 N/m, b = 30.0 N·s/m (gamma = 15.0 >> omega0 = 5.0)
        const heavyOverdamped = {
          mass: 1.0,
          springConstant: 25.0,
          dampingCoefficient: 30.0,
          initialDisplacement: 0.30,
        };

        const times = [10.0, 50.0, 100.0, 500.0, 1000.0, 10000.0];
        for (const t of times) {
          const state = computeDampedSpringState(heavyOverdamped, t);

          expect(Number.isFinite(state.displacement)).toBe(true);
          expect(Number.isFinite(state.velocity)).toBe(true);
          expect(Number.isFinite(state.acceleration)).toBe(true);
          expect(Number.isNaN(state.displacement)).toBe(false);

          // Asymptotically decays to 0 without blowing up or overflowing
          expect(state.displacement).toBeGreaterThanOrEqual(0);
          expect(state.displacement).toBeLessThan(0.30);
        }
      });
    });
  });

  // ==========================================================================
  // Suite 7: Forced Oscillation & Resonance Verification
  // ==========================================================================
  describe('7. Forced Oscillation & Resonance Verification', () => {
    it('verifies static-load response at zero frequency (Ω = 0 => A = F0 / k)', () => {
      const params = { mass: 1.0, springConstant: 25.0, initialDisplacement: 0, dampingCoefficient: 0.20 };
      const staticAmp = computeSteadyStateAmplitude(params, { driverForce: 5.0, drivingFrequency: 0.0 });
      expect(staticAmp).toBeCloseTo(5.0 / 25.0, 8); // 0.20 m
    });

    it('verifies heavy damping case has maximum response at zero frequency (static load)', () => {
      // b = 8.0 N·s/m => γ = 4.0 s⁻¹ > ω0 / √2 ≈ 3.5355 s⁻¹
      const heavy = { mass: 1.0, springConstant: 25.0, initialDisplacement: 0, dampingCoefficient: 8.0 };
      const peakInfo = computeResonancePeak(heavy, 2.0);
      expect(peakInfo.hasResonancePeak).toBe(false);
      expect(peakInfo.resonantFrequencyRad).toBeNull();
      expect(peakInfo.peakAmplitude).toBeCloseTo(2.0 / 25.0, 6);

      // Verify A(Ω) strictly decreases for Ω > 0
      const a0 = computeSteadyStateAmplitude(heavy, { driverForce: 2.0, drivingFrequency: 0.0 });
      const a1 = computeSteadyStateAmplitude(heavy, { driverForce: 2.0, drivingFrequency: 1.0 });
      const a5 = computeSteadyStateAmplitude(heavy, { driverForce: 2.0, drivingFrequency: 5.0 });
      expect(a0).toBeGreaterThan(a1);
      expect(a1).toBeGreaterThan(a5);
    });

    it('handles zero damping separately with undefined phase at exact resonance', () => {
      const undamped = { mass: 1.0, springConstant: 25.0, initialDisplacement: 0, dampingCoefficient: 0.0 };

      // Off-resonance: finite amplitude
      const offRes = computeSteadyStateAmplitude(undamped, { driverForce: 2.0, drivingFrequency: 3.0 });
      expect(offRes).toBeCloseTo(2.0 / (25.0 - 9.0), 6); // 0.125 m

      // Exact resonance (Ω = ω0 = 5.0): must diverge to Infinity
      const exactRes = computeSteadyStateAmplitude(undamped, { driverForce: 2.0, drivingFrequency: 5.0 });
      expect(exactRes).toBe(Infinity);

      // Phase lag at exact undamped resonance: MUST BE NULL (undefined)
      const phaseAtUndampedRes = computePhaseLag(undamped, 5.0);
      expect(phaseAtUndampedRes).toBeNull();

      // Phase lag below resonance (Ω < ω0): 0 rad
      expect(computePhaseLag(undamped, 3.0)).toBe(0);

      // Phase lag above resonance (Ω > ω0): π rad
      expect(computePhaseLag(undamped, 7.0)).toBe(Math.PI);
    });

    it('calculates 90° phase lag for nonzero damping at natural frequency', () => {
      const damped = { mass: 1.0, springConstant: 25.0, initialDisplacement: 0, dampingCoefficient: 0.4 };
      const resPhase = computePhaseLag(damped, 5.0);
      expect(resPhase).toBeCloseTo(Math.PI / 2.0, 8); // Exact 90°
    });

    it('verifies default forced oscillation preset uses finite damping', () => {
      expect(DEFAULT_FORCED_SPRING_PARAMS.dampingCoefficient).toBeGreaterThan(0);
      expect(DEFAULT_DRIVER_PARAMS.drivingFrequency).not.toBe(5.0); // off-resonance default

      // Verify separate undamped preset
      expect(UNDAMPED_RESONANCE_PRESET.spring.dampingCoefficient).toBe(0.0);
      expect(UNDAMPED_RESONANCE_PRESET.driver.drivingFrequency).toBe(5.0);
    });

    it('verifies resonance curve starts at zero frequency with static deflection', () => {
      const params = { mass: 1.0, springConstant: 25.0, initialDisplacement: 0, dampingCoefficient: 0.20 };
      const curve = computeResonanceCurve(params, 2.0);

      expect(curve[0].drivingFrequencyRad).toBe(0.0);
      expect(curve[0].amplitude).toBeCloseTo(2.0 / 25.0, 6);
      expect(curve[0].phaseLagRad).toBe(0.0);
    });

    it('handles zero driving force (F0 = 0) with zero response amplitude at exact resonance', () => {
      const undamped = { mass: 1.0, springConstant: 25.0, initialDisplacement: 0, dampingCoefficient: 0.0 };

      // F0 = 0 at exact resonance Ω = ω0 = 5.0
      const ampZeroForce = computeSteadyStateAmplitude(undamped, { driverForce: 0.0, drivingFrequency: 5.0 });
      expect(ampZeroForce).toBe(0.0);

      const peakZeroForce = computeResonancePeak(undamped, 0.0);
      expect(peakZeroForce.hasResonancePeak).toBe(false);
      expect(peakZeroForce.peakAmplitude).toBe(0.0);

      // Contrast with non-zero driving force at exact resonance
      const ampNonzeroForce = computeSteadyStateAmplitude(undamped, { driverForce: 2.0, drivingFrequency: 5.0 });
      expect(ampNonzeroForce).toBe(Infinity);

      const peakNonzeroForce = computeResonancePeak(undamped, 2.0);
      expect(peakNonzeroForce.hasResonancePeak).toBe(true);
      expect(peakNonzeroForce.peakAmplitude).toBe(Infinity);
    });

    it('guarantees resonance curve explicitly samples ω0 and marks undamped singularity', () => {
      const undamped = { mass: 1.0, springConstant: 25.0, initialDisplacement: 0, dampingCoefficient: 0.0 };
      const curve = computeResonanceCurve(undamped, 2.0, { steps: 50 }); // steps intentionally coarse

      // The exact natural frequency omega0 = 5.0 must NOT be missed due to step size
      const singularPoint = curve.find(p => p.isSingularity === true);
      expect(singularPoint).toBeDefined();
      expect(singularPoint!.drivingFrequencyRad).toBeCloseTo(5.0, 9);
      expect(singularPoint!.amplitude).toBe(Infinity);
      expect(singularPoint!.phaseLagRad).toBeNull();

      // Points immediately adjacent must be finite
      const index = curve.indexOf(singularPoint!);
      expect(index).toBeGreaterThan(0);
      expect(index).toBeLessThan(curve.length - 1);
      expect(Number.isFinite(curve[index - 1].amplitude)).toBe(true);
      expect(Number.isFinite(curve[index + 1].amplitude)).toBe(true);

      // Damped curve has no singularities
      const dampedCurve = computeResonanceCurve({ ...undamped, dampingCoefficient: 0.2 }, 2.0);
      expect(dampedCurve.some(p => p.isSingularity === true)).toBe(false);
    });

    it('verifies displacement resonance peak frequency is calculated independently from natural frequency', () => {
      // Default parameters: m = 1.0 kg, k = 25.0 N/m, b = 0.20 N·s/m, F0 = 2.0 N
      const params = { mass: 1.0, springConstant: 25.0, initialDisplacement: 0, dampingCoefficient: 0.20 };
      const { omega0 } = computeSpringNaturalFrequencies(params.mass, params.springConstant);
      expect(omega0).toBeCloseTo(5.000, 6);

      const peakInfo = computeResonancePeak(params, 2.0);
      expect(peakInfo.hasResonancePeak).toBe(true);
      expect(peakInfo.resonantFrequencyRad).toBeDefined();

      // omega0 = 5.0, gamma = b/(2m) = 0.10
      // omegaRes = sqrt(omega0^2 - 2*gamma^2) = sqrt(25 - 0.02) = sqrt(24.98) ≈ 4.9979995998 rad/s
      const expectedPeak = Math.sqrt(25.0 - 2.0 * 0.01);
      expect(peakInfo.resonantFrequencyRad!).toBeCloseTo(expectedPeak, 9);
      expect(peakInfo.resonantFrequencyRad!).toBeCloseTo(4.998, 3);
      expect(peakInfo.resonantFrequencyRad!).not.toBe(omega0);
    });

    it('demonstrates persistent beating in undamped forced motion rather than steady state decay', () => {
      // b = 0, F0 = 2.0, Omega = 4.0, omega0 = 5.0
      // Beat frequency = |omega0 - Omega| = 1.0 rad/s => T_beat = 2*pi / 1.0 ≈ 6.283 s
      const params = { mass: 1.0, springConstant: 25.0, dampingCoefficient: 0.0, initialDisplacement: 0.0 };
      const driver = { driverForce: 2.0, drivingFrequency: 4.0 };

      let state: ForcedIntegrationState = {
        time: 0,
        displacement: 0,
        velocity: 0,
        acceleration: 0,
        drivingForce: 2.0,
        externalWork: 0,
        dissipatedEnergy: 0,
        kineticEnergy: 0,
        effectivePotentialEnergy: 0,
        totalMechanicalEnergy: 0,
      };

      const dt = 0.001;
      const steps = Math.round((2.0 * Math.PI) / dt); // one beat period ≈ 6283 steps

      let maxDisplacement = 0;
      for (let s = 0; s < steps; s++) {
        state = stepForcedOscillatorRK4(state, params, driver, dt);
        maxDisplacement = Math.max(maxDisplacement, Math.abs(state.displacement));
      }

      // Theoretical beat envelope maximum: 2 * (F0 / m) / |omega0^2 - Omega^2| = 2 * 2.0 / (25 - 16) = 4 / 9 ≈ 0.444 m
      expect(maxDisplacement).toBeCloseTo(4.0 / 9.0, 2);

      // At end of beat period (t ≈ T_beat), displacement returns near zero
      expect(Math.abs(state.displacement)).toBeLessThan(0.05);

      // Dissipated energy must remain strictly zero
      expect(state.dissipatedEnergy).toBe(0.0);
    });

    it('verifies instantaneous energy balance in forced RK4 simulation', () => {
      const params = { mass: 1.0, springConstant: 25.0, dampingCoefficient: 0.20, initialDisplacement: 0.10 };
      const driver = { driverForce: 2.0, drivingFrequency: 5.0 };

      let state: ForcedIntegrationState = {
        time: 0,
        displacement: 0.10,
        velocity: 0,
        acceleration: 0,
        drivingForce: 2.0,
        externalWork: 0,
        dissipatedEnergy: 0,
        kineticEnergy: 0,
        effectivePotentialEnergy: 0.5 * 25.0 * 0.01,
        totalMechanicalEnergy: 0.5 * 25.0 * 0.01,
      };

      const dt = 0.001;
      const initialTotalEnergy = state.totalMechanicalEnergy;

      for (let s = 0; s < 2000; s++) {
        state = stepForcedOscillatorRK4(state, params, driver, dt);
      }

      const auditedEnergy = initialTotalEnergy + state.externalWork - state.dissipatedEnergy;
      expect(state.totalMechanicalEnergy).toBeCloseTo(auditedEnergy, 5);
    });

    it('converges to theoretical steady-state amplitude after transient decay', () => {
      const params = { mass: 1.0, springConstant: 25.0, dampingCoefficient: 0.5, initialDisplacement: 0.0 };
      const driver = { driverForce: 2.0, drivingFrequency: 4.0 };
      const expectedA = computeSteadyStateAmplitude(params, driver);

      let state: ForcedIntegrationState = {
        time: 0,
        displacement: 0,
        velocity: 0,
        acceleration: 0,
        drivingForce: 2.0,
        externalWork: 0,
        dissipatedEnergy: 0,
        kineticEnergy: 0,
        effectivePotentialEnergy: 0,
        totalMechanicalEnergy: 0,
      };

      const dt = 0.001;
      for (let s = 0; s < 25000; s++) { // 25 seconds
        state = stepForcedOscillatorRK4(state, params, driver, dt);
      }

      let observedMaxA = 0;
      for (let s = 0; s < 2000; s++) {
        state = stepForcedOscillatorRK4(state, params, driver, dt);
        observedMaxA = Math.max(observedMaxA, Math.abs(state.displacement));
      }

      expect(observedMaxA).toBeCloseTo(expectedA, 2);
    });

    it('stops time-domain simulation explicitly when finite apparatus travel limit would be exceeded, preserving physical state without impact fabrication', () => {
      // Under undamped exact resonance, displacement grows linearly as ~0.2*t*sin(5t).
      // At t ≈ 12.2 s, displacement reaches 2.40 m (HORIZONTAL_MAX_TRAVEL).
      const { spring, driver } = UNDAMPED_RESONANCE_PRESET;
      let state: ForcedIntegrationState = {
        time: 0,
        displacement: 0,
        velocity: 0,
        acceleration: 0,
        drivingForce: 2.0,
        externalWork: 0,
        dissipatedEnergy: 0,
        kineticEnergy: 0,
        effectivePotentialEnergy: 0,
        totalMechanicalEnergy: 0,
      };

      const dt = 0.002;
      let limitReachedStep = -1;

      for (let s = 0; s < 10000; s++) { // up to 20 seconds
        const prevState = state;
        state = stepForcedOscillatorRK4(state, spring, driver, dt);
        if (state.apparatusStatus === 'exceeded') {
          limitReachedStep = s;
          // Verify that state matches prevState (the last valid physical state)
          expect(state.time).toBe(prevState.time);
          expect(state.displacement).toBe(prevState.displacement);
          expect(state.velocity).toBe(prevState.velocity);
          expect(state.acceleration).toBe(prevState.acceleration);
          break;
        }
      }

      // Simulation must have detected limit breach and flagged 'exceeded'
      expect(limitReachedStep).toBeGreaterThan(0);
      expect(state.apparatusStatus).toBe('exceeded');

      // 1. The terminal state does NOT violate physical travel limits:
      expect(Math.abs(state.displacement)).toBeLessThanOrEqual(HORIZONTAL_MAX_TRAVEL);
      expect(Math.abs(state.displacement)).toBeCloseTo(HORIZONTAL_MAX_TRAVEL, 1);

      // 2. Terminal velocity is NOT artificially reset to zero (represents terminated mathematical model, not a collision):
      expect(Math.abs(state.velocity)).toBeGreaterThan(0.5);

      // 3. Terminal acceleration is preserved:
      expect(Number.isFinite(state.acceleration)).toBe(true);

      // 4. Exceeded status remains explicit:
      expect(state.apparatusStatus).toBe('exceeded');

      // 5. Subsequent integration calls do not change the terminal state (frozen):
      const frozenTime = state.time;
      const frozenDisplacement = state.displacement;
      const frozenVelocity = state.velocity;
      const frozenAccel = state.acceleration;
      const nextState = stepForcedOscillatorRK4(state, spring, driver, dt);

      expect(nextState.time).toBe(frozenTime);
      expect(nextState.displacement).toBe(frozenDisplacement);
      expect(nextState.velocity).toBe(frozenVelocity);
      expect(nextState.acceleration).toBe(frozenAccel);
      expect(nextState.apparatusStatus).toBe('exceeded');
    });

    it('preserves theoretical mathematical singularity at undamped resonance in frequency response', () => {
      // While finite apparatus stops the time-domain simulation at travelLimit,
      // the analytical frequency-response transfer function maintains strict mathematical rigor:
      const { spring, driver } = UNDAMPED_RESONANCE_PRESET;

      // 1. Steady-state amplitude diverges to Infinity
      const steadyStateA = computeSteadyStateAmplitude(spring, driver);
      expect(steadyStateA).toBe(Infinity);

      // 2. Phase lag is undefined (null) at singularity
      const phase = computePhaseLag(spring, 5.0);
      expect(phase).toBeNull();

      // 3. Resonance curve tags exact resonance point with isSingularity: true
      const curve = computeResonanceCurve(spring, 2.0);
      const singularityPoint = curve.find(p => p.isSingularity);
      expect(singularityPoint).toBeDefined();
      expect(singularityPoint?.drivingFrequencyRad).toBeCloseTo(5.0, 6);
      expect(singularityPoint?.amplitude).toBe(Infinity);
      expect(singularityPoint?.phaseLagRad).toBeNull();
    });
  });

  // ==========================================================================
  // Suite 8: Coordinate Systems & Auto Camera Bounds
  // ==========================================================================
  describe('8. Coordinate Systems & Auto Camera Bounds', () => {
    it('correctly maps downward physical coordinates to upward world coordinates with top-face attachment', () => {
      const transform = transformToWorldCoordinates({
        ceilingWorldY: 2.0,
        naturalLength: 0.40,
        staticElongation: 0.392,
        displacement: 0.20,
        velocity: 1.5,
        acceleration: -5.0,
        restoringForce: -5.0,
        drivingForce: 2.0,
      });

      // Spring length: L(x) = L0 + deltaL + x = 0.40 + 0.392 + 0.20 = 0.992 m
      expect(transform.springLength).toBeCloseTo(0.992, 3);
      // Spring attaches to block top face: Y_attachment = 2.0 - 0.992 = 1.008 m
      expect(transform.worldAttachmentY).toBeCloseTo(1.008, 3);
      expect(transform.worldBlockTopY).toBeCloseTo(1.008, 3);
      // Mass center is offset by half block height (0.16 / 2 = 0.08 m):
      expect(transform.worldPositionY).toBeCloseTo(0.928, 3);
      // Equilibrium mass center: 2.0 - (0.40 + 0.392 + 0.08) = 1.128 m
      expect(transform.worldEquilibriumY).toBeCloseTo(1.128, 3);
      expect(transform.worldBlockBottomY).toBeCloseTo(0.848, 3);
      expect(transform.worldVelocityY).toBe(-1.5);
      expect(transform.worldRestoringForceY).toBe(5.0);
    });

    it('computes automatic camera bounds accommodating small and large elongations', () => {
      const smallBounds = computeAutoCameraBounds(2.0, 0.40, 0.05, 0.10);
      expect(smallBounds.maxY).toBe(2.15);
      expect(smallBounds.minY).toBeLessThan(smallBounds.maxY);

      const largeBounds = computeAutoCameraBounds(2.0, 0.40, 1.50, 0.40);
      expect(largeBounds.viewportHeight).toBeGreaterThan(smallBounds.viewportHeight);
      expect(largeBounds.centerY).toBeLessThan(smallBounds.centerY);
    });

    it('correctly maps horizontal air track physical coordinates to world coordinates', () => {
      // Wall mount at X = -1.5, track elevation at Y = 0.5
      // Default L0_h = 2.50 m, blockWidth = 0.20 m => equilibrium center = -1.5 + 2.50 + 0.10 = 1.10 m
      // displacement x = +0.25 m (stretched right) => block center = 1.10 + 0.25 = 1.35 m
      // spring length = 2.50 + 0.25 = 2.75 m => left face = -1.5 + 2.75 = 1.25 m
      // v = +1.2 m/s (moving right), a = -6.25 m/s² (accelerating left)
      // Restoring force F_s = -k·x = -25 * 0.25 = -6.25 N (points leftward)
      // Driving force F_drive = +2.0 N (points rightward)
      const transform = transformToHorizontalWorldCoordinates({
        wallWorldX: -1.5,
        trackWorldY: 0.5,
        naturalLength: HORIZONTAL_NATURAL_LENGTH,
        displacement: 0.25,
        velocity: 1.2,
        acceleration: -6.25,
        restoringForce: -6.25,
        drivingForce: 2.0,
      });

      expect(transform.worldWallX).toBe(-1.5);
      expect(transform.worldPositionY).toBe(0.5);
      expect(transform.worldEquilibriumX).toBeCloseTo(1.10, 4); // -1.5 + 2.50 + 0.10 (equilibrium center)
      expect(transform.worldPositionX).toBeCloseTo(1.35, 4); // 1.10 + 0.25 (mass center)
      expect(transform.worldAttachmentX).toBeCloseTo(1.25, 4); // -1.5 + 2.75 (spring attachment / left face)
      expect(transform.worldBlockLeftX).toBeCloseTo(1.25, 4);
      expect(transform.worldBlockRightX).toBeCloseTo(1.45, 4); // 1.25 + 0.20
      expect(transform.springLength).toBeCloseTo(2.75, 4); // 2.50 + 0.25
      expect(transform.worldVelocityX).toBe(1.2);
      expect(transform.worldAccelerationX).toBe(-6.25);
      expect(transform.worldRestoringForceX).toBe(-6.25); // points left (towards wall)
      expect(transform.worldDrivingForceX).toBe(2.0); // points right
    });

    it('computes automatic camera bounds framing the full guide rail and oscillation excursion', () => {
      // Guide rail extends 6.00 m from wall at wallWorldX = -1.0
      // Physical apparatus span: minX = -1.25, maxX = 5.15 (rail end 5.00 + 0.15 buffer)
      const bounds = computeHorizontalAutoCameraBounds(-1.0, 0.0, HORIZONTAL_NATURAL_LENGTH, 2.0, HORIZONTAL_RAIL_LENGTH);
      expect(bounds.minX).toBe(-1.25); // wallWorldX - 0.25
      expect(bounds.maxX).toBe(5.15); // wallWorldX + 6.00 + 0.15
      expect(bounds.viewportWidth).toBeCloseTo((5.15 - (-1.25)) * 1.15, 4); // 6.40 * 1.15 = 7.36
      expect(bounds.centerX).toBeCloseTo(1.95, 4);
      expect(bounds.centerY).toBe(0.0);
      expect(bounds.cameraMinX).toBeCloseTo(-1.73, 4);
      expect(bounds.cameraMaxX).toBeCloseTo(5.63, 4);
      expect(bounds.paddingX).toBeCloseTo(0.48, 4);
    });

    it('verifies that the complete horizontal apparatus and mass at both displacement extremes fit inside camera bounds', () => {
      const wallWorldX = 0.0;
      const trackWorldY = 0.0;
      const bounds = computeHorizontalAutoCameraBounds(
        wallWorldX,
        trackWorldY,
        HORIZONTAL_NATURAL_LENGTH,
        2.0,
        HORIZONTAL_RAIL_LENGTH
      );

      // 1. Wall anchor and left bracket
      expect(bounds.minX).toBe(-0.25); // wall bracket left edge
      expect(bounds.cameraMinX).toBeLessThan(bounds.minX); // camera covers beyond left bracket
      expect(bounds.minX - bounds.cameraMinX).toBeCloseTo(bounds.paddingX, 4);

      // 2. Guide rail structure
      const railStart = wallWorldX;
      const railEnd = wallWorldX + HORIZONTAL_RAIL_LENGTH; // 6.00 m
      expect(railStart).toBeGreaterThanOrEqual(bounds.minX);
      expect(railEnd).toBeLessThanOrEqual(bounds.maxX);
      expect(bounds.cameraMaxX).toBeGreaterThan(railEnd); // camera covers beyond rail end
      expect(bounds.cameraMaxX - bounds.maxX).toBeCloseTo(bounds.paddingX, 4);

      // 3. Equilibrium position
      const xEq = wallWorldX + HORIZONTAL_NATURAL_LENGTH + HORIZONTAL_BLOCK_WIDTH / 2.0; // 2.60 m
      expect(xEq).toBe(2.60);
      expect(xEq).toBeGreaterThan(bounds.cameraMinX);
      expect(xEq).toBeLessThan(bounds.cameraMaxX);

      // 4. Extreme compression: mass at solid height x = -2.40 m
      // Spring length is 2.50 - 2.40 = 0.10 m. Block left face is at 0.10 m, center at 0.20 m, right edge at 0.30 m
      const xMinDisplacement = -HORIZONTAL_MAX_COMPRESSION; // -2.40 m
      const minMassTransform = transformToHorizontalWorldCoordinates({
        wallWorldX,
        trackWorldY,
        naturalLength: HORIZONTAL_NATURAL_LENGTH,
        displacement: xMinDisplacement,
        velocity: 0,
        acceleration: 0,
        restoringForce: 25.0 * 2.40,
      });
      expect(minMassTransform.springLength).toBeCloseTo(0.10, 4);
      expect(minMassTransform.worldBlockLeftX).toBeCloseTo(0.10, 4); // does not touch wall at 0.00 m!
      expect(minMassTransform.worldPositionX).toBeCloseTo(0.20, 4);
      expect(minMassTransform.worldBlockLeftX).toBeGreaterThan(bounds.cameraMinX); // fits with 0.83 m margin!

      // 5. Extreme extension: mass at max operating length x = +3.00 m
      // Spring length is 2.50 + 3.00 = 5.50 m. Block left face is at 5.50 m, center at 5.60 m, right edge at 5.70 m
      const xMaxDisplacement = HORIZONTAL_MAX_EXTENSION; // +3.00 m
      const maxMassTransform = transformToHorizontalWorldCoordinates({
        wallWorldX,
        trackWorldY,
        naturalLength: HORIZONTAL_NATURAL_LENGTH,
        displacement: xMaxDisplacement,
        velocity: 0,
        acceleration: 0,
        restoringForce: -25.0 * 3.00,
      });
      expect(maxMassTransform.springLength).toBeCloseTo(5.50, 4);
      expect(maxMassTransform.worldBlockRightX).toBeCloseTo(5.70, 4); // on rail (5.70 m < 6.00 m)!
      expect(maxMassTransform.worldBlockRightX).toBeLessThan(bounds.cameraMaxX); // fits with 0.93 m margin!

      // 6. Padding verification: exact 7.5% padding on each side (total 15% padding)
      const physicalSpan = bounds.maxX - bounds.minX; // 6.40 m
      expect(physicalSpan).toBeCloseTo(6.40, 4);
      expect(bounds.paddingX).toBeCloseTo(physicalSpan * 0.075, 4); // 0.48 m
      expect(bounds.viewportWidth).toBeCloseTo(physicalSpan * 1.15, 4); // 7.36 m
      expect(bounds.cameraMaxX - bounds.cameraMinX).toBeCloseTo(bounds.viewportWidth, 4);
    });

    it('verifies horizontal spring attachment reference and mass block geometry at equilibrium and extremes', () => {
      const wallWorldX = 0.0;
      const trackWorldY = 0.0;

      // 1. Equilibrium (x = 0):
      const eqTransform = transformToHorizontalWorldCoordinates({
        wallWorldX,
        trackWorldY,
        naturalLength: HORIZONTAL_NATURAL_LENGTH, // 2.50 m
        displacement: 0.0,
        velocity: 0.0,
        acceleration: 0.0,
        restoringForce: 0.0,
      });

      // Item 1: Equilibrium spring length is exactly 2.50 m measured to the block's left attachment point:
      expect(eqTransform.springLength).toBe(2.50);
      expect(eqTransform.worldAttachmentX).toBe(2.50); // X_wall + 2.50
      expect(eqTransform.worldBlockLeftX).toBe(2.50);

      // Item 2: The equilibrium mass centre is 2.60 m:
      expect(eqTransform.worldPositionX).toBe(2.60); // 2.50 + w_block / 2 = 2.60 m
      expect(eqTransform.worldEquilibriumX).toBe(2.60);
      expect(eqTransform.worldBlockRightX).toBe(2.70); // 2.60 + 0.10 = 2.70 m

      // 2. Maximum compression (x = -2.40 m):
      const compTransform = transformToHorizontalWorldCoordinates({
        wallWorldX,
        trackWorldY,
        naturalLength: HORIZONTAL_NATURAL_LENGTH,
        displacement: -HORIZONTAL_MAX_COMPRESSION, // -2.40 m
        velocity: 1.5,
        acceleration: 60.0,
        restoringForce: 25.0 * 2.40, // +60 N (opposes displacement, points rightward away from wall)
      });

      // Item 3: At maximum compression, spring length is 0.10 m and block does not touch the wall bracket:
      expect(compTransform.springLength).toBeCloseTo(0.10, 6); // L_solid = 0.10 m
      expect(compTransform.worldAttachmentX).toBeCloseTo(0.10, 6); // attaches at left face
      expect(compTransform.worldBlockLeftX).toBeCloseTo(0.10, 6); // left face of block is at 0.10 m
      expect(compTransform.worldPositionX).toBeCloseTo(0.20, 6); // mass center is at 0.20 m
      expect(compTransform.worldBlockRightX).toBeCloseTo(0.30, 6); // right face is at 0.30 m
      expect(compTransform.worldBlockLeftX).toBeGreaterThan(wallWorldX); // DOES NOT touch wall (0.10 m > 0.00 m)
      expect(compTransform.worldBlockLeftX - wallWorldX).toBeCloseTo(SPRING_SOLID_HEIGHT, 6);

      // 3. Maximum extension (x = +3.00 m):
      const extTransform = transformToHorizontalWorldCoordinates({
        wallWorldX,
        trackWorldY,
        naturalLength: HORIZONTAL_NATURAL_LENGTH,
        displacement: HORIZONTAL_MAX_EXTENSION, // +3.00 m
        velocity: -1.5,
        acceleration: -75.0,
        restoringForce: -25.0 * 3.00, // -75 N (opposes displacement, points leftward towards wall)
      });

      // Item 4: At maximum extension, spring length is 5.50 m and block remains on the rail:
      expect(extTransform.springLength).toBeCloseTo(5.50, 6); // L_max_op = 5.50 m
      expect(extTransform.worldAttachmentX).toBeCloseTo(5.50, 6);
      expect(extTransform.worldBlockLeftX).toBeCloseTo(5.50, 6);
      expect(extTransform.worldPositionX).toBeCloseTo(5.60, 6); // mass center at 5.60 m
      expect(extTransform.worldBlockRightX).toBeCloseTo(5.70, 6); // right face at 5.70 m
      const railEnd = wallWorldX + HORIZONTAL_RAIL_LENGTH; // 6.00 m
      expect(extTransform.worldBlockRightX).toBeLessThan(railEnd); // remains on rail (5.70 m < 6.00 m)
      expect(railEnd - extTransform.worldBlockRightX).toBeCloseTo(0.30, 6); // 0.30 m clearance before rail end

      // Item 5: Horizontal force vectors and equations are unchanged:
      expect(compTransform.worldRestoringForceX).toBeCloseTo(60.0, 6); // points right (+X) when compressed
      expect(extTransform.worldRestoringForceX).toBeCloseTo(-75.0, 6); // points left (-X) when extended

      // Item 6: Camera bounds contain the complete corrected apparatus at both extremes:
      const bounds = computeHorizontalAutoCameraBounds(wallWorldX, trackWorldY, HORIZONTAL_NATURAL_LENGTH, 2.0);
      expect(compTransform.worldBlockLeftX).toBeGreaterThan(bounds.cameraMinX);
      expect(extTransform.worldBlockRightX).toBeLessThan(bounds.cameraMaxX);
      expect(bounds.cameraMinX).toBeLessThan(bounds.minX);
      expect(bounds.cameraMaxX).toBeGreaterThan(bounds.maxX);
    });
  });
});
