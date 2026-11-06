/**
 * Pure mathematical and physical model for Simple Harmonic Motion & Periodic Oscillations.
 *
 * Implements the official Nepal CDC Physics Grade 12 (First Edition 2025)
 * Chapter 2: Periodic Motion (pp. 25–44) requirements.
 *
 * Features:
 * 1. Mode 1: Free Oscillation (Primary: Vertical Spring-Mass; Secondary: Simple Pendulum & Horizontal Spring)
 * 2. Mode 2: Damped Oscillation (Exact analytical solutions for underdamped, critically damped, and overdamped regimes)
 * 3. Mode 3: Forced Oscillation (Time-domain RK4 integration with external work & dissipation tracking)
 * 4. Mode 4: Mechanical Resonance (Analytical frequency response A(Ω), atan2 phase lag, displacement peak condition)
 *
 * All calculations use strict SI units:
 *   mass: kg
 *   length/displacement: m
 *   spring constant: N/m
 *   time: s
 *   velocity: m/s
 *   acceleration: m/s²
 *   force: N
 *   angle: radians internally (degrees at UI boundary)
 *   frequency: Hz
 *   angular frequency: rad/s
 *   energy: Joules (J)
 *
 * Pure module: zero DOM and zero Canvas dependencies.
 */

// ============================================================================
// Interfaces & Types
// ============================================================================

/**
 * Parameters for vertical and horizontal spring-mass systems.
 */
export interface SpringParams {
  /** Mass of suspended object in kilograms (m > 0) */
  mass: number;
  /** Spring stiffness constant in N/m (k > 0) */
  springConstant: number;
  /** Natural unstretched length of spring in meters (default: 0.40 m) */
  naturalLength?: number;
  /** Acceleration due to gravity in m/s² (default: 9.80 m/s²) */
  gravity?: number;
  /** Viscous damping coefficient in N·s/m (b >= 0, default: 0) */
  dampingCoefficient?: number;
  /** Initial displacement from static equilibrium in meters (x0 = A) */
  initialDisplacement: number;
}

/**
 * Result of validating spring parameters.
 */
export interface SpringValidationResult {
  /** Whether the configuration is physically valid and within apparatus bounds */
  valid: boolean;
  /** List of explicit error descriptions if validation failed */
  errors: string[];
  /** Calculated static elongation Δl = mg/k if parameters are valid numbers, else null */
  staticElongation: number | null;
}

/**
 * Parameters for simple pendulum oscillation.
 */
export interface PendulumParams {
  /** Length of suspension cord in meters (L > 0) */
  length: number;
  /** Mass of suspended bob in kilograms (m > 0) */
  mass: number;
  /** Acceleration due to gravity in m/s² (default: 9.80 m/s²) */
  gravity?: number;
  /** Initial deflection angle in radians (θ0) */
  initialAngleRad: number;
}

/**
 * Parameters for external periodic driving force.
 */
export interface ForcedDriverParams {
  /** Amplitude of driving force in Newtons (F0 >= 0) */
  driverForce: number;
  /** Angular frequency of driving force in rad/s (Ω >= 0; Ω = 0 represents static load) */
  drivingFrequency: number;
}

/**
 * Natural frequencies and period for undamped oscillator.
 */
export interface SHMFrequencies {
  /** Natural angular frequency in rad/s (ω0) */
  omega0: number;
  /** Oscillation period in seconds (T = 2π / ω0) */
  period: number;
  /** Frequency in Hertz (f = 1 / T = ω0 / 2π) */
  frequency: number;
}

/**
 * Physical damping classification.
 */
export type DampingRegime = 'undamped' | 'underdamped' | 'critically-damped' | 'overdamped';

/**
 * Frequencies and damping properties for damped oscillator.
 */
export interface DampedFrequencies {
  /** Undamped natural angular frequency in rad/s (ω0) */
  omega0: number;
  /** Undamped natural period in seconds (T0) */
  period0: number;
  /** Damping factor in s⁻¹ (γ = b / 2m) */
  gamma: number;
  /** Dimensionless damping ratio (ζ = γ / ω0) */
  dampingRatio: number;
  /** Physical regime classification */
  regime: DampingRegime;
  /** Whether the system is strictly underdamped (γ < ω0) */
  isUnderdamped: boolean;
  /** Damped angular frequency in rad/s (ωd = √(ω0² - γ²), or 0 if not underdamped) */
  omegaD: number;
  /** Damped oscillation period in seconds (Td = 2π / ωd, or Infinity if not underdamped) */
  periodD: number;
  /** Damped frequency in Hertz (fd = ωd / 2π, or 0 if not underdamped) */
  frequencyD: number;
}

/**
 * Instantaneous physical state of a linear spring-mass oscillator.
 */
export interface SHMState {
  /** Elapsed simulation time in seconds */
  time: number;
  /** Displacement relative to static equilibrium in meters (x(t)) */
  displacement: number;
  /** Instantaneous velocity in m/s (v(t) = dx/dt) */
  velocity: number;
  /** Instantaneous acceleration in m/s² (a(t) = d²x/dt²) */
  acceleration: number;
  /** Elastic restoring force in Newtons (F = -k·x) */
  restoringForce: number;
  /** Viscous damping force in Newtons (Fd = -b·v) */
  dampingForce: number;
  /** Kinetic energy in Joules (K = 0.5·m·v²) */
  kineticEnergy: number;
  /** Total effective potential energy relative to equilibrium in Joules (U = 0.5·k·x²) */
  effectivePotentialEnergy: number;
  /** Total instantaneous mechanical energy in Joules (E = K + U) */
  totalMechanicalEnergy: number;
  /** Dissipated thermal energy in Joules (Ediss = E(0) - E(t)) */
  dissipatedEnergy: number;
  /** Theoretical upper amplitude envelope at time t in meters */
  envelope: number;
  /** Damping regime classification */
  regime: DampingRegime;
}

/**
 * Characterization of displacement resonance peak.
 */
export interface ResonancePeakInfo {
  /**
   * Whether a distinct positive-frequency displacement resonance peak exists.
   * True only if γ < ω0 / √2 (i.e. damping ratio ζ < 1/√2 ≈ 0.7071).
   */
  hasResonancePeak: boolean;
  /** Resonant angular frequency in rad/s (Ωres = √(ω0² - 2γ²)), or null if no peak */
  resonantFrequencyRad: number | null;
  /** Resonant frequency in Hertz, or null if no peak */
  resonantFrequencyHz: number | null;
  /**
   * Maximum steady-state amplitude at peak.
   * If b = 0, evaluates to Infinity.
   * If no resonance peak exists (γ >= ω0 / √2), returns static deflection A(0) = F0 / k.
   */
  peakAmplitude: number;
  /** Dimensionless Quality Factor (Q = ω0 / 2γ = √(km) / b) */
  qualityFactor: number;
}

/**
 * Single data point on theoretical steady-state resonance curve A(Ω).
 */
export interface ResonanceCurvePoint {
  /** Driving angular frequency in rad/s (Ω) */
  drivingFrequencyRad: number;
  /** Driving frequency in Hertz (f = Ω / 2π) */
  drivingFrequencyHz: number;
  /** Theoretical steady-state amplitude in meters (A(Ω)) */
  amplitude: number;
  /** Phase lag in radians (δ ∈ [0, π], or null if undefined at undamped resonance) */
  phaseLagRad: number | null;
  /** Phase lag in degrees (δ ∈ [0°, 180°], or null if undefined at undamped resonance) */
  phaseLagDeg: number | null;
  /**
   * Whether this point represents a mathematical singularity / vertical asymptote.
   * If true, renderer must break the curve / draw an asymptotic gap rather than passing Infinity to Canvas coordinates.
   */
  isSingularity?: boolean;
}

/**
 * Time-domain numerical integration state for forced oscillations.
 */
export interface ForcedIntegrationState {
  /** Elapsed simulation time in seconds */
  time: number;
  /** Displacement from static equilibrium in meters (x(t)) */
  displacement: number;
  /** Velocity in m/s (v(t)) */
  velocity: number;
  /** Acceleration in m/s² (a(t)) */
  acceleration: number;
  /** Instantaneous external driving force in Newtons (F(t) = F0·cos(Ωt)) */
  drivingForce: number;
  /** Cumulative external work done by driving force in Joules */
  externalWork: number;
  /** Cumulative thermal energy dissipated by damping in Joules */
  dissipatedEnergy: number;
  /** Instantaneous kinetic energy in Joules (K = 0.5·m·v²) */
  kineticEnergy: number;
  /** Total effective potential energy in Joules (U = 0.5·k·x²) */
  effectivePotentialEnergy: number;
  /** Total instantaneous mechanical energy in Joules (E = K + U) */
  totalMechanicalEnergy: number;
}

/**
 * State of simple pendulum (supporting both linearized SHM and exact nonlinear modes).
 */
export interface PendulumState {
  /** Elapsed simulation time in seconds */
  time: number;
  /** Angular deflection in radians (θ(t)) */
  angleRad: number;
  /** Angular deflection in degrees (θ(t)·180/π) */
  angleDeg: number;
  /** Angular velocity in rad/s (ω(t) = dθ/dt) */
  angularVelocity: number;
  /** Angular acceleration in rad/s² (α(t) = d²θ/dt²) */
  angularAcceleration: number;
  /** Linear arc displacement in meters (s = L·θ) */
  linearDisplacement: number;
  /** Linear velocity in m/s (v = L·ω) */
  linearVelocity: number;
  /** Mode-appropriate restoring torque in N·m (-mgLθ for small-angle, -mgLsinθ for exact) */
  restoringTorque: number;
  /** Kinetic energy in Joules (K = 0.5·m·L²·ω²) */
  kineticEnergy: number;
  /** Mode-appropriate potential energy in Joules */
  potentialEnergy: number;
  /** Total conserved mechanical energy in Joules (E = K + U) */
  totalEnergy: number;
  /** Explicit linearized potential energy (0.5·m·g·L·θ²) */
  approximatePotentialEnergy?: number;
  /** Explicit exact gravitational potential energy (m·g·L·(1 - cosθ)) */
  exactPotentialEnergy?: number;
}

/**
 * Transformation from 1D vertical physical coordinates to 2D Camera2D world coordinates.
 */
export interface VerticalWorldTransform {
  /** World Y coordinate of static equilibrium line */
  worldEquilibriumY: number;
  /** World Y coordinate of suspended mass center */
  worldPositionY: number;
  /** World Y component of velocity vector (points opposite physical velocity) */
  worldVelocityY: number;
  /** World Y component of acceleration vector */
  worldAccelerationY: number;
  /** World Y component of restoring force vector (points towards equilibrium) */
  worldRestoringForceY: number;
  /** World Y component of external driving force vector */
  worldDrivingForceY: number;
}

// ============================================================================
// Default Constants & Presets
// ============================================================================

export const DEFAULT_SPRING_PARAMS: Required<SpringParams> = {
  mass: 1.0,
  springConstant: 25.0,
  naturalLength: 0.40,
  gravity: 9.80,
  dampingCoefficient: 0.0,
  initialDisplacement: 0.30,
};

export const DEFAULT_PENDULUM_PARAMS: Required<PendulumParams> = {
  length: 1.0,
  mass: 1.0,
  gravity: 9.80,
  initialAngleRad: (12.0 * Math.PI) / 180.0, // 12 degrees
};

/**
 * Normal forced-oscillation preset: includes finite damping (b = 0.20 N·s/m)
 * to ensure a realistic, finite steady-state amplitude away from the undamped singularity.
 */
export const DEFAULT_FORCED_SPRING_PARAMS: Required<SpringParams> = {
  mass: 1.0,
  springConstant: 25.0,
  naturalLength: 0.40,
  gravity: 9.80,
  dampingCoefficient: 0.20,
  initialDisplacement: 0.0,
};

export const DEFAULT_DRIVER_PARAMS: ForcedDriverParams = {
  driverForce: 2.0,
  drivingFrequency: 4.0, // 4.0 rad/s (off-resonance, natural frequency is 5.0 rad/s)
};

/**
 * Undamped resonance preset: intentionally demonstrates the unbounded theoretical singularity (A -> Infinity)
 * with an explicit warning banner in the UI.
 */
export const UNDAMPED_RESONANCE_PRESET: { spring: Required<SpringParams>; driver: ForcedDriverParams } = {
  spring: {
    mass: 1.0,
    springConstant: 25.0,
    naturalLength: 0.40,
    gravity: 9.80,
    dampingCoefficient: 0.0,
    initialDisplacement: 0.0,
  },
  driver: {
    driverForce: 2.0,
    drivingFrequency: 5.0, // Exact resonance Ω = ω0 = 5.0 rad/s
  },
};

/** Safety clamp for static elongation to maintain physical classroom scale (meters) */
export const MAX_STATIC_ELONGATION = 1.80;

/**
 * Maximum possible damping ratio across the entire valid parameter envelope:
 * m in [0.20, 3.00] kg, k in [10.0, 100.0] N/m, b in [0.0, 1.00] N·s/m
 * ζ_max = b_max / (2·√(k_min · m_min)) = 1.0 / (2·√(10.0 · 0.20)) = 1 / (2·√2) ≈ 0.353553
 *
 * Because 0.3536 < 1/√2 ≈ 0.7071, every valid parameter combination in the classroom
 * envelope is guaranteed to be strictly underdamped and have a displacement resonance peak.
 */
export const MAX_ENVELOPE_DAMPING_RATIO = 1.0 / (2.0 * Math.sqrt(10.0 * 0.20));

// ============================================================================
// Validation & Core Statics
// ============================================================================

/**
 * Validates spring parameters against physical and apparatus safety constraints.
 *
 * Rules:
 * - Rejects non-finite numbers (NaN, Infinity, -Infinity) for any parameter.
 * - Rejects mass <= 0.
 * - Rejects springConstant <= 0.
 * - Rejects dampingCoefficient < 0.
 * - Rejects naturalLength <= 0.
 * - Rejects gravity <= 0.
 * - Strictly preserves the physical relationship: Δl = (m · g) / k.
 * - Rejects configurations where Δl > MAX_STATIC_ELONGATION (1.80 m).
 * - Rejects configurations where initial displacement exceeds ceiling clearance: |x0| > 0.85·(L0 + Δl).
 */
export function validateSpringParams(params: SpringParams): SpringValidationResult {
  const errors: string[] = [];

  // 1. Finite number and positivity checks
  if (!Number.isFinite(params.mass) || params.mass <= 0) {
    errors.push(`Invalid mass: must be a positive finite number (received: ${params.mass}).`);
  }
  if (!Number.isFinite(params.springConstant) || params.springConstant <= 0) {
    errors.push(`Invalid spring constant: must be a positive finite number (received: ${params.springConstant}).`);
  }
  if (params.naturalLength !== undefined && (!Number.isFinite(params.naturalLength) || params.naturalLength <= 0)) {
    errors.push(`Invalid natural length: must be a positive finite number (received: ${params.naturalLength}).`);
  }
  if (params.gravity !== undefined && (!Number.isFinite(params.gravity) || params.gravity <= 0)) {
    errors.push(`Invalid gravity: must be a positive finite number (received: ${params.gravity}).`);
  }
  if (params.dampingCoefficient !== undefined && (!Number.isFinite(params.dampingCoefficient) || params.dampingCoefficient < 0)) {
    errors.push(`Invalid damping coefficient: must be a non-negative finite number (received: ${params.dampingCoefficient}).`);
  }
  if (!Number.isFinite(params.initialDisplacement)) {
    errors.push(`Invalid initial displacement: must be a finite number (received: ${params.initialDisplacement}).`);
  }

  // If basic numerical properties failed, fail immediately without calculating derived quantities
  if (errors.length > 0) {
    return { valid: false, errors, staticElongation: null };
  }

  const gravity = params.gravity ?? DEFAULT_SPRING_PARAMS.gravity;
  const naturalLength = params.naturalLength ?? DEFAULT_SPRING_PARAMS.naturalLength;

  // 2. Strict physical elongation check
  const deltaL = (params.mass * gravity) / params.springConstant;

  if (deltaL > MAX_STATIC_ELONGATION) {
    errors.push(
      `Static elongation (${deltaL.toFixed(2)} m) exceeds maximum allowable apparatus limit of ${MAX_STATIC_ELONGATION} m.`
    );
  }

  // 3. Ceiling clearance check
  const maxAllowedDisplacement = 0.85 * (naturalLength + deltaL);
  if (Math.abs(params.initialDisplacement) > maxAllowedDisplacement) {
    errors.push(
      `Initial displacement magnitude (${Math.abs(params.initialDisplacement).toFixed(2)} m) exceeds ceiling clearance limit (${maxAllowedDisplacement.toFixed(2)} m).`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    staticElongation: errors.length === 0 ? deltaL : null,
  };
}

/**
 * Computes static equilibrium elongation for a vertical spring under gravity:
 *   Δl = (m · g) / k
 */
export function computeStaticElongation(
  mass: number,
  springConstant: number,
  gravity: number = DEFAULT_SPRING_PARAMS.gravity
): number {
  if (springConstant <= 0) return 0;
  return (mass * gravity) / springConstant;
}

/**
 * Computes natural angular frequency, period, and frequency for a spring-mass:
 *   ω0 = √(k / m)
 *   T  = 2π / ω0 = 2π·√(m / k)
 *   f  = 1 / T = ω0 / 2π
 */
export function computeSpringNaturalFrequencies(
  mass: number,
  springConstant: number
): SHMFrequencies {
  if (mass <= 0 || springConstant <= 0) {
    return { omega0: 0, period: 0, frequency: 0 };
  }
  const omega0 = Math.sqrt(springConstant / mass);
  const period = (2.0 * Math.PI) / omega0;
  const frequency = 1.0 / period;
  return { omega0, period, frequency };
}

/**
 * Computes small-angle natural frequencies and period for a simple pendulum:
 *   ω0 = √(g / L)
 *   T  = 2π / ω0 = 2π·√(L / g)
 *   f  = 1 / T
 */
export function computePendulumFrequencies(
  length: number,
  gravity: number = DEFAULT_PENDULUM_PARAMS.gravity
): SHMFrequencies {
  if (length <= 0 || gravity <= 0) {
    return { omega0: 0, period: 0, frequency: 0 };
  }
  const omega0 = Math.sqrt(gravity / length);
  const period = (2.0 * Math.PI) / omega0;
  const frequency = 1.0 / period;
  return { omega0, period, frequency };
}

/**
 * Computes damping properties and damped frequencies:
 *   γ = b / (2m)
 *   ζ = γ / ω0
 *   Classifies regime: 'undamped' | 'underdamped' | 'critically-damped' | 'overdamped'
 */
export function computeDampedFrequencies(
  mass: number,
  springConstant: number,
  dampingCoefficient: number
): DampedFrequencies {
  const { omega0, period: period0 } = computeSpringNaturalFrequencies(mass, springConstant);
  if (omega0 <= 0) {
    return {
      omega0: 0,
      period0: 0,
      gamma: 0,
      dampingRatio: 0,
      regime: 'undamped',
      isUnderdamped: false,
      omegaD: 0,
      periodD: Infinity,
      frequencyD: 0,
    };
  }

  const gamma = dampingCoefficient / (2.0 * mass);
  const dampingRatio = gamma / omega0;

  if (dampingCoefficient === 0) {
    return {
      omega0,
      period0,
      gamma: 0,
      dampingRatio: 0,
      regime: 'undamped',
      isUnderdamped: true,
      omegaD: omega0,
      periodD: period0,
      frequencyD: 1.0 / period0,
    };
  }

  const epsilon = 1e-12;

  if (gamma < omega0 - epsilon) {
    // Strictly underdamped
    const omegaD = Math.sqrt(omega0 * omega0 - gamma * gamma);
    const periodD = (2.0 * Math.PI) / omegaD;
    const frequencyD = 1.0 / periodD;
    return {
      omega0,
      period0,
      gamma,
      dampingRatio,
      regime: 'underdamped',
      isUnderdamped: true,
      omegaD,
      periodD,
      frequencyD,
    };
  } else if (Math.abs(gamma - omega0) <= epsilon) {
    // Critically damped (ζ = 1)
    return {
      omega0,
      period0,
      gamma,
      dampingRatio: 1.0,
      regime: 'critically-damped',
      isUnderdamped: false,
      omegaD: 0,
      periodD: Infinity,
      frequencyD: 0,
    };
  } else {
    // Overdamped (ζ > 1)
    return {
      omega0,
      period0,
      gamma,
      dampingRatio,
      regime: 'overdamped',
      isUnderdamped: false,
      omegaD: 0,
      periodD: Infinity,
      frequencyD: 0,
    };
  }
}

// ============================================================================
// Mode 1: Ideal Free Oscillation (Spring & Pendulum)
// ============================================================================

/**
 * Computes exact analytical state of an ideal undamped spring-mass released from rest (x(0) = A, v(0) = 0):
 *   x(t) = A · cos(ω0·t)
 *   v(t) = -ω0 · A · sin(ω0·t)
 *   a(t) = -ω0² · x(t)
 *   K = 0.5 · m · v²
 *   U_eff = 0.5 · k · x² (Total effective potential energy relative to equilibrium)
 *   E = K + U_eff = 0.5 · k · A² (Constant)
 */
export function computeIdealSpringState(params: SpringParams, time: number): SHMState {
  const { mass, springConstant, initialDisplacement: A } = params;
  const { omega0 } = computeSpringNaturalFrequencies(mass, springConstant);

  const displacement = A * Math.cos(omega0 * time);
  const velocity = -omega0 * A * Math.sin(omega0 * time);
  const acceleration = -omega0 * omega0 * displacement;
  const restoringForce = -springConstant * displacement;

  const kineticEnergy = 0.5 * mass * velocity * velocity;
  const effectivePotentialEnergy = 0.5 * springConstant * displacement * displacement;
  const totalMechanicalEnergy = kineticEnergy + effectivePotentialEnergy;

  return {
    time,
    displacement,
    velocity,
    acceleration,
    restoringForce,
    dampingForce: 0,
    kineticEnergy,
    effectivePotentialEnergy,
    totalMechanicalEnergy,
    dissipatedEnergy: 0,
    envelope: Math.abs(A),
    regime: 'undamped',
  };
}

// ============================================================================
// Mode 2: Damped Oscillation (Underdamped, Critical, Overdamped)
// ============================================================================

/**
 * Computes exact analytical state of a damped oscillator released from rest (x(0) = A, v(0) = 0).
 *
 * Implements mathematically exact solutions satisfying both initial conditions (x(0) = A, v(0) = 0)
 * and the equation of motion (m·x'' + b·x' + k·x = 0):
 *
 * 1. Underdamped (γ < ω0):
 *    x(t) = A · e^(-γt) · [cos(ωd·t) + (γ/ωd)·sin(ωd·t)]
 *    v(t) = -(A·ω0²/ωd) · e^(-γt) · sin(ωd·t)
 *    a(t) = -ω0²·x(t) - 2γ·v(t)
 *
 * 2. Critically Damped (γ = ω0):
 *    x(t) = A · (1 + γt) · e^(-γt)
 *    v(t) = -γ²·A·t · e^(-γt) = -ω0²·A·t · e^(-ω0t)
 *    a(t) = γ²·A·(γt - 1) · e^(-γt) = -ω0²·x(t) - 2γ·v(t)
 *
 * 3. Overdamped (γ > ω0):
 *    Let β = √(γ² - ω0²):
 *    x(t) = A · e^(-γt) · [cosh(βt) + (γ/β)·sinh(βt)]
 *    v(t) = -(A·ω0²/β) · e^(-γt) · sinh(βt)
 *    a(t) = -ω0²·x(t) - 2γ·v(t)
 */
export function computeDampedSpringState(params: SpringParams, time: number): SHMState {
  const b = params.dampingCoefficient ?? 0;
  if (b === 0) {
    return computeIdealSpringState(params, time);
  }

  const { mass, springConstant, initialDisplacement: A } = params;
  const dampedFreq = computeDampedFrequencies(mass, springConstant, b);
  const { omega0, gamma, regime } = dampedFreq;

  const initialMechanicalEnergy = 0.5 * springConstant * A * A;
  let displacement: number;
  let velocity: number;
  let acceleration: number;
  let envelope: number;

  if (regime === 'underdamped') {
    const { omegaD } = dampedFreq;
    const expDecay = Math.exp(-gamma * time);
    const cosTerm = Math.cos(omegaD * time);
    const sinTerm = Math.sin(omegaD * time);

    displacement = A * expDecay * (cosTerm + (gamma / omegaD) * sinTerm);
    velocity = -((A * omega0 * omega0) / omegaD) * expDecay * sinTerm;
    acceleration = -omega0 * omega0 * displacement - 2.0 * gamma * velocity;
    envelope = Math.abs(A) * (omega0 / omegaD) * expDecay;
  } else if (regime === 'critically-damped') {
    const expDecay = Math.exp(-gamma * time);

    displacement = A * (1.0 + gamma * time) * expDecay;
    velocity = -gamma * gamma * A * time * expDecay;
    acceleration = gamma * gamma * A * (gamma * time - 1.0) * expDecay;
    envelope = Math.abs(displacement);
  } else {
    // Overdamped (numerically stable formulation using strictly decaying exponentials)
    // β = √(γ² - ω0²)
    // λ_slow = γ - β = ω0² / (γ + β) > 0
    // λ_fast = γ + β > 0
    // x(t) = A * [ ((γ + β)/(2β)) * exp(-λ_slow*t) - (ω0²/(2β(γ + β))) * exp(-λ_fast*t) ]
    // v(t) = - (A·ω0² / (2β)) * [ exp(-λ_slow*t) - exp(-λ_fast*t) ]
    // a(t) = -ω0²·x(t) - 2γ·v(t)
    const beta = Math.sqrt(gamma * gamma - omega0 * omega0);
    const lambdaSlow = (omega0 * omega0) / (gamma + beta);
    const lambdaFast = gamma + beta;

    const expSlow = Math.exp(-lambdaSlow * time);
    const expFast = Math.exp(-lambdaFast * time);

    const cSlow = (gamma + beta) / (2.0 * beta);
    const cFast = (omega0 * omega0) / (2.0 * beta * (gamma + beta));

    displacement = A * (cSlow * expSlow - cFast * expFast);
    velocity = -((A * omega0 * omega0) / (2.0 * beta)) * (expSlow - expFast);
    acceleration = -omega0 * omega0 * displacement - 2.0 * gamma * velocity;
    envelope = Math.abs(displacement);
  }

  const restoringForce = -springConstant * displacement;
  const dampingForce = -b * velocity;

  const kineticEnergy = 0.5 * mass * velocity * velocity;
  const effectivePotentialEnergy = 0.5 * springConstant * displacement * displacement;
  const totalMechanicalEnergy = kineticEnergy + effectivePotentialEnergy;
  const dissipatedEnergy = Math.max(0, initialMechanicalEnergy - totalMechanicalEnergy);

  return {
    time,
    displacement,
    velocity,
    acceleration,
    restoringForce,
    dampingForce,
    kineticEnergy,
    effectivePotentialEnergy,
    totalMechanicalEnergy,
    dissipatedEnergy,
    envelope,
    regime,
  };
}

// ============================================================================
// Mode 3 & 4: Forced Oscillations & Resonance
// ============================================================================

/**
 * Computes theoretical steady-state amplitude A(Ω):
 *   A(Ω) = (F0 / m) / √((ω0² - Ω²)² + 4γ²Ω²)
 *
 * Rules:
 * - If driverForce == 0: returns 0 for all frequencies, including exact resonance.
 * - At zero frequency (Ω = 0): returns static deflection A(0) = F0 / k.
 * - If b = 0, F0 > 0, and |Ω - ω0| < 1e-12: returns Infinity (undamped resonance divergence).
 * - Never returns a finite steady-state value for nonzero forcing at exact undamped resonance.
 *
 * Educational Note for b = 0, Ω != ω0:
 * A(Ω) represents strictly the amplitude of the particular integral (frequency-response transfer function).
 * In time domain, the un-damped complementary natural-frequency transient never decays, resulting in persistent
 * beating x(t) = (2F0/m)/(ω0² - Ω²) · sin((ω0 - Ω)t / 2) · sin((ω0 + Ω)t / 2) rather than settling to single-frequency steady state.
 */
export function computeSteadyStateAmplitude(
  params: SpringParams,
  driver: ForcedDriverParams
): number {
  const { mass, springConstant } = params;
  const b = params.dampingCoefficient ?? 0;
  const { driverForce: F0, drivingFrequency: rawOmega } = driver;

  if (mass <= 0 || springConstant <= 0) {
    return 0;
  }

  // Zero forcing produces zero response everywhere, including at natural frequency
  if (F0 === 0) {
    return 0;
  }

  if (F0 < 0) {
    return 0;
  }

  const Omega = Math.abs(rawOmega);

  // Static load at zero frequency: F = k·x => x = F0 / k
  if (Omega === 0) {
    return F0 / springConstant;
  }

  const { omega0 } = computeSpringNaturalFrequencies(mass, springConstant);
  const gamma = b / (2.0 * mass);

  if (b === 0) {
    const diff = Math.abs(omega0 * omega0 - Omega * Omega);
    if (diff < 1e-12) {
      return Infinity; // Diverges at exact undamped resonance with non-zero driving force
    }
    return (F0 / mass) / diff;
  }

  const deltaOmegaSq = omega0 * omega0 - Omega * Omega;
  const denom = Math.sqrt(deltaOmegaSq * deltaOmegaSq + 4.0 * gamma * gamma * Omega * Omega);
  return (F0 / mass) / denom;
}

/**
 * Computes theoretical steady-state phase lag δ(Ω) using two-argument atan2:
 *   δ = atan2(2γΩ, ω0² - Ω²)
 *
 * Returns δ ∈ [0, π] radians, or null if undefined at exact undamped resonance:
 * - At b = 0 and Ω = ω0: returns null (phase is undefined because no finite steady state exists).
 * - At b = 0, Ω < ω0: returns 0 rad (in-phase).
 * - At b = 0, Ω > ω0: returns π rad (anti-phase).
 * - At b > 0 and Ω = ω0: returns π/2 rad (exact 90° lag).
 */
export function computePhaseLag(params: SpringParams, drivingFrequency: number): number | null {
  const { mass, springConstant } = params;
  const b = params.dampingCoefficient ?? 0;
  const Omega = Math.abs(drivingFrequency);

  const { omega0 } = computeSpringNaturalFrequencies(mass, springConstant);
  const gamma = b / (2.0 * mass);

  if (b === 0) {
    if (Math.abs(Omega - omega0) < 1e-12) {
      return null; // Undefined phase at singular undamped resonance
    }
    return Omega < omega0 ? 0 : Math.PI;
  }

  const y = 2.0 * gamma * Omega;
  const x = omega0 * omega0 - Omega * Omega;
  return Math.atan2(y, x);
}

/**
 * Determines whether a displacement resonance peak exists and computes peak properties.
 *
 * Condition for displacement resonance peak:
 *   γ < ω0 / √2  (i.e. damping ratio ζ < 1/√2 ≈ 0.7071)
 *
 * If true:
 *   Ωres = √(ω0² - 2γ²)
 *   A_max = (F0 / m) / (2γ · √(ω0² - γ²)) = F0 / (b · ωd)
 *
 * If false (γ >= ω0 / √2):
 *   No positive-frequency displacement resonance peak exists.
 *   hasResonancePeak = false
 *   resonantFrequency = null
 *   peakAmplitude = F0 / k (static deflection at Ω = 0)
 */
export function computeResonancePeak(
  params: SpringParams,
  driverForce: number
): ResonancePeakInfo {
  const { mass, springConstant } = params;
  const b = params.dampingCoefficient ?? 0;

  const { omega0 } = computeSpringNaturalFrequencies(mass, springConstant);
  const gamma = b / (2.0 * mass);

  const qualityFactor = b === 0 ? Infinity : omega0 / (2.0 * gamma);

  // Displacement resonance condition: γ < ω0 / √2
  const peakConditionThreshold = omega0 / Math.SQRT2;
  const hasResonancePeak = gamma < peakConditionThreshold;

  if (!hasResonancePeak) {
    return {
      hasResonancePeak: false,
      resonantFrequencyRad: null,
      resonantFrequencyHz: null,
      peakAmplitude: springConstant > 0 ? driverForce / springConstant : 0,
      qualityFactor,
    };
  }

  // Resonance peak exists
  if (b === 0) {
    if (driverForce === 0) {
      return {
        hasResonancePeak: false,
        resonantFrequencyRad: null,
        resonantFrequencyHz: null,
        peakAmplitude: 0,
        qualityFactor: Infinity,
      };
    }
    return {
      hasResonancePeak: true,
      resonantFrequencyRad: omega0,
      resonantFrequencyHz: omega0 / (2.0 * Math.PI),
      peakAmplitude: Infinity,
      qualityFactor: Infinity,
    };
  }

  const omegaResSq = omega0 * omega0 - 2.0 * gamma * gamma;
  const omegaRes = Math.sqrt(Math.max(0, omegaResSq));
  const omegaD = Math.sqrt(Math.max(0, omega0 * omega0 - gamma * gamma));

  // A_max = F0 / (b · ωd)
  const peakAmplitude = driverForce / (b * omegaD);

  return {
    hasResonancePeak: true,
    resonantFrequencyRad: omegaRes,
    resonantFrequencyHz: omegaRes / (2.0 * Math.PI),
    peakAmplitude,
    qualityFactor,
  };
}

/**
 * Generates an array of points for the analytical frequency response curve A(Ω).
 * Starts at Ω = 0 by default to display the static deflection endpoint A(0) = F0 / k.
 *
 * Guarantees that the exact natural frequency ω0 is explicitly sampled when in range,
 * tagging undamped resonance singularities with `isSingularity: true` so the renderer
 * can draw an asymptotic gap instead of plotting non-finite numbers.
 */
export function computeResonanceCurve(
  params: SpringParams,
  driverForce: number,
  options?: { minOmega?: number; maxOmega?: number; steps?: number }
): ResonanceCurvePoint[] {
  const { mass, springConstant } = params;
  const b = params.dampingCoefficient ?? 0;
  const { omega0 } = computeSpringNaturalFrequencies(mass, springConstant);

  const minOmega = options?.minOmega ?? 0.0;
  const maxOmega = options?.maxOmega ?? 2.5 * omega0;
  const steps = options?.steps ?? 100;

  // Build list of sample frequencies
  const frequencies: number[] = [];
  const dOmega = (maxOmega - minOmega) / (steps - 1);

  for (let i = 0; i < steps; i++) {
    frequencies.push(minOmega + i * dOmega);
  }

  // Ensure exact omega0 and adjacent boundary points are explicitly sampled
  if (omega0 >= minOmega && omega0 <= maxOmega) {
    frequencies.push(omega0);
    if (b === 0 && driverForce > 0) {
      const eps = 0.005 * omega0;
      if (omega0 - eps > minOmega) frequencies.push(omega0 - eps);
      if (omega0 + eps < maxOmega) frequencies.push(omega0 + eps);
    }
  }

  // Sort and remove duplicates within 1e-9 tolerance
  frequencies.sort((a, b) => a - b);
  const uniqueFreqs: number[] = [];
  for (const f of frequencies) {
    const last = uniqueFreqs[uniqueFreqs.length - 1];
    if (last === undefined || Math.abs(f - last) > 1e-9) {
      uniqueFreqs.push(f);
    }
  }

  const points: ResonanceCurvePoint[] = [];

  for (const Omega of uniqueFreqs) {
    const isUndampedSingularity = b === 0 && driverForce > 0 && Math.abs(Omega - omega0) < 1e-9;
    const amplitude = computeSteadyStateAmplitude(params, { driverForce, drivingFrequency: Omega });
    const phaseLagRad = computePhaseLag(params, Omega);
    const phaseLagDeg = phaseLagRad !== null ? (phaseLagRad * 180.0) / Math.PI : null;

    points.push({
      drivingFrequencyRad: Omega,
      drivingFrequencyHz: Omega / (2.0 * Math.PI),
      amplitude,
      phaseLagRad,
      phaseLagDeg,
      isSingularity: isUndampedSingularity,
    });
  }

  return points;
}

/**
 * 4th-Order Runge-Kutta (RK4) numerical integration step for forced damped oscillation:
 *   m·x'' + b·x' + k·x = F0·cos(Ωt)
 *
 * Tracks complete time-domain response (both initial transients and settling into steady-state).
 * Simultaneously integrates:
 *   - External work rate: P_ext = F(t) · v
 *   - Viscous dissipation rate: P_diss = b · v²
 *
 * Verifies the exact conservation balance:
 *   E_mech(t) = E_mech(0) + W_ext(t) - E_diss(t)
 */
export function stepForcedOscillatorRK4(
  state: ForcedIntegrationState,
  params: SpringParams,
  driver: ForcedDriverParams,
  dt: number
): ForcedIntegrationState {
  const { mass: m, springConstant: k } = params;
  const b = params.dampingCoefficient ?? 0;
  const { driverForce: F0, drivingFrequency: Omega } = driver;

  // State derivatives function: [dx/dt, dv/dt, dW/dt, dE_diss/dt]
  const derivatives = (t: number, x: number, v: number) => {
    const F_ext = F0 * Math.cos(Omega * t);
    const accel = (F_ext - b * v - k * x) / m;
    const workRate = F_ext * v;
    const dissRate = b * v * v;
    return { dx: v, dv: accel, dW: workRate, dDiss: dissRate };
  };

  const t0 = state.time;
  const x0 = state.displacement;
  const v0 = state.velocity;

  // RK4 stage 1
  const k1 = derivatives(t0, x0, v0);

  // RK4 stage 2
  const k2 = derivatives(
    t0 + 0.5 * dt,
    x0 + 0.5 * dt * k1.dx,
    v0 + 0.5 * dt * k1.dv
  );

  // RK4 stage 3
  const k3 = derivatives(
    t0 + 0.5 * dt,
    x0 + 0.5 * dt * k2.dx,
    v0 + 0.5 * dt * k2.dv
  );

  // RK4 stage 4
  const k4 = derivatives(
    t0 + dt,
    x0 + dt * k3.dx,
    v0 + dt * k3.dv
  );

  // Weighted RK4 sum
  const newX = x0 + (dt / 6.0) * (k1.dx + 2.0 * k2.dx + 2.0 * k3.dx + k4.dx);
  const newV = v0 + (dt / 6.0) * (k1.dv + 2.0 * k2.dv + 2.0 * k3.dv + k4.dv);
  const newTime = t0 + dt;
  const newW = state.externalWork + (dt / 6.0) * (k1.dW + 2.0 * k2.dW + 2.0 * k3.dW + k4.dW);
  const newDiss = state.dissipatedEnergy + (dt / 6.0) * (k1.dDiss + 2.0 * k2.dDiss + 2.0 * k3.dDiss + k4.dDiss);

  const drivingForceNow = F0 * Math.cos(Omega * newTime);
  const newAccel = (drivingForceNow - b * newV - k * newX) / m;

  const kineticEnergy = 0.5 * m * newV * newV;
  const effectivePotentialEnergy = 0.5 * k * newX * newX;
  const totalMechanicalEnergy = kineticEnergy + effectivePotentialEnergy;

  return {
    time: newTime,
    displacement: newX,
    velocity: newV,
    acceleration: newAccel,
    drivingForce: drivingForceNow,
    externalWork: newW,
    dissipatedEnergy: newDiss,
    kineticEnergy,
    effectivePotentialEnergy,
    totalMechanicalEnergy,
  };
}

// ============================================================================
// Simple Pendulum: Linearized SHM & Exact Nonlinear RK4
// ============================================================================

/**
 * Computes analytical state of simple pendulum under self-consistent linearized SHM (sinθ ≈ θ):
 *   α(t) = -(g / L) · θ(t)
 *   τ(t) = -m · g · L · θ(t)
 *   U_approx(t) = 0.5 · m · g · L · θ(t)²
 *   K(t) = 0.5 · m · L² · ω(t)²
 *   E_total = K + U_approx = 0.5 · m · g · L · θ0² (Constant)
 */
export function computeSmallAnglePendulumState(
  params: PendulumParams,
  time: number
): PendulumState {
  const { length: L, mass: m, initialAngleRad: theta0 } = params;
  const g = params.gravity ?? DEFAULT_PENDULUM_PARAMS.gravity;
  const { omega0 } = computePendulumFrequencies(L, g);

  const angleRad = theta0 * Math.cos(omega0 * time);
  const angularVelocity = -omega0 * theta0 * Math.sin(omega0 * time);
  const angularAcceleration = -omega0 * omega0 * angleRad;

  const linearDisplacement = L * angleRad;
  const linearVelocity = L * angularVelocity;

  // Internally consistent linearized restoring torque and potential energy
  const restoringTorque = -m * g * L * angleRad;
  const approximatePotentialEnergy = 0.5 * m * g * L * angleRad * angleRad;
  const exactPotentialEnergy = m * g * L * (1.0 - Math.cos(angleRad));

  const kineticEnergy = 0.5 * m * linearVelocity * linearVelocity;
  const totalEnergy = kineticEnergy + approximatePotentialEnergy; // Conserved linear energy

  return {
    time,
    angleRad,
    angleDeg: (angleRad * 180.0) / Math.PI,
    angularVelocity,
    angularAcceleration,
    linearDisplacement,
    linearVelocity,
    restoringTorque,
    kineticEnergy,
    potentialEnergy: approximatePotentialEnergy,
    totalEnergy,
    approximatePotentialEnergy,
    exactPotentialEnergy,
  };
}

/**
 * 4th-Order Runge-Kutta step for exact nonlinear simple pendulum:
 *   θ'' = -(g / L) · sin(θ)
 *   τ = -m · g · L · sin(θ)
 *   U = m · g · L · (1 - cosθ)
 *   E = K + U = m · g · L · (1 - cosθ0) (Constant)
 */
export function stepNonlinearPendulumRK4(
  state: PendulumState,
  params: PendulumParams,
  dt: number
): PendulumState {
  const { length: L, mass: m } = params;
  const g = params.gravity ?? DEFAULT_PENDULUM_PARAMS.gravity;
  const gOverL = g / L;

  const derivatives = (theta: number, omega: number) => ({
    dTheta: omega,
    dOmega: -gOverL * Math.sin(theta),
  });

  const t0 = state.time;
  const th0 = state.angleRad;
  const w0 = state.angularVelocity;

  const k1 = derivatives(th0, w0);
  const k2 = derivatives(th0 + 0.5 * dt * k1.dTheta, w0 + 0.5 * dt * k1.dOmega);
  const k3 = derivatives(th0 + 0.5 * dt * k2.dTheta, w0 + 0.5 * dt * k2.dOmega);
  const k4 = derivatives(th0 + dt * k3.dTheta, w0 + dt * k3.dOmega);

  const newTheta = th0 + (dt / 6.0) * (k1.dTheta + 2.0 * k2.dTheta + 2.0 * k3.dTheta + k4.dTheta);
  const newOmega = w0 + (dt / 6.0) * (k1.dOmega + 2.0 * k2.dOmega + 2.0 * k3.dOmega + k4.dOmega);
  const newAccel = -gOverL * Math.sin(newTheta);
  const newTime = t0 + dt;

  const linearDisplacement = L * newTheta;
  const linearVelocity = L * newOmega;
  const restoringTorque = -m * g * L * Math.sin(newTheta);

  const kineticEnergy = 0.5 * m * linearVelocity * linearVelocity;
  const exactPotentialEnergy = m * g * L * (1.0 - Math.cos(newTheta));
  const approximatePotentialEnergy = 0.5 * m * g * L * newTheta * newTheta;
  const totalEnergy = kineticEnergy + exactPotentialEnergy; // Conserved nonlinear energy

  return {
    time: newTime,
    angleRad: newTheta,
    angleDeg: (newTheta * 180.0) / Math.PI,
    angularVelocity: newOmega,
    angularAcceleration: newAccel,
    linearDisplacement,
    linearVelocity,
    restoringTorque,
    kineticEnergy,
    potentialEnergy: exactPotentialEnergy,
    totalEnergy,
    approximatePotentialEnergy,
    exactPotentialEnergy,
  };
}

// ============================================================================
// Coordinate Conversions & Camera Framing
// ============================================================================

/**
 * Transforms 1D downward-positive physical spring coordinate into 2D upward-positive Camera2D world coordinates.
 *
 * Physical system:
 * - Ceiling anchor at physical y = 0
 * - Downward direction is positive (+y)
 * - Static equilibrium at y_eq = L0 + Δl
 * - Displacement x = y - y_eq
 *
 * World system (Camera2D):
 * - Upward direction is positive (+Y)
 * - Ceiling anchor at (0, ceilingWorldY)
 * - World Equilibrium: Y_eq = ceilingWorldY - (L0 + Δl)
 * - World Mass Center: Y_mass = Y_eq - x
 * - World Velocity Vector: (0, -v_phys)
 * - World Acceleration Vector: (0, -a_phys)
 * - World Restoring Force Vector: (0, +k·x) (points upward when stretched downward)
 */
export function transformToWorldCoordinates(physical: {
  ceilingWorldY: number;
  naturalLength: number;
  staticElongation: number;
  displacement: number;
  velocity: number;
  acceleration: number;
  restoringForce: number;
  drivingForce?: number;
}): VerticalWorldTransform {
  const {
    ceilingWorldY,
    naturalLength,
    staticElongation,
    displacement,
    velocity,
    acceleration,
    drivingForce = 0,
  } = physical;

  const worldEquilibriumY = ceilingWorldY - (naturalLength + staticElongation);
  const worldPositionY = worldEquilibriumY - displacement;

  return {
    worldEquilibriumY,
    worldPositionY,
    worldVelocityY: -velocity,
    worldAccelerationY: -acceleration,
    worldRestoringForceY: -physical.restoringForce, // Restoring force opposes displacement: if x > 0 (down), force is up (+Y)
    worldDrivingForceY: -drivingForce,
  };
}

/**
 * Computes dynamic Camera2D viewport bounds to automatically center and fit
 * the entire apparatus on screen across all parameter variations.
 */
export function computeAutoCameraBounds(
  ceilingWorldY: number,
  naturalLength: number,
  staticElongation: number,
  peakAmplitude: number
): {
  centerY: number;
  viewportHeight: number;
  minY: number;
  maxY: number;
} {
  const bobHeight = 0.15; // meters
  const margin = 0.20; // meters for arrows and text labels

  const maxY = ceilingWorldY + 0.15; // includes ceiling mount bracket
  const minY = ceilingWorldY - (naturalLength + staticElongation + peakAmplitude + bobHeight + margin);

  const viewportHeight = (maxY - minY) * 1.15; // 15% visual padding
  const centerY = (maxY + minY) / 2.0;

  return {
    centerY,
    viewportHeight,
    minY,
    maxY,
  };
}
