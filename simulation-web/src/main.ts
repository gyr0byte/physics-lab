import { ProjectileMotionSimulation } from './simulations/projectile-motion/ProjectileMotionSimulation';

/**
 * Entry point for the simulation web application.
 * Launches the Projectile Motion simulation.
 */
function main(): void {
  const container = document.getElementById('app');
  if (!container) {
    throw new Error('Missing #app container element');
  }

  const simulation = new ProjectileMotionSimulation();
  simulation.initialize(container);

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
