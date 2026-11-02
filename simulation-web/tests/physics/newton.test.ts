import { describe, it, expect } from 'vitest';
import {
  computeForcesAndAcceleration,
  stepNewtonsSecondLaw,
  createInitialNewtonsSecondLawState,
  DEFAULT_NEWTON_PARAMS,
  type NewtonsSecondLawParams,
} from '../../src/physics/NewtonsSecondLawPhysics';

describe("Newton's Second Law Physics Model", () => {
  describe('Frictionless Motion (mu = 0)', () => {
    it('computes exact acceleration a = F / m', () => {
      const params: NewtonsSecondLawParams = {
        mass: 5.0,
        appliedForce: 20.0,
        frictionCoefficient: 0,
        gravity: 9.8,
      };
      const result = computeForcesAndAcceleration(params, 0);
      expect(result.acceleration).toBeCloseTo(4.0, 5);
      expect(result.netForce).toBeCloseTo(20.0, 5);
      expect(result.frictionForce).toBe(0);
      expect(result.isStatic).toBe(false);
    });

    it('satisfies F_net = m * a invariant exactly', () => {
      const masses = [1, 2.5, 5, 10, 20];
      const forces = [-50, -20, 0, 15, 35, 50];

      for (const m of masses) {
        for (const f of forces) {
          const params: NewtonsSecondLawParams = {
            mass: m,
            appliedForce: f,
            frictionCoefficient: 0,
            gravity: 9.8,
          };
          const result = computeForcesAndAcceleration(params, 0);
          expect(result.netForce).toBeCloseTo(m * result.acceleration, 8);
        }
      }
    });

    it('halves acceleration when mass is doubled for constant applied force', () => {
      const params1: NewtonsSecondLawParams = {
        mass: 4.0,
        appliedForce: 20.0,
        frictionCoefficient: 0,
        gravity: 9.8,
      };
      const params2: NewtonsSecondLawParams = {
        mass: 8.0,
        appliedForce: 20.0,
        frictionCoefficient: 0,
        gravity: 9.8,
      };

      const res1 = computeForcesAndAcceleration(params1, 0);
      const res2 = computeForcesAndAcceleration(params2, 0);

      expect(res1.acceleration).toBeCloseTo(5.0, 5);
      expect(res2.acceleration).toBeCloseTo(2.5, 5);
      expect(res1.acceleration).toBeCloseTo(res2.acceleration * 2, 5);
    });

    it('handles negative applied force accelerating to the left', () => {
      const params: NewtonsSecondLawParams = {
        mass: 2.0,
        appliedForce: -10.0,
        frictionCoefficient: 0,
        gravity: 9.8,
      };
      const result = computeForcesAndAcceleration(params, 0);
      expect(result.acceleration).toBeCloseTo(-5.0, 5);
      expect(result.netForce).toBeCloseTo(-10.0, 5);
    });

    it('produces zero acceleration when applied force is zero', () => {
      const params: NewtonsSecondLawParams = {
        mass: 5.0,
        appliedForce: 0,
        frictionCoefficient: 0,
        gravity: 9.8,
      };
      const result = computeForcesAndAcceleration(params, 0);
      expect(result.acceleration).toBe(0);
      expect(result.netForce).toBe(0);
    });
  });

  describe('Static Friction Threshold', () => {
    const paramsWithFriction: NewtonsSecondLawParams = {
      mass: 5.0,
      appliedForce: 5.0,
      frictionCoefficient: 0.20,
      gravity: 9.8,
    };
    // Normal = 5 * 9.8 = 49 N
    // maxStatic = 0.20 * 49 = 9.8 N

    it('holds object at rest when applied force is below threshold', () => {
      const res = computeForcesAndAcceleration(paramsWithFriction, 0);
      expect(res.normalForce).toBeCloseTo(49.0, 5);
      expect(res.maxStaticFriction).toBeCloseTo(9.8, 5);
      expect(res.frictionForce).toBeCloseTo(-5.0, 5);
      expect(res.netForce).toBe(0);
      expect(res.acceleration).toBe(0);
      expect(res.isStatic).toBe(true);
    });

    it('holds object at rest when applied force exactly equals static threshold', () => {
      const params = { ...paramsWithFriction, appliedForce: 9.8 };
      const res = computeForcesAndAcceleration(params, 0);
      expect(res.frictionForce).toBeCloseTo(-9.8, 5);
      expect(res.netForce).toBe(0);
      expect(res.acceleration).toBe(0);
      expect(res.isStatic).toBe(true);
    });

    it('breaks static friction when applied force exceeds threshold', () => {
      const params = { ...paramsWithFriction, appliedForce: 15.0 };
      const res = computeForcesAndAcceleration(params, 0);
      // Kinetic friction = 0.85 * 0.20 * 49 = 8.33 N
      const expectedKineticFriction = 0.85 * 0.20 * 49.0;
      expect(res.frictionForce).toBeCloseTo(-expectedKineticFriction, 4);
      expect(res.netForce).toBeCloseTo(15.0 - expectedKineticFriction, 4);
      expect(res.acceleration).toBeCloseTo((15.0 - expectedKineticFriction) / 5.0, 4);
      expect(res.isStatic).toBe(false);
    });

    it('holds in negative direction when applied force is negative but below threshold', () => {
      const params = { ...paramsWithFriction, appliedForce: -7.0 };
      const res = computeForcesAndAcceleration(params, 0);
      expect(res.frictionForce).toBeCloseTo(7.0, 5);
      expect(res.netForce).toBe(0);
      expect(res.acceleration).toBe(0);
      expect(res.isStatic).toBe(true);
    });
  });

  describe('Kinetic Friction in Motion', () => {
    it('opposes positive velocity direction', () => {
      const params: NewtonsSecondLawParams = {
        mass: 4.0,
        appliedForce: 10.0,
        frictionCoefficient: 0.15,
        gravity: 9.8,
      };
      // Normal = 4 * 9.8 = 39.2 N
      // f_k = 0.85 * 0.15 * 39.2 = 4.998 N
      const res = computeForcesAndAcceleration(params, 2.5); // moving right
      expect(res.frictionForce).toBeCloseTo(-4.998, 3);
      expect(res.netForce).toBeCloseTo(10.0 - 4.998, 3);
      expect(res.acceleration).toBeCloseTo((10.0 - 4.998) / 4.0, 3);
    });

    it('opposes negative velocity direction', () => {
      const params: NewtonsSecondLawParams = {
        mass: 4.0,
        appliedForce: 0,
        frictionCoefficient: 0.15,
        gravity: 9.8,
      };
      // Moving left: friction must point to the right (+)
      const res = computeForcesAndAcceleration(params, -3.0);
      expect(res.frictionForce).toBeCloseTo(4.998, 3);
      expect(res.netForce).toBeCloseTo(4.998, 3);
      expect(res.acceleration).toBeCloseTo(4.998 / 4.0, 3);
    });
  });

  describe('Timestep Integration & Motion Arrest', () => {
    it('integrates position and velocity accurately under constant force', () => {
      const params: NewtonsSecondLawParams = {
        mass: 2.0,
        appliedForce: 10.0,
        frictionCoefficient: 0,
        gravity: 9.8,
      };
      let state = createInitialNewtonsSecondLawState(params);
      const dt = 0.05; // 50ms

      // Run for 1.0 second (20 steps)
      for (let i = 0; i < 20; i++) {
        state = stepNewtonsSecondLaw(state, params, dt);
      }

      expect(state.time).toBeCloseTo(1.0, 5);
      // a = 10 / 2 = 5 m/s^2
      // v = a * t = 5 * 1 = 5 m/s
      expect(state.velocity).toBeCloseTo(5.0, 3);
      // Semi-implicit Euler: x = sum(v_new * dt)
      // exact analytic is x = 0.5 * a * t^2 = 2.5 m
      // Euler with dt=0.05 gives slightly higher ~2.625 m
      expect(state.position).toBeGreaterThan(2.4);
      expect(state.position).toBeLessThan(2.8);
    });

    it('brings sliding block to rest smoothly when applied force is removed', () => {
      const params: NewtonsSecondLawParams = {
        mass: 2.0,
        appliedForce: 0, // no push
        frictionCoefficient: 0.25, // strong friction
        gravity: 9.8,
      };

      // Start with initial velocity 2.0 m/s
      let state = {
        ...createInitialNewtonsSecondLawState(params),
        velocity: 2.0,
        isStatic: false,
      };

      const dt = 1 / 60;
      // Step until velocity stops
      for (let i = 0; i < 300; i++) {
        state = stepNewtonsSecondLaw(state, params, dt);
        if (state.isStatic && state.velocity === 0) break;
      }

      // Block must be completely arrested
      expect(state.velocity).toBe(0);
      expect(state.acceleration).toBe(0);
      expect(state.isStatic).toBe(true);
      expect(state.netForce).toBe(0);
    });
  });
});
