import { describe, it, expect, vi } from 'vitest';
import { Vector2 } from '../../src/core/Vector2';
import { Camera2D } from '../../src/core/Camera2D';
import {
  drawCoiledSpring,
  drawCeilingMount,
  drawWallMount,
  drawMassBox,
  drawAirTrack,
  drawVerticalSpringApparatus,
  drawHorizontalAirTrackApparatus,
  drawPendulumApparatus,
  drawResonanceCurvePlot,
  drawTravelLimitBanner,
  areFinite,
} from '../../src/rendering/SHMRenderer';
import {
  transformToWorldCoordinates,
  computeAutoCameraBounds,
  transformToHorizontalWorldCoordinates,
  computeHorizontalAutoCameraBounds,
  computeResonanceCurve,
  computeResonancePeak,
  HORIZONTAL_NATURAL_LENGTH,
  HORIZONTAL_BLOCK_WIDTH,
  SPRING_SOLID_HEIGHT,
  HORIZONTAL_RAIL_LENGTH,
  HORIZONTAL_MAX_COMPRESSION,
  HORIZONTAL_MAX_EXTENSION,
  type PendulumState,
  type ResonanceCurvePoint,
} from '../../src/physics/SimpleHarmonicPhysics';

/**
 * Creates a mock CanvasRenderingContext2D that records drawing operations
 * and asserts that no NaN or Infinity is passed into any Canvas API call.
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
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    // Properties
    strokeStyle: '#000000',
    fillStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '10px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    _calls: calls,
  } as unknown as CanvasRenderingContext2D & { _calls: typeof calls };

  return ctx;
}

describe('SHMRenderer — Canvas Rendering Extensions', () => {
  const camera = new Camera2D(1280, 720);

  // ── 1. Vertical Spring Coordinates ─────────────────────────
  describe('1. Vertical Spring Coordinates', () => {
    it('accurately derives and renders vertical spring endpoints and reference markers', () => {
      const ceilingWorldY = 0.00;
      const naturalLength = 0.40;
      const staticElongation = 0.392; // m = 1 kg, k = 25 N/m, g = 9.8 m/s²
      const displacement = 0.20; // 0.20 m below static equilibrium
      const blockHeight = 0.16;

      const transform = transformToWorldCoordinates({
        ceilingWorldY,
        naturalLength,
        staticElongation,
        displacement,
        velocity: -0.5,
        acceleration: -5.0,
        restoringForce: -5.0, // F_s = -k·x = -25 * 0.2 = -5 N
      });

      // Verification of physical coordinates
      const expectedEqY = ceilingWorldY - (naturalLength + staticElongation); // -0.792 m
      const expectedMassY = expectedEqY - displacement; // -0.992 m
      expect(transform.worldEquilibriumY).toBeCloseTo(expectedEqY, 4);
      expect(transform.worldPositionY).toBeCloseTo(expectedMassY, 4);

      // Spring top must be at the ceiling support anchor (0, ceilingWorldY)
      // Spring bottom must attach to top eyelet of suspended block: (0, worldPositionY + blockHeight / 2)
      const springTopWorld = new Vector2(0, ceilingWorldY);
      const springBottomWorld = new Vector2(0, transform.worldPositionY + blockHeight / 2);
      expect(springTopWorld.y).toBe(0.00);
      expect(springBottomWorld.y).toBeCloseTo(-0.992 + 0.08, 4); // -0.912 m

      // Screen transformation verification
      const screenTop = camera.worldToScreen(springTopWorld);
      const screenBottom = camera.worldToScreen(springBottomWorld);
      expect(screenBottom.y).toBeGreaterThan(screenTop.y); // Downward in world is +screen Y

      // Render vertical apparatus with mock context
      const ctx = createMockContext();
      drawVerticalSpringApparatus(ctx, camera, transform, {
        ceilingWorldY,
        naturalLength,
        staticElongation,
        mass: 1.0,
        springConstant: 25.0,
        displacement,
        blockHeight,
      });

      expect(ctx._calls.length).toBeGreaterThan(10);
    });

    it('correctly handles vertical spring compression where mass rises above equilibrium', () => {
      const ceilingWorldY = 0.00;
      const naturalLength = 0.40;
      const staticElongation = 0.392;
      const displacement = -0.30; // 0.30 m above static equilibrium (compression)

      const transform = transformToWorldCoordinates({
        ceilingWorldY,
        naturalLength,
        staticElongation,
        displacement,
        velocity: 1.2,
        acceleration: 7.5,
        restoringForce: 7.5, // F_s = -k·(-0.3) = +7.5 N (downward restoring)
      });

      // Mass center is higher than equilibrium: Y_mass > Y_eq
      expect(transform.worldPositionY).toBeGreaterThan(transform.worldEquilibriumY);
      expect(transform.worldPositionY).toBeCloseTo(-0.792 - (-0.30), 4); // -0.492 m
      // Restoring force in world points downward (-Y) towards equilibrium:
      expect(transform.worldRestoringForceY).toBeCloseTo(-7.5, 4);

      const ctx = createMockContext();
      drawVerticalSpringApparatus(ctx, camera, transform, {
        ceilingWorldY,
        naturalLength,
        staticElongation,
        mass: 1.0,
        springConstant: 25.0,
        displacement,
      });
      expect(ctx._calls.length).toBeGreaterThan(10);
    });
  });

  // ── 2. Horizontal Spring Attachment Coordinates ────────────
  describe('2. Horizontal Spring Attachment Coordinates', () => {
    it('attaches the horizontal spring strictly to the block left face, not mass center', () => {
      const wallWorldX = 0.00;
      const trackWorldY = 0.00;
      const naturalLength = HORIZONTAL_NATURAL_LENGTH; // 2.50 m
      const blockWidth = HORIZONTAL_BLOCK_WIDTH; // 0.20 m

      // 1. Static Equilibrium (x = 0)
      const eqTransform = transformToHorizontalWorldCoordinates({
        wallWorldX,
        trackWorldY,
        naturalLength,
        displacement: 0,
        velocity: 0,
        acceleration: 0,
        restoringForce: 0,
        blockWidth,
      });

      // Left face attachment point is wallWorldX + naturalLength = 2.50 m
      expect(eqTransform.worldAttachmentX).toBe(2.50);
      expect(eqTransform.worldBlockLeftX).toBe(2.50);
      // Mass center is shifted by +half block width: 2.60 m
      expect(eqTransform.worldPositionX).toBe(2.60);
      expect(eqTransform.worldEquilibriumX).toBe(2.60);
      // Right face is at 2.70 m
      expect(eqTransform.worldBlockRightX).toBe(2.70);
      expect(eqTransform.springLength).toBe(2.50);

      // 2. Maximum Permissible Compression (x = -2.40 m):
      const compTransform = transformToHorizontalWorldCoordinates({
        wallWorldX,
        trackWorldY,
        naturalLength,
        displacement: -HORIZONTAL_MAX_COMPRESSION, // -2.40 m
        velocity: 0.5,
        acceleration: 60.0,
        restoringForce: 60.0,
        blockWidth,
      });

      // Spring compresses exactly to solid height L_solid = 0.10 m
      expect(compTransform.springLength).toBeCloseTo(SPRING_SOLID_HEIGHT, 4);
      expect(compTransform.worldAttachmentX).toBeCloseTo(0.10, 4);
      expect(compTransform.worldBlockLeftX).toBeCloseTo(0.10, 4);
      // Left face does not collide with wall anchor at 0.00 m!
      expect(compTransform.worldBlockLeftX).toBeGreaterThan(wallWorldX);
      expect(compTransform.worldBlockLeftX - wallWorldX).toBeCloseTo(SPRING_SOLID_HEIGHT, 4);
      expect(compTransform.worldPositionX).toBeCloseTo(0.20, 4); // Mass center at 0.20 m

      // 3. Maximum Permissible Operating Extension (x = +3.00 m):
      const extTransform = transformToHorizontalWorldCoordinates({
        wallWorldX,
        trackWorldY,
        naturalLength,
        displacement: HORIZONTAL_MAX_EXTENSION, // +3.00 m
        velocity: -0.5,
        acceleration: -75.0,
        restoringForce: -75.0,
        blockWidth,
      });

      expect(extTransform.springLength).toBeCloseTo(5.50, 4);
      expect(extTransform.worldAttachmentX).toBeCloseTo(5.50, 4);
      expect(extTransform.worldPositionX).toBeCloseTo(5.60, 4);
      expect(extTransform.worldBlockRightX).toBeCloseTo(5.70, 4);
      // Stays safely within 6.00 m rail length with 0.30 m clearance before end stop
      expect(extTransform.worldBlockRightX).toBeLessThan(wallWorldX + HORIZONTAL_RAIL_LENGTH);
      expect(wallWorldX + HORIZONTAL_RAIL_LENGTH - extTransform.worldBlockRightX).toBeCloseTo(0.30, 4);

      // Test rendering with mock context
      const ctx = createMockContext();
      drawHorizontalAirTrackApparatus(ctx, camera, compTransform, {
        naturalLength,
        mass: 1.0,
        blockWidth,
      });
      expect(ctx._calls.length).toBeGreaterThan(15);
    });
  });

  // ── 3. Mass Block Position and Dimensions ───────────────────
  describe('3. Mass Block Position and Dimensions', () => {
    it('renders mass blocks with exact physical boundaries and centered labels', () => {
      const testCamera = new Camera2D(1280, 720);
      testCamera.setScale(100); // 100 px/m

      const centerWorld = new Vector2(2.60, 0.50);
      const widthWorld = 0.20;
      const heightWorld = 0.16;

      const ctx = createMockContext();
      drawMassBox(ctx, testCamera, centerWorld, widthWorld, heightWorld, {
        fillColor: '#1976D2',
        strokeColor: '#64B5F6',
        label: '1.0kg',
      });

      // Verify fillRect was called with exact screen dimensions
      const fillRectCall = ctx._calls.find((c) => c.method === 'fillRect');
      expect(fillRectCall).toBeDefined();
      const [x, y, w, h] = fillRectCall!.args as number[];
      const expectedCenterScreen = testCamera.worldToScreen(centerWorld);
      const expectedWPx = widthWorld * testCamera.scale; // 20 px
      const expectedHPx = heightWorld * testCamera.scale; // 16 px

      expect(x + w / 2).toBeCloseTo(expectedCenterScreen.x, 2);
      expect(y + h / 2).toBeCloseTo(expectedCenterScreen.y, 2);
      expect(w).toBeCloseTo(expectedWPx, 2);
      expect(h).toBeCloseTo(expectedHPx, 2);

      // Verify label was drawn at center
      const textCall = ctx._calls.find((c) => c.method === 'fillText' && c.args[0] === '1.0kg');
      expect(textCall).toBeDefined();
      expect(textCall!.args[1]).toBeCloseTo(expectedCenterScreen.x, 2);
      expect(textCall!.args[2]).toBeCloseTo(expectedCenterScreen.y, 2);
    });
  });

  // ── 4. Pendulum Pivot and Bob Coordinates ───────────────────
  describe('4. Pendulum Pivot and Bob Coordinates', () => {
    it('computes bob position from polar coordinates and draws circular bob and suspension cord', () => {
      const pivotWorld = new Vector2(0.00, 2.00);
      const length = 1.00; // 1 meter
      const thetaDeg = 30; // 30 degrees deflection
      const thetaRad = (thetaDeg * Math.PI) / 180;

      const pendulumState: PendulumState = {
        time: 0,
        angleRad: thetaRad,
        angleDeg: thetaDeg,
        angularVelocity: 0,
        angularAcceleration: -9.8 * Math.sin(thetaRad),
        linearDisplacement: length * thetaRad,
        linearVelocity: 0,
        restoringTorque: -1.0 * 9.8 * length * Math.sin(thetaRad),
        kineticEnergy: 0,
        potentialEnergy: 1.0 * 9.8 * length * (1 - Math.cos(thetaRad)),
        totalEnergy: 1.0 * 9.8 * length * (1 - Math.cos(thetaRad)),
      };

      // Expected world coordinates of bob center:
      // X_bob = X_pivot + L * sin(theta) = 0 + 1.0 * sin(30°) = 0.50 m
      // Y_bob = Y_pivot - L * cos(theta) = 2.0 - 1.0 * cos(30°) = 2.0 - 0.8660 = 1.1340 m
      const expectedBobX = pivotWorld.x + length * Math.sin(thetaRad);
      const expectedBobY = pivotWorld.y - length * Math.cos(thetaRad);
      expect(expectedBobX).toBeCloseTo(0.50, 4);
      expect(expectedBobY).toBeCloseTo(1.134, 4);

      const ctx = createMockContext();
      drawPendulumApparatus(ctx, camera, pendulumState, {
        pivotWorld,
        length,
        mass: 1.0,
      });

      // Verify that suspension cord line was drawn between pivot and bob
      const lineToCalls = ctx._calls.filter((c) => c.method === 'lineTo');
      const bobScreen = camera.worldToScreen(new Vector2(expectedBobX, expectedBobY));
      const hasCordToBob = lineToCalls.some(
        (c) => Math.abs((c.args[0] as number) - bobScreen.x) < 2 && Math.abs((c.args[1] as number) - bobScreen.y) < 2
      );
      expect(hasCordToBob).toBe(true);

      // Verify circular bob drawing
      const arcCalls = ctx._calls.filter((c) => c.method === 'arc');
      const hasBobArc = arcCalls.some(
        (c) => Math.abs((c.args[0] as number) - bobScreen.x) < 2 && Math.abs((c.args[1] as number) - bobScreen.y) < 2
      );
      expect(hasBobArc).toBe(true);
    });
  });

  // ── 5. Force-Vector Transformations ────────────────────────
  describe('5. Force-Vector Transformations', () => {
    it('inverts vertical restoring force vector so it points upward towards equilibrium when stretched down', () => {
      // Displaced downward (displacement x = +0.25 m)
      // Restoring force on mass opposes displacement: F_restore = -k·x = -6.25 N (upward)
      const transform = transformToWorldCoordinates({
        ceilingWorldY: 0,
        naturalLength: 0.40,
        staticElongation: 0.40,
        displacement: 0.25,
        velocity: 0,
        acceleration: -6.25,
        restoringForce: -6.25,
      });

      // In Camera2D world coordinates (+Y is up):
      // Restoring force points in +Y direction (upward towards equilibrium):
      expect(transform.worldRestoringForceY).toBeCloseTo(6.25, 4);
      expect(transform.worldRestoringForceY).toBeGreaterThan(0);
    });

    it('aligns horizontal restoring force vector towards equilibrium when stretched right', () => {
      // Stretched right (displacement x = +1.0 m)
      // Restoring force opposes displacement: points leftward (-X in world coordinates towards wall anchor)
      const transform = transformToHorizontalWorldCoordinates({
        wallWorldX: 0,
        trackWorldY: 0,
        naturalLength: 2.50,
        displacement: 1.00,
        velocity: 0,
        acceleration: -25.0,
        restoringForce: -25.0, // F_restore = -k·x = -25 * 1.0 = -25 N
      });

      expect(transform.worldRestoringForceX).toBeCloseTo(-25.0, 4);
      expect(transform.worldRestoringForceX).toBeLessThan(0);
    });
  });

  // ── 6. Camera Bounds ────────────────────────────────────────
  describe('6. Camera Bounds', () => {
    it('computes vertical camera bounds enclosing ceiling bracket, equilibrium, and peak oscillation', () => {
      const ceilingWorldY = 0.00;
      const naturalLength = 0.40;
      const staticElongation = 0.40;
      const peakAmp = 0.30;

      const bounds = computeAutoCameraBounds(ceilingWorldY, naturalLength, staticElongation, peakAmp);
      expect(bounds.maxY).toBeGreaterThan(ceilingWorldY); // Encloses ceiling bracket
      expect(bounds.minY).toBeLessThan(ceilingWorldY - (naturalLength + staticElongation + peakAmp));
      expect(bounds.viewportHeight).toBeGreaterThan(bounds.maxY - bounds.minY);
    });

    it('computes horizontal camera bounds enclosing wall bracket, 6.0m guide rail, and peak resonance amplitude', () => {
      const wallWorldX = 0.00;
      const trackWorldY = 0.00;
      const peakAmp = 2.00;

      const bounds = computeHorizontalAutoCameraBounds(wallWorldX, trackWorldY, HORIZONTAL_NATURAL_LENGTH, peakAmp);
      // Wall bracket is at X = -0.25 m:
      expect(bounds.cameraMinX).toBeLessThan(wallWorldX - 0.25);
      // Rail end stop is at X = 6.00 + 0.15 = 6.15 m:
      expect(bounds.cameraMaxX).toBeGreaterThan(wallWorldX + HORIZONTAL_RAIL_LENGTH + 0.15);
      // 15% visual padding:
      expect(bounds.viewportWidth).toBeCloseTo((bounds.maxX - bounds.minX) * 1.15, 4);
    });
  });

  // ── 7. Singular Resonance Rendering Safety ──────────────────
  describe('7. Singular Resonance Rendering Safety', () => {
    it('safely handles undamped exact resonance without passing Infinity or NaN to Canvas', () => {
      // Undamped forced resonance: b = 0, F0 = 2.0 N
      const undampedParams = {
        mass: 1.0,
        springConstant: 25.0,
        dampingCoefficient: 0.0,
      };
      const driverForce = 2.0;

      const curvePoints = computeResonanceCurve(undampedParams, driverForce, {
        minOmega: 0.0,
        maxOmega: 12.5,
        steps: 100,
      });

      // Verify that exact natural frequency (omega0 = 5.0) is sampled and tagged as singularity:
      const singularityPoint = curvePoints.find((p) => p.isSingularity);
      expect(singularityPoint).toBeDefined();
      expect(singularityPoint?.amplitude).toBe(Infinity);

      // Now verify that drawResonanceCurvePlot renders this curve cleanly without throwing
      // or passing Infinity/NaN to Canvas!
      const ctx = createMockContext();
      const plotRect = { x: 50, y: 50, width: 400, height: 250 };
      const peakInfo = computeResonancePeak(undampedParams, driverForce);

      expect(() => {
        drawResonanceCurvePlot(
          ctx,
          plotRect,
          curvePoints,
          5.0, // exactly at resonance frequency!
          5.0, // omega0
          peakInfo
        );
      }).not.toThrow();

      // All calls recorded by mock context must contain strictly finite numbers
      for (const call of ctx._calls) {
        for (const arg of call.args) {
          if (typeof arg === 'number') {
            expect(Number.isFinite(arg)).toBe(true);
          }
        }
      }
    });
  });

  // ── 8. Non-Finite Value Protection ──────────────────────────
  describe('8. Non-Finite Value Protection', () => {
    it('validates areFinite helper', () => {
      expect(areFinite(1, 2.5, 0, -10)).toBe(true);
      expect(areFinite(1, NaN, 3)).toBe(false);
      expect(areFinite(1, Infinity, 3)).toBe(false);
      expect(areFinite(1, -Infinity, 3)).toBe(false);
      expect(areFinite(1, null, 3)).toBe(false);
      expect(areFinite(1, undefined, 3)).toBe(false);
    });

    it('gracefully ignores non-finite coordinates in all SHM drawing functions without crashing', () => {
      const ctx = createMockContext();

      // Non-finite spring coordinates
      expect(() => {
        drawCoiledSpring(ctx, camera, new Vector2(NaN, 0), new Vector2(0, 1));
        drawCoiledSpring(ctx, camera, new Vector2(0, 0), new Vector2(Infinity, 1));
      }).not.toThrow();

      // Non-finite ceiling mount
      expect(() => {
        drawCeilingMount(ctx, camera, NaN);
        drawCeilingMount(ctx, camera, Infinity);
      }).not.toThrow();

      // Non-finite wall mount
      expect(() => {
        drawWallMount(ctx, camera, NaN, 0);
        drawWallMount(ctx, camera, 0, Infinity);
      }).not.toThrow();

      // Non-finite mass box
      expect(() => {
        drawMassBox(ctx, camera, new Vector2(NaN, NaN), 0.2, 0.2);
      }).not.toThrow();

      // Non-finite air track
      expect(() => {
        drawAirTrack(ctx, camera, NaN, 0);
        drawAirTrack(ctx, camera, 0, Infinity);
      }).not.toThrow();
    });
  });

  // ── 9. Terminal Apparatus Status Rendering ───────────────────
  describe('9. Terminal Apparatus Status Rendering', () => {
    it('renders travel limit warning banner when apparatusStatus is exceeded and preserves last physical state', () => {
      const ctx = createMockContext();

      // Terminal state on horizontal air track: displacement exceeded limit (|x| > 2.40 m)
      const transform = transformToHorizontalWorldCoordinates({
        wallWorldX: 0,
        trackWorldY: 0,
        naturalLength: HORIZONTAL_NATURAL_LENGTH,
        displacement: 2.45, // Exceeded bound
        velocity: 1.8, // Preserves actual physical velocity
        acceleration: -61.25, // Preserves actual acceleration
        restoringForce: -61.25,
        drivingForce: 1.5,
      });

      drawHorizontalAirTrackApparatus(ctx, camera, transform, {
        naturalLength: HORIZONTAL_NATURAL_LENGTH,
        mass: 1.0,
        apparatusStatus: 'exceeded',
      });

      // Verify that travel limit exceeded banner was rendered
      const textCalls = ctx._calls.filter((c) => c.method === 'fillText');
      const hasWarningTitle = textCalls.some((c) =>
        (c.args[0] as string).includes('APPARATUS TRAVEL LIMIT EXCEEDED')
      );
      expect(hasWarningTitle).toBe(true);

      // Verify banner rounded rect was drawn
      const bannerRect = ctx._calls.find((c) => c.method === 'roundRect');
      expect(bannerRect).toBeDefined();

      // Confirm all coordinates remain strictly finite
      for (const call of ctx._calls) {
        for (const arg of call.args) {
          if (typeof arg === 'number') {
            expect(Number.isFinite(arg)).toBe(true);
          }
        }
      }
    });

    it('drawTravelLimitBanner directly draws high-contrast banner with correct dimensions', () => {
      const ctx = createMockContext();
      drawTravelLimitBanner(ctx, 1280);

      const textCalls = ctx._calls.filter((c) => c.method === 'fillText');
      expect(textCalls.length).toBe(2);
      expect(textCalls[0]?.args[0]).toContain('APPARATUS TRAVEL LIMIT EXCEEDED');
      expect(textCalls[1]?.args[0]).toContain('Simulation halted to protect physical apparatus');
    });
  });
});
