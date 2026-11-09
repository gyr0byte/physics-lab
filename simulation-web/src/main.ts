import { simulationRegistry } from './core/SimulationRegistry';
import { ProjectileMotionSimulation } from './simulations/projectile-motion/ProjectileMotionSimulation';
import { NewtonsSecondLawSimulation } from './simulations/newtons-second-law/NewtonsSecondLawSimulation';
import { SimpleHarmonicMotionSimulation } from './simulations/simple-harmonic-motion/SimpleHarmonicMotionSimulation';
import { WorkEnergySimulation } from './simulations/work-energy-power/WorkEnergySimulation';
import type { Simulation } from './core/Simulation';

// Register all educational physics simulations
simulationRegistry.register({
  metadata: new ProjectileMotionSimulation().metadata,
  create: () => new ProjectileMotionSimulation(),
});

simulationRegistry.register({
  metadata: new NewtonsSecondLawSimulation().metadata,
  create: () => new NewtonsSecondLawSimulation(),
});

simulationRegistry.register({
  metadata: new SimpleHarmonicMotionSimulation().metadata,
  create: () => new SimpleHarmonicMotionSimulation(),
});

simulationRegistry.register({
  metadata: new WorkEnergySimulation().metadata,
  create: () => new WorkEnergySimulation(),
});

let activeSimulation: Simulation | null = null;

/**
 * Resolve and launch the simulation requested by URL hash.
 * Defaults to 'projectile-motion' if no hash or invalid hash is provided.
 */
function loadSimulationFromHash(): void {
  const container = document.getElementById('app');
  if (!container) {
    throw new Error('Missing #app container element');
  }

  const rawHash = window.location.hash.replace(/^#/, '').trim();
  const simId = rawHash.split('?')[0] || 'projectile-motion';

  // If a simulation is already running, cleanly dispose it
  if (activeSimulation) {
    try {
      activeSimulation.dispose();
    } catch (err) {
      console.warn('Error disposing previous simulation:', err);
    }
    activeSimulation = null;
  }

  // Look up simulation in registry
  let entry = simulationRegistry.get(simId);
  if (!entry) {
    console.warn(`Simulation ID "${simId}" not found in registry. Defaulting to projectile-motion.`);
    entry = simulationRegistry.get('projectile-motion');
  }

  if (entry) {
    activeSimulation = entry.create();
    activeSimulation.initialize(container);

    (window as unknown as Record<string, unknown>)['__simulation'] = activeSimulation;
    (window as unknown as Record<string, unknown>)['__simulationRegistry'] = simulationRegistry;
  }
}

function main(): void {
  loadSimulationFromHash();
  window.addEventListener('hashchange', loadSimulationFromHash);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
