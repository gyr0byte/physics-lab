import { Vector2 } from '../../core/Vector2';
import { SimulationClock } from '../../core/SimulationClock';
import { Camera2D } from '../../core/Camera2D';
import { InputManager, type InputAction } from '../../core/InputManager';
import type { Simulation, SimulationMetadata } from '../../core/Simulation';
import {
  type NewtonsSecondLawParams,
  type NewtonsSecondLawState,
  DEFAULT_NEWTON_PARAMS,
  createInitialNewtonsSecondLawState,
  stepNewtonsSecondLaw,
} from '../../physics/NewtonsSecondLawPhysics';
import {
  drawVectorArrow,
  drawTrack,
  drawBlock,
} from '../../rendering/CanvasRenderer';
import { Graph } from '../../components/Graph';

interface Parameter {
  key: keyof NewtonsSecondLawParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  format: (v: number) => string;
}

const PARAMETERS: Parameter[] = [
  {
    key: 'appliedForce',
    label: 'Applied Force (F)',
    min: -50,
    max: 50,
    step: 5,
    unit: 'N',
    format: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} N`,
  },
  {
    key: 'mass',
    label: 'Mass (m)',
    min: 1.0,
    max: 20.0,
    step: 1.0,
    unit: 'kg',
    format: (v) => `${v.toFixed(1)} kg`,
  },
  {
    key: 'frictionCoefficient',
    label: 'Friction Coeff (μ)',
    min: 0.0,
    max: 0.5,
    step: 0.05,
    unit: '',
    format: (v) => (v === 0 ? '0.00 (Frictionless)' : v.toFixed(2)),
  },
];

export class NewtonsSecondLawSimulation implements Simulation {
  readonly metadata: SimulationMetadata = {
    id: 'newtons-second-law',
    title: "Newton's Second Law of Motion",
    grade: 11,
    area: 'Mechanics',
    chapter: "Newton's Laws of Motion",
    description: "Investigate F_net = m * a with adjustable mass, applied force, and friction.",
  };

  private _container!: HTMLElement;
  private _canvas!: HTMLCanvasElement;
  private _ctx!: CanvasRenderingContext2D;

  private _clock = new SimulationClock();
  private _camera = new Camera2D(100, 100);
  private _input = new InputManager();

  private _params: NewtonsSecondLawParams = { ...DEFAULT_NEWTON_PARAMS };
  private _currentState: NewtonsSecondLawState = createInitialNewtonsSecondLawState(this._params);

  private _graph: Graph | null = null;
  private _vSeriesIndex: number = -1;
  private _aSeriesIndex: number = -1;

  private _running = false;
  private _focusedControl = 0;
  private _controlElements: HTMLElement[] = [];
  private _measurePanel!: HTMLElement;
  private _statusPill!: HTMLElement;

  private _rafId: number = 0;
  private _boundTick = this.tick.bind(this);
  private _resizeObserver: ResizeObserver | null = null;
  private _resizeListener: (() => void) | null = null;

  initialize(container: HTMLElement): void {
    this._container = container;
    this._container.innerHTML = '';

    const root = document.createElement('div');
    root.id = 'newton-sim-root';
    root.style.cssText = `
      position: fixed; inset: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; overflow: hidden;
      background: #0d1117; color: #e6edf3;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    // ── Header ─────────────────────────────────────────────
    const header = document.createElement('header');
    header.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 24px; background: rgba(22, 27, 34, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0; z-index: 10;
    `;
    const titleArea = document.createElement('div');
    titleArea.innerHTML = `
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64B5F6; font-weight: 600;">
        Grade 11 • Mechanics • Newton's Laws
      </div>
      <div style="font-size: 18px; font-weight: 700; color: #ffffff;">
        Newton's Second Law — F<sub>net</sub> = m · a
      </div>
    `;

    this._statusPill = document.createElement('div');
    this._statusPill.style.cssText = `
      font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 12px;
      background: rgba(33, 150, 243, 0.15); color: #64B5F6; border: 1px solid rgba(33, 150, 243, 0.3);
    `;
    this._statusPill.textContent = 'Ready';

    header.appendChild(titleArea);
    header.appendChild(this._statusPill);
    root.appendChild(header);

    // ── Main Body ──────────────────────────────────────────
    const body = document.createElement('div');
    body.style.cssText = `
      flex: 1; display: flex; overflow: hidden; min-height: 0; position: relative;
    `;

    // Left Panel: Controls
    const leftPanel = this._createLeftPanel();
    body.appendChild(leftPanel);

    // Center: Canvas Viewport
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'newton-canvas-container';
    canvasContainer.style.cssText = `
      flex: 1; position: relative; overflow: hidden; background: #0a0e14;
    `;
    this._canvas = document.createElement('canvas');
    this._canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    canvasContainer.appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d')!;
    body.appendChild(canvasContainer);

    // Right Panel: Measurements & Graph
    const rightPanel = this._createRightPanel();
    body.appendChild(rightPanel);

    root.appendChild(body);
    this._container.appendChild(root);

    // Input & D-pad bindings
    this._input.attach();
    this._input.onInput((action) => this._handleInput(action));

    // Size canvas and setup observation
    requestAnimationFrame(() => this._resizeCanvas());
    this._resizeListener = () => this._resizeCanvas();
    window.addEventListener('resize', this._resizeListener);

    if (typeof ResizeObserver !== 'undefined' && this._canvas.parentElement) {
      this._resizeObserver = new ResizeObserver(() => this._resizeCanvas());
      this._resizeObserver.observe(this._canvas.parentElement);
    }

    this._updateFocus();
    this._updateMeasurementPanel();
    this._rafId = requestAnimationFrame(this._boundTick);
  }

  private _createLeftPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      width: 310px; flex-shrink: 0; background: rgba(22, 27, 34, 0.85);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      display: flex; flex-direction: column; overflow-y: auto; padding: 10px 14px;
      gap: 6px; -webkit-overflow-scrolling: touch;
    `;

    const sectionTitle = document.createElement('div');
    sectionTitle.textContent = 'PARAMETERS';
    sectionTitle.style.cssText = `
      font-size: 11px; font-weight: 700; letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.4); margin-bottom: 1px;
    `;
    panel.appendChild(sectionTitle);

    this._controlElements = [];

    // Parameter controls
    PARAMETERS.forEach((param, index) => {
      const el = this._createParamControl(param, index);
      this._controlElements.push(el);
      panel.appendChild(el);
    });

    // Quick presets
    const presetLabel = document.createElement('div');
    presetLabel.textContent = 'QUICK EXPERIMENTS';
    presetLabel.style.cssText = `
      font-size: 11px; font-weight: 700; letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.4); margin-top: 6px;
    `;
    panel.appendChild(presetLabel);

    const presetRow = document.createElement('div');
    presetRow.style.cssText = 'display: flex; gap: 8px;';

    const btnFrictionless = document.createElement('button');
    btnFrictionless.textContent = 'Frictionless (μ=0)';
    btnFrictionless.style.cssText = `
      flex: 1; padding: 8px; border-radius: 8px; border: 1px solid rgba(100, 181, 246, 0.4);
      background: rgba(100, 181, 246, 0.1); color: #90caf9; font-size: 12px; font-weight: 600;
      cursor: pointer; -webkit-tap-highlight-color: transparent;
    `;
    btnFrictionless.addEventListener('click', () => {
      this._params.frictionCoefficient = 0;
      this._updateParamDisplays();
      this._resetPhysics();
    });
    presetRow.appendChild(btnFrictionless);

    const btnHighMass = document.createElement('button');
    btnHighMass.textContent = 'Double Mass (2m)';
    btnHighMass.style.cssText = `
      flex: 1; padding: 8px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05); color: #ffffff; font-size: 12px; font-weight: 600;
      cursor: pointer; -webkit-tap-highlight-color: transparent;
    `;
    btnHighMass.addEventListener('click', () => {
      this._params.mass = Math.min(20, this._params.mass * 2);
      this._updateParamDisplays();
      this._resetPhysics();
    });
    presetRow.appendChild(btnHighMass);
    panel.appendChild(presetRow);

    // Action buttons (Start / Pause, Reset)
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

    const startBtn = document.createElement('button');
    startBtn.id = 'newton-start-btn';
    startBtn.textContent = 'Start';
    startBtn.style.cssText = `
      flex: 1; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;
      background: #238636; color: #fff; border: 2px solid transparent; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    `;
    startBtn.tabIndex = 0;
    startBtn.addEventListener('click', () => {
      if (this._running) this.pause();
      else this.start();
    });

    const resetBtn = document.createElement('button');
    resetBtn.id = 'newton-reset-btn';
    resetBtn.textContent = 'Reset';
    resetBtn.style.cssText = `
      flex: 1; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;
      background: rgba(255, 255, 255, 0.08); color: #fff; border: 2px solid transparent; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    `;
    resetBtn.tabIndex = 0;
    resetBtn.addEventListener('click', () => this.reset());

    btnRow.appendChild(startBtn);
    btnRow.appendChild(resetBtn);
    panel.appendChild(btnRow);

    this._controlElements.push(startBtn);
    this._controlElements.push(resetBtn);

    return panel;
  }

  private _createRightPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      width: 330px; flex-shrink: 0; background: rgba(22, 27, 34, 0.85);
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      display: flex; flex-direction: column; overflow-y: auto; padding: 10px 14px;
      gap: 6px; -webkit-overflow-scrolling: touch;
    `;

    const sectionTitle = document.createElement('div');
    sectionTitle.textContent = 'LIVE MEASUREMENTS';
    sectionTitle.style.cssText = `
      font-size: 11px; font-weight: 700; letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.4);
    `;
    panel.appendChild(sectionTitle);

    this._measurePanel = document.createElement('div');
    this._measurePanel.style.cssText = 'display: flex; flex-direction: column; gap: 3px;';
    panel.appendChild(this._measurePanel);

    // Real-Time Graph Section
    const graphTitle = document.createElement('div');
    graphTitle.textContent = 'REAL-TIME KINEMATICS GRAPH';
    graphTitle.style.cssText = `
      font-size: 11px; font-weight: 700; letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.4); margin-top: 4px;
    `;
    panel.appendChild(graphTitle);

    const graphContainer = document.createElement('div');
    graphContainer.style.cssText = 'width: 100%; display: flex; justify-content: center;';
    this._graph = new Graph(graphContainer, 302, 130, 'Time (s)', 'Kinematics');
    this._vSeriesIndex = this._graph.addSeries('Velocity v (m/s)', '#29B6F6');
    this._aSeriesIndex = this._graph.addSeries('Accel a (m/s²)', '#66BB6A');
    panel.appendChild(graphContainer);

    return panel;
  }

  private _createParamControl(param: Parameter, index: number): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 10px; background: rgba(255,255,255,0.04);
      border-radius: 8px; border: 2px solid transparent;
      cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent;
      transition: border-color 0.15s, background-color 0.15s;
    `;
    wrapper.tabIndex = 0;

    wrapper.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).dataset['arrow']) return;
      this._focusedControl = index;
      this._updateFocus();
    });

    const labelEl = document.createElement('span');
    labelEl.textContent = param.label;
    labelEl.style.cssText = 'font-size: 12px; color: rgba(255,255,255,0.85); font-weight: 500;';

    const valueArea = document.createElement('div');
    valueArea.style.cssText = 'display: flex; align-items: center; gap: 4px;';

    const leftArrow = document.createElement('span');
    leftArrow.textContent = '◀';
    leftArrow.dataset['arrow'] = 'left';
    leftArrow.style.cssText = `
      font-size: 14px; color: rgba(100, 181, 246, 0.85);
      padding: 4px 8px; border-radius: 6px; background: rgba(255,255,255,0.06);
      cursor: pointer; -webkit-tap-highlight-color: transparent;
    `;
    leftArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      this._focusedControl = index;
      this._updateFocus();
      this._adjustParam(-1);
    });

    const valueEl = document.createElement('span');
    valueEl.className = 'param-value';
    valueEl.textContent = param.format(this._params[param.key] as number);
    valueEl.style.cssText = `
      font-size: 12px; font-weight: 600; color: #fff; min-width: 85px;
      text-align: center; font-variant-numeric: tabular-nums;
    `;

    const rightArrow = document.createElement('span');
    rightArrow.textContent = '▶';
    rightArrow.dataset['arrow'] = 'right';
    rightArrow.style.cssText = `
      font-size: 14px; color: rgba(100, 181, 246, 0.85);
      padding: 4px 8px; border-radius: 6px; background: rgba(255,255,255,0.06);
      cursor: pointer; -webkit-tap-highlight-color: transparent;
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

  private _adjustParam(direction: number): void {
    if (this._focusedControl < 0 || this._focusedControl >= PARAMETERS.length) return;
    const param = PARAMETERS[this._focusedControl]!;
    const curVal = this._params[param.key] as number;
    let nextVal = curVal + direction * param.step;
    nextVal = Math.max(param.min, Math.min(param.max, nextVal));

    // Floating-point precision rounding
    if (param.step < 1) {
      nextVal = Math.round(nextVal * 100) / 100;
    }

    (this._params as unknown as Record<string, number>)[param.key] = nextVal;
    this._updateParamDisplays();
    this._resetPhysics();
  }

  private _updateParamDisplays(): void {
    PARAMETERS.forEach((param, index) => {
      const el = this._controlElements[index];
      if (!el) return;
      const valEl = el.querySelector('.param-value');
      if (valEl) {
        valEl.textContent = param.format(this._params[param.key] as number);
      }
    });
  }

  private _updateFocus(): void {
    this._controlElements.forEach((el, index) => {
      if (index === this._focusedControl) {
        el.style.borderColor = '#2196F3';
        el.style.backgroundColor = 'rgba(33, 150, 243, 0.12)';
        el.focus();
      } else {
        el.style.borderColor = 'transparent';
        el.style.backgroundColor =
          index < PARAMETERS.length ? 'rgba(255,255,255,0.04)' : '';
      }
    });
  }

  private _handleInput(action: InputAction): void {
    switch (action) {
      case 'up':
        this._focusedControl =
          (this._focusedControl - 1 + this._controlElements.length) %
          this._controlElements.length;
        this._updateFocus();
        break;
      case 'down':
        this._focusedControl =
          (this._focusedControl + 1) % this._controlElements.length;
        this._updateFocus();
        break;
      case 'left':
        this._adjustParam(-1);
        break;
      case 'right':
        this._adjustParam(1);
        break;
      case 'select':
        if (this._focusedControl === PARAMETERS.length) {
          // Start / Pause button
          if (this._running) this.pause();
          else this.start();
        } else if (this._focusedControl === PARAMETERS.length + 1) {
          // Reset button
          this.reset();
        }
        break;
      case 'space':
        if (this._running) this.pause();
        else this.start();
        break;
      case 'back':
        // Host handle
        break;
    }
  }

  private _resizeCanvas(): void {
    if (!this._canvas || !this._canvas.parentElement) return;
    const rect = this._canvas.parentElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      requestAnimationFrame(() => this._resizeCanvas());
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    this._canvas.width = rect.width * dpr;
    this._canvas.height = rect.height * dpr;
    this._ctx.scale(dpr, dpr);

    // Track width: 30 meters visible on screen
    const visibleWidthMeters = 30;
    const scale = rect.width / visibleWidthMeters;
    this._camera = new Camera2D(rect.width, rect.height);
    this._camera.setScale(scale);
    this._camera.setOrigin(rect.width * 0.35, rect.height * 0.65);
  }

  start(): void {
    this._running = true;
    this._clock.start();
    const startBtn = document.getElementById('newton-start-btn');
    if (startBtn) {
      startBtn.textContent = 'Pause';
      startBtn.style.backgroundColor = '#d29922';
    }
    this._statusPill.textContent = 'Running';
    this._statusPill.style.color = '#66BB6A';
    this._statusPill.style.borderColor = 'rgba(102, 187, 106, 0.4)';
  }

  pause(): void {
    this._running = false;
    this._clock.pause();
    const startBtn = document.getElementById('newton-start-btn');
    if (startBtn) {
      startBtn.textContent = 'Resume';
      startBtn.style.backgroundColor = '#238636';
    }
    this._statusPill.textContent = 'Paused';
    this._statusPill.style.color = '#FFA726';
    this._statusPill.style.borderColor = 'rgba(255, 167, 38, 0.4)';
  }

  reset(): void {
    this.pause();
    this._clock.reset();
    this._currentState = createInitialNewtonsSecondLawState(this._params);
    if (this._graph) this._graph.clear();

    const startBtn = document.getElementById('newton-start-btn');
    if (startBtn) {
      startBtn.textContent = 'Start';
      startBtn.style.backgroundColor = '#238636';
    }
    this._statusPill.textContent = 'Ready';
    this._statusPill.style.color = '#64B5F6';
    this._statusPill.style.borderColor = 'rgba(33, 150, 243, 0.3)';

    this._updateMeasurementPanel();
  }

  private _resetPhysics(): void {
    if (!this._running) {
      this._currentState = createInitialNewtonsSecondLawState(this._params);
      this._updateMeasurementPanel();
    }
  }

  tick(timestamp: number): void {
    if (this._running) {
      const fixedSteps = this._clock.tick(timestamp);
      for (let i = 0; i < fixedSteps; i++) {
        this._currentState = stepNewtonsSecondLaw(
          this._currentState,
          this._params,
          this._clock.fixedDt
        );

        if (this._graph && this._clock.elapsed % 0.05 < this._clock.fixedDt) {
          this._graph.pushData(
            this._vSeriesIndex,
            this._clock.elapsed,
            this._currentState.velocity
          );
          this._graph.pushData(
            this._aSeriesIndex,
            this._clock.elapsed,
            this._currentState.acceleration
          );
        }
      }
      this._updateMeasurementPanel();
    }

    this._render();
    this._rafId = requestAnimationFrame(this._boundTick);
  }

  private _render(): void {
    const ctx = this._ctx;
    const w = this._canvas.width / (window.devicePixelRatio || 1);
    const h = this._canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, w, h);

    // Keep camera focused smoothly on the block as it travels along the track
    const blockX = this._currentState.position;
    const originX = w * 0.35 - blockX * this._camera.scale;
    const originY = h * 0.65;
    this._camera.setOrigin(originX, originY);

    // Draw track spanning around the block
    const trackSpan = 80;
    const xMin = Math.floor((blockX - trackSpan) / 10) * 10;
    const xMax = Math.ceil((blockX + trackSpan) / 10) * 10;
    drawTrack(ctx, this._camera, xMin, xMax, 5);

    // Block dimensions (world meters)
    const blockWidth = 2.4;
    const blockHeight = 1.6;
    const blockBottom = new Vector2(blockX, 0);

    // Draw mass block
    drawBlock(ctx, this._camera, blockBottom, blockWidth, blockHeight, {
      fillColor: '#1976D2',
      strokeColor: '#64B5F6',
      label: `m = ${this._params.mass.toFixed(1)} kg`,
      labelColor: '#ffffff',
    });

    // ── Vectors ───────────────────────────────────────────
    const forceScale = 0.08; // 0.08 meters per Newton

    // 1. Applied Force (Blue/Cyan arrow originating from block side)
    if (Math.abs(this._params.appliedForce) > 0.01) {
      const fAppVec = new Vector2(this._params.appliedForce, 0);
      const appPos = new Vector2(
        blockX + (this._params.appliedForce >= 0 ? blockWidth / 2 : -blockWidth / 2),
        blockHeight * 0.5
      );
      drawVectorArrow(ctx, this._camera, appPos, fAppVec, '#42A5F5', {
        label: `F_app = ${this._params.appliedForce.toFixed(1)} N`,
        scale: forceScale,
        lineWidth: 3,
      });
    }

    // 2. Friction Force (Red arrow at contact surface)
    if (Math.abs(this._currentState.frictionForce) > 0.01) {
      const fFricVec = new Vector2(this._currentState.frictionForce, 0);
      const contactPos = new Vector2(
        blockX + (this._currentState.frictionForce >= 0 ? blockWidth / 2 : -blockWidth / 2),
        0.05
      );
      drawVectorArrow(ctx, this._camera, contactPos, fFricVec, '#EF5350', {
        label: `f = ${Math.abs(this._currentState.frictionForce).toFixed(1)} N`,
        scale: forceScale,
        lineWidth: 2.5,
      });
    }

    // 3. Net Force (Gold/Amber arrow above block)
    if (Math.abs(this._currentState.netForce) > 0.01) {
      const fNetVec = new Vector2(this._currentState.netForce, 0);
      const netPos = new Vector2(blockX, blockHeight + 0.6);
      drawVectorArrow(ctx, this._camera, netPos, fNetVec, '#FFCA28', {
        label: `F_net = ${this._currentState.netForce.toFixed(1)} N`,
        scale: forceScale,
        lineWidth: 3.5,
      });
    }

    // 4. Acceleration Vector (Green arrow above Net Force)
    if (Math.abs(this._currentState.acceleration) > 0.05) {
      const aVec = new Vector2(this._currentState.acceleration, 0);
      const aPos = new Vector2(blockX, blockHeight + 1.4);
      drawVectorArrow(ctx, this._camera, aPos, aVec, '#66BB6A', {
        label: `a = ${this._currentState.acceleration.toFixed(2)} m/s²`,
        scale: 0.35,
        lineWidth: 2.5,
      });
    }

    // 5. Velocity Vector (Cyan arrow)
    if (Math.abs(this._currentState.velocity) > 0.1) {
      const vVec = new Vector2(this._currentState.velocity, 0);
      const vPos = new Vector2(
        blockX + (this._currentState.velocity >= 0 ? blockWidth / 2 + 0.2 : -blockWidth / 2 - 0.2),
        blockHeight * 0.75
      );
      drawVectorArrow(ctx, this._camera, vPos, vVec, '#26C6DA', {
        label: `v = ${this._currentState.velocity.toFixed(2)} m/s`,
        scale: 0.25,
        lineWidth: 2.5,
      });
    }

    // Render Real-time Graph
    if (this._graph) {
      this._graph.render();
    }
  }

  private _updateMeasurementPanel(): void {
    if (!this._measurePanel) return;

    const s = this._currentState;
    const p = this._params;
    const fNet = s.netForce;
    const ma = p.mass * s.acceleration;

    const measurements = [
      { label: 'Time (t)', value: `${this._clock.elapsed.toFixed(2)} s` },
      { label: 'Position (x)', value: `${s.position.toFixed(2)} m` },
      { label: 'Velocity (v)', value: `${s.velocity.toFixed(2)} m/s` },
      { label: 'Acceleration (a)', value: `${s.acceleration.toFixed(2)} m/s²` },
      { label: '─', value: '' },
      { label: 'Mass (m)', value: `${p.mass.toFixed(1)} kg` },
      { label: 'Applied Force (F)', value: `${p.appliedForce.toFixed(1)} N` },
      { label: 'Friction Force (f)', value: `${s.frictionForce.toFixed(1)} N` },
      { label: 'Net Force (F_net)', value: `${fNet.toFixed(1)} N` },
      { label: 'Static Threshold', value: `${s.maxStaticFriction.toFixed(1)} N` },
      { label: '─', value: '' },
      {
        label: 'F_net = m · a Check',
        value: `${fNet.toFixed(1)} N = ${(ma).toFixed(1)} N ${Math.abs(fNet - ma) < 0.05 ? '✓' : ''}`,
      },
      {
        label: 'Motion State',
        value: s.isStatic
          ? 'Static (Held by Friction)'
          : Math.abs(s.velocity) > 0.01
          ? s.acceleration !== 0
            ? 'Accelerating'
            : 'Constant Velocity (1st Law)'
          : 'About to Move',
      },
    ];

    this._measurePanel.innerHTML = '';
    for (const m of measurements) {
      if (m.label === '─') {
        const divider = document.createElement('hr');
        divider.style.cssText =
          'border: none; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 3px 0;';
        this._measurePanel.appendChild(divider);
        continue;
      }

      const row = document.createElement('div');
      row.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        padding: 3px 4px; font-size: 12px;
      `;
      const label = document.createElement('span');
      label.textContent = m.label;
      label.style.color =
        m.label.startsWith('F_net = m') ? '#FFD54F' : 'rgba(255, 255, 255, 0.6)';
      label.style.fontWeight = m.label.startsWith('F_net = m') ? '700' : '400';

      const value = document.createElement('span');
      value.textContent = m.value;
      value.style.color =
        m.label.startsWith('F_net = m') ? '#81C784' : '#ffffff';
      value.style.fontWeight = '600';
      value.style.fontVariantNumeric = 'tabular-nums';

      row.appendChild(label);
      row.appendChild(value);
      this._measurePanel.appendChild(row);
    }
  }

  dispose(): void {
    cancelAnimationFrame(this._rafId);
    this._clock.pause();
    this._input.detach();

    if (this._resizeListener) {
      window.removeEventListener('resize', this._resizeListener);
      this._resizeListener = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._graph) {
      this._graph.dispose();
      this._graph = null;
    }

    if (this._container) {
      this._container.innerHTML = '';
    }
  }
}
