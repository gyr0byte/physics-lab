import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../src/core/Vector2';
import {
  computeProjectileState,
  computeTimeOfFlight,
  computeRange,
  computeMaxHeight,
  computeTimeAtMaxHeight,
  validateParams,
  degToRad,
  radToDeg,
  type ProjectileParams,
} from '../../src/physics/ProjectilePhysics';

// ── Helpers ──────────────────────────────────────────────────────

function makeParams(overrides: Partial<ProjectileParams> = {}): ProjectileParams {
  return {
    initialSpeed: 20,
    launchAngle: degToRad(45),
    gravity: 9.81,
    launchPosition: Vector2.zero(),
    ...overrides,
  };
}

/** Floating-point tolerance for physics comparisons */
const TOL = 0.01;

// ── Tests ────────────────────────────────────────────────────────

describe('ProjectilePhysics', () => {
  describe('degToRad / radToDeg', () => {
    it('converts 0° to 0 rad', () => {
      expect(degToRad(0)).toBe(0);
    });
    it('converts 180° to π rad', () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI, 10);
    });
    it('converts π rad to 180°', () => {
      expect(radToDeg(Math.PI)).toBeCloseTo(180, 10);
    });
    it('round-trips correctly', () => {
      expect(radToDeg(degToRad(45))).toBeCloseTo(45, 10);
    });
  });

  describe('computeProjectileState', () => {
    it('returns launch position at t=0', () => {
      const params = makeParams();
      const state = computeProjectileState(params, 0);
      expect(state.time).toBe(0);
      expect(state.position.x).toBeCloseTo(0, 10);
      expect(state.position.y).toBeCloseTo(0, 10);
      expect(state.landed).toBe(false);
    });

    it('returns correct state for zero initial velocity', () => {
      const params = makeParams({ initialSpeed: 0 });
      const state = computeProjectileState(params, 1);
      // Drops vertically: y = 0 - 0.5*g*1² = -4.905
      // Since y < 0, it has landed
      expect(state.position.x).toBeCloseTo(0, 10);
      expect(state.landed).toBe(true);
    });

    it('computes correct horizontal position', () => {
      const params = makeParams({ initialSpeed: 10, launchAngle: 0 });
      const state = computeProjectileState(params, 2);
      // vx = 10*cos(0) = 10, x(2) = 10*2 = 20
      expect(state.position.x).toBeCloseTo(20, TOL);
    });

    it('computes correct vertical position at t=1 for 45°', () => {
      const params = makeParams({ initialSpeed: 20, launchAngle: degToRad(45) });
      const state = computeProjectileState(params, 1);
      const vy0 = 20 * Math.sin(degToRad(45));
      const expectedY = vy0 * 1 - 0.5 * 9.81 * 1;
      expect(state.position.y).toBeCloseTo(expectedY, TOL);
    });

    it('velocity components are correct', () => {
      const params = makeParams({ initialSpeed: 30, launchAngle: degToRad(60) });
      const state = computeProjectileState(params, 0);
      // At t=0, velocity = initial velocity components
      expect(state.velocity.x).toBeCloseTo(30 * Math.cos(degToRad(60)), TOL);
      expect(state.velocity.y).toBeCloseTo(30 * Math.sin(degToRad(60)), TOL);
    });

    it('horizontal velocity remains constant', () => {
      const params = makeParams({ initialSpeed: 25, launchAngle: degToRad(30) });
      const vx0 = 25 * Math.cos(degToRad(30));
      const state1 = computeProjectileState(params, 0.5);
      const state2 = computeProjectileState(params, 1.5);
      expect(state1.velocity.x).toBeCloseTo(vx0, TOL);
      expect(state2.velocity.x).toBeCloseTo(vx0, TOL);
    });

    it('vertical velocity decreases due to gravity', () => {
      const params = makeParams({ initialSpeed: 20, launchAngle: degToRad(90) });
      const state = computeProjectileState(params, 1);
      // vy(1) = 20 - 9.81*1 = 10.19
      expect(state.velocity.y).toBeCloseTo(20 - 9.81, TOL);
    });

    it('detects landing', () => {
      const params = makeParams({ initialSpeed: 20, launchAngle: degToRad(45) });
      const tof = computeTimeOfFlight(params);
      const state = computeProjectileState(params, tof + 0.1);
      expect(state.landed).toBe(true);
      expect(state.position.y).toBeCloseTo(0, TOL); // Clamped to ground
    });
  });

  describe('computeTimeOfFlight', () => {
    it('returns 0 for zero initial speed', () => {
      const params = makeParams({ initialSpeed: 0 });
      expect(computeTimeOfFlight(params)).toBe(0);
    });

    it('returns 0 for horizontal launch', () => {
      const params = makeParams({ launchAngle: 0 });
      expect(computeTimeOfFlight(params)).toBeCloseTo(0, TOL);
    });

    it('returns correct value for 45°', () => {
      const params = makeParams({ initialSpeed: 20, launchAngle: degToRad(45) });
      const vy0 = 20 * Math.sin(degToRad(45));
      const expected = (2 * vy0) / 9.81;
      expect(computeTimeOfFlight(params)).toBeCloseTo(expected, TOL);
    });

    it('returns correct value for vertical launch', () => {
      const params = makeParams({ initialSpeed: 10, launchAngle: degToRad(90) });
      // T = 2*v0/g = 20/9.81 ≈ 2.039
      expect(computeTimeOfFlight(params)).toBeCloseTo(20 / 9.81, TOL);
    });
  });

  describe('computeRange', () => {
    it('returns 0 for zero speed', () => {
      const params = makeParams({ initialSpeed: 0 });
      expect(computeRange(params)).toBeCloseTo(0, TOL);
    });

    it('returns 0 for vertical launch', () => {
      const params = makeParams({ launchAngle: degToRad(90) });
      expect(computeRange(params)).toBeCloseTo(0, TOL);
    });

    it('range is maximized at 45°', () => {
      const params45 = makeParams({ launchAngle: degToRad(45) });
      const params30 = makeParams({ launchAngle: degToRad(30) });
      const params60 = makeParams({ launchAngle: degToRad(60) });
      const r45 = computeRange(params45);
      expect(r45).toBeGreaterThan(computeRange(params30));
      expect(r45).toBeGreaterThan(computeRange(params60));
    });

    it('complementary angles yield the same range', () => {
      // 30° and 60° should give the same range
      const params30 = makeParams({ launchAngle: degToRad(30) });
      const params60 = makeParams({ launchAngle: degToRad(60) });
      expect(computeRange(params30)).toBeCloseTo(computeRange(params60), TOL);
    });

    it('computes correct known range', () => {
      // R = v0² * sin(2θ) / g
      const params = makeParams({ initialSpeed: 20, launchAngle: degToRad(45) });
      const expected = (400 * Math.sin(degToRad(90))) / 9.81;
      expect(computeRange(params)).toBeCloseTo(expected, TOL);
    });
  });

  describe('computeMaxHeight', () => {
    it('returns 0 for zero speed', () => {
      const params = makeParams({ initialSpeed: 0 });
      expect(computeMaxHeight(params)).toBeCloseTo(0, TOL);
    });

    it('returns 0 for horizontal launch', () => {
      const params = makeParams({ launchAngle: 0 });
      expect(computeMaxHeight(params)).toBeCloseTo(0, TOL);
    });

    it('is maximized for vertical launch', () => {
      const params90 = makeParams({ launchAngle: degToRad(90) });
      const params45 = makeParams({ launchAngle: degToRad(45) });
      expect(computeMaxHeight(params90)).toBeGreaterThan(computeMaxHeight(params45));
    });

    it('computes correct known max height', () => {
      // H = (v0*sin(θ))² / (2g)
      const params = makeParams({ initialSpeed: 20, launchAngle: degToRad(30) });
      const vy0 = 20 * Math.sin(degToRad(30));
      const expected = (vy0 * vy0) / (2 * 9.81);
      expect(computeMaxHeight(params)).toBeCloseTo(expected, TOL);
    });
  });

  describe('computeTimeAtMaxHeight', () => {
    it('time at max height is half the time of flight', () => {
      const params = makeParams({ initialSpeed: 20, launchAngle: degToRad(45) });
      const tof = computeTimeOfFlight(params);
      const tMax = computeTimeAtMaxHeight(params);
      expect(tMax).toBeCloseTo(tof / 2, TOL);
    });

    it('projectile is at max height at computed time', () => {
      const params = makeParams({ initialSpeed: 30, launchAngle: degToRad(60) });
      const tMax = computeTimeAtMaxHeight(params);
      const stateAtMax = computeProjectileState(params, tMax);
      const maxH = computeMaxHeight(params);
      expect(stateAtMax.position.y).toBeCloseTo(maxH, TOL);
    });

    it('vertical velocity is zero at max height', () => {
      const params = makeParams({ initialSpeed: 25, launchAngle: degToRad(45) });
      const tMax = computeTimeAtMaxHeight(params);
      const state = computeProjectileState(params, tMax);
      expect(state.velocity.y).toBeCloseTo(0, TOL);
    });
  });

  describe('validateParams', () => {
    it('accepts valid parameters', () => {
      const errors = validateParams(makeParams());
      expect(errors).toHaveLength(0);
    });

    it('rejects negative speed', () => {
      const errors = validateParams(makeParams({ initialSpeed: -5 }));
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('speed'))).toBe(true);
    });

    it('rejects angle out of range', () => {
      const errors = validateParams(makeParams({ launchAngle: degToRad(100) }));
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('angle'))).toBe(true);
    });

    it('rejects zero gravity', () => {
      const errors = validateParams(makeParams({ gravity: 0 }));
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('Gravity'))).toBe(true);
    });

    it('rejects negative gravity', () => {
      const errors = validateParams(makeParams({ gravity: -9.81 }));
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Consistency checks', () => {
    it('range matches position at time of flight', () => {
      const params = makeParams({ initialSpeed: 30, launchAngle: degToRad(35) });
      const range = computeRange(params);
      const tof = computeTimeOfFlight(params);
      const state = computeProjectileState(params, tof);
      expect(state.position.x).toBeCloseTo(range, TOL);
    });

    it('different gravity changes range inversely', () => {
      const earthParams = makeParams({ gravity: 9.81 });
      const moonParams = makeParams({ gravity: 1.62 });
      const earthRange = computeRange(earthParams);
      const moonRange = computeRange(moonParams);
      // Moon range should be about 9.81/1.62 ≈ 6.06 times Earth range
      expect(moonRange / earthRange).toBeCloseTo(9.81 / 1.62, TOL);
    });
  });
});
