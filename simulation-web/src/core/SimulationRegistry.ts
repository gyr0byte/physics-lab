import type { Simulation, SimulationMetadata } from './Simulation';

/**
 * Registry entry representing a registered simulation.
 */
export interface SimulationEntry {
  metadata: SimulationMetadata;
  create: () => Simulation;
}

/**
 * Registry managing all available educational physics simulations.
 */
export class SimulationRegistry {
  private _simulations = new Map<string, SimulationEntry>();

  register(entry: SimulationEntry): void {
    this._simulations.set(entry.metadata.id, entry);
  }

  get(id: string): SimulationEntry | undefined {
    return this._simulations.get(id);
  }

  getAll(): SimulationEntry[] {
    return Array.from(this._simulations.values());
  }

  has(id: string): boolean {
    return this._simulations.has(id);
  }
}

export const simulationRegistry = new SimulationRegistry();
