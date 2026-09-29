import { ProjectileMotionSimulation } from './simulations/projectile-motion/ProjectileMotionSimulation';

/**
 * Entry point for the simulation web application.
 * For now, directly launches the Projectile Motion simulation.
 * Future: simulation routing based on URL hash or message from Android host.
 */

function main(): void {
  const container = document.getElementById('app');
  if (!container) {
    throw new Error('Missing #app container element');
  }

  const simulation = new ProjectileMotionSimulation();
  simulation.initialize(container);

  // Expose for debugging
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>)['__simulation'] = simulation;
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
