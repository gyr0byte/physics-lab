import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../src/core/Vector2';

describe('Vector2', () => {
  it('creates a zero vector', () => {
    const v = Vector2.zero();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('adds two vectors', () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(3, 4);
    const result = a.add(b);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  it('subtracts two vectors', () => {
    const a = new Vector2(5, 7);
    const b = new Vector2(2, 3);
    const result = a.sub(b);
    expect(result.x).toBe(3);
    expect(result.y).toBe(4);
  });

  it('scales a vector', () => {
    const v = new Vector2(3, 4);
    const result = v.scale(2);
    expect(result.x).toBe(6);
    expect(result.y).toBe(8);
  });

  it('computes magnitude', () => {
    const v = new Vector2(3, 4);
    expect(v.magnitude()).toBeCloseTo(5, 10);
  });

  it('computes magnitude of zero vector', () => {
    expect(Vector2.zero().magnitude()).toBe(0);
  });

  it('normalizes a vector', () => {
    const v = new Vector2(3, 4);
    const n = v.normalized();
    expect(n.magnitude()).toBeCloseTo(1, 10);
    expect(n.x).toBeCloseTo(0.6, 10);
    expect(n.y).toBeCloseTo(0.8, 10);
  });

  it('normalizes zero vector returns zero', () => {
    const n = Vector2.zero().normalized();
    expect(n.x).toBe(0);
    expect(n.y).toBe(0);
  });

  it('creates vector from angle', () => {
    const v = Vector2.fromAngle(0, 5); // 0 radians, magnitude 5
    expect(v.x).toBeCloseTo(5, 10);
    expect(v.y).toBeCloseTo(0, 10);

    const v2 = Vector2.fromAngle(Math.PI / 2, 3); // 90°, magnitude 3
    expect(v2.x).toBeCloseTo(0, 10);
    expect(v2.y).toBeCloseTo(3, 10);
  });

  it('computes dot product', () => {
    const a = new Vector2(1, 0);
    const b = new Vector2(0, 1);
    expect(a.dot(b)).toBe(0); // perpendicular

    const c = new Vector2(2, 3);
    const d = new Vector2(4, 5);
    expect(c.dot(d)).toBe(23); // 2*4 + 3*5
  });

  it('checks equality with tolerance', () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(1 + 1e-10, 2 - 1e-10);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(new Vector2(2, 2))).toBe(false);
  });

  it('clones a vector', () => {
    const a = new Vector2(3, 7);
    const b = a.clone();
    expect(b.x).toBe(3);
    expect(b.y).toBe(7);
    expect(b).not.toBe(a); // Different object
  });
});
