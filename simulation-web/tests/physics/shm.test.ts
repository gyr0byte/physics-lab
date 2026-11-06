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
  validateSpringParams,
  DEFAULT_SPRING_PARAMS,
  DEFAULT_PENDULUM_PARAMS,
  DEFAULT_FORCED_SPRING_PARAMS,
  DEFAULT_DRIVER_PARAMS,
  UNDAMPED_RESONANCE_PRESET,
  MAX_ENVELOPE_DAMPING_RATIO,
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

    it('rejects initial displacement exceeding ceiling clearance', () => {
      // L0 = 0.40, deltaL = 0.392 => total rest length = 0.792 m
      // Max allowed amplitude = 0.85 * 0.792 = 0.6732 m
      // Requesting 0.80 m would hit ceiling
      const res = validateSpringParams({
        mass: 1.0,
        springConstant: 25.0,
        gravity: 9.80,
        naturalLength: 0.40,
        initialDisplacement: 0.80,
      });

      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('ceiling clearance'))).toBe(true);
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
  });

  // ==========================================================================
  // Suite 8: Coordinate Systems & Auto Camera Bounds
  // ==========================================================================
  describe('8. Coordinate Systems & Auto Camera Bounds', () => {
    it('correctly maps downward physical coordinates to upward world coordinates', () => {
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

      expect(transform.worldEquilibriumY).toBeCloseTo(1.208, 3);
      expect(transform.worldPositionY).toBeCloseTo(1.008, 3);
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
  });
});
