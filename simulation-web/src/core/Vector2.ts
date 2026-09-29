/**
 * Minimal 2D vector class for simulation physics.
 * Immutable operations return new vectors; mutable operations modify in-place.
 */
export class Vector2 {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static fromAngle(angleRad: number, magnitude: number): Vector2 {
    return new Vector2(
      magnitude * Math.cos(angleRad),
      magnitude * Math.sin(angleRad)
    );
  }

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  sub(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalized(): Vector2 {
    const mag = this.magnitude();
    if (mag === 0) return Vector2.zero();
    return new Vector2(this.x / mag, this.y / mag);
  }

  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  equals(other: Vector2, tolerance: number = 1e-9): boolean {
    return (
      Math.abs(this.x - other.x) < tolerance &&
      Math.abs(this.y - other.y) < tolerance
    );
  }
}
