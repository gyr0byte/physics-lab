import { SimulationClock } from '../../core/SimulationClock';
import { Camera2D } from '../../core/Camera2D';
import { InputManager, type InputAction } from '../../core/InputManager';
import type { Simulation, SimulationMetadata } from '../../core/Simulation';
import {
  WORK_ENERGY_CONSTANTS,
  type WorkEnergyParams,
  type WorkEnergyState,
  DEFAULT_WORK_ENERGY_PARAMS,
  createInitialWorkEnergyState,
  stepWorkEnergy,
  computeWorkEnergyForces,
  computeWorkEnergyLedger,
  computeWorkBreakdown,
  computeWorkEnergyPower,
} from '../../physics/WorkEnergyPhysics';
import { renderWorkEnergyApparatus } from '../../rendering/WorkEnergyRenderer';
import { Graph } from '../../components/Graph';

interface ParameterDef {
  key: keyof WorkEnergyParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  format: (v: number) => string;
}

const PARAMETERS: ParameterDef[] = [
  {
    key: 'mass',
    label: 'Block Mass (m)',
    min: 0.5,
    max: 5.0,
    step: 0.5,
    unit: 'kg',
    format: (v) => `${v.toFixed(1)} kg`,
  },
  {
    key: 'inclineAngleDeg',
    label: 'Incline Angle (θ)',
    min: 10,
    max: 45,
    step: 5,
    unit: '°',
    format: (v) => `${v.toFixed(0)}°`,
  },
  {
    key: 'kineticFriction',
    label: 'Kinetic Friction (μk)',
    min: 0.0,
    max: 0.30,
    step: 0.01,
    unit: '',
    format: (v) => (v === 0 ? '0.00 (Frictionless)' : v.toFixed(2)),
  },
  {
    key: 'staticFriction',
    label: 'Static Friction (μs)',
    min: 0.0,
    max: 0.40,
    step: 0.01,
    unit: '',
    format: (v) => (v === 0 ? '0.00 (None)' : v.toFixed(2)),
  },
  {
    key: 'springConstant',
    label: 'Spring Constant (k)',
    min: 10,
    max: 80,
    step: 5,
    unit: 'N/m',
    format: (v) => `${v.toFixed(0)} N/m`,
  },
];

type GraphTab = 'energy' | 'power' | 'kinematics';

export class WorkEnergySimulation implements Simulation {
  readonly metadata: SimulationMetadata = {
    id: 'work-energy-power',
    title: 'Work, Energy & Power',
    grade: 11,
    area: 'Mechanics',
    chapter: 'Work, Energy and Power',
    description:
      'Investigate work done by constant and variable forces, the work-energy theorem, conservative and dissipative systems, and instantaneous power on an inclined plane with a spring bumper.',
  };

  private _container!: HTMLElement;
  private _canvas!: HTMLCanvasElement;
  private _ctx!: CanvasRenderingContext2D;

  private _clock = new SimulationClock(0.005);
  private _camera = new Camera2D(800, 600);
  private _input = new InputManager();

  private _params: WorkEnergyParams = { ...DEFAULT_WORK_ENERGY_PARAMS };
  private _currentState: WorkEnergyState = createInitialWorkEnergyState(this._params);

  // Graphs for each tab
  private _activeTab: GraphTab = 'energy';
  private _energyGraph: Graph | null = null;
  private _powerGraph: Graph | null = null;
  private _kinematicsGraph: Graph | null = null;
  private _graphContainers: Record<GraphTab, HTMLElement | null> = {
    energy: null,
    power: null,
    kinematics: null,
  };

  // Series indices
  private _seriesK = -1;
  private _seriesUg = -1;
  private _seriesUs = -1;
  private _seriesEtot = -1;
  private _seriesPinst = -1;
  private _seriesPavg = -1;
  private _seriesV = -1;
  private _seriesA = -1;

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
    root.id = 'work-energy-sim-root';
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
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #38BDF8; font-weight: 600;">
        Grade 11 • Mechanics • Work, Energy and Power
      </div>
      <div style="font-size: 18px; font-weight: 700; color: #ffffff;">
        Work, Energy & Power — Inclined Track & Spring Bumper
      </div>
    `;

    this._statusPill = document.createElement('div');
    this._statusPill.style.cssText = `
      font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 12px;
      background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3);
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
    canvasContainer.id = 'work-energy-canvas-container';
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

    // Canvas resize handling
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

    const presetCol = document.createElement('div');
    presetCol.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

    // Preset 1: Frictionless
    const btnFrictionless = document.createElement('button');
    btnFrictionless.textContent = '1. Frictionless (μ=0, k=50)';
    btnFrictionless.style.cssText = `
      padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.4);
      background: rgba(56, 189, 248, 0.1); color: #7dd3fc; font-size: 12px; font-weight: 600;
      text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent;
    `;
    btnFrictionless.addEventListener('click', () => {
      this._params.kineticFriction = 0;
      this._params.staticFriction = 0;
      this._params.springConstant = 50;
      this._updateParamDisplays();
      this._resetPhysics();
    });
    presetCol.appendChild(btnFrictionless);

    // Preset 2: High Friction (Damped)
    const btnHighFriction = document.createElement('button');
    btnHighFriction.textContent = '2. High Friction (μk=0.15, μs=0.20)';
    btnHighFriction.style.cssText = `
      padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(244, 63, 94, 0.4);
      background: rgba(244, 63, 94, 0.1); color: #fda4af; font-size: 12px; font-weight: 600;
      text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent;
    `;
    btnHighFriction.addEventListener('click', () => {
      this._params.kineticFriction = 0.15;
      this._params.staticFriction = 0.20;
      this._params.springConstant = 40;
      this._updateParamDisplays();
      this._resetPhysics();
    });
    presetCol.appendChild(btnHighFriction);

    // Preset 3: Stiff Spring
    const btnStiffSpring = document.createElement('button');
    btnStiffSpring.textContent = '3. Stiff Spring (k=80 N/m)';
    btnStiffSpring.style.cssText = `
      padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.4);
      background: rgba(245, 158, 11, 0.1); color: #fde68a; font-size: 12px; font-weight: 600;
      text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent;
    `;
    btnStiffSpring.addEventListener('click', () => {
      this._params.springConstant = 80;
      this._updateParamDisplays();
      this._resetPhysics();
    });
    presetCol.appendChild(btnStiffSpring);

    panel.appendChild(presetCol);

    // Action buttons (Start / Pause, Reset)
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

    const startBtn = document.createElement('button');
    startBtn.id = 'work-energy-start-btn';
    startBtn.textContent = 'Start';
    startBtn.style.cssText = `
      flex: 1; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;
      background: #0284c7; color: #fff; border: 2px solid transparent; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    `;
    startBtn.tabIndex = 0;
    startBtn.addEventListener('click', () => {
      if (this._running) this.pause();
      else this.start();
    });

    const resetBtn = document.createElement('button');
    resetBtn.id = 'work-energy-reset-btn';
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
    this._controlElements.push(btnFrictionless);
    this._controlElements.push(btnHighFriction);
    this._controlElements.push(btnStiffSpring);

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

    // Real-Time Graph Section with Tabs
    const graphHeader = document.createElement('div');
    graphHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-top: 6px;';

    const graphTitle = document.createElement('div');
    graphTitle.textContent = 'REAL-TIME GRAPHS';
    graphTitle.style.cssText = `
      font-size: 11px; font-weight: 700; letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.4);
    `;
    graphHeader.appendChild(graphTitle);

    // Tab buttons
    const tabRow = document.createElement('div');
    tabRow.style.cssText = 'display: flex; gap: 4px;';

    const tabs: { id: GraphTab; label: string }[] = [
      { id: 'energy', label: 'Energy' },
      { id: 'power', label: 'Power' },
      { id: 'kinematics', label: 'Kin' },
    ];

    tabs.forEach((tab) => {
      const tabBtn = document.createElement('button');
      tabBtn.id = `graph-tab-${tab.id}`;
      tabBtn.textContent = tab.label;
      tabBtn.style.cssText = `
        padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;
        cursor: pointer; border: 1px solid ${tab.id === this._activeTab ? '#38BDF8' : 'rgba(255,255,255,0.1)'};
        background: ${tab.id === this._activeTab ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)'};
        color: ${tab.id === this._activeTab ? '#38BDF8' : '#94A3B8'};
      `;
      tabBtn.addEventListener('click', () => {
        this._setGraphTab(tab.id);
      });
      tabRow.appendChild(tabBtn);
    });

    graphHeader.appendChild(tabRow);
    panel.appendChild(graphHeader);

    // Graph Containers
    const graphsWrapper = document.createElement('div');
    graphsWrapper.style.cssText = 'width: 100%; display: flex; justify-content: center; position: relative;';

    // 1. Energy Graph
    const energyContainer = document.createElement('div');
    energyContainer.style.cssText = 'width: 100%; display: block;';
    this._energyGraph = new Graph(energyContainer, 302, 130, 'Time (s)', 'Energy (J)');
    this._seriesK = this._energyGraph.addSeries('K (J)', '#38BDF8');
    this._seriesUg = this._energyGraph.addSeries('Ug (J)', '#10B981');
    this._seriesUs = this._energyGraph.addSeries('Us (J)', '#F59E0B');
    this._seriesEtot = this._energyGraph.addSeries('E_tot (J)', '#E2E8F0');
    graphsWrapper.appendChild(energyContainer);
    this._graphContainers.energy = energyContainer;

    // 2. Power Graph
    const powerContainer = document.createElement('div');
    powerContainer.style.cssText = 'width: 100%; display: none;';
    this._powerGraph = new Graph(powerContainer, 302, 130, 'Time (s)', 'Power (W)');
    this._seriesPinst = this._powerGraph.addSeries('P_inst (W)', '#EC4899');
    this._seriesPavg = this._powerGraph.addSeries('P_avg (W)', '#A855F7');
    graphsWrapper.appendChild(powerContainer);
    this._graphContainers.power = powerContainer;

    // 3. Kinematics Graph
    const kinematicsContainer = document.createElement('div');
    kinematicsContainer.style.cssText = 'width: 100%; display: none;';
    this._kinematicsGraph = new Graph(kinematicsContainer, 302, 130, 'Time (s)', 'Kinematics');
    this._seriesV = this._kinematicsGraph.addSeries('v (m/s)', '#38BDF8');
    this._seriesA = this._kinematicsGraph.addSeries('a (m/s²)', '#34D399');
    graphsWrapper.appendChild(kinematicsContainer);
    this._graphContainers.kinematics = kinematicsContainer;

    panel.appendChild(graphsWrapper);

    return panel;
  }

  private _setGraphTab(tab: GraphTab): void {
    this._activeTab = tab;
    // Update tab button styles
    (['energy', 'power', 'kinematics'] as GraphTab[]).forEach((t) => {
      const btn = document.getElementById(`graph-tab-${t}`);
      const container = this._graphContainers[t];
      if (btn) {
        btn.style.borderColor = t === tab ? '#38BDF8' : 'rgba(255,255,255,0.1)';
        btn.style.backgroundColor = t === tab ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)';
        btn.style.color = t === tab ? '#38BDF8' : '#94A3B8';
      }
      if (container) {
        container.style.display = t === tab ? 'block' : 'none';
      }
    });
  }

  private _createParamControl(param: ParameterDef, index: number): HTMLElement {
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
      font-size: 14px; color: rgba(56, 189, 248, 0.85);
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
      font-size: 14px; color: rgba(56, 189, 248, 0.85);
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

    if (param.step < 1) {
      nextVal = Math.round(nextVal * 100) / 100;
    }

    (this._params as unknown as Record<string, number>)[param.key] = nextVal;

    // Maintain physical friction coupling constraint: μs >= μk
    if (param.key === 'kineticFriction') {
      if (this._params.kineticFriction > this._params.staticFriction) {
        this._params.staticFriction = this._params.kineticFriction;
      }
    } else if (param.key === 'staticFriction') {
      if (this._params.staticFriction < this._params.kineticFriction) {
        this._params.kineticFriction = this._params.staticFriction;
      }
    }

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
        el.style.borderColor = '#0284c7';
        el.style.backgroundColor = 'rgba(2, 132, 199, 0.15)';
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
        } else if (this._focusedControl === PARAMETERS.length + 2) {
          // Preset 1: Frictionless
          this._params.kineticFriction = 0;
          this._params.staticFriction = 0;
          this._params.springConstant = 50;
          this._updateParamDisplays();
          this._resetPhysics();
        } else if (this._focusedControl === PARAMETERS.length + 3) {
          // Preset 2: High friction
          this._params.kineticFriction = 0.15;
          this._params.staticFriction = 0.20;
          this._params.springConstant = 40;
          this._updateParamDisplays();
          this._resetPhysics();
        } else if (this._focusedControl === PARAMETERS.length + 4) {
          // Preset 3: Stiff spring
          this._params.springConstant = 80;
          this._updateParamDisplays();
          this._resetPhysics();
        }
        break;
      case 'space':
        if (this._running) this.pause();
        else this.start();
        break;
      case 'back':
        // Host handling
        break;
    }
  }

  private _resizeCanvas(): void {
    if (!this._canvas || !this._canvas.parentElement) return;
    const rect = this._canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this._canvas.width = Math.max(300, Math.floor(rect.width * dpr));
    this._canvas.height = Math.max(200, Math.floor(rect.height * dpr));
    this._camera.resize(this._canvas.width / dpr, this._canvas.height / dpr);
    this._render();
  }

  start(): void {
    if (this._currentState.status === 'exceeded') {
      this.reset();
    }
    this._running = true;
    this._clock.start();

    const startBtn = document.getElementById('work-energy-start-btn');
    if (startBtn) {
      startBtn.textContent = 'Pause';
      startBtn.style.backgroundColor = '#d97706';
    }
    this._statusPill.textContent = 'Running';
    this._statusPill.style.color = '#34D399';
    this._statusPill.style.borderColor = 'rgba(52, 211, 153, 0.4)';
  }

  pause(): void {
    this._running = false;
    this._clock.pause();

    const startBtn = document.getElementById('work-energy-start-btn');
    if (startBtn) {
      startBtn.textContent = 'Resume';
      startBtn.style.backgroundColor = '#0284c7';
    }
    if (this._currentState.status === 'exceeded') {
      this._statusPill.textContent = 'Limit Reached';
      this._statusPill.style.color = '#EF4444';
      this._statusPill.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    } else {
      this._statusPill.textContent = 'Paused';
      this._statusPill.style.color = '#FBBF24';
      this._statusPill.style.borderColor = 'rgba(251, 191, 36, 0.4)';
    }
  }

  reset(): void {
    this.pause();
    this._clock.reset();
    this._currentState = createInitialWorkEnergyState(this._params);

    if (this._energyGraph) this._energyGraph.clear();
    if (this._powerGraph) this._powerGraph.clear();
    if (this._kinematicsGraph) this._kinematicsGraph.clear();

    const startBtn = document.getElementById('work-energy-start-btn');
    if (startBtn) {
      startBtn.textContent = 'Start';
      startBtn.style.backgroundColor = '#0284c7';
    }
    this._statusPill.textContent = 'Ready';
    this._statusPill.style.color = '#38BDF8';
    this._statusPill.style.borderColor = 'rgba(56, 189, 248, 0.3)';

    this._updateMeasurementPanel();
  }

  private _resetPhysics(): void {
    if (!this._running) {
      this._currentState = createInitialWorkEnergyState(this._params);
      this._updateMeasurementPanel();
    }
  }

  tick(timestamp: number): void {
    if (this._running) {
      const fixedSteps = this._clock.tick(timestamp);
      for (let i = 0; i < fixedSteps; i++) {
        this._currentState = stepWorkEnergy(
          this._currentState,
          this._params,
          this._clock.fixedDt
        );

        // Sample data for graphs every ~0.04s
        if (this._clock.elapsed % 0.04 < this._clock.fixedDt) {
          const t = this._clock.elapsed;
          if (this._energyGraph) {
            const ledger = computeWorkEnergyLedger(this._params, this._currentState);
            this._energyGraph.pushData(this._seriesK, t, ledger.kineticEnergy);
            this._energyGraph.pushData(this._seriesUg, t, ledger.gravitationalPE);
            this._energyGraph.pushData(this._seriesUs, t, ledger.elasticPE);
            this._energyGraph.pushData(this._seriesEtot, t, ledger.totalEnergy);
          }
          if (this._powerGraph) {
            const power = computeWorkEnergyPower(this._params, this._currentState);
            this._powerGraph.pushData(this._seriesPinst, t, power.powerNet);
            this._powerGraph.pushData(this._seriesPavg, t, power.avgPowerNet);
          }
          if (this._kinematicsGraph) {
            this._kinematicsGraph.pushData(this._seriesV, t, this._currentState.velocity);
            const curForces = computeWorkEnergyForces(this._params, this._currentState);
            this._kinematicsGraph.pushData(this._seriesA, t, curForces.acceleration);
          }
        }

        if (this._currentState.status === 'exceeded') {
          this.pause();
          break;
        }
      }
      this._updateMeasurementPanel();
    }

    this._render();
    this._rafId = requestAnimationFrame(this._boundTick);
  }

  private _render(): void {
    if (!this._canvas || !this._ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = this._canvas.width / dpr;
    const h = this._canvas.height / dpr;

    this._ctx.save();
    this._ctx.scale(dpr, dpr);

    renderWorkEnergyApparatus(
      this._ctx,
      this._camera,
      this._params,
      this._currentState,
      w,
      h
    );

    this._ctx.restore();

    // Render active graph
    if (this._activeTab === 'energy' && this._energyGraph) {
      this._energyGraph.render();
    } else if (this._activeTab === 'power' && this._powerGraph) {
      this._powerGraph.render();
    } else if (this._activeTab === 'kinematics' && this._kinematicsGraph) {
      this._kinematicsGraph.render();
    }
  }

  private _updateMeasurementPanel(): void {
    if (!this._measurePanel) return;

    const s = this._currentState;
    const p = this._params;
    const forces = computeWorkEnergyForces(p, s);
    const ledger = computeWorkEnergyLedger(p, s);
    const work = computeWorkBreakdown(p, s);
    const power = computeWorkEnergyPower(p, s);

    const isContact = s.displacement >= WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS;
    const springInteractionText = isContact
      ? `Compression x = ${(s.displacement - WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS).toFixed(2)} m`
      : `Free Flight (${(WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS - s.displacement).toFixed(2)}m to spring)`;

    const totalPct = (
      (ledger.totalEnergy / Math.max(0.01, ledger.initialEnergy)) *
      100
    ).toFixed(1);

    const measurements = [
      { label: 'Time (t)', value: `${this._clock.elapsed.toFixed(2)} s` },
      { label: 'Displacement (s)', value: `${s.displacement.toFixed(2)} m` },
      { label: 'Spring State', value: springInteractionText },
      { label: 'Velocity (v)', value: `${s.velocity.toFixed(2)} m/s` },
      { label: 'Acceleration (a)', value: `${forces.acceleration.toFixed(2)} m/s²` },
      { label: '─', value: '' },
      { label: 'Kinetic Energy (K)', value: `${ledger.kineticEnergy.toFixed(1)} J` },
      { label: 'Gravitational PE (Ug)', value: `${ledger.gravitationalPE.toFixed(1)} J` },
      { label: 'Elastic PE (Us)', value: `${ledger.elasticPE.toFixed(1)} J` },
      { label: 'Thermal Dissipation (Q)', value: `${ledger.thermalEnergy.toFixed(1)} J` },
      { label: 'Total Energy (E_tot)', value: `${ledger.totalEnergy.toFixed(1)} J (${totalPct}%)` },
      { label: '─', value: '' },
      { label: 'Work by Gravity (Wg)', value: `${work.workGravity.toFixed(1)} J` },
      { label: 'Work by Spring (Ws)', value: `${work.workSpring.toFixed(1)} J` },
      { label: 'Work by Friction (Wf)', value: `${work.workFriction.toFixed(1)} J` },
      { label: 'Net Work (W_net)', value: `${work.workNet.toFixed(1)} J` },
      { label: '─', value: '' },
      { label: 'Instantaneous Power (P)', value: `${power.powerNet.toFixed(1)} W` },
      { label: 'Average Power (P_avg)', value: `${power.avgPowerNet.toFixed(1)} W` },
      { label: '─', value: '' },
      {
        label: 'Motion Status',
        value:
          s.status === 'exceeded'
            ? '⚠️ Solid Height Limit'
            : s.status === 'at_rest'
            ? '🔒 Static Equilibrium (At Rest)'
            : Math.abs(s.velocity) < 0.02
            ? 'Turnaround / Rest'
            : s.velocity > 0
            ? 'Downhill Slide ↘'
            : 'Uphill Rebound ↖',
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
        m.label.startsWith('Total Energy') || m.label.startsWith('Net Work')
          ? '#FDE047'
          : 'rgba(255, 255, 255, 0.6)';
      label.style.fontWeight =
        m.label.startsWith('Total Energy') || m.label.startsWith('Net Work') ? '700' : '400';

      const value = document.createElement('span');
      value.textContent = m.value;
      value.style.color =
        m.label.startsWith('Total Energy')
          ? '#38BDF8'
          : m.label.startsWith('Net Work')
          ? '#34D399'
          : '#ffffff';
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

    if (this._energyGraph) {
      this._energyGraph.dispose();
      this._energyGraph = null;
    }
    if (this._powerGraph) {
      this._powerGraph.dispose();
      this._powerGraph = null;
    }
    if (this._kinematicsGraph) {
      this._kinematicsGraph.dispose();
      this._kinematicsGraph = null;
    }

    if (this._container) {
      this._container.innerHTML = '';
    }
  }
}
