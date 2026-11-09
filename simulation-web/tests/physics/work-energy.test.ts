import { describe, it, expect } from 'vitest';
import {
  WORK_ENERGY_CONSTANTS,
  DEFAULT_WORK_ENERGY_PARAMS,
  WORK_ENERGY_PARAM_RANGES,
  validateWorkEnergyParams,
  computeSpringCompression,
  computeSpringForce,
  computeWorkEnergyForces,
  computeWorkEnergyLedger,
  computeWorkBreakdown,
  computeWorkEnergyPower,
  sampleForceDisplacementCurve,
  createInitialWorkEnergyState,
  stepWorkEnergy,
  WorkEnergyParams,
  WorkEnergyState,
} from '../../src/physics/WorkEnergyPhysics';

describe('Work, Energy & Power Physics Engine (Grade 11, Chapter 5)', () => {
  // --------------------------------------------------------------------------
  // 1. Gravity component on an incline
  // --------------------------------------------------------------------------
  describe('1. Gravity component on an incline', () => {
    it('calculates downhill gravity component F_g = m * g * sin(theta)', () => {
      const params: WorkEnergyParams = {
        ...DEFAULT_WORK_ENERGY_PARAMS,
        mass: 2.0,
        inclineAngleDeg: 30.0,
        gravity: 9.8,
      };
      const forces = computeWorkEnergyForces(params, 0, 1.0);
      const expectedFg = 2.0 * 9.8 * Math.sin((30.0 * Math.PI) / 180); // 9.8 N
      expect(forces.gravityParallel).toBeCloseTo(expectedFg, 6);
      expect(forces.gravityParallel).toBeCloseTo(9.8, 4);
    });

    it('scales linearly with mass and sinusoidally with incline angle', () => {
      const p1: WorkEnergyParams = { ...DEFAULT_WORK_ENERGY_PARAMS, mass: 1.0, inclineAngleDeg: 45.0 };
      const p2: WorkEnergyParams = { ...DEFAULT_WORK_ENERGY_PARAMS, mass: 4.0, inclineAngleDeg: 45.0 };
      const f1 = computeWorkEnergyForces(p1, 0, 0);
      const f2 = computeWorkEnergyForces(p2, 0, 0);
      expect(f2.gravityParallel).toBeCloseTo(4 * f1.gravityParallel, 6);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Normal force
  // --------------------------------------------------------------------------
  describe('2. Normal force', () => {
    it('calculates normal force perpendicular to incline N = m * g * cos(theta)', () => {
      const params: WorkEnergyParams = {
        ...DEFAULT_WORK_ENERGY_PARAMS,
        mass: 3.0,
        inclineAngleDeg: 60.0, // test geometry with 60 deg
        gravity: 9.8,
      };
      const forces = computeWorkEnergyForces(params, 0, 0);
      const expectedN = 3.0 * 9.8 * Math.cos((60.0 * Math.PI) / 180); // 14.7 N
      expect(forces.normalReaction).toBeCloseTo(expectedN, 6);
      expect(forces.normalReaction).toBeCloseTo(14.7, 4);
    });

    it('decreases as incline angle becomes steeper', () => {
      const p10: WorkEnergyParams = { ...DEFAULT_WORK_ENERGY_PARAMS, inclineAngleDeg: 10.0 };
      const p45: WorkEnergyParams = { ...DEFAULT_WORK_ENERGY_PARAMS, inclineAngleDeg: 45.0 };
      const f10 = computeWorkEnergyForces(p10, 0, 0);
      const f45 = computeWorkEnergyForces(p45, 0, 0);
      expect(f10.normalReaction).toBeGreaterThan(f45.normalReaction);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Spring force before and after engagement
  // --------------------------------------------------------------------------
  describe('3. Spring force before and after engagement', () => {
    it('produces zero compression and zero spring force prior to contact (s < 3.50 m)', () => {
      expect(computeSpringCompression(0.0)).toBe(0);
      expect(computeSpringCompression(2.0)).toBe(0);
      expect(computeSpringCompression(3.499)).toBe(0);

      expect(computeSpringForce(computeSpringCompression(2.0), 40.0)).toBe(0);
      expect(computeSpringForce(computeSpringCompression(3.499), 40.0)).toBe(0);

      const forces = computeWorkEnergyForces(DEFAULT_WORK_ENERGY_PARAMS, 2.50, 1.0);
      expect(forces.springForce).toBe(0);
    });

    it('produces zero force at the exact contact boundary s_c = 3.50 m', () => {
      expect(computeSpringCompression(WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS)).toBe(0);
      expect(computeSpringForce(0, 40.0)).toBe(0);
    });

    it('produces linear restoring force directed uphill once engaged (s > 3.50 m)', () => {
      const s = 4.00; // 0.50 m past contact
      const xs = computeSpringCompression(s);
      expect(xs).toBeCloseTo(0.50, 6);

      const Fs = computeSpringForce(xs, 40.0);
      expect(Fs).toBeCloseTo(-20.0, 6); // -40 * 0.50 = -20 N

      const forces = computeWorkEnergyForces(DEFAULT_WORK_ENERGY_PARAMS, s, 1.0);
      expect(forces.springForce).toBeCloseTo(-20.0, 6);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Spring compression limits
  // --------------------------------------------------------------------------
  describe('4. Spring compression limits', () => {
    it('reaches maximum allowable compression of 1.40 m at lower boundary s = 4.90 m', () => {
      const sMax = WORK_ENERGY_CONSTANTS.LOWER_TRAVEL_LIMIT; // 4.90 m
      const xs = computeSpringCompression(sMax);
      expect(xs).toBeCloseTo(WORK_ENERGY_CONSTANTS.MAX_SPRING_COMPRESSION, 6);
      expect(xs).toBeCloseTo(1.40, 6);

      // Remaining spring length equals solid height 0.10 m
      const remainingLength = WORK_ENERGY_CONSTANTS.SPRING_NATURAL_LENGTH - xs;
      expect(remainingLength).toBeCloseTo(WORK_ENERGY_CONSTANTS.SPRING_SOLID_HEIGHT, 6);
      expect(remainingLength).toBeCloseTo(0.10, 6);
    });

    it('flags displacement beyond 4.90 m as exceeding solid height', () => {
      expect(4.91 > WORK_ENERGY_CONSTANTS.LOWER_TRAVEL_LIMIT).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Work done by gravity
  // --------------------------------------------------------------------------
  describe('5. Work done by gravity', () => {
    it('calculates work done by gravity as W_g = m * g * sin(theta) * s', () => {
      const params: WorkEnergyParams = {
        ...DEFAULT_WORK_ENERGY_PARAMS,
        mass: 2.0,
        inclineAngleDeg: 30.0,
        gravity: 9.8,
      };
      const state: WorkEnergyState = {
        time: 1.0,
        displacement: 2.0,
        velocity: 3.0,
        acceleration: 0,
        thermalEnergy: 0,
        status: 'active',
      };
      const work = computeWorkBreakdown(params, state);
      const expectedWg = 2.0 * 9.8 * Math.sin((30.0 * Math.PI) / 180) * 2.0; // 19.6 J
      expect(work.workGravity).toBeCloseTo(expectedWg, 6);
      expect(work.workGravity).toBeCloseTo(19.6, 4);
    });

    it('is positive when moving downhill and zero at initial release position', () => {
      const work0 = computeWorkBreakdown(DEFAULT_WORK_ENERGY_PARAMS, {
        time: 0,
        displacement: 0,
        velocity: 0,
        acceleration: 0,
        thermalEnergy: 0,
        status: 'active',
      });
      expect(work0.workGravity).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Variable spring-force work
  // --------------------------------------------------------------------------
  describe('6. Variable spring-force work', () => {
    it('calculates work done by variable spring as W_s = -0.5 * k * x_s^2', () => {
      const params: WorkEnergyParams = {
        ...DEFAULT_WORK_ENERGY_PARAMS,
        springConstant: 40.0,
      };
      const state: WorkEnergyState = {
        time: 1.0,
        displacement: 4.10, // xs = 4.10 - 3.50 = 0.60 m
        velocity: 1.0,
        acceleration: 0,
        thermalEnergy: 0,
        status: 'active',
      };
      const work = computeWorkBreakdown(params, state);
      const expectedWs = -0.5 * 40.0 * 0.60 * 0.60; // -7.2 J
      expect(work.workSpring).toBeCloseTo(expectedWs, 6);
      expect(work.workSpring).toBeCloseTo(-7.2, 4);
    });

    it('equals negative of elastic potential energy W_s = -U_s', () => {
      const state: WorkEnergyState = {
        time: 1.0,
        displacement: 4.00,
        velocity: 0.5,
        acceleration: 0,
        thermalEnergy: 0,
        status: 'active',
      };
      const work = computeWorkBreakdown(DEFAULT_WORK_ENERGY_PARAMS, state);
      const energy = computeWorkEnergyLedger(DEFAULT_WORK_ENERGY_PARAMS, state);
      expect(work.workSpring).toBeCloseTo(-energy.elasticPE, 8);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Work-energy theorem
  // --------------------------------------------------------------------------
  describe('7. Work-energy theorem', () => {
    it('strictly satisfies delta K = W_g + W_s + W_f across integrated trajectory', () => {
      const params: WorkEnergyParams = {
        ...DEFAULT_WORK_ENERGY_PARAMS,
        mass: 2.0,
        inclineAngleDeg: 25.0,
        kineticFriction: 0.05,
        staticFriction: 0.08,
        springConstant: 40.0,
      };

      let state = createInitialWorkEnergyState(params);
      const dt = 0.016; // ~60 Hz frame
      const totalSteps = 60; // 0.96 seconds of motion

      for (let i = 0; i < totalSteps; i++) {
        state = stepWorkEnergy(state, params, dt);
        const work = computeWorkBreakdown(params, state);
        expect(work.workEnergyTheoremError).toBeLessThan(1e-4);
      }
    });

    it('confirms W_net matches delta K at arbitrary states', () => {
      const state: WorkEnergyState = {
        time: 0.8,
        displacement: 3.8, // in spring contact
        velocity: 2.5,
        acceleration: -3.0,
        thermalEnergy: 1.25,
        status: 'active',
      };
      const work = computeWorkBreakdown(DEFAULT_WORK_ENERGY_PARAMS, state);
      expect(work.workNet).toBeCloseTo(work.workGravity + work.workSpring + work.workFriction, 8);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Frictionless mechanical-energy conservation
  // --------------------------------------------------------------------------
  describe('8. Frictionless mechanical-energy conservation', () => {
    it('conserves total mechanical energy K + U_g + U_s = E_0 over multiple full rebound cycles', () => {
      const params: WorkEnergyParams = {
        ...DEFAULT_WORK_ENERGY_PARAMS,
        mass: 2.0,
        inclineAngleDeg: 20.0,
        kineticFriction: 0.0,
        staticFriction: 0.0,
        springConstant: 50.0,
      };

      let state = createInitialWorkEnergyState(params);
      const initialEnergy = computeWorkEnergyLedger(params, state).initialEnergy;
      expect(initialEnergy).toBeGreaterThan(0);

      const dt = 0.01;
      const totalDuration = 3.0; // 3 seconds, multiple bounces
      const steps = Math.floor(totalDuration / dt);

      let maxError = 0;

      for (let i = 0; i < steps; i++) {
        state = stepWorkEnergy(state, params, dt);
        if (state.status === 'exceeded') break;

        const ledger = computeWorkEnergyLedger(params, state);
        maxError = Math.max(maxError, ledger.energyConservationError);

        // Relative error must be under 0.05%
        const relativeError = ledger.energyConservationError / initialEnergy;
        expect(relativeError).toBeLessThan(5e-4);
      }

      expect(state.status).toBe('active');
      expect(maxError).toBeLessThan(0.05); // Less than 50 mJ error on ~33 J total
    });
  });

  // --------------------------------------------------------------------------
  // 9. Frictional thermal-energy accounting
  // --------------------------------------------------------------------------
  describe('9. Frictional thermal-energy accounting', () => {
    it('ensures K + U_g + U_s + Q = E_0 holds identically with friction active', () => {
      const params: WorkEnergyParams = {
        ...DEFAULT_WORK_ENERGY_PARAMS,
        mass: 2.0,
        inclineAngleDeg: 25.0,
        kineticFriction: 0.08,
        staticFriction: 0.12,
        springConstant: 40.0,
      };

      let state = createInitialWorkEnergyState(params);
      const dt = 0.016;
      let prevQ = 0;

      for (let i = 0; i < 80; i++) {
        state = stepWorkEnergy(state, params, dt);
        const ledger = computeWorkEnergyLedger(params, state);

        // Conservation with thermal dissipation ledger
        expect(ledger.energyConservationError).toBeLessThan(1e-3);

        // Thermal energy must monotonically increase when moving
        if (Math.abs(state.velocity) > 1e-4) {
          expect(ledger.thermalEnergy).toBeGreaterThanOrEqual(prevQ);
        }
        prevQ = ledger.thermalEnergy;
      }

      expect(prevQ).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // 10. Static-friction breakaway threshold
  // --------------------------------------------------------------------------
  describe('10. Static-friction breakaway threshold', () => {
    it('keeps the block at rest when tan(theta) <= mu_s', () => {
      // theta = 10 deg: tan(10 deg) ~= 0.1763
      // Set mu_s = 0.25 > 0.1763
      const params: WorkEnergyParams = {
        ...DEFAULT_WORK_ENERGY_PARAMS,
        inclineAngleDeg: 10.0,
        staticFriction: 0.25,
        kineticFriction: 0.15,
      };

      const initialState = createInitialWorkEnergyState(params);
      expect(initialState.status).toBe('at_rest');
      expect(initialState.velocity).toBe(0);
      expect(initialState.acceleration).toBe(0);

      // Stepping does not move the block
      const nextState = stepWorkEnergy(initialState, params, 0.1);
      expect(nextState.status).toBe('at_rest');
      expect(nextState.displacement).toBe(0);
      expect(nextState.velocity).toBe(0);
      expect(nextState.acceleration).toBe(0);
      expect(nextState.thermalEnergy).toBe(0); // No dissipation at rest
    });

    it('breaks away and starts sliding when tan(theta) > mu_s', () => {
      // theta = 25 deg: tan(25 deg) ~= 0.4663
      // Set mu_s = 0.08 < 0.4663
      const params: WorkEnergyParams = {
        ...DEFAULT_WORK_ENERGY_PARAMS,
        inclineAngleDeg: 25.0,
        staticFriction: 0.08,
        kineticFriction: 0.05,
      };

      const initialState = createInitialWorkEnergyState(params);
      expect(initialState.status).toBe('active');
      expect(initialState.acceleration).toBeGreaterThan(0);

      const nextState = stepWorkEnergy(initialState, params, 0.1);
      expect(nextState.displacement).toBeGreaterThan(0);
      expect(nextState.velocity).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // 11. Friction opposing both directions of motion
  // --------------------------------------------------------------------------
  describe('11. Friction opposing both directions of motion', () => {
    it('opposes positive downhill velocity (F_k < 0)', () => {
      const forces = computeWorkEnergyForces(DEFAULT_WORK_ENERGY_PARAMS, 1.0, +2.0);
      expect(forces.frictionForce).toBeLessThan(0);
      expect(forces.frictionForce).toBeCloseTo(-forces.kineticFrictionMag, 6);
    });

    it('opposes negative uphill velocity during rebound (F_k > 0)', () => {
      const forces = computeWorkEnergyForces(DEFAULT_WORK_ENERGY_PARAMS, 3.8, -2.0);
      expect(forces.frictionForce).toBeGreaterThan(0);
      expect(forces.frictionForce).toBeCloseTo(+forces.kineticFrictionMag, 6);
    });
  });

  // --------------------------------------------------------------------------
  // 12. Instantaneous and average power
  // --------------------------------------------------------------------------
  describe('12. Instantaneous and average power', () => {
    it('calculates instantaneous power P = F * v for each force and net', () => {
      const params: WorkEnergyParams = {
        ...DEFAULT_WORK_ENERGY_PARAMS,
        mass: 2.0,
        inclineAngleDeg: 30.0,
        kineticFriction: 0.05,
        springConstant: 40.0,
      };
      const state: WorkEnergyState = {
        time: 1.0,
        displacement: 4.0, // xs = 0.5 m, Fs = -20 N
        velocity: 2.0,
        acceleration: 0,
        thermalEnergy: 1.0,
        status: 'active',
      };

      const power = computeWorkEnergyPower(params, state);
      const forces = computeWorkEnergyForces(params, state.displacement, state.velocity);

      expect(power.powerGravity).toBeCloseTo(forces.gravityParallel * 2.0, 6);
      expect(power.powerSpring).toBeCloseTo(forces.springForce * 2.0, 6);
      expect(power.powerFriction).toBeCloseTo(forces.frictionForce * 2.0, 6);
      expect(power.powerNet).toBeCloseTo(forces.netForce * 2.0, 6);

      // Net power equals sum of constituent powers
      expect(power.powerNet).toBeCloseTo(
        power.powerGravity + power.powerSpring + power.powerFriction,
        6
      );
    });

    it('calculates average power as W / delta_t', () => {
      const state: WorkEnergyState = {
        time: 2.0,
        displacement: 2.5,
        velocity: 1.5,
        acceleration: 0,
        thermalEnergy: 0.5,
        status: 'active',
      };
      const power = computeWorkEnergyPower(DEFAULT_WORK_ENERGY_PARAMS, state);
      const work = computeWorkBreakdown(DEFAULT_WORK_ENERGY_PARAMS, state);

      expect(power.avgPowerGravity).toBeCloseTo(work.workGravity / 2.0, 6);
      expect(power.avgPowerSpring).toBeCloseTo(work.workSpring / 2.0, 6);
      expect(power.avgPowerFriction).toBeCloseTo(work.workFriction / 2.0, 6);
      expect(power.avgPowerNet).toBeCloseTo(work.workNet / 2.0, 6);
    });
  });

  // --------------------------------------------------------------------------
  // 13. Zero-velocity power
  // --------------------------------------------------------------------------
  describe('13. Zero-velocity power', () => {
    it('produces identically zero instantaneous power when velocity is zero', () => {
      const state: WorkEnergyState = {
        time: 1.5,
        displacement: 3.0,
        velocity: 0,
        acceleration: 0,
        thermalEnergy: 0.5,
        status: 'at_rest',
      };
      const power = computeWorkEnergyPower(DEFAULT_WORK_ENERGY_PARAMS, state);
      expect(power.powerGravity).toBe(0);
      expect(power.powerSpring).toBe(0);
      expect(power.powerFriction).toBe(0);
      expect(power.powerNet).toBe(0);
    });

    it('returns zero average power at elapsed time t = 0 without division-by-zero error', () => {
      const state: WorkEnergyState = {
        time: 0,
        displacement: 0,
        velocity: 0,
        acceleration: 0,
        thermalEnergy: 0,
        status: 'active',
      };
      const power = computeWorkEnergyPower(DEFAULT_WORK_ENERGY_PARAMS, state);
      expect(power.avgPowerGravity).toBe(0);
      expect(power.avgPowerSpring).toBe(0);
      expect(power.avgPowerFriction).toBe(0);
      expect(power.avgPowerNet).toBe(0);
      expect(Number.isFinite(power.avgPowerNet)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 14. Travel-limit termination
  // --------------------------------------------------------------------------
  describe('14. Travel-limit termination', () => {
    it('halts and preserves physical terminal state when spring compresses to solid height limit', () => {
      // High mass, steep angle, very weak spring to force solid height contact:
      const params: WorkEnergyParams = {
        mass: 5.0,
        inclineAngleDeg: 45.0,
        kineticFriction: 0.0,
        staticFriction: 0.0,
        springConstant: 10.0, // soft spring allows s > 4.90 m
      };

      let state = createInitialWorkEnergyState(params);
      const dt = 0.01;
      let terminated = false;

      for (let i = 0; i < 500; i++) {
        const nextState = stepWorkEnergy(state, params, dt);
        if (nextState.status === 'exceeded') {
          terminated = true;
          expect(nextState.statusMessage).toContain('solid height limit');

          // Preserved physical state: actual velocity and position preserved, not clamped to 0
          expect(nextState.velocity).toBeGreaterThan(0);
          expect(nextState.displacement).toBeLessThanOrEqual(WORK_ENERGY_CONSTANTS.LOWER_TRAVEL_LIMIT);

          // Subsequent integration attempts must return identical frozen state
          const postState = stepWorkEnergy(nextState, params, dt);
          expect(postState.status).toBe('exceeded');
          expect(postState.displacement).toBe(nextState.displacement);
          expect(postState.velocity).toBe(nextState.velocity);
          expect(postState.time).toBe(nextState.time);
          break;
        }
        state = nextState;
      }

      expect(terminated).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 15. Invalid parameter rejection
  // --------------------------------------------------------------------------
  describe('15. Invalid parameter rejection', () => {
    it('rejects static friction lower than kinetic friction (mu_s < mu_k)', () => {
      const result = validateWorkEnergyParams({
        ...DEFAULT_WORK_ENERGY_PARAMS,
        kineticFriction: 0.15,
        staticFriction: 0.10,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('μs >= μk'))).toBe(true);
    });

    it('rejects mass out of range [0.5, 5.0] kg', () => {
      expect(validateWorkEnergyParams({ ...DEFAULT_WORK_ENERGY_PARAMS, mass: 0.1 }).valid).toBe(false);
      expect(validateWorkEnergyParams({ ...DEFAULT_WORK_ENERGY_PARAMS, mass: 10.0 }).valid).toBe(false);
      expect(validateWorkEnergyParams({ ...DEFAULT_WORK_ENERGY_PARAMS, mass: NaN }).valid).toBe(false);
    });

    it('rejects incline angle out of range [10, 45] deg', () => {
      expect(validateWorkEnergyParams({ ...DEFAULT_WORK_ENERGY_PARAMS, inclineAngleDeg: 5.0 }).valid).toBe(false);
      expect(validateWorkEnergyParams({ ...DEFAULT_WORK_ENERGY_PARAMS, inclineAngleDeg: 55.0 }).valid).toBe(false);
    });

    it('rejects spring constant out of range [10, 80] N/m', () => {
      expect(validateWorkEnergyParams({ ...DEFAULT_WORK_ENERGY_PARAMS, springConstant: 5.0 }).valid).toBe(false);
      expect(validateWorkEnergyParams({ ...DEFAULT_WORK_ENERGY_PARAMS, springConstant: 100.0 }).valid).toBe(false);
    });

    it('flags initial state as exceeded when created with invalid parameters', () => {
      const state = createInitialWorkEnergyState({
        ...DEFAULT_WORK_ENERGY_PARAMS,
        mass: -1.0,
      });
      expect(state.status).toBe('exceeded');
      expect(state.statusMessage).toContain('Invalid parameters');
    });
  });

  // --------------------------------------------------------------------------
  // 16. Deterministic fixed-step results
  // --------------------------------------------------------------------------
  describe('16. Deterministic fixed-step results', () => {
    it('produces bit-for-bit identical trajectories across independent runs', () => {
      const params = { ...DEFAULT_WORK_ENERGY_PARAMS };
      const dt = 0.016;
      const numSteps = 100;

      let stateA = createInitialWorkEnergyState(params);
      let stateB = createInitialWorkEnergyState(params);

      for (let i = 0; i < numSteps; i++) {
        stateA = stepWorkEnergy(stateA, params, dt);
        stateB = stepWorkEnergy(stateB, params, dt);

        expect(stateA.time).toBe(stateB.time);
        expect(stateA.displacement).toBe(stateB.displacement);
        expect(stateA.velocity).toBe(stateB.velocity);
        expect(stateA.acceleration).toBe(stateB.acceleration);
        expect(stateA.thermalEnergy).toBe(stateB.thermalEnergy);
        expect(stateA.status).toBe(stateB.status);
      }
    });

    it('correctly samples force-displacement curve across apparatus track', () => {
      const samples = sampleForceDisplacementCurve(DEFAULT_WORK_ENERGY_PARAMS, 0, 4.90, 50);
      expect(samples.length).toBe(50);
      expect(samples[0].displacement).toBe(0);
      expect(samples[0].springForce).toBe(0);
      expect(samples[samples.length - 1].displacement).toBeCloseTo(4.90, 6);
      expect(samples[samples.length - 1].springForce).toBeLessThan(0);
    });
  });
});
