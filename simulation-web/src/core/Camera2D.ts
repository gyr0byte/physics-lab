import { Vector2 } from './Vector2';

/**
 * Transforms between world coordinates (meters) and screen coordinates (pixels).
 * World: origin at bottom-left, +Y is up, units in meters.
 * Screen: origin at top-left, +Y is down, units in pixels.
 */
export class Camera2D {
  /** Pixels per meter */
  private _scale: number;
  /** World-space origin position on screen (pixel coordinates of world origin) */
  private _originX: number;
  private _originY: number;
  /** Canvas dimensions */
  private _canvasWidth: number;
  private _canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this._canvasWidth = canvasWidth;
    this._canvasHeight = canvasHeight;
    // Default: 40 pixels per meter, origin at bottom-left with margin
    this._scale = 40;
    this._originX = 80;
    this._originY = canvasHeight - 60;
  }

  get scale(): number {
    return this._scale;
  }

  get canvasWidth(): number {
    return this._canvasWidth;
  }

  get canvasHeight(): number {
    return this._canvasHeight;
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    this._canvasWidth = canvasWidth;
    this._canvasHeight = canvasHeight;
    this._originY = canvasHeight - 60;
  }

  /**
   * Configure the camera view to fit a given world rectangle.
   * @param worldWidth  width in meters to display
   * @param worldHeight height in meters to display
   * @param marginPx    pixel margin around the viewport
   */
  fitWorld(worldWidth: number, worldHeight: number, marginPx: number = 80): void {
    const availW = Math.max(1, this._canvasWidth - 2 * marginPx);
    const availH = Math.max(1, this._canvasHeight - 2 * marginPx);
    this._scale = Math.min(availW / Math.max(0.001, worldWidth), availH / Math.max(0.001, worldHeight));
    this._originX = marginPx;
    this._originY = this._canvasHeight - marginPx;
  }

  /** Convert world position (meters) to screen position (pixels) */
  worldToScreen(worldPos: Vector2): Vector2 {
    return new Vector2(
      this._originX + worldPos.x * this._scale,
      this._originY - worldPos.y * this._scale
    );
  }

  /** Convert a world-space distance (meters) to screen pixels */
  worldToScreenLength(meters: number): number {
    return meters * this._scale;
  }

  /** Convert screen position (pixels) to world position (meters) */
  screenToWorld(screenPos: Vector2): Vector2 {
    return new Vector2(
      (screenPos.x - this._originX) / this._scale,
      (this._originY - screenPos.y) / this._scale
    );
  }
}
