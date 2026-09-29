/**
 * Simulation lifecycle interface.
 * Every simulation implements this contract.
 */
export interface SimulationMetadata {
  id: string;
  title: string;
  grade: 11 | 12;
  area: string;
  chapter: string;
  description: string;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

export interface Simulation {
  readonly metadata: SimulationMetadata;

  /** Initialize simulation state and UI. Called once. */
  initialize(container: HTMLElement): void;

  /** Reset simulation to initial state. */
  reset(): void;

  /** Start/resume the simulation. */
  start(): void;

  /** Pause the simulation. */
  pause(): void;

  /** Called each animation frame. timestamp is from performance.now(). */
  tick(timestamp: number): void;

  /** Clean up resources. */
  dispose(): void;
}
