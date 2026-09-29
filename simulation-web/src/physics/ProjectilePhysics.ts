import { Vector2 } from '../core/Vector2';

/**
 * Pure mathematical model for idealized projectile motion.
 * No air resistance. Uses analytic equations.
 *
 * All quantities in SI units:
 *   position: meters (m)
 *   velocity: meters/second (m/s)
 *   acceleration: meters/second² (m/s²)
 *   time: seconds (s)
 *   angle: radians internally, degrees at UI boundary
 *
 * Equations (y-axis points upward):
 *   vx = v0 * cos(θ)
 *   vy = v0 * sin(θ)
 *   x(t) = x0 + vx * t
 *   y(t) = y0 + vy * t − 0.5 * g * t²
 *   vy(t) = vy − g * t
 */

export interface ProjectileParams {
  /** Initial speed in m/s. Must be >= 0. */
  initialSpeed: number;
  /** Launch angle in radians. Must be in [0, π/2]. */
  launchAngle: number;
  /** Gravitational acceleration in m/s². Must be > 0. */
  gravity: number;
  /** Launch position in meters. */
  launchPosition: Vector2;
}

export interface ProjectileState {
  time: number;
  position: Vector2;
  velocity: Vector2;
  /** Whether the projectile has landed (y ≤ launchPosition.y and t > 0) */
  landed: boolean;
}

/**
 * Compute projectile state at a given time using analytic equations.
 * This is a pure function — no side effects, no rendering.
 */
export function computeProjectileState(
  params: ProjectileParams,
  time: number
): ProjectileState {
  const { initialSpeed, launchAngle, gravity, launchPosition } = params;

  const vx = initialSpeed * Math.cos(launchAngle);
  const vy0 = initialSpeed * Math.sin(launchAngle);

  const x = launchPosition.x + vx * time;
  const y = launchPosition.y + vy0 * time - 0.5 * gravity * time * time;
  const vyNow = vy0 - gravity * time;

  // Projectile has landed if it's at or below launch height and has been in flight
  const landed = time > 0 && y <= launchPosition.y;

  return {
    time,
    position: new Vector2(x, landed ? launchPosition.y : y),
    velocity: new Vector2(vx, landed ? 0 : vyNow),
    landed,
  };
}

/**
 * Compute the time of flight (time until projectile returns to launch height).
 * For θ = 0 or v0 = 0, returns 0.
 */
export function computeTimeOfFlight(params: ProjectileParams): number {
  const { initialSpeed, launchAngle, gravity } = params;
  if (gravity <= 0) return Infinity;
  const vy0 = initialSpeed * Math.sin(launchAngle);
  // Time when y = y0: 0 = vy0*t - 0.5*g*t² → t = 2*vy0/g
  return (2 * vy0) / gravity;
}

/**
 * Compute the horizontal range (distance traveled when returning to launch height).
 */
export function computeRange(params: ProjectileParams): number {
  const { initialSpeed, launchAngle, gravity } = params;
  if (gravity <= 0) return Infinity;
  // R = v0² * sin(2θ) / g
  return (initialSpeed * initialSpeed * Math.sin(2 * launchAngle)) / gravity;
}

/**
 * Compute the maximum height above launch position.
 */
export function computeMaxHeight(params: ProjectileParams): number {
  const { initialSpeed, launchAngle, gravity } = params;
  if (gravity <= 0) return Infinity;
  const vy0 = initialSpeed * Math.sin(launchAngle);
  // H = vy0² / (2g)
  return (vy0 * vy0) / (2 * gravity);
}

/**
 * Compute the time at which maximum height is reached.
 */
export function computeTimeAtMaxHeight(params: ProjectileParams): number {
  const { initialSpeed, launchAngle, gravity } = params;
  if (gravity <= 0) return Infinity;
  const vy0 = initialSpeed * Math.sin(launchAngle);
  return vy0 / gravity;
}

/**
 * Validate projectile parameters. Returns error messages, or empty array if valid.
 */
export function validateParams(params: ProjectileParams): string[] {
  const errors: string[] = [];
  if (params.initialSpeed < 0) {
    errors.push('Initial speed must be non-negative');
  }
  if (params.launchAngle < 0 || params.launchAngle > Math.PI / 2) {
    errors.push('Launch angle must be between 0° and 90°');
  }
  if (params.gravity <= 0) {
    errors.push('Gravity must be positive');
  }
  return errors;
}

/** Convert degrees to radians */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Convert radians to degrees */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}
