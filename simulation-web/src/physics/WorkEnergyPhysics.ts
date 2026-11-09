/**
 * Pure mathematical and numerical physics engine for Work, Energy & Power.
 *
 * Implements Grade 11, Chapter 5 (Work, Energy & Power) curriculum requirements:
 * - Rigid inclined track with a sliding block (pure translation, no rolling/rotational components).
 * - Compression spring bumper anchored at the lower end of the track.
 * - Dynamic force balance with Coulomb friction (static breakaway + kinetic friction).
 * - Comprehensive energy accounting: Kinetic, Gravitational PE, Elastic PE, Thermal dissipation.
 * - Work-energy theorem verification: ΔK = W_g + W_s + W_f = W_net.
 * - Instantaneous and average power calculations.
 * - Physical travel boundaries with non-collapsing terminal state preservation.
 *
 * All calculations use strict SI units:
 *   mass: kg
 *   length/displacement: m
 *   velocity: m/s
 *   acceleration: m/s²
 *   force: N
 *   angle: radians internally (degrees at parameter interface)
 *   spring constant: N/m
 *   energy/work: Joules (J)
 *   power: Watts (W)
 *   time: seconds (s)
 *
 * Pure module: zero DOM and zero Canvas dependencies.
 */

// ============================================================================
// Fixed Apparatus Geometry & Physical Constants
// ============================================================================

export const WORK_ENERGY_CONSTANTS = {
  /** Distance from initial downhill block face (s=0) to lower spring anchor in meters */
  TRACK_LENGTH: 5.00,
  /** Natural uncompressed length of the spring in meters */
  SPRING_NATURAL_LENGTH: 1.50,
  /** Solid height (maximum compressed length) of the spring in meters */
  SPRING_SOLID_HEIGHT: 0.10,
  /** Block length along the track in meters */
  BLOCK_LENGTH: 0.30,
  /** Standard gravitational acceleration in m/s² */
  DEFAULT_GRAVITY: 9.8,
  /** Upper travel boundary for block displacement s in meters */
  UPPER_TRAVEL_LIMIT: -0.50,
  /** Lower travel boundary for block displacement s in meters (solid height contact) */
  LOWER_TRAVEL_LIMIT: 4.90, // TRACK_LENGTH (5.00) - SPRING_SOLID_HEIGHT (0.10)
  /** Displacement at which the block downhill face touches the spring in meters */
  SPRING_CONTACT_POS: 3.50, // TRACK_LENGTH (5.00) - SPRING_NATURAL_LENGTH (1.50)
  /** Maximum allowable spring compression in meters */
  MAX_SPRING_COMPRESSION: 1.40, // SPRING_NATURAL_LENGTH (1.50) - SPRING_SOLID_HEIGHT (0.10)
  /** Default internal numerical integration substep in seconds */
  INTERNAL_SUBSTEP_DT: 0.001,
  /** Velocity threshold below which the block is evaluated for static friction rest (m/s) */
  REST_VELOCITY_EPSILON: 1e-6,
} as const;

// ============================================================================
// Interfaces & Types
// ============================================================================

/**
 * User-adjustable parameters for Work, Energy & Power simulation.
 */
export interface WorkEnergyParams {
  /** Mass of the sliding block in kilograms (0.5 to 5.0 kg) */
  mass: number;
  /** Incline angle above horizontal in degrees (10° to 45°) */
  inclineAngleDeg: number;
  /** Coefficient of kinetic friction (0.0 to 0.30) */
  kineticFriction: number;
  /** Coefficient of static friction (0.0 to 0.40, must be >= kineticFriction) */
  staticFriction: number;
  /** Spring stiffness constant in N/m (10 to 80 N/m) */
  springConstant: number;
  /** Acceleration due to gravity in m/s² (default: 9.8 m/s²) */
  gravity?: number;
}

/**
 * Parameter validation result.
 */
export interface WorkEnergyValidationResult {
  /** Whether all parameters are physically valid and within allowed ranges */
  valid: boolean;
  /** Detailed error messages if validation failed */
  errors: string[];
}

/**
 * Status of the apparatus and motion.
 */
export type WorkEnergyApparatusStatus = 'active' | 'at_rest' | 'exceeded';

/**
 * Complete physical state of the block and accumulated dissipation.
 */
export interface WorkEnergyState {
  /** Elapsed simulation time in seconds */
  time: number;
  /** Displacement of block downhill contact face from initial position (s, positive downhill) */
  displacement: number;
  /** Velocity along the track in m/s (positive downhill, negative uphill) */
  velocity: number;
  /** Acceleration along the track in m/s² (positive downhill, negative uphill) */
  acceleration: number;
  /** Accumulated thermal energy dissipated by kinetic friction in Joules */
  thermalEnergy: number;
  /** Current apparatus status */
  status: WorkEnergyApparatusStatus;
  /** Descriptive status explanation (e.g. boundary exceeded, static friction hold) */
  statusMessage?: string;
}

/**
 * Breakdown of all forces acting on the sliding block along and perpendicular to the track.
 */
export interface WorkEnergyForceBreakdown {
  /** Downhill component of gravity in Newtons: F_g = m * g * sin(θ) */
  gravityParallel: number;
  /** Normal reaction force perpendicular to incline in Newtons: N = m * g * cos(θ) */
  normalReaction: number;
  /** Spring restoring force on block in Newtons: F_s = -k * x_s (negative = uphill) */
  springForce: number;
  /** Friction force on block in Newtons (opposes velocity or balances driving force) */
  frictionForce: number;
  /** Net force along track in Newtons: F_net = F_g + F_s + F_friction */
  netForce: number;
  /** Instantaneous acceleration along track in m/s²: a = F_net / m */
  acceleration: number;
  /** Maximum static friction threshold in Newtons: f_s_max = μ_s * N */
  maxStaticFriction: number;
  /** Kinetic friction magnitude in Newtons: f_k = μ_k * N */
  kineticFrictionMag: number;
  /** Whether the block is currently held in static equilibrium by friction */
  isStatic: boolean;
}

/**
 * Complete mechanical and thermal energy breakdown.
 */
export interface WorkEnergyEnergyBreakdown {
  /** Kinetic energy in Joules: K = 0.5 * m * v² */
  kineticEnergy: number;
  /** Gravitational potential energy in Joules (zero reference at lower boundary s_max) */
  gravitationalPE: number;
  /** Elastic potential energy in Joules: U_s = 0.5 * k * x_s² */
  elasticPE: number;
  /** Accumulated thermal dissipation from friction in Joules: Q */
  thermalEnergy: number;
  /** Total mechanical energy in Joules: E_mech = K + U_g + U_s */
  totalMechanicalEnergy: number;
  /** Total energy in Joules: E_total = K + U_g + U_s + Q */
  totalEnergy: number;
  /** Initial total energy at t=0 in Joules: E_0 = U_g(s=0) */
  initialEnergy: number;
  /** Absolute energy conservation discrepancy in Joules: |E_total - E_0| */
  energyConservationError: number;
}

/**
 * Work done by each force and work-energy theorem verification.
 */
export interface WorkEnergyWorkBreakdown {
  /** Work done by gravity in Joules: W_g = m * g * sin(θ) * (s - s0) */
  workGravity: number;
  /** Work done by spring in Joules: W_s = -ΔU_s = -0.5 * k * x_s² */
  workSpring: number;
  /** Work done by friction in Joules: W_f = -Q */
  workFriction: number;
  /** Total net work done on block in Joules: W_net = W_g + W_s + W_f */
  workNet: number;
  /** Change in kinetic energy from initial release in Joules: ΔK = K(t) - K(0) */
  deltaKinetic: number;
  /** Absolute work-energy theorem discrepancy in Joules: |ΔK - W_net| */
  workEnergyTheoremError: number;
}

/**
 * Instantaneous and average power breakdown for each force.
 */
export interface WorkEnergyPowerBreakdown {
  /** Instantaneous power developed by gravity in Watts: P_g = F_g * v */
  powerGravity: number;
  /** Instantaneous power developed by spring in Watts: P_s = F_s * v */
  powerSpring: number;
  /** Instantaneous power dissipated by friction in Watts: P_f = F_friction * v */
  powerFriction: number;
  /** Instantaneous net mechanical power in Watts: P_net = F_net * v */
  powerNet: number;
  /** Average power from gravity over elapsed time in Watts: W_g / Δt */
  avgPowerGravity: number;
  /** Average power from spring over elapsed time in Watts: W_s / Δt */
  avgPowerSpring: number;
  /** Average power from friction over elapsed time in Watts: W_f / Δt */
  avgPowerFriction: number;
  /** Average net power over elapsed time in Watts: W_net / Δt */
  avgPowerNet: number;
}

/**
 * Sample point for force-displacement curves (useful for graphing F(s) vs s).
 */
export interface ForceDisplacementSample {
  /** Track displacement s in meters */
  displacement: number;
  /** Downhill gravity force component in Newtons: F_g */
  gravityForce: number;
  /** Spring force in Newtons: F_s (negative = uphill) */
  springForce: number;
  /** Downhill conservative driving force in Newtons: F_g + F_s */
  conservativeDrivingForce: number;
}

// ============================================================================
// Default Parameters & Range Limits
// ============================================================================

export const DEFAULT_WORK_ENERGY_PARAMS: WorkEnergyParams = {
  mass: 2.0,
  inclineAngleDeg: 25.0,
  kineticFriction: 0.05,
  staticFriction: 0.08,
  springConstant: 40.0,
  gravity: 9.8,
};

export const WORK_ENERGY_PARAM_RANGES = {
  mass: { min: 0.5, max: 5.0 },
  inclineAngleDeg: { min: 10.0, max: 45.0 },
  kineticFriction: { min: 0.0, max: 0.30 },
  staticFriction: { min: 0.0, max: 0.40 },
  springConstant: { min: 10.0, max: 80.0 },
} as const;

// ============================================================================
// Pure Physics Functions
// ============================================================================

/**
 * Validate simulation parameters against physical constraints and approved curriculum ranges.
 */
export function validateWorkEnergyParams(params: WorkEnergyParams): WorkEnergyValidationResult {
  const errors: string[] = [];

  if (typeof params !== 'object' || params === null) {
    return { valid: false, errors: ['Parameters must be a non-null object'] };
  }

  // Mass validation
  if (!Number.isFinite(params.mass)) {
    errors.push('Mass must be a finite number');
  } else if (
    params.mass < WORK_ENERGY_PARAM_RANGES.mass.min ||
    params.mass > WORK_ENERGY_PARAM_RANGES.mass.max
  ) {
    errors.push(
      `Mass must be between ${WORK_ENERGY_PARAM_RANGES.mass.min} and ${WORK_ENERGY_PARAM_RANGES.mass.max} kg`
    );
  }

  // Incline angle validation
  if (!Number.isFinite(params.inclineAngleDeg)) {
    errors.push('Incline angle must be a finite number');
  } else if (
    params.inclineAngleDeg < WORK_ENERGY_PARAM_RANGES.inclineAngleDeg.min ||
    params.inclineAngleDeg > WORK_ENERGY_PARAM_RANGES.inclineAngleDeg.max
  ) {
    errors.push(
      `Incline angle must be between ${WORK_ENERGY_PARAM_RANGES.inclineAngleDeg.min}° and ${WORK_ENERGY_PARAM_RANGES.inclineAngleDeg.max}°`
    );
  }

  // Kinetic friction validation
  if (!Number.isFinite(params.kineticFriction)) {
    errors.push('Kinetic friction coefficient must be a finite number');
  } else if (
    params.kineticFriction < WORK_ENERGY_PARAM_RANGES.kineticFriction.min ||
    params.kineticFriction > WORK_ENERGY_PARAM_RANGES.kineticFriction.max
  ) {
    errors.push(
      `Kinetic friction must be between ${WORK_ENERGY_PARAM_RANGES.kineticFriction.min} and ${WORK_ENERGY_PARAM_RANGES.kineticFriction.max}`
    );
  }

  // Static friction validation
  if (!Number.isFinite(params.staticFriction)) {
    errors.push('Static friction coefficient must be a finite number');
  } else if (
    params.staticFriction < WORK_ENERGY_PARAM_RANGES.staticFriction.min ||
    params.staticFriction > WORK_ENERGY_PARAM_RANGES.staticFriction.max
  ) {
    errors.push(
      `Static friction must be between ${WORK_ENERGY_PARAM_RANGES.staticFriction.min} and ${WORK_ENERGY_PARAM_RANGES.staticFriction.max}`
    );
  }

  // Relative friction constraint: μ_s >= μ_k
  if (
    Number.isFinite(params.staticFriction) &&
    Number.isFinite(params.kineticFriction) &&
    params.staticFriction < params.kineticFriction
  ) {
    errors.push('Static friction coefficient must be greater than or equal to kinetic friction coefficient (μs >= μk)');
  }

  // Spring constant validation
  if (!Number.isFinite(params.springConstant)) {
    errors.push('Spring constant must be a finite number');
  } else if (
    params.springConstant < WORK_ENERGY_PARAM_RANGES.springConstant.min ||
    params.springConstant > WORK_ENERGY_PARAM_RANGES.springConstant.max
  ) {
    errors.push(
      `Spring constant must be between ${WORK_ENERGY_PARAM_RANGES.springConstant.min} and ${WORK_ENERGY_PARAM_RANGES.springConstant.max} N/m`
    );
  }

  // Gravity validation (if provided)
  if (params.gravity !== undefined) {
    if (!Number.isFinite(params.gravity) || params.gravity <= 0) {
      errors.push('Gravity must be a positive finite number');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate spring compression x_s for a given displacement s of the block contact face.
 *
 * @param displacement Displacement s in meters (s >= 0 downhill)
 * @returns Compression x_s in meters (x_s >= 0)
 */
export function computeSpringCompression(displacement: number): number {
  return Math.max(0, displacement - WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS);
}

/**
 * Calculate the spring force exerted on the block.
 * In coordinate s (positive downhill), compression pushes the block uphill (negative force).
 *
 * @param compression Spring compression x_s in meters
 * @param springConstant Spring constant k in N/m
 * @returns Spring force F_s in Newtons (F_s <= 0)
 */
export function computeSpringForce(compression: number, springConstant: number): number {
  if (compression <= 0) return 0;
  return -springConstant * compression;
}

/**
 * Compute the complete force breakdown and acceleration for the block at a given position and velocity.
 */
export function computeWorkEnergyForces(
  params: WorkEnergyParams,
  displacement: number,
  velocity: number
): WorkEnergyForceBreakdown {
  const g = params.gravity ?? WORK_ENERGY_CONSTANTS.DEFAULT_GRAVITY;
  const m = params.mass;
  const thetaRad = (params.inclineAngleDeg * Math.PI) / 180;

  // Gravitational components
  const gravityParallel = m * g * Math.sin(thetaRad); // Downhill (> 0)
  const normalReaction = m * g * Math.cos(thetaRad);  // Perpendicular to track (> 0)

  // Spring force
  const xs = computeSpringCompression(displacement);
  const springForce = computeSpringForce(xs, params.springConstant); // Uphill (<= 0)

  // Friction thresholds
  const maxStaticFriction = params.staticFriction * normalReaction;
  const kineticFrictionMag = params.kineticFriction * normalReaction;

  // Driving force along the incline (gravity + spring)
  const drivingForce = gravityParallel + springForce;

  const isAtRest = Math.abs(velocity) < WORK_ENERGY_CONSTANTS.REST_VELOCITY_EPSILON;

  let frictionForce = 0;
  let isStatic = false;

  if (isAtRest) {
    if (Math.abs(drivingForce) <= maxStaticFriction) {
      // Static friction balances the driving force exactly
      frictionForce = drivingForce === 0 ? 0 : -drivingForce;
      isStatic = true;
    } else {
      // Breakaway: kinetic friction opposes impending motion direction
      const sign = drivingForce >= 0 ? 1 : -1;
      frictionForce = kineticFrictionMag === 0 ? 0 : -sign * kineticFrictionMag;
      isStatic = false;
    }
  } else {
    // Sliding: kinetic friction opposes velocity
    const sign = velocity > 0 ? 1 : -1;
    frictionForce = kineticFrictionMag === 0 ? 0 : -sign * kineticFrictionMag;
    isStatic = false;
  }

  const netForce = isStatic ? 0 : drivingForce + frictionForce;
  const acceleration = isStatic || m <= 0 ? 0 : netForce / m;

  return {
    gravityParallel,
    normalReaction,
    springForce,
    frictionForce,
    netForce,
    acceleration,
    maxStaticFriction,
    kineticFrictionMag,
    isStatic,
  };
}

/**
 * Calculate the complete mechanical and thermal energy breakdown.
 *
 * Uses potential energy zero-reference at the lower travel boundary (s_max = 4.90 m):
 *   U_g = m * g * (s_max - s) * sin(θ)
 */
export function computeWorkEnergyLedger(
  params: WorkEnergyParams,
  state: WorkEnergyState
): WorkEnergyEnergyBreakdown {
  const g = params.gravity ?? WORK_ENERGY_CONSTANTS.DEFAULT_GRAVITY;
  const m = params.mass;
  const thetaRad = (params.inclineAngleDeg * Math.PI) / 180;
  const sMax = WORK_ENERGY_CONSTANTS.LOWER_TRAVEL_LIMIT;

  // Kinetic energy: K = 0.5 * m * v²
  const kineticEnergy = 0.5 * m * state.velocity * state.velocity;

  // Gravitational potential energy (zero at s_max)
  const heightAboveReference = (sMax - state.displacement) * Math.sin(thetaRad);
  const gravitationalPE = m * g * heightAboveReference;

  // Elastic potential energy: U_s = 0.5 * k * x_s²
  const xs = computeSpringCompression(state.displacement);
  const elasticPE = 0.5 * params.springConstant * xs * xs;

  // Thermal energy dissipated by friction
  const thermalEnergy = state.thermalEnergy;

  // Total energies
  const totalMechanicalEnergy = kineticEnergy + gravitationalPE + elasticPE;
  const totalEnergy = totalMechanicalEnergy + thermalEnergy;

  // Initial energy at release (s0 = 0, v0 = 0, xs0 = 0, Q0 = 0)
  const initialEnergy = m * g * sMax * Math.sin(thetaRad);

  const energyConservationError = Math.abs(totalEnergy - initialEnergy);

  return {
    kineticEnergy,
    gravitationalPE,
    elasticPE,
    thermalEnergy,
    totalMechanicalEnergy,
    totalEnergy,
    initialEnergy,
    energyConservationError,
  };
}

/**
 * Calculate the work done by each force and verify the Work-Energy Theorem:
 *   ΔK = W_g + W_s + W_f = W_net
 */
export function computeWorkBreakdown(
  params: WorkEnergyParams,
  state: WorkEnergyState
): WorkEnergyWorkBreakdown {
  const g = params.gravity ?? WORK_ENERGY_CONSTANTS.DEFAULT_GRAVITY;
  const m = params.mass;
  const thetaRad = (params.inclineAngleDeg * Math.PI) / 180;

  // Work done by gravity: W_g = m * g * sin(θ) * s (from s0 = 0)
  const workGravity = m * g * Math.sin(thetaRad) * state.displacement;

  // Work done by spring: W_s = -ΔU_s = -0.5 * k * x_s²
  const xs = computeSpringCompression(state.displacement);
  const workSpring = -0.5 * params.springConstant * xs * xs;

  // Work done by friction: W_f = -Q
  const workFriction = -state.thermalEnergy;

  // Total net work
  const workNet = workGravity + workSpring + workFriction;

  // Change in kinetic energy from release (K0 = 0)
  const deltaKinetic = 0.5 * m * state.velocity * state.velocity;

  const workEnergyTheoremError = Math.abs(deltaKinetic - workNet);

  return {
    workGravity,
    workSpring,
    workFriction,
    workNet,
    deltaKinetic,
    workEnergyTheoremError,
  };
}

/**
 * Calculate instantaneous and average power for each force.
 */
export function computeWorkEnergyPower(
  params: WorkEnergyParams,
  state: WorkEnergyState
): WorkEnergyPowerBreakdown {
  const forces = computeWorkEnergyForces(params, state.displacement, state.velocity);
  const v = state.velocity;

  // Instantaneous power: P = F * v (normalize -0 to 0)
  const powerGravity = forces.gravityParallel * v === 0 ? 0 : forces.gravityParallel * v;
  const powerSpring = forces.springForce * v === 0 ? 0 : forces.springForce * v;
  const powerFriction = forces.frictionForce * v === 0 ? 0 : forces.frictionForce * v;
  const powerNet = forces.netForce * v === 0 ? 0 : forces.netForce * v;

  // Average power: P_avg = W / Δt
  const work = computeWorkBreakdown(params, state);
  const t = state.time;

  let avgPowerGravity = 0;
  let avgPowerSpring = 0;
  let avgPowerFriction = 0;
  let avgPowerNet = 0;

  if (t > 0) {
    avgPowerGravity = work.workGravity / t === 0 ? 0 : work.workGravity / t;
    avgPowerSpring = work.workSpring / t === 0 ? 0 : work.workSpring / t;
    avgPowerFriction = work.workFriction / t === 0 ? 0 : work.workFriction / t;
    avgPowerNet = work.workNet / t === 0 ? 0 : work.workNet / t;
  }

  return {
    powerGravity,
    powerSpring,
    powerFriction,
    powerNet,
    avgPowerGravity,
    avgPowerSpring,
    avgPowerFriction,
    avgPowerNet,
  };
}

/**
 * Generate discrete force-displacement curve samples from s=0 to s_max.
 * Useful for graph rendering and visualizing variable spring work.
 */
export function sampleForceDisplacementCurve(
  params: WorkEnergyParams,
  sStart: number = 0,
  sEnd: number = WORK_ENERGY_CONSTANTS.LOWER_TRAVEL_LIMIT,
  numSamples: number = 100
): ForceDisplacementSample[] {
  const samples: ForceDisplacementSample[] = [];
  const g = params.gravity ?? WORK_ENERGY_CONSTANTS.DEFAULT_GRAVITY;
  const m = params.mass;
  const thetaRad = (params.inclineAngleDeg * Math.PI) / 180;
  const Fg = m * g * Math.sin(thetaRad);

  const step = numSamples > 1 ? (sEnd - sStart) / (numSamples - 1) : 0;

  for (let i = 0; i < numSamples; i++) {
    const s = sStart + i * step;
    const xs = computeSpringCompression(s);
    const Fs = computeSpringForce(xs, params.springConstant);
    samples.push({
      displacement: s,
      gravityForce: Fg,
      springForce: Fs,
      conservativeDrivingForce: Fg + Fs,
    });
  }

  return samples;
}

/**
 * Create the initial state for the Work, Energy & Power simulation at release (t=0).
 */
export function createInitialWorkEnergyState(params: WorkEnergyParams): WorkEnergyState {
  const validation = validateWorkEnergyParams(params);
  if (!validation.valid) {
    return {
      time: 0,
      displacement: 0,
      velocity: 0,
      acceleration: 0,
      thermalEnergy: 0,
      status: 'exceeded',
      statusMessage: `Invalid parameters: ${validation.errors.join('; ')}`,
    };
  }

  const initialForces = computeWorkEnergyForces(params, 0, 0);

  return {
    time: 0,
    displacement: 0,
    velocity: 0,
    acceleration: initialForces.acceleration,
    thermalEnergy: 0,
    status: initialForces.isStatic ? 'at_rest' : 'active',
    statusMessage: initialForces.isStatic
      ? 'Static friction holds block at rest on incline'
      : undefined,
  };
}

// ============================================================================
// State Integration Engine
// ============================================================================

/**
 * Step the physical state forward by dt seconds using a symplectic Velocity Verlet
 * integrator with fixed internal substepping, static-friction breakaway detection,
 * zero-crossing friction arrest, and non-collapsing travel-limit termination.
 *
 * @param currentState Current state of the simulation
 * @param params Physical simulation parameters
 * @param dt Time delta in seconds (>= 0)
 * @returns New physical state at time + dt
 */
export function stepWorkEnergy(
  currentState: WorkEnergyState,
  params: WorkEnergyParams,
  dt: number
): WorkEnergyState {
  if (dt <= 0) {
    return { ...currentState };
  }

  // Once an apparatus travel limit is exceeded, freeze all subsequent integration
  if (currentState.status === 'exceeded') {
    return { ...currentState };
  }

  const g = params.gravity ?? WORK_ENERGY_CONSTANTS.DEFAULT_GRAVITY;
  const m = params.mass;
  const thetaRad = (params.inclineAngleDeg * Math.PI) / 180;
  const normalReaction = m * g * Math.cos(thetaRad);
  const kineticFrictionMag = params.kineticFriction * normalReaction;

  // Determine fixed substep size
  const maxSubstep = WORK_ENERGY_CONSTANTS.INTERNAL_SUBSTEP_DT;
  const numSubsteps = Math.max(1, Math.ceil(dt / maxSubstep));
  const h = dt / numSubsteps;

  let s = currentState.displacement;
  let v = currentState.velocity;
  let a = currentState.acceleration;
  let Q = currentState.thermalEnergy;
  let status = currentState.status;
  let statusMessage = currentState.statusMessage;

  for (let step = 0; step < numSubsteps; step++) {
    // 1. If currently held at rest by static friction, evaluate breakaway
    if (status === 'at_rest') {
      const xs = computeSpringCompression(s);
      const Fs = computeSpringForce(xs, params.springConstant);
      const Fg = m * g * Math.sin(thetaRad);
      const drivingForce = Fg + Fs;
      const maxStaticFriction = params.staticFriction * normalReaction;

      if (Math.abs(drivingForce) <= maxStaticFriction) {
        // Still at rest
        v = 0;
        a = 0;
        continue;
      } else {
        // Breakaway condition met
        status = 'active';
        statusMessage = undefined;
      }
    }

    // 2. Compute current acceleration
    const forces = computeWorkEnergyForces(params, s, v);
    a = forces.acceleration;

    // 3. Projected position using Velocity Verlet first step
    const deltaS = v * h + 0.5 * a * h * h;
    const nextS = s + deltaS;

    // 4. Physical travel boundaries check
    if (nextS < WORK_ENERGY_CONSTANTS.UPPER_TRAVEL_LIMIT) {
      return {
        time: currentState.time + (step + 1) * h,
        displacement: s,
        velocity: v,
        acceleration: a,
        thermalEnergy: Q,
        status: 'exceeded',
        statusMessage: `Upper travel limit exceeded (s < ${WORK_ENERGY_CONSTANTS.UPPER_TRAVEL_LIMIT} m)`,
      };
    }

    if (nextS > WORK_ENERGY_CONSTANTS.LOWER_TRAVEL_LIMIT) {
      return {
        time: currentState.time + (step + 1) * h,
        displacement: s,
        velocity: v,
        acceleration: a,
        thermalEnergy: Q,
        status: 'exceeded',
        statusMessage: `Spring compressed to solid height limit (s > ${WORK_ENERGY_CONSTANTS.LOWER_TRAVEL_LIMIT} m)`,
      };
    }

    // 5. Frictionless case: pure symplectic Velocity Verlet
    if (params.kineticFriction === 0 && params.staticFriction === 0) {
      s = nextS;
      const nextForces = computeWorkEnergyForces(params, s, v + a * h);
      const nextA = nextForces.acceleration;
      v = v + 0.5 * (a + nextA) * h;
      a = nextA;
      continue;
    }

    // 6. Friction case with zero-crossing velocity arrest
    const vPred = v + a * h;

    if (v !== 0 && v * vPred <= 0) {
      // Velocity reached zero within this substep
      const tStop = a !== 0 ? -v / a : 0;
      const clampedTStop = Math.max(0, Math.min(h, tStop));
      const sStop = s + v * clampedTStop + 0.5 * a * clampedTStop * clampedTStop;

      // Dissipation up to the stop point
      const deltaQ1 = kineticFrictionMag * Math.abs(sStop - s);
      Q += deltaQ1;

      // Check static friction at the stop point
      const xsStop = computeSpringCompression(sStop);
      const FsStop = computeSpringForce(xsStop, params.springConstant);
      const Fg = m * g * Math.sin(thetaRad);
      const drivingForceStop = Fg + FsStop;
      const maxStaticFriction = params.staticFriction * normalReaction;

      if (Math.abs(drivingForceStop) <= maxStaticFriction) {
        // Block is arrested by static friction
        s = sStop;
        v = 0;
        a = 0;
        status = 'at_rest';
        statusMessage = 'Block arrested by static friction';
        continue;
      } else {
        // Reversal: starts accelerating in driving force direction
        const remH = h - clampedTStop;
        const sign = drivingForceStop >= 0 ? 1 : -1;
        const frictionForce = -sign * kineticFrictionMag;
        const netForce = drivingForceStop + frictionForce;
        const aNew = m > 0 ? netForce / m : 0;

        v = aNew * remH;
        const deltaSRem = 0.5 * aNew * remH * remH;
        s = sStop + deltaSRem;
        Q += kineticFrictionMag * Math.abs(deltaSRem);
        a = aNew;
      }
    } else {
      // No zero crossing: standard Velocity Verlet step
      s = nextS;
      const nextForces = computeWorkEnergyForces(params, s, vPred);
      const nextA = nextForces.acceleration;
      v = v + 0.5 * (a + nextA) * h;
      a = nextA;
      Q += kineticFrictionMag * Math.abs(deltaS);
    }
  }

  return {
    time: currentState.time + dt,
    displacement: s,
    velocity: v,
    acceleration: a,
    thermalEnergy: Q,
    status,
    statusMessage,
  };
}
