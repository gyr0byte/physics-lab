import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationClock } from '../../src/core/SimulationClock';

describe('SimulationClock', () => {
  let clock: SimulationClock;

  beforeEach(() => {
    clock = new SimulationClock(1 / 60);
  });

  it('initializes with zero elapsed time and stopped state', () => {
    expect(clock.elapsed).toBe(0);
    expect(clock.running).toBe(false);
    expect(clock.fixedDt).toBeCloseTo(1 / 60);
  });

  it('transitions state on start, pause, and reset', () => {
    clock.start();
    expect(clock.running).toBe(true);

    clock.pause();
    expect(clock.running).toBe(false);

    clock.start();
    expect(clock.running).toBe(true);

    clock.reset();
    expect(clock.running).toBe(false);
    expect(clock.elapsed).toBe(0);
  });

  it('does not advance when stopped', () => {
    const steps = clock.tick(1000);
    expect(steps).toBe(0);
    expect(clock.elapsed).toBe(0);
  });

  it('ignores the very first tick after start to establish baseline timestamp', () => {
    clock.start();
    const steps = clock.tick(1000);
    expect(steps).toBe(0);
    expect(clock.elapsed).toBe(0);
  });

  it('steps fixedDt when frame delta matches timestep', () => {
    clock.start();
    clock.tick(1000); // baseline
    const steps = clock.tick(1000 + (1000 / 60)); // +16.666ms
    expect(steps).toBe(1);
    expect(clock.elapsed).toBeCloseTo(1 / 60);
  });

  it('accumulates multiple steps when delta exceeds multiple timesteps', () => {
    clock.start();
    clock.tick(1000); // baseline
    const steps = clock.tick(1050); // +50ms -> 3 steps of 16.667ms (50ms = 3 * 16.667ms)
    expect(steps).toBe(3);
    expect(clock.elapsed).toBeCloseTo(3 / 60);
  });

  it('caps large delta spikes to prevent spiral of death', () => {
    clock.start();
    clock.tick(1000); // baseline
    // 5 seconds jump (e.g. background tab)
    const steps = clock.tick(6000);
    // Capped at 0.1s (100ms) = 6 steps of 16.667ms
    expect(steps).toBe(6);
    expect(clock.elapsed).toBeCloseTo(6 / 60);
  });

  it('handles pause and resume without leap in time', () => {
    clock.start();
    clock.tick(1000);
    clock.tick(1016.67);
    expect(clock.elapsed).toBeCloseTo(1 / 60);

    clock.pause();
    // Simulation is paused for 10 seconds
    clock.tick(11016.67);
    expect(clock.elapsed).toBeCloseTo(1 / 60);

    // Resume
    clock.start();
    // First tick after resume sets baseline timestamp again
    const steps = clock.tick(11016.67);
    expect(steps).toBe(0);
    expect(clock.elapsed).toBeCloseTo(1 / 60);
  });
});
