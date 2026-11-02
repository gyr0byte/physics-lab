/**
 * Manages simulation time: elapsed time, delta time, pause/resume, reset.
 * Uses a fixed-timestep accumulator for deterministic physics.
 */
export class SimulationClock {
  private _elapsed: number = 0;
  private _running: boolean = false;
  private _lastTimestamp: number | null = null;

  /** Fixed physics timestep in seconds */
  readonly fixedDt: number;

  /** Accumulated time not yet consumed by physics steps */
  private _accumulator: number = 0;

  constructor(fixedDt: number = 1 / 60) {
    this.fixedDt = fixedDt;
  }

  get elapsed(): number {
    return this._elapsed;
  }

  get running(): boolean {
    return this._running;
  }

  start(): void {
    this._running = true;
    this._lastTimestamp = null; // Will be set on next tick
  }

  pause(): void {
    this._running = false;
    this._lastTimestamp = null;
  }

  reset(): void {
    this._elapsed = 0;
    this._accumulator = 0;
    this._running = false;
    this._lastTimestamp = null;
  }

  /**
   * Call each animation frame with performance.now() timestamp.
   * Returns the number of fixed-step physics updates to perform.
   */
  tick(timestamp: number): number {
    if (!this._running) return 0;

    if (this._lastTimestamp === null) {
      this._lastTimestamp = timestamp;
      return 0;
    }

    // Cap frame delta to prevent spiral of death
    const frameDelta = Math.min((timestamp - this._lastTimestamp) / 1000, 0.1);
    this._lastTimestamp = timestamp;
    this._accumulator += frameDelta;

    let steps = 0;
    while (this._accumulator >= this.fixedDt - 1e-9) {
      this._accumulator = Math.max(0, this._accumulator - this.fixedDt);
      this._elapsed += this.fixedDt;
      steps++;
    }

    return steps;
  }
}
