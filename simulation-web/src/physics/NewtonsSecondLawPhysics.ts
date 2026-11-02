/**
 * Parameters for Newton's Second Law simulation.
 * All quantities in SI units.
 */
export interface NewtonsSecondLawParams {
  /** Mass of the object in kilograms (kg) */
  mass: number;
  /** Applied horizontal force in Newtons (N). Positive = right, Negative = left */
  appliedForce: number;
  /** Coefficient of friction (dimensionless, >= 0). 0 = frictionless */
  frictionCoefficient: number;
  /** Acceleration due to gravity in m/s^2 (default 9.8) */
  gravity: number;
}

/**
 * Current physical state of the object in Newton's Second Law simulation.
 */
export interface NewtonsSecondLawState {
  /** Elapsed time in seconds */
  time: number;
  /** Horizontal position in meters */
  position: number;
  /** Horizontal velocity in m/s */
  velocity: number;
  /** Horizontal acceleration in m/s^2 */
  acceleration: number;
  /** Normal force in Newtons (N) */
  normalForce: number;
  /** Gravity / Weight force in Newtons (N) */
  weightForce: number;
  /** Actual friction force currently acting on the object in Newtons (N) */
  frictionForce: number;
  /** Net horizontal force in Newtons (N) */
  netForce: number;
  /** Maximum static friction threshold in Newtons (N) */
  maxStaticFriction: number;
  /** Whether the object is currently static (at rest and static friction holding) */
  isStatic: number | boolean;
}

/**
 * Default parameters: 5 kg mass, 20 N applied force, 0.10 friction coefficient.
 */
export const DEFAULT_NEWTON_PARAMS: NewtonsSecondLawParams = {
  mass: 5.0,
  appliedForce: 20.0,
  frictionCoefficient: 0.10,
  gravity: 9.8,
};

/**
 * Velocity threshold below which the object is considered at rest (m/s).
 */
export const REST_VELOCITY_EPSILON = 1e-4;

/**
 * Compute the forces and acceleration given current parameters and velocity.
 *
 * Physics rules:
 * 1. Normal force: N = m * g
 * 2. Weight: W = m * g
 * 3. Static friction threshold: f_s_max = mu_s * N (we assume mu_s = mu)
 * 4. Kinetic friction: f_k = mu_k * N (we assume mu_k = 0.85 * mu when mu > 0)
 * 5. At rest (|v| < epsilon):
 *    - If |F_app| <= f_s_max, static friction opposes applied force: f = -F_app, F_net = 0, a = 0.
 *    - If |F_app| > f_s_max, static friction breaks: f = -sgn(F_app) * f_k, F_net = F_app + f, a = F_net / m.
 * 6. In motion (|v| >= epsilon):
 *    - Kinetic friction opposes velocity: f = -sgn(v) * f_k, F_net = F_app + f, a = F_net / m.
 */
export function computeForcesAndAcceleration(
  params: NewtonsSecondLawParams,
  currentVelocity: number
): {
  normalForce: number;
  weightForce: number;
  maxStaticFriction: number;
  frictionForce: number;
  netForce: number;
  acceleration: number;
  isStatic: boolean;
} {
  const m = Math.max(0.01, params.mass);
  const g = params.gravity;
  const mu = Math.max(0, params.frictionCoefficient);
  const fApp = params.appliedForce;

  const normalForce = m * g;
  const weightForce = m * g;
  const maxStaticFriction = mu * normalForce;
  const kineticFrictionMag = 0.85 * mu * normalForce;

  const isAtRest = Math.abs(currentVelocity) < REST_VELOCITY_EPSILON;

  if (isAtRest) {
    if (Math.abs(fApp) <= maxStaticFriction) {
      // Static friction holds the object at rest
      const frictionForce = fApp === 0 ? 0 : -fApp;
      return {
        normalForce,
        weightForce,
        maxStaticFriction,
        frictionForce,
        netForce: 0,
        acceleration: 0,
        isStatic: true,
      };
    } else {
      // Applied force overcomes static friction
      const sign = fApp >= 0 ? 1 : -1;
      const frictionForce = kineticFrictionMag === 0 ? 0 : -sign * kineticFrictionMag;
      const netForce = fApp + frictionForce;
      const acceleration = netForce === 0 ? 0 : netForce / m;
      return {
        normalForce,
        weightForce,
        maxStaticFriction,
        frictionForce,
        netForce,
        acceleration,
        isStatic: false,
      };
    }
  } else {
    // In motion: kinetic friction opposes current velocity direction
    const sign = currentVelocity >= 0 ? 1 : -1;
    const frictionForce = kineticFrictionMag === 0 ? 0 : -sign * kineticFrictionMag;
    const netForce = fApp + frictionForce;
    const acceleration = netForce === 0 ? 0 : netForce / m;
    return {
      normalForce,
      weightForce,
      maxStaticFriction,
      frictionForce,
      netForce,
      acceleration,
      isStatic: false,
    };
  }
}

/**
 * Step the physical state forward by dt seconds using semi-implicit Euler integration
 * with safe zero-crossing velocity arrest.
 */
export function stepNewtonsSecondLaw(
  currentState: NewtonsSecondLawState,
  params: NewtonsSecondLawParams,
  dt: number
): NewtonsSecondLawState {
  if (dt <= 0) return { ...currentState };

  const forces = computeForcesAndAcceleration(params, currentState.velocity);

  let newVelocity = currentState.velocity + forces.acceleration * dt;
  let finalAcceleration = forces.acceleration;
  let finalFrictionForce = forces.frictionForce;
  let finalNetForce = forces.netForce;
  let finalIsStatic = forces.isStatic;

  // Zero-crossing velocity check:
  // If moving, and acceleration opposes velocity (deceleration), check if friction
  // brought the object to a stop within this timestep.
  if (!forces.isStatic && currentState.velocity !== 0) {
    const previousSign = currentState.velocity > 0 ? 1 : -1;
    const newSign = newVelocity > 0 ? 1 : -1;

    // Velocity changed direction due to net retarding force
    if (previousSign !== newSign) {
      // Check if applied force is smaller than static friction
      if (Math.abs(params.appliedForce) <= forces.maxStaticFriction) {
        // Object comes to a complete halt
        newVelocity = 0;
        finalAcceleration = 0;
        finalFrictionForce = -params.appliedForce;
        finalNetForce = 0;
        finalIsStatic = true;
      }
    }
  }

  // Position update: x = x0 + v * dt
  const newPosition = currentState.position + newVelocity * dt;

  return {
    time: currentState.time + dt,
    position: newPosition,
    velocity: newVelocity,
    acceleration: finalAcceleration,
    normalForce: forces.normalForce,
    weightForce: forces.weightForce,
    frictionForce: finalFrictionForce,
    netForce: finalNetForce,
    maxStaticFriction: forces.maxStaticFriction,
    isStatic: finalIsStatic,
  };
}

/**
 * Create initial state for Newton's Second Law.
 */
export function createInitialNewtonsSecondLawState(
  params: NewtonsSecondLawParams
): NewtonsSecondLawState {
  const forces = computeForcesAndAcceleration(params, 0);
  return {
    time: 0,
    position: 0,
    velocity: 0,
    acceleration: forces.acceleration,
    normalForce: forces.normalForce,
    weightForce: forces.weightForce,
    frictionForce: forces.frictionForce,
    netForce: forces.netForce,
    maxStaticFriction: forces.maxStaticFriction,
    isStatic: forces.isStatic,
  };
}
