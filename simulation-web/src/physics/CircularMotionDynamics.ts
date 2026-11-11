import { Vector2 } from '../core/Vector2';
import {
  CIRCULAR_MOTION_CONSTANTS,
  classifyVerticalCircleRegime,
  computeTurntableBreakawayThreshold,
  evaluateTurntableFriction,
  evaluateVerticalTautImpulse,
  type HorizontalCircularParams,
  type TurntableFrictionEvaluation,
  type VerticalCircleParams,
  type VerticalCircleRegime,
  type VerticalLinkageType,
} from './CircularMotionPhysics';

// ============================================================================
// Shared Constants & Safety Bounds
// ============================================================================

export const DYNAMICS_CONSTANTS = {
  /** Fixed internal integration upper bound Δt (s) per specification §7.4 */
  INTERNAL_SUBSTEP_DT: 0.002,
  /** Maximum discrete state/transition events allowed within a single outer dt step */
  MAX_EVENTS_PER_STEP: 64,
  /** Maximum number of recent event records retained in state history */
  MAX_EVENT_HISTORY: 256,
  /** Maximum iterations for bracketed bisection root finding */
  BISECTION_MAX_ITERATIONS: 45,
  /** Bisection interval width convergence target (s) — far below 1e-6 s tolerance */
  BISECTION_TIME_TOLERANCE: 1e-13,
  /** Maximum kinetic zero-crossing recursive subdivision depth per substep */
  MAX_CROSSING_SUBDIVISIONS: 4,
  /** Circular slackening tension threshold below zero (N) avoiding machine drift at boundaries */
  CIRCULAR_SLACK_TENSION_GUARD: 1e-9,
  /** Upper-semicircle cosine guard avoiding spurious θ = π/2 sign jitter */
  UPPER_SEMICIRCLE_COS_GUARD: -1e-7,
  /** Normalized mechanical energy margin above mgR for genuine upper-semicircle slackening */
  HORIZONTAL_ENERGY_MARGIN_REL: 1e-9,
  /** Normalized interior radius margin below R confirming departure from release root */
  INTERIOR_DEPARTURE_REL: 1e-11,
} as const;

// ============================================================================
// Private Validation & Numeric Guards
// ============================================================================

interface ResolvedTurntableParams {
  readonly radius: number;
  readonly omega0: number;
  readonly alpha: number;
  readonly mass: number;
  readonly staticFriction: number;
  readonly kineticFriction: number;
  readonly gravity: number;
}

interface ResolvedVerticalParams {
  readonly radius: number;
  readonly initialSpeed: number;
  readonly mass: number;
  readonly linkageType: VerticalLinkageType;
  readonly gravity: number;
}

function assertValidDt(dt: number): void {
  if (!Number.isFinite(dt) || dt < 0) {
    throw new RangeError(
      `Invalid integration timestep dt: expected a non-negative finite number, received ${dt}.`
    );
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeZero(value: number): number {
  return Object.is(value, -0) || Math.abs(value) === 0 ? 0 : value;
}

function validateTurntableDynamicParams(
  params: HorizontalCircularParams
): ResolvedTurntableParams {
  if (typeof params !== 'object' || params === null) {
    throw new Error('Invalid HorizontalCircularParams: expected a non-null object.');
  }
  if (params.attachmentMode === 'tether') {
    throw new Error(
      "stepTurntableState/createInitialTurntableState only support attachmentMode 'friction-surface'; use Phase 1 evaluateHorizontalKinematicsAtTime for 'tether' mode."
    );
  }
  if (params.attachmentMode !== 'friction-surface') {
    throw new Error(
      `Invalid attachmentMode '${String(params.attachmentMode)}': expected 'friction-surface'.`
    );
  }
  if (
    !Number.isFinite(params.radius) ||
    params.radius < CIRCULAR_MOTION_CONSTANTS.MIN_SAFE_RADIUS
  ) {
    throw new Error(
      `Invalid radius: expected finite value >= ${CIRCULAR_MOTION_CONSTANTS.MIN_SAFE_RADIUS} m (received ${params.radius}).`
    );
  }
  if (!Number.isFinite(params.initialAngularVelocity)) {
    throw new Error(
      `Invalid initialAngularVelocity: must be finite (received ${params.initialAngularVelocity}).`
    );
  }
  if (!Number.isFinite(params.angularAcceleration)) {
    throw new Error(
      `Invalid angularAcceleration: must be finite (received ${params.angularAcceleration}).`
    );
  }
  if (!Number.isFinite(params.mass) || params.mass <= 0) {
    throw new Error(
      `Invalid mass: must be a positive finite number (received ${params.mass}).`
    );
  }
  if (!Number.isFinite(params.staticFriction) || params.staticFriction < 0) {
    throw new Error(
      `Invalid staticFriction: must be non-negative finite (received ${params.staticFriction}).`
    );
  }
  if (!Number.isFinite(params.kineticFriction) || params.kineticFriction < 0) {
    throw new Error(
      `Invalid kineticFriction: must be non-negative finite (received ${params.kineticFriction}).`
    );
  }
  if (params.kineticFriction > params.staticFriction) {
    throw new Error(
      `Invalid friction coefficients: kineticFriction (${params.kineticFriction}) cannot exceed staticFriction (${params.staticFriction}).`
    );
  }
  const gravity = params.gravity ?? CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY;
  if (!Number.isFinite(gravity) || gravity <= 0) {
    throw new Error(`Invalid gravity: must be positive finite (received ${gravity}).`);
  }

  return {
    radius: params.radius,
    omega0: params.initialAngularVelocity,
    alpha: params.angularAcceleration,
    mass: params.mass,
    staticFriction: params.staticFriction,
    kineticFriction: params.kineticFriction,
    gravity,
  };
}

function validateVerticalDynamicParams(
  params: VerticalCircleParams
): ResolvedVerticalParams {
  if (typeof params !== 'object' || params === null) {
    throw new Error('Invalid VerticalCircleParams: expected a non-null object.');
  }
  if (
    !Number.isFinite(params.radius) ||
    params.radius < CIRCULAR_MOTION_CONSTANTS.MIN_SAFE_RADIUS
  ) {
    throw new Error(
      `Invalid radius: expected finite value >= ${CIRCULAR_MOTION_CONSTANTS.MIN_SAFE_RADIUS} m (received ${params.radius}).`
    );
  }
  if (!Number.isFinite(params.initialSpeed) || params.initialSpeed < 0) {
    throw new Error(
      `Invalid initialSpeed: must be non-negative finite (received ${params.initialSpeed}).`
    );
  }
  if (!Number.isFinite(params.mass) || params.mass <= 0) {
    throw new Error(
      `Invalid mass: must be positive finite (received ${params.mass}).`
    );
  }
  if (params.linkageType !== 'flexible-string' && params.linkageType !== 'rigid-rod') {
    throw new Error(
      `Invalid linkageType '${String(params.linkageType)}': expected 'flexible-string' or 'rigid-rod'.`
    );
  }
  const gravity = params.gravity ?? CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY;
  if (!Number.isFinite(gravity) || gravity <= 0) {
    throw new Error(`Invalid gravity: must be positive finite (received ${gravity}).`);
  }

  return {
    radius: params.radius,
    initialSpeed: params.initialSpeed,
    mass: params.mass,
    linkageType: params.linkageType,
    gravity,
  };
}

function appendBoundedEvent<T>(
  history: readonly T[],
  record: NoInfer<T>,
  previousTotalCount: number
): { events: readonly T[]; totalCount: number; truncated: boolean } {
  const nextTotal = previousTotalCount + 1;
  const appended = [...history, record];
  if (appended.length > DYNAMICS_CONSTANTS.MAX_EVENT_HISTORY) {
    return {
      events: appended.slice(appended.length - DYNAMICS_CONSTANTS.MAX_EVENT_HISTORY),
      totalCount: nextTotal,
      truncated: true,
    };
  }
  return {
    events: appended,
    totalCount: nextTotal,
    truncated: nextTotal > appended.length,
  };
}

// ============================================================================
// Task A: Turntable Kinetic-Slip Integration
// ============================================================================

export type TurntableDynamicPhase = 'at-rest' | 'static' | 'kinetic-slip';

export type TurntableEventType = 'breakaway' | 'restick' | 'zero-crossing-pass-through';

export interface TurntableEventRecord {
  readonly type: TurntableEventType;
  readonly time: number;
  readonly position: Vector2;
  readonly puckVelocity: Vector2;
  readonly tableOmega: number;
  readonly relativeSpeed: number;
  readonly surfaceAccelerationMag: number;
}

export interface TurntableDynamicState {
  readonly time: number;
  readonly phase: TurntableDynamicPhase;
  readonly tableAngleRad: number;
  readonly tableOmega: number;
  readonly puckPosition: Vector2;
  readonly puckVelocity: Vector2;
  readonly radialDistance: number;
  readonly stuckRadius: number;
  readonly stuckLocalAngleRad: number;
  readonly lastEvaluation: TurntableFrictionEvaluation;
  readonly breakawayCount: number;
  readonly restickCount: number;
  readonly kineticEnergy: number;
  /** Signed cumulative work done on the puck by static and kinetic friction in the lab frame (J) */
  readonly cumulativeFrictionWorkLab: number;
  /** Non-negative thermal dissipation μk m g ∫ |v_rel| dt >= 0 (J) */
  readonly cumulativeThermalDissipation: number;
  readonly events: readonly TurntableEventRecord[];
  readonly totalEventsRecorded: number;
  readonly eventHistoryTruncated: boolean;
  readonly maxEventsPerStepReached: boolean;
  readonly unconsumedTimeAfterOverflow: number;
  readonly isDepartingBreakaway: boolean;
  readonly recoveredFromNonFinite: boolean;
}

export interface TurntableInitialOptions {
  readonly initialTableAngleRad?: number;
  readonly initialPuckLocalAngleRad?: number;
  readonly initialPuckPosition?: Vector2;
  readonly initialPuckVelocity?: Vector2;
}

function surfaceVelocityAt(position: Vector2, omega: number): Vector2 {
  return new Vector2(-omega * position.y, omega * position.x);
}

function surfaceAccelerationAt(position: Vector2, omega: number, alpha: number): Vector2 {
  const omegaSq = omega * omega;
  return new Vector2(
    -omegaSq * position.x - alpha * position.y,
    -omegaSq * position.y + alpha * position.x
  );
}

function positionFromTablePolar(
  radius: number,
  tableAngleRad: number,
  localAngleRad: number
): Vector2 {
  const worldAngle = tableAngleRad + localAngleRad;
  return new Vector2(radius * Math.cos(worldAngle), radius * Math.sin(worldAngle));
}

function isTurntableStateFinite(state: TurntableDynamicState): boolean {
  if (typeof state !== 'object' || state === null) {
    return false;
  }
  return (
    Number.isFinite(state.time) &&
    Number.isFinite(state.tableAngleRad) &&
    Number.isFinite(state.tableOmega) &&
    Number.isFinite(state.puckPosition?.x) &&
    Number.isFinite(state.puckPosition?.y) &&
    Number.isFinite(state.puckVelocity?.x) &&
    Number.isFinite(state.puckVelocity?.y) &&
    Number.isFinite(state.radialDistance) &&
    Number.isFinite(state.stuckRadius) &&
    Number.isFinite(state.stuckLocalAngleRad) &&
    Number.isFinite(state.kineticEnergy) &&
    Number.isFinite(state.cumulativeFrictionWorkLab) &&
    Number.isFinite(state.cumulativeThermalDissipation) &&
    Number.isFinite(state.breakawayCount) &&
    Number.isFinite(state.restickCount) &&
    Number.isFinite(state.unconsumedTimeAfterOverflow)
  );
}

function computeTurntableOnsetKineticAcceleration(
  position: Vector2,
  omega: number,
  alpha: number,
  kineticFriction: number,
  gravity: number
): Vector2 {
  const aSurface = surfaceAccelerationAt(position, omega, alpha);
  const mag = aSurface.magnitude();
  if (mag <= CIRCULAR_MOTION_CONSTANTS.SURFACE_ACCEL_EPSILON) {
    return Vector2.zero();
  }
  // At onset, slip tendency u_slip points opposite aSurface, so kinetic friction opposes u_slip (along +aSurface)
  return aSurface.scale((kineticFriction * gravity) / mag);
}

function computeKineticAcceleration(
  position: Vector2,
  velocity: Vector2,
  omega: number,
  alpha: number,
  kineticFriction: number,
  gravity: number,
  allowOnsetAtZero: boolean
): Vector2 {
  const vRel = velocity.sub(surfaceVelocityAt(position, omega));
  const speedRel = vRel.magnitude();
  if (speedRel > CIRCULAR_MOTION_CONSTANTS.RELATIVE_VELOCITY_EPSILON) {
    return vRel.scale(-(kineticFriction * gravity) / speedRel);
  }
  if (allowOnsetAtZero) {
    return computeTurntableOnsetKineticAcceleration(
      position,
      omega,
      alpha,
      kineticFriction,
      gravity
    );
  }
  return Vector2.zero();
}

export function createInitialTurntableState(
  params: HorizontalCircularParams,
  options: TurntableInitialOptions = {}
): TurntableDynamicState {
  const resolved = validateTurntableDynamicParams(params);
  const initialTableAngleRad = options.initialTableAngleRad ?? 0;
  const initialPuckLocalAngleRad = options.initialPuckLocalAngleRad ?? 0;

  if (!Number.isFinite(initialTableAngleRad)) {
    throw new Error(
      `Invalid initialTableAngleRad: must be finite (received ${initialTableAngleRad}).`
    );
  }
  if (!Number.isFinite(initialPuckLocalAngleRad)) {
    throw new Error(
      `Invalid initialPuckLocalAngleRad: must be finite (received ${initialPuckLocalAngleRad}).`
    );
  }

  const puckPosition = options.initialPuckPosition
    ? options.initialPuckPosition.clone()
    : positionFromTablePolar(
        resolved.radius,
        initialTableAngleRad,
        initialPuckLocalAngleRad
      );

  if (!Number.isFinite(puckPosition.x) || !Number.isFinite(puckPosition.y)) {
    throw new Error('Invalid initialPuckPosition: coordinates must be finite.');
  }

  const puckVelocity = options.initialPuckVelocity
    ? options.initialPuckVelocity.clone()
    : surfaceVelocityAt(puckPosition, resolved.omega0);

  if (!Number.isFinite(puckVelocity.x) || !Number.isFinite(puckVelocity.y)) {
    throw new Error('Invalid initialPuckVelocity: components must be finite.');
  }

  const evaluation = evaluateTurntableFriction(
    params,
    puckPosition,
    puckVelocity,
    resolved.omega0,
    resolved.alpha
  );

  const radialDistance = puckPosition.magnitude();
  const localAngle =
    radialDistance > CIRCULAR_MOTION_CONSTANTS.SURFACE_ACCEL_EPSILON
      ? Math.atan2(puckPosition.y, puckPosition.x) - initialTableAngleRad
      : initialPuckLocalAngleRad;

  const phase: TurntableDynamicPhase =
    evaluation.regime === 'kinetic-slip'
      ? 'kinetic-slip'
      : evaluation.regime === 'at-rest'
        ? 'at-rest'
        : 'static';

  const vSq = puckVelocity.dot(puckVelocity);

  return {
    time: 0,
    phase,
    tableAngleRad: initialTableAngleRad,
    tableOmega: resolved.omega0,
    puckPosition,
    puckVelocity,
    radialDistance,
    stuckRadius: radialDistance,
    stuckLocalAngleRad: localAngle,
    lastEvaluation: evaluation,
    breakawayCount: 0,
    restickCount: 0,
    kineticEnergy: normalizeZero(0.5 * resolved.mass * vSq),
    cumulativeFrictionWorkLab: 0,
    cumulativeThermalDissipation: 0,
    events: [],
    totalEventsRecorded: 0,
    eventHistoryTruncated: false,
    maxEventsPerStepReached: false,
    unconsumedTimeAfterOverflow: 0,
    isDepartingBreakaway: false,
    recoveredFromNonFinite: false,
  };
}

interface TurntableStepContext {
  readonly rawParams: HorizontalCircularParams;
  readonly p: ResolvedTurntableParams;
  eventsThisOuterStep: number;
  overflowed: boolean;
}

function advanceTableKinematics(
  state: TurntableDynamicState,
  alpha: number,
  h: number
): { nextAngle: number; nextOmega: number } {
  const nextOmega = state.tableOmega + alpha * h;
  const nextAngle = state.tableAngleRad + state.tableOmega * h + 0.5 * alpha * h * h;
  return { nextAngle, nextOmega };
}

function computeBreakawayOffsetInStep(
  omegaStart: number,
  alpha: number,
  radius: number,
  staticFriction: number,
  gravity: number,
  h: number,
  evalStart: TurntableFrictionEvaluation,
  evalEnd: TurntableFrictionEvaluation
): number | null {
  const safeRadius = Math.max(CIRCULAR_MOTION_CONSTANTS.MIN_SAFE_RADIUS, radius);
  const threshold = computeTurntableBreakawayThreshold(
    safeRadius,
    staticFriction,
    alpha,
    gravity
  );

  // Exact zero-time breakaway: already over limit, or r|α| >= μs g with α ≠ 0 pushing |ω| upward at t = 0
  if (evalStart.isBreakaway || threshold.breaksImmediatelyFromRest) {
    return 0;
  }

  // Exact incipient boundary at ω = 0 (r|α| = μs g) with nonzero α:
  // For every τ > 0, |ω(τ)| = |α|τ > 0 raises |a_surface| strictly above μs g, so breakaway is at τ = 0.
  const omegaEnd = omegaStart + alpha * h;
  if (
    threshold.isIncipientAtRest &&
    alpha !== 0 &&
    (omegaStart === 0 || Math.abs(omegaEnd) > Math.abs(omegaStart))
  ) {
    return 0;
  }

  // Closed-form exact threshold along linear ω(τ) = ω_start + α τ
  if (threshold.criticalAngularSpeed !== null && alpha !== 0) {
    const omegaCrit = threshold.criticalAngularSpeed;
    if (Math.abs(omegaStart) >= omegaCrit && Math.abs(omegaEnd) > Math.abs(omegaStart)) {
      return 0;
    }
    if (Math.abs(omegaStart) < omegaCrit && Math.abs(omegaEnd) > omegaCrit) {
      const targetOmega = omegaEnd >= 0 ? omegaCrit : -omegaCrit;
      const tau = clamp((targetOmega - omegaStart) / alpha, 0, h);
      return tau;
    }
  }

  if (evalEnd.isBreakaway) {
    // Fallback safeguard when end breaks away strictly without hitting closed-form branch
    if (alpha === 0) {
      return 0;
    }
    return clamp(h * 0.5, 0, h);
  }

  return null;
}

function advanceTurntableStaticSegment(
  state: TurntableDynamicState,
  ctx: TurntableStepContext,
  h: number
): { nextState: TurntableDynamicState; remainingTime: number } {
  const { p, rawParams } = ctx;
  const rStick = state.stuckRadius;
  const phiLocal = state.stuckLocalAngleRad;

  const { nextAngle, nextOmega } = advanceTableKinematics(state, p.alpha, h);
  const endPos = positionFromTablePolar(rStick, nextAngle, phiLocal);
  const endVel = surfaceVelocityAt(endPos, nextOmega);
  const evalEnd = evaluateTurntableFriction(rawParams, endPos, endVel, nextOmega, p.alpha);

  const breakOffset = computeBreakawayOffsetInStep(
    state.tableOmega,
    p.alpha,
    rStick,
    p.staticFriction,
    p.gravity,
    h,
    state.lastEvaluation,
    evalEnd
  );

  if (breakOffset === null) {
    // Strictly remains statically stuck for full segment h
    // Lab static work integral ∫ m r² α ω dt = ½ m r² (ω_end² - ω_start²)
    const staticWorkLab =
      0.5 * p.mass * rStick * rStick * (nextOmega * nextOmega - state.tableOmega * state.tableOmega);
    const nextKe = 0.5 * p.mass * endVel.dot(endVel);
    const nextPhase: TurntableDynamicPhase =
      evalEnd.regime === 'at-rest' ? 'at-rest' : 'static';

    return {
      nextState: {
        ...state,
        time: state.time + h,
        phase: nextPhase,
        tableAngleRad: nextAngle,
        tableOmega: nextOmega,
        puckPosition: endPos,
        puckVelocity: endVel,
        radialDistance: endPos.magnitude(),
        lastEvaluation: evalEnd,
        kineticEnergy: normalizeZero(nextKe),
        cumulativeFrictionWorkLab: state.cumulativeFrictionWorkLab + staticWorkLab,
      },
      remainingTime: 0,
    };
  }

  // Localized breakaway inside [0, h]
  if (ctx.eventsThisOuterStep >= DYNAMICS_CONSTANTS.MAX_EVENTS_PER_STEP) {
    ctx.overflowed = true;
    return {
      nextState: {
        ...state,
        maxEventsPerStepReached: true,
      },
      remainingTime: h,
    };
  }

  const breakDt = clamp(breakOffset, 0, h);
  const { nextAngle: breakAngle, nextOmega: breakOmega } = advanceTableKinematics(
    state,
    p.alpha,
    breakDt
  );
  const breakPos =
    breakDt === 0
      ? state.puckPosition.clone()
      : positionFromTablePolar(rStick, breakAngle, phiLocal);
  const breakVel =
    breakDt === 0 ? state.puckVelocity.clone() : surfaceVelocityAt(breakPos, breakOmega);

  const staticWorkBeforeBreak =
    breakDt === 0
      ? 0
      : 0.5 *
        p.mass *
        rStick *
        rStick *
        (breakOmega * breakOmega - state.tableOmega * state.tableOmega);

  const breakEval =
    breakDt === 0
      ? state.lastEvaluation
      : evaluateTurntableFriction(rawParams, breakPos, breakVel, breakOmega, p.alpha);

  ctx.eventsThisOuterStep += 1;
  const eventHistory = appendBoundedEvent(
    state.events,
    {
      type: 'breakaway',
      time: state.time + breakDt,
      position: breakPos,
      puckVelocity: breakVel,
      tableOmega: breakOmega,
      relativeSpeed: breakEval.relativeSpeed,
      surfaceAccelerationMag: breakEval.surfaceAccelerationMag,
    },
    state.totalEventsRecorded
  );

  const nextState: TurntableDynamicState = {
    ...state,
    time: state.time + breakDt,
    phase: 'kinetic-slip',
    tableAngleRad: breakAngle,
    tableOmega: breakOmega,
    puckPosition: breakPos,
    puckVelocity: breakVel,
    radialDistance: breakPos.magnitude(),
    lastEvaluation: breakEval,
    breakawayCount: state.breakawayCount + 1,
    kineticEnergy: normalizeZero(0.5 * p.mass * breakVel.dot(breakVel)),
    cumulativeFrictionWorkLab: state.cumulativeFrictionWorkLab + staticWorkBeforeBreak,
    events: eventHistory.events,
    totalEventsRecorded: eventHistory.totalCount,
    eventHistoryTruncated: eventHistory.truncated,
    isDepartingBreakaway: true,
  };

  return {
    nextState,
    remainingTime: h - breakDt,
  };
}

function advanceTurntableKineticSegment(
  state: TurntableDynamicState,
  ctx: TurntableStepContext,
  h: number,
  subdivisionDepth: number,
  exitingZero: boolean
): { nextState: TurntableDynamicState; remainingTime: number } {
  const { p, rawParams } = ctx;
  const epsV = CIRCULAR_MOTION_CONSTANTS.RELATIVE_VELOCITY_EPSILON;

  const pos0 = state.puckPosition;
  const vel0 = state.puckVelocity;
  const omega0 = state.tableOmega;
  const theta0 = state.tableAngleRad;

  const vRel0 = vel0.sub(surfaceVelocityAt(pos0, omega0));
  const speedRel0 = vRel0.magnitude();

  // Handle already-near-zero relative speed cleanly before moving
  if (speedRel0 <= epsV && !exitingZero) {
    const snappedVel = surfaceVelocityAt(pos0, omega0);
    const evalZero = evaluateTurntableFriction(rawParams, pos0, snappedVel, omega0, p.alpha);
    if (evalZero.canRestick) {
      if (ctx.eventsThisOuterStep >= DYNAMICS_CONSTANTS.MAX_EVENTS_PER_STEP) {
        ctx.overflowed = true;
        return {
          nextState: { ...state, maxEventsPerStepReached: true },
          remainingTime: h,
        };
      }
      ctx.eventsThisOuterStep += 1;
      const rNow = pos0.magnitude();
      const phiNow =
        rNow > CIRCULAR_MOTION_CONSTANTS.SURFACE_ACCEL_EPSILON
          ? Math.atan2(pos0.y, pos0.x) - theta0
          : state.stuckLocalAngleRad;

      const ev = appendBoundedEvent(
        state.events,
        {
          type: 'restick',
          time: state.time,
          position: pos0,
          puckVelocity: snappedVel,
          tableOmega: omega0,
          relativeSpeed: 0,
          surfaceAccelerationMag: evalZero.surfaceAccelerationMag,
        },
        state.totalEventsRecorded
      );

      return {
        nextState: {
          ...state,
          phase: evalZero.regime === 'at-rest' ? 'at-rest' : 'static',
          puckVelocity: snappedVel,
          radialDistance: rNow,
          stuckRadius: rNow,
          stuckLocalAngleRad: phiNow,
          lastEvaluation: evalZero,
          restickCount: state.restickCount + 1,
          kineticEnergy: normalizeZero(0.5 * p.mass * snappedVel.dot(snappedVel)),
          events: ev.events,
          totalEventsRecorded: ev.totalCount,
          eventHistoryTruncated: ev.truncated,
          isDepartingBreakaway: false,
        },
        remainingTime: h,
      };
    }

    // Cannot restick: immediately advance with onset kinetic slip acceleration
    exitingZero = true;
  }

  const a0 = computeKineticAcceleration(
    pos0,
    vel0,
    omega0,
    p.alpha,
    p.kineticFriction,
    p.gravity,
    exitingZero || speedRel0 <= epsV
  );

  // Velocity Verlet position and velocity predictor
  const pos1 = pos0.add(vel0.scale(h)).add(a0.scale(0.5 * h * h));
  const velPred = vel0.add(a0.scale(h));
  const { nextAngle: theta1, nextOmega: omega1 } = advanceTableKinematics(state, p.alpha, h);

  const vRelPred = velPred.sub(surfaceVelocityAt(pos1, omega1));
  const dV = vRelPred.sub(vRel0);
  const dVSq = dV.dot(dV);

  if (!exitingZero && dVSq > 0) {
    const tauMin = clamp(-vRel0.dot(dV) / dVSq, 0, 1);
    const vRelMin = vRel0.add(dV.scale(tauMin));
    const sMin = vRelMin.magnitude();
    const dotSignFlip = vRel0.dot(vRelPred) <= 0;

    // Check genuine zero-crossing / closest approach within ε_v
    if (sMin <= epsV && tauMin > 0) {
      const dtCross = tauMin * h;
      const posCross = pos0.add(vel0.scale(dtCross)).add(a0.scale(0.5 * dtCross * dtCross));
      const { nextAngle: thetaCross, nextOmega: omegaCross } = advanceTableKinematics(
        state,
        p.alpha,
        dtCross
      );
      const velSurfaceCross = surfaceVelocityAt(posCross, omegaCross);

      // Simpson's quadrature for scalar relative speed over [0, dtCross]
      const hHalf = 0.5 * dtCross;
      const posMid = pos0.add(vel0.scale(hHalf)).add(a0.scale(0.5 * hHalf * hHalf));
      const velMid = vel0.add(a0.scale(hHalf));
      const omegaMid = omega0 + p.alpha * hHalf;
      const sMid = velMid.sub(surfaceVelocityAt(posMid, omegaMid)).magnitude();
      const sEndApprox = Math.max(0, sMin);
      const thermalCross =
        p.kineticFriction * p.mass * p.gravity * ((dtCross / 6) * (speedRel0 + 4 * sMid + sEndApprox));

      // Consistent kinetic force at end of deceleration segment (no overshoot sign flip)
      const f0 = a0.scale(p.mass);
      const power0 = f0.dot(vel0);
      const powerEnd = f0.dot(velSurfaceCross);
      const workLabCross = 0.5 * (power0 + powerEnd) * dtCross;

      const evalCross = evaluateTurntableFriction(
        rawParams,
        posCross,
        velSurfaceCross,
        omegaCross,
        p.alpha
      );

      if (ctx.eventsThisOuterStep >= DYNAMICS_CONSTANTS.MAX_EVENTS_PER_STEP) {
        ctx.overflowed = true;
        return {
          nextState: { ...state, maxEventsPerStepReached: true },
          remainingTime: h,
        };
      }
      ctx.eventsThisOuterStep += 1;

      const rCross = posCross.magnitude();
      const phiCross =
        rCross > CIRCULAR_MOTION_CONSTANTS.SURFACE_ACCEL_EPSILON
          ? Math.atan2(posCross.y, posCross.x) - thetaCross
          : state.stuckLocalAngleRad;

      if (evalCross.canRestick) {
        const ev = appendBoundedEvent(
          state.events,
          {
            type: 'restick',
            time: state.time + dtCross,
            position: posCross,
            puckVelocity: velSurfaceCross,
            tableOmega: omegaCross,
            relativeSpeed: 0,
            surfaceAccelerationMag: evalCross.surfaceAccelerationMag,
          },
          state.totalEventsRecorded
        );

        return {
          nextState: {
            ...state,
            time: state.time + dtCross,
            phase: evalCross.regime === 'at-rest' ? 'at-rest' : 'static',
            tableAngleRad: thetaCross,
            tableOmega: omegaCross,
            puckPosition: posCross,
            puckVelocity: velSurfaceCross,
            radialDistance: rCross,
            stuckRadius: rCross,
            stuckLocalAngleRad: phiCross,
            lastEvaluation: evalCross,
            restickCount: state.restickCount + 1,
            kineticEnergy: normalizeZero(0.5 * p.mass * velSurfaceCross.dot(velSurfaceCross)),
            cumulativeFrictionWorkLab: state.cumulativeFrictionWorkLab + workLabCross,
            cumulativeThermalDissipation: state.cumulativeThermalDissipation + thermalCross,
            events: ev.events,
            totalEventsRecorded: ev.totalCount,
            eventHistoryTruncated: ev.truncated,
            isDepartingBreakaway: false,
          },
          remainingTime: h - dtCross,
        };
      }

      // Pass smoothly through v_rel = 0 without artificial sticking or bounce
      const ev = appendBoundedEvent(
        state.events,
        {
          type: 'zero-crossing-pass-through',
          time: state.time + dtCross,
          position: posCross,
          puckVelocity: velSurfaceCross,
          tableOmega: omegaCross,
          relativeSpeed: 0,
          surfaceAccelerationMag: evalCross.surfaceAccelerationMag,
        },
        state.totalEventsRecorded
      );

      const midState: TurntableDynamicState = {
        ...state,
        time: state.time + dtCross,
        phase: 'kinetic-slip',
        tableAngleRad: thetaCross,
        tableOmega: omegaCross,
        puckPosition: posCross,
        puckVelocity: velSurfaceCross,
        radialDistance: rCross,
        lastEvaluation: evalCross,
        kineticEnergy: normalizeZero(0.5 * p.mass * velSurfaceCross.dot(velSurfaceCross)),
        cumulativeFrictionWorkLab: state.cumulativeFrictionWorkLab + workLabCross,
        cumulativeThermalDissipation: state.cumulativeThermalDissipation + thermalCross,
        events: ev.events,
        totalEventsRecorded: ev.totalCount,
        eventHistoryTruncated: ev.truncated,
        isDepartingBreakaway: true,
      };

      const remDt = h - dtCross;
      if (remDt <= 0) {
        return { nextState: midState, remainingTime: 0 };
      }

      return advanceTurntableKineticSegment(midState, ctx, remDt, subdivisionDepth, true);
    }

    // Curved relative turn causing dot-flip while speed stayed > ε_v: subdivide for precision
    if (dotSignFlip && subdivisionDepth < DYNAMICS_CONSTANTS.MAX_CROSSING_SUBDIVISIONS) {
      const half = 0.5 * h;
      const firstHalf = advanceTurntableKineticSegment(
        state,
        ctx,
        half,
        subdivisionDepth + 1,
        false
      );
      if (ctx.overflowed || firstHalf.remainingTime > 0) {
        return {
          nextState: firstHalf.nextState,
          remainingTime: firstHalf.remainingTime + half,
        };
      }
      return advanceTurntableKineticSegment(
        firstHalf.nextState,
        ctx,
        half,
        subdivisionDepth + 1,
        false
      );
    }
  }

  // Velocity Verlet corrector
  const a1 = computeKineticAcceleration(
    pos1,
    velPred,
    omega1,
    p.alpha,
    p.kineticFriction,
    p.gravity,
    exitingZero
  );
  const vel1 = vel0.add(a0.add(a1).scale(0.5 * h));
  const vRel1 = vel1.sub(surfaceVelocityAt(pos1, omega1));
  const speedRel1 = vRel1.magnitude();

  // Re-check corrector end state for zero crossing when not already exiting zero
  if (
    !exitingZero &&
    (speedRel1 <= epsV || vRel0.dot(vRel1) <= 0) &&
    subdivisionDepth < DYNAMICS_CONSTANTS.MAX_CROSSING_SUBDIVISIONS
  ) {
    const half = 0.5 * h;
    const firstHalf = advanceTurntableKineticSegment(
      state,
      ctx,
      half,
      subdivisionDepth + 1,
      false
    );
    if (ctx.overflowed || firstHalf.remainingTime > 0) {
      return {
        nextState: firstHalf.nextState,
        remainingTime: firstHalf.remainingTime + half,
      };
    }
    return advanceTurntableKineticSegment(
      firstHalf.nextState,
      ctx,
      half,
      subdivisionDepth + 1,
      false
    );
  }

  // Simpson's 1/3 quadrature for nonnegative scalar thermal dissipation
  const hHalf = 0.5 * h;
  const posMid = pos0.add(vel0.scale(hHalf)).add(a0.scale(0.5 * hHalf * hHalf));
  const velMid = vel0.add(vel1).scale(0.5);
  const omegaMid = omega0 + p.alpha * hHalf;
  const speedRelMid = velMid.sub(surfaceVelocityAt(posMid, omegaMid)).magnitude();

  const thermalDelta =
    p.kineticFriction *
    p.mass *
    p.gravity *
    ((h / 6) * (speedRel0 + 4 * speedRelMid + speedRel1));

  // Trapezoidal quadrature for signed lab-frame kinetic friction work
  const f0 = a0.scale(p.mass);
  const f1 = a1.scale(p.mass);
  const workLabDelta = 0.5 * (f0.dot(vel0) + f1.dot(vel1)) * h;

  const eval1 = evaluateTurntableFriction(rawParams, pos1, vel1, omega1, p.alpha);
  const stillDeparting =
    state.isDepartingBreakaway && !(eval1.isBreakaway && eval1.relativeSpeed > epsV);

  return {
    nextState: {
      ...state,
      time: state.time + h,
      phase: 'kinetic-slip',
      tableAngleRad: theta1,
      tableOmega: omega1,
      puckPosition: pos1,
      puckVelocity: vel1,
      radialDistance: pos1.magnitude(),
      lastEvaluation: eval1,
      kineticEnergy: normalizeZero(0.5 * p.mass * vel1.dot(vel1)),
      cumulativeFrictionWorkLab: state.cumulativeFrictionWorkLab + workLabDelta,
      cumulativeThermalDissipation: state.cumulativeThermalDissipation + Math.max(0, thermalDelta),
      isDepartingBreakaway: stillDeparting,
    },
    remainingTime: 0,
  };
}

export function stepTurntableState(
  state: TurntableDynamicState,
  params: HorizontalCircularParams,
  dt: number
): TurntableDynamicState {
  assertValidDt(dt);
  const resolved = validateTurntableDynamicParams(params);

  if (!isTurntableStateFinite(state)) {
    const recovered = createInitialTurntableState(params);
    const resetState: TurntableDynamicState = {
      ...recovered,
      recoveredFromNonFinite: true,
    };
    if (dt === 0) {
      return resetState;
    }
    return stepTurntableState(resetState, params, dt);
  }

  if (dt === 0) {
    return {
      ...state,
      maxEventsPerStepReached: false,
      unconsumedTimeAfterOverflow: 0,
      recoveredFromNonFinite: false,
    };
  }

  let current: TurntableDynamicState = {
    ...state,
    maxEventsPerStepReached: false,
    unconsumedTimeAfterOverflow: 0,
    recoveredFromNonFinite: false,
  };

  const ctx: TurntableStepContext = {
    rawParams: params,
    p: resolved,
    eventsThisOuterStep: 0,
    overflowed: false,
  };

  const stepCount = Math.max(1, Math.ceil(dt / DYNAMICS_CONSTANTS.INTERNAL_SUBSTEP_DT));
  let consumedTotal = 0;

  for (let i = 0; i < stepCount; i++) {
    const isLast = i === stepCount - 1;
    const hBase = isLast ? Math.max(0, dt - consumedTotal) : dt / stepCount;
    let rem = hBase;

    while (rem > 0) {
      const res =
        current.phase === 'kinetic-slip'
          ? advanceTurntableKineticSegment(current, ctx, rem, 0, current.isDepartingBreakaway)
          : advanceTurntableStaticSegment(current, ctx, rem);

      const consumed = rem - res.remainingTime;
      current = res.nextState;
      consumedTotal += consumed;
      rem = res.remainingTime;

      if (ctx.overflowed) {
        return {
          ...current,
          maxEventsPerStepReached: true,
          unconsumedTimeAfterOverflow: Math.max(0, dt - consumedTotal),
        };
      }
    }

    if (!isTurntableStateFinite(current)) {
      const recovered = createInitialTurntableState(params);
      return {
        ...recovered,
        recoveredFromNonFinite: true,
      };
    }
  }

  return current;
}

// ============================================================================
// Task B: Vertical-Circle Projectile & Taut-String Event Solver
// ============================================================================

export type VerticalCircleDynamicPhase =
  | 'at-rest'
  | 'circular'
  | 'asymptotic-separatrix'
  | 'projectile';

export type VerticalCircleEventType =
  | 'slackening'
  | 'taut-impact'
  | 'immediate-reslacken';

export interface VerticalCircleEventRecord {
  readonly type: VerticalCircleEventType;
  readonly time: number;
  readonly angleRad: number;
  readonly position: Vector2;
  readonly speedBefore: number;
  readonly speedAfter: number;
  readonly radialSpeedBefore: number;
  readonly tangentialSpeed: number;
  readonly energyLost: number;
  readonly tensionAfter: number;
}

export interface VerticalCircleDynamicState {
  readonly time: number;
  readonly phase: VerticalCircleDynamicPhase;
  readonly initialRegime: VerticalCircleRegime;
  readonly thetaRad: number;
  readonly omega: number;
  readonly position: Vector2;
  readonly velocity: Vector2;
  readonly radialDistance: number;
  /** Actual constraint tension (0 in projectile phase; >= 0 in flexible circular arc; signed in rigid rod) */
  readonly tension: number;
  readonly isInCompression: boolean;
  readonly kineticEnergy: number;
  readonly potentialEnergy: number;
  readonly totalMechanicalEnergy: number;
  readonly cumulativeEnergyLost: number;
  readonly slackeningCount: number;
  readonly tautImpactCount: number;
  readonly immediateReslackenCount: number;
  readonly events: readonly VerticalCircleEventRecord[];
  readonly totalEventsRecorded: number;
  readonly eventHistoryTruncated: boolean;
  readonly maxEventsPerStepReached: boolean;
  readonly unconsumedTimeAfterOverflow: number;
  readonly hasEnteredInteriorDuringFlight: boolean;
  readonly recoveredFromNonFinite: boolean;
}

function circularPosition(radius: number, thetaRad: number): Vector2 {
  return new Vector2(radius * Math.sin(thetaRad), -radius * Math.cos(thetaRad));
}

function circularVelocity(radius: number, thetaRad: number, omega: number): Vector2 {
  const v = radius * omega;
  return new Vector2(v * Math.cos(thetaRad), v * Math.sin(thetaRad));
}

function circularTension(
  mass: number,
  radius: number,
  gravity: number,
  thetaRad: number,
  omega: number
): number {
  return mass * radius * omega * omega + mass * gravity * Math.cos(thetaRad);
}

function mechanicalEnergiesFromCartesian(
  position: Vector2,
  velocity: Vector2,
  radius: number,
  mass: number,
  gravity: number
): { kineticEnergy: number; potentialEnergy: number; totalMechanicalEnergy: number } {
  const kineticEnergy = normalizeZero(0.5 * mass * velocity.dot(velocity));
  const height = position.y + radius;
  const potentialEnergy = normalizeZero(mass * gravity * height);
  return {
    kineticEnergy,
    potentialEnergy,
    totalMechanicalEnergy: normalizeZero(kineticEnergy + potentialEnergy),
  };
}

function rk4StepCircular(
  theta0: number,
  omega0: number,
  gravity: number,
  radius: number,
  h: number
): { theta: number; omega: number } {
  const gOverR = gravity / radius;

  const k1Theta = omega0;
  const k1Omega = -gOverR * Math.sin(theta0);

  const th2 = theta0 + 0.5 * h * k1Theta;
  const om2 = omega0 + 0.5 * h * k1Omega;
  const k2Theta = om2;
  const k2Omega = -gOverR * Math.sin(th2);

  const th3 = theta0 + 0.5 * h * k2Theta;
  const om3 = omega0 + 0.5 * h * k2Omega;
  const k3Theta = om3;
  const k3Omega = -gOverR * Math.sin(th3);

  const th4 = theta0 + h * k3Theta;
  const om4 = omega0 + h * k3Omega;
  const k4Theta = om4;
  const k4Omega = -gOverR * Math.sin(th4);

  return {
    theta: theta0 + (h / 6) * (k1Theta + 2 * k2Theta + 2 * k3Theta + k4Theta),
    omega: omega0 + (h / 6) * (k1Omega + 2 * k2Omega + 2 * k3Omega + k4Omega),
  };
}

function propagateProjectile(
  position: Vector2,
  velocity: Vector2,
  gravity: number,
  tau: number
): { position: Vector2; velocity: Vector2 } {
  return {
    position: new Vector2(
      position.x + velocity.x * tau,
      position.y + velocity.y * tau - 0.5 * gravity * tau * tau
    ),
    velocity: new Vector2(velocity.x, velocity.y - gravity * tau),
  };
}

function evaluateSeparatrixAtTime(
  time: number,
  radius: number,
  mass: number,
  gravity: number
): { thetaRad: number; omega: number; position: Vector2; velocity: Vector2; tension: number } {
  const omega0 = Math.sqrt(gravity / radius);
  const expTerm = Math.exp(-omega0 * time);
  // θ(t) = π - 4 atan(e^(-ω0 t)) ∈ [0, π) strictly monotonic without crossing π
  const rawTheta = Math.PI - 4 * Math.atan(expTerm);
  const thetaRad = Math.min(rawTheta, Math.PI);
  const cosHalf = Math.cos(0.5 * thetaRad);
  const omega = 2 * omega0 * Math.max(0, cosHalf);
  const position = circularPosition(radius, thetaRad);
  const velocity = circularVelocity(radius, thetaRad, omega);
  const tension = circularTension(mass, radius, gravity, thetaRad, omega);
  return { thetaRad, omega, position, velocity, tension };
}

function isVerticalCircleStateFinite(state: VerticalCircleDynamicState): boolean {
  if (typeof state !== 'object' || state === null) {
    return false;
  }
  return (
    Number.isFinite(state.time) &&
    Number.isFinite(state.thetaRad) &&
    Number.isFinite(state.omega) &&
    Number.isFinite(state.position?.x) &&
    Number.isFinite(state.position?.y) &&
    Number.isFinite(state.velocity?.x) &&
    Number.isFinite(state.velocity?.y) &&
    Number.isFinite(state.radialDistance) &&
    Number.isFinite(state.tension) &&
    Number.isFinite(state.kineticEnergy) &&
    Number.isFinite(state.potentialEnergy) &&
    Number.isFinite(state.totalMechanicalEnergy) &&
    Number.isFinite(state.cumulativeEnergyLost) &&
    Number.isFinite(state.slackeningCount) &&
    Number.isFinite(state.tautImpactCount) &&
    Number.isFinite(state.immediateReslackenCount) &&
    Number.isFinite(state.unconsumedTimeAfterOverflow)
  );
}

export interface VerticalCircleInitialOptions {
  readonly initialPhase?: 'circular' | 'projectile';
  readonly initialPosition?: Vector2;
  readonly initialVelocity?: Vector2;
}

export function createInitialVerticalCircleState(
  params: VerticalCircleParams,
  options: VerticalCircleInitialOptions = {}
): VerticalCircleDynamicState {
  const p = validateVerticalDynamicParams(params);
  const regimeAnalysis = classifyVerticalCircleRegime(params);

  if (options.initialPhase === 'projectile') {
    if (p.linkageType !== 'flexible-string') {
      throw new Error("initialPhase 'projectile' requires linkageType 'flexible-string'.");
    }
    if (!options.initialPosition || !options.initialVelocity) {
      throw new Error(
        "initialPosition and initialVelocity are required when initialPhase is 'projectile'."
      );
    }
    const pos = options.initialPosition.clone();
    const vel = options.initialVelocity.clone();
    if (
      !Number.isFinite(pos.x) ||
      !Number.isFinite(pos.y) ||
      !Number.isFinite(vel.x) ||
      !Number.isFinite(vel.y)
    ) {
      throw new Error('Invalid projectile initialPosition or initialVelocity: must be finite.');
    }
    const rMag = pos.magnitude();
    if (rMag > p.radius + 1e-12) {
      throw new Error(
        `Invalid initialPosition: projectile cannot start outside circle radius R=${p.radius} m (received |r|=${rMag}).`
      );
    }
    const energies = mechanicalEnergiesFromCartesian(pos, vel, p.radius, p.mass, p.gravity);
    const rSq = pos.dot(pos);
    const omegaInstant =
      rSq >
      CIRCULAR_MOTION_CONSTANTS.MIN_SAFE_RADIUS *
        CIRCULAR_MOTION_CONSTANTS.MIN_SAFE_RADIUS *
        1e-6
        ? (pos.x * vel.y - pos.y * vel.x) / rSq
        : 0;
    const insideThreshold = p.radius * (1 - DYNAMICS_CONSTANTS.INTERIOR_DEPARTURE_REL);
    return {
      time: 0,
      phase: 'projectile',
      initialRegime: regimeAnalysis.regime,
      thetaRad: Math.atan2(pos.x, -pos.y),
      omega: omegaInstant,
      position: pos,
      velocity: vel,
      radialDistance: rMag,
      tension: 0,
      isInCompression: false,
      kineticEnergy: energies.kineticEnergy,
      potentialEnergy: energies.potentialEnergy,
      totalMechanicalEnergy: energies.totalMechanicalEnergy,
      cumulativeEnergyLost: 0,
      slackeningCount: 0,
      tautImpactCount: 0,
      immediateReslackenCount: 0,
      events: [],
      totalEventsRecorded: 0,
      eventHistoryTruncated: false,
      maxEventsPerStepReached: false,
      unconsumedTimeAfterOverflow: 0,
      hasEnteredInteriorDuringFlight: rMag < insideThreshold || pos.dot(vel) < 0,
      recoveredFromNonFinite: false,
    };
  }

  const theta0 = 0;
  const omega0 = p.initialSpeed / p.radius;
  const position = circularPosition(p.radius, theta0);
  const velocity = circularVelocity(p.radius, theta0, omega0);
  const tension = circularTension(p.mass, p.radius, p.gravity, theta0, omega0);
  const energies = mechanicalEnergiesFromCartesian(
    position,
    velocity,
    p.radius,
    p.mass,
    p.gravity
  );

  let phase: VerticalCircleDynamicPhase = 'circular';
  if (regimeAnalysis.regime === 'at-rest') {
    phase = 'at-rest';
  } else if (regimeAnalysis.regime === 'asymptotic-separatrix') {
    phase = 'asymptotic-separatrix';
  }

  return {
    time: 0,
    phase,
    initialRegime: regimeAnalysis.regime,
    thetaRad: theta0,
    omega: omega0,
    position,
    velocity,
    radialDistance: p.radius,
    tension: normalizeZero(tension),
    isInCompression: false,
    kineticEnergy: energies.kineticEnergy,
    potentialEnergy: energies.potentialEnergy,
    totalMechanicalEnergy: energies.totalMechanicalEnergy,
    cumulativeEnergyLost: 0,
    slackeningCount: 0,
    tautImpactCount: 0,
    immediateReslackenCount: 0,
    events: [],
    totalEventsRecorded: 0,
    eventHistoryTruncated: false,
    maxEventsPerStepReached: false,
    unconsumedTimeAfterOverflow: 0,
    hasEnteredInteriorDuringFlight: false,
    recoveredFromNonFinite: false,
  };
}

interface VerticalStepContext {
  readonly p: ResolvedVerticalParams;
  eventsThisOuterStep: number;
  overflowed: boolean;
}

function shouldSlackTriggerOnCircularStep(
  state: VerticalCircleDynamicState,
  p: ResolvedVerticalParams,
  thetaNext: number,
  tStart: number,
  tEnd: number
): boolean {
  if (p.linkageType !== 'flexible-string') {
    return false;
  }
  // Protect exact v0 = sqrt(2gR) and initial-pass v0 = sqrt(5gR) against tiny RK4 / ULP drift
  if (state.slackeningCount === 0 && state.tautImpactCount === 0) {
    if (
      state.initialRegime === 'horizontal-threshold' ||
      state.initialRegime === 'oscillatory' ||
      state.initialRegime === 'complete-loop'
    ) {
      return false;
    }
  }

  // Must genuinely be in upper semicircle (cos θ < -ε) and above horizontal energy level
  if (Math.cos(thetaNext) >= DYNAMICS_CONSTANTS.UPPER_SEMICIRCLE_COS_GUARD) {
    return false;
  }

  const posNext = circularPosition(p.radius, thetaNext);
  // Check circular energy strictly above mgR so turning points at θ = ±π/2 never slacken
  const hNext = posNext.y + p.radius;
  const tCrit =
    tStart >= 0
      ? -DYNAMICS_CONSTANTS.CIRCULAR_SLACK_TENSION_GUARD
      : -CIRCULAR_MOTION_CONSTANTS.TENSION_EPSILON;

  if (tEnd >= tCrit) {
    return false;
  }

  return hNext > p.radius * (1 + DYNAMICS_CONSTANTS.HORIZONTAL_ENERGY_MARGIN_REL);
}

function bisectCircularSlackTime(
  theta0: number,
  omega0: number,
  p: ResolvedVerticalParams,
  h: number
): { tau: number; theta: number; omega: number } {
  let lo = 0;
  let hi = h;

  for (let iter = 0; iter < DYNAMICS_CONSTANTS.BISECTION_MAX_ITERATIONS; iter++) {
    const mid = 0.5 * (lo + hi);
    const stepMid = rk4StepCircular(theta0, omega0, p.gravity, p.radius, mid);
    const tMid = circularTension(p.mass, p.radius, p.gravity, stepMid.theta, stepMid.omega);
    if (tMid > 0) {
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo <= DYNAMICS_CONSTANTS.BISECTION_TIME_TOLERANCE) {
      break;
    }
  }

  const tau = 0.5 * (lo + hi);
  const stepFinal = rk4StepCircular(theta0, omega0, p.gravity, p.radius, tau);
  return { tau, theta: stepFinal.theta, omega: stepFinal.omega };
}

function bisectProjectileTautTime(
  position0: Vector2,
  velocity0: Vector2,
  radius: number,
  gravity: number,
  loInit: number,
  hiInit: number
): { tau: number; position: Vector2; velocity: Vector2 } {
  let lo = loInit;
  let hi = hiInit;

  for (let iter = 0; iter < DYNAMICS_CONSTANTS.BISECTION_MAX_ITERATIONS; iter++) {
    const mid = 0.5 * (lo + hi);
    const probe = propagateProjectile(position0, velocity0, gravity, mid);
    if (probe.position.magnitude() < radius) {
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo <= DYNAMICS_CONSTANTS.BISECTION_TIME_TOLERANCE) {
      break;
    }
  }

  const tau = hi;
  const endProbe = propagateProjectile(position0, velocity0, gravity, tau);
  return {
    tau,
    position: endProbe.position,
    velocity: endProbe.velocity,
  };
}

function advanceVerticalCircularSegment(
  state: VerticalCircleDynamicState,
  ctx: VerticalStepContext,
  h: number
): { nextState: VerticalCircleDynamicState; remainingTime: number } {
  const { p } = ctx;
  const theta0 = state.thetaRad;
  const omega0 = state.omega;
  const tStart = circularTension(p.mass, p.radius, p.gravity, theta0, omega0);

  const rkNext = rk4StepCircular(theta0, omega0, p.gravity, p.radius, h);
  const rawTEnd = circularTension(p.mass, p.radius, p.gravity, rkNext.theta, rkNext.omega);

  if (shouldSlackTriggerOnCircularStep(state, p, rkNext.theta, tStart, rawTEnd)) {
    if (ctx.eventsThisOuterStep >= DYNAMICS_CONSTANTS.MAX_EVENTS_PER_STEP) {
      ctx.overflowed = true;
      return {
        nextState: { ...state, maxEventsPerStepReached: true },
        remainingTime: h,
      };
    }

    let tauSlack = 0;
    let thetaSlack = theta0;
    let omegaSlack = omega0;

    if (tStart > 0) {
      const root = bisectCircularSlackTime(theta0, omega0, p, h);
      tauSlack = root.tau;
      thetaSlack = root.theta;
      omegaSlack = root.omega;
    }

    const posSlack = circularPosition(p.radius, thetaSlack);
    const velSlack = circularVelocity(p.radius, thetaSlack, omegaSlack);
    const speedSlack = velSlack.magnitude();
    const energies = mechanicalEnergiesFromCartesian(
      posSlack,
      velSlack,
      p.radius,
      p.mass,
      p.gravity
    );

    ctx.eventsThisOuterStep += 1;
    const ev = appendBoundedEvent(
      state.events,
      {
        type: 'slackening',
        time: state.time + tauSlack,
        angleRad: Math.atan2(posSlack.x, -posSlack.y),
        position: posSlack,
        speedBefore: speedSlack,
        speedAfter: speedSlack,
        radialSpeedBefore: 0,
        tangentialSpeed: p.radius * omegaSlack,
        energyLost: 0,
        tensionAfter: 0,
      },
      state.totalEventsRecorded
    );

    return {
      nextState: {
        ...state,
        time: state.time + tauSlack,
        phase: 'projectile',
        thetaRad: Math.atan2(posSlack.x, -posSlack.y),
        omega: omegaSlack,
        position: posSlack,
        velocity: velSlack,
        radialDistance: p.radius,
        tension: 0,
        isInCompression: false,
        kineticEnergy: energies.kineticEnergy,
        potentialEnergy: energies.potentialEnergy,
        totalMechanicalEnergy: energies.totalMechanicalEnergy,
        slackeningCount: state.slackeningCount + 1,
        hasEnteredInteriorDuringFlight: false,
        events: ev.events,
        totalEventsRecorded: ev.totalCount,
        eventHistoryTruncated: ev.truncated,
      },
      remainingTime: h - tauSlack,
    };
  }

  const posEnd = circularPosition(p.radius, rkNext.theta);
  const velEnd = circularVelocity(p.radius, rkNext.theta, rkNext.omega);
  const energies = mechanicalEnergiesFromCartesian(
    posEnd,
    velEnd,
    p.radius,
    p.mass,
    p.gravity
  );
  const reportedTension =
    p.linkageType === 'flexible-string' ? Math.max(0, rawTEnd) : rawTEnd;

  return {
    nextState: {
      ...state,
      time: state.time + h,
      phase: 'circular',
      thetaRad: rkNext.theta,
      omega: rkNext.omega,
      position: posEnd,
      velocity: velEnd,
      radialDistance: p.radius,
      tension: normalizeZero(reportedTension),
      isInCompression: p.linkageType === 'rigid-rod' && rawTEnd < 0,
      kineticEnergy: energies.kineticEnergy,
      potentialEnergy: energies.potentialEnergy,
      totalMechanicalEnergy: energies.totalMechanicalEnergy,
    },
    remainingTime: 0,
  };
}

function advanceVerticalProjectileSegment(
  state: VerticalCircleDynamicState,
  ctx: VerticalStepContext,
  h: number
): { nextState: VerticalCircleDynamicState; remainingTime: number } {
  const { p } = ctx;
  const r0 = state.position;
  const v0 = state.velocity;
  const r0Mag = r0.magnitude();
  const insideThreshold = p.radius * (1 - DYNAMICS_CONSTANTS.INTERIOR_DEPARTURE_REL);

  let enteredInterior = state.hasEnteredInteriorDuringFlight;
  if (!enteredInterior && (r0Mag < insideThreshold || r0.dot(v0) < 0)) {
    enteredInterior = true;
  }

  const endProp = propagateProjectile(r0, v0, p.gravity, h);
  const rEndMag = endProp.position.magnitude();
  const rEndDotVEnd = endProp.position.dot(endProp.velocity);

  // Check if flight dipped inside during this single substep even if it started right on circle
  let loBracket = 0;
  let dippedDuringStep = false;
  if (!enteredInterior && rEndMag >= p.radius && rEndDotVEnd > 0) {
    const midProp = propagateProjectile(r0, v0, p.gravity, 0.5 * h);
    if (midProp.position.magnitude() < insideThreshold) {
      dippedDuringStep = true;
      loBracket = 0.5 * h;
    }
  }

  const hasValidOutwardCrossing =
    (enteredInterior && r0Mag < p.radius && rEndMag >= p.radius && rEndDotVEnd > 0) ||
    dippedDuringStep;

  if (!hasValidOutwardCrossing) {
    if (rEndMag < insideThreshold || rEndDotVEnd < 0) {
      enteredInterior = true;
    }
    const energies = mechanicalEnergiesFromCartesian(
      endProp.position,
      endProp.velocity,
      p.radius,
      p.mass,
      p.gravity
    );
    const thetaInstant = Math.atan2(endProp.position.x, -endProp.position.y);
    const rEndSq = endProp.position.dot(endProp.position);
    const angularSpeedInstant =
      rEndSq > CIRCULAR_MOTION_CONSTANTS.MIN_SAFE_RADIUS * CIRCULAR_MOTION_CONSTANTS.MIN_SAFE_RADIUS * 1e-6
        ? (endProp.position.x * endProp.velocity.y - endProp.position.y * endProp.velocity.x) / rEndSq
        : 0;

    return {
      nextState: {
        ...state,
        time: state.time + h,
        phase: 'projectile',
        thetaRad: thetaInstant,
        omega: angularSpeedInstant,
        position: endProp.position,
        velocity: endProp.velocity,
        radialDistance: rEndMag,
        tension: 0,
        isInCompression: false,
        kineticEnergy: energies.kineticEnergy,
        potentialEnergy: energies.potentialEnergy,
        totalMechanicalEnergy: energies.totalMechanicalEnergy,
        hasEnteredInteriorDuringFlight: enteredInterior,
      },
      remainingTime: 0,
    };
  }

  // Localized outward taut-string impact event
  if (ctx.eventsThisOuterStep >= DYNAMICS_CONSTANTS.MAX_EVENTS_PER_STEP) {
    ctx.overflowed = true;
    return {
      nextState: { ...state, maxEventsPerStepReached: true },
      remainingTime: h,
    };
  }

  const crossing = bisectProjectileTautTime(r0, v0, p.radius, p.gravity, loBracket, h);
  const normalizedImpactPos = crossing.position.normalized().scale(p.radius);
  const impulse = evaluateVerticalTautImpulse(
    normalizedImpactPos,
    crossing.velocity,
    p.radius,
    p.mass,
    p.gravity
  );

  // Guard if numerical boundary edge did not yield strictly outward crossing
  if (!impulse.isOutwardCrossing) {
    const energies = mechanicalEnergiesFromCartesian(
      endProp.position,
      endProp.velocity,
      p.radius,
      p.mass,
      p.gravity
    );
    return {
      nextState: {
        ...state,
        time: state.time + h,
        phase: 'projectile',
        thetaRad: Math.atan2(endProp.position.x, -endProp.position.y),
        omega: 0,
        position: endProp.position,
        velocity: endProp.velocity,
        radialDistance: rEndMag,
        tension: 0,
        isInCompression: false,
        kineticEnergy: energies.kineticEnergy,
        potentialEnergy: energies.potentialEnergy,
        totalMechanicalEnergy: energies.totalMechanicalEnergy,
        hasEnteredInteriorDuringFlight: true,
      },
      remainingTime: 0,
    };
  }

  const speedBefore = crossing.velocity.magnitude();
  const postVel = impulse.postVelocity;
  const speedAfter = postVel.magnitude();
  const postEnergies = mechanicalEnergiesFromCartesian(
    normalizedImpactPos,
    postVel,
    p.radius,
    p.mass,
    p.gravity
  );
  const omegaAfter = impulse.postTangentialSpeed / p.radius;

  ctx.eventsThisOuterStep += 1;
  let evResult = appendBoundedEvent(
    state.events,
    {
      type: 'taut-impact',
      time: state.time + crossing.tau,
      angleRad: impulse.impactAngleRad,
      position: normalizedImpactPos,
      speedBefore,
      speedAfter,
      radialSpeedBefore: impulse.preRadialSpeed,
      tangentialSpeed: impulse.postTangentialSpeed,
      energyLost: impulse.energyLost,
      tensionAfter: impulse.postImpactActualTension,
    },
    state.totalEventsRecorded
  );

  if (impulse.resumesCircularArc) {
    return {
      nextState: {
        ...state,
        time: state.time + crossing.tau,
        phase: 'circular',
        thetaRad: impulse.impactAngleRad,
        omega: omegaAfter,
        position: normalizedImpactPos,
        velocity: postVel,
        radialDistance: p.radius,
        tension: normalizeZero(impulse.postImpactActualTension),
        isInCompression: false,
        kineticEnergy: postEnergies.kineticEnergy,
        potentialEnergy: postEnergies.potentialEnergy,
        totalMechanicalEnergy: postEnergies.totalMechanicalEnergy,
        cumulativeEnergyLost: state.cumulativeEnergyLost + impulse.energyLost,
        tautImpactCount: state.tautImpactCount + 1,
        hasEnteredInteriorDuringFlight: false,
        events: evResult.events,
        totalEventsRecorded: evResult.totalCount,
        eventHistoryTruncated: evResult.truncated,
      },
      remainingTime: h - crossing.tau,
    };
  }

  // Post-impact required tension < -ε_T: immediate re-slackening into projectile flight
  if (ctx.eventsThisOuterStep >= DYNAMICS_CONSTANTS.MAX_EVENTS_PER_STEP) {
    ctx.overflowed = true;
    return {
      nextState: {
        ...state,
        time: state.time + crossing.tau,
        phase: 'projectile',
        thetaRad: impulse.impactAngleRad,
        omega: omegaAfter,
        position: normalizedImpactPos,
        velocity: postVel,
        radialDistance: p.radius,
        tension: 0,
        isInCompression: false,
        kineticEnergy: postEnergies.kineticEnergy,
        potentialEnergy: postEnergies.potentialEnergy,
        totalMechanicalEnergy: postEnergies.totalMechanicalEnergy,
        cumulativeEnergyLost: state.cumulativeEnergyLost + impulse.energyLost,
        tautImpactCount: state.tautImpactCount + 1,
        hasEnteredInteriorDuringFlight: false,
        events: evResult.events,
        totalEventsRecorded: evResult.totalCount,
        eventHistoryTruncated: evResult.truncated,
        maxEventsPerStepReached: true,
      },
      remainingTime: h - crossing.tau,
    };
  }

  ctx.eventsThisOuterStep += 1;
  evResult = appendBoundedEvent(
    evResult.events,
    {
      type: 'immediate-reslacken',
      time: state.time + crossing.tau,
      angleRad: impulse.impactAngleRad,
      position: normalizedImpactPos,
      speedBefore: speedAfter,
      speedAfter,
      radialSpeedBefore: 0,
      tangentialSpeed: impulse.postTangentialSpeed,
      energyLost: 0,
      tensionAfter: 0,
    },
    evResult.totalCount
  );

  return {
    nextState: {
      ...state,
      time: state.time + crossing.tau,
      phase: 'projectile',
      thetaRad: impulse.impactAngleRad,
      omega: omegaAfter,
      position: normalizedImpactPos,
      velocity: postVel,
      radialDistance: p.radius,
      tension: 0,
      isInCompression: false,
      kineticEnergy: postEnergies.kineticEnergy,
      potentialEnergy: postEnergies.potentialEnergy,
      totalMechanicalEnergy: postEnergies.totalMechanicalEnergy,
      cumulativeEnergyLost: state.cumulativeEnergyLost + impulse.energyLost,
      tautImpactCount: state.tautImpactCount + 1,
      immediateReslackenCount: state.immediateReslackenCount + 1,
      hasEnteredInteriorDuringFlight: false,
      events: evResult.events,
      totalEventsRecorded: evResult.totalCount,
      eventHistoryTruncated: evResult.truncated,
    },
    remainingTime: h - crossing.tau,
  };
}

export function stepVerticalCircleState(
  state: VerticalCircleDynamicState,
  params: VerticalCircleParams,
  dt: number
): VerticalCircleDynamicState {
  assertValidDt(dt);
  const resolved = validateVerticalDynamicParams(params);

  if (!isVerticalCircleStateFinite(state)) {
    const recovered = createInitialVerticalCircleState(params);
    const resetState: VerticalCircleDynamicState = {
      ...recovered,
      recoveredFromNonFinite: true,
    };
    if (dt === 0) {
      return resetState;
    }
    return stepVerticalCircleState(resetState, params, dt);
  }

  if (dt === 0) {
    return {
      ...state,
      maxEventsPerStepReached: false,
      unconsumedTimeAfterOverflow: 0,
      recoveredFromNonFinite: false,
    };
  }

  if (state.phase === 'at-rest') {
    return {
      ...state,
      time: state.time + dt,
      maxEventsPerStepReached: false,
      unconsumedTimeAfterOverflow: 0,
      recoveredFromNonFinite: false,
    };
  }

  if (state.phase === 'asymptotic-separatrix') {
    const nextTime = state.time + dt;
    const sep = evaluateSeparatrixAtTime(
      nextTime,
      resolved.radius,
      resolved.mass,
      resolved.gravity
    );
    const energies = mechanicalEnergiesFromCartesian(
      sep.position,
      sep.velocity,
      resolved.radius,
      resolved.mass,
      resolved.gravity
    );
    return {
      ...state,
      time: nextTime,
      phase: 'asymptotic-separatrix',
      thetaRad: sep.thetaRad,
      omega: sep.omega,
      position: sep.position,
      velocity: sep.velocity,
      radialDistance: resolved.radius,
      tension: normalizeZero(sep.tension),
      isInCompression: sep.tension < 0,
      kineticEnergy: energies.kineticEnergy,
      potentialEnergy: energies.potentialEnergy,
      totalMechanicalEnergy: energies.totalMechanicalEnergy,
      maxEventsPerStepReached: false,
      unconsumedTimeAfterOverflow: 0,
      recoveredFromNonFinite: false,
    };
  }

  let current: VerticalCircleDynamicState = {
    ...state,
    maxEventsPerStepReached: false,
    unconsumedTimeAfterOverflow: 0,
    recoveredFromNonFinite: false,
  };

  const ctx: VerticalStepContext = {
    p: resolved,
    eventsThisOuterStep: 0,
    overflowed: false,
  };

  const stepCount = Math.max(1, Math.ceil(dt / DYNAMICS_CONSTANTS.INTERNAL_SUBSTEP_DT));
  let consumedTotal = 0;

  for (let i = 0; i < stepCount; i++) {
    const isLast = i === stepCount - 1;
    const hBase = isLast ? Math.max(0, dt - consumedTotal) : dt / stepCount;
    let rem = hBase;

    while (rem > 0) {
      const res =
        current.phase === 'projectile'
          ? advanceVerticalProjectileSegment(current, ctx, rem)
          : advanceVerticalCircularSegment(current, ctx, rem);

      const consumed = rem - res.remainingTime;
      current = res.nextState;
      consumedTotal += consumed;
      rem = res.remainingTime;

      if (ctx.overflowed) {
        return {
          ...current,
          maxEventsPerStepReached: true,
          unconsumedTimeAfterOverflow: Math.max(0, dt - consumedTotal),
        };
      }
    }

    if (!isVerticalCircleStateFinite(current)) {
      const recovered = createInitialVerticalCircleState(params);
      return {
        ...recovered,
        recoveredFromNonFinite: true,
      };
    }
  }

  return current;
}
