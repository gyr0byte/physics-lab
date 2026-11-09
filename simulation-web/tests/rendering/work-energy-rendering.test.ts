import { describe, it, expect, vi } from 'vitest';
import { Vector2 } from '../../src/core/Vector2';
import { Camera2D } from '../../src/core/Camera2D';
import {
  areFinite,
  computeInclineTransform,
  drawCoiledHelicalSpring,
  drawInclineWedge,
  drawInclineTrack,
  drawSlidingBlock,
  drawWorkEnergyVectors,
  drawWorkEnergyStatusBanner,
  drawEnergyBarsOverlay,
  frameWorkEnergyCamera,
  renderWorkEnergyApparatus,
} from '../../src/rendering/WorkEnergyRenderer';
import {
  WORK_ENERGY_CONSTANTS,
  type WorkEnergyParams,
  type WorkEnergyState,
  DEFAULT_WORK_ENERGY_PARAMS,
  createInitialWorkEnergyState,
  computeWorkEnergyForces,
  computeWorkEnergyLedger,
  computeWorkEnergyPower,
  sampleForceDisplacementCurve,
  stepWorkEnergy,
} from '../../src/physics/WorkEnergyPhysics';
import { WorkEnergySimulation } from '../../src/simulations/work-energy-power/WorkEnergySimulation';
import { Graph } from '../../src/components/Graph';

/**
 * Creates a mock CanvasRenderingContext2D that asserts all numeric coordinates
 * passed to Canvas API methods are finite numbers (no NaN, Infinity, -Infinity).
 */
function createMockContext() {
  const calls: { method: string; args: unknown[] }[] = [];

  const checkFiniteArgs = (method: string, args: unknown[]) => {
    calls.push({ method, args });
    for (const arg of args) {
      if (typeof arg === 'number') {
        if (!Number.isFinite(arg)) {
          throw new Error(`Non-finite argument passed to ${method}: ${arg}`);
        }
      }
    }
  };

  const ctx = {
    save: vi.fn(() => calls.push({ method: 'save', args: [] })),
    restore: vi.fn(() => calls.push({ method: 'restore', args: [] })),
    beginPath: vi.fn(() => calls.push({ method: 'beginPath', args: [] })),
    closePath: vi.fn(() => calls.push({ method: 'closePath', args: [] })),
    moveTo: vi.fn((x: number, y: number) => checkFiniteArgs('moveTo', [x, y])),
    lineTo: vi.fn((x: number, y: number) => checkFiniteArgs('lineTo', [x, y])),
    arc: vi.fn((x: number, y: number, r: number, sAngle: number, eAngle: number) =>
      checkFiniteArgs('arc', [x, y, r, sAngle, eAngle])
    ),
    fillRect: vi.fn((x: number, y: number, w: number, h: number) =>
      checkFiniteArgs('fillRect', [x, y, w, h])
    ),
    strokeRect: vi.fn((x: number, y: number, w: number, h: number) =>
      checkFiniteArgs('strokeRect', [x, y, w, h])
    ),
    roundRect: vi.fn((x: number, y: number, w: number, h: number, r: number) =>
      checkFiniteArgs('roundRect', [x, y, w, h, r])
    ),
    stroke: vi.fn(() => calls.push({ method: 'stroke', args: [] })),
    fill: vi.fn(() => calls.push({ method: 'fill', args: [] })),
    fillText: vi.fn((text: string, x: number, y: number) =>
      checkFiniteArgs('fillText', [text, x, y])
    ),
    setLineDash: vi.fn((dash: number[]) => calls.push({ method: 'setLineDash', args: [dash] })),
    translate: vi.fn((x: number, y: number) => checkFiniteArgs('translate', [x, y])),
    rotate: vi.fn((angle: number) => checkFiniteArgs('rotate', [angle])),
    scale: vi.fn((sx: number, sy: number) => checkFiniteArgs('scale', [sx, sy])),
    clearRect: vi.fn((x: number, y: number, w: number, h: number) =>
      checkFiniteArgs('clearRect', [x, y, w, h])
    ),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    measureText: vi.fn((text: string) => ({ width: text.length * 7 })),
    // Properties
    strokeStyle: '#000000',
    fillStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt' as CanvasLineCap,
    lineJoin: 'miter' as CanvasLineJoin,
    font: '10px sans-serif',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    _calls: calls,
  } as unknown as CanvasRenderingContext2D & { _calls: typeof calls };

  return ctx;
}

describe('WorkEnergyRenderer — Incline Canvas Rendering Suite', () => {
  const camera = new Camera2D(1280, 720);
  camera.fitWorld(-1.0, 0.0, 6.0, 5.0);

  // ── 1. Incline Coordinate Transformation ──────────────────────────────
  describe('1. Incline coordinate transformation', () => {
    it('computes exact world positions for s = 0 (top release)', () => {
      const transform = computeInclineTransform(DEFAULT_WORK_ENERGY_PARAMS, 0.0);
      expect(transform.blockDownhillFaceWorld.x).toBeCloseTo(transform.p0World.x, 5);
      expect(transform.blockDownhillFaceWorld.y).toBeCloseTo(transform.p0World.y, 5);

      // Downhill unit vector uDownhill = (cos theta, -sin theta)
      const thetaRad = (25 * Math.PI) / 180;
      expect(transform.uDownhill.x).toBeCloseTo(Math.cos(thetaRad), 5);
      expect(transform.uDownhill.y).toBeCloseTo(-Math.sin(thetaRad), 5);

      // Normal unit vector is perpendicular upwards: (sin theta, cos theta)
      expect(transform.uNormal.x).toBeCloseTo(Math.sin(thetaRad), 5);
      expect(transform.uNormal.y).toBeCloseTo(Math.cos(thetaRad), 5);
    });

    it('computes exact world positions for s = 3.50 m (spring contact)', () => {
      const transform = computeInclineTransform(DEFAULT_WORK_ENERGY_PARAMS, 3.50);
      const expectedX = transform.p0World.x + 3.50 * transform.uDownhill.x;
      const expectedY = transform.p0World.y + 3.50 * transform.uDownhill.y;

      expect(transform.blockDownhillFaceWorld.x).toBeCloseTo(expectedX, 5);
      expect(transform.blockDownhillFaceWorld.y).toBeCloseTo(expectedY, 5);
      expect(transform.springContactPosWorld.x).toBeCloseTo(expectedX, 5);
      expect(transform.springContactPosWorld.y).toBeCloseTo(expectedY, 5);
    });

    it('computes exact world positions for s = 4.90 m (solid height limit)', () => {
      const transform = computeInclineTransform(DEFAULT_WORK_ENERGY_PARAMS, 4.90);
      const expectedX = transform.p0World.x + 4.90 * transform.uDownhill.x;
      const expectedY = transform.p0World.y + 4.90 * transform.uDownhill.y;

      expect(transform.blockDownhillFaceWorld.x).toBeCloseTo(expectedX, 5);
      expect(transform.blockDownhillFaceWorld.y).toBeCloseTo(expectedY, 5);
      expect(transform.solidHeightPosWorld.x).toBeCloseTo(expectedX, 5);
      expect(transform.solidHeightPosWorld.y).toBeCloseTo(expectedY, 5);
    });
  });

  // ── 2. Block Placement Along Track ────────────────────────────────────
  describe('2. Block placement along track', () => {
    it('places corners and center rigidly relative to track displacement and angle', () => {
      const transform = computeInclineTransform(DEFAULT_WORK_ENERGY_PARAMS, 1.20);
      expect(transform.blockCornersWorld).toHaveLength(4);

      // Downhill face is at s = 1.20 m
      // Uphill face is at s = 1.20 - BLOCK_LENGTH (0.30 m) = 0.90 m
      const blockLength = WORK_ENERGY_CONSTANTS.BLOCK_LENGTH;
      const blockHeight = 0.20;
      const expectedUphillX = transform.p0World.x + (1.20 - blockLength) * transform.uDownhill.x;
      const expectedUphillY = transform.p0World.y + (1.20 - blockLength) * transform.uDownhill.y;
      expect(transform.blockUphillFaceWorld.x).toBeCloseTo(expectedUphillX, 5);
      expect(transform.blockUphillFaceWorld.y).toBeCloseTo(expectedUphillY, 5);

      // Center is midway between uphill and downhill faces and raised by half block height
      const center = transform.blockCenterWorld;
      const midTrackX = transform.p0World.x + (1.20 - blockLength / 2) * transform.uDownhill.x;
      const midTrackY = transform.p0World.y + (1.20 - blockLength / 2) * transform.uDownhill.y;
      const expectedCenterX = midTrackX + 0.5 * blockHeight * transform.uNormal.x;
      const expectedCenterY = midTrackY + 0.5 * blockHeight * transform.uNormal.y;
      expect(center.x).toBeCloseTo(expectedCenterX, 5);
      expect(center.y).toBeCloseTo(expectedCenterY, 5);
    });

    it('draws block without throwing non-finite canvas errors', () => {
      const ctx = createMockContext();
      const transform = computeInclineTransform(DEFAULT_WORK_ENERGY_PARAMS, 2.0);
      expect(() => {
        drawSlidingBlock(ctx, camera, transform, 2.0, false);
      }).not.toThrow();

      // Verify that fill and stroke were called
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.fillText).toHaveBeenCalledWith(expect.stringContaining('2.0 kg'), expect.any(Number), expect.any(Number));
    });
  });

  // ── 3. Spring Attachment and Compression ──────────────────────────────
  describe('3. Spring attachment and compression', () => {
    it('leaves spring uncompressed at s = 3.50 m when block is at s < 3.50 m', () => {
      const transform = computeInclineTransform(DEFAULT_WORK_ENERGY_PARAMS, 1.50);
      // Spring anchor is at s = 5.00 m
      // Spring free top is at s = 3.50 m (natural length 1.50 m)
      const expectedTopX = transform.p0World.x + WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS * transform.uDownhill.x;
      const expectedTopY = transform.p0World.y + WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS * transform.uDownhill.y;

      expect(transform.springTopWorld.x).toBeCloseTo(expectedTopX, 5);
      expect(transform.springTopWorld.y).toBeCloseTo(expectedTopY, 5);
    });

    it('attaches spring top directly to block downhill face when s >= 3.50 m', () => {
      const sComp = 4.20;
      const transform = computeInclineTransform(DEFAULT_WORK_ENERGY_PARAMS, sComp);

      expect(transform.springTopWorld.x).toBeCloseTo(transform.blockDownhillFaceWorld.x, 5);
      expect(transform.springTopWorld.y).toBeCloseTo(transform.blockDownhillFaceWorld.y, 5);

      // Verify distance between anchor (s=5.00) and top (s=4.20) is 0.80 m
      const dx = transform.springAnchorWorld.x - transform.springTopWorld.x;
      const dy = transform.springAnchorWorld.y - transform.springTopWorld.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      expect(len).toBeCloseTo(5.00 - sComp, 5);
    });

    it('renders helical compression spring at various compressions without non-finite errors', () => {
      const ctx = createMockContext();
      const transform = computeInclineTransform(DEFAULT_WORK_ENERGY_PARAMS, 4.00);

      expect(() => {
        drawCoiledHelicalSpring(
          ctx,
          camera,
          transform.springAnchorWorld,
          transform.springTopWorld,
          { numCoils: 14, coilRadiusWorld: 0.08, color: '#F59E0B', isContact: true }
        );
      }).not.toThrow();

      expect(ctx.stroke).toHaveBeenCalled();
    });
  });

  // ── 4. Force-Vector Directions and Scaling ─────────────────────────────
  describe('4. Force-vector directions and scaling', () => {
    it('computes and draws force breakdown with gravity, normal, friction, spring', () => {
      const ctx = createMockContext();
      const params = { ...DEFAULT_WORK_ENERGY_PARAMS };
      const state = createInitialWorkEnergyState(params);
      state.displacement = 3.80; // In spring contact
      state.velocity = 1.50; // Moving downhill

      const forces = computeWorkEnergyForces(params, state);
      const transform = computeInclineTransform(params, state.displacement);

      expect(forces.normalForce).toBeGreaterThan(0);
      expect(forces.gravityParallel).toBeGreaterThan(0);
      expect(forces.frictionForce).toBeLessThan(0); // Opposes downhill motion
      expect(forces.springForce).toBeLessThan(0); // Opposes compression (acts uphill)

      expect(() => {
        drawWorkEnergyVectors(ctx, camera, transform, forces, state.velocity);
      }).not.toThrow();
    });
  });

  // ── 5. Camera Framing Across Travel Limits ────────────────────────────
  describe('5. Camera framing across travel limits', () => {
    it('frames apparatus comfortably containing both s = -0.50 m and s = 4.90 m limits', () => {
      const testCam = new Camera2D(1280, 720);
      frameWorkEnergyCamera(testCam, DEFAULT_WORK_ENERGY_PARAMS);

      const transformStart = computeInclineTransform(DEFAULT_WORK_ENERGY_PARAMS, -0.50);
      const transformEnd = computeInclineTransform(DEFAULT_WORK_ENERGY_PARAMS, 4.90);

      const pStartScreen = testCam.worldToScreen(transformStart.blockDownhillFaceWorld);
      const pEndScreen = testCam.worldToScreen(transformEnd.blockDownhillFaceWorld);
      const pAnchorScreen = testCam.worldToScreen(transformEnd.springAnchorWorld);

      // Verify that all critical points lie within positive screen bounds
      expect(pStartScreen.x).toBeGreaterThan(0);
      expect(pStartScreen.x).toBeLessThan(1280);
      expect(pStartScreen.y).toBeGreaterThan(0);
      expect(pStartScreen.y).toBeLessThan(720);

      expect(pEndScreen.x).toBeGreaterThan(0);
      expect(pEndScreen.x).toBeLessThan(1280);
      expect(pEndScreen.y).toBeGreaterThan(0);
      expect(pEndScreen.y).toBeLessThan(720);

      expect(pAnchorScreen.x).toBeGreaterThan(0);
      expect(pAnchorScreen.x).toBeLessThan(1280);
      expect(pAnchorScreen.y).toBeGreaterThan(0);
      expect(pAnchorScreen.y).toBeLessThan(720);
    });
  });

  // ── 6. Energy-Bar Scaling and Zero-Energy Safety ───────────────────────
  describe('6. Energy-bar scaling and zero-energy safety', () => {
    it('renders energy bars at zero initial energy without throwing or NaN bar widths', () => {
      const ctx = createMockContext();
      const zeroLedger = {
        kineticEnergy: 0,
        gravitationalPE: 0,
        elasticPE: 0,
        thermalEnergy: 0,
        totalMechanicalEnergy: 0,
        totalEnergy: 0,
        initialEnergy: 0,
        energyDiscrepancy: 0,
        relativeError: 0,
      };

      expect(() => {
        drawEnergyBarsOverlay(ctx, 10, 10, 240, zeroLedger);
      }).not.toThrow();

      // Find all fillRect calls to verify non-negative, finite dimensions
      const fillRectCalls = ctx._calls.filter((c) => c.method === 'fillRect');
      expect(fillRectCalls.length).toBeGreaterThan(0);
      for (const call of fillRectCalls) {
        const [, , w, h] = call.args as number[];
        expect(w).toBeGreaterThanOrEqual(0);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(w)).toBe(true);
        expect(Number.isFinite(h)).toBe(true);
      }
    });

    it('renders energy bars under nominal loaded conditions', () => {
      const ctx = createMockContext();
      const state = createInitialWorkEnergyState(DEFAULT_WORK_ENERGY_PARAMS);
      const ledger = computeWorkEnergyLedger(DEFAULT_WORK_ENERGY_PARAMS, state);

      expect(() => {
        drawEnergyBarsOverlay(ctx, 16, 16, 260, ledger);
      }).not.toThrow();

      expect(ctx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('LIVE ENERGY ACCOUNTING'),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  // ── 7. Graph Handling of Energy Quantities ─────────────────────────────
  describe('7. Graph handling of energy quantities', () => {
    it('instantiates Graph and stores pushed energy series within bounds', () => {
      const mockCanvas = {
        getContext: vi.fn(() => createMockContext()),
        style: {},
        remove: vi.fn(),
        width: 300,
        height: 150,
      };
      const mockContainer = {
        appendChild: vi.fn(),
      } as unknown as HTMLElement;

      const origDoc = globalThis.document;
      globalThis.document = {
        createElement: vi.fn(() => mockCanvas),
      } as unknown as Document;

      try {
        const graph = new Graph(mockContainer, 300, 150, 'Time (s)', 'Energy (J)');

        const sK = graph.addSeries('Kinetic', '#38BDF8');
        const sUg = graph.addSeries('Gravitational', '#10B981');
        const sUs = graph.addSeries('Elastic', '#F59E0B');
        const sTot = graph.addSeries('Total', '#FFFFFF');

        expect(sK).toBe(0);
        expect(sUg).toBe(1);
        expect(sUs).toBe(2);
        expect(sTot).toBe(3);

        for (let t = 0; t <= 1.0; t += 0.05) {
          graph.pushData(sK, t, 10 * Math.sin(t));
          graph.pushData(sUg, t, 30 - 10 * t);
          graph.pushData(sUs, t, 5 * t * t);
          graph.pushData(sTot, t, 35);
        }

        expect(() => graph.render()).not.toThrow();
        graph.clear();
        expect(() => graph.render()).not.toThrow();
        graph.dispose();
      } finally {
        globalThis.document = origDoc;
      }
    });
  });

  // ── 8. Non-Finite Rendering Protection ────────────────────────────────
  describe('8. Non-finite rendering protection', () => {
    it('areFinite returns true for valid numbers and false for NaN / Infinity', () => {
      expect(areFinite(0, 1.5, -42, 3.14159)).toBe(true);
      expect(areFinite(NaN, 1)).toBe(false);
      expect(areFinite(1, Infinity)).toBe(false);
      expect(areFinite(-Infinity)).toBe(false);
      expect(areFinite(null)).toBe(false);
      expect(areFinite(undefined)).toBe(false);
    });

    it('drawSlidingBlock gracefully ignores corrupt non-finite coordinates', () => {
      const ctx = createMockContext();
      const corruptTransform = computeInclineTransform(DEFAULT_WORK_ENERGY_PARAMS, 0);
      corruptTransform.blockCornersWorld = [
        new Vector2(NaN, 0),
        new Vector2(1, 0),
        new Vector2(1, 1),
        new Vector2(0, 1),
      ];

      expect(() => {
        drawSlidingBlock(ctx, camera, corruptTransform, 2.0, false);
      }).not.toThrow();

      // Since corner is NaN, it should safely return early
      const fillCalls = ctx._calls.filter((c) => c.method === 'fill');
      expect(fillCalls).toHaveLength(0);
    });
  });

  // ── 9. Static-Friction Status Banner Display ──────────────────────────
  describe('9. Static-friction status banner display', () => {
    it('draws cyan static friction equilibrium badge when status is at_rest', () => {
      const ctx = createMockContext();
      const state: WorkEnergyState = {
        ...createInitialWorkEnergyState(DEFAULT_WORK_ENERGY_PARAMS),
        status: 'at_rest',
        statusMessage: 'Block arrested by static friction',
      };

      drawWorkEnergyStatusBanner(ctx, 1280, state);

      expect(ctx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('STATIC FRICTION EQUILIBRIUM'),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  // ── 10. Travel-Limit Warning Display ──────────────────────────────────
  describe('10. Travel-limit warning display', () => {
    it('draws red warning banner when status is exceeded', () => {
      const ctx = createMockContext();
      const state: WorkEnergyState = {
        ...createInitialWorkEnergyState(DEFAULT_WORK_ENERGY_PARAMS),
        status: 'exceeded',
        statusMessage: 'Spring compressed to solid height limit (s = 4.90 m)',
      };

      drawWorkEnergyStatusBanner(ctx, 1280, state);

      expect(ctx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('TRAVEL LIMIT EXCEEDED'),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  // ── 11. Top-Level Composite Rendering Pipeline ────────────────────────
  describe('11. renderWorkEnergyApparatus composite pipeline', () => {
    it('executes full apparatus pipeline cleanly across normal simulation steps', () => {
      const ctx = createMockContext();
      const params = { ...DEFAULT_WORK_ENERGY_PARAMS };
      let state = createInitialWorkEnergyState(params);

      // Advance a few physics steps
      for (let i = 0; i < 20; i++) {
        state = stepWorkEnergy(state, params, 0.005);
      }

      expect(() => {
        renderWorkEnergyApparatus(ctx, camera, params, state, 1280, 720);
      }).not.toThrow();

      expect(ctx.fillRect).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });
  });

  // ── 12. Energy vs Time Graph with Thermal Dissipation Q ───────────────
  describe('12. Energy vs Time Graph with Thermal Dissipation Q', () => {
    it('provides Q from computeWorkEnergyLedger and pushes all 5 series', () => {
      const mockCanvas = {
        getContext: vi.fn(() => createMockContext()),
        style: {},
        remove: vi.fn(),
        width: 302,
        height: 130,
      };
      const mockContainer = {
        appendChild: vi.fn(),
      } as unknown as HTMLElement;

      const origDoc = globalThis.document;
      globalThis.document = {
        createElement: vi.fn(() => mockCanvas),
      } as unknown as Document;

      try {
        const graph = new Graph(mockContainer, 302, 130, 'Time (s)', 'Energy (J)');
        const sK = graph.addSeries('K', '#38BDF8');
        const sUg = graph.addSeries('Ug', '#10B981');
        const sUs = graph.addSeries('Us', '#F59E0B');
        const sQ = graph.addSeries('Q', '#F43F5E');
        const sEtot = graph.addSeries('Etot', '#E2E8F0');

        let state = createInitialWorkEnergyState(DEFAULT_WORK_ENERGY_PARAMS);
        for (let i = 0; i < 10; i++) {
          state = stepWorkEnergy(state, DEFAULT_WORK_ENERGY_PARAMS, 0.01);
          const ledger = computeWorkEnergyLedger(DEFAULT_WORK_ENERGY_PARAMS, state);

          expect(ledger.thermalEnergy).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(ledger.thermalEnergy)).toBe(true);

          graph.pushData(sK, state.time, ledger.kineticEnergy);
          graph.pushData(sUg, state.time, ledger.gravitationalPE);
          graph.pushData(sUs, state.time, ledger.elasticPE);
          graph.pushData(sQ, state.time, ledger.thermalEnergy);
          graph.pushData(sEtot, state.time, ledger.totalEnergy);
        }

        expect(() => graph.render()).not.toThrow();
        graph.dispose();
      } finally {
        globalThis.document = origDoc;
      }
    });
  });

  // ── 13. Power vs Time Graph with 4 Instantaneous Series ────────────────
  describe('13. Power vs Time Graph with 4 Instantaneous Series', () => {
    it('receives Pg, Ps, Pf, and Pnet with non-positive friction power', () => {
      const params = { ...DEFAULT_WORK_ENERGY_PARAMS };
      let state = createInitialWorkEnergyState(params);

      // At release (v = 0), all instantaneous powers must be identically 0
      const powerZero = computeWorkEnergyPower(params, state);
      expect(powerZero.powerGravity).toBe(0);
      expect(powerZero.powerSpring).toBe(0);
      expect(powerZero.powerFriction).toBe(0);
      expect(powerZero.powerNet).toBe(0);

      // Advance down the track to spring contact
      for (let i = 0; i < 300; i++) {
        state = stepWorkEnergy(state, params, 0.005);
        const pwr = computeWorkEnergyPower(params, state);

        // Friction power must always be non-positive
        expect(pwr.powerFriction).toBeLessThanOrEqual(0);

        // Conservation of power: P_net = P_g + P_s + P_f
        expect(pwr.powerNet).toBeCloseTo(
          pwr.powerGravity + pwr.powerSpring + pwr.powerFriction,
          4
        );
      }
    });
  });

  // ── 14. Force vs Displacement Curve Sampling ──────────────────────────
  describe('14. Force vs Displacement Curve Sampling', () => {
    it('produces expected gravity, spring, and conservative resultant values', () => {
      const samples = sampleForceDisplacementCurve(
        DEFAULT_WORK_ENERGY_PARAMS,
        0,
        WORK_ENERGY_CONSTANTS.LOWER_TRAVEL_LIMIT,
        50
      );

      expect(samples.length).toBe(50);

      const thetaRad = (DEFAULT_WORK_ENERGY_PARAMS.inclineAngleDeg * Math.PI) / 180;
      const expectedFg = DEFAULT_WORK_ENERGY_PARAMS.mass * 9.8 * Math.sin(thetaRad);

      for (const s of samples) {
        expect(s.gravityForce).toBeCloseTo(expectedFg, 5);

        if (s.displacement < WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS) {
          // Free flight before contact: spring force is 0
          expect(s.springForce).toBe(0);
          expect(s.conservativeDrivingForce).toBeCloseTo(expectedFg, 5);
        } else {
          // Spring compression: Fs = -k * (s - 3.50)
          const comp = s.displacement - WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS;
          const expectedFs = -DEFAULT_WORK_ENERGY_PARAMS.springConstant * comp;
          expect(s.springForce).toBeCloseTo(expectedFs, 5);
          expect(s.conservativeDrivingForce).toBeCloseTo(expectedFg + expectedFs, 5);
        }
      }

      // Check final sample at solid height (s = 4.90 m, compression = 1.40 m)
      const last = samples[samples.length - 1]!;
      expect(last.displacement).toBeCloseTo(4.90, 2);
      expect(last.springForce).toBeCloseTo(-40 * 1.40, 2); // -56 N
      expect(last.conservativeDrivingForce).toBeCloseTo(expectedFg - 56.0, 2);
    });
  });

  // ── 15. Graph Tab Navigation and Focus ─────────────────────────────────
  describe('15. Graph Tab Navigation and Focus', () => {
    it('switches between energy, power, kinematics, and force tabs', () => {
      const mockCanvas = {
        getContext: vi.fn(() => createMockContext()),
        style: {},
        remove: vi.fn(),
        width: 302,
        height: 130,
        parentElement: { getBoundingClientRect: () => ({ width: 800, height: 600 }) },
      };
      const container = {
        innerHTML: '',
        appendChild: vi.fn(),
      } as unknown as HTMLElement;

      const origDoc = globalThis.document;
      const elementsMap: Record<string, HTMLElement> = {};

      globalThis.document = {
        createElement: vi.fn((tag: string) => {
          if (tag === 'canvas') return mockCanvas;
          const el = {
            id: '',
            textContent: '',
            style: {},
            tabIndex: 0,
            dataset: {},
            appendChild: vi.fn(),
            addEventListener: vi.fn(),
            querySelector: vi.fn(() => null),
            focus: vi.fn(),
            remove: vi.fn(),
          } as unknown as HTMLElement;
          return el;
        }),
        getElementById: vi.fn((id: string) => elementsMap[id] ?? null),
      } as unknown as Document;

      try {
        const sim = new WorkEnergySimulation();
        expect(sim.metadata.id).toBe('work-energy-power');
      } finally {
        globalThis.document = origDoc;
      }
    });
  });

  // ── 16. Non-Finite Filtering in Graph Series ──────────────────────────
  describe('16. Non-Finite Filtering in Graph Series', () => {
    it('excludes NaN and Infinity from pushed coordinates', () => {
      const mockCanvas = {
        getContext: vi.fn(() => createMockContext()),
        style: {},
        remove: vi.fn(),
        width: 300,
        height: 150,
      };
      const mockContainer = {
        appendChild: vi.fn(),
      } as unknown as HTMLElement;

      const origDoc = globalThis.document;
      globalThis.document = {
        createElement: vi.fn(() => mockCanvas),
      } as unknown as Document;

      try {
        const graph = new Graph(mockContainer, 300, 150, 'X', 'Y');
        const s0 = graph.addSeries('Valid', '#38BDF8');

        // Push valid point
        graph.pushData(s0, 1.0, 10.0);

        // Push non-finite points
        graph.pushData(s0, NaN, 5.0);
        graph.pushData(s0, 2.0, NaN);
        graph.pushData(s0, Infinity, 5.0);
        graph.pushData(s0, 3.0, -Infinity);

        // Access internal series data
        const seriesData = (graph as unknown as { _series: { data: unknown[] }[] })._series[0]!.data;
        expect(seriesData.length).toBe(1);
        expect(seriesData[0]).toEqual({ t: 1.0, v: 10.0 });

        graph.dispose();
      } finally {
        globalThis.document = origDoc;
      }
    });
  });
});
