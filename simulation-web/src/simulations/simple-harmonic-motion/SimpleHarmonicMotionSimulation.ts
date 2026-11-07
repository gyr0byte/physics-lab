import { Vector2 } from '../../core/Vector2';
import { Camera2D } from '../../core/Camera2D';
import { SimulationClock } from '../../core/SimulationClock';
import type { Simulation, SimulationMetadata } from '../../core/Simulation';
import {
  type SpringParams,
  type PendulumParams,
  type ForcedDriverParams,
  type SHMState,
  type ForcedIntegrationState,
  type PendulumState,
  DEFAULT_SPRING_PARAMS,
  DEFAULT_FORCED_SPRING_PARAMS,
  DEFAULT_DRIVER_PARAMS,
  DEFAULT_PENDULUM_PARAMS,
  HORIZONTAL_NATURAL_LENGTH,
  HORIZONTAL_BLOCK_WIDTH,
  HORIZONTAL_RAIL_LENGTH,
  computeSpringNaturalFrequencies,
  computeDampedFrequencies,
  computeIdealSpringState,
  computeDampedSpringState,
  computeSmallAnglePendulumState,
  stepForcedOscillatorRK4,
  computeResonancePeak,
  computeResonanceCurve,
  transformToWorldCoordinates,
  computeAutoCameraBounds,
  transformToHorizontalWorldCoordinates,
  computeHorizontalAutoCameraBounds,
} from '../../physics/SimpleHarmonicPhysics';
import {
  drawVerticalSpringApparatus,
  drawHorizontalAirTrackApparatus,
  drawPendulumApparatus,
  drawResonanceCurvePlot,
} from '../../rendering/SHMRenderer';
import { Graph } from '../../components/Graph';

export type SHMMode = 'free' | 'damped' | 'forced' | 'resonance';
export type ApparatusType = 'vertical-spring' | 'pendulum' | 'horizontal-spring';

interface ParameterDef {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  getValue: () => number;
  setValue: (v: number) => void;
  format: (v: number) => string;
}

export class SimpleHarmonicMotionSimulation implements Simulation {
  readonly metadata: SimulationMetadata = {
    id: 'simple-harmonic-motion',
    title: 'Simple Harmonic Motion & Resonance',
    grade: 12,
    area: 'Mechanics',
    chapter: 'Periodic Motion',
    description:
      'Investigate free, damped, and forced harmonic oscillations and mechanical resonance (Nepal CDC Grade 12 Chapter 2).',
  };

  private _container!: HTMLElement;
  private _canvas!: HTMLCanvasElement;
  private _ctx!: CanvasRenderingContext2D;

  private _clock = new SimulationClock(1 / 120);
  private _camera = new Camera2D(100, 100);

  // Mode & apparatus state
  private _mode: SHMMode = 'free';
  private _apparatus: ApparatusType = 'vertical-spring';

  // Physical parameters
  private _springParams: SpringParams = { ...DEFAULT_SPRING_PARAMS, initialDisplacement: 0.30 };
  private _forcedSpringParams: SpringParams = { ...DEFAULT_FORCED_SPRING_PARAMS };
  private _driverParams: ForcedDriverParams = { ...DEFAULT_DRIVER_PARAMS };
  private _pendulumParams: PendulumParams = { ...DEFAULT_PENDULUM_PARAMS };

  // Runtime physical state
  private _freeState: SHMState = computeIdealSpringState(this._springParams, 0);
  private _dampedState: SHMState = computeDampedSpringState(this._springParams, 0);
  private _pendulumState: PendulumState = computeSmallAnglePendulumState(this._pendulumParams, 0);

  private _forcedState: ForcedIntegrationState = {
    time: 0,
    displacement: 0,
    velocity: 0,
    acceleration: DEFAULT_DRIVER_PARAMS.driverForce / DEFAULT_FORCED_SPRING_PARAMS.mass,
    drivingForce: DEFAULT_DRIVER_PARAMS.driverForce,
    externalWork: 0,
    dissipatedEnergy: 0,
    kineticEnergy: 0,
    effectivePotentialEnergy: 0,
    totalMechanicalEnergy: 0,
    apparatusStatus: 'ok',
  };

  // UI state
  private _running = false;
  private _controlElements: HTMLElement[] = [];
  private _measurePanel!: HTMLElement;
  private _statusPill!: HTMLElement;
  private _modeButtons: HTMLElement[] = [];

  // Graph component
  private _graph: Graph | null = null;
  private _dispSeriesIndex: number = -1;
  private _velSeriesIndex: number = -1;

  // Lifecycle
  private _rafId: number = 0;
  private _boundTick = this.tick.bind(this);
  private _resizeListener: (() => void) | null = null;

  initialize(container: HTMLElement): void {
    this._container = container;
    this._container.innerHTML = '';

    const root = document.createElement('div');
    root.id = 'shm-sim-root';
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
        Grade 12 • Mechanics • Periodic Motion
      </div>
      <div style="font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 2px;">
        Simple Harmonic Motion & Resonance
      </div>
    `;

    // Mode Selector Tabs (TV Remote D-pad reachable)
    const modeTabs = document.createElement('div');
    modeTabs.style.cssText = 'display: flex; gap: 8px;';

    const modes: { id: SHMMode; label: string }[] = [
      { id: 'free', label: '1. Free Oscillation' },
      { id: 'damped', label: '2. Damped' },
      { id: 'forced', label: '3. Forced' },
      { id: 'resonance', label: '4. Resonance' },
    ];

    this._modeButtons = modes.map((m) => {
      const btn = document.createElement('button');
      btn.textContent = m.label;
      btn.style.cssText = `
        padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
        cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.2);
        background: ${this._mode === m.id ? '#1976D2' : 'rgba(255, 255, 255, 0.05)'};
        color: #ffffff; transition: all 0.15s ease;
      `;
      btn.onclick = () => this._setMode(m.id);
      modeTabs.appendChild(btn);
      return btn;
    });

    header.appendChild(titleArea);
    header.appendChild(modeTabs);
    root.appendChild(header);

    // ── Main Body (Viewport + Sidebar) ─────────────────────
    const mainBody = document.createElement('div');
    mainBody.style.cssText = `
      display: flex; flex: 1; min-height: 0; width: 100%; position: relative;
    `;

    // Left Viewport (Canvas + Graph)
    const viewportArea = document.createElement('div');
    viewportArea.style.cssText = `
      flex: 1; display: flex; flex-direction: column; position: relative; min-width: 0;
    `;

    const canvasContainer = document.createElement('div');
    canvasContainer.style.cssText = `
      flex: 1; position: relative; min-height: 0; overflow: hidden;
    `;

    this._canvas = document.createElement('canvas');
    this._canvas.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%;';
    canvasContainer.appendChild(this._canvas);

    const ctx = this._canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context for SHM canvas');
    this._ctx = ctx;

    // Status Pill overlay
    this._statusPill = document.createElement('div');
    this._statusPill.style.cssText = `
      position: absolute; top: 12px; left: 16px;
      padding: 4px 12px; border-radius: 12px;
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
      background: rgba(33, 150, 243, 0.2); color: #64B5F6;
      border: 1px solid rgba(33, 150, 243, 0.4); pointer-events: none;
    `;
    this._statusPill.textContent = 'READY';
    canvasContainer.appendChild(this._statusPill);

    viewportArea.appendChild(canvasContainer);

    // Bottom Graph Container
    const graphContainer = document.createElement('div');
    graphContainer.style.cssText = `
      height: 140px; background: rgba(13, 17, 23, 0.95);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex; align-items: center; justify-content: center;
      padding: 8px 16px; flex-shrink: 0;
    `;

    this._graph = new Graph(graphContainer, 650, 120, 'Time t (s)', 'Displacement x (m)');
    this._dispSeriesIndex = this._graph.addSeries('x(t)', '#4DD0E1');
    this._velSeriesIndex = this._graph.addSeries('v(t)', '#FFCA28');
    viewportArea.appendChild(graphContainer);

    // Right Sidebar (Parameters + Measurements)
    const sidebar = document.createElement('aside');
    sidebar.style.cssText = `
      width: 380px; background: rgba(22, 27, 34, 0.98);
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      display: flex; flex-direction: column; overflow-y: auto; flex-shrink: 0;
      padding: 16px; gap: 16px;
    `;

    // Apparatus Selector (for Free mode)
    const apparatusContainer = document.createElement('div');
    apparatusContainer.id = 'apparatus-selector';
    apparatusContainer.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';
    const appLabel = document.createElement('label');
    appLabel.textContent = 'Oscillating System';
    appLabel.style.cssText = 'font-size: 11px; font-weight: 600; text-transform: uppercase; color: #90CAF9;';
    apparatusContainer.appendChild(appLabel);

    const appSelect = document.createElement('select');
    appSelect.style.cssText = `
      padding: 8px; border-radius: 6px; background: #0d1117; color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2); font-size: 13px; font-weight: 500;
    `;
    appSelect.innerHTML = `
      <option value="vertical-spring">Vertical Spring-Mass (Primary)</option>
      <option value="pendulum">Simple Pendulum</option>
      <option value="horizontal-spring">Horizontal Air Track (Comparison)</option>
    `;
    appSelect.onchange = () => {
      this._apparatus = appSelect.value as ApparatusType;
      this._updateCameraFraming();
      this.reset();
    };
    apparatusContainer.appendChild(appSelect);
    sidebar.appendChild(apparatusContainer);

    // Parameter Controls Container
    const paramsContainer = document.createElement('div');
    paramsContainer.id = 'shm-params';
    paramsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';
    sidebar.appendChild(paramsContainer);

    // Action Buttons (Play/Pause, Reset)
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 8px; margin-top: 4px;';

    const playBtn = document.createElement('button');
    playBtn.textContent = '▶ Start';
    playBtn.style.cssText = `
      flex: 1; padding: 10px; border-radius: 6px; font-weight: 700; font-size: 13px;
      cursor: pointer; background: #2E7D32; color: #ffffff; border: none;
    `;
    playBtn.onclick = () => {
      if (this._running) {
        this.pause();
        playBtn.textContent = '▶ Resume';
      } else {
        this.start();
        playBtn.textContent = '⏸ Pause';
      }
    };

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '↺ Reset';
    resetBtn.style.cssText = `
      flex: 1; padding: 10px; border-radius: 6px; font-weight: 700; font-size: 13px;
      cursor: pointer; background: #37474F; color: #ffffff; border: none;
    `;
    resetBtn.onclick = () => {
      this.reset();
      playBtn.textContent = '▶ Start';
    };

    btnRow.appendChild(playBtn);
    btnRow.appendChild(resetBtn);
    sidebar.appendChild(btnRow);

    // Measurement & Analytical Check Panel
    const measureSection = document.createElement('div');
    measureSection.style.cssText = `
      background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; gap: 4px;
    `;
    const measureTitle = document.createElement('div');
    measureTitle.textContent = 'Real-Time Measurements & Invariants';
    measureTitle.style.cssText = 'font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64B5F6; margin-bottom: 6px;';
    measureSection.appendChild(measureTitle);

    this._measurePanel = document.createElement('div');
    measureSection.appendChild(this._measurePanel);
    sidebar.appendChild(measureSection);

    mainBody.appendChild(viewportArea);
    mainBody.appendChild(sidebar);
    root.appendChild(mainBody);

    this._container.appendChild(root);

    // Resize handling
    this._resizeListener = this._handleResize.bind(this);
    window.addEventListener('resize', this._resizeListener);
    this._handleResize();

    // Rebuild controls for initial mode
    this._rebuildControls();
    this.reset();

    // Check URL parameters for direct QA navigation
    const hash = window.location.hash;
    if (hash.includes('mode=damped')) {
      this._setMode('damped');
    } else if (hash.includes('mode=forced')) {
      this._setMode('forced');
    } else if (hash.includes('mode=resonance')) {
      this._setMode('resonance');
    } else {
      this._setMode('free');
    }

    if (hash.includes('apparatus=pendulum')) {
      this._apparatus = 'pendulum';
      const appSelect = document.querySelector('#apparatus-selector select') as HTMLSelectElement | null;
      if (appSelect) appSelect.value = 'pendulum';
      this._updateCameraFraming();
      this.reset();
    } else if (hash.includes('apparatus=horizontal-spring')) {
      this._apparatus = 'horizontal-spring';
      const appSelect = document.querySelector('#apparatus-selector select') as HTMLSelectElement | null;
      if (appSelect) appSelect.value = 'horizontal-spring';
      this._updateCameraFraming();
      this.reset();
    }

    if (hash.includes('status=exceeded')) {
      this._forcedState.apparatusStatus = 'exceeded';
      this._forcedState.displacement = 2.45;
      this._forcedState.velocity = 1.8;
      this._forcedState.acceleration = -61.25;
      this._forcedState.drivingForce = 1.5;
    }

    if (hash.includes('autostart=1')) {
      this.start();
    }

    // Start render loop
    this._rafId = requestAnimationFrame(this._boundTick);
  }

  private _setMode(mode: SHMMode): void {
    this._mode = mode;
    // Set appropriate apparatus for mode
    if (mode === 'forced' || mode === 'resonance') {
      this._apparatus = 'horizontal-spring';
    } else if (this._apparatus === 'horizontal-spring') {
      this._apparatus = 'vertical-spring';
    }

    // Update tab visual states
    this._modeButtons.forEach((btn, idx) => {
      const modeKeys: SHMMode[] = ['free', 'damped', 'forced', 'resonance'];
      btn.style.background = modeKeys[idx] === mode ? '#1976D2' : 'rgba(255, 255, 255, 0.05)';
    });

    // Hide/show apparatus selector
    const appContainer = document.getElementById('apparatus-selector');
    if (appContainer) {
      appContainer.style.display = mode === 'free' ? 'flex' : 'none';
    }

    this._updateCameraFraming();
    this._rebuildControls();
    this.reset();
  }

  private _handleResize(): void {
    if (!this._canvas) return;
    const rect = this._canvas.parentElement?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    this._canvas.width = rect.width * dpr;
    this._canvas.height = rect.height * dpr;

    this._camera.resize(rect.width, rect.height);
    this._updateCameraFraming();
  }

  private _updateCameraFraming(): void {
    const w = this._canvas.width / (window.devicePixelRatio || 1);
    const h = this._canvas.height / (window.devicePixelRatio || 1);

    if (this._apparatus === 'horizontal-spring') {
      // Horizontal Air Track Framing:
      // Wall anchor at X = 0.00 m, track elevation Y = 0.00 m, rail = 6.00 m
      const bounds = computeHorizontalAutoCameraBounds(0.00, 0.00, HORIZONTAL_NATURAL_LENGTH, 2.0);
      const scale = Math.min((w * 0.90) / bounds.viewportWidth, (h * 0.70) / bounds.viewportHeight);
      this._camera.setScale(scale);

      // Center the camera on the guide rail
      const originX = w * 0.50 - bounds.centerX * scale;
      const originY = h * 0.50 + bounds.centerY * scale;
      this._camera.setOrigin(originX, originY);
    } else {
      // Vertical Spring / Pendulum Framing:
      // Ceiling anchor at Y = 0.00 m, hangs downward into -Y
      const ceilingY = 0.00;
      const naturalLength = this._springParams.naturalLength ?? 0.40;
      const staticElongation = (this._springParams.mass * (this._springParams.gravity ?? 9.80)) / this._springParams.springConstant;
      const peakAmp = this._springParams.initialDisplacement ?? 0.30;

      const bounds = computeAutoCameraBounds(ceilingY, naturalLength, staticElongation, peakAmp);
      const scale = (h * 0.75) / bounds.viewportHeight;
      this._camera.setScale(scale);

      const originX = w * 0.40;
      const originY = h * 0.20;
      this._camera.setOrigin(originX, originY);
    }
  }

  private _rebuildControls(): void {
    const container = document.getElementById('shm-params');
    if (!container) return;
    container.innerHTML = '';
    this._controlElements = [];

    const params: ParameterDef[] = [];

    if (this._apparatus === 'pendulum') {
      params.push(
        {
          id: 'length',
          label: 'Length (L)',
          min: 0.3,
          max: 2.5,
          step: 0.1,
          unit: 'm',
          getValue: () => this._pendulumParams.length,
          setValue: (v) => {
            this._pendulumParams.length = v;
            this.reset();
          },
          format: (v) => `${v.toFixed(2)} m`,
        },
        {
          id: 'angle',
          label: 'Initial Angle (θ₀)',
          min: 2,
          max: 30,
          step: 1,
          unit: '°',
          getValue: () => (this._pendulumParams.initialAngleRad * 180) / Math.PI,
          setValue: (v) => {
            this._pendulumParams.initialAngleRad = (v * Math.PI) / 180;
            this.reset();
          },
          format: (v) => `${v.toFixed(1)}°`,
        },
        {
          id: 'mass',
          label: 'Bob Mass (m)',
          min: 0.2,
          max: 3.0,
          step: 0.1,
          unit: 'kg',
          getValue: () => this._pendulumParams.mass,
          setValue: (v) => {
            this._pendulumParams.mass = v;
            this.reset();
          },
          format: (v) => `${v.toFixed(1)} kg`,
        }
      );
    } else {
      // Spring systems (Free, Damped, Forced, Resonance)
      params.push(
        {
          id: 'mass',
          label: 'Mass (m)',
          min: 0.2,
          max: 3.0,
          step: 0.1,
          unit: 'kg',
          getValue: () => this._springParams.mass,
          setValue: (v) => {
            this._springParams.mass = v;
            this._forcedSpringParams.mass = v;
            this.reset();
          },
          format: (v) => `${v.toFixed(1)} kg`,
        },
        {
          id: 'springConstant',
          label: 'Spring Const (k)',
          min: 10.0,
          max: 100.0,
          step: 5.0,
          unit: 'N/m',
          getValue: () => this._springParams.springConstant,
          setValue: (v) => {
            this._springParams.springConstant = v;
            this._forcedSpringParams.springConstant = v;
            this.reset();
          },
          format: (v) => `${v.toFixed(1)} N/m`,
        }
      );

      if (this._mode === 'free' || this._mode === 'damped') {
        params.push({
          id: 'amplitude',
          label: 'Initial Amplitude (A)',
          min: 0.05,
          max: this._apparatus === 'horizontal-spring' ? 2.40 : 0.50,
          step: 0.05,
          unit: 'm',
          getValue: () => this._springParams.initialDisplacement ?? 0.30,
          setValue: (v) => {
            this._springParams.initialDisplacement = v;
            this.reset();
          },
          format: (v) => `${v.toFixed(2)} m`,
        });
      }

      if (this._mode === 'damped') {
        params.push({
          id: 'damping',
          label: 'Damping Coeff (b)',
          min: 0.05,
          max: 1.00,
          step: 0.05,
          unit: 'N·s/m',
          getValue: () => this._springParams.dampingCoefficient ?? 0.20,
          setValue: (v) => {
            this._springParams.dampingCoefficient = v;
            this.reset();
          },
          format: (v) => `${v.toFixed(2)} N·s/m`,
        });
      }

      if (this._mode === 'forced' || this._mode === 'resonance') {
        params.push(
          {
            id: 'driverFreq',
            label: 'Driver Freq (Ω)',
            min: 0.0,
            max: 15.0,
            step: 0.2,
            unit: 'rad/s',
            getValue: () => this._driverParams.drivingFrequency,
            setValue: (v) => {
              this._driverParams.drivingFrequency = v;
              this.reset();
            },
            format: (v) => `${v.toFixed(1)} rad/s`,
          },
          {
            id: 'driverForce',
            label: 'Driver Force (F₀)',
            min: 0.5,
            max: 5.0,
            step: 0.5,
            unit: 'N',
            getValue: () => this._driverParams.driverForce,
            setValue: (v) => {
              this._driverParams.driverForce = v;
              this.reset();
            },
            format: (v) => `${v.toFixed(1)} N`,
          },
          {
            id: 'damping',
            label: 'Damping (b)',
            min: 0.0,
            max: 1.0,
            step: 0.05,
            unit: 'N·s/m',
            getValue: () => this._forcedSpringParams.dampingCoefficient ?? 0.20,
            setValue: (v) => {
              this._forcedSpringParams.dampingCoefficient = v;
              this.reset();
            },
            format: (v) => (v === 0 ? '0.00 (Undamped)' : `${v.toFixed(2)} N·s/m`),
          }
        );
      }
    }

    // Render parameter controls with D-pad steppers
    for (const p of params) {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex; flex-direction: column; gap: 4px; padding: 6px 8px;
        border-radius: 6px; background: rgba(255, 255, 255, 0.03);
      `;

      const header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; font-size: 12px;';
      const label = document.createElement('span');
      label.textContent = p.label;
      label.style.color = 'rgba(255, 255, 255, 0.8)';
      const valText = document.createElement('span');
      valText.textContent = p.format(p.getValue());
      valText.style.color = '#64B5F6';
      valText.style.fontWeight = '700';
      header.appendChild(label);
      header.appendChild(valText);
      row.appendChild(header);

      // Stepper row
      const stepper = document.createElement('div');
      stepper.style.cssText = 'display: flex; gap: 6px; align-items: center;';

      const decBtn = document.createElement('button');
      decBtn.textContent = '◀';
      decBtn.style.cssText = `
        padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer;
        background: rgba(255, 255, 255, 0.1); color: #ffffff; border: none;
      `;
      decBtn.onclick = () => {
        const next = Math.max(p.min, p.getValue() - p.step);
        p.setValue(Number(next.toFixed(3)));
        valText.textContent = p.format(p.getValue());
      };

      const incBtn = document.createElement('button');
      incBtn.textContent = '▶';
      incBtn.style.cssText = `
        padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer;
        background: rgba(255, 255, 255, 0.1); color: #ffffff; border: none;
      `;
      incBtn.onclick = () => {
        const next = Math.min(p.max, p.getValue() + p.step);
        p.setValue(Number(next.toFixed(3)));
        valText.textContent = p.format(p.getValue());
      };

      const track = document.createElement('div');
      track.style.cssText = 'flex: 1; height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px;';

      stepper.appendChild(decBtn);
      stepper.appendChild(track);
      stepper.appendChild(incBtn);
      row.appendChild(stepper);

      container.appendChild(row);
      this._controlElements.push(row);
    }
  }

  start(): void {
    this._running = true;
    if (this._statusPill) {
      this._statusPill.textContent = 'RUNNING';
      this._statusPill.style.background = 'rgba(76, 175, 80, 0.2)';
      this._statusPill.style.color = '#81C784';
      this._statusPill.style.borderColor = 'rgba(76, 175, 80, 0.4)';
    }
  }

  pause(): void {
    this._running = false;
    if (this._statusPill) {
      this._statusPill.textContent = 'PAUSED';
      this._statusPill.style.background = 'rgba(255, 152, 0, 0.2)';
      this._statusPill.style.color = '#FFB74D';
      this._statusPill.style.borderColor = 'rgba(255, 152, 0, 0.4)';
    }
  }

  reset(): void {
    this._running = false;
    this._clock.reset();

    // Reset physics state
    if (this._apparatus === 'pendulum') {
      this._pendulumState = computeSmallAnglePendulumState(this._pendulumParams, 0);
    } else if (this._mode === 'forced' || this._mode === 'resonance') {
      this._forcedState = {
        time: 0,
        displacement: 0,
        velocity: 0,
        acceleration: this._driverParams.driverForce / this._forcedSpringParams.mass,
        drivingForce: this._driverParams.driverForce,
        externalWork: 0,
        dissipatedEnergy: 0,
        kineticEnergy: 0,
        effectivePotentialEnergy: 0,
        totalMechanicalEnergy: 0,
        apparatusStatus: 'ok',
      };
    } else if (this._mode === 'damped') {
      this._dampedState = computeDampedSpringState(this._springParams, 0);
    } else {
      this._freeState = computeIdealSpringState(this._springParams, 0);
    }

    if (this._graph) {
      this._graph.clear();
    }

    if (this._statusPill) {
      this._statusPill.textContent = 'READY';
      this._statusPill.style.background = 'rgba(33, 150, 243, 0.2)';
      this._statusPill.style.color = '#64B5F6';
      this._statusPill.style.borderColor = 'rgba(33, 150, 243, 0.4)';
    }

    this._updateMeasurementPanel();
  }

  tick(timestamp: number): void {
    if (this._running) {
      const fixedSteps = this._clock.tick(timestamp);

      for (let i = 0; i < fixedSteps; i++) {
        const dt = this._clock.fixedDt;

        if (this._apparatus === 'pendulum') {
          this._pendulumState = computeSmallAnglePendulumState(
            this._pendulumParams,
            this._clock.elapsed
          );

          if (this._graph && this._clock.elapsed % 0.05 < dt) {
            this._graph.pushData(this._dispSeriesIndex, this._clock.elapsed, this._pendulumState.angleDeg);
            this._graph.pushData(this._velSeriesIndex, this._clock.elapsed, this._pendulumState.linearVelocity);
          }
        } else if (this._mode === 'forced' || this._mode === 'resonance') {
          if (this._forcedState.apparatusStatus !== 'exceeded') {
            this._forcedState = stepForcedOscillatorRK4(
              this._forcedState,
              this._forcedSpringParams,
              this._driverParams,
              dt
            );

            if (this._graph && this._clock.elapsed % 0.05 < dt) {
              this._graph.pushData(this._dispSeriesIndex, this._clock.elapsed, this._forcedState.displacement);
              this._graph.pushData(this._velSeriesIndex, this._clock.elapsed, this._forcedState.velocity);
            }
          }
        } else if (this._mode === 'damped') {
          this._dampedState = computeDampedSpringState(
            this._springParams,
            this._clock.elapsed
          );

          if (this._graph && this._clock.elapsed % 0.05 < dt) {
            this._graph.pushData(this._dispSeriesIndex, this._clock.elapsed, this._dampedState.displacement);
            this._graph.pushData(this._velSeriesIndex, this._clock.elapsed, this._dampedState.velocity);
          }
        } else {
          // Free oscillation
          this._freeState = computeIdealSpringState(
            this._springParams,
            this._clock.elapsed
          );

          if (this._graph && this._clock.elapsed % 0.05 < dt) {
            this._graph.pushData(this._dispSeriesIndex, this._clock.elapsed, this._freeState.displacement);
            this._graph.pushData(this._velSeriesIndex, this._clock.elapsed, this._freeState.velocity);
          }
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

    if (this._apparatus === 'pendulum') {
      // ── Render Pendulum ──────────────────────────────────
      const pivotWorld = new Vector2(0, 0);
      drawPendulumApparatus(ctx, this._camera, this._pendulumState, {
        pivotWorld,
        length: this._pendulumParams.length,
        mass: this._pendulumParams.mass,
        showVectors: true,
        showReferenceLines: true,
      });
    } else if (this._apparatus === 'horizontal-spring') {
      // ── Render Horizontal Guided Air Track (Modes 3 & 4 or Free comparison) ──
      const wallWorldX = 0.00;
      const trackWorldY = 0.00;

      let disp = 0;
      let vel = 0;
      let acc = 0;
      let fRestore = 0;
      let fDrive = 0;
      let status: 'ok' | 'exceeded' = 'ok';

      if (this._mode === 'forced' || this._mode === 'resonance') {
        disp = this._forcedState.displacement;
        vel = this._forcedState.velocity;
        acc = this._forcedState.acceleration;
        fRestore = -this._forcedSpringParams.springConstant * disp;
        fDrive = this._forcedState.drivingForce;
        status = this._forcedState.apparatusStatus === 'exceeded' ? 'exceeded' : 'ok';
      } else if (this._mode === 'damped') {
        disp = this._dampedState.displacement;
        vel = this._dampedState.velocity;
        acc = this._dampedState.acceleration;
        fRestore = -this._springParams.springConstant * disp;
      } else {
        disp = this._freeState.displacement;
        vel = this._freeState.velocity;
        acc = this._freeState.acceleration;
        fRestore = -this._springParams.springConstant * disp;
      }

      const transform = transformToHorizontalWorldCoordinates({
        wallWorldX,
        trackWorldY,
        naturalLength: HORIZONTAL_NATURAL_LENGTH,
        displacement: disp,
        velocity: vel,
        acceleration: acc,
        restoringForce: fRestore,
        drivingForce: fDrive,
        blockWidth: HORIZONTAL_BLOCK_WIDTH,
      });

      drawHorizontalAirTrackApparatus(ctx, this._camera, transform, {
        naturalLength: HORIZONTAL_NATURAL_LENGTH,
        railLength: HORIZONTAL_RAIL_LENGTH,
        mass: this._mode === 'forced' || this._mode === 'resonance' ? this._forcedSpringParams.mass : this._springParams.mass,
        blockWidth: HORIZONTAL_BLOCK_WIDTH,
        showVectors: true,
        showReferenceLines: true,
        showDriver: this._mode === 'forced' || this._mode === 'resonance',
        apparatusStatus: status,
      });

      // If Mode 4 (Mechanical Resonance), overlay the Analytical Frequency-Response Curve!
      if (this._mode === 'resonance') {
        const curvePoints = computeResonanceCurve(
          this._forcedSpringParams,
          this._driverParams.driverForce,
          { minOmega: 0, maxOmega: 2.5 * Math.sqrt(this._forcedSpringParams.springConstant / this._forcedSpringParams.mass), steps: 120 }
        );
        const { omega0 } = computeSpringNaturalFrequencies(this._forcedSpringParams.mass, this._forcedSpringParams.springConstant);
        const peakInfo = computeResonancePeak(this._forcedSpringParams, this._driverParams.driverForce);

        // Position resonance plot in upper-right viewport area
        const plotWidth = Math.min(380, w * 0.40);
        const plotHeight = Math.min(220, h * 0.38);
        const plotRect = {
          x: w - plotWidth - 20,
          y: 20,
          width: plotWidth,
          height: plotHeight,
        };

        drawResonanceCurvePlot(
          ctx,
          plotRect,
          curvePoints,
          this._driverParams.drivingFrequency,
          omega0,
          peakInfo
        );
      }
    } else {
      // ── Render Vertical Spring-Mass Apparatus ────────────
      const ceilingWorldY = 0.00;
      const naturalLength = this._springParams.naturalLength ?? 0.40;
      const g = this._springParams.gravity ?? 9.80;
      const staticElongation = (this._springParams.mass * g) / this._springParams.springConstant;

      let disp = 0;
      let vel = 0;
      let acc = 0;
      let fRestore = 0;

      if (this._mode === 'damped') {
        disp = this._dampedState.displacement;
        vel = this._dampedState.velocity;
        acc = this._dampedState.acceleration;
        fRestore = -this._springParams.springConstant * disp;
      } else {
        disp = this._freeState.displacement;
        vel = this._freeState.velocity;
        acc = this._freeState.acceleration;
        fRestore = -this._springParams.springConstant * disp;
      }

      const transform = transformToWorldCoordinates({
        ceilingWorldY,
        naturalLength,
        staticElongation,
        displacement: disp,
        velocity: vel,
        acceleration: acc,
        restoringForce: fRestore,
      });

      drawVerticalSpringApparatus(ctx, this._camera, transform, {
        ceilingWorldY,
        naturalLength,
        staticElongation,
        mass: this._springParams.mass,
        springConstant: this._springParams.springConstant,
        displacement: disp,
        showVectors: true,
        showReferenceLines: true,
      });
    }

    // Render Real-time Graph
    if (this._graph) {
      this._graph.render();
    }
  }

  private _updateMeasurementPanel(): void {
    if (!this._measurePanel) return;

    let items: { label: string; value: string; color?: string }[] = [];

    if (this._apparatus === 'pendulum') {
      const s = this._pendulumState;
      const p = this._pendulumParams;
      const T0 = 2 * Math.PI * Math.sqrt(p.length / (p.gravity ?? 9.80));

      items = [
        { label: 'Time (t)', value: `${s.time.toFixed(2)} s` },
        { label: 'Angle (θ)', value: `${s.angleDeg.toFixed(2)}°` },
        { label: 'Angular Velocity (ω)', value: `${s.angularVelocity.toFixed(2)} rad/s` },
        { label: 'Linear Velocity (v)', value: `${s.linearVelocity.toFixed(2)} m/s` },
        { label: 'Theoretical Period (T)', value: `${T0.toFixed(3)} s` },
        { label: '─', value: '' },
        { label: 'Kinetic Energy (K)', value: `${s.kineticEnergy.toFixed(3)} J` },
        { label: 'Potential Energy (U)', value: `${s.potentialEnergy.toFixed(3)} J` },
        { label: 'Total Energy (E)', value: `${s.totalEnergy.toFixed(3)} J`, color: '#81C784' },
      ];
    } else if (this._mode === 'forced' || this._mode === 'resonance') {
      const s = this._forcedState;
      const p = this._forcedSpringParams;
      const d = this._driverParams;
      const { omega0 } = computeSpringNaturalFrequencies(p.mass, p.springConstant);
      const peak = computeResonancePeak(p, d.driverForce);
      const isExceeded = s.apparatusStatus === 'exceeded';

      items = [
        { label: 'Time (t)', value: `${s.time.toFixed(2)} s` },
        { label: 'Displacement (x)', value: `${s.displacement.toFixed(3)} m` },
        { label: 'Velocity (v)', value: `${s.velocity.toFixed(3)} m/s` },
        { label: 'Restoring Force (F_s)', value: `${(-p.springConstant * s.displacement).toFixed(2)} N` },
        { label: 'Driving Force (F_drive)', value: `${s.drivingForce.toFixed(2)} N` },
        { label: 'Natural Freq (ω₀)', value: `${omega0.toFixed(2)} rad/s` },
        { label: 'Driver Freq (Ω)', value: `${d.drivingFrequency.toFixed(2)} rad/s` },
        {
          label: 'Resonance Peak (Ω_res)',
          value: peak.resonantFrequencyRad !== null ? `${peak.resonantFrequencyRad.toFixed(2)} rad/s` : 'None',
        },
        {
          label: 'Theoretical A_max',
          value: Number.isFinite(peak.peakAmplitude) ? `${peak.peakAmplitude.toFixed(2)} m` : '∞ (Undamped)',
          color: '#FFD54F',
        },
        { label: 'Apparatus Status', value: isExceeded ? 'EXCEEDED' : 'OK', color: isExceeded ? '#EF5350' : '#81C784' },
      ];
    } else if (this._mode === 'damped') {
      const s = this._dampedState;
      const p = this._springParams;
      const { omega0, gamma, dampingRatio } = computeDampedFrequencies(
        p.mass,
        p.springConstant,
        p.dampingCoefficient ?? 0.20
      );

      items = [
        { label: 'Time (t)', value: `${s.time.toFixed(2)} s` },
        { label: 'Displacement (x)', value: `${s.displacement.toFixed(3)} m` },
        { label: 'Velocity (v)', value: `${s.velocity.toFixed(3)} m/s` },
        { label: 'Natural Freq (ω₀)', value: `${omega0.toFixed(2)} rad/s` },
        { label: 'Damping Factor (γ)', value: `${gamma.toFixed(2)} s⁻¹` },
        { label: 'Damping Ratio (ζ)', value: `${dampingRatio.toFixed(3)}` },
        { label: '─', value: '' },
        { label: 'Mechanical Energy (E)', value: `${s.totalMechanicalEnergy.toFixed(3)} J` },
        { label: 'Dissipated Thermal (Q)', value: `${s.dissipatedEnergy.toFixed(3)} J`, color: '#FF7043' },
        { label: 'Total Conserved (E+Q)', value: `${(s.totalMechanicalEnergy + s.dissipatedEnergy).toFixed(3)} J`, color: '#81C784' },
      ];
    } else {
      // Free Oscillation
      const s = this._freeState;
      const p = this._springParams;
      const { omega0, period } = computeSpringNaturalFrequencies(p.mass, p.springConstant);

      items = [
        { label: 'Time (t)', value: `${s.time.toFixed(2)} s` },
        { label: 'Displacement (x)', value: `${s.displacement.toFixed(3)} m` },
        { label: 'Velocity (v)', value: `${s.velocity.toFixed(3)} m/s` },
        { label: 'Acceleration (a)', value: `${s.acceleration.toFixed(2)} m/s²` },
        { label: 'Natural Freq (ω₀)', value: `${omega0.toFixed(2)} rad/s` },
        { label: 'Natural Period (T₀)', value: `${period.toFixed(3)} s` },
        { label: '─', value: '' },
        { label: 'Kinetic Energy (K)', value: `${s.kineticEnergy.toFixed(3)} J` },
        { label: 'Effective Potential (U)', value: `${s.effectivePotentialEnergy.toFixed(3)} J` },
        { label: 'Total Energy (E)', value: `${s.totalMechanicalEnergy.toFixed(3)} J`, color: '#81C784' },
      ];
    }

    this._measurePanel.innerHTML = '';
    for (const item of items) {
      if (item.label === '─') {
        const divider = document.createElement('hr');
        divider.style.cssText = 'border: none; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 3px 0;';
        this._measurePanel.appendChild(divider);
        continue;
      }

      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0;';

      const lbl = document.createElement('span');
      lbl.textContent = item.label;
      lbl.style.color = 'rgba(255, 255, 255, 0.6)';

      const val = document.createElement('span');
      val.textContent = item.value;
      val.style.color = item.color || '#ffffff';
      val.style.fontWeight = item.color ? '700' : '500';

      row.appendChild(lbl);
      row.appendChild(val);
      this._measurePanel.appendChild(row);
    }
  }

  dispose(): void {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
    if (this._resizeListener) {
      window.removeEventListener('resize', this._resizeListener);
    }
    if (this._graph) {
      this._graph.dispose();
      this._graph = null;
    }
    this._container.innerHTML = '';
  }
}
