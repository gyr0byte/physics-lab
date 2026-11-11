/**
 * Pure analytical mathematical and physical model for Circular Motion.
 *
 * Implements the official Nepal CDC Physics Grade 11 (First Edition 2024)
 * Chapter 6: Circular Motion (pp. 132–153) requirements across all four modes:
 * 1. Mode 1: Horizontal Circular Motion & Turntable (UCM, non-uniform kinematics, tether & breakaway analytics)
 * 2. Mode 2: Motion in a Vertical Circle (reachability via energy radicand, string vs. rod tension, regimes & taut impulse)
 * 3. Mode 3: Vehicle on Level & Banked Curves (signed lateral friction, normal reaction, speed thresholds, asymptote guard)
 * 4. Mode 4: Conical Pendulum (geometry, tension, angular velocity, mass-independent period, small-angle approximation)
 *
 * All calculations use strict SI units internally:
 *   mass: kg
 *   length / radius / height: m
 *   angle: radians internally (degrees at UI parameter boundaries where specified)
 *   angular velocity: rad/s
 *   angular acceleration: rad/s²
 *   linear velocity / speed: m/s
 *   linear acceleration: m/s²
 *   force / tension / normal reaction: N
 *   energy: Joules (J)
 *   time / period: seconds (s)
 *   frequency: Hz
 *
 * Pure module: zero DOM and zero Canvas dependencies.
 */

import { Vector2 } from '../core/Vector2';

// ============================================================================
// Constants, Tolerances & Parameter Bounds
// ============================================================================

export const CIRCULAR_MOTION_CONSTANTS = {
  /** Standard terrestrial gravitational acceleration in m/s² */
  DEFAULT_GRAVITY: 9.8,
  /** Minimum safe radius in meters to prevent v²/r division-by-zero singularities */
  MIN_SAFE_RADIUS: 0.10,
  /** Energy radicand round-off tolerance ε_q in m²/s² (strictly for [-ε_q, 0) turning boundaries) */
  ENERGY_RADICAND_EPSILON: 1e-9,
  /** Relative velocity threshold ε_v in m/s for turntable static-restick & 0/0 kinetic friction guard */
  RELATIVE_VELOCITY_EPSILON: 1e-4,
  /** Surface acceleration threshold ε_a in m/s² below which stationary turntable exerts zero friction */
  SURFACE_ACCEL_EPSILON: 1e-9,
  /** Post-impact tension admissibility tolerance ε_T in N for flexible string re-slackening check */
  TENSION_EPSILON: 1e-6,
  /** Scaled ULP multiplier against Number.EPSILON for floating-point equality boundary comparisons */
  BOUNDARY_ULP_MULTIPLIER: 64,
} as const;

const MACHINE_BOUNDARY_TOLERANCE_SCALE =
  CIRCULAR_MOTION_CONSTANTS.BOUNDARY_ULP_MULTIPLIER * Number.EPSILON;

export type CircularMotionMode = 'horizontal' | 'vertical' | 'banked' | 'conical';

export interface ParamRange {
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export interface CircularMotionValidationResult {
  valid: boolean;
  errors: string[];
}

// --- Mode 1: Horizontal Circular Motion & Turntable ---

export type HorizontalAttachmentMode = 'tether' | 'friction-surface';

export interface HorizontalCircularParams {
  /** Orbit radius r in meters (0.5 – 5.0 m) */
  radius: number;
  /** Initial angular velocity ω0 in rad/s (-10.0 – +10.0 rad/s) */
  initialAngularVelocity: number;
  /** Constant angular acceleration α in rad/s² (-5.0 – +5.0 rad/s²) */
  angularAcceleration: number;
  /** Particle / puck mass m in kg (0.1 – 5.0 kg) */
  mass: number;
  /** Static friction coefficient μs (0.05 – 1.00) */
  staticFriction: number;
  /** Kinetic friction coefficient μk (0.05 – 0.80, must satisfy μk <= μs) */
  kineticFriction: number;
  /** Tether cord vs. unattached turntable friction surface */
  attachmentMode: HorizontalAttachmentMode;
  /** Gravitational acceleration in m/s² (default: 9.8 m/s²) */
  gravity?: number;
}

export const DEFAULT_HORIZONTAL_PARAMS: HorizontalCircularParams = {
  radius: 2.0,
  initialAngularVelocity: 2.0,
  angularAcceleration: 0.0,
  mass: 1.0,
  staticFriction: 0.50,
  kineticFriction: 0.35,
  attachmentMode: 'tether',
  gravity: CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY,
};

export const HORIZONTAL_PARAM_RANGES = {
  radius: { min: 0.5, max: 5.0, step: 0.1 },
  initialAngularVelocity: { min: -10.0, max: 10.0, step: 0.5 },
  angularAcceleration: { min: -5.0, max: 5.0, step: 0.2 },
  mass: { min: 0.1, max: 5.0, step: 0.1 },
  staticFriction: { min: 0.05, max: 1.00, step: 0.05 },
  kineticFriction: { min: 0.05, max: 0.80, step: 0.05 },
} as const satisfies Record<string, ParamRange>;

// --- Mode 2: Vertical Circle ---

export type VerticalLinkageType = 'flexible-string' | 'rigid-rod';

export interface VerticalCircleParams {
  /** Circle radius / string or rod length R in meters (0.5 – 3.0 m) */
  radius: number;
  /** Initial speed v0 at bottom (θ = 0) in m/s (0.0 – 15.0 m/s) */
  initialSpeed: number;
  /** Bob mass m in kg (0.1 – 5.0 kg) */
  mass: number;
  /** Flexible string (slackens when T <= 0) vs. rigid rod (supports compression T < 0) */
  linkageType: VerticalLinkageType;
  /** Gravitational acceleration in m/s² (default: 9.8 m/s²) */
  gravity?: number;
}

export const DEFAULT_VERTICAL_PARAMS: VerticalCircleParams = {
  radius: 1.5,
  initialSpeed: 9.0,
  mass: 1.0,
  linkageType: 'flexible-string',
  gravity: CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY,
};

export const VERTICAL_PARAM_RANGES = {
  radius: { min: 0.5, max: 3.0, step: 0.1 },
  initialSpeed: { min: 0.0, max: 15.0, step: 0.2 },
  mass: { min: 0.1, max: 5.0, step: 0.1 },
} as const satisfies Record<string, ParamRange>;

// --- Mode 3: Banked Road Curve ---

export interface BankedCurveParams {
  /** Curve radius r in meters (10.0 – 100.0 m) */
  radius: number;
  /** Vehicle speed v in m/s (0.0 – 40.0 m/s) */
  speed: number;
  /** Roadway banking angle θ in degrees (0.0° – 45.0°) */
  bankAngleDeg: number;
  /** Tire-road static friction coefficient μs (0.00 – 0.90) */
  staticFriction: number;
  /** Vehicle mass m in kg (500 – 2500 kg) */
  mass: number;
  /** Gravitational acceleration in m/s² (default: 9.8 m/s²) */
  gravity?: number;
}

export const DEFAULT_BANKED_PARAMS: BankedCurveParams = {
  radius: 40.0,
  speed: 15.0,
  bankAngleDeg: 15.0,
  staticFriction: 0.40,
  mass: 1200,
  gravity: CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY,
};

export const BANKED_PARAM_RANGES = {
  radius: { min: 10.0, max: 100.0, step: 5.0 },
  speed: { min: 0.0, max: 40.0, step: 1.0 },
  bankAngleDeg: { min: 0.0, max: 45.0, step: 1.0 },
  staticFriction: { min: 0.00, max: 0.90, step: 0.05 },
  mass: { min: 500, max: 2500, step: 100 },
} as const satisfies Record<string, ParamRange>;

// --- Mode 4: Conical Pendulum ---

export interface ConicalPendulumParams {
  /** Cord length L in meters (0.5 – 3.0 m) */
  length: number;
  /** Semi-vertical angle θ in degrees (UI range: 5.0° – 80.0°) */
  angleDeg: number;
  /** Pendulum bob mass m in kg (0.1 – 2.0 kg) */
  mass: number;
  /** Gravitational acceleration in m/s² (default: 9.8 m/s²) */
  gravity?: number;
}

export const DEFAULT_CONICAL_PARAMS: ConicalPendulumParams = {
  length: 1.5,
  angleDeg: 30.0,
  mass: 0.5,
  gravity: CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY,
};

export const CONICAL_PARAM_RANGES = {
  length: { min: 0.5, max: 3.0, step: 0.1 },
  angleDeg: { min: 5.0, max: 80.0, step: 1.0 },
  mass: { min: 0.1, max: 2.0, step: 0.1 },
} as const satisfies Record<string, ParamRange>;

// ============================================================================
// Private Math, Precision & Guard Utilities
// ============================================================================

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function normalizeZero(value: number): number {
  return value === 0 ? 0 : value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampUnitInterval(value: number): number {
  return clamp(value, -1, 1);
}

/**
 * Scaled machine-precision equality test: |a - b| <= K_ulp * ε_mach * (|a| + |b|).
 * Preserves exact 0 vs >0 separation while tolerating IEEE-754 sqrt/trig roundoff.
 */
function approxEqualMachine(a: number, b: number): boolean {
  if (a === b) return true;
  const scale = Math.abs(a) + Math.abs(b);
  return Math.abs(a - b) <= MACHINE_BOUNDARY_TOLERANCE_SCALE * scale;
}

function isStrictlyGreaterMachine(a: number, b: number): boolean {
  return a > b && !approxEqualMachine(a, b);
}

function isGreaterOrEqualMachine(a: number, b: number): boolean {
  return a >= b || approxEqualMachine(a, b);
}

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${label}: must be a finite number (received: ${value}).`);
  }
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${label}: must be a positive finite number (received: ${value}).`);
  }
}

function assertNonNegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${label}: must be a non-negative finite number (received: ${value}).`);
  }
}

function resolveGravity(gravity?: number): number {
  const g = gravity ?? CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY;
  assertPositiveFinite(g, 'gravity');
  return g;
}

function clampSafeRadius(radius: number, label: string = 'radius'): number {
  assertNonNegativeFinite(radius, label);
  return Math.max(CIRCULAR_MOTION_CONSTANTS.MIN_SAFE_RADIUS, radius);
}

function checkRange(
  errors: string[],
  value: number,
  label: string,
  range: ParamRange,
  unit: string
): void {
  if (!Number.isFinite(value)) {
    errors.push(`${label} must be a finite number.`);
    return;
  }
  if (value < range.min || value > range.max) {
    const suffix = unit ? ` ${unit}` : '';
    errors.push(`${label} must be between ${range.min} and ${range.max}${suffix}.`);
  }
}

function clampFiniteOrDefault(value: number, range: ParamRange, fallback: number): number {
  return Number.isFinite(value) ? clamp(value, range.min, range.max) : fallback;
}

// ============================================================================
// Parameter Validation & Clamping (Single Source of Truth)
// ============================================================================

export function validateHorizontalCircularParams(
  params: HorizontalCircularParams
): CircularMotionValidationResult {
  const errors: string[] = [];
  if (typeof params !== 'object' || params === null) {
    return { valid: false, errors: ['Parameters must be a non-null object.'] };
  }

  checkRange(errors, params.radius, 'Radius', HORIZONTAL_PARAM_RANGES.radius, 'm');
  checkRange(
    errors,
    params.initialAngularVelocity,
    'Initial angular velocity',
    HORIZONTAL_PARAM_RANGES.initialAngularVelocity,
    'rad/s'
  );
  checkRange(
    errors,
    params.angularAcceleration,
    'Angular acceleration',
    HORIZONTAL_PARAM_RANGES.angularAcceleration,
    'rad/s²'
  );
  checkRange(errors, params.mass, 'Mass', HORIZONTAL_PARAM_RANGES.mass, 'kg');
  checkRange(
    errors,
    params.staticFriction,
    'Static friction coefficient',
    HORIZONTAL_PARAM_RANGES.staticFriction,
    ''
  );
  checkRange(
    errors,
    params.kineticFriction,
    'Kinetic friction coefficient',
    HORIZONTAL_PARAM_RANGES.kineticFriction,
    ''
  );

  if (
    Number.isFinite(params.staticFriction) &&
    Number.isFinite(params.kineticFriction) &&
    params.kineticFriction > params.staticFriction
  ) {
    errors.push(
      'Kinetic friction coefficient must be less than or equal to static friction coefficient (μk <= μs).'
    );
  }

  if (params.attachmentMode !== 'tether' && params.attachmentMode !== 'friction-surface') {
    errors.push("Attachment mode must be 'tether' or 'friction-surface'.");
  }

  if (params.gravity !== undefined && (!Number.isFinite(params.gravity) || params.gravity <= 0)) {
    errors.push('Gravity must be a positive finite number.');
  }

  return { valid: errors.length === 0, errors };
}

export function clampHorizontalCircularParams(
  params: HorizontalCircularParams
): HorizontalCircularParams {
  const staticFriction = clampFiniteOrDefault(
    params.staticFriction,
    HORIZONTAL_PARAM_RANGES.staticFriction,
    DEFAULT_HORIZONTAL_PARAMS.staticFriction
  );
  const rawKinetic = clampFiniteOrDefault(
    params.kineticFriction,
    HORIZONTAL_PARAM_RANGES.kineticFriction,
    DEFAULT_HORIZONTAL_PARAMS.kineticFriction
  );

  return {
    radius: clampFiniteOrDefault(
      params.radius,
      HORIZONTAL_PARAM_RANGES.radius,
      DEFAULT_HORIZONTAL_PARAMS.radius
    ),
    initialAngularVelocity: clampFiniteOrDefault(
      params.initialAngularVelocity,
      HORIZONTAL_PARAM_RANGES.initialAngularVelocity,
      DEFAULT_HORIZONTAL_PARAMS.initialAngularVelocity
    ),
    angularAcceleration: clampFiniteOrDefault(
      params.angularAcceleration,
      HORIZONTAL_PARAM_RANGES.angularAcceleration,
      DEFAULT_HORIZONTAL_PARAMS.angularAcceleration
    ),
    mass: clampFiniteOrDefault(
      params.mass,
      HORIZONTAL_PARAM_RANGES.mass,
      DEFAULT_HORIZONTAL_PARAMS.mass
    ),
    staticFriction,
    kineticFriction: Math.min(rawKinetic, staticFriction),
    attachmentMode:
      params.attachmentMode === 'friction-surface' ? 'friction-surface' : 'tether',
    gravity:
      params.gravity !== undefined && Number.isFinite(params.gravity) && params.gravity > 0
        ? params.gravity
        : CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY,
  };
}

export function validateVerticalCircleParams(
  params: VerticalCircleParams
): CircularMotionValidationResult {
  const errors: string[] = [];
  if (typeof params !== 'object' || params === null) {
    return { valid: false, errors: ['Parameters must be a non-null object.'] };
  }

  checkRange(errors, params.radius, 'Radius', VERTICAL_PARAM_RANGES.radius, 'm');
  checkRange(
    errors,
    params.initialSpeed,
    'Initial bottom speed',
    VERTICAL_PARAM_RANGES.initialSpeed,
    'm/s'
  );
  checkRange(errors, params.mass, 'Mass', VERTICAL_PARAM_RANGES.mass, 'kg');

  if (params.linkageType !== 'flexible-string' && params.linkageType !== 'rigid-rod') {
    errors.push("Linkage type must be 'flexible-string' or 'rigid-rod'.");
  }

  if (params.gravity !== undefined && (!Number.isFinite(params.gravity) || params.gravity <= 0)) {
    errors.push('Gravity must be a positive finite number.');
  }

  return { valid: errors.length === 0, errors };
}

export function clampVerticalCircleParams(params: VerticalCircleParams): VerticalCircleParams {
  return {
    radius: clampFiniteOrDefault(
      params.radius,
      VERTICAL_PARAM_RANGES.radius,
      DEFAULT_VERTICAL_PARAMS.radius
    ),
    initialSpeed: clampFiniteOrDefault(
      params.initialSpeed,
      VERTICAL_PARAM_RANGES.initialSpeed,
      DEFAULT_VERTICAL_PARAMS.initialSpeed
    ),
    mass: clampFiniteOrDefault(
      params.mass,
      VERTICAL_PARAM_RANGES.mass,
      DEFAULT_VERTICAL_PARAMS.mass
    ),
    linkageType: params.linkageType === 'rigid-rod' ? 'rigid-rod' : 'flexible-string',
    gravity:
      params.gravity !== undefined && Number.isFinite(params.gravity) && params.gravity > 0
        ? params.gravity
        : CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY,
  };
}

export function validateBankedCurveParams(
  params: BankedCurveParams
): CircularMotionValidationResult {
  const errors: string[] = [];
  if (typeof params !== 'object' || params === null) {
    return { valid: false, errors: ['Parameters must be a non-null object.'] };
  }

  checkRange(errors, params.radius, 'Curve radius', BANKED_PARAM_RANGES.radius, 'm');
  checkRange(errors, params.speed, 'Vehicle speed', BANKED_PARAM_RANGES.speed, 'm/s');
  checkRange(errors, params.bankAngleDeg, 'Banking angle', BANKED_PARAM_RANGES.bankAngleDeg, '°');
  checkRange(
    errors,
    params.staticFriction,
    'Static friction coefficient',
    BANKED_PARAM_RANGES.staticFriction,
    ''
  );
  checkRange(errors, params.mass, 'Vehicle mass', BANKED_PARAM_RANGES.mass, 'kg');

  if (params.gravity !== undefined && (!Number.isFinite(params.gravity) || params.gravity <= 0)) {
    errors.push('Gravity must be a positive finite number.');
  }

  return { valid: errors.length === 0, errors };
}

export function clampBankedCurveParams(params: BankedCurveParams): BankedCurveParams {
  return {
    radius: clampFiniteOrDefault(
      params.radius,
      BANKED_PARAM_RANGES.radius,
      DEFAULT_BANKED_PARAMS.radius
    ),
    speed: clampFiniteOrDefault(
      params.speed,
      BANKED_PARAM_RANGES.speed,
      DEFAULT_BANKED_PARAMS.speed
    ),
    bankAngleDeg: clampFiniteOrDefault(
      params.bankAngleDeg,
      BANKED_PARAM_RANGES.bankAngleDeg,
      DEFAULT_BANKED_PARAMS.bankAngleDeg
    ),
    staticFriction: clampFiniteOrDefault(
      params.staticFriction,
      BANKED_PARAM_RANGES.staticFriction,
      DEFAULT_BANKED_PARAMS.staticFriction
    ),
    mass: clampFiniteOrDefault(params.mass, BANKED_PARAM_RANGES.mass, DEFAULT_BANKED_PARAMS.mass),
    gravity:
      params.gravity !== undefined && Number.isFinite(params.gravity) && params.gravity > 0
        ? params.gravity
        : CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY,
  };
}

export function validateConicalPendulumParams(
  params: ConicalPendulumParams
): CircularMotionValidationResult {
  const errors: string[] = [];
  if (typeof params !== 'object' || params === null) {
    return { valid: false, errors: ['Parameters must be a non-null object.'] };
  }

  checkRange(errors, params.length, 'String length', CONICAL_PARAM_RANGES.length, 'm');
  checkRange(
    errors,
    params.angleDeg,
    'Semi-vertical angle',
    CONICAL_PARAM_RANGES.angleDeg,
    '°'
  );
  checkRange(errors, params.mass, 'Bob mass', CONICAL_PARAM_RANGES.mass, 'kg');

  if (params.gravity !== undefined && (!Number.isFinite(params.gravity) || params.gravity <= 0)) {
    errors.push('Gravity must be a positive finite number.');
  }

  return { valid: errors.length === 0, errors };
}

export function clampConicalPendulumParams(params: ConicalPendulumParams): ConicalPendulumParams {
  return {
    length: clampFiniteOrDefault(
      params.length,
      CONICAL_PARAM_RANGES.length,
      DEFAULT_CONICAL_PARAMS.length
    ),
    angleDeg: clampFiniteOrDefault(
      params.angleDeg,
      CONICAL_PARAM_RANGES.angleDeg,
      DEFAULT_CONICAL_PARAMS.angleDeg
    ),
    mass: clampFiniteOrDefault(
      params.mass,
      CONICAL_PARAM_RANGES.mass,
      DEFAULT_CONICAL_PARAMS.mass
    ),
    gravity:
      params.gravity !== undefined && Number.isFinite(params.gravity) && params.gravity > 0
        ? params.gravity
        : CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY,
  };
}

// ============================================================================
// Mode 1: Horizontal Circular Motion & Turntable Analytical Engine
// ============================================================================

export interface HorizontalKinematicsResult {
  time: number;
  radius: number;
  thetaRad: number;
  /** Signed arc displacement s = r · θ (m) */
  arcDisplacement: number;
  angularVelocity: number;
  angularAcceleration: number;
  /** Signed tangential velocity v_t = r · ω (m/s, CCW positive) */
  tangentialVelocity: number;
  /** Scalar speed v = r · |ω| >= 0 (m/s) */
  speed: number;
  /** Magnitude of centripetal acceleration a_c = v²/r = r·ω² >= 0 (m/s²) */
  centripetalAccelerationMag: number;
  /** Signed tangential acceleration a_t = r · α (m/s², CCW positive) */
  tangentialAccelerationMag: number;
  /** Magnitude of resultant acceleration |a| = r·√(ω⁴ + α²) (m/s²) */
  resultantAccelerationMag: number;
  position: Vector2;
  /** Outward unit vector r_hat = (cos θ, sin θ) */
  radialUnit: Vector2;
  /** CCW unit tangent vector θ_hat = (-sin θ, cos θ) */
  tangentUnit: Vector2;
  velocityVector: Vector2;
  /** Inward centripetal acceleration vector a_c = -r·ω²·r_hat */
  centripetalAccelerationVector: Vector2;
  /** Tangential acceleration vector a_t = r·α·θ_hat */
  tangentialAccelerationVector: Vector2;
  /** Total acceleration vector a = a_c + a_t */
  resultantAccelerationVector: Vector2;
}

export interface TetherForceBreakdown {
  /** Inward cord tension T_radial = m·r·ω² >= 0 (N) */
  radialTension: number;
  /** Signed tangential guide/actuator force F_t = m·r·α (N) */
  tangentialForce: number;
  /** Net force magnitude m·|a| (N) */
  netForceMag: number;
  radialForceVector: Vector2;
  tangentialForceVector: Vector2;
  netForceVector: Vector2;
}

export interface TurntableBreakawayThreshold {
  /** Critical |ω| (rad/s) where |a_surface| = μs·g; 0 at exact r|α| = μs·g, null when r|α| > μs·g */
  criticalAngularSpeed: number | null;
  /** True when r|α| <= μs·g (within machine tolerance), so static adherence is possible at ω = 0 */
  canAdhereAtRest: boolean;
  /** True when r|α| = μs·g (exact incipient-slip boundary at ω = 0, not actual breakaway) */
  isIncipientAtRest: boolean;
  /** True when r|α| > μs·g, causing immediate breakaway even at ω = 0 */
  breaksImmediatelyFromRest: boolean;
  maxSurfaceAcceleration: number;
  tangentialAccelerationMag: number;
}

export type TurntableFrictionRegime = 'at-rest' | 'static' | 'incipient-slip' | 'kinetic-slip';

export interface TurntableFrictionEvaluation {
  regime: TurntableFrictionRegime;
  surfaceVelocity: Vector2;
  surfaceAcceleration: Vector2;
  surfaceAccelerationMag: number;
  relativeVelocity: Vector2;
  relativeSpeed: number;
  requiredStaticForce: Vector2;
  requiredStaticForceMag: number;
  maxStaticFriction: number;
  isBreakaway: boolean;
  /** True when |v_rel| <= ε_v and |a_surface| <= μs·g (static hold / restick admissible) */
  canRestick: boolean;
  /** Unit slip direction u_slip (null when static / at-rest) */
  slipDirectionUnit: Vector2 | null;
  /** Instantaneous friction force acting on the puck in the lab frame (N) */
  frictionForce: Vector2;
  /** Instantaneous puck acceleration in the lab frame (m/s²) */
  puckAcceleration: Vector2;
  /** Initial relative acceleration at incipient breakaway (null outside incipient-slip) */
  relativeAccelerationAtOnset: Vector2 | null;
}

/**
 * Evaluate exact instantaneous circular kinematics for a given radius, angle, ω, and α.
 */
export function evaluateHorizontalKinematicsState(
  radius: number,
  thetaRad: number,
  omega: number,
  alpha: number,
  time: number = 0
): HorizontalKinematicsResult {
  const r = clampSafeRadius(radius);
  assertFinite(thetaRad, 'thetaRad');
  assertFinite(omega, 'angularVelocity');
  assertFinite(alpha, 'angularAcceleration');
  assertNonNegativeFinite(time, 'time');

  const cosT = Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);

  const radialUnit = new Vector2(normalizeZero(cosT), normalizeZero(sinT));
  const tangentUnit = new Vector2(normalizeZero(-sinT), normalizeZero(cosT));
  const position = radialUnit.scale(r);

  const arcDisplacement = normalizeZero(r * thetaRad);
  const tangentialVelocity = normalizeZero(r * omega);
  const speed = normalizeZero(r * Math.abs(omega));

  const centripetalAccelerationMag = normalizeZero(r * omega * omega);
  const tangentialAccelerationMag = normalizeZero(r * alpha);
  const resultantAccelerationMag = normalizeZero(r * Math.hypot(omega * omega, alpha));

  const velocityVector = tangentUnit.scale(tangentialVelocity);
  const centripetalAccelerationVector = radialUnit.scale(-centripetalAccelerationMag);
  const tangentialAccelerationVector = tangentUnit.scale(tangentialAccelerationMag);
  const resultantAccelerationVector = centripetalAccelerationVector.add(
    tangentialAccelerationVector
  );

  return {
    time,
    radius: r,
    thetaRad,
    arcDisplacement,
    angularVelocity: normalizeZero(omega),
    angularAcceleration: normalizeZero(alpha),
    tangentialVelocity,
    speed,
    centripetalAccelerationMag,
    tangentialAccelerationMag,
    resultantAccelerationMag,
    position,
    radialUnit,
    tangentUnit,
    velocityVector,
    centripetalAccelerationVector,
    tangentialAccelerationVector,
    resultantAccelerationVector,
  };
}

/**
 * Evaluate exact analytical horizontal circular kinematics at time t under constant α.
 */
export function evaluateHorizontalKinematicsAtTime(
  params: HorizontalCircularParams,
  time: number,
  initialThetaRad: number = 0
): HorizontalKinematicsResult {
  assertNonNegativeFinite(time, 'time');
  assertFinite(initialThetaRad, 'initialThetaRad');
  assertFinite(params.initialAngularVelocity, 'initialAngularVelocity');
  assertFinite(params.angularAcceleration, 'angularAcceleration');

  const omega = params.initialAngularVelocity + params.angularAcceleration * time;
  const theta =
    initialThetaRad +
    params.initialAngularVelocity * time +
    0.5 * params.angularAcceleration * time * time;

  return evaluateHorizontalKinematicsState(
    params.radius,
    theta,
    omega,
    params.angularAcceleration,
    time
  );
}

/**
 * Compute radial cord tension and tangential actuator forces for Tether mode.
 */
export function computeTetherForces(
  kinematics: HorizontalKinematicsResult,
  mass: number
): TetherForceBreakdown {
  assertPositiveFinite(mass, 'mass');

  const radialTension = normalizeZero(mass * kinematics.centripetalAccelerationMag);
  const tangentialForce = normalizeZero(mass * kinematics.tangentialAccelerationMag);
  const netForceMag = normalizeZero(mass * kinematics.resultantAccelerationMag);

  const radialForceVector = kinematics.centripetalAccelerationVector.scale(mass);
  const tangentialForceVector = kinematics.tangentialAccelerationVector.scale(mass);
  const netForceVector = radialForceVector.add(tangentialForceVector);

  return {
    radialTension,
    tangentialForce,
    netForceMag,
    radialForceVector,
    tangentialForceVector,
    netForceVector,
  };
}

/**
 * Compute the turntable critical breakaway threshold at given radius and angular acceleration.
 *
 * Strictly distinguishes:
 * - r|α| < μs·g: static adherence possible at ω = 0; positive critical |ω| returned
 * - r|α| = μs·g: exact incipient-slip boundary at ω = 0 (criticalAngularSpeed = 0, NOT breakaway)
 * - r|α| > μs·g: immediate breakaway from rest (criticalAngularSpeed = null)
 */
export function computeTurntableBreakawayThreshold(
  radius: number,
  staticFriction: number,
  angularAcceleration: number = 0,
  gravity: number = CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY
): TurntableBreakawayThreshold {
  const r = clampSafeRadius(radius);
  assertNonNegativeFinite(staticFriction, 'staticFriction');
  assertFinite(angularAcceleration, 'angularAcceleration');
  const g = resolveGravity(gravity);

  const maxSurfaceAcceleration = normalizeZero(staticFriction * g);
  const tangentialAccelerationMag = normalizeZero(r * Math.abs(angularAcceleration));

  if (isStrictlyGreaterMachine(tangentialAccelerationMag, maxSurfaceAcceleration)) {
    return {
      criticalAngularSpeed: null,
      canAdhereAtRest: false,
      isIncipientAtRest: false,
      breaksImmediatelyFromRest: true,
      maxSurfaceAcceleration,
      tangentialAccelerationMag,
    };
  }

  if (approxEqualMachine(tangentialAccelerationMag, maxSurfaceAcceleration)) {
    return {
      criticalAngularSpeed: 0,
      canAdhereAtRest: true,
      isIncipientAtRest: true,
      breaksImmediatelyFromRest: false,
      maxSurfaceAcceleration,
      tangentialAccelerationMag,
    };
  }

  const remainingSq =
    (maxSurfaceAcceleration - tangentialAccelerationMag) *
    (maxSurfaceAcceleration + tangentialAccelerationMag);
  const criticalAngularSpeed = Math.sqrt(Math.sqrt(Math.max(0, remainingSq)) / r);

  return {
    criticalAngularSpeed,
    canAdhereAtRest: true,
    isIncipientAtRest: false,
    breaksImmediatelyFromRest: false,
    maxSurfaceAcceleration,
    tangentialAccelerationMag,
  };
}

/**
 * Evaluate instantaneous turntable surface kinematics, static breakaway condition,
 * zero-velocity incipient slip direction (0/0 singularity resolution), kinetic friction
 * during slip, and resticking admissibility.
 */
export function evaluateTurntableFriction(
  params: Pick<
    HorizontalCircularParams,
    'mass' | 'staticFriction' | 'kineticFriction' | 'gravity'
  >,
  position: Vector2,
  puckVelocity: Vector2,
  omegaTable: number,
  alphaTable: number
): TurntableFrictionEvaluation {
  assertPositiveFinite(params.mass, 'mass');
  assertNonNegativeFinite(params.staticFriction, 'staticFriction');
  assertNonNegativeFinite(params.kineticFriction, 'kineticFriction');
  if (params.kineticFriction > params.staticFriction) {
    throw new Error('Invalid friction: kineticFriction must be <= staticFriction.');
  }
  assertFinite(position.x, 'position.x');
  assertFinite(position.y, 'position.y');
  assertFinite(puckVelocity.x, 'puckVelocity.x');
  assertFinite(puckVelocity.y, 'puckVelocity.y');
  assertFinite(omegaTable, 'omegaTable');
  assertFinite(alphaTable, 'alphaTable');

  const g = resolveGravity(params.gravity);
  const m = params.mass;
  const maxSurfaceAccel = params.staticFriction * g;
  const maxStaticFriction = normalizeZero(m * maxSurfaceAccel);

  // Co-rotating surface velocity: v_surface = ω_table k̂ × r = (-ω y, ω x)
  const surfaceVelocity = new Vector2(
    normalizeZero(-omegaTable * position.y),
    normalizeZero(omegaTable * position.x)
  );

  // Co-rotating surface acceleration: a_surface = -ω² r + α (k̂ × r)
  const w2 = omegaTable * omegaTable;
  const surfaceAcceleration = new Vector2(
    normalizeZero(-w2 * position.x - alphaTable * position.y),
    normalizeZero(-w2 * position.y + alphaTable * position.x)
  );
  const surfaceAccelerationMag = surfaceAcceleration.magnitude();

  const relativeVelocity = puckVelocity.sub(surfaceVelocity);
  const relativeSpeed = relativeVelocity.magnitude();

  const requiredStaticForce = surfaceAcceleration.scale(m);
  const requiredStaticForceMag = normalizeZero(m * surfaceAccelerationMag);

  const nearZeroRelativeSpeed =
    relativeSpeed <= CIRCULAR_MOTION_CONSTANTS.RELATIVE_VELOCITY_EPSILON;

  if (nearZeroRelativeSpeed) {
    if (surfaceAccelerationMag <= CIRCULAR_MOTION_CONSTANTS.SURFACE_ACCEL_EPSILON) {
      return {
        regime: 'at-rest',
        surfaceVelocity,
        surfaceAcceleration,
        surfaceAccelerationMag,
        relativeVelocity,
        relativeSpeed,
        requiredStaticForce,
        requiredStaticForceMag,
        maxStaticFriction,
        isBreakaway: false,
        canRestick: true,
        slipDirectionUnit: null,
        frictionForce: Vector2.zero(),
        puckAcceleration: Vector2.zero(),
        relativeAccelerationAtOnset: null,
      };
    }

    if (!isStrictlyGreaterMachine(surfaceAccelerationMag, maxSurfaceAccel)) {
      return {
        regime: 'static',
        surfaceVelocity,
        surfaceAcceleration,
        surfaceAccelerationMag,
        relativeVelocity,
        relativeSpeed,
        requiredStaticForce,
        requiredStaticForceMag,
        maxStaticFriction,
        isBreakaway: false,
        canRestick: true,
        slipDirectionUnit: null,
        frictionForce: requiredStaticForce,
        puckAcceleration: surfaceAcceleration,
        relativeAccelerationAtOnset: null,
      };
    }

    // Incipient breakaway at v_rel ≈ 0: u_slip = -a_surface / |a_surface|
    const accelUnit = surfaceAcceleration.scale(1 / surfaceAccelerationMag);
    const slipDirectionUnit = accelUnit.scale(-1);
    const kineticMag = m * params.kineticFriction * g;
    const frictionForce = accelUnit.scale(kineticMag);
    const puckAcceleration = accelUnit.scale(params.kineticFriction * g);
    const relativeAccelerationAtOnset = puckAcceleration.sub(surfaceAcceleration);

    return {
      regime: 'incipient-slip',
      surfaceVelocity,
      surfaceAcceleration,
      surfaceAccelerationMag,
      relativeVelocity,
      relativeSpeed,
      requiredStaticForce,
      requiredStaticForceMag,
      maxStaticFriction,
      isBreakaway: true,
      canRestick: false,
      slipDirectionUnit,
      frictionForce,
      puckAcceleration,
      relativeAccelerationAtOnset,
    };
  }

  // Active kinetic slip: |v_rel| > ε_v
  const slipDirectionUnit = relativeVelocity.scale(1 / relativeSpeed);
  const kineticMag = m * params.kineticFriction * g;
  const frictionForce = slipDirectionUnit.scale(-kineticMag);
  const puckAcceleration = slipDirectionUnit.scale(-params.kineticFriction * g);

  return {
    regime: 'kinetic-slip',
    surfaceVelocity,
    surfaceAcceleration,
    surfaceAccelerationMag,
    relativeVelocity,
    relativeSpeed,
    requiredStaticForce,
    requiredStaticForceMag,
    maxStaticFriction,
    isBreakaway: true,
    canRestick: false,
    slipDirectionUnit,
    frictionForce,
    puckAcceleration,
    relativeAccelerationAtOnset: null,
  };
}

// ============================================================================
// Mode 2: Vertical Circle Analytical Engine
// ============================================================================

export interface VerticalCircleCriticalSpeeds {
  /** Exact horizontal reach speed √(2gR) (m/s) */
  horizontalThreshold: number;
  /** Rigid-rod asymptotic separatrix speed 2√(gR) = √(4gR) (m/s) */
  rigidRodSeparatrix: number;
  /** Flexible-string complete loop speed √(5gR) (m/s) */
  flexibleStringLoop: number;
}

export type VerticalCircleRegime =
  | 'at-rest'
  | 'oscillatory'
  | 'horizontal-threshold'
  | 'slackening'
  | 'inverted-oscillatory'
  | 'asymptotic-separatrix'
  | 'complete-loop';

export interface VerticalCircleRegimeAnalysis {
  regime: VerticalCircleRegime;
  linkageType: VerticalLinkageType;
  criticalSpeeds: VerticalCircleCriticalSpeeds;
  totalEnergy: number;
  maxHeight: number;
  turningAngleRad: number | null;
  slackAngleRad: number | null;
  slackSpeed: number | null;
  willSlacken: boolean;
  completesLoop: boolean;
  isAsymptoticSeparatrix: boolean;
  bottomTension: number;
  topSpeed: number | null;
  topTensionRequired: number | null;
  topActualTension: number | null;
  tensionDifferenceBottomMinusTop: number | null;
}

/**
 * Quantities computed along the hypothetical circular constraint path at angle θ.
 * Note: For flexible-string angles past θ_slack, this represents the hypothetical
 * constrained circular reference (e.g., for dashed T_required plotting), NOT actual
 * projectile-flight trajectory state.
 */
export interface VerticalCircularReferenceState {
  position: Vector2;
  speed: number;
  angularSpeed: number;
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
  /** Signed inward radial constraint force T_required = m·q/R + m·g·cos(θ) (N) */
  requiredConstraintForce: number;
}

export interface VerticalCircleAngleEvaluation {
  thetaRad: number;
  /** Geometric point on circle (R sin θ, -R cos θ) */
  geometricPosition: Vector2;
  radialOutwardUnit: Vector2;
  tangentUnit: Vector2;
  height: number;
  potentialEnergy: number;
  /** Raw energy radicand q(θ) = v0² - 2gR(1 - cos θ) */
  energyRadicand: number;
  /** True when q(θ) >= -ε_q (energetically accessible) */
  isReachable: boolean;
  isAtTurningBoundary: boolean;
  /** True when flexible string has already slackened before this angle (Phase 2 projectile state unavailable) */
  isPostSlackDeparted: boolean;
  /** True only when reachable AND still in valid circular contact (not post-slack projectile flight) */
  isCircularContactValid: boolean;
  /** Circular-path reference calculation (null only when energetically unreachable) */
  circularReference: VerticalCircularReferenceState | null;
  /** Actual circular position (null when unreachable or already departed into post-slack flight) */
  actualCircularPosition: Vector2 | null;
  /** Actual circular speed (null when unreachable or already departed into post-slack flight) */
  actualCircularSpeed: number | null;
  /** Actual tension: >= 0 for flexible string (0 during slack flight), signed for rigid rod, null if unreachable */
  actualTension: number | null;
  isInCompression: boolean;
  actualStateNote: string | null;
}

export interface VerticalTautImpulseResult {
  /** True when pre-impact velocity had outward radial component v_r^- > 0 */
  isOutwardCrossing: boolean;
  radialUnit: Vector2;
  tangentUnit: Vector2;
  preRadialSpeed: number;
  preTangentialSpeed: number;
  postRadialSpeed: number;
  postTangentialSpeed: number;
  postVelocity: Vector2;
  /** Kinetic energy dissipated by radial arrest ΔE = 0.5·m·(v_r^-)² (J) */
  energyLost: number;
  /** Angle θ* from bottom vertical (0 at bottom, π at top) */
  impactAngleRad: number;
  /** Required constraint force immediately post-impact T_post = m(v_θ^-)²/R + mg cos θ* (N) */
  postImpactRequiredTension: number;
  /** Actual flexible-string tension post-impact (0 if re-slackens) */
  postImpactActualTension: number;
  /** True when T_post >= -ε_T (circular arc resumes); false when T_post < -ε_T (re-slackens) */
  resumesCircularArc: boolean;
}

export function computeVerticalCircleCriticalSpeeds(
  radius: number,
  gravity: number = CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY
): VerticalCircleCriticalSpeeds {
  const R = clampSafeRadius(radius);
  const g = resolveGravity(gravity);
  return {
    horizontalThreshold: Math.sqrt(2 * g * R),
    rigidRodSeparatrix: 2 * Math.sqrt(g * R),
    flexibleStringLoop: Math.sqrt(5 * g * R),
  };
}

/**
 * Energy radicand q(θ) = v0² - 2gR(1 - cos θ).
 */
export function computeEnergyRadicand(
  initialSpeed: number,
  radius: number,
  thetaRad: number,
  gravity: number = CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY
): number {
  assertNonNegativeFinite(initialSpeed, 'initialSpeed');
  const R = clampSafeRadius(radius);
  assertFinite(thetaRad, 'thetaRad');
  const g = resolveGravity(gravity);

  return initialSpeed * initialSpeed - 2 * g * R * (1 - Math.cos(thetaRad));
}

/**
 * Classify vertical-circle regime and compute closed-form boundary characteristics
 * for either a flexible string or rigid rod.
 */
export function classifyVerticalCircleRegime(
  params: VerticalCircleParams
): VerticalCircleRegimeAnalysis {
  const R = clampSafeRadius(params.radius);
  assertNonNegativeFinite(params.initialSpeed, 'initialSpeed');
  assertPositiveFinite(params.mass, 'mass');
  const g = resolveGravity(params.gravity);

  const v0 = params.initialSpeed;
  const m = params.mass;
  const v0Sq = v0 * v0;
  const criticalSpeeds = computeVerticalCircleCriticalSpeeds(R, g);

  const eHoriz = 2 * g * R;
  const eSeparatrix = 4 * g * R;
  const eLoopString = 5 * g * R;

  const totalEnergy = normalizeZero(0.5 * m * v0Sq);
  const bottomTension = normalizeZero((m * v0Sq) / R + m * g);
  const maxHeightConstrained = normalizeZero(Math.min(2 * R, v0Sq / (2 * g)));

  if (v0 === 0) {
    return {
      regime: 'at-rest',
      linkageType: params.linkageType,
      criticalSpeeds,
      totalEnergy: 0,
      maxHeight: 0,
      turningAngleRad: 0,
      slackAngleRad: null,
      slackSpeed: null,
      willSlacken: false,
      completesLoop: false,
      isAsymptoticSeparatrix: false,
      bottomTension,
      topSpeed: null,
      topTensionRequired: null,
      topActualTension: null,
      tensionDifferenceBottomMinusTop: null,
    };
  }

  // Horizontal threshold v0 = √(2gR)
  if (approxEqualMachine(v0Sq, eHoriz)) {
    return {
      regime: 'horizontal-threshold',
      linkageType: params.linkageType,
      criticalSpeeds,
      totalEnergy,
      maxHeight: R,
      turningAngleRad: Math.PI / 2,
      slackAngleRad: null,
      slackSpeed: null,
      willSlacken: false,
      completesLoop: false,
      isAsymptoticSeparatrix: false,
      bottomTension,
      topSpeed: null,
      topTensionRequired: null,
      topActualTension: null,
      tensionDifferenceBottomMinusTop: null,
    };
  }

  // Pure pendulum oscillation 0 < v0 < √(2gR)
  if (v0Sq < eHoriz) {
    const cosTurn = clampUnitInterval(1 - v0Sq / (2 * g * R));
    const turningAngleRad = Math.acos(cosTurn);
    return {
      regime: 'oscillatory',
      linkageType: params.linkageType,
      criticalSpeeds,
      totalEnergy,
      maxHeight: normalizeZero(v0Sq / (2 * g)),
      turningAngleRad,
      slackAngleRad: null,
      slackSpeed: null,
      willSlacken: false,
      completesLoop: false,
      isAsymptoticSeparatrix: false,
      bottomTension,
      topSpeed: null,
      topTensionRequired: null,
      topActualTension: null,
      tensionDifferenceBottomMinusTop: null,
    };
  }

  // Upper semicircle regimes (v0 > √(2gR))
  if (params.linkageType === 'flexible-string') {
    if (isGreaterOrEqualMachine(v0Sq, eLoopString)) {
      const topSpeedSq = Math.max(0, v0Sq - 4 * g * R);
      const topSpeed = Math.sqrt(topSpeedSq);
      const topTensionRequired = normalizeZero((m * topSpeedSq) / R - m * g);
      const topActualTension = normalizeZero(Math.max(0, topTensionRequired));
      return {
        regime: 'complete-loop',
        linkageType: 'flexible-string',
        criticalSpeeds,
        totalEnergy,
        maxHeight: 2 * R,
        turningAngleRad: null,
        slackAngleRad: null,
        slackSpeed: null,
        willSlacken: false,
        completesLoop: true,
        isAsymptoticSeparatrix: false,
        bottomTension,
        topSpeed,
        topTensionRequired,
        topActualTension,
        tensionDifferenceBottomMinusTop: normalizeZero(bottomTension - topTensionRequired),
      };
    }

    // Slackening regime √(2gR) < v0 < √(5gR)
    const cosSlack = clampUnitInterval(-(v0Sq - 2 * g * R) / (3 * g * R));
    const slackAngleRad = Math.acos(cosSlack);
    const slackSpeed = Math.sqrt(Math.max(0, -g * R * cosSlack));

    return {
      regime: 'slackening',
      linkageType: 'flexible-string',
      criticalSpeeds,
      totalEnergy,
      maxHeight: normalizeZero(R * (1 - cosSlack)),
      turningAngleRad: null,
      slackAngleRad,
      slackSpeed,
      willSlacken: true,
      completesLoop: false,
      isAsymptoticSeparatrix: false,
      bottomTension,
      topSpeed: null,
      topTensionRequired: null,
      topActualTension: null,
      tensionDifferenceBottomMinusTop: null,
    };
  }

  // Rigid-rod regimes for v0 > √(2gR)
  if (approxEqualMachine(v0Sq, eSeparatrix)) {
    const topTensionRequired = normalizeZero(-m * g);
    return {
      regime: 'asymptotic-separatrix',
      linkageType: 'rigid-rod',
      criticalSpeeds,
      totalEnergy,
      maxHeight: 2 * R,
      turningAngleRad: Math.PI,
      slackAngleRad: null,
      slackSpeed: null,
      willSlacken: false,
      completesLoop: false,
      isAsymptoticSeparatrix: true,
      bottomTension,
      topSpeed: 0,
      topTensionRequired,
      topActualTension: topTensionRequired,
      tensionDifferenceBottomMinusTop: normalizeZero(bottomTension - topTensionRequired),
    };
  }

  if (v0Sq < eSeparatrix) {
    const cosTurn = clampUnitInterval(1 - v0Sq / (2 * g * R));
    const turningAngleRad = Math.acos(cosTurn);
    return {
      regime: 'inverted-oscillatory',
      linkageType: 'rigid-rod',
      criticalSpeeds,
      totalEnergy,
      maxHeight: maxHeightConstrained,
      turningAngleRad,
      slackAngleRad: null,
      slackSpeed: null,
      willSlacken: false,
      completesLoop: false,
      isAsymptoticSeparatrix: false,
      bottomTension,
      topSpeed: null,
      topTensionRequired: null,
      topActualTension: null,
      tensionDifferenceBottomMinusTop: null,
    };
  }

  // Rigid-rod complete loop (v0 > 2√(gR))
  const topSpeedSq = Math.max(0, v0Sq - 4 * g * R);
  const topSpeed = Math.sqrt(topSpeedSq);
  const topTensionRequired = normalizeZero((m * topSpeedSq) / R - m * g);

  return {
    regime: 'complete-loop',
    linkageType: 'rigid-rod',
    criticalSpeeds,
    totalEnergy,
    maxHeight: 2 * R,
    turningAngleRad: null,
    slackAngleRad: null,
    slackSpeed: null,
    willSlacken: false,
    completesLoop: true,
    isAsymptoticSeparatrix: false,
    bottomTension,
    topSpeed,
    topTensionRequired,
    topActualTension: topTensionRequired,
    tensionDifferenceBottomMinusTop: normalizeZero(bottomTension - topTensionRequired),
  };
}

/**
 * Evaluate vertical-circle kinematics, reachability, and constraint tension at angle θ.
 *
 * Strictly enforces:
 * - q(θ) > 0: NEVER clamped to zero; speed = √q > 0
 * - -ε_q <= q(θ) <= 0: exact turning boundary (q clamped to 0, speed = 0)
 * - q(θ) < -ε_q: energetically unreachable (circularReference & actual values are null)
 * - Flexible-string past θ_slack: marks isPostSlackDeparted = true, sets actualCircularPosition
 *   and actualCircularSpeed to null (Phase 2 projectile state unavailable), sets actualTension = 0,
 *   and exposes hypothetical constrained T_required separately under circularReference.
 */
export function evaluateVerticalCircleAtAngle(
  params: VerticalCircleParams,
  thetaRad: number
): VerticalCircleAngleEvaluation {
  const R = clampSafeRadius(params.radius);
  assertNonNegativeFinite(params.initialSpeed, 'initialSpeed');
  assertPositiveFinite(params.mass, 'mass');
  assertFinite(thetaRad, 'thetaRad');
  const g = resolveGravity(params.gravity);

  const m = params.mass;
  const sinT = Math.sin(thetaRad);
  const cosT = Math.cos(thetaRad);

  const geometricPosition = new Vector2(normalizeZero(R * sinT), normalizeZero(-R * cosT));
  const radialOutwardUnit = new Vector2(normalizeZero(sinT), normalizeZero(-cosT));
  const tangentUnit = new Vector2(normalizeZero(cosT), normalizeZero(sinT));
  const height = normalizeZero(R * (1 - cosT));
  const potentialEnergy = normalizeZero(m * g * height);

  const energyRadicand = computeEnergyRadicand(params.initialSpeed, R, thetaRad, g);

  if (energyRadicand < -CIRCULAR_MOTION_CONSTANTS.ENERGY_RADICAND_EPSILON) {
    return {
      thetaRad,
      geometricPosition,
      radialOutwardUnit,
      tangentUnit,
      height,
      potentialEnergy,
      energyRadicand,
      isReachable: false,
      isAtTurningBoundary: false,
      isPostSlackDeparted: false,
      isCircularContactValid: false,
      circularReference: null,
      actualCircularPosition: null,
      actualCircularSpeed: null,
      actualTension: null,
      isInCompression: false,
      actualStateNote: 'Energetically unreachable angle (q < -ε_q)',
    };
  }

  const isAtTurningBoundary = energyRadicand <= 0;
  const qEff = energyRadicand < 0 ? 0 : energyRadicand;
  const speed = Math.sqrt(qEff);
  const angularSpeed = speed / R;
  const kineticEnergy = normalizeZero(0.5 * m * qEff);
  const totalEnergy = normalizeZero(kineticEnergy + potentialEnergy);
  const requiredConstraintForce = normalizeZero((m * qEff) / R + m * g * cosT);

  const circularReference: VerticalCircularReferenceState = {
    position: geometricPosition,
    speed,
    angularSpeed,
    kineticEnergy,
    potentialEnergy,
    totalEnergy,
    requiredConstraintForce,
  };

  if (params.linkageType === 'rigid-rod') {
    const isInCompression = requiredConstraintForce < 0;
    return {
      thetaRad,
      geometricPosition,
      radialOutwardUnit,
      tangentUnit,
      height,
      potentialEnergy,
      energyRadicand,
      isReachable: true,
      isAtTurningBoundary,
      isPostSlackDeparted: false,
      isCircularContactValid: true,
      circularReference,
      actualCircularPosition: geometricPosition,
      actualCircularSpeed: speed,
      actualTension: requiredConstraintForce,
      isInCompression,
      actualStateNote: isInCompression ? 'Rigid rod under radial compression' : null,
    };
  }

  // Flexible string semantics
  const analysis = classifyVerticalCircleRegime(params);
  const absNormalizedAngle = Math.abs(Math.atan2(sinT, cosT));
  const isPostSlackDeparted =
    analysis.regime === 'slackening' &&
    analysis.slackAngleRad !== null &&
    isStrictlyGreaterMachine(absNormalizedAngle, analysis.slackAngleRad);

  if (isPostSlackDeparted) {
    return {
      thetaRad,
      geometricPosition,
      radialOutwardUnit,
      tangentUnit,
      height,
      potentialEnergy,
      energyRadicand,
      isReachable: true,
      isAtTurningBoundary,
      isPostSlackDeparted: true,
      isCircularContactValid: false,
      circularReference,
      actualCircularPosition: null,
      actualCircularSpeed: null,
      actualTension: 0,
      isInCompression: false,
      actualStateNote:
        'Post-slack projectile flight (circular contact ended; Phase 2 projectile state unavailable)',
    };
  }

  // At or before θ_slack on valid circular arc
  const actualTension = normalizeZero(Math.max(0, requiredConstraintForce));
  return {
    thetaRad,
    geometricPosition,
    radialOutwardUnit,
    tangentUnit,
    height,
    potentialEnergy,
    energyRadicand,
    isReachable: true,
    isAtTurningBoundary,
    isPostSlackDeparted: false,
    isCircularContactValid: true,
    circularReference,
    actualCircularPosition: geometricPosition,
    actualCircularSpeed: speed,
    actualTension,
    isInCompression: false,
    actualStateNote: null,
  };
}

/**
 * Pure algebraic evaluator for impulsive radial constraint arrest and post-impact
 * tension admissibility when a slack flexible string becomes taut at impactPos.
 *
 * (Projectile-flight integration and numerical root localization of g_event(t) = 0
 * belong to Phase 2.)
 */
export function evaluateVerticalTautImpulse(
  impactPos: Vector2,
  preImpactVel: Vector2,
  radius: number,
  mass: number,
  gravity: number = CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY
): VerticalTautImpulseResult {
  const R = clampSafeRadius(radius);
  assertPositiveFinite(mass, 'mass');
  assertFinite(impactPos.x, 'impactPos.x');
  assertFinite(impactPos.y, 'impactPos.y');
  assertFinite(preImpactVel.x, 'preImpactVel.x');
  assertFinite(preImpactVel.y, 'preImpactVel.y');
  const g = resolveGravity(gravity);

  const posMag = impactPos.magnitude();
  assertPositiveFinite(posMag, 'impactPos magnitude');

  const radialUnit = new Vector2(
    normalizeZero(impactPos.x / posMag),
    normalizeZero(impactPos.y / posMag)
  );
  const tangentUnit = new Vector2(
    normalizeZero(-impactPos.y / posMag),
    normalizeZero(impactPos.x / posMag)
  );

  const preRadialSpeed = normalizeZero(preImpactVel.dot(radialUnit));
  const preTangentialSpeed = normalizeZero(preImpactVel.dot(tangentUnit));
  const impactAngleRad = normalizeZero(Math.atan2(impactPos.x, -impactPos.y));
  const cosTheta = -impactPos.y / posMag;

  if (preRadialSpeed <= 0) {
    // Non-outward crossing: string does not arrest motion impulsively
    const requiredTension = normalizeZero(
      (mass * preTangentialSpeed * preTangentialSpeed) / R + mass * g * cosTheta
    );
    return {
      isOutwardCrossing: false,
      radialUnit,
      tangentUnit,
      preRadialSpeed,
      preTangentialSpeed,
      postRadialSpeed: preRadialSpeed,
      postTangentialSpeed: preTangentialSpeed,
      postVelocity: preImpactVel.clone(),
      energyLost: 0,
      impactAngleRad,
      postImpactRequiredTension: requiredTension,
      postImpactActualTension: normalizeZero(Math.max(0, requiredTension)),
      resumesCircularArc: requiredTension >= -CIRCULAR_MOTION_CONSTANTS.TENSION_EPSILON,
    };
  }

  // Outward radial velocity removed instantaneously: v_r^+ = 0, v^+ = v_θ^- θ_hat
  const postVelocity = tangentUnit.scale(preTangentialSpeed);
  const energyLost = normalizeZero(0.5 * mass * preRadialSpeed * preRadialSpeed);
  const postImpactRequiredTension = normalizeZero(
    (mass * preTangentialSpeed * preTangentialSpeed) / R + mass * g * cosTheta
  );
  const resumesCircularArc =
    postImpactRequiredTension >= -CIRCULAR_MOTION_CONSTANTS.TENSION_EPSILON;
  const postImpactActualTension = resumesCircularArc
    ? normalizeZero(Math.max(0, postImpactRequiredTension))
    : 0;

  return {
    isOutwardCrossing: true,
    radialUnit,
    tangentUnit,
    preRadialSpeed,
    preTangentialSpeed,
    postRadialSpeed: 0,
    postTangentialSpeed: preTangentialSpeed,
    postVelocity,
    energyLost,
    impactAngleRad,
    postImpactRequiredTension,
    postImpactActualTension,
    resumesCircularArc,
  };
}

// ============================================================================
// Mode 3: Level & Banked Curves Analytical Engine
// ============================================================================

export type BankedCurveStatus =
  | 'balanced-optimal'
  | 'safe-outward-held'
  | 'safe-inward-held'
  | 'skid-outward'
  | 'slide-inward';

export type BankedCurveFrictionDirection = 'none' | 'down-incline' | 'up-incline';

export interface BankedCurveSpeedLimits {
  /** Optimal frictionless speed v_opt = √(rg tan θ) (m/s) */
  optimalSpeed: number;
  /** Minimum safe speed v_min (0 when tan θ <= μs) (m/s) */
  minSafeSpeed: number;
  /** Maximum safe speed v_max (null when μs tan θ >= 1, i.e., No Outward Skid Limit) (m/s) */
  maxSafeSpeed: number | null;
  hasUpperSpeedLimit: boolean;
  canSlideInward: boolean;
  statusNote: 'No Outward Skid Limit' | null;
}

export interface BankedCurveEvaluation extends BankedCurveSpeedLimits {
  radius: number;
  speed: number;
  bankAngleDeg: number;
  bankAngleRad: number;
  mass: number;
  centripetalAccelerationRequired: number;
  centripetalForceRequired: number;
  normalReaction: number;
  /** Signed lateral static friction f_s = m[(v²/r) cos θ - g sin θ]; positive = down incline (N) */
  requiredFriction: number;
  /** Maximum static friction μs·N (N) */
  maxStaticFriction: number;
  frictionDirection: BankedCurveFrictionDirection;
  isStaticAdmissible: boolean;
  status: BankedCurveStatus;
}

/**
 * Compute optimal, minimum, and maximum safe speeds for a banked curve.
 * Handles self-locking banks (tan θ <= μs => v_min = 0) and steep banking asymptotes
 * (μs tan θ >= 1 => maxSafeSpeed = null, never emitting NaN or Infinity).
 */
export function computeBankedCurveSpeedLimits(
  radius: number,
  bankAngleDeg: number,
  staticFriction: number,
  gravity: number = CIRCULAR_MOTION_CONSTANTS.DEFAULT_GRAVITY
): BankedCurveSpeedLimits {
  const r = clampSafeRadius(radius);
  assertFinite(bankAngleDeg, 'bankAngleDeg');
  if (bankAngleDeg < 0 || bankAngleDeg >= 90) {
    throw new Error(
      `Invalid banking angle: must satisfy 0° <= θ < 90° (received: ${bankAngleDeg}°).`
    );
  }
  assertNonNegativeFinite(staticFriction, 'staticFriction');
  const g = resolveGravity(gravity);

  const thetaRad = degToRad(bankAngleDeg);
  const tanTheta = bankAngleDeg === 0 ? 0 : Math.tan(thetaRad);
  const optimalSpeed = normalizeZero(Math.sqrt(Math.max(0, r * g * tanTheta)));

  // Lower threshold v_min
  let minSafeSpeed = 0;
  let canSlideInward = false;
  if (isStrictlyGreaterMachine(tanTheta, staticFriction)) {
    const numMin = Math.max(0, tanTheta - staticFriction);
    const denMin = 1 + staticFriction * tanTheta;
    minSafeSpeed = Math.sqrt((r * g * numMin) / denMin);
    canSlideInward = true;
  }

  // Upper threshold v_max
  const muTan = staticFriction * tanTheta;
  if (isGreaterOrEqualMachine(muTan, 1)) {
    return {
      optimalSpeed,
      minSafeSpeed,
      maxSafeSpeed: null,
      hasUpperSpeedLimit: false,
      canSlideInward,
      statusNote: 'No Outward Skid Limit',
    };
  }

  const numMax = tanTheta + staticFriction;
  const denMax = 1 - muTan;
  const maxSafeSpeed = normalizeZero(Math.sqrt((r * g * numMax) / denMax));

  return {
    optimalSpeed,
    minSafeSpeed,
    maxSafeSpeed,
    hasUpperSpeedLimit: true,
    canSlideInward,
    statusNote: null,
  };
}

/**
 * Evaluate exact banked-curve equilibrium forces, static friction admissibility, and status.
 */
export function evaluateBankedCurve(params: BankedCurveParams): BankedCurveEvaluation {
  const r = clampSafeRadius(params.radius);
  assertNonNegativeFinite(params.speed, 'speed');
  assertFinite(params.bankAngleDeg, 'bankAngleDeg');
  if (params.bankAngleDeg < 0 || params.bankAngleDeg >= 90) {
    throw new Error(
      `Invalid banking angle: must satisfy 0° <= θ < 90° (received: ${params.bankAngleDeg}°).`
    );
  }
  assertNonNegativeFinite(params.staticFriction, 'staticFriction');
  assertPositiveFinite(params.mass, 'mass');
  const g = resolveGravity(params.gravity);

  const m = params.mass;
  const v = params.speed;
  const thetaRad = degToRad(params.bankAngleDeg);
  const sinT = params.bankAngleDeg === 0 ? 0 : Math.sin(thetaRad);
  const cosT = params.bankAngleDeg === 0 ? 1 : Math.cos(thetaRad);

  const ac = normalizeZero((v * v) / r);
  const fc = normalizeZero(m * ac);

  const normalReaction = normalizeZero(m * (g * cosT + ac * sinT));

  const centripetalAlongIncline = m * ac * cosT;
  const gravityAlongIncline = m * g * sinT;
  const isOptimal = approxEqualMachine(centripetalAlongIncline, gravityAlongIncline);

  const requiredFriction = isOptimal
    ? 0
    : normalizeZero(centripetalAlongIncline - gravityAlongIncline);
  const maxStaticFriction = normalizeZero(params.staticFriction * normalReaction);

  const limits = computeBankedCurveSpeedLimits(
    r,
    params.bankAngleDeg,
    params.staticFriction,
    g
  );

  let frictionDirection: BankedCurveFrictionDirection = 'none';
  if (requiredFriction > 0) {
    frictionDirection = 'down-incline';
  } else if (requiredFriction < 0) {
    frictionDirection = 'up-incline';
  }

  const exceedsStatic = isStrictlyGreaterMachine(Math.abs(requiredFriction), maxStaticFriction);
  const isStaticAdmissible = !exceedsStatic;

  let status: BankedCurveStatus;
  if (exceedsStatic) {
    status = requiredFriction > 0 ? 'skid-outward' : 'slide-inward';
  } else if (isOptimal) {
    status = 'balanced-optimal';
  } else if (requiredFriction > 0) {
    status = 'safe-outward-held';
  } else {
    status = 'safe-inward-held';
  }

  return {
    ...limits,
    radius: r,
    speed: v,
    bankAngleDeg: params.bankAngleDeg,
    bankAngleRad: thetaRad,
    mass: m,
    centripetalAccelerationRequired: ac,
    centripetalForceRequired: fc,
    normalReaction,
    requiredFriction,
    maxStaticFriction,
    frictionDirection,
    isStaticAdmissible,
    status,
  };
}

// ============================================================================
// Mode 4: Conical Pendulum Analytical Engine
// ============================================================================

export interface ConicalPendulumEvaluation {
  length: number;
  angleDeg: number;
  angleRad: number;
  mass: number;
  /** Horizontal orbit radius r = L sin θ (m) */
  orbitRadius: number;
  /** Vertical depth below pivot h = L cos θ (m) */
  verticalDepth: number;
  /** String tension T = mg / cos θ (N) */
  tension: number;
  /** Horizontal centripetal force F_c = T sin θ = mg tan θ (N) */
  centripetalForce: number;
  /** Centripetal acceleration a_c = g tan θ (m/s²) */
  centripetalAcceleration: number;
  /** Steady angular speed ω = √(g / h) = √(g / (L cos θ)) (rad/s) */
  angularVelocity: number;
  /** Orbital linear speed v = ω r (m/s) */
  linearSpeed: number;
  /** Period of revolution T_period = 2π √(h / g) (s) */
  period: number;
  /** Revolution frequency f = 1 / T_period (Hz) */
  frequency: number;
  /** Simple small-angle pendulum reference period T_0 = 2π √(L / g) (s) */
  simplePendulumPeriod: number;
  /** Exact period ratio T_conical / T_0 = √(cos θ) */
  periodRatio: number;
  /** Small-angle relative deviation δ = 1 - √(cos θ) */
  smallAngleRelativeDeviation: number;
}

/**
 * Evaluate conical pendulum geometry, force balance, angular speed, mass-independent
 * period, and small-angle deviation across physical domain 0° <= θ < 90°.
 */
export function evaluateConicalPendulum(
  params: ConicalPendulumParams
): ConicalPendulumEvaluation {
  assertPositiveFinite(params.length, 'length');
  assertFinite(params.angleDeg, 'angleDeg');
  if (params.angleDeg < 0 || params.angleDeg >= 90) {
    throw new Error(
      `Invalid conical pendulum angle: must satisfy 0° <= θ < 90° (received: ${params.angleDeg}°).`
    );
  }
  assertPositiveFinite(params.mass, 'mass');
  const g = resolveGravity(params.gravity);

  const L = params.length;
  const m = params.mass;
  const angleRad = degToRad(params.angleDeg);
  const sinT = params.angleDeg === 0 ? 0 : Math.sin(angleRad);
  const cosT = params.angleDeg === 0 ? 1 : Math.cos(angleRad);
  const tanT = params.angleDeg === 0 ? 0 : Math.tan(angleRad);

  const orbitRadius = normalizeZero(L * sinT);
  const verticalDepth = normalizeZero(L * cosT);

  const tension = normalizeZero((m * g) / cosT);
  const centripetalAcceleration = normalizeZero(g * tanT);
  const centripetalForce = normalizeZero(m * centripetalAcceleration);

  const angularVelocity = Math.sqrt(g / verticalDepth);
  const linearSpeed = normalizeZero(angularVelocity * orbitRadius);

  const period = 2 * Math.PI * Math.sqrt(verticalDepth / g);
  const frequency = 1 / period;

  const simplePendulumPeriod = 2 * Math.PI * Math.sqrt(L / g);
  const periodRatio = Math.sqrt(cosT);
  const smallAngleRelativeDeviation = normalizeZero(1 - periodRatio);

  return {
    length: L,
    angleDeg: params.angleDeg,
    angleRad,
    mass: m,
    orbitRadius,
    verticalDepth,
    tension,
    centripetalForce,
    centripetalAcceleration,
    angularVelocity,
    linearSpeed,
    period,
    frequency,
    simplePendulumPeriod,
    periodRatio,
    smallAngleRelativeDeviation,
  };
}
