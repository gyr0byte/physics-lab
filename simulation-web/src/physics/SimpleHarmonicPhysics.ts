/**
 * Pure mathematical and physical model for Simple Harmonic Motion & Periodic Oscillations.
 *
 * Implements the official Nepal CDC Physics Grade 12 (First Edition 2025)
 * Chapter 2: Periodic Motion (pp. 25–44) requirements.
 *
 * Features:
 * 1. Mode 1: Free Oscillation (Primary: Vertical Spring-Mass; Secondary: Simple Pendulum & Horizontal Spring)
 * 2. Mode 2: Damped Oscillation (Underdamped analytical solution, exponential envelope, energy dissipation)
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
  /** Angular frequency of driving force in rad/s (Ω > 0) */
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
  /** Whether the system is strictly underdamped (γ < ω0) */
  isUnderdamped: boolean;
  /** Damped angular frequency in rad/s (ωd = √(ω0² - γ²)) */
  omegaD: number;
  /** Damped oscillation period in seconds (Td = 2π / ωd) */
  periodD: number;
  /** Damped frequency in Hertz (fd = ωd / 2π) */
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
  /** Phase lag in radians (δ ∈ [0, π]) */
  phaseLagRad: number;
  /** Phase lag in degrees (δ ∈ [0°, 180°]) */
  phaseLagDeg: number;
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
 * State of simple pendulum (both small-angle and exact nonlinear).
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
  /** Gravitational restoring torque in N·m (τ = -m·g·L·sinθ) */
  restoringTorque: number;
  /** Kinetic energy in Joules (K = 0.5·m·L²·ω²) */
  kineticEnergy: number;
  /** Gravitational potential energy relative to lowest point in Joules (U = m·g·L·(1 - cosθ)) */
  potentialEnergy: number;
  /** Total mechanical energy in Joules (E = K + U) */
  totalEnergy: number;
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

export const DEFAULT_DRIVER_PARAMS: ForcedDriverParams = {
  driverForce: 2.0,
  drivingFrequency: 5.0, // matches default ω0 = √(25/1) = 5.0 rad/s
};

/** Safety clamp for static elongation to maintain physical classroom scale (meters) */
export const MAX_STATIC_ELONGATION = 1.80;

// ============================================================================
// Validation & Core Statics
// ============================================================================

/**
 * Validates and clamps spring parameters to ensure physical apparatus validity.
 *
 * Rules:
 * - m > 0, k > 0, g > 0, b >= 0, L0 > 0.
 * - Static elongation Δl = m·g / k clamped to MAX_STATIC_ELONGATION (1.80 m).
 * - Initial displacement |x0| clamped to 0.85·(L0 + Δl) to prevent striking the ceiling bracket.
 */
export function validateSpringParams(params: SpringParams): {
  valid: boolean;
  clampedParams: Required<SpringParams>;
  warning?: string;
} {
  const mass = Math.max(0.1, params.mass);
  const springConstant = Math.max(1.0, params.springConstant);
  const naturalLength = Math.max(0.1, params.naturalLength ?? DEFAULT_SPRING_PARAMS.naturalLength);
  const gravity = Math.max(0.1, params.gravity ?? DEFAULT_SPRING_PARAMS.gravity);
  const dampingCoefficient = Math.max(0.0, params.dampingCoefficient ?? 0.0);

  let deltaL = (mass * gravity) / springConstant;
  let warning: string | undefined;

  if (deltaL > MAX_STATIC_ELONGATION) {
    warning = `Static elongation (${deltaL.toFixed(2)} m) exceeds safe apparatus bound (1.80 m). Clamping to 1.80 m.`;
    deltaL = MAX_STATIC_ELONGATION;
  }

  // Maximum allowed amplitude before mass hits ceiling clamp
  const maxAllowedAmplitude = 0.85 * (naturalLength + deltaL);
  const initialDisplacement = Math.min(
    Math.max(params.initialDisplacement, -maxAllowedAmplitude),
    maxAllowedAmplitude
  );

  return {
    valid: warning === undefined,
    clampedParams: {
      mass,
      springConstant,
      naturalLength,
      gravity,
      dampingCoefficient,
      initialDisplacement,
    },
    warning,
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
 *   ωd = √(ω0² - γ²) (when γ < ω0)
 *   Td = 2π / ωd
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
      isUnderdamped: false,
      omegaD: 0,
      periodD: Infinity,
      frequencyD: 0,
    };
  }

  const gamma = dampingCoefficient / (2.0 * mass);
  const dampingRatio = gamma / omega0;
  const isUnderdamped = gamma < omega0;

  if (!isUnderdamped) {
    return {
      omega0,
      period0,
      gamma,
      dampingRatio,
      isUnderdamped: false,
      omegaD: 0,
      periodD: Infinity,
      frequencyD: 0,
    };
  }

  const omegaD = Math.sqrt(omega0 * omega0 - gamma * gamma);
  const periodD = (2.0 * Math.PI) / omegaD;
  const frequencyD = 1.0 / periodD;

  return {
    omega0,
    period0,
    gamma,
    dampingRatio,
    isUnderdamped: true,
    omegaD,
    periodD,
    frequencyD,
  };
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
  };
}

// ============================================================================
// Mode 2: Damped Oscillation
// ============================================================================

/**
 * Computes exact analytical state of an underdamped oscillator released from rest (x(0) = A, v(0) = 0):
 *
 * To satisfy v(0) = 0, the analytical solution requires the phase cross-term:
 *   x(t) = A · e^(-γ·t) · [cos(ωd·t) + (γ / ωd)·sin(ωd·t)]
 *   v(t) = -(A · ω0² / ωd) · e^(-γ·t) · sin(ωd·t)
 *   a(t) = -ω0² · x(t) - 2γ · v(t)
 *   Envelope: ± A · (ω0 / ωd) · e^(-γ·t)
 *
 * Mechanical energy dissipation:
 *   E(t) = 0.5·m·v² + 0.5·k·x²
 *   E_diss = E(0) - E(t) = 0.5·k·A² - E(t)
 */
export function computeDampedSpringState(params: SpringParams, time: number): SHMState {
  const b = params.dampingCoefficient ?? 0;
  if (b === 0) {
    return computeIdealSpringState(params, time);
  }

  const { mass, springConstant, initialDisplacement: A } = params;
  const dampedFreq = computeDampedFrequencies(mass, springConstant, b);

  if (!dampedFreq.isUnderdamped) {
    // Overdamped or critically damped fallback (not primary CDC lab model)
    const gamma = dampedFreq.gamma;
    const decay = Math.exp(-gamma * time);
    const displacement = A * decay;
    const velocity = -gamma * A * decay;
    const acceleration = gamma * gamma * A * decay;
    const kineticEnergy = 0.5 * mass * velocity * velocity;
    const effectivePotentialEnergy = 0.5 * springConstant * displacement * displacement;
    const totalMechanicalEnergy = kineticEnergy + effectivePotentialEnergy;
    const initialEnergy = 0.5 * springConstant * A * A;

    return {
      time,
      displacement,
      velocity,
      acceleration,
      restoringForce: -springConstant * displacement,
      dampingForce: -b * velocity,
      kineticEnergy,
      effectivePotentialEnergy,
      totalMechanicalEnergy,
      dissipatedEnergy: Math.max(0, initialEnergy - totalMechanicalEnergy),
      envelope: Math.abs(A) * decay,
    };
  }

  const { omega0, gamma, omegaD } = dampedFreq;
  const expDecay = Math.exp(-gamma * time);
  const cosTerm = Math.cos(omegaD * time);
  const sinTerm = Math.sin(omegaD * time);

  // Exact position satisfying x(0) = A and v(0) = 0
  const displacement = A * expDecay * (cosTerm + (gamma / omegaD) * sinTerm);

  // Exact velocity derivative satisfying v(0) = 0
  const velocity = -((A * omega0 * omega0) / omegaD) * expDecay * sinTerm;

  // Exact acceleration satisfying equation of motion: a = -ω0²x - 2γv
  const acceleration = -omega0 * omega0 * displacement - 2.0 * gamma * velocity;

  const restoringForce = -springConstant * displacement;
  const dampingForce = -b * velocity;

  const kineticEnergy = 0.5 * mass * velocity * velocity;
  const effectivePotentialEnergy = 0.5 * springConstant * displacement * displacement;
  const totalMechanicalEnergy = kineticEnergy + effectivePotentialEnergy;
  const initialEnergy = 0.5 * springConstant * A * A;
  const dissipatedEnergy = Math.max(0, initialEnergy - totalMechanicalEnergy);

  // Theoretical upper envelope: A · (ω0 / ωd) · e^(-γt)
  const envelope = Math.abs(A) * (omega0 / omegaD) * expDecay;

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
  };
}

// ============================================================================
// Mode 3 & 4: Forced Oscillations & Resonance
// ============================================================================

/**
 * Computes theoretical steady-state amplitude A(Ω):
 *   A(Ω) = (F0 / m) / √((ω0² - Ω²)² + 4γ²Ω²)
 *
 * Engineering Rules:
 * - If b = 0 and |Ω - ω0| < 1e-12: returns Infinity (undamped resonance divergence).
 * - Never returns a finite steady-state value at exact undamped resonance.
 */
export function computeSteadyStateAmplitude(
  params: SpringParams,
  driver: ForcedDriverParams
): number {
  const { mass, springConstant } = params;
  const b = params.dampingCoefficient ?? 0;
  const { driverForce: F0, drivingFrequency: Omega } = driver;

  if (mass <= 0 || springConstant <= 0 || F0 < 0 || Omega <= 0) {
    return 0;
  }

  const { omega0 } = computeSpringNaturalFrequencies(mass, springConstant);
  const gamma = b / (2.0 * mass);

  if (b === 0) {
    const diff = Math.abs(omega0 * omega0 - Omega * Omega);
    if (diff < 1e-12) {
      return Infinity; // Diverges at exact undamped resonance
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
 * Returns δ ∈ [0, π] radians:
 * - Low frequency (Ω << ω0): δ ≈ 0 rad (in-phase)
 * - Resonance (Ω = ω0): δ = π/2 rad (90° lag)
 * - High frequency (Ω >> ω0): δ → π rad (180° lag / anti-phase)
 */
export function computePhaseLag(params: SpringParams, drivingFrequency: number): number {
  const { mass, springConstant } = params;
  const b = params.dampingCoefficient ?? 0;
  const Omega = drivingFrequency;

  const { omega0 } = computeSpringNaturalFrequencies(mass, springConstant);
  const gamma = b / (2.0 * mass);

  if (b === 0) {
    if (Omega < omega0) return 0;
    if (Omega > omega0) return Math.PI;
    return Math.PI / 2.0; // exact boundary at resonance
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
 */
export function computeResonanceCurve(
  params: SpringParams,
  driverForce: number,
  options?: { minOmega?: number; maxOmega?: number; steps?: number }
): ResonanceCurvePoint[] {
  const { mass, springConstant } = params;
  const { omega0 } = computeSpringNaturalFrequencies(mass, springConstant);

  const minOmega = options?.minOmega ?? Math.max(0.1, 0.1 * omega0);
  const maxOmega = options?.maxOmega ?? 2.5 * omega0;
  const steps = options?.steps ?? 100;

  const points: ResonanceCurvePoint[] = [];
  const dOmega = (maxOmega - minOmega) / (steps - 1);

  for (let i = 0; i < steps; i++) {
    const Omega = minOmega + i * dOmega;
    const amplitude = computeSteadyStateAmplitude(params, { driverForce, drivingFrequency: Omega });
    const phaseLagRad = computePhaseLag(params, Omega);
    const phaseLagDeg = (phaseLagRad * 180.0) / Math.PI;

    points.push({
      drivingFrequencyRad: Omega,
      drivingFrequencyHz: Omega / (2.0 * Math.PI),
      amplitude,
      phaseLagRad,
      phaseLagDeg,
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
// Simple Pendulum: Small-Angle & Exact Nonlinear RK4
// ============================================================================

/**
 * Computes analytical state of simple pendulum under small-angle approximation (sinθ ≈ θ):
 *   θ(t) = θ0 · cos(ω0·t)
 *   v(t) = -ω0 · L · θ0 · sin(ω0·t)
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
  const restoringTorque = -m * g * L * Math.sin(angleRad);

  const kineticEnergy = 0.5 * m * linearVelocity * linearVelocity;
  const potentialEnergy = m * g * L * (1.0 - Math.cos(angleRad));
  const totalEnergy = kineticEnergy + potentialEnergy;

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
    potentialEnergy,
    totalEnergy,
  };
}

/**
 * 4th-Order Runge-Kutta step for exact nonlinear simple pendulum:
 *   θ'' = -(g / L) · sin(θ)
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
  const potentialEnergy = m * g * L * (1.0 - Math.cos(newTheta));
  const totalEnergy = kineticEnergy + potentialEnergy;

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
    potentialEnergy,
    totalEnergy,
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
