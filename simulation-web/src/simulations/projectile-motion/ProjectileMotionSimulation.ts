import type { Simulation, SimulationMetadata } from '../../core/Simulation';
import { SimulationClock } from '../../core/SimulationClock';
import { Camera2D } from '../../core/Camera2D';
import { InputManager, type InputAction } from '../../core/InputManager';
import { Vector2 } from '../../core/Vector2';
import {
  computeProjectileState,
  computeTimeOfFlight,
  computeRange,
  computeMaxHeight,
  degToRad,
  radToDeg,
  type ProjectileParams,
  type ProjectileState,
} from '../../physics/ProjectilePhysics';
import {
  drawGrid,
  drawTrajectory,
  drawVectorArrow,
  drawCircle,
  drawGround,
} from '../../rendering/CanvasRenderer';
import { Graph } from '../../components/Graph';

// ── Parameter definitions ──────────────────────────────────────────

interface Parameter {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Fine step for slow adjustment (hold) */
  fineStep?: number;
}

const DEFAULT_PARAMS = {
  speed: { label: 'Initial Speed', unit: 'm/s', value: 25, min: 1, max: 80, step: 1 },
  angle: { label: 'Launch Angle', unit: '°', value: 45, min: 0, max: 90, step: 1 },
  gravity: { label: 'Gravity', unit: 'm/s²', value: 9.81, min: 1, max: 25, step: 0.1 },
} satisfies Record<string, Parameter>;

type ParamKey = keyof typeof DEFAULT_PARAMS;
const PARAM_KEYS: ParamKey[] = ['speed', 'angle', 'gravity'];

// ── Simulation ─────────────────────────────────────────────────────

export class ProjectileMotionSimulation implements Simulation {
  readonly metadata: SimulationMetadata = {
    id: 'projectile-motion',
    title: 'Projectile Motion',
    grade: 11,
    area: 'Mechanics',
    chapter: 'Kinematics',
    description:
      'Explore how launch angle, initial speed, and gravity affect the trajectory of a projectile.',
  };

  // State
  private _params: Record<ParamKey, Parameter> = structuredClone(DEFAULT_PARAMS);
  private _clock = new SimulationClock(1 / 120);
  private _input = new InputManager();
  private _camera!: Camera2D;
  private _trajectoryPoints: Vector2[] = [];
  private _lastTrajectorySampleTime: number = -1;
  private _resizeListener: (() => void) | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _currentState: ProjectileState = {
    time: 0,
    position: Vector2.zero(),
    velocity: Vector2.zero(),
    landed: false,
  };

  // UI focus
  private _focusedControl: number = 0; // 0-2: params, 3-5: buttons
  private _totalControls = 6; // 3 params + 3 buttons (start, pause, reset)

  // DOM references
  private _container!: HTMLElement;
  private _canvas!: HTMLCanvasElement;
  private _ctx!: CanvasRenderingContext2D;
  private _uiPanel!: HTMLElement;
  private _measurePanel!: HTMLElement;
  private _controlElements: HTMLElement[] = [];
  private _graph!: Graph;
  private _graphYSeries!: number;
  private _graphVySeries!: number;
  private _animFrameId: number = 0;

  // ── Lifecycle ──────────────────────────────────────────────────

  initialize(container: HTMLElement): void {
    this._container = container;
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.overflow = 'hidden';
    container.style.backgroundColor = '#0d1117';
    container.style.color = '#e6edf3';
    container.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

    this._buildHeader();
    this._buildMainArea();
    this._buildBottomPanel();

    this._input.attach();
    this._input.onInput((action) => this._handleInput(action));

    this._updateParamDisplay();
    this._updateFocus();
    // Note: _render() is called by _resizeCanvas() on next animation frame
  }

  start(): void {
    if (this._currentState.landed) return;
    if (this._clock.running && this._animFrameId !== 0) return;
    this._clock.start();
    this._startLoop();
    this._updateButtonStates();
  }

  pause(): void {
    this._clock.pause();
    if (this._animFrameId !== 0) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = 0;
    }
    this._updateButtonStates();
  }

  reset(): void {
    this._clock.reset();
    if (this._animFrameId !== 0) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = 0;
    }
    this._trajectoryPoints = [];
    this._lastTrajectorySampleTime = -1;
    this._currentState = {
      time: 0,
      position: new Vector2(0, 0),
      velocity: Vector2.zero(),
      landed: false,
    };
    this._graph.clear();
    this._updateMeasurements();
    this._updateButtonStates();
    this._render();
  }

  tick(timestamp: number): void {
    const steps = this._clock.tick(timestamp);
    if (steps === 0) {
      this._render();
      return;
    }

    const params = this._getPhysicsParams();
    const TRAJECTORY_SAMPLE_INTERVAL = 0.02; // Sample every 20ms in simulation time

    for (let i = 0; i < steps; i++) {
      this._currentState = computeProjectileState(params, this._clock.elapsed);

      // Trajectory sampling: sample based on simulation clock interval, independent of vx (robust at 90°)
      if (
        this._trajectoryPoints.length === 0 ||
        this._clock.elapsed - this._lastTrajectorySampleTime >= TRAJECTORY_SAMPLE_INTERVAL
      ) {
        this._trajectoryPoints.push(this._currentState.position.clone());
        this._lastTrajectorySampleTime = this._clock.elapsed;
      }

      // Graph data
      this._graph.pushData(this._graphYSeries, this._clock.elapsed, this._currentState.position.y);
      this._graph.pushData(this._graphVySeries, this._clock.elapsed, this._currentState.velocity.y);

      if (this._currentState.landed) {
        // Ensure final landing position is captured
        this._trajectoryPoints.push(this._currentState.position.clone());
        this._clock.pause();
        if (this._animFrameId !== 0) {
          cancelAnimationFrame(this._animFrameId);
          this._animFrameId = 0;
        }
        break;
      }
    }

    this._updateMeasurements();
    this._render();
    this._graph.render();
  }

  dispose(): void {
    if (this._animFrameId !== 0) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = 0;
    }
    if (this._resizeListener) {
      window.removeEventListener('resize', this._resizeListener);
      this._resizeListener = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    this._input.detach();
    this._graph.dispose();
    this._container.innerHTML = '';
  }

  // ── Physics params helper ──────────────────────────────────────

  private _getPhysicsParams(): ProjectileParams {
    return {
      initialSpeed: this._params.speed.value,
      launchAngle: degToRad(this._params.angle.value),
      gravity: this._params.gravity.value,
      launchPosition: new Vector2(0, 0),
    };
  }

  // ── Animation loop ─────────────────────────────────────────────

  private _startLoop(): void {
    if (this._animFrameId !== 0) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = 0;
    }
    const loop = (timestamp: number) => {
      this.tick(timestamp);
      if (this._clock.running) {
        this._animFrameId = requestAnimationFrame(loop);
      } else {
        this._animFrameId = 0;
      }
    };
    this._animFrameId = requestAnimationFrame(loop);
  }

  // ── Rendering ──────────────────────────────────────────────────

  private _render(): void {
    const ctx = this._ctx;
    const w = this._canvas.width;
    const h = this._canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Compute display ranges based on current parameters
    const params = this._getPhysicsParams();
    const range = computeRange(params);
    const maxH = computeMaxHeight(params);
    const displayRange = Math.max(range * 1.15, 20);
    const displayHeight = Math.max(maxH * 1.3, 10);

    this._camera.fitWorld(displayRange, displayHeight, 70);

    // Grid spacing: pick nice round numbers
    const gridSpacing = this._niceGridSpacing(displayRange);

    // Draw layers
    drawGrid(ctx, this._camera, displayRange, displayHeight, gridSpacing);
    drawGround(ctx, this._camera, displayRange);

    // Trajectory
    if (this._trajectoryPoints.length > 1) {
      drawTrajectory(ctx, this._camera, this._trajectoryPoints, 'rgba(100, 181, 246, 0.6)', 2);
    }

    // Predicted trajectory (dotted, when paused and not started)
    if (!this._clock.running && this._clock.elapsed === 0) {
      const predicted: Vector2[] = [];
      const tof = computeTimeOfFlight(params);
      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const t = (tof * i) / steps;
        const state = computeProjectileState(params, t);
        predicted.push(state.position);
      }
      ctx.save();
      ctx.setLineDash([6, 4]);
      drawTrajectory(ctx, this._camera, predicted, 'rgba(100, 181, 246, 0.25)', 1.5);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Projectile
    drawCircle(ctx, this._camera, this._currentState.position, 8, '#64B5F6');
    // Glow
    drawCircle(ctx, this._camera, this._currentState.position, 12, 'rgba(100, 181, 246, 0.2)');

    const isPreLaunch = !this._clock.running && this._clock.elapsed === 0 && !this._currentState.landed;
    const velScale = 0.12;

    if (isPreLaunch) {
      // Pedagogical distinction: At rest before launch, display initial velocity vector v₀
      const v0 = new Vector2(
        params.initialSpeed * Math.cos(params.launchAngle),
        params.initialSpeed * Math.sin(params.launchAngle)
      );
      drawVectorArrow(ctx, this._camera, this._currentState.position, v0, '#66BB6A', {
        label: 'v₀',
        scale: velScale,
        lineWidth: 2.5,
      });

      // Component vectors for initial velocity
      const v0x = new Vector2(v0.x, 0);
      const v0y = new Vector2(0, v0.y);
      if (Math.abs(v0x.x) > 0.5) {
        drawVectorArrow(ctx, this._camera, this._currentState.position, v0x, 'rgba(255, 167, 38, 0.7)', {
          label: 'v₀ₓ',
          scale: velScale,
          lineWidth: 1.5,
        });
      }
      if (Math.abs(v0y.y) > 0.5) {
        drawVectorArrow(ctx, this._camera, this._currentState.position, v0y, 'rgba(239, 83, 80, 0.7)', {
          label: 'v₀ᵧ',
          scale: velScale,
          lineWidth: 1.5,
        });
      }
    } else if (this._currentState.velocity.magnitude() > 0.1) {
      // Current instantaneous velocity vector in flight
      drawVectorArrow(ctx, this._camera, this._currentState.position, this._currentState.velocity, '#66BB6A', {
        label: 'v',
        scale: velScale,
        lineWidth: 2.5,
      });

      // Component vectors
      const vx = new Vector2(this._currentState.velocity.x, 0);
      const vy = new Vector2(0, this._currentState.velocity.y);
      if (Math.abs(vx.x) > 0.5) {
        drawVectorArrow(ctx, this._camera, this._currentState.position, vx, 'rgba(255, 167, 38, 0.7)', {
          label: 'vₓ',
          scale: velScale,
          lineWidth: 1.5,
        });
      }
      if (Math.abs(vy.y) > 0.5) {
        drawVectorArrow(ctx, this._camera, this._currentState.position, vy, 'rgba(239, 83, 80, 0.7)', {
          label: 'vᵧ',
          scale: velScale,
          lineWidth: 1.5,
        });
      }
    }

    // Acceleration vector (always -g downward while in flight)
    if (!this._currentState.landed || this._clock.elapsed === 0) {
      const accel = new Vector2(0, -this._params.gravity.value);
      drawVectorArrow(ctx, this._camera, this._currentState.position, accel, 'rgba(186, 104, 200, 0.7)', {
        label: 'g',
        scale: 0.08,
        lineWidth: 1.5,
      });
    }

    // Range marker
    if (this._currentState.landed && range > 0) {
      const rangeScreen = this._camera.worldToScreen(new Vector2(range, 0));
      ctx.save();
      ctx.fillStyle = 'rgba(100, 181, 246, 0.7)';
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`R = ${range.toFixed(1)} m`, rangeScreen.x, rangeScreen.y - 8);
      ctx.restore();
    }

    // Max height marker
    if (maxH > 0 && (this._clock.running || this._currentState.landed)) {
      const maxHScreen = this._camera.worldToScreen(new Vector2(range / 2, maxH));
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this._camera.worldToScreen(new Vector2(0, maxH)).x, maxHScreen.y);
      ctx.lineTo(this._camera.worldToScreen(new Vector2(displayRange, maxH)).x, maxHScreen.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(239, 83, 80, 0.6)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`H = ${maxH.toFixed(1)} m`, maxHScreen.x + 8, maxHScreen.y - 4);
      ctx.restore();
    }
  }

  private _niceGridSpacing(range: number): number {
    const approx = range / 8;
    const magnitude = Math.pow(10, Math.floor(Math.log10(approx)));
    const normalized = approx / magnitude;
    if (normalized < 1.5) return magnitude;
    if (normalized < 3.5) return 2 * magnitude;
    if (normalized < 7.5) return 5 * magnitude;
    return 10 * magnitude;
  }

  // ── Input handling ─────────────────────────────────────────────

  private _handleInput(action: InputAction): void {
    switch (action) {
      case 'up':
        this._focusedControl = (this._focusedControl - 1 + this._totalControls) % this._totalControls;
        this._updateFocus();
        break;
      case 'down':
        this._focusedControl = (this._focusedControl + 1) % this._totalControls;
        this._updateFocus();
        break;
      case 'left':
        this._adjustParam(-1);
        break;
      case 'right':
        this._adjustParam(1);
        break;
      case 'select':
        this._activateControl();
        break;
      case 'space':
        // Toggle play/pause
        if (this._clock.running) {
          this.pause();
        } else {
          this.start();
        }
        break;
      case 'back':
        // Could be handled by parent navigation
        break;
    }
  }

  private _adjustParam(direction: number): void {
    const paramIndex = this._focusedControl;
    if (paramIndex < 0 || paramIndex >= PARAM_KEYS.length) return;
    // Only allow adjustment when simulation is not running
    if (this._clock.running) return;

    const key = PARAM_KEYS[paramIndex]!;
    const param = this._params[key];
    const newValue = Math.round(
      (param.value + direction * param.step) * 1000
    ) / 1000;
    param.value = Math.max(param.min, Math.min(param.max, newValue));

    // Auto-reset when params change
    if (this._clock.elapsed > 0) {
      this.reset();
    }

    this._updateParamDisplay();
    this._updateMeasurements();
    this._render();
  }

  private _activateControl(): void {
    switch (this._focusedControl) {
      case 3: // Start
        this.start();
        break;
      case 4: // Pause
        this.pause();
        break;
      case 5: // Reset
        this.reset();
        break;
    }
  }

  // ── DOM Building ───────────────────────────────────────────────

  private _buildHeader(): void {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 24px; background: rgba(22, 27, 34, 0.95);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    `;

    const title = document.createElement('h1');
    title.textContent = 'Projectile Motion';
    title.style.cssText = `
      margin: 0; font-size: 22px; font-weight: 600;
      color: #e6edf3; letter-spacing: 0.5px;
    `;

    const badge = document.createElement('span');
    badge.textContent = 'Grade 11 • Mechanics • Kinematics';
    badge.style.cssText = `
      font-size: 13px; color: rgba(255,255,255,0.4);
      padding: 4px 12px; border-radius: 12px;
      background: rgba(255,255,255,0.05);
    `;

    header.appendChild(title);
    header.appendChild(badge);
    this._container.appendChild(header);
  }

  private _buildMainArea(): void {
    const main = document.createElement('div');
    main.style.cssText = `
      display: flex; flex: 1; min-height: 0; overflow: hidden;
    `;

    // Canvas area
    const canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = `
      flex: 1; position: relative; min-width: 0;
    `;
    this._canvas = document.createElement('canvas');
    this._canvas.style.cssText = `
      width: 100%; height: 100%; display: block;
    `;
    canvasWrap.appendChild(this._canvas);
    main.appendChild(canvasWrap);

    // Right panel: controls + graph
    const rightPanel = document.createElement('div');
    rightPanel.style.cssText = `
      width: 340px; flex-shrink: 0; display: flex; flex-direction: column;
      background: rgba(22, 27, 34, 0.6); border-left: 1px solid rgba(255,255,255,0.06);
      overflow-y: auto; padding: 16px;
      gap: 12px;
    `;

    this._uiPanel = document.createElement('div');
    this._uiPanel.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
    rightPanel.appendChild(this._uiPanel);

    this._buildParamControls();
    this._buildActionButtons();

    // Measurements
    const measTitle = document.createElement('div');
    measTitle.textContent = 'Measurements';
    measTitle.style.cssText = `
      font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5);
      text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;
    `;
    rightPanel.appendChild(measTitle);

    this._measurePanel = document.createElement('div');
    this._measurePanel.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';
    rightPanel.appendChild(this._measurePanel);
    this._updateMeasurements();

    // Graph
    const graphTitle = document.createElement('div');
    graphTitle.textContent = 'Height & Vertical Velocity';
    graphTitle.style.cssText = `
      font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5);
      text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;
    `;
    rightPanel.appendChild(graphTitle);

    const graphContainer = document.createElement('div');
    rightPanel.appendChild(graphContainer);
    this._graph = new Graph(graphContainer, 308, 150, 'Time (s)', '');
    this._graphYSeries = this._graph.addSeries('y (m)', '#64B5F6');
    this._graphVySeries = this._graph.addSeries('vy (m/s)', '#EF5350');

    main.appendChild(rightPanel);
    this._container.appendChild(main);

    // Size canvas after layout
    requestAnimationFrame(() => this._resizeCanvas());
    this._resizeListener = () => this._resizeCanvas();
    window.addEventListener('resize', this._resizeListener);

    if (typeof ResizeObserver !== 'undefined' && this._canvas.parentElement) {
      this._resizeObserver = new ResizeObserver(() => {
        this._resizeCanvas();
      });
      this._resizeObserver.observe(this._canvas.parentElement);
    }
  }

  private _resizeCanvas(): void {
    if (!this._canvas || !this._canvas.parentElement) return;
    const rect = this._canvas.parentElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      // Container layout not ready yet, retry on next frame
      requestAnimationFrame(() => this._resizeCanvas());
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    this._canvas.width = rect.width * dpr;
    this._canvas.height = rect.height * dpr;
    const ctx = this._canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    ctx.scale(dpr, dpr);
    this._ctx = ctx;
    this._camera = new Camera2D(rect.width, rect.height);
    this._render();
  }

  private _buildParamControls(): void {
    const title = document.createElement('div');
    title.textContent = 'Parameters';
    title.style.cssText = `
      font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5);
      text-transform: uppercase; letter-spacing: 1px;
    `;
    this._uiPanel.appendChild(title);

    for (let i = 0; i < PARAM_KEYS.length; i++) {
      const key = PARAM_KEYS[i]!;
      const param = this._params[key];
      const el = this._createParamControl(param, i);
      this._controlElements.push(el);
      this._uiPanel.appendChild(el);
    }
  }

  private _createParamControl(param: Parameter, index: number): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; border-radius: 8px;
      background: rgba(255,255,255,0.03);
      border: 2px solid transparent;
      transition: border-color 0.15s, background-color 0.15s;
      cursor: pointer; user-select: none;
      -webkit-tap-highlight-color: transparent;
    `;
    wrapper.tabIndex = 0;

    // Tap on the row itself focuses this parameter
    wrapper.addEventListener('click', (e) => {
      // Don't steal focus if an arrow was tapped (it bubbles)
      if ((e.target as HTMLElement).dataset['arrow']) return;
      this._focusedControl = index;
      this._updateFocus();
    });

    const labelEl = document.createElement('span');
    labelEl.textContent = param.label;
    labelEl.style.cssText = 'font-size: 14px; color: rgba(255,255,255,0.8);';

    const valueArea = document.createElement('div');
    valueArea.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    const leftArrow = document.createElement('span');
    leftArrow.textContent = '◀';
    leftArrow.dataset['arrow'] = 'left';
    leftArrow.style.cssText = `
      font-size: 18px; color: rgba(100, 181, 246, 0.7);
      padding: 6px 10px; border-radius: 6px;
      background: rgba(255,255,255,0.06);
      cursor: pointer; -webkit-tap-highlight-color: transparent;
      transition: background 0.15s;
    `;
    leftArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      this._focusedControl = index;
      this._updateFocus();
      this._adjustParam(-1);
    });

    const valueEl = document.createElement('span');
    valueEl.className = 'param-value';
    valueEl.style.cssText = `
      font-size: 16px; font-weight: 600; color: #64B5F6;
      min-width: 72px; text-align: center;
      font-variant-numeric: tabular-nums;
    `;

    const rightArrow = document.createElement('span');
    rightArrow.textContent = '▶';
    rightArrow.dataset['arrow'] = 'right';
    rightArrow.style.cssText = `
      font-size: 18px; color: rgba(100, 181, 246, 0.7);
      padding: 6px 10px; border-radius: 6px;
      background: rgba(255,255,255,0.06);
      cursor: pointer; -webkit-tap-highlight-color: transparent;
      transition: background 0.15s;
    `;
    rightArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      this._focusedControl = index;
      this._updateFocus();
      this._adjustParam(1);
    });

    valueArea.appendChild(leftArrow);
    valueArea.appendChild(valueEl);
    valueArea.appendChild(rightArrow);
    wrapper.appendChild(labelEl);
    wrapper.appendChild(valueArea);

    return wrapper;
  }

  private _buildActionButtons(): void {
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 8px; margin-top: 4px;';

    const buttons = [
      { label: '▶ Start', id: 'start' },
      { label: '⏸ Pause', id: 'pause' },
      { label: '↺ Reset', id: 'reset' },
    ];

    for (const btn of buttons) {
      const el = document.createElement('button');
      el.textContent = btn.label;
      el.dataset['action'] = btn.id;
      el.style.cssText = `
        flex: 1; padding: 10px 0; border: 2px solid transparent;
        border-radius: 8px; background: rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500;
        cursor: pointer; transition: all 0.15s;
        font-family: inherit;
      `;
      el.tabIndex = 0;
      el.addEventListener('click', () => {
        switch (btn.id) {
          case 'start': this.start(); break;
          case 'pause': this.pause(); break;
          case 'reset': this.reset(); break;
        }
      });
      this._controlElements.push(el);
      btnRow.appendChild(el);
    }

    this._uiPanel.appendChild(btnRow);
  }

  private _buildBottomPanel(): void {
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex; align-items: center; justify-content: center;
      padding: 8px 24px; background: rgba(22, 27, 34, 0.95);
      border-top: 1px solid rgba(255,255,255,0.06);
      gap: 24px; flex-shrink: 0;
    `;

    const hints = [
      '↑↓  Navigate',
      '←→  Adjust Value',
      'Enter  Select',
      'Space  Play/Pause',
    ];

    for (const hint of hints) {
      const el = document.createElement('span');
      el.textContent = hint;
      el.style.cssText = 'font-size: 12px; color: rgba(255,255,255,0.3);';
      footer.appendChild(el);
    }

    this._container.appendChild(footer);
  }

  // ── UI Updates ─────────────────────────────────────────────────

  private _updateParamDisplay(): void {
    for (let i = 0; i < PARAM_KEYS.length; i++) {
      const key = PARAM_KEYS[i]!;
      const param = this._params[key];
      const el = this._controlElements[i];
      if (!el) continue;
      const valueEl = el.querySelector('.param-value') as HTMLElement | null;
      if (valueEl) {
        const decimals = param.step < 1 ? 2 : 0;
        valueEl.textContent = `${param.value.toFixed(decimals)} ${param.unit}`;
      }
    }
  }

  private _updateFocus(): void {
    for (let i = 0; i < this._controlElements.length; i++) {
      const el = this._controlElements[i]!;
      const isFocused = i === this._focusedControl;
      el.style.borderColor = isFocused ? '#64B5F6' : 'transparent';
      el.style.backgroundColor = isFocused
        ? 'rgba(100, 181, 246, 0.08)'
        : 'rgba(255,255,255,0.03)';
      if (isFocused) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  private _updateMeasurements(): void {
    const params = this._getPhysicsParams();
    const tof = computeTimeOfFlight(params);
    const range = computeRange(params);
    const maxH = computeMaxHeight(params);
    const v0x = params.initialSpeed * Math.cos(params.launchAngle);
    const v0y = params.initialSpeed * Math.sin(params.launchAngle);

    const isPreLaunch = this._clock.elapsed === 0 && !this._currentState.landed;
    const isLanded = this._currentState.landed;

    const currentSpeed = isPreLaunch || isLanded ? 0 : this._currentState.velocity.magnitude();
    const currentVx = isPreLaunch || isLanded ? 0 : this._currentState.velocity.x;
    const currentVy = isPreLaunch || isLanded ? 0 : this._currentState.velocity.y;

    const measurements = [
      { label: 'Time (t)', value: `${this._clock.elapsed.toFixed(2)} s` },
      { label: 'Position (x, y)', value: `(${this._currentState.position.x.toFixed(1)}, ${this._currentState.position.y.toFixed(1)}) m` },
      { label: '─', value: '' },
      { label: 'Current Speed (v)', value: `${currentSpeed.toFixed(1)} m/s` },
      { label: 'Current vₓ', value: `${currentVx.toFixed(1)} m/s` },
      { label: 'Current vᵧ', value: `${currentVy.toFixed(1)} m/s` },
      { label: '─', value: '' },
      { label: 'Initial Speed (v₀)', value: `${params.initialSpeed.toFixed(1)} m/s` },
      { label: 'Initial v₀ₓ', value: `${v0x.toFixed(1)} m/s` },
      { label: 'Initial v₀ᵧ', value: `${v0y.toFixed(1)} m/s` },
      { label: 'Launch Angle (θ)', value: `${radToDeg(params.launchAngle).toFixed(0)}°` },
      { label: '─', value: '' },
      { label: 'Range (R)', value: `${range.toFixed(2)} m` },
      { label: 'Max Height (H)', value: `${maxH.toFixed(2)} m` },
      { label: 'Time of Flight (T)', value: `${tof.toFixed(2)} s` },
    ];

    this._measurePanel.innerHTML = '';
    for (const m of measurements) {
      if (m.label === '─') {
        const hr = document.createElement('hr');
        hr.style.cssText = 'border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 4px 0;';
        this._measurePanel.appendChild(hr);
        continue;
      }
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex; justify-content: space-between;
        font-size: 13px; padding: 3px 0;
      `;
      const lbl = document.createElement('span');
      lbl.textContent = m.label;
      lbl.style.color = 'rgba(255,255,255,0.5)';
      const val = document.createElement('span');
      val.textContent = m.value;
      val.style.cssText = 'color: #e6edf3; font-variant-numeric: tabular-nums; font-weight: 500;';
      row.appendChild(lbl);
      row.appendChild(val);
      this._measurePanel.appendChild(row);
    }
  }

  private _updateButtonStates(): void {
    for (let i = PARAM_KEYS.length; i < this._controlElements.length; i++) {
      const el = this._controlElements[i] as HTMLButtonElement | undefined;
      if (!el) continue;
      const action = el.dataset['action'];
      if (action === 'start') {
        el.style.opacity = this._clock.running || this._currentState.landed ? '0.4' : '1';
      } else if (action === 'pause') {
        el.style.opacity = this._clock.running ? '1' : '0.4';
      }
    }
  }
}
