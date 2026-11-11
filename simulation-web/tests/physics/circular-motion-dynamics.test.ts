import { describe, expect, it } from 'vitest';
import { Vector2 } from '../../src/core/Vector2';
import {
  CIRCULAR_MOTION_CONSTANTS,
  classifyVerticalCircleRegime,
  computeTurntableBreakawayThreshold,
  computeVerticalCircleCriticalSpeeds,
  evaluateVerticalCircleAtAngle,
  type HorizontalCircularParams,
  type VerticalCircleParams,
} from '../../src/physics/CircularMotionPhysics';
import {
  createInitialTurntableState,
  createInitialVerticalCircleState,
  DYNAMICS_CONSTANTS,
  stepTurntableState,
  stepVerticalCircleState,
  type TurntableDynamicState,
  type VerticalCircleDynamicState,
} from '../../src/physics/CircularMotionDynamics';

function makeTurntableParams(
  overrides: Partial<HorizontalCircularParams> = {}
): HorizontalCircularParams {
  return {
    radius: 1.0,
    initialAngularVelocity: 2.0,
    angularAcceleration: 0.0,
    mass: 1.5,
    staticFriction: 0.5,
    kineticFriction: 0.3,
    attachmentMode: 'friction-surface',
    gravity: CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY,
    ...overrides,
  };
}

function makeVerticalParams(
  overrides: Partial<VerticalCircleParams> = {}
): VerticalCircleParams {
  return {
    radius: 1.5,
    initialSpeed: 6.0,
    mass: 1.2,
    linkageType: 'flexible-string',
    gravity: CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY,
    ...overrides,
  };
}

function advanceTurntableForDuration(
  initial: TurntableDynamicState,
  params: HorizontalCircularParams,
  duration: number,
  outerDt: number
): TurntableDynamicState {
  let state = initial;
  const steps = Math.round(duration / outerDt);
  for (let i = 0; i < steps; i++) {
    state = stepTurntableState(state, params, outerDt);
  }
  return state;
}

function advanceVerticalForDuration(
  initial: VerticalCircleDynamicState,
  params: VerticalCircleParams,
  duration: number,
  outerDt: number
): VerticalCircleDynamicState {
  let state = initial;
  const steps = Math.round(duration / outerDt);
  for (let i = 0; i < steps; i++) {
    state = stepVerticalCircleState(state, params, outerDt);
  }
  return state;
}

describe('CircularMotionDynamics — Configuration, Timestep & State Guards', () => {
  it('enforces fixed INTERNAL_SUBSTEP_DT = 0.002 s', () => {
    expect(DYNAMICS_CONSTANTS.INTERNAL_SUBSTEP_DT).toBe(0.002);
    expect(DYNAMICS_CONSTANTS.MAX_EVENTS_PER_STEP).toBe(64);
  });

  it('rejects negative and non-finite dt with RangeError and treats dt === 0 as safe no-op', () => {
    const ttParams = makeTurntableParams();
    const ttInit = createInitialTurntableState(ttParams);
    const vcParams = makeVerticalParams();
    const vcInit = createInitialVerticalCircleState(vcParams);

    for (const badDt of [-0.001, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => stepTurntableState(ttInit, ttParams, badDt)).toThrow(RangeError);
      expect(() => stepVerticalCircleState(vcInit, vcParams, badDt)).toThrow(RangeError);
    }

    const ttZero = stepTurntableState(ttInit, ttParams, 0);
    expect(ttZero.time).toBe(0);
    expect(ttZero.puckPosition.equals(ttInit.puckPosition)).toBe(true);
    expect(ttZero.puckVelocity.equals(ttInit.puckVelocity)).toBe(true);

    const vcZero = stepVerticalCircleState(vcInit, vcParams, 0);
    expect(vcZero.time).toBe(0);
    expect(vcZero.position.equals(vcInit.position)).toBe(true);
    expect(vcZero.velocity.equals(vcInit.velocity)).toBe(true);
  });

  it("explicitly rejects attachmentMode: 'tether' in turntable dynamics", () => {
    const tetherParams = makeTurntableParams({ attachmentMode: 'tether' });
    expect(() => createInitialTurntableState(tetherParams)).toThrow(/tether/i);

    const validSurface = makeTurntableParams({ attachmentMode: 'friction-surface' });
    const state = createInitialTurntableState(validSurface);
    expect(() => stepTurntableState(state, tetherParams, 0.01)).toThrow(/tether/i);
  });

  it('throws explicit validation errors on invalid physical parameters without silent clamping', () => {
    const invalidTurntableCases: HorizontalCircularParams[] = [
      makeTurntableParams({ radius: 0 }),
      makeTurntableParams({ radius: 0.05 }), // below MIN_SAFE_RADIUS = 0.10
      makeTurntableParams({ radius: -1 }),
      makeTurntableParams({ mass: 0 }),
      makeTurntableParams({ mass: -2 }),
      makeTurntableParams({ gravity: 0 }),
      makeTurntableParams({ staticFriction: -0.1 }),
      makeTurntableParams({ staticFriction: 0.3, kineticFriction: 0.4 }),
      makeTurntableParams({ initialAngularVelocity: Number.NaN }),
    ];

    for (const bad of invalidTurntableCases) {
      expect(() => createInitialTurntableState(bad)).toThrow();
    }

    const validTtParams = makeTurntableParams();
    const validTtState = createInitialTurntableState(validTtParams);
    expect(() =>
      stepTurntableState(validTtState, makeTurntableParams({ mass: 0 }), 0.01)
    ).toThrow();

    const invalidVerticalCases: VerticalCircleParams[] = [
      makeVerticalParams({ radius: 0 }),
      makeVerticalParams({ radius: 0.05 }),
      makeVerticalParams({ mass: -0.5 }),
      makeVerticalParams({ initialSpeed: -1 }),
      makeVerticalParams({ gravity: Number.POSITIVE_INFINITY }),
    ];

    for (const bad of invalidVerticalCases) {
      expect(() => createInitialVerticalCircleState(bad)).toThrow();
    }

    const validVcParams = makeVerticalParams();
    const validVcState = createInitialVerticalCircleState(validVcParams);
    expect(() =>
      stepVerticalCircleState(validVcState, makeVerticalParams({ radius: 0 }), 0.01)
    ).toThrow();
  });

  it('recovers cleanly with recoveredFromNonFinite = true when runtime state contains non-finite numbers', () => {
    const ttParams = makeTurntableParams();
    const ttInit = createInitialTurntableState(ttParams);
    const corruptedTt: TurntableDynamicState = {
      ...ttInit,
      puckPosition: new Vector2(Number.NaN, 1),
    };

    const recoveredTtZero = stepTurntableState(corruptedTt, ttParams, 0);
    expect(recoveredTtZero.recoveredFromNonFinite).toBe(true);
    expect(Number.isFinite(recoveredTtZero.puckPosition.x)).toBe(true);
    expect(recoveredTtZero.time).toBe(0);

    const corruptedTtVel: TurntableDynamicState = {
      ...ttInit,
      tableOmega: Number.POSITIVE_INFINITY,
    };
    const recoveredTtStep = stepTurntableState(corruptedTtVel, ttParams, 0.01);
    expect(Number.isFinite(recoveredTtStep.puckPosition.x)).toBe(true);
    expect(recoveredTtStep.time).toBeCloseTo(0.01, 12);

    const vcParams = makeVerticalParams();
    const vcInit = createInitialVerticalCircleState(vcParams);
    const corruptedVc: VerticalCircleDynamicState = {
      ...vcInit,
      velocity: new Vector2(Number.NaN, 0),
    };
    const recoveredVcZero = stepVerticalCircleState(corruptedVc, vcParams, 0);
    expect(recoveredVcZero.recoveredFromNonFinite).toBe(true);
    expect(Number.isFinite(recoveredVcZero.velocity.x)).toBe(true);

    const recoveredVcStep = stepVerticalCircleState(corruptedVc, vcParams, 0.02);
    expect(Number.isFinite(recoveredVcStep.position.y)).toBe(true);
    expect(recoveredVcStep.time).toBeCloseTo(0.02, 12);
  });

  it('executes deterministically for identical parameters and step sequences', () => {
    const ttParams = makeTurntableParams({ initialAngularVelocity: 1.0, angularAcceleration: 1.5 });
    const runA = advanceTurntableForDuration(createInitialTurntableState(ttParams), ttParams, 3.0, 1 / 60);
    const runB = advanceTurntableForDuration(createInitialTurntableState(ttParams), ttParams, 3.0, 1 / 60);

    expect(runA.puckPosition.x).toBe(runB.puckPosition.x);
    expect(runA.puckPosition.y).toBe(runB.puckPosition.y);
    expect(runA.puckVelocity.x).toBe(runB.puckVelocity.x);
    expect(runA.cumulativeThermalDissipation).toBe(runB.cumulativeThermalDissipation);

    const vcParams = makeVerticalParams({ initialSpeed: 7.0 });
    const vcA = advanceVerticalForDuration(createInitialVerticalCircleState(vcParams), vcParams, 4.0, 1 / 60);
    const vcB = advanceVerticalForDuration(createInitialVerticalCircleState(vcParams), vcParams, 4.0, 1 / 60);
    expect(vcA.position.x).toBe(vcB.position.x);
    expect(vcA.position.y).toBe(vcB.position.y);
    expect(vcA.cumulativeEnergyLost).toBe(vcB.cumulativeEnergyLost);
    expect(vcA.events.length).toBe(vcB.events.length);
  });
});

describe('CircularMotionDynamics — Task A: Turntable Kinetic-Slip Integration', () => {
  it('friction opposes relative motion and matches closed-form stopping time and distance on a stationary table', () => {
    const params = makeTurntableParams({
      radius: 1.0,
      initialAngularVelocity: 0,
      angularAcceleration: 0,
      mass: 2.0,
      staticFriction: 0.5,
      kineticFriction: 0.25,
      gravity: 9.8,
    });
    const v0 = new Vector2(3.0, 4.0); // |v0| = 5.0 m/s
    const pos0 = new Vector2(0.5, -0.2);
    const v0Mag = v0.magnitude();
    const muK = params.kineticFriction;
    const g = params.gravity ?? 9.8;
    const decel = muK * g; // 2.45 m/s²
    const tStop = v0Mag / decel; // 5 / 2.45 ≈ 2.0408163265 s
    const expectedStopDist = (v0Mag * v0Mag) / (2 * decel);

    let state = createInitialTurntableState(params, {
      initialPuckPosition: pos0,
      initialPuckVelocity: v0,
    });
    expect(state.phase).toBe('kinetic-slip');

    // Mid-flight at t = 1.0 s < tStop
    state = advanceTurntableForDuration(state, params, 1.0, 1 / 60);
    expect(state.phase).toBe('kinetic-slip');
    const expectedMidSpeed = v0Mag - decel * 1.0;
    expect(state.puckVelocity.magnitude()).toBeCloseTo(expectedMidSpeed, 6);
    expect(state.lastEvaluation.puckAcceleration.dot(v0)).toBeLessThan(0);

    // Total energy conservation on stationary table: K(t) + E_thermal(t) === K(0)
    const k0 = 0.5 * params.mass * v0Mag * v0Mag;
    expect(state.kineticEnergy + state.cumulativeThermalDissipation).toBeCloseTo(k0, 6);

    // Step past tStop to t = 2.5 s
    state = advanceTurntableForDuration(state, params, 1.5, 1 / 60);
    expect(state.phase).toBe('at-rest');
    expect(state.restickCount).toBe(1);
    expect(state.puckVelocity.magnitude()).toBe(0);
    expect(state.puckPosition.sub(pos0).magnitude()).toBeCloseTo(expectedStopDist, 4);
    expect(state.cumulativeThermalDissipation).toBeCloseTo(k0, 5);
    expect(state.cumulativeFrictionWorkLab).toBeCloseTo(-k0, 5);
  });

  it('prevents artificial velocity reversal across stopping zero-crossing for varied outer step sizes', () => {
    const params = makeTurntableParams({
      initialAngularVelocity: 0,
      angularAcceleration: 0,
      mass: 1.0,
      staticFriction: 0.6,
      kineticFriction: 0.4,
      gravity: 9.8,
    });
    const v0 = new Vector2(1.2, -0.5); // |v0| = 1.3 m/s

    for (const outerDt of [0.002, 1 / 60, 0.05]) {
      let state = createInitialTurntableState(params, {
        initialPuckPosition: new Vector2(0.8, 0.1),
        initialPuckVelocity: v0,
      });

      const steps = Math.ceil(1.0 / outerDt);
      for (let i = 0; i < steps; i++) {
        state = stepTurntableState(state, params, outerDt);
        // Never reverses direction opposite initial velocity
        expect(state.puckVelocity.dot(v0)).toBeGreaterThanOrEqual(-1e-12);
      }

      expect(state.phase).toBe('at-rest');
      expect(state.restickCount).toBe(1);
      expect(state.puckVelocity.magnitude()).toBe(0);
    }
  });

  it('supports kinetic-to-static resticking on a rotating table when |a_surface| <= μs g', () => {
    // Low rotation speed where centripetal ω² r = 1.0 * 1² = 1.0 < μs g = 4.9 m/s²
    const params = makeTurntableParams({
      radius: 1.0,
      initialAngularVelocity: 1.0,
      angularAcceleration: 0,
      mass: 1.0,
      staticFriction: 0.5,
      kineticFriction: 0.35,
      gravity: 9.8,
    });
    const pos0 = new Vector2(1.0, 0);
    // Surface velocity at (1, 0) is (0, 1); launch puck slightly faster tangentially
    const vel0 = new Vector2(0.2, 2.2);

    let state = createInitialTurntableState(params, {
      initialPuckPosition: pos0,
      initialPuckVelocity: vel0,
    });
    expect(state.phase).toBe('kinetic-slip');

    state = advanceTurntableForDuration(state, params, 2.0, 1 / 60);
    expect(state.phase).toBe('static');
    expect(state.restickCount).toBeGreaterThanOrEqual(1);
    expect(state.lastEvaluation.relativeSpeed).toBeLessThan(1e-9);

    // Subsequent rotation keeps puck locked to circular surface radius with zero additional thermal loss
    const radiusAfterRestick = state.radialDistance;
    const thermalAtRestick = state.cumulativeThermalDissipation;
    state = advanceTurntableForDuration(state, params, 2.0, 1 / 60);
    expect(state.phase).toBe('static');
    expect(state.radialDistance).toBeCloseTo(radiusAfterRestick, 12);
    expect(state.cumulativeThermalDissipation).toBeCloseTo(thermalAtRestick, 12);
  });

  it('passes smoothly through v_rel = 0 without resticking when |a_surface| > μs g', () => {
    // High steady ω = 4 rad/s at r = 1.0 => a_surface = 16 m/s² >> μs g = 2.94 m/s²
    const params = makeTurntableParams({
      radius: 1.0,
      initialAngularVelocity: 4.0,
      angularAcceleration: 0,
      mass: 1.0,
      staticFriction: 0.3,
      kineticFriction: 0.2,
      gravity: 9.8,
    });
    const pos0 = new Vector2(1.0, 0);
    // Surface velocity at (1, 0) is (0, 4). Start with small inward radial offset v_rel = (-0.015, 0)
    // Surface acceleration is (-16, 0), so relative velocity moves radially from -0.015 across 0 toward +outward.
    const vel0 = new Vector2(-0.015, 4.0);

    let state = createInitialTurntableState(params, {
      initialPuckPosition: pos0,
      initialPuckVelocity: vel0,
    });

    state = advanceTurntableForDuration(state, params, 0.25, 0.002);
    expect(state.restickCount).toBe(0);
    expect(state.phase).toBe('kinetic-slip');
    expect(Number.isFinite(state.puckPosition.x)).toBe(true);
    expect(state.radialDistance).toBeGreaterThan(1.0);
    expect(state.events.some((e) => e.type === 'zero-crossing-pass-through')).toBe(true);
  });

  it('preserves static adherence indefinitely at exact α = 0, rω² = μs g and breaks away at τ = 0 for r|α| = μs g, ω0 = 0, α ≠ 0', () => {
    const r = 1.2;
    const muS = 0.5;
    const g = 9.8;
    const omegaCrit = Math.sqrt((muS * g) / r);

    // Case 1: α = 0 and r ω₀² = μs g => stays statically attached indefinitely
    const steadyBoundaryParams = makeTurntableParams({
      radius: r,
      initialAngularVelocity: omegaCrit,
      angularAcceleration: 0,
      staticFriction: muS,
      kineticFriction: 0.3,
      gravity: g,
    });
    let steadyState = createInitialTurntableState(steadyBoundaryParams);
    expect(steadyState.lastEvaluation.regime).toBe('static');
    expect(steadyState.lastEvaluation.canRestick).toBe(true);
    expect(steadyState.lastEvaluation.isBreakaway).toBe(false);

    steadyState = advanceTurntableForDuration(steadyState, steadyBoundaryParams, 5.0, 1 / 60);
    expect(steadyState.phase).toBe('static');
    expect(steadyState.breakawayCount).toBe(0);
    expect(steadyState.radialDistance).toBeCloseTo(r, 12);
    expect(steadyState.cumulativeThermalDissipation).toBe(0);

    // Case 2: ω₀ = 0, α ≠ 0, r|α| = μs g => breakaway at τ = 0 on first dt > 0 (both +α and -α)
    const alphaBoundary = (muS * g) / r;
    for (const sign of [1, -1]) {
      const zeroTimeParams = makeTurntableParams({
        radius: r,
        initialAngularVelocity: 0,
        angularAcceleration: sign * alphaBoundary,
        staticFriction: muS,
        kineticFriction: 0.3,
        gravity: g,
      });
      const initZero = createInitialTurntableState(zeroTimeParams);
      const boundaryThreshold = computeTurntableBreakawayThreshold(
        r,
        muS,
        sign * alphaBoundary,
        g
      );
      expect(boundaryThreshold.isIncipientAtRest).toBe(true);
      expect(initZero.lastEvaluation.canRestick).toBe(true);
      expect(initZero.lastEvaluation.isBreakaway).toBe(false);

      // Even a tiny initial step triggers τ = 0 breakaway cleanly without bisection failure
      let stepped = stepTurntableState(initZero, zeroTimeParams, 0.0005);
      expect(stepped.phase).toBe('kinetic-slip');
      expect(stepped.breakawayCount).toBe(1);
      expect(stepped.events[0]?.time).toBe(0);

      stepped = advanceTurntableForDuration(stepped, zeroTimeParams, 0.5, 0.002);
      expect(stepped.radialDistance).toBeGreaterThan(r);
      expect(stepped.lastEvaluation.relativeSpeed).toBeGreaterThan(0);
    }

    // Case 3: r|α| > μs g at rest => immediate breakaway from τ = 0
    const superAlphaParams = makeTurntableParams({
      radius: r,
      initialAngularVelocity: 0,
      angularAcceleration: alphaBoundary * 1.2,
      staticFriction: muS,
      kineticFriction: 0.3,
      gravity: g,
    });
    const steppedSuper = stepTurntableState(createInitialTurntableState(superAlphaParams), superAlphaParams, 0.01);
    expect(steppedSuper.phase).toBe('kinetic-slip');
    expect(steppedSuper.breakawayCount).toBe(1);
    expect(steppedSuper.events[0]?.time).toBe(0);
  });

  it('localizes ramping breakaway cleanly and obeys lab work–energy & rotating-frame Jacobi identities', () => {
    // Part A: Ramping turntable with nonzero α (static work -> kinetic slip)
    const rampParams = makeTurntableParams({
      radius: 1.0,
      initialAngularVelocity: 0,
      angularAcceleration: 1.2,
      mass: 2.0,
      staticFriction: 0.5,
      kineticFriction: 0.3,
      gravity: 9.8,
    });
    const threshold = computeTurntableBreakawayThreshold(
      rampParams.radius,
      rampParams.staticFriction,
      rampParams.angularAcceleration,
      rampParams.gravity
    );
    expect(threshold.criticalAngularSpeed).not.toBeNull();
    const expectedBreakTime = (threshold.criticalAngularSpeed ?? 0) / rampParams.angularAcceleration;

    let rampState = createInitialTurntableState(rampParams);
    let prevThermal = 0;

    // Step across static buildup before expectedBreakTime (verify non-zero static lab work, 0 thermal loss)
    rampState = advanceTurntableForDuration(rampState, rampParams, 1.0, 0.002);
    expect(rampState.phase).toBe('static');
    expect(rampState.breakawayCount).toBe(0);
    expect(rampState.cumulativeThermalDissipation).toBe(0);
    expect(rampState.cumulativeFrictionWorkLab).toBeCloseTo(rampState.kineticEnergy, 10);
    expect(rampState.kineticEnergy).toBeGreaterThan(0);

    // Advance past expectedBreakTime up to t = 3.0 s
    const totalRampSteps = Math.round(2.0 / 0.002);
    for (let i = 0; i < totalRampSteps; i++) {
      rampState = stepTurntableState(rampState, rampParams, 0.002);
      expect(rampState.cumulativeThermalDissipation).toBeGreaterThanOrEqual(prevThermal);
      prevThermal = rampState.cumulativeThermalDissipation;
    }

    expect(rampState.phase).toBe('kinetic-slip');
    expect(rampState.breakawayCount).toBe(1);
    const breakEv = rampState.events.find((e) => e.type === 'breakaway');
    expect(breakEv).toBeDefined();
    expect(breakEv!.time).toBeCloseTo(expectedBreakTime, 6);
    // Lab Work–Energy Theorem holds for both static + kinetic segments under α ≠ 0:
    expect(rampState.kineticEnergy - 0).toBeCloseTo(rampState.cumulativeFrictionWorkLab, 3);
    expect(rampState.cumulativeThermalDissipation).toBeGreaterThan(0);

    // Part B: Constant-ω (α = 0) rotating-frame Jacobi energy conservation during kinetic slip
    const constOmegaParams = makeTurntableParams({
      radius: 1.0,
      initialAngularVelocity: 3.5,
      angularAcceleration: 0,
      mass: 1.5,
      staticFriction: 0.4,
      kineticFriction: 0.25,
      gravity: 9.8,
    });
    const posInit = new Vector2(1.0, 0);
    const velInit = new Vector2(0.8, 3.6);
    let rotState = createInitialTurntableState(constOmegaParams, {
      initialPuckPosition: posInit,
      initialPuckVelocity: velInit,
    });

    const rotatingJacobiEnergy = (s: TurntableDynamicState, omega: number, m: number): number => {
      const vRelSq = s.lastEvaluation.relativeVelocity.dot(s.lastEvaluation.relativeVelocity);
      const rSq = s.puckPosition.dot(s.puckPosition);
      return 0.5 * m * vRelSq - 0.5 * m * omega * omega * rSq;
    };

    const eRot0 = rotatingJacobiEnergy(rotState, constOmegaParams.initialAngularVelocity, constOmegaParams.mass);
    let prevRotThermal = 0;
    for (let i = 0; i < 400; i++) {
      rotState = stepTurntableState(rotState, constOmegaParams, 0.002);
      expect(rotState.cumulativeThermalDissipation).toBeGreaterThanOrEqual(prevRotThermal);
      prevRotThermal = rotState.cumulativeThermalDissipation;

      const eRotNow = rotatingJacobiEnergy(
        rotState,
        constOmegaParams.initialAngularVelocity,
        constOmegaParams.mass
      );
      expect(eRotNow + rotState.cumulativeThermalDissipation).toBeCloseTo(eRot0, 3);
    }
  });

  it('converges across internal and outer step sizes (0.001 s vs 0.002 s vs 1/60 s vs 0.05 s)', () => {
    const params = makeTurntableParams({
      radius: 0.8,
      initialAngularVelocity: 1.5,
      angularAcceleration: 2.0,
      mass: 1.0,
      staticFriction: 0.5,
      kineticFriction: 0.3,
    });

    const ref001 = advanceTurntableForDuration(createInitialTurntableState(params), params, 2.0, 0.001);
    const fine = advanceTurntableForDuration(createInitialTurntableState(params), params, 2.0, 0.002);
    const frame60 = advanceTurntableForDuration(createInitialTurntableState(params), params, 2.0, 1 / 60);
    const coarse = advanceTurntableForDuration(createInitialTurntableState(params), params, 2.0, 0.05);

    expect(ref001.puckPosition.sub(fine.puckPosition).magnitude()).toBeLessThan(1e-4);
    expect(Math.abs(ref001.cumulativeThermalDissipation - fine.cumulativeThermalDissipation)).toBeLessThan(1e-4);
    expect(fine.puckPosition.sub(frame60.puckPosition).magnitude()).toBeLessThan(1e-3);
    expect(fine.puckPosition.sub(coarse.puckPosition).magnitude()).toBeLessThan(2e-3);
    expect(Math.abs(fine.cumulativeThermalDissipation - frame60.cumulativeThermalDissipation)).toBeLessThan(1e-3);
  });
});

describe('CircularMotionDynamics — Task B: Vertical Circle & Taut Events', () => {
  it('avoids false slackening at exact critical speeds √(2gR) and √(5gR), and slackens genuinely just below √(5gR)', () => {
    const R = 1.5;
    const g = CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY;
    const crit = computeVerticalCircleCriticalSpeeds(R, g);

    // 1. Exact v0 = √(2gR): horizontal-threshold turning cleanly without slackening
    const horizParams = makeVerticalParams({
      radius: R,
      initialSpeed: crit.horizontalThreshold,
      linkageType: 'flexible-string',
      gravity: g,
    });
    let horizState = createInitialVerticalCircleState(horizParams);
    let maxThetaHoriz = 0;
    for (let i = 0; i < 600; i++) {
      horizState = stepVerticalCircleState(horizState, horizParams, 1 / 60);
      maxThetaHoriz = Math.max(maxThetaHoriz, horizState.thetaRad);
      expect(horizState.slackeningCount).toBe(0);
      expect(horizState.phase).toBe('circular');
    }
    expect(maxThetaHoriz).toBeCloseTo(Math.PI / 2, 4);

    // 2. Exact v0 = √(5gR): completes multiple loops without false top slackening
    const loopParams = makeVerticalParams({
      radius: R,
      initialSpeed: crit.flexibleStringLoop,
      linkageType: 'flexible-string',
      gravity: g,
    });
    let loopState = createInitialVerticalCircleState(loopParams);
    const initialEnergyLoop = loopState.totalMechanicalEnergy;
    for (let i = 0; i < 600; i++) {
      loopState = stepVerticalCircleState(loopState, loopParams, 1 / 60);
      expect(loopState.slackeningCount).toBe(0);
      expect(loopState.phase).toBe('circular');
      expect(loopState.tension).toBeGreaterThanOrEqual(0);
    }
    expect(loopState.thetaRad).toBeGreaterThan(2 * Math.PI);
    expect(loopState.totalMechanicalEnergy).toBeCloseTo(initialEnergyLoop, 6);

    // 3. Just below √(5gR): genuine slackening occurs near the top (tested at -0.01 and -1e-4 m/s)
    for (const delta of [0.01, 1e-4]) {
      const justBelowParams = makeVerticalParams({
        radius: R,
        initialSpeed: crit.flexibleStringLoop - delta,
        linkageType: 'flexible-string',
        gravity: g,
      });
      let subLoopState = createInitialVerticalCircleState(justBelowParams);
      subLoopState = advanceVerticalForDuration(subLoopState, justBelowParams, 2.0, 0.002);
      expect(subLoopState.slackeningCount).toBeGreaterThanOrEqual(1);
      const slackEv = subLoopState.events.find((e) => e.type === 'slackening');
      expect(slackEv).toBeDefined();
      expect(slackEv!.angleRad).toBeGreaterThan((170 * Math.PI) / 180);
    }

    // 4. At rest v0 = 0 stays stationary at bottom with T = mg
    const restParams = makeVerticalParams({ radius: R, initialSpeed: 0, mass: 2.0, gravity: g });
    const restAfter = stepVerticalCircleState(createInitialVerticalCircleState(restParams), restParams, 1.5);
    expect(restAfter.phase).toBe('at-rest');
    expect(restAfter.position.x).toBe(0);
    expect(restAfter.position.y).toBe(-R);
    expect(restAfter.tension).toBeCloseTo(2.0 * g, 12);
  });

  it('matches closed-form parabolic projectile trajectory after release and excludes the initial release root', () => {
    const R = 1.5;
    const g = CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY;
    const v0 = Math.sqrt(3.5 * g * R);
    const params = makeVerticalParams({
      radius: R,
      initialSpeed: v0,
      mass: 1.0,
      linkageType: 'flexible-string',
      gravity: g,
    });

    const regime = classifyVerticalCircleRegime(params);
    expect(regime.regime).toBe('slackening');
    expect(regime.slackAngleRad).not.toBeNull();

    let state = createInitialVerticalCircleState(params);
    const initialEnergy = state.totalMechanicalEnergy;

    // Advance until slackening just occurs
    let enteredProjectile = false;
    for (let i = 0; i < 2000; i++) {
      state = stepVerticalCircleState(state, params, 0.002);
      if (state.phase === 'projectile') {
        enteredProjectile = true;
        break;
      }
    }
    expect(enteredProjectile).toBe(true);
    expect(state.slackeningCount).toBe(1);
    const slackEvent = state.events[0]!;
    expect(slackEvent.type).toBe('slackening');
    expect(slackEvent.angleRad).toBeCloseTo(regime.slackAngleRad!, 5);

    // Immediately probe tiny steps after release to verify initial root exclusion
    for (let j = 0; j < 20; j++) {
      state = stepVerticalCircleState(state, params, 1e-4);
      expect(state.phase).toBe('projectile');
      expect(state.tautImpactCount).toBe(0);
      expect(state.radialDistance).toBeLessThan(R);
      expect(state.tension).toBe(0);
    }
    expect(state.hasEnteredInteriorDuringFlight).toBe(true);

    // Step another 0.20 s during free ballistic flight and verify exact closed-form parabola
    state = advanceVerticalForDuration(state, params, 0.2, 0.002);
    expect(state.phase).toBe('projectile');
    const flightDt = state.time - slackEvent.time;
    const velAtSlack = new Vector2(
      slackEvent.speedBefore * Math.cos(slackEvent.angleRad),
      slackEvent.speedBefore * Math.sin(slackEvent.angleRad)
    );
    const expectedPos = new Vector2(
      slackEvent.position.x + velAtSlack.x * flightDt,
      slackEvent.position.y + velAtSlack.y * flightDt - 0.5 * g * flightDt * flightDt
    );
    const expectedVel = new Vector2(velAtSlack.x, velAtSlack.y - g * flightDt);

    expect(state.position.sub(expectedPos).magnitude()).toBeLessThan(1e-10);
    expect(state.velocity.sub(expectedVel).magnitude()).toBeLessThan(1e-10);
    expect(state.radialDistance).toBeLessThan(R - 0.05);
    expect(state.totalMechanicalEnergy).toBeCloseTo(initialEnergy, 7);

    // Confirm Phase 1 analytical circular reference does NOT replace actual projectile position
    const refAngleEval = evaluateVerticalCircleAtAngle(params, regime.slackAngleRad! + 0.05);
    expect(refAngleEval.isPostSlackDeparted).toBe(true);
    expect(refAngleEval.circularReference?.position.magnitude()).toBeCloseTo(R, 12);
    expect(state.position.sub(refAngleEval.circularReference!.position).magnitude()).toBeGreaterThan(0.1);
  });

  it('localizes subsequent taut-string event within 1e-6 s, preserves tangential speed, removes radial speed and accounts energy loss', () => {
    const R = 1.2;
    const g = CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY;
    const v0 = Math.sqrt(3.2 * g * R);
    const params = makeVerticalParams({
      radius: R,
      initialSpeed: v0,
      mass: 2.0,
      linkageType: 'flexible-string',
      gravity: g,
    });

    // Compare fine (0.002 s) vs 60fps (1/60 s) vs coarse (0.05 s) outer steps
    const runUntilImpact = (outerDt: number): VerticalCircleDynamicState => {
      let s = createInitialVerticalCircleState(params);
      const maxSteps = Math.ceil(5.0 / outerDt);
      for (let i = 0; i < maxSteps; i++) {
        s = stepVerticalCircleState(s, params, outerDt);
        if (s.tautImpactCount >= 1) {
          return s;
        }
      }
      throw new Error('Expected taut impact within 5 s');
    };

    const ref001State = runUntilImpact(0.001);
    const fineState = runUntilImpact(0.002);
    const frame60State = runUntilImpact(1 / 60);
    const coarseState = runUntilImpact(0.05);

    const ref001Impact = ref001State.events.find((e) => e.type === 'taut-impact')!;
    const fineSlack = fineState.events.find((e) => e.type === 'slackening')!;
    const fineImpact = fineState.events.find((e) => e.type === 'taut-impact')!;
    const frame60Impact = frame60State.events.find((e) => e.type === 'taut-impact')!;
    const coarseImpact = coarseState.events.find((e) => e.type === 'taut-impact')!;

    // Verify exact closed-form parabolic radius error at localized taut event time
    const flightDuration = fineImpact.time - fineSlack.time;
    const launchVel = new Vector2(
      fineSlack.speedBefore * Math.cos(fineSlack.angleRad),
      fineSlack.speedBefore * Math.sin(fineSlack.angleRad)
    );
    const ballisticAtHit = new Vector2(
      fineSlack.position.x + launchVel.x * flightDuration,
      fineSlack.position.y + launchVel.y * flightDuration - 0.5 * g * flightDuration * flightDuration
    );
    const radialResidual = Math.abs(ballisticAtHit.magnitude() - R);
    const estimatedTimeError = radialResidual / Math.max(1e-6, fineImpact.radialSpeedBefore);
    expect(estimatedTimeError).toBeLessThan(1e-8);
    expect(estimatedTimeError).toBeLessThan(1e-6);

    // Convergence against 0.001 s stepping and outer step invariance (unconsumed time preserved)
    expect(Math.abs(fineImpact.time - ref001Impact.time)).toBeLessThan(1e-7);
    expect(Math.abs(fineImpact.time - frame60Impact.time)).toBeLessThan(1e-6);
    expect(Math.abs(fineImpact.time - coarseImpact.time)).toBeLessThan(1e-6);

    // Radial removal, tangential preservation, energy loss, and admissible circular resumption
    expect(fineImpact.radialSpeedBefore).toBeGreaterThan(0);
    expect(fineImpact.speedAfter).toBeCloseTo(Math.abs(fineImpact.tangentialSpeed), 10);
    const expectedLoss = 0.5 * params.mass * fineImpact.radialSpeedBefore * fineImpact.radialSpeedBefore;
    expect(fineImpact.energyLost).toBeCloseTo(expectedLoss, 8);
    expect(fineImpact.tensionAfter).toBeGreaterThanOrEqual(0);
    expect(fineState.phase).toBe('circular');
    expect(fineState.immediateReslackenCount).toBe(0);

    // Global energy conservation accounting: E_initial - E_current === cumulativeEnergyLost
    const initE = createInitialVerticalCircleState(params).totalMechanicalEnergy;
    expect(initE - fineState.totalMechanicalEnergy).toBeCloseTo(fineState.cumulativeEnergyLost, 6);
  });

  it('triggers immediate re-slackening cleanly when post-impact required tension is inadmissible (T_post < -ε_T)', () => {
    const R = 1.5;
    const g = 9.8;
    const params = makeVerticalParams({
      radius: R,
      initialSpeed: 6.0,
      mass: 1.0,
      linkageType: 'flexible-string',
      gravity: g,
    });

    // Launch projectile inside upper semicircle traveling nearly straight upward (tiny tangential speed)
    // so it strikes top arc outward with T_post ≈ m(v_θ²/R + g cos θ*) < 0.
    let state = createInitialVerticalCircleState(params, {
      initialPhase: 'projectile',
      initialPosition: new Vector2(0.05, 0.8 * R),
      initialVelocity: new Vector2(0.05, 5.0),
    });
    expect(state.phase).toBe('projectile');

    for (let i = 0; i < 500; i++) {
      state = stepVerticalCircleState(state, params, 0.002);
      if (state.tautImpactCount >= 1) {
        break;
      }
    }

    expect(state.tautImpactCount).toBeGreaterThanOrEqual(1);
    expect(state.immediateReslackenCount).toBeGreaterThanOrEqual(1);
    const impactEv = state.events.find((e) => e.type === 'taut-impact')!;
    const reslackenEv = state.events.find((e) => e.type === 'immediate-reslacken');
    expect(reslackenEv).toBeDefined();
    expect(impactEv.tensionAfter).toBe(0);
    expect(reslackenEv!.time).toBe(impactEv.time);

    // Must remain in free projectile flight rather than forcing impossible negative string tension
    expect(state.phase).toBe('projectile');
    expect(state.tension).toBe(0);

    // Continue stepping to verify bob drops back inside circle, falls, and eventually re-attaches cleanly in lower arc
    state = advanceVerticalForDuration(state, params, 2.0, 0.002);
    expect(Number.isFinite(state.position.x)).toBe(true);
    expect(state.radialDistance).toBeLessThanOrEqual(R + 1e-9);
    expect(state.tautImpactCount).toBeGreaterThanOrEqual(2);
    expect(state.phase).toBe('circular');
  });

  it('maintains long-horizon stability across repeated slackening and taut-impact events until converging below 2mgR', () => {
    const R = 1.0;
    const g = 9.8;
    // v0 just under √(5gR) starts with repeated high-arc slackening cycles that gradually lose radial energy
    const params = makeVerticalParams({
      radius: R,
      initialSpeed: Math.sqrt(4.7 * g * R),
      mass: 1.0,
      linkageType: 'flexible-string',
      gravity: g,
    });

    let state = createInitialVerticalCircleState(params);
    const initE = state.totalMechanicalEnergy;
    let prevLoss = 0;

    for (let i = 0; i < 1200; i++) {
      state = stepVerticalCircleState(state, params, 1 / 60);
      expect(Number.isFinite(state.position.x)).toBe(true);
      expect(Number.isFinite(state.position.y)).toBe(true);
      expect(state.radialDistance).toBeLessThanOrEqual(R + 1e-6);
      expect(state.cumulativeEnergyLost).toBeGreaterThanOrEqual(prevLoss);
      prevLoss = state.cumulativeEnergyLost;
    }

    expect(state.slackeningCount).toBeGreaterThanOrEqual(2);
    expect(state.tautImpactCount).toBeGreaterThanOrEqual(2);
    expect(state.phase).toBe('circular');
    expect(state.totalMechanicalEnergy).toBeLessThan(2 * params.mass * g * R);
    expect(initE - state.totalMechanicalEnergy).toBeCloseTo(state.cumulativeEnergyLost, 5);
  });

  it('handles rigid-rod asymptotic separatrix without crossing θ = π and conserves circular energy', () => {
    const R = 1.5;
    const g = 9.8;
    const crit = computeVerticalCircleCriticalSpeeds(R, g);

    // Rigid rod asymptotic separatrix v0 = 2√(gR)
    const sepParams = makeVerticalParams({
      radius: R,
      initialSpeed: crit.rigidRodSeparatrix,
      mass: 1.0,
      linkageType: 'rigid-rod',
      gravity: g,
    });
    let sepState = createInitialVerticalCircleState(sepParams);
    expect(sepState.phase).toBe('asymptotic-separatrix');
    const sepEnergy = sepState.totalMechanicalEnergy;

    let prevTheta = -1;
    for (let i = 0; i < 600; i++) {
      sepState = stepVerticalCircleState(sepState, sepParams, 0.05);
      if (i < 200) {
        expect(sepState.thetaRad).toBeGreaterThan(prevTheta);
      } else {
        expect(sepState.thetaRad).toBeGreaterThanOrEqual(prevTheta);
      }
      expect(sepState.thetaRad).toBeLessThanOrEqual(Math.PI);
      prevTheta = sepState.thetaRad;
    }
    expect(sepState.thetaRad).toBeGreaterThan(3.14);
    expect(sepState.thetaRad).toBeLessThanOrEqual(Math.PI);
    expect(sepState.totalMechanicalEnergy).toBeCloseTo(sepEnergy, 8);
    expect(sepState.isInCompression).toBe(true);
    expect(sepState.tension).toBeCloseTo(-sepParams.mass * g, 3);

    // Rigid rod inverted-oscillatory compression check
    const invParams = makeVerticalParams({
      radius: R,
      initialSpeed: 0.5 * (crit.horizontalThreshold + crit.rigidRodSeparatrix),
      mass: 1.0,
      linkageType: 'rigid-rod',
      gravity: g,
    });
    const invInit = createInitialVerticalCircleState(invParams);
    const invEnd = advanceVerticalForDuration(invInit, invParams, 6.0, 0.002);
    expect(invEnd.phase).toBe('circular');
    expect(invEnd.slackeningCount).toBe(0);
    expect(invEnd.totalMechanicalEnergy).toBeCloseTo(invInit.totalMechanicalEnergy, 6);
  });

  it('detects per-step event overflow cleanly while retaining bounded history and unconsumed time', () => {
    const R = 0.5;
    const g = 9.8;
    // Very near √(5gR) has tiny ΔE_lost ~ (1 - c²)³ per cycle, yielding > 64 events over a huge single outer step
    const params = makeVerticalParams({
      radius: R,
      initialSpeed: Math.sqrt(4.97 * g * R),
      mass: 1.0,
      linkageType: 'flexible-string',
      gravity: g,
    });

    const init = createInitialVerticalCircleState(params);
    const bigDt = 100.0;
    const capped = stepVerticalCircleState(init, params, bigDt);

    expect(capped.maxEventsPerStepReached).toBe(true);
    expect(capped.unconsumedTimeAfterOverflow).toBeGreaterThan(0);
    expect(capped.unconsumedTimeAfterOverflow).toBeLessThan(bigDt);
    expect(capped.time).toBeCloseTo(bigDt - capped.unconsumedTimeAfterOverflow, 10);
    expect(capped.totalEventsRecorded).toBeGreaterThanOrEqual(DYNAMICS_CONSTANTS.MAX_EVENTS_PER_STEP);

    // Resuming with remaining unconsumed time advances smoothly to full duration
    let resumed = stepVerticalCircleState(capped, params, capped.unconsumedTimeAfterOverflow);
    while (resumed.maxEventsPerStepReached && resumed.unconsumedTimeAfterOverflow > 0) {
      resumed = stepVerticalCircleState(resumed, params, resumed.unconsumedTimeAfterOverflow);
    }
    expect(resumed.maxEventsPerStepReached).toBe(false);
    expect(resumed.unconsumedTimeAfterOverflow).toBe(0);
    expect(resumed.time).toBeCloseTo(bigDt, 10);

    // Verify bounded history retains only MAX_EVENT_HISTORY most recent records across >256 events
    const historyParams = makeVerticalParams({
      radius: R,
      initialSpeed: Math.sqrt(4.99 * g * R),
      mass: 1.0,
      linkageType: 'flexible-string',
      gravity: g,
    });
    let longRun = createInitialVerticalCircleState(historyParams);
    for (let i = 0; i < 40 && longRun.totalEventsRecorded <= DYNAMICS_CONSTANTS.MAX_EVENT_HISTORY + 10; i++) {
      longRun = stepVerticalCircleState(longRun, historyParams, 10.0);
    }
    expect(longRun.totalEventsRecorded).toBeGreaterThan(DYNAMICS_CONSTANTS.MAX_EVENT_HISTORY);
    expect(longRun.events.length).toBe(DYNAMICS_CONSTANTS.MAX_EVENT_HISTORY);
    expect(longRun.eventHistoryTruncated).toBe(true);
    // Most recent retained event corresponds to latest lifetime event timestamps
    expect(longRun.events[longRun.events.length - 1]!.time).toBeGreaterThan(
      longRun.events[0]!.time
    );
  });
});

