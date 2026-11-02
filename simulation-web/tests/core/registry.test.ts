import { describe, it, expect } from 'vitest';
import { SimulationRegistry } from '../../src/core/SimulationRegistry';
import type { Simulation, SimulationMetadata } from '../../src/core/Simulation';

describe('SimulationRegistry', () => {
  it('registers and retrieves simulations by ID', () => {
    const registry = new SimulationRegistry();
    const meta: SimulationMetadata = {
      id: 'test-sim',
      title: 'Test Sim',
      grade: 11,
      area: 'Mechanics',
      chapter: 'Test',
      description: 'A test simulation',
    };

    const mockSim: Simulation = {
      metadata: meta,
      initialize: () => {},
      reset: () => {},
      start: () => {},
      pause: () => {},
      tick: () => {},
      dispose: () => {},
    };

    registry.register({
      metadata: meta,
      create: () => mockSim,
    });

    expect(registry.has('test-sim')).toBe(true);
    expect(registry.has('non-existent')).toBe(false);

    const entry = registry.get('test-sim');
    expect(entry).toBeDefined();
    expect(entry?.metadata.title).toBe('Test Sim');
    expect(entry?.create()).toBe(mockSim);
  });

  it('lists all registered simulations', () => {
    const registry = new SimulationRegistry();
    expect(registry.getAll().length).toBe(0);

    registry.register({
      metadata: { id: 's1', title: 'S1', grade: 11, area: 'M', chapter: 'C', description: 'D' },
      create: () => ({} as Simulation),
    });
    registry.register({
      metadata: { id: 's2', title: 'S2', grade: 12, area: 'E', chapter: 'C', description: 'D' },
      create: () => ({} as Simulation),
    });

    expect(registry.getAll().length).toBe(2);
    expect(registry.has('s1')).toBe(true);
    expect(registry.has('s2')).toBe(true);
  });
});
