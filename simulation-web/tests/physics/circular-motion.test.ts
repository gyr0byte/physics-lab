import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../src/core/Vector2';
import {
  CIRCULAR_MOTION_CONSTANTS,
  DEFAULT_HORIZONTAL_PARAMS,
  DEFAULT_VERTICAL_PARAMS,
  DEFAULT_BANKED_PARAMS,
  DEFAULT_CONICAL_PARAMS,
  HORIZONTAL_PARAM_RANGES,
  VERTICAL_PARAM_RANGES,
  BANKED_PARAM_RANGES,
  CONICAL_PARAM_RANGES,
  validateHorizontalCircularParams,
  clampHorizontalCircularParams,
  validateVerticalCircleParams,
  clampVerticalCircleParams,
  validateBankedCurveParams,
  clampBankedCurveParams,
  validateConicalPendulumParams,
  clampConicalPendulumParams,
  evaluateHorizontalKinematicsState,
  evaluateHorizontalKinematicsAtTime,
  computeTetherForces,
  computeTurntableBreakawayThreshold,
  evaluateTurntableFriction,
  computeVerticalCircleCriticalSpeeds,
  computeEnergyRadicand,
  classifyVerticalCircleRegime,
  evaluateVerticalCircleAtAngle,
  evaluateVerticalTautImpulse,
  computeBankedCurveSpeedLimits,
  evaluateBankedCurve,
  evaluateConicalPendulum,
  type HorizontalCircularParams,
  type VerticalCircleParams,
  type BankedCurveParams,
  type ConicalPendulumParams,
} from '../../src/physics/CircularMotionPhysics';

describe('CircularMotionPhysics — Official Nepal CDC Grade 11 Chapter 6', () => {
  const g = CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY;

  // ==========================================================================
  // CM-INV-01: Angular-to-Linear Kinematics (Signed vs Scalar Speed)
  // ==========================================================================
  describe('CM-INV-01: Angular-to-linear kinematics (s = rθ, v_t = rω, v = r|ω|, a_t = rα)', () => {
    it('satisfies s = rθ, v_t = rω, v = r|ω|, a_t = rα within 1e-9 for positive and negative ω, α', () => {
      const cases = [
        { r: 2.0, theta: Math.PI / 6, omega: 3.5, alpha: 1.2 },
        { r: 2.5, theta: -Math.PI / 3, omega: -4.0, alpha: 2.0 },
        { r: 1.2, theta: (3 * Math.PI) / 4, omega: 2.0, alpha: -3.5 },
        { r: 3.0, theta: 0, omega: 0, alpha: -1.5 },
      ];

      for (const c of cases) {
        const res = evaluateHorizontalKinematicsState(c.r, c.theta, c.omega, c.alpha);
        expect(res.arcDisplacement).toBeCloseTo(c.r * c.theta, 9);
        expect(res.tangentialVelocity).toBeCloseTo(c.r * c.omega, 9);
        expect(res.speed).toBeCloseTo(c.r * Math.abs(c.omega), 9);
        expect(res.tangentialAccelerationMag).toBeCloseTo(c.r * c.alpha, 9);
        expect(res.velocityVector.magnitude()).toBeCloseTo(res.speed, 9);
      }
    });

    it('properly distinguishes signed tangential velocity from non-negative scalar speed', () => {
      const cw = evaluateHorizontalKinematicsState(2.0, Math.PI / 4, -3.0, 0);
      expect(cw.tangentialVelocity).toBeCloseTo(-6.0, 9);
      expect(cw.speed).toBeCloseTo(6.0, 9);
      // Points along -θ_hat when ω < 0
      expect(cw.velocityVector.dot(cw.tangentUnit)).toBeCloseTo(-6.0, 9);
    });

    it('computes exact analytical ω(t) and θ(t) under constant angular acceleration', () => {
      const params: HorizontalCircularParams = {
        ...DEFAULT_HORIZONTAL_PARAMS,
        radius: 1.5,
        initialAngularVelocity: -2.0,
        angularAcceleration: 4.0,
      };
      const t = 1.5;
      const res = evaluateHorizontalKinematicsAtTime(params, t, 0.25);
      const expectedOmega = -2.0 + 4.0 * 1.5; // +4.0 rad/s
      const expectedTheta = 0.25 + -2.0 * 1.5 + 0.5 * 4.0 * 1.5 * 1.5; // 1.75 rad

      expect(res.angularVelocity).toBeCloseTo(expectedOmega, 9);
      expect(res.thetaRad).toBeCloseTo(expectedTheta, 9);
      expect(res.tangentialVelocity).toBeCloseTo(1.5 * expectedOmega, 9);
      expect(res.arcDisplacement).toBeCloseTo(1.5 * expectedTheta, 9);
    });
  });

  // ==========================================================================
  // CM-INV-02: Centripetal Acceleration Magnitude & Inward Radial Direction
  // ==========================================================================
  describe('CM-INV-02: Centripetal acceleration a_c = v²/r = rω² and a_c_vec = -rω² r_hat', () => {
    it('directs a_c radially inward across arbitrary r > 0, angles, and signed ω', () => {
      const radii = [0.25, 0.5, 2.0, 5.0];
      const omegas = [-6.0, -1.5, 0, 2.0, 8.5];
      const angles = [0, Math.PI / 6, (2 * Math.PI) / 3, -Math.PI / 2, (5 * Math.PI) / 4];

      for (const r of radii) {
        for (const omega of omegas) {
          for (const theta of angles) {
            const res = evaluateHorizontalKinematicsState(r, theta, omega, 0);
            const expectedAc = r * omega * omega;

            expect(res.centripetalAccelerationMag).toBeCloseTo(expectedAc, 9);
            expect((res.speed * res.speed) / r).toBeCloseTo(expectedAc, 9);

            // Vector must equal -r * ω² * r_hat
            const expectedVec = res.radialUnit.scale(-expectedAc);
            expect(res.centripetalAccelerationVector.x).toBeCloseTo(expectedVec.x, 9);
            expect(res.centripetalAccelerationVector.y).toBeCloseTo(expectedVec.y, 9);

            // Strictly inward regardless of ω sign
            expect(res.centripetalAccelerationVector.dot(res.radialUnit)).toBeCloseTo(-expectedAc, 9);
            expect(res.centripetalAccelerationVector.dot(res.tangentUnit)).toBeCloseTo(0, 9);
          }
        }
      }
    });

    it('clamps r < 0.10 m to MIN_SAFE_RADIUS to avoid v²/r singularity', () => {
      const res = evaluateHorizontalKinematicsState(0.0, Math.PI / 4, 4.0, 1.0);
      expect(res.radius).toBe(CIRCULAR_MOTION_CONSTANTS.MIN_SAFE_RADIUS);
      expect(Number.isFinite(res.centripetalAccelerationMag)).toBe(true);
      expect(res.centripetalAccelerationMag).toBeCloseTo(0.10 * 16.0, 9);
    });
  });

  // ==========================================================================
  // CM-INV-03: Non-Uniform Circular Motion Orthogonal Acceleration & Tether
  // ==========================================================================
  describe('CM-INV-03: Non-uniform resultant acceleration & orthogonal decomposition', () => {
    it('satisfies a = a_c + a_t and |a|² = a_c² + a_t² for arbitrary signed ω and α ≠ 0', () => {
      const combos = [
        { r: 2.0, theta: Math.PI / 3, omega: 3.0, alpha: 4.0 },
        { r: 2.0, theta: Math.PI / 3, omega: -3.0, alpha: 4.0 },
        { r: 1.5, theta: -Math.PI / 5, omega: 2.5, alpha: -3.2 },
        { r: 3.2, theta: 2.4, omega: -4.0, alpha: -2.5 },
      ];

      for (const c of combos) {
        const res = evaluateHorizontalKinematicsState(c.r, c.theta, c.omega, c.alpha);

        // Orthogonality
        expect(res.centripetalAccelerationVector.dot(res.tangentialAccelerationVector)).toBeCloseTo(
          0,
          9
        );

        // Vector sum
        const sumVec = res.centripetalAccelerationVector.add(res.tangentialAccelerationVector);
        expect(res.resultantAccelerationVector.x).toBeCloseTo(sumVec.x, 9);
        expect(res.resultantAccelerationVector.y).toBeCloseTo(sumVec.y, 9);

        // Pythagorean magnitude
        const magSq =
          res.resultantAccelerationVector.x * res.resultantAccelerationVector.x +
          res.resultantAccelerationVector.y * res.resultantAccelerationVector.y;
        const expectedMagSq =
          res.centripetalAccelerationMag * res.centripetalAccelerationMag +
          res.tangentialAccelerationMag * res.tangentialAccelerationMag;
        expect(magSq).toBeCloseTo(expectedMagSq, 9);
        expect(res.resultantAccelerationMag).toBeCloseTo(
          c.r * Math.sqrt(c.omega ** 4 + c.alpha ** 2),
          9
        );
      }
    });

    it('computes exact Tether cord radial tension and tangential actuator forces', () => {
      const mass = 1.5;
      const kin = evaluateHorizontalKinematicsState(2.0, Math.PI / 6, -3.0, 2.0);
      const tether = computeTetherForces(kin, mass);

      expect(tether.radialTension).toBeCloseTo(mass * 2.0 * 9.0, 9); // 27 N
      expect(tether.tangentialForce).toBeCloseTo(mass * 2.0 * 2.0, 9); // 6 N
      expect(tether.netForceMag).toBeCloseTo(Math.hypot(27, 6), 9);
      expect(tether.netForceVector.magnitude()).toBeCloseTo(tether.netForceMag, 9);
    });
  });

  // ==========================================================================
  // CM-INV-04: Turntable Breakaway, Acceleration Signs & Friction Transition
  // (Note: time-domain kinetic-slip trajectory integration belongs to Phase 2)
  // ==========================================================================
  describe('CM-INV-04: Turntable breakaway, acceleration signs, 0/0 slip resolution & restick', () => {
    const turntableParams: HorizontalCircularParams = {
      ...DEFAULT_HORIZONTAL_PARAMS,
      radius: 2.0,
      mass: 1.0,
      staticFriction: 0.50,
      kineticFriction: 0.35,
      attachmentMode: 'friction-surface',
      gravity: g,
    };

    it('correctly handles r|α| < μs·g, exact r|α| = μs·g incipient boundary, and r|α| > μs·g at rest', () => {
      const r = 2.0;
      const muS = 0.50;
      const maxAccel = muS * g; // 4.9 m/s²
      const alphaCrit = maxAccel / r; // 2.45 rad/s²

      // 1. r|α| < μs·g: static adherence possible at rest
      const below = computeTurntableBreakawayThreshold(r, muS, alphaCrit * (1 - 1e-6), g);
      expect(below.canAdhereAtRest).toBe(true);
      expect(below.isIncipientAtRest).toBe(false);
      expect(below.breaksImmediatelyFromRest).toBe(false);
      expect(below.criticalAngularSpeed).not.toBeNull();
      expect(below.criticalAngularSpeed!).toBeGreaterThan(0);

      // 2. r|α| = μs·g: exact incipient-slip boundary at ω = 0, NOT breakaway
      const exact = computeTurntableBreakawayThreshold(r, muS, alphaCrit, g);
      expect(exact.canAdhereAtRest).toBe(true);
      expect(exact.isIncipientAtRest).toBe(true);
      expect(exact.breaksImmediatelyFromRest).toBe(false);
      expect(exact.criticalAngularSpeed).toBe(0);

      const evalExactAtRest = evaluateTurntableFriction(
        turntableParams,
        new Vector2(r, 0),
        Vector2.zero(),
        0,
        alphaCrit
      );
      expect(evalExactAtRest.isBreakaway).toBe(false);
      expect(evalExactAtRest.regime).toBe('static');
      expect(evalExactAtRest.canRestick).toBe(true);

      // Negative α equality behaves identically
      const exactNeg = computeTurntableBreakawayThreshold(r, muS, -alphaCrit, g);
      expect(exactNeg.canAdhereAtRest).toBe(true);
      expect(exactNeg.isIncipientAtRest).toBe(true);
      expect(exactNeg.breaksImmediatelyFromRest).toBe(false);
      expect(exactNeg.criticalAngularSpeed).toBe(0);

      // 3. r|α| > μs·g: immediate breakaway from rest
      const above = computeTurntableBreakawayThreshold(r, muS, alphaCrit * (1 + 1e-6), g);
      expect(above.canAdhereAtRest).toBe(false);
      expect(above.isIncipientAtRest).toBe(false);
      expect(above.breaksImmediatelyFromRest).toBe(true);
      expect(above.criticalAngularSpeed).toBeNull();

      const evalAboveAtRest = evaluateTurntableFriction(
        turntableParams,
        new Vector2(r, 0),
        Vector2.zero(),
        0,
        alphaCrit * (1 + 1e-6)
      );
      expect(evalAboveAtRest.isBreakaway).toBe(true);
      expect(evalAboveAtRest.regime).toBe('incipient-slip');
    });

    it('verifies breakaway at exact, just-below, and just-above ω_crit for α = 0 and α ≠ 0', () => {
      const thresholdZeroAlpha = computeTurntableBreakawayThreshold(2.0, 0.50, 0, g);
      const omegaCrit = thresholdZeroAlpha.criticalAngularSpeed!; // √(4.9 / 2.0) = √2.45
      expect(omegaCrit).toBeCloseTo(Math.sqrt((0.50 * g) / 2.0), 9);

      const pos = new Vector2(2.0, 0);

      // Exact ω_crit: holds statically (within machine precision tolerance)
      const evalExact = evaluateTurntableFriction(
        turntableParams,
        pos,
        new Vector2(0, 2.0 * omegaCrit),
        omegaCrit,
        0
      );
      expect(evalExact.isBreakaway).toBe(false);
      expect(evalExact.regime).toBe('static');

      // Just below and just above ω_crit (including tight 1e-12 relative perturbation)
      for (const relEps of [1e-9, 1e-12]) {
        const omegaBelow = omegaCrit * (1 - relEps);
        const evalBelow = evaluateTurntableFriction(
          turntableParams,
          pos,
          new Vector2(0, 2.0 * omegaBelow),
          omegaBelow,
          0
        );
        expect(evalBelow.isBreakaway).toBe(false);
        expect(evalBelow.regime).toBe('static');

        const omegaAbove = omegaCrit * (1 + relEps);
        const evalAbove = evaluateTurntableFriction(
          turntableParams,
          pos,
          new Vector2(0, 2.0 * omegaAbove),
          omegaAbove,
          0
        );
        expect(evalAbove.isBreakaway).toBe(true);
        expect(evalAbove.regime).toBe('incipient-slip');
      }
    });

    it('verifies turntable surface acceleration signs for signed ω, α and resolves v_rel = 0 singularity', () => {
      // Position at 30° on r = 2.0 m
      const theta = Math.PI / 6;
      const r = 2.0;
      const pos = new Vector2(r * Math.cos(theta), r * Math.sin(theta));
      const omega = -2.0; // CW spin
      const alpha = 3.0;  // CCW angular acceleration (slowing CW spin)

      // Co-rotating puck velocity: v_surface = (-ω y, ω x)
      const vSurfaceExpected = new Vector2(-omega * pos.y, omega * pos.x);
      const kin = evaluateHorizontalKinematicsState(r, theta, omega, alpha);

      const res = evaluateTurntableFriction(turntableParams, pos, vSurfaceExpected, omega, alpha);

      // Surface acceleration matches exact polar kinematics (-rω² r_hat + rα θ_hat)
      expect(res.surfaceVelocity.x).toBeCloseTo(kin.velocityVector.x, 9);
      expect(res.surfaceVelocity.y).toBeCloseTo(kin.velocityVector.y, 9);
      expect(res.surfaceAcceleration.x).toBeCloseTo(kin.resultantAccelerationVector.x, 9);
      expect(res.surfaceAcceleration.y).toBeCloseTo(kin.resultantAccelerationVector.y, 9);

      // |a_surface| = 2 * sqrt(16 + 9) = 10 > μs*g = 4.9 => breakaway
      expect(res.surfaceAccelerationMag).toBeCloseTo(10.0, 9);
      expect(res.isBreakaway).toBe(true);
      expect(res.regime).toBe('incipient-slip');

      // Incipient slip unit vector u_slip = -a_surface / |a_surface|
      const expectedUSlip = res.surfaceAcceleration.scale(-1 / res.surfaceAccelerationMag);
      expect(res.slipDirectionUnit!.x).toBeCloseTo(expectedUSlip.x, 9);
      expect(res.slipDirectionUnit!.y).toBeCloseTo(expectedUSlip.y, 9);

      // Initial F_k = +μk*m*g * (a_surface / |a_surface|)
      const fkMag = turntableParams.mass * turntableParams.kineticFriction * g; // 3.43 N
      const expectedFk = res.surfaceAcceleration.scale(fkMag / res.surfaceAccelerationMag);
      expect(res.frictionForce.x).toBeCloseTo(expectedFk.x, 9);
      expect(res.frictionForce.y).toBeCloseTo(expectedFk.y, 9);

      // Relative acceleration at onset: a_rel = -(1 - μk*g / |a_surface|) * a_surface
      const scaleRel = -(1 - (turntableParams.kineticFriction * g) / res.surfaceAccelerationMag);
      expect(res.relativeAccelerationAtOnset!.x).toBeCloseTo(
        scaleRel * res.surfaceAcceleration.x,
        9
      );
      expect(res.relativeAccelerationAtOnset!.y).toBeCloseTo(
        scaleRel * res.surfaceAcceleration.y,
        9
      );
    });

    it('transitions to F_k = -μk*m*g*(v_rel/|v_rel|) for |v_rel| > ε_v and allows restick when slowed & |a_surf| <= μs·g', () => {
      const pos = new Vector2(2.0, 0);
      const omega = 2.0;
      const vSurface = new Vector2(0, 4.0);

      // Active kinetic slip: v_rel = (0.3, -0.4), |v_rel| = 0.5 > 1e-4
      const puckVelSlip = vSurface.add(new Vector2(0.3, -0.4));
      const slipRes = evaluateTurntableFriction(turntableParams, pos, puckVelSlip, omega, 0);
      expect(slipRes.regime).toBe('kinetic-slip');
      expect(slipRes.isBreakaway).toBe(true);
      expect(slipRes.canRestick).toBe(false);

      const fkMag = turntableParams.mass * turntableParams.kineticFriction * g;
      expect(slipRes.frictionForce.x).toBeCloseTo(-fkMag * (0.3 / 0.5), 9);
      expect(slipRes.frictionForce.y).toBeCloseTo(-fkMag * (-0.4 / 0.5), 9);

      // Resticking condition: |v_rel| <= ε_v AND |a_surface| <= μs·g
      const omegaSafe = 1.2; // |a_surf| = 2 * 1.44 = 2.88 <= 4.9
      const vSurfSafe = new Vector2(0, 2.0 * omegaSafe);
      const nearSyncVel = vSurfSafe.add(new Vector2(5e-5, 0)); // |v_rel| = 5e-5 <= 1e-4
      const restickRes = evaluateTurntableFriction(turntableParams, pos, nearSyncVel, omegaSafe, 0);
      expect(restickRes.regime).toBe('static');
      expect(restickRes.canRestick).toBe(true);
      expect(restickRes.isBreakaway).toBe(false);

      // Stationary turntable at rest: zero friction
      const restRes = evaluateTurntableFriction(turntableParams, pos, Vector2.zero(), 0, 0);
      expect(restRes.regime).toBe('at-rest');
      expect(restRes.frictionForce.equals(Vector2.zero())).toBe(true);
    });
  });

  // ==========================================================================
  // CM-INV-05: Vertical Circle Tension, Energy Conservation & Radicand Tolerance
  // ==========================================================================
  describe('CM-INV-05: Vertical circle T(θ), energy conservation & energy-radicand tolerance', () => {
    const baseLoopParams: VerticalCircleParams = {
      radius: 1.5,
      initialSpeed: 9.0,
      mass: 1.0,
      linkageType: 'flexible-string',
      gravity: g,
    };

    it('verifies T(θ) = mv²/R + mg cos θ at bottom, horizontal, and top, conserving E within 0.01%', () => {
      const E0 = 0.5 * baseLoopParams.mass * baseLoopParams.initialSpeed ** 2;

      const bottom = evaluateVerticalCircleAtAngle(baseLoopParams, 0);
      expect(bottom.actualCircularSpeed).toBeCloseTo(9.0, 9);
      expect(bottom.actualTension).toBeCloseTo((1 * 81) / 1.5 + g, 9);

      const horiz = evaluateVerticalCircleAtAngle(baseLoopParams, Math.PI / 2);
      const expectedVHoriz = Math.sqrt(81 - 2 * g * 1.5);
      expect(horiz.actualCircularSpeed).toBeCloseTo(expectedVHoriz, 9);
      expect(horiz.actualTension).toBeCloseTo((1 * expectedVHoriz ** 2) / 1.5, 9);

      const top = evaluateVerticalCircleAtAngle(baseLoopParams, Math.PI);
      const expectedVTop = Math.sqrt(81 - 4 * g * 1.5);
      expect(top.actualCircularSpeed).toBeCloseTo(expectedVTop, 9);
      expect(top.actualTension).toBeCloseTo((1 * expectedVTop ** 2) / 1.5 - g, 9);

      // Sample across entire [0, 2π] verifying energy conservation well within 0.01%
      for (let i = 0; i <= 36; i++) {
        const theta = (i / 36) * 2 * Math.PI;
        const evalPt = evaluateVerticalCircleAtAngle(baseLoopParams, theta);
        expect(evalPt.isReachable).toBe(true);
        const relErr = Math.abs(evalPt.circularReference!.totalEnergy - E0) / E0;
        expect(relErr).toBeLessThan(1e-4);
      }
    });

    it('handles pure oscillatory turning angle θ_turn and strictly obeys energy-radicand tolerance ε_q = 1e-9', () => {
      const oscParams: VerticalCircleParams = {
        radius: 1.5,
        initialSpeed: 3.0, // < sqrt(2 * 9.8 * 1.5) ≈ 5.422 m/s
        mass: 1.0,
        linkageType: 'flexible-string',
        gravity: g,
      };

      const analysis = classifyVerticalCircleRegime(oscParams);
      expect(analysis.regime).toBe('oscillatory');
      expect(analysis.willSlacken).toBe(false);
      expect(analysis.completesLoop).toBe(false);

      const expectedTurn = Math.acos(1 - 9.0 / (2 * g * 1.5));
      expect(analysis.turningAngleRad).toBeCloseTo(expectedTurn, 9);
      expect(analysis.turningAngleRad!).toBeLessThan(Math.PI / 2);
      expect(computeEnergyRadicand(3.0, 1.5, analysis.turningAngleRad!, g)).toBeCloseTo(0, 9);

      // At turning angle: reachable turning boundary with T_min = mg cos θ_turn > 0
      // (Note: small positive 1-ULP radicand is never clamped, so v = O(√ε_mach) ~ 1e-8 while v² ~ 1e-15)
      const atTurn = evaluateVerticalCircleAtAngle(oscParams, analysis.turningAngleRad!);
      expect(atTurn.isReachable).toBe(true);
      expect(atTurn.actualCircularSpeed!).toBeCloseTo(0, 6);
      expect(atTurn.actualCircularSpeed! ** 2).toBeCloseTo(0, 9);
      expect(atTurn.actualTension).toBeCloseTo(g * Math.cos(analysis.turningAngleRad!), 9);
      expect(atTurn.actualTension!).toBeGreaterThan(0);

      // 1. Small POSITIVE q > 0 (1e-12) must NEVER be clamped to 0: speed = sqrt(1e-12) = 1e-6 > 0
      const targetCosPos = 1 - (9.0 - 1e-12) / (2 * g * 1.5);
      const thetaTinyPos = Math.acos(targetCosPos);
      const evalTinyPos = evaluateVerticalCircleAtAngle(oscParams, thetaTinyPos);
      expect(evalTinyPos.isReachable).toBe(true);
      expect(evalTinyPos.isAtTurningBoundary).toBe(false);
      expect(evalTinyPos.energyRadicand).toBeGreaterThan(0);
      expect(evalTinyPos.actualCircularSpeed!).toBeGreaterThan(0);
      expect(evalTinyPos.actualCircularSpeed!).toBeCloseTo(Math.sqrt(evalTinyPos.energyRadicand), 9);

      // 2. Tiny NEGATIVE roundoff in [-ε_q, 0) (q = -5e-10) clamps cleanly to turning point (v = 0)
      const targetCosTinyNeg = 1 - (9.0 + 5e-10) / (2 * g * 1.5);
      const thetaTinyNeg = Math.acos(targetCosTinyNeg);
      const evalTinyNeg = evaluateVerticalCircleAtAngle(oscParams, thetaTinyNeg);
      expect(evalTinyNeg.energyRadicand).toBeLessThan(0);
      expect(evalTinyNeg.energyRadicand).toBeGreaterThanOrEqual(
        -CIRCULAR_MOTION_CONSTANTS.ENERGY_RADICAND_EPSILON
      );
      expect(evalTinyNeg.isReachable).toBe(true);
      expect(evalTinyNeg.isAtTurningBoundary).toBe(true);
      expect(evalTinyNeg.actualCircularSpeed).toBe(0);

      // 3. Materially NEGATIVE q < -ε_q (e.g. q = -2e-9 or θ = π/2) is unreachable; never fabricates v = 0
      const targetCosUnreach = 1 - (9.0 + 2e-9) / (2 * g * 1.5);
      const thetaUnreach = Math.acos(targetCosUnreach);
      const evalUnreach = evaluateVerticalCircleAtAngle(oscParams, thetaUnreach);
      expect(evalUnreach.energyRadicand).toBeLessThan(
        -CIRCULAR_MOTION_CONSTANTS.ENERGY_RADICAND_EPSILON
      );
      expect(evalUnreach.isReachable).toBe(false);
      expect(evalUnreach.circularReference).toBeNull();
      expect(evalUnreach.actualCircularSpeed).toBeNull();
      expect(evalUnreach.actualCircularPosition).toBeNull();
      expect(evalUnreach.actualTension).toBeNull();

      const evalHorizUnreach = evaluateVerticalCircleAtAngle(oscParams, Math.PI / 2);
      expect(evalHorizUnreach.isReachable).toBe(false);
      expect(evalHorizUnreach.actualCircularSpeed).toBeNull();
    });
  });

  // ==========================================================================
  // CM-INV-06: Complete Vertical Loop Invariant T_bottom - T_top = 6mg
  // ==========================================================================
  describe('CM-INV-06: Complete loop tension invariant T_bottom - T_top = 6mg', () => {
    it('holds identically for flexible string at and above √(5gR), and rigid rod above 2√(gR)', () => {
      const radii = [0.8, 1.1, 1.5, 2.5];
      const masses = [0.5, 1.0, 3.2];

      for (const R of radii) {
        for (const m of masses) {
          const crit = computeVerticalCircleCriticalSpeeds(R, g);

          // Flexible string at exact critical √(5gR) (tests R=1.1 where sqrt^2 rounds down by 1 ULP!)
          const flexCrit = classifyVerticalCircleRegime({
            radius: R,
            initialSpeed: crit.flexibleStringLoop,
            mass: m,
            linkageType: 'flexible-string',
            gravity: g,
          });
          expect(flexCrit.regime).toBe('complete-loop');
          expect(flexCrit.completesLoop).toBe(true);
          expect(flexCrit.willSlacken).toBe(false);
          expect(flexCrit.topActualTension).toBeCloseTo(0, 9);
          expect(flexCrit.tensionDifferenceBottomMinusTop).toBeCloseTo(6 * m * g, 9);

          // Flexible string strictly above √(5gR)
          const flexFast = classifyVerticalCircleRegime({
            radius: R,
            initialSpeed: crit.flexibleStringLoop * 1.35,
            mass: m,
            linkageType: 'flexible-string',
            gravity: g,
          });
          expect(flexFast.completesLoop).toBe(true);
          expect(flexFast.topSpeed!).toBeGreaterThan(Math.sqrt(g * R));
          expect(flexFast.tensionDifferenceBottomMinusTop).toBeCloseTo(6 * m * g, 9);

          // Rigid rod above 2√(gR) (including compressive crest < √(5gR))
          const rodCompressLoop = classifyVerticalCircleRegime({
            radius: R,
            initialSpeed: 0.5 * (crit.rigidRodSeparatrix + crit.flexibleStringLoop),
            mass: m,
            linkageType: 'rigid-rod',
            gravity: g,
          });
          expect(rodCompressLoop.regime).toBe('complete-loop');
          expect(rodCompressLoop.completesLoop).toBe(true);
          expect(rodCompressLoop.topActualTension!).toBeLessThan(0);
          expect(rodCompressLoop.tensionDifferenceBottomMinusTop).toBeCloseTo(6 * m * g, 9);
        }
      }
    });
  });

  // ==========================================================================
  // CM-INV-07: Slackening, Post-Slack Reference vs Actual, & Rigid-Rod Regimes
  // ==========================================================================
  describe('CM-INV-07: Flexible-string slackening, horizontal boundary, rigid-rod compression & separatrix', () => {
    const R = 1.5;
    const m = 1.0;

    it('verifies flexible-string slack angle, non-negative T_string, and post-slack reference separation', () => {
      const crit = computeVerticalCircleCriticalSpeeds(R, g);

      // Exact horizontal threshold v0 = √(2gR)
      const horiz = classifyVerticalCircleRegime({
        radius: R,
        initialSpeed: crit.horizontalThreshold,
        mass: m,
        linkageType: 'flexible-string',
        gravity: g,
      });
      expect(horiz.regime).toBe('horizontal-threshold');
      expect(horiz.willSlacken).toBe(false);
      expect(horiz.turningAngleRad).toBeCloseTo(Math.PI / 2, 9);

      const atPiHalf = evaluateVerticalCircleAtAngle(
        {
          radius: R,
          initialSpeed: crit.horizontalThreshold,
          mass: m,
          linkageType: 'flexible-string',
          gravity: g,
        },
        Math.PI / 2
      );
      // Small positive 1-ULP radicand is never clamped, so v = O(√ε_mach) ~ 1e-8 while v² ~ 1e-15
      expect(atPiHalf.actualCircularSpeed!).toBeCloseTo(0, 6);
      expect(atPiHalf.actualCircularSpeed! ** 2).toBeCloseTo(0, 9);
      expect(atPiHalf.actualTension).toBeCloseTo(0, 9);

      // Just below and just above √(5gR) (including tight 1e-12 relative perturbation)
      for (const relEps of [1e-9, 1e-12]) {
        const justBelowString = classifyVerticalCircleRegime({
          radius: R,
          initialSpeed: crit.flexibleStringLoop * (1 - relEps),
          mass: m,
          linkageType: 'flexible-string',
          gravity: g,
        });
        expect(justBelowString.regime).toBe('slackening');
        expect(justBelowString.willSlacken).toBe(true);

        const justAboveString = classifyVerticalCircleRegime({
          radius: R,
          initialSpeed: crit.flexibleStringLoop * (1 + relEps),
          mass: m,
          linkageType: 'flexible-string',
          gravity: g,
        });
        expect(justAboveString.regime).toBe('complete-loop');
        expect(justAboveString.willSlacken).toBe(false);
      }

      // Mid-slackening regime v0 = 7.0 m/s
      const slackParams: VerticalCircleParams = {
        radius: R,
        initialSpeed: 7.0,
        mass: m,
        linkageType: 'flexible-string',
        gravity: g,
      };
      const slackRegime = classifyVerticalCircleRegime(slackParams);
      const expectedCosSlack = -(49 - 2 * g * R) / (3 * g * R); // -4/9
      expect(slackRegime.regime).toBe('slackening');
      expect(slackRegime.slackAngleRad!).toBeCloseTo(Math.acos(expectedCosSlack), 9);
      expect(slackRegime.slackAngleRad!).toBeGreaterThan(Math.PI / 2);
      expect(slackRegime.slackAngleRad!).toBeLessThan(Math.PI);

      // At exact slack angle: T_required = 0, T_string = 0, still on circle
      const atSlack = evaluateVerticalCircleAtAngle(slackParams, slackRegime.slackAngleRad!);
      expect(atSlack.isCircularContactValid).toBe(true);
      expect(atSlack.isPostSlackDeparted).toBe(false);
      expect(atSlack.circularReference!.requiredConstraintForce).toBeCloseTo(0, 9);
      expect(atSlack.actualTension).toBeCloseTo(0, 9);
      expect(atSlack.actualCircularSpeed).toBeCloseTo(slackRegime.slackSpeed!, 9);

      // Past slack angle within hypothetical circular energy reach (θ_slack ≈ 2.031 < θ = 2.15 < θ_turn_rod ≈ 2.301):
      // post-slack projectile state unavailable in Phase 1 => actualCircularSpeed/Position = null,
      // actual string tension = 0, while circularReference.requiredConstraintForce < 0
      const postSlack = evaluateVerticalCircleAtAngle(slackParams, 2.15);
      expect(postSlack.isReachable).toBe(true);
      expect(postSlack.isPostSlackDeparted).toBe(true);
      expect(postSlack.isCircularContactValid).toBe(false);
      expect(postSlack.actualCircularPosition).toBeNull();
      expect(postSlack.actualCircularSpeed).toBeNull();
      expect(postSlack.actualTension).toBe(0);
      expect(postSlack.circularReference).not.toBeNull();
      expect(postSlack.circularReference!.requiredConstraintForce).toBeLessThan(0);

      // Past hypothetical energetic limit (θ = 2.4 > θ_turn_rod): strictly unreachable
      const beyondEnergy = evaluateVerticalCircleAtAngle(slackParams, 2.4);
      expect(beyondEnergy.isReachable).toBe(false);
      expect(beyondEnergy.circularReference).toBeNull();
      expect(beyondEnergy.actualTension).toBeNull();
    });

    it('verifies rigid-rod inverted-oscillatory compression, asymptotic separatrix at 2√(gR), and compressive loop', () => {
      const crit = computeVerticalCircleCriticalSpeeds(R, g);

      // 1. Inverted-oscillatory: √(2gR) < v0 < 2√(gR) (e.g. v0 = 7.0 m/s)
      const invOscParams: VerticalCircleParams = {
        radius: R,
        initialSpeed: 7.0,
        mass: m,
        linkageType: 'rigid-rod',
        gravity: g,
      };
      const invOsc = classifyVerticalCircleRegime(invOscParams);
      expect(invOsc.regime).toBe('inverted-oscillatory');
      expect(invOsc.willSlacken).toBe(false);
      expect(invOsc.completesLoop).toBe(false);
      expect(invOsc.turningAngleRad!).toBeGreaterThan(Math.PI / 2);
      expect(invOsc.turningAngleRad!).toBeLessThan(Math.PI);

      // At turning angle in upper semicircle, rod exerts negative compressive force T = mg cos θ_turn < 0
      const atInvTurn = evaluateVerticalCircleAtAngle(invOscParams, invOsc.turningAngleRad!);
      expect(atInvTurn.isCircularContactValid).toBe(true);
      expect(atInvTurn.isInCompression).toBe(true);
      expect(atInvTurn.actualTension!).toBeCloseTo(m * g * Math.cos(invOsc.turningAngleRad!), 9);
      expect(atInvTurn.actualTension!).toBeLessThan(0);

      // 2. Exact asymptotic separatrix v0 = 2√(gR)
      const sepParams: VerticalCircleParams = {
        radius: R,
        initialSpeed: crit.rigidRodSeparatrix,
        mass: m,
        linkageType: 'rigid-rod',
        gravity: g,
      };
      const sep = classifyVerticalCircleRegime(sepParams);
      expect(sep.regime).toBe('asymptotic-separatrix');
      expect(sep.isAsymptoticSeparatrix).toBe(true);
      expect(sep.completesLoop).toBe(false);
      expect(sep.turningAngleRad).toBeCloseTo(Math.PI, 9);
      expect(sep.topSpeed).toBe(0);
      expect(sep.topActualTension).toBeCloseTo(-m * g, 9);

      const atSepTop = evaluateVerticalCircleAtAngle(sepParams, Math.PI);
      expect(atSepTop.isReachable).toBe(true);
      expect(atSepTop.actualCircularSpeed).toBeCloseTo(0, 9);
      expect(atSepTop.actualTension).toBeCloseTo(-m * g, 9);
      expect(atSepTop.isInCompression).toBe(true);

      // Just-below vs just-above 2√(gR) (including tight 1e-12 relative perturbation)
      for (const relEps of [1e-9, 1e-12]) {
        const justBelowSep = classifyVerticalCircleRegime({
          ...sepParams,
          initialSpeed: crit.rigidRodSeparatrix * (1 - relEps),
        });
        expect(justBelowSep.regime).toBe('inverted-oscillatory');
        expect(justBelowSep.completesLoop).toBe(false);

        const justAboveSep = classifyVerticalCircleRegime({
          ...sepParams,
          initialSpeed: crit.rigidRodSeparatrix * (1 + relEps),
        });
        expect(justAboveSep.regime).toBe('complete-loop');
        expect(justAboveSep.completesLoop).toBe(true);
        expect(justAboveSep.topActualTension!).toBeLessThan(0);
      }

      // 3. Rigid-rod complete-loop compression (2√(gR) < v0 < √(5gR))
      const compLoopParams: VerticalCircleParams = {
        radius: R,
        initialSpeed: 8.0, // 7.668 < 8.0 < 8.573
        mass: m,
        linkageType: 'rigid-rod',
        gravity: g,
      };
      const compLoop = classifyVerticalCircleRegime(compLoopParams);
      expect(compLoop.regime).toBe('complete-loop');
      expect(compLoop.completesLoop).toBe(true);
      expect(compLoop.topSpeed!).toBeGreaterThan(0);
      expect(compLoop.topActualTension!).toBeLessThan(0);
      expect(compLoop.tensionDifferenceBottomMinusTop).toBeCloseTo(6 * m * g, 9);
    });
  });

  // ==========================================================================
  // CM-INV-08: Algebraic Radial-Arrest Impulse & Post-Impact Tension Check
  // (Note: projectile flight & g_event(t) = 0 root localization belong to Phase 2)
  // ==========================================================================
  describe('CM-INV-08: Algebraic taut-impact radial arrest, ΔE_lost & tension admissibility', () => {
    const R = 1.5;
    const m = 1.2;

    it('removes outward radial velocity (v_r^+ = 0), preserves v_θ, and matches ΔE_lost = 0.5*m*(v_r^-)^2', () => {
      // Impact at θ* = π/3 in lower-right quadrant: r* = (R sin 60°, -R cos 60°)
      const thetaStar = Math.PI / 3;
      const impactPos = new Vector2(R * Math.sin(thetaStar), -R * Math.cos(thetaStar));
      const rHat = impactPos.normalized();
      const tHat = new Vector2(-rHat.y, rHat.x);

      const vrIn = 3.2; // outward
      const vtIn = 4.5; // tangential
      const preVel = rHat.scale(vrIn).add(tHat.scale(vtIn));

      const res = evaluateVerticalTautImpulse(impactPos, preVel, R, m, g);

      expect(res.isOutwardCrossing).toBe(true);
      expect(res.preRadialSpeed).toBeCloseTo(vrIn, 9);
      expect(res.preTangentialSpeed).toBeCloseTo(vtIn, 9);
      expect(res.postRadialSpeed).toBe(0);
      expect(res.postTangentialSpeed).toBeCloseTo(vtIn, 9);
      expect(res.postVelocity.dot(rHat)).toBeCloseTo(0, 9);
      expect(res.postVelocity.dot(tHat)).toBeCloseTo(vtIn, 9);

      const expectedLost = 0.5 * m * vrIn * vrIn;
      const keBefore = 0.5 * m * preVel.dot(preVel);
      const keAfter = 0.5 * m * res.postVelocity.dot(res.postVelocity);
      expect(res.energyLost).toBeCloseTo(expectedLost, 9);
      expect(keBefore - keAfter).toBeCloseTo(expectedLost, 9);

      // Lower quadrant has cos θ* = +0.5 > 0 => T_post > 0 => resumes arc
      const expectedTPost = (m * vtIn * vtIn) / R + m * g * Math.cos(thetaStar);
      expect(res.postImpactRequiredTension).toBeCloseTo(expectedTPost, 9);
      expect(res.resumesCircularArc).toBe(true);
      expect(res.postImpactActualTension).toBeCloseTo(expectedTPost, 9);
    });

    it('correctly applies T_post admissibility tolerance ε_T = 1e-6 N (resumes vs re-slackens)', () => {
      // Upper quadrant impact at θ* = 2π/3 (cos θ* = -0.5)
      const thetaStar = (2 * Math.PI) / 3;
      const impactPos = new Vector2(R * Math.sin(thetaStar), -R * Math.cos(thetaStar));
      const rHat = impactPos.normalized();
      const tHat = new Vector2(-rHat.y, rHat.x);

      // Exact zero tension tangential speed: m*vt²/R = m*g*0.5 => vt_crit = sqrt(0.5 * g * R)
      const vtCrit = Math.sqrt(0.5 * g * R);

      // Case 1: Slightly negative within -ε_T (T_post = -5e-7 >= -1e-6) => resumes arc with T = 0
      const vtWithinTol = Math.sqrt((R / m) * (m * g * 0.5 - 5e-7));
      const velTol = rHat.scale(2.0).add(tHat.scale(vtWithinTol));
      const resTol = evaluateVerticalTautImpulse(impactPos, velTol, R, m, g);
      expect(resTol.postImpactRequiredTension).toBeCloseTo(-5e-7, 9);
      expect(resTol.resumesCircularArc).toBe(true);
      expect(resTol.postImpactActualTension).toBe(0);

      // Case 2: T_post < -ε_T (e.g. vt = 0.5 * vt_crit) => immediately re-slackens!
      const velReSlack = rHat.scale(2.0).add(tHat.scale(0.5 * vtCrit));
      const resReSlack = evaluateVerticalTautImpulse(impactPos, velReSlack, R, m, g);
      expect(resReSlack.postImpactRequiredTension).toBeLessThan(
        -CIRCULAR_MOTION_CONSTANTS.TENSION_EPSILON
      );
      expect(resReSlack.resumesCircularArc).toBe(false);
      expect(resReSlack.postImpactActualTension).toBe(0);
    });

    it('does not trigger radial arrest when radial velocity is inward (v_r^- <= 0)', () => {
      const impactPos = new Vector2(R, 0);
      const preVel = new Vector2(-1.5, 3.0);
      const res = evaluateVerticalTautImpulse(impactPos, preVel, R, m, g);
      expect(res.isOutwardCrossing).toBe(false);
      expect(res.energyLost).toBe(0);
      expect(res.postVelocity.equals(preVel)).toBe(true);
    });
  });

  // ==========================================================================
  // CM-INV-09: Banked Road Signed Friction, Normal Force & Admissibility
  // ==========================================================================
  describe('CM-INV-09: Banked road signed friction f_s and normal reaction N', () => {
    const baseBanked: BankedCurveParams = {
      radius: 40.0,
      speed: 15.0,
      bankAngleDeg: 15.0,
      staticFriction: 0.40,
      mass: 1200,
      gravity: g,
    };

    it('satisfies f_s = m[(v²/r)cosθ - g sinθ] and N = (mg + f_s sinθ)/cosθ across all speed regimes', () => {
      const limits = computeBankedCurveSpeedLimits(
        baseBanked.radius,
        baseBanked.bankAngleDeg,
        baseBanked.staticFriction,
        g
      );

      // 1. At v_opt: f_s = 0, status = balanced-optimal
      const atOpt = evaluateBankedCurve({ ...baseBanked, speed: limits.optimalSpeed });
      expect(atOpt.requiredFriction).toBe(0);
      expect(atOpt.frictionDirection).toBe('none');
      expect(atOpt.status).toBe('balanced-optimal');
      expect(atOpt.isStaticAdmissible).toBe(true);

      // 2. Just above v_opt: f_s > 0 (down incline)
      const aboveOpt = evaluateBankedCurve({ ...baseBanked, speed: limits.optimalSpeed * (1 + 1e-6) });
      expect(aboveOpt.requiredFriction).toBeGreaterThan(0);
      expect(aboveOpt.frictionDirection).toBe('down-incline');
      expect(aboveOpt.status).toBe('safe-outward-held');

      // 3. Just below v_opt: f_s < 0 (up incline)
      const belowOpt = evaluateBankedCurve({ ...baseBanked, speed: limits.optimalSpeed * (1 - 1e-6) });
      expect(belowOpt.requiredFriction).toBeLessThan(0);
      expect(belowOpt.frictionDirection).toBe('up-incline');
      expect(belowOpt.status).toBe('safe-inward-held');

      // 4. Equivalence N = (mg + f_s sinθ)/cosθ = m(g cosθ + (v²/r) sinθ)
      const thetaRad = (baseBanked.bankAngleDeg * Math.PI) / 180;
      const evalMid = evaluateBankedCurve(baseBanked);
      const nAlt =
        (baseBanked.mass * g + evalMid.requiredFriction * Math.sin(thetaRad)) /
        Math.cos(thetaRad);
      expect(evalMid.normalReaction).toBeCloseTo(nAlt, 9);

      // 5. Level road θ = 0°: f_s = mv²/r, N = mg
      const level = evaluateBankedCurve({ ...baseBanked, bankAngleDeg: 0, speed: 12.0 });
      expect(level.requiredFriction).toBeCloseTo((1200 * 144) / 40, 9);
      expect(level.normalReaction).toBeCloseTo(1200 * g, 9);
    });

    it('verifies exact friction equality f_s = ±μs·N and admissibility at v_max and v_min', () => {
      // Steep enough that v_min > 0: θ = 30° (tan 30° ≈ 0.577 > μs = 0.20)
      const params: BankedCurveParams = {
        radius: 40.0,
        speed: 15.0,
        bankAngleDeg: 30.0,
        staticFriction: 0.20,
        mass: 1000,
        gravity: g,
      };
      const limits = computeBankedCurveSpeedLimits(40.0, 30.0, 0.20, g);
      expect(limits.minSafeSpeed).toBeGreaterThan(0);
      expect(limits.maxSafeSpeed).not.toBeNull();

      // At v_max: f_s = +μs·N and admissible
      const atMax = evaluateBankedCurve({ ...params, speed: limits.maxSafeSpeed! });
      expect(atMax.requiredFriction).toBeCloseTo(atMax.maxStaticFriction, 9);
      expect(atMax.isStaticAdmissible).toBe(true);
      expect(atMax.status).toBe('safe-outward-held');

      // At v_min: f_s = -μs·N and admissible
      const atMin = evaluateBankedCurve({ ...params, speed: limits.minSafeSpeed });
      expect(atMin.requiredFriction).toBeCloseTo(-atMin.maxStaticFriction, 9);
      expect(atMin.isStaticAdmissible).toBe(true);
      expect(atMin.status).toBe('safe-inward-held');

      // Just below/above v_max and v_min (including tight 1e-12 relative perturbation)
      for (const relEps of [1e-9, 1e-12]) {
        const belowMax = evaluateBankedCurve({
          ...params,
          speed: limits.maxSafeSpeed! * (1 - relEps),
        });
        expect(belowMax.isStaticAdmissible).toBe(true);
        expect(belowMax.status).toBe('safe-outward-held');

        const overMax = evaluateBankedCurve({
          ...params,
          speed: limits.maxSafeSpeed! * (1 + relEps),
        });
        expect(overMax.isStaticAdmissible).toBe(false);
        expect(overMax.status).toBe('skid-outward');

        const aboveMin = evaluateBankedCurve({
          ...params,
          speed: limits.minSafeSpeed * (1 + relEps),
        });
        expect(aboveMin.isStaticAdmissible).toBe(true);
        expect(aboveMin.status).toBe('safe-inward-held');

        const underMin = evaluateBankedCurve({
          ...params,
          speed: limits.minSafeSpeed * (1 - relEps),
        });
        expect(underMin.isStaticAdmissible).toBe(false);
        expect(underMin.status).toBe('slide-inward');
      }
    });
  });

  // ==========================================================================
  // CM-INV-10: Banked Road Closed-Form Speed Thresholds & Steep Asymptote
  // ==========================================================================
  describe('CM-INV-10: Banked curve v_max, v_min closed-form limits & steep asymptote guard', () => {
    it('matches closed-form v_max and v_min against horizontal/vertical force balance within 1e-9', () => {
      const r = 50.0;
      const thetaDeg = 28.0;
      const theta = (thetaDeg * Math.PI) / 180;
      const muS = 0.30;
      const limits = computeBankedCurveSpeedLimits(r, thetaDeg, muS, g);

      const expectedOpt = Math.sqrt(r * g * Math.tan(theta));
      const expectedMin = Math.sqrt(
        r * g * ((Math.tan(theta) - muS) / (1 + muS * Math.tan(theta)))
      );
      const expectedMax = Math.sqrt(
        r * g * ((Math.tan(theta) + muS) / (1 - muS * Math.tan(theta)))
      );

      expect(limits.optimalSpeed).toBeCloseTo(expectedOpt, 9);
      expect(limits.minSafeSpeed).toBeCloseTo(expectedMin, 9);
      expect(limits.maxSafeSpeed!).toBeCloseTo(expectedMax, 9);

      // Level road limit: v_max = √(μs*r*g), v_min = 0
      const levelLimits = computeBankedCurveSpeedLimits(r, 0, muS, g);
      expect(levelLimits.optimalSpeed).toBe(0);
      expect(levelLimits.minSafeSpeed).toBe(0);
      expect(levelLimits.canSlideInward).toBe(false);
      expect(levelLimits.maxSafeSpeed!).toBeCloseTo(Math.sqrt(muS * r * g), 9);
    });

    it('handles self-locking banks (tan θ <= μs => v_min = 0) and steep asymptote (μs tan θ >= 1 => null)', () => {
      // Self-locking: θ = 15° (tan ≈ 0.268) <= μs = 0.40
      const locked = computeBankedCurveSpeedLimits(40.0, 15.0, 0.40, g);
      expect(locked.minSafeSpeed).toBe(0);
      expect(locked.canSlideInward).toBe(false);

      // Exact self-locking equality: tan 45° = 1, μs = 1.0 (tests IEEE-754 tan(π/4) < 1 by 1 ULP!)
      const exactAsymptote = computeBankedCurveSpeedLimits(40.0, 45.0, 1.0, g);
      expect(exactAsymptote.minSafeSpeed).toBe(0);
      expect(exactAsymptote.canSlideInward).toBe(false);
      expect(exactAsymptote.hasUpperSpeedLimit).toBe(false);
      expect(exactAsymptote.maxSafeSpeed).toBeNull();
      expect(exactAsymptote.statusNote).toBe('No Outward Skid Limit');

      // Strictly above asymptote: θ = 60°, μs = 0.70 (0.70 * √3 ≈ 1.212 > 1)
      const superAsymptote = evaluateBankedCurve({
        radius: 40.0,
        speed: 38.0,
        bankAngleDeg: 60.0,
        staticFriction: 0.70,
        mass: 1200,
        gravity: g,
      });
      expect(superAsymptote.hasUpperSpeedLimit).toBe(false);
      expect(superAsymptote.maxSafeSpeed).toBeNull();
      expect(superAsymptote.statusNote).toBe('No Outward Skid Limit');
      expect(Number.isFinite(superAsymptote.normalReaction)).toBe(true);
      expect(Number.isFinite(superAsymptote.requiredFriction)).toBe(true);
    });
  });

  // ==========================================================================
  // CM-INV-11: Conical Pendulum Period & Mass Independence
  // ==========================================================================
  describe('CM-INV-11: Conical pendulum period T = 2π√(L cosθ / g) = 2π√(h / g) & mass independence', () => {
    it('computes exact geometry, tension, ω, and period, leaving T_period unchanged across masses', () => {
      const L = 1.5;
      const angleDeg = 30.0;
      const theta = (angleDeg * Math.PI) / 180;
      const expectedH = L * Math.cos(theta);
      const expectedR = L * Math.sin(theta);
      const expectedPeriod = 2 * Math.PI * Math.sqrt(expectedH / g);
      const expectedOmega = Math.sqrt(g / expectedH);

      const masses = [0.2, 0.5, 1.5, 2.0];
      for (const m of masses) {
        const res = evaluateConicalPendulum({ length: L, angleDeg, mass: m, gravity: g });
        expect(res.orbitRadius).toBeCloseTo(expectedR, 9);
        expect(res.verticalDepth).toBeCloseTo(expectedH, 9);
        expect(res.period).toBeCloseTo(expectedPeriod, 9);
        expect(res.angularVelocity).toBeCloseTo(expectedOmega, 9);
        expect(res.linearSpeed).toBeCloseTo(expectedOmega * expectedR, 9);
        expect(res.tension).toBeCloseTo((m * g) / Math.cos(theta), 9);
        expect(res.centripetalForce).toBeCloseTo(m * g * Math.tan(theta), 9);
      }

      // Tension scales linearly with mass while period stays identical
      const light = evaluateConicalPendulum({ length: L, angleDeg, mass: 0.4, gravity: g });
      const heavy = evaluateConicalPendulum({ length: L, angleDeg, mass: 1.6, gravity: g });
      expect(heavy.tension).toBeCloseTo(4 * light.tension, 9);
      expect(heavy.centripetalForce).toBeCloseTo(4 * light.centripetalForce, 9);
      expect(heavy.period).toBe(light.period);
    });
  });

  // ==========================================================================
  // CM-INV-12: Conical Pendulum Small-Angle Limit & Deviation δ = 1 - √(cos θ)
  // ==========================================================================
  describe('CM-INV-12: Conical pendulum small-angle limit T_conical / T_0 = √(cos θ)', () => {
    it('verifies exact ratio √(cos θ) and deviation δ = 1 - √(cos θ) <= 0.1% for θ <= 3° and <= 0.2% for θ <= 5°', () => {
      // Calls evaluator directly across physical domain 0° <= θ < 90° (including θ < 5° UI floor)
      const deg0 = evaluateConicalPendulum({ length: 1.5, angleDeg: 0, mass: 0.5, gravity: g });
      expect(deg0.orbitRadius).toBe(0);
      expect(deg0.linearSpeed).toBe(0);
      expect(deg0.angularVelocity).toBeCloseTo(Math.sqrt(g / 1.5), 9);
      expect(deg0.periodRatio).toBe(1);
      expect(deg0.smallAngleRelativeDeviation).toBe(0);

      for (const deg of [1.0, 2.0, 3.0]) {
        const res = evaluateConicalPendulum({ length: 1.5, angleDeg: deg, mass: 0.5, gravity: g });
        const thetaRad = (deg * Math.PI) / 180;
        const expectedRatio = Math.sqrt(Math.cos(thetaRad));
        const expectedDelta = 1 - expectedRatio;

        expect(res.period / res.simplePendulumPeriod).toBeCloseTo(expectedRatio, 9);
        expect(res.periodRatio).toBeCloseTo(expectedRatio, 9);
        expect(res.smallAngleRelativeDeviation).toBeCloseTo(expectedDelta, 9);
        expect(res.smallAngleRelativeDeviation).toBeLessThanOrEqual(0.001); // <= 0.1%
      }

      const deg5 = evaluateConicalPendulum({ length: 1.5, angleDeg: 5.0, mass: 0.5, gravity: g });
      const expectedDelta5 = 1 - Math.sqrt(Math.cos((5.0 * Math.PI) / 180));
      expect(deg5.smallAngleRelativeDeviation).toBeCloseTo(expectedDelta5, 9);
      expect(deg5.smallAngleRelativeDeviation).toBeLessThan(0.002); // ~0.1905% <= 0.2%
    });
  });

  // ==========================================================================
  // Validation, Parameter Clamping & Input Purity Guards
  // ==========================================================================
  describe('Validation, Clamping & Input Guards across all 4 modes', () => {
    it('accepts all default parameter sets and rejects out-of-range or inconsistent inputs', () => {
      expect(validateHorizontalCircularParams(DEFAULT_HORIZONTAL_PARAMS).valid).toBe(true);
      expect(validateVerticalCircleParams(DEFAULT_VERTICAL_PARAMS).valid).toBe(true);
      expect(validateBankedCurveParams(DEFAULT_BANKED_PARAMS).valid).toBe(true);
      expect(validateConicalPendulumParams(DEFAULT_CONICAL_PARAMS).valid).toBe(true);

      // Horizontal μk > μs rejection
      const badFriction = validateHorizontalCircularParams({
        ...DEFAULT_HORIZONTAL_PARAMS,
        staticFriction: 0.30,
        kineticFriction: 0.45,
      });
      expect(badFriction.valid).toBe(false);
      expect(badFriction.errors.some((e) => e.includes('μk <= μs'))).toBe(true);

      // Conical UI bounds [5°, 80°] reject 3° while mathematical evaluator accepts [0°, 90°)
      expect(
        validateConicalPendulumParams({ ...DEFAULT_CONICAL_PARAMS, angleDeg: 3.0 }).valid
      ).toBe(false);
      expect(
        validateConicalPendulumParams({ ...DEFAULT_CONICAL_PARAMS, angleDeg: 85.0 }).valid
      ).toBe(false);

      // Banked bounds reject negative speed or 50° UI angle
      expect(validateBankedCurveParams({ ...DEFAULT_BANKED_PARAMS, speed: -1 }).valid).toBe(false);
      expect(
        validateBankedCurveParams({ ...DEFAULT_BANKED_PARAMS, bankAngleDeg: 50 }).valid
      ).toBe(false);

      // Vertical bounds
      expect(
        validateVerticalCircleParams({ ...DEFAULT_VERTICAL_PARAMS, radius: 0.2 }).valid
      ).toBe(false);
    });

    it('clamps out-of-range and non-finite parameters into spec bounds cleanly', () => {
      const clampedH = clampHorizontalCircularParams({
        radius: 100,
        initialAngularVelocity: -50,
        angularAcceleration: NaN,
        mass: 0,
        staticFriction: 0.20,
        kineticFriction: 0.60, // clamped to <= staticFriction (0.20)
        attachmentMode: 'friction-surface',
      });
      expect(clampedH.radius).toBe(HORIZONTAL_PARAM_RANGES.radius.max);
      expect(clampedH.initialAngularVelocity).toBe(
        HORIZONTAL_PARAM_RANGES.initialAngularVelocity.min
      );
      expect(clampedH.angularAcceleration).toBe(DEFAULT_HORIZONTAL_PARAMS.angularAcceleration);
      expect(clampedH.mass).toBe(HORIZONTAL_PARAM_RANGES.mass.min);
      expect(clampedH.kineticFriction).toBeLessThanOrEqual(clampedH.staticFriction);

      const clampedV = clampVerticalCircleParams({
        radius: 10,
        initialSpeed: -5,
        mass: NaN,
        linkageType: 'rigid-rod',
      });
      expect(clampedV.radius).toBe(VERTICAL_PARAM_RANGES.radius.max);
      expect(clampedV.initialSpeed).toBe(VERTICAL_PARAM_RANGES.initialSpeed.min);
      expect(clampedV.mass).toBe(DEFAULT_VERTICAL_PARAMS.mass);

      const clampedB = clampBankedCurveParams({
        radius: 1,
        speed: 99,
        bankAngleDeg: 80,
        staticFriction: -1,
        mass: 5000,
      });
      expect(clampedB.radius).toBe(BANKED_PARAM_RANGES.radius.min);
      expect(clampedB.speed).toBe(BANKED_PARAM_RANGES.speed.max);
      expect(clampedB.bankAngleDeg).toBe(BANKED_PARAM_RANGES.bankAngleDeg.max);
      expect(clampedB.staticFriction).toBe(BANKED_PARAM_RANGES.staticFriction.min);
      expect(clampedB.mass).toBe(BANKED_PARAM_RANGES.mass.max);

      const clampedC = clampConicalPendulumParams({
        length: 0.1,
        angleDeg: 2.0,
        mass: 10,
      });
      expect(clampedC.length).toBe(CONICAL_PARAM_RANGES.length.min);
      expect(clampedC.angleDeg).toBe(CONICAL_PARAM_RANGES.angleDeg.min);
      expect(clampedC.mass).toBe(CONICAL_PARAM_RANGES.mass.max);
    });

    it('throws explicit Errors on NaN, Infinity, or physically impossible core inputs', () => {
      expect(() => evaluateHorizontalKinematicsState(NaN, 0, 1, 0)).toThrow();
      expect(() => evaluateHorizontalKinematicsState(-1, 0, 1, 0)).toThrow();
      expect(() =>
        evaluateConicalPendulum({ length: 1.5, angleDeg: 90, mass: 0.5 })
      ).toThrow();
      expect(() =>
        evaluateConicalPendulum({ length: 1.5, angleDeg: -1, mass: 0.5 })
      ).toThrow();
      expect(() =>
        evaluateBankedCurve({
          radius: 40,
          speed: 10,
          bankAngleDeg: 90,
          staticFriction: 0.3,
          mass: 1000,
        })
      ).toThrow();
      expect(() =>
        classifyVerticalCircleRegime({
          radius: 1.5,
          initialSpeed: 5,
          mass: 0,
          linkageType: 'flexible-string',
        })
      ).toThrow();
    });
  });
});
