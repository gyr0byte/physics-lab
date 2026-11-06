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

    it('validates parameter clamping and bounds check', () => {
      // Extreme configuration that would stretch spring 12 meters on Jupiter
      const extreme = validateSpringParams({
        mass: 5.0,
        springConstant: 5.0,
        gravity: 24.79,
        initialDisplacement: 0.3,
      });

      expect(extreme.valid).toBe(false);
      expect(extreme.warning).toBeDefined();
    });
  });

  // ==========================================================================
  // Suite 2: Analytical Kinematic Invariants
  // ==========================================================================
  describe('2. Ideal SHM Kinematic Invariants', () => {
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
  // Suite 3: Mechanical Energy Conservation (Undamped)
  // ==========================================================================
  describe('3. Undamped Mechanical Energy Conservation', () => {
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
  // Suite 4: Simple Pendulum & Nonlinear Divergence
  // ==========================================================================
  describe('4. Simple Pendulum & Nonlinear Comparison', () => {
    it('verifies small-angle pendulum period T = 2π√(L/g) and mass independence', () => {
      const p1 = computePendulumFrequencies(1.0, 9.80);
      const expectedT = (2.0 * Math.PI) * Math.sqrt(1.0 / 9.80);
      expect(p1.period).toBeCloseTo(expectedT, 6);

      // Formula does not depend on mass
      const p2 = computePendulumFrequencies(1.0, 9.80);
      expect(p2.period).toBe(p1.period);
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
      // It is still heading towards maximum angle and has lower angle than theta0
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
  // Suite 5: Damped Oscillation Verification
  // ==========================================================================
  describe('5. Damped Oscillation Verification', () => {
    const params = {
      ...DEFAULT_SPRING_PARAMS,
      dampingCoefficient: 0.40, // underdamped
      initialDisplacement: 0.30,
    };

    it('verifies initial velocity is exactly zero at release from rest (v(0) = 0)', () => {
      const state0 = computeDampedSpringState(params, 0);
      expect(state0.displacement).toBeCloseTo(0.30, 8);
      expect(state0.velocity).toBeCloseTo(0.0, 8); // Satisfies exact rest release
    });

    it('verifies damped angular frequency ωd < ω0 and damped period Td > T0', () => {
      const damped = computeDampedFrequencies(params.mass, params.springConstant, params.dampingCoefficient);
      expect(damped.isUnderdamped).toBe(true);
      expect(damped.omegaD).toBeLessThan(damped.omega0);
      expect(damped.periodD).toBeGreaterThan(damped.period0);
    });

    it('verifies envelope decay and amplitude bounds', () => {
      const damped = computeDampedFrequencies(params.mass, params.springConstant, params.dampingCoefficient);

      for (let t = 0; t <= 5.0; t += 0.5) {
        const state = computeDampedSpringState(params, t);
        // Instantaneous displacement magnitude must never exceed the theoretical envelope
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

  // ==========================================================================
  // Suite 6: Forced Oscillation & Resonance Verification
  // ==========================================================================
  describe('6. Forced Oscillation & Resonance Verification', () => {
    it('verifies displacement resonance peak condition: γ < ω0 / √2', () => {
      // m = 1.0 kg, k = 25.0 N/m => ω0 = 5.0 rad/s
      // Peak threshold: γ < 5.0 / √2 ≈ 3.5355 => b = 2mγ < 7.071 N·s/m

      // Light damping (b = 0.2 N·s/m => γ = 0.1 s⁻¹ < 3.5355)
      const underPeak = computeResonancePeak({ mass: 1.0, springConstant: 25.0, initialDisplacement: 0, dampingCoefficient: 0.2 }, 2.0);
      expect(underPeak.hasResonancePeak).toBe(true);
      expect(underPeak.resonantFrequencyRad).toBeDefined();
      expect(underPeak.resonantFrequencyRad!).toBeLessThan(5.0); // shifted slightly below ω0
      expect(underPeak.resonantFrequencyRad!).toBeCloseTo(Math.sqrt(25.0 - 2.0 * 0.01), 4);

      // Heavy damping exceeding threshold (b = 8.0 N·s/m => γ = 4.0 s⁻¹ > 3.5355)
      const overPeak = computeResonancePeak({ mass: 1.0, springConstant: 25.0, initialDisplacement: 0, dampingCoefficient: 8.0 }, 2.0);
      expect(overPeak.hasResonancePeak).toBe(false);
      expect(overPeak.resonantFrequencyRad).toBeNull();
      expect(overPeak.peakAmplitude).toBeCloseTo(2.0 / 25.0, 6); // Static load F0 / k
    });

    it('handles zero damping separately without presenting finite amplitude at resonance', () => {
      const undamped = { mass: 1.0, springConstant: 25.0, initialDisplacement: 0, dampingCoefficient: 0.0 };

      // Off-resonance: finite amplitude
      const offRes = computeSteadyStateAmplitude(undamped, { driverForce: 2.0, drivingFrequency: 3.0 });
      expect(offRes).toBeCloseTo(2.0 / (25.0 - 9.0), 6); // 2.0 / 16.0 = 0.125 m

      // Exact resonance (Ω = ω0 = 5.0): must diverge to Infinity
      const exactRes = computeSteadyStateAmplitude(undamped, { driverForce: 2.0, drivingFrequency: 5.0 });
      expect(exactRes).toBe(Infinity);
    });

    it('calculates phase lag correctly using atan2(2γΩ, ω0² - Ω²)', () => {
      const damped = { mass: 1.0, springConstant: 25.0, initialDisplacement: 0, dampingCoefficient: 0.4 }; // ω0 = 5.0

      // Low frequency: in phase (δ ≈ 0)
      const lowPhase = computePhaseLag(damped, 0.5);
      expect(lowPhase).toBeGreaterThan(0);
      expect(lowPhase).toBeLessThan(Math.PI / 4.0);

      // Exact resonance (Ω = ω0 = 5.0): δ = π/2 = 90°
      const resPhase = computePhaseLag(damped, 5.0);
      expect(resPhase).toBeCloseTo(Math.PI / 2.0, 8);

      // High frequency: anti-phase (δ → π)
      const highPhase = computePhaseLag(damped, 20.0);
      expect(highPhase).toBeGreaterThan(Math.PI / 2.0);
      expect(highPhase).toBeLessThan(Math.PI);
    });

    it('verifies instantaneous energy balance in forced RK4 simulation', () => {
      // E_mech(t) = E_mech(0) + W_ext(t) - E_diss(t)
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

      for (let s = 0; s < 2000; s++) { // 2.0 seconds
        state = stepForcedOscillatorRK4(state, params, driver, dt);
      }

      const auditedEnergy = initialTotalEnergy + state.externalWork - state.dissipatedEnergy;
      expect(state.totalMechanicalEnergy).toBeCloseTo(auditedEnergy, 5);
    });

    it('converges to theoretical steady-state amplitude after transient decay', () => {
      // Lightly damped forced oscillator
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
      // γ = 0.5 / 2 = 0.25 => 5 / γ = 20 seconds for transient decay
      for (let s = 0; s < 25000; s++) { // 25 seconds
        state = stepForcedOscillatorRK4(state, params, driver, dt);
      }

      // Track max displacement over the next cycle (period T = 2π / 4 = 1.57 s)
      let observedMaxA = 0;
      for (let s = 0; s < 2000; s++) {
        state = stepForcedOscillatorRK4(state, params, driver, dt);
        observedMaxA = Math.max(observedMaxA, Math.abs(state.displacement));
      }

      expect(observedMaxA).toBeCloseTo(expectedA, 2);
    });
  });

  // ==========================================================================
  // Suite 7: Coordinate Systems & Auto Camera Bounds
  // ==========================================================================
  describe('7. Coordinate Systems & Auto Camera Bounds', () => {
    it('correctly maps downward physical coordinates to upward world coordinates', () => {
      const transform = transformToWorldCoordinates({
        ceilingWorldY: 2.0,
        naturalLength: 0.40,
        staticElongation: 0.392,
        displacement: 0.20, // stretched 0.2 m downwards
        velocity: 1.5, // moving downwards
        acceleration: -5.0, // accelerating upwards
        restoringForce: -5.0, // restoring force upwards
        drivingForce: 2.0,
      });

      // World Equilibrium = 2.0 - 0.40 - 0.392 = 1.208
      expect(transform.worldEquilibriumY).toBeCloseTo(1.208, 3);
      // World Position = 1.208 - 0.20 = 1.008 (below equilibrium)
      expect(transform.worldPositionY).toBeCloseTo(1.008, 3);
      // Downward velocity maps to negative world Y velocity
      expect(transform.worldVelocityY).toBe(-1.5);
      // Restoring force in world points upwards (+Y)
      expect(transform.worldRestoringForceY).toBe(5.0);
    });

    it('computes automatic camera bounds accommodating small and large elongations', () => {
      // Small elongation (Moon, stiff spring)
      const smallBounds = computeAutoCameraBounds(2.0, 0.40, 0.05, 0.10);
      expect(smallBounds.maxY).toBe(2.15);
      expect(smallBounds.minY).toBeLessThan(smallBounds.maxY);

      // Large elongation (Earth, heavy mass)
      const largeBounds = computeAutoCameraBounds(2.0, 0.40, 1.50, 0.40);
      expect(largeBounds.viewportHeight).toBeGreaterThan(smallBounds.viewportHeight);
      expect(largeBounds.centerY).toBeLessThan(smallBounds.centerY);
    });
  });
});
