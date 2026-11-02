import { describe, it, expect } from 'vitest';
import { Camera2D } from '../../src/core/Camera2D';
import { Vector2 } from '../../src/core/Vector2';

describe('Camera2D', () => {
  it('initializes with expected default origin and scale', () => {
    const cam = new Camera2D(800, 600);
    expect(cam.canvasWidth).toBe(800);
    expect(cam.canvasHeight).toBe(600);
    expect(cam.scale).toBe(40);

    const screenZero = cam.worldToScreen(new Vector2(0, 0));
    expect(screenZero.x).toBe(80);
    expect(screenZero.y).toBe(600 - 60);
  });

  it('inverts Y axis so world +Y points up in screen space', () => {
    const cam = new Camera2D(800, 600);
    const origin = cam.worldToScreen(new Vector2(0, 0));
    const up10m = cam.worldToScreen(new Vector2(0, 10));

    expect(up10m.y).toBeLessThan(origin.y);
    expect(origin.y - up10m.y).toBe(10 * cam.scale);
  });

  it('maintains +X pointing right in screen space', () => {
    const cam = new Camera2D(800, 600);
    const origin = cam.worldToScreen(new Vector2(0, 0));
    const right10m = cam.worldToScreen(new Vector2(10, 0));

    expect(right10m.x).toBeGreaterThan(origin.x);
    expect(right10m.x - origin.x).toBe(10 * cam.scale);
  });

  it('performs reversible worldToScreen and screenToWorld round-trips', () => {
    const cam = new Camera2D(1920, 1080);
    cam.fitWorld(100, 50, 80);

    const testPoints = [
      new Vector2(0, 0),
      new Vector2(25.5, 12.3),
      new Vector2(80, 45),
      new Vector2(100, 0),
    ];

    for (const worldPt of testPoints) {
      const screenPt = cam.worldToScreen(worldPt);
      const restored = cam.screenToWorld(screenPt);
      expect(restored.x).toBeCloseTo(worldPt.x, 3);
      expect(restored.y).toBeCloseTo(worldPt.y, 3);
    }
  });

  it('fitWorld scales view to fit the more constrained dimension', () => {
    const cam = new Camera2D(1000, 600);
    // Avail width = 1000 - 160 = 840. Avail height = 600 - 160 = 440.
    // If world is 84m wide and 22m high:
    // Scale X = 840 / 84 = 10. Scale Y = 440 / 22 = 20.
    // Constrained by width -> scale should be 10.
    cam.fitWorld(84, 22, 80);
    expect(cam.scale).toBeCloseTo(10);

    // If world is 42m wide and 44m high:
    // Scale X = 840 / 42 = 20. Scale Y = 440 / 44 = 10.
    // Constrained by height -> scale should be 10.
    cam.fitWorld(42, 44, 80);
    expect(cam.scale).toBeCloseTo(10);
  });

  it('resize updates dimensions and adjusts bottom origin', () => {
    const cam = new Camera2D(800, 600);
    cam.resize(1920, 1080);
    expect(cam.canvasWidth).toBe(1920);
    expect(cam.canvasHeight).toBe(1080);

    const origin = cam.worldToScreen(new Vector2(0, 0));
    expect(origin.y).toBe(1080 - 60);
  });
});
