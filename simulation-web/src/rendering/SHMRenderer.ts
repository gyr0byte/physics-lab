import { Vector2 } from '../core/Vector2';
import { Camera2D } from '../core/Camera2D';
import {
  type VerticalWorldTransform,
  type HorizontalWorldTransform,
  type PendulumState,
  type ResonanceCurvePoint,
  type ApparatusLimitStatus,
  HORIZONTAL_BLOCK_WIDTH,
  SPRING_SOLID_HEIGHT,
  HORIZONTAL_RAIL_LENGTH,
} from '../physics/SimpleHarmonicPhysics';
import { drawVectorArrow } from './CanvasRenderer';

/**
 * Validates that all provided numbers are finite (not NaN, Infinity, or -Infinity).
 */
export function areFinite(...vals: (number | null | undefined)[]): boolean {
  for (const v of vals) {
    if (v === null || v === undefined) return false;
    if (!Number.isFinite(v)) return false;
  }
  return true;
}

/**
 * Draws a realistic coiled helical spring between two world-space points.
 * Handles both vertical and horizontal orientations with pitch expanding/compressing smoothly.
 */
export function drawCoiledSpring(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  pStartWorld: Vector2,
  pEndWorld: Vector2,
  options: {
    numCoils?: number;
    coilRadiusWorld?: number;
    color?: string;
    lineWidth?: number;
  } = {}
): void {
  if (!areFinite(pStartWorld.x, pStartWorld.y, pEndWorld.x, pEndWorld.y)) {
    return;
  }

  const {
    numCoils = 12,
    coilRadiusWorld = 0.07,
    color = '#4DD0E1',
    lineWidth = 2.5,
  } = options;

  const dx = pEndWorld.x - pStartWorld.x;
  const dy = pEndWorld.y - pStartWorld.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 0.005) return; // Degenerate length

  const ux = dx / length;
  const uy = dy / length;
  // Perpendicular unit vector
  const nx = -uy;
  const ny = ux;

  // Straight lead-in and lead-out ends
  const leadLength = Math.min(0.04, length * 0.08);
  const coilLength = Math.max(0.001, length - 2 * leadLength);

  const startScreen = camera.worldToScreen(pStartWorld);
  const pLeadInWorld = new Vector2(
    pStartWorld.x + ux * leadLength,
    pStartWorld.y + uy * leadLength
  );
  const pLeadOutWorld = new Vector2(
    pEndWorld.x - ux * leadLength,
    pEndWorld.y - uy * leadLength
  );
  const endScreen = camera.worldToScreen(pEndWorld);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(startScreen.x, startScreen.y);

  const leadInScreen = camera.worldToScreen(pLeadInWorld);
  ctx.lineTo(leadInScreen.x, leadInScreen.y);

  // Generate zigzag coil segments
  const totalSegments = numCoils * 2;
  const segmentLength = coilLength / totalSegments;

  for (let i = 1; i <= totalSegments; i++) {
    const s = leadLength + i * segmentLength;
    const sign = i % 2 === 1 ? 1 : -1;
    // Taper radius at the ends
    const taper = Math.sin((i / totalSegments) * Math.PI);
    const radius = coilRadiusWorld * (0.6 + 0.4 * taper);

    const worldPt = new Vector2(
      pStartWorld.x + ux * s + nx * (sign * radius),
      pStartWorld.y + uy * s + ny * (sign * radius)
    );
    const screenPt = camera.worldToScreen(worldPt);
    ctx.lineTo(screenPt.x, screenPt.y);
  }

  const leadOutScreen = camera.worldToScreen(pLeadOutWorld);
  ctx.lineTo(leadOutScreen.x, leadOutScreen.y);
  ctx.lineTo(endScreen.x, endScreen.y);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a rigid ceiling mount with cross-hatching.
 */
export function drawCeilingMount(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  ceilingWorldY: number,
  widthWorld: number = 0.8
): void {
  if (!areFinite(ceilingWorldY, widthWorld)) return;

  const leftWorld = new Vector2(-widthWorld / 2, ceilingWorldY);
  const rightWorld = new Vector2(widthWorld / 2, ceilingWorldY);

  const p1 = camera.worldToScreen(leftWorld);
  const p2 = camera.worldToScreen(rightWorld);

  ctx.save();

  // Ceiling surface plate
  ctx.strokeStyle = '#ECEFF1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Mounting bracket eyelet
  const anchorScreen = camera.worldToScreen(new Vector2(0, ceilingWorldY));
  ctx.fillStyle = '#90A4AE';
  ctx.beginPath();
  ctx.arc(anchorScreen.x, anchorScreen.y + 4, 5, 0, Math.PI * 2);
  ctx.fill();

  // Hatching above ceiling
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  const hatchSpacing = 12;
  for (let x = p1.x; x <= p2.x; x += hatchSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, p1.y);
    ctx.lineTo(x + 8, p1.y - 10);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Rigid Support (y = 0)', anchorScreen.x, p1.y - 12);

  ctx.restore();
}

/**
 * Draws a rigid vertical wall mounting bracket with cross-hatching for the horizontal apparatus.
 */
export function drawWallMount(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  wallWorldX: number,
  trackWorldY: number,
  heightWorld: number = 0.8
): void {
  if (!areFinite(wallWorldX, trackWorldY, heightWorld)) return;

  const topWorld = new Vector2(wallWorldX, trackWorldY + heightWorld / 2);
  const bottomWorld = new Vector2(wallWorldX, trackWorldY - heightWorld / 2);

  const pTop = camera.worldToScreen(topWorld);
  const pBottom = camera.worldToScreen(bottomWorld);

  ctx.save();

  // Vertical wall line
  ctx.strokeStyle = '#ECEFF1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pTop.x, pTop.y);
  ctx.lineTo(pBottom.x, pBottom.y);
  ctx.stroke();

  // Spring anchor eyelet
  const anchorScreen = camera.worldToScreen(new Vector2(wallWorldX, trackWorldY + 0.08));
  ctx.fillStyle = '#90A4AE';
  ctx.beginPath();
  ctx.arc(anchorScreen.x + 4, anchorScreen.y, 5, 0, Math.PI * 2);
  ctx.fill();

  // Wall hatching (left of the wall line)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  const hatchSpacing = 12;
  for (let y = pTop.y; y <= pBottom.y; y += hatchSpacing) {
    ctx.beginPath();
    ctx.moveTo(pTop.x, y);
    ctx.lineTo(pTop.x - 10, y + 8);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('Rigid Wall Anchor', pTop.x - 14, (pTop.y + pBottom.y) / 2);

  ctx.restore();
}

/**
 * Draws a mass block centered at worldPos.
 */
export function drawMassBox(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  centerWorld: Vector2,
  widthWorld: number,
  heightWorld: number,
  options: {
    fillColor?: string;
    strokeColor?: string;
    label?: string;
    labelColor?: string;
  } = {}
): void {
  if (!areFinite(centerWorld.x, centerWorld.y, widthWorld, heightWorld)) return;

  const {
    fillColor = '#1976D2',
    strokeColor = '#64B5F6',
    label = '',
    labelColor = '#ffffff',
  } = options;

  const centerScreen = camera.worldToScreen(centerWorld);
  const wPx = Math.max(12, widthWorld * camera.scale);
  const hPx = Math.max(12, heightWorld * camera.scale);

  const left = centerScreen.x - wPx / 2;
  const top = centerScreen.y - hPx / 2;

  ctx.save();

  // Box body
  ctx.fillStyle = fillColor;
  ctx.fillRect(left, top, wPx, hPx);

  // Border
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(left, top, wPx, hPx);

  // Subtle interior cross
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left + wPx, top + hPx);
  ctx.moveTo(left + wPx, top);
  ctx.lineTo(left, top + hPx);
  ctx.stroke();

  // Label
  if (label) {
    ctx.fillStyle = labelColor;
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, centerScreen.x, centerScreen.y);
  }

  ctx.restore();
}

/**
 * Draws the horizontal air track guide rail with tick marks, air jet holes, and heavy end stop.
 */
export function drawAirTrack(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  wallWorldX: number,
  trackWorldY: number,
  railLengthWorld: number = HORIZONTAL_RAIL_LENGTH
): void {
  if (!areFinite(wallWorldX, trackWorldY, railLengthWorld)) return;

  const startWorld = new Vector2(wallWorldX, trackWorldY);
  const endWorld = new Vector2(wallWorldX + railLengthWorld, trackWorldY);

  const pStart = camera.worldToScreen(startWorld);
  const pEnd = camera.worldToScreen(endWorld);

  ctx.save();

  // Main rail profile (aluminum beam)
  const beamHeightPx = Math.max(6, 0.05 * camera.scale);
  ctx.fillStyle = '#37474F';
  ctx.fillRect(pStart.x, pStart.y, pEnd.x - pStart.x, beamHeightPx);

  ctx.strokeStyle = '#78909C';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pStart.x, pStart.y);
  ctx.lineTo(pEnd.x, pStart.y);
  ctx.stroke();

  // Air jet perforations along rail
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  const holeStepWorld = 0.25;
  for (let x = wallWorldX + holeStepWorld; x < wallWorldX + railLengthWorld; x += holeStepWorld) {
    const screenPt = camera.worldToScreen(new Vector2(x, trackWorldY));
    ctx.beginPath();
    ctx.arc(screenPt.x, screenPt.y + beamHeightPx * 0.4, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Heavy end stop bumper at rail end
  const stopWidthPx = Math.max(10, 0.15 * camera.scale);
  const stopHeightPx = Math.max(16, 0.20 * camera.scale);
  ctx.fillStyle = '#D32F2F'; // Rubber buffer
  ctx.fillRect(pEnd.x, pStart.y - stopHeightPx / 2, stopWidthPx, stopHeightPx);
  ctx.strokeStyle = '#FFCDD2';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pEnd.x, pStart.y - stopHeightPx / 2, stopWidthPx, stopHeightPx);

  // Tick marks and meter labels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let x = 0; x <= railLengthWorld; x += 1.0) {
    const tickPt = camera.worldToScreen(new Vector2(wallWorldX + x, trackWorldY));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tickPt.x, pStart.y + beamHeightPx);
    ctx.lineTo(tickPt.x, pStart.y + beamHeightPx + 6);
    ctx.stroke();

    ctx.fillText(`${x.toFixed(0)}m`, tickPt.x, pStart.y + beamHeightPx + 8);
  }

  ctx.restore();
}

/**
 * Draws the complete Mode 1 / Mode 2 Vertical Spring-Mass apparatus.
 */
export function drawVerticalSpringApparatus(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  transform: VerticalWorldTransform,
  options: {
    ceilingWorldY: number;
    naturalLength: number;
    staticElongation: number;
    mass: number;
    springConstant: number;
    displacement: number;
    showVectors?: boolean;
    showReferenceLines?: boolean;
    blockWidth?: number;
    blockHeight?: number;
  }
): void {
  const {
    ceilingWorldY,
    naturalLength,
    staticElongation,
    mass,
    displacement,
    showVectors = true,
    showReferenceLines = true,
    blockWidth = 0.24,
    blockHeight = 0.16,
  } = options;

  if (
    !areFinite(
      ceilingWorldY,
      naturalLength,
      staticElongation,
      displacement,
      transform.worldPositionY,
      transform.worldEquilibriumY
    )
  ) {
    return;
  }

  // 1. Draw Ceiling Mount
  drawCeilingMount(ctx, camera, ceilingWorldY, 1.0);

  // 2. Reference Lines
  if (showReferenceLines) {
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);

    // Natural length reference line: Y = ceilingWorldY - naturalLength
    const natY = ceilingWorldY - naturalLength;
    const pNatLeft = camera.worldToScreen(new Vector2(-0.8, natY));
    const pNatRight = camera.worldToScreen(new Vector2(0.8, natY));
    ctx.strokeStyle = 'rgba(77, 208, 225, 0.4)';
    ctx.beginPath();
    ctx.moveTo(pNatLeft.x, pNatLeft.y);
    ctx.lineTo(pNatRight.x, pNatRight.y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(77, 208, 225, 0.7)';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Natural Length L₀ = ${naturalLength.toFixed(2)} m`, pNatRight.x + 8, pNatRight.y + 4);

    // Static Equilibrium reference line: Y_eq (mass center)
    const eqY = transform.worldEquilibriumY;
    const pEqLeft = camera.worldToScreen(new Vector2(-1.0, eqY));
    const pEqRight = camera.worldToScreen(new Vector2(1.0, eqY));
    ctx.strokeStyle = '#FFD54F';
    ctx.beginPath();
    ctx.moveTo(pEqLeft.x, pEqLeft.y);
    ctx.lineTo(pEqRight.x, pEqRight.y);
    ctx.stroke();

    ctx.fillStyle = '#FFD54F';
    ctx.fillText(`Equilibrium Mass Center (Y_eq = ${eqY.toFixed(2)} m)`, pEqRight.x + 8, pEqRight.y + 4);

    ctx.restore();
  }

  // 3. Coiled Spring
  // Spring top: (0, ceilingWorldY)
  // Spring bottom: attaches to top face of suspended mass block at (0, worldAttachmentY)
  const springStart = new Vector2(0, ceilingWorldY);
  const springEnd = new Vector2(0, transform.worldAttachmentY);
  drawCoiledSpring(ctx, camera, springStart, springEnd, {
    numCoils: 12,
    coilRadiusWorld: 0.06,
    color: '#4DD0E1',
    lineWidth: 2.5,
  });

  // 4. Suspended Mass Block
  const massCenter = new Vector2(0, transform.worldPositionY);
  drawMassBox(ctx, camera, massCenter, blockWidth, blockHeight, {
    fillColor: '#1E88E5',
    strokeColor: '#90CAF9',
    label: `${mass.toFixed(1)} kg`,
    labelColor: '#ffffff',
  });

  // 5. Vectors
  if (showVectors) {
    const vectorScale = 0.04; // meters per Newton

    // Velocity Vector (Cyan)
    if (Math.abs(transform.worldVelocityY) > 0.05) {
      const vOrigin = new Vector2(blockWidth / 2 + 0.08, transform.worldPositionY);
      const vVec = new Vector2(0, transform.worldVelocityY);
      drawVectorArrow(ctx, camera, vOrigin, vVec, '#26C6DA', {
        label: `v = ${(-transform.worldVelocityY).toFixed(2)} m/s`,
        scale: 0.2,
        lineWidth: 2.5,
      });
    }

    // Restoring Force Vector (Gold - points towards equilibrium)
    if (Math.abs(transform.worldRestoringForceY) > 0.1) {
      const fOrigin = new Vector2(-blockWidth / 2 - 0.08, transform.worldPositionY);
      const fVec = new Vector2(0, transform.worldRestoringForceY);
      drawVectorArrow(ctx, camera, fOrigin, fVec, '#FFCA28', {
        label: `F_s = ${(transform.worldRestoringForceY).toFixed(1)} N`,
        scale: vectorScale,
        lineWidth: 3.0,
      });
    }
  }

  // 6. Displacement Dimension Bracket
  if (Math.abs(displacement) > 0.02) {
    ctx.save();
    const bracketX = -blockWidth / 2 - 0.15;
    const p1 = camera.worldToScreen(new Vector2(bracketX, transform.worldEquilibriumY));
    const p2 = camera.worldToScreen(new Vector2(bracketX, transform.worldPositionY));

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p1.x - 4, p1.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p2.x - 4, p2.y);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`x = ${displacement > 0 ? '+' : ''}${displacement.toFixed(2)} m`, p1.x - 8, (p1.y + p2.y) / 2);
    ctx.restore();
  }
}

/**
 * Draws the Simple Pendulum apparatus.
 */
export function drawPendulumApparatus(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  state: PendulumState,
  options: {
    pivotWorld: Vector2;
    length: number;
    mass: number;
    showVectors?: boolean;
    showReferenceLines?: boolean;
    bobRadiusWorld?: number;
  }
): void {
  const {
    pivotWorld,
    length,
    mass,
    showVectors = true,
    showReferenceLines = true,
    bobRadiusWorld = 0.07,
  } = options;

  if (!areFinite(pivotWorld.x, pivotWorld.y, length, state.angleRad)) {
    return;
  }

  const theta = state.angleRad;
  const bobWorld = new Vector2(
    pivotWorld.x + length * Math.sin(theta),
    pivotWorld.y - length * Math.cos(theta)
  );

  const pPivot = camera.worldToScreen(pivotWorld);
  const pBob = camera.worldToScreen(bobWorld);

  ctx.save();

  // 1. Pivot Mount
  drawCeilingMount(ctx, camera, pivotWorld.y, 0.6);

  // 2. Vertical Equilibrium Reference (dashed)
  if (showReferenceLines) {
    const eqBottom = camera.worldToScreen(new Vector2(pivotWorld.x, pivotWorld.y - length * 1.15));
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(pPivot.x, pPivot.y);
    ctx.lineTo(eqBottom.x, eqBottom.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Angular arc
    if (Math.abs(theta) > 0.01) {
      const arcRadiusPx = length * camera.scale * 0.35;
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Screen angles: 0 is right (+X), Math.PI/2 is down (+screen Y)
      const startAngle = Math.PI / 2;
      const endAngle = Math.PI / 2 + theta;
      ctx.arc(pPivot.x, pPivot.y, arcRadiusPx, Math.min(startAngle, endAngle), Math.max(startAngle, endAngle));
      ctx.stroke();

      ctx.fillStyle = '#FFD54F';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = theta > 0 ? 'left' : 'right';
      const labelAngle = Math.PI / 2 + theta / 2;
      const lx = pPivot.x + (arcRadiusPx + 14) * Math.cos(labelAngle);
      const ly = pPivot.y + (arcRadiusPx + 14) * Math.sin(labelAngle);
      ctx.fillText(`θ = ${(state.angleDeg).toFixed(1)}°`, lx, ly);
    }
  }

  // 3. Inextensible Suspension Cord
  ctx.strokeStyle = '#CFD8DC';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(pPivot.x, pPivot.y);
  ctx.lineTo(pBob.x, pBob.y);
  ctx.stroke();

  // 4. Pendulum Bob
  const bobRadiusPx = Math.max(8, bobRadiusWorld * camera.scale);
  const grad = ctx.createRadialGradient(
    pBob.x - bobRadiusPx * 0.3,
    pBob.y - bobRadiusPx * 0.3,
    bobRadiusPx * 0.1,
    pBob.x,
    pBob.y,
    bobRadiusPx
  );
  grad.addColorStop(0, '#64B5F6');
  grad.addColorStop(1, '#1565C0');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(pBob.x, pBob.y, bobRadiusPx, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#BBDEFB';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bob mass label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${mass.toFixed(1)}kg`, pBob.x, pBob.y);

  // 5. Tangential Velocity & Restoring Force Vectors
  if (showVectors) {
    // Tangent unit vector pointing in increasing theta direction: (cosθ, sinθ) in world coordinates
    const tangentWorld = new Vector2(Math.cos(theta), Math.sin(theta));

    if (Math.abs(state.linearVelocity) > 0.05) {
      const vVec = tangentWorld.scale(state.linearVelocity);
      drawVectorArrow(ctx, camera, bobWorld, vVec, '#26C6DA', {
        label: `v = ${state.linearVelocity.toFixed(2)} m/s`,
        scale: 0.2,
        lineWidth: 2.5,
      });
    }

    // Restoring tangential force: F = -m·g·sinθ
    const fRestore = -mass * 9.80 * Math.sin(theta);
    if (Math.abs(fRestore) > 0.1) {
      const fVec = tangentWorld.scale(fRestore);
      drawVectorArrow(ctx, camera, bobWorld, fVec, '#FFCA28', {
        label: `F_t = ${fRestore.toFixed(1)} N`,
        scale: 0.04,
        lineWidth: 2.5,
      });
    }
  }

  ctx.restore();
}

/**
 * Draws the complete Mode 3 / Mode 4 Horizontal Guided Air-Track Apparatus.
 * Incorporates:
 * - Rigid wall anchor at worldWallX
 * - Coiled spring attached to the LEFT FACE of the mass block (worldAttachmentX)
 * - Guide rail and end stop
 * - Mass block with width HORIZONTAL_BLOCK_WIDTH (0.20 m)
 * - Driving force vector and external actuator
 * - Travel limit enforcement indicator
 */
export function drawHorizontalAirTrackApparatus(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  transform: HorizontalWorldTransform,
  options: {
    naturalLength: number;
    railLength?: number;
    mass: number;
    blockWidth?: number;
    blockHeight?: number;
    showVectors?: boolean;
    showReferenceLines?: boolean;
    showDriver?: boolean;
    driverFrequency?: number;
    driverPhase?: number;
    apparatusStatus?: ApparatusLimitStatus;
  }
): void {
  const {
    naturalLength,
    railLength = HORIZONTAL_RAIL_LENGTH,
    mass,
    blockWidth = HORIZONTAL_BLOCK_WIDTH,
    blockHeight = 0.16,
    showVectors = true,
    showReferenceLines = true,
    showDriver = false,
    apparatusStatus = 'ok',
  } = options;

  if (
    !areFinite(
      transform.worldWallX,
      transform.worldPositionY,
      transform.worldAttachmentX,
      transform.worldPositionX,
      transform.worldEquilibriumX
    )
  ) {
    return;
  }

  const { worldWallX, worldPositionY, worldAttachmentX, worldPositionX, worldEquilibriumX } = transform;

  // 1. Draw Rigid Wall Mount Bracket
  drawWallMount(ctx, camera, worldWallX, worldPositionY, 0.7);

  // 2. Draw Guide Rail & End Stop
  drawAirTrack(ctx, camera, worldWallX, worldPositionY, railLength);

  // 3. Reference Lines
  if (showReferenceLines) {
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);

    // Natural spring length marker: X = worldWallX + naturalLength
    const xNat = worldWallX + naturalLength;
    const pNatTop = camera.worldToScreen(new Vector2(xNat, worldPositionY + 0.35));
    const pNatBottom = camera.worldToScreen(new Vector2(xNat, worldPositionY - 0.2));
    ctx.strokeStyle = 'rgba(77, 208, 225, 0.4)';
    ctx.beginPath();
    ctx.moveTo(pNatTop.x, pNatTop.y);
    ctx.lineTo(pNatBottom.x, pNatBottom.y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(77, 208, 225, 0.7)';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`L₀,h = ${naturalLength.toFixed(2)}m`, pNatTop.x, pNatTop.y - 4);

    // Static equilibrium center marker: X_eq = 2.60 m
    const pEqTop = camera.worldToScreen(new Vector2(worldEquilibriumX, worldPositionY + 0.45));
    const pEqBottom = camera.worldToScreen(new Vector2(worldEquilibriumX, worldPositionY - 0.2));
    ctx.strokeStyle = '#FFD54F';
    ctx.beginPath();
    ctx.moveTo(pEqTop.x, pEqTop.y);
    ctx.lineTo(pEqBottom.x, pEqBottom.y);
    ctx.stroke();

    ctx.fillStyle = '#FFD54F';
    ctx.fillText(`Equilibrium (X_eq = ${worldEquilibriumX.toFixed(2)}m)`, pEqTop.x, pEqTop.y - 4);

    // Solid height minimum limit marker: X = worldWallX + SPRING_SOLID_HEIGHT
    const xSolid = worldWallX + SPRING_SOLID_HEIGHT;
    const pSolidTop = camera.worldToScreen(new Vector2(xSolid, worldPositionY + 0.25));
    const pSolidBottom = camera.worldToScreen(new Vector2(xSolid, worldPositionY - 0.15));
    ctx.strokeStyle = 'rgba(239, 83, 80, 0.4)';
    ctx.beginPath();
    ctx.moveTo(pSolidTop.x, pSolidTop.y);
    ctx.lineTo(pSolidBottom.x, pSolidBottom.y);
    ctx.stroke();

    ctx.restore();
  }

  // 4. Coiled Helical Spring
  // Spring extends from wall anchor to the LEFT FACE of the mass block
  const springStart = new Vector2(worldWallX, worldPositionY + blockHeight / 2);
  const springEnd = new Vector2(worldAttachmentX, worldPositionY + blockHeight / 2);
  drawCoiledSpring(ctx, camera, springStart, springEnd, {
    numCoils: 14,
    coilRadiusWorld: 0.07,
    color: apparatusStatus === 'exceeded' ? '#EF5350' : '#4DD0E1',
    lineWidth: 2.5,
  });

  // 5. Mass Block
  // Center is at worldPositionX, sitting on rail (bottom at worldPositionY)
  const blockCenter = new Vector2(worldPositionX, worldPositionY + blockHeight / 2);
  drawMassBox(ctx, camera, blockCenter, blockWidth, blockHeight, {
    fillColor: apparatusStatus === 'exceeded' ? '#C62828' : '#1976D2',
    strokeColor: apparatusStatus === 'exceeded' ? '#FF8A80' : '#64B5F6',
    label: `${mass.toFixed(1)}kg`,
    labelColor: '#ffffff',
  });

  // 6. External Periodic Driver Actuator (Modes 3 & 4)
  if (showDriver) {
    ctx.save();
    // Shaker piston housing on wall mount
    const pShaker = camera.worldToScreen(new Vector2(worldWallX - 0.15, worldPositionY + blockHeight / 2));
    ctx.fillStyle = '#E65100'; // Industrial actuator orange
    ctx.fillRect(pShaker.x - 14, pShaker.y - 12, 14, 24);
    ctx.strokeStyle = '#FFA726';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pShaker.x - 14, pShaker.y - 12, 14, 24);

    ctx.fillStyle = '#FFE082';
    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ACT', pShaker.x - 7, pShaker.y);
    ctx.restore();
  }

  // 7. Force and Motion Vectors
  if (showVectors && apparatusStatus !== 'exceeded') {
    const forceScale = 0.05; // meters per Newton

    // Velocity Vector (Cyan)
    if (Math.abs(transform.worldVelocityX) > 0.05) {
      const vOrigin = new Vector2(worldPositionX, worldPositionY + blockHeight + 0.12);
      const vVec = new Vector2(transform.worldVelocityX, 0);
      drawVectorArrow(ctx, camera, vOrigin, vVec, '#26C6DA', {
        label: `v = ${transform.worldVelocityX.toFixed(2)} m/s`,
        scale: 0.25,
        lineWidth: 2.5,
      });
    }

    // Restoring Force Vector (Gold - points toward equilibrium)
    if (Math.abs(transform.worldRestoringForceX) > 0.1) {
      const fOrigin = new Vector2(worldPositionX, worldPositionY + blockHeight + 0.30);
      const fVec = new Vector2(transform.worldRestoringForceX, 0);
      drawVectorArrow(ctx, camera, fOrigin, fVec, '#FFCA28', {
        label: `F_s = ${transform.worldRestoringForceX.toFixed(1)} N`,
        scale: forceScale,
        lineWidth: 3.0,
      });
    }

    // External Driving Force Vector (Amber/Orange)
    if (showDriver && Math.abs(transform.worldDrivingForceX) > 0.05) {
      const dOrigin = new Vector2(worldPositionX, worldPositionY + blockHeight + 0.48);
      const dVec = new Vector2(transform.worldDrivingForceX, 0);
      drawVectorArrow(ctx, camera, dOrigin, dVec, '#FF9800', {
        label: `F_drive = ${transform.worldDrivingForceX.toFixed(1)} N`,
        scale: forceScale,
        lineWidth: 3.0,
      });
    }
  }

  // 8. Apparatus Status Exceeded Warning Banner
  if (apparatusStatus === 'exceeded') {
    drawTravelLimitBanner(ctx, camera.canvasWidth);
  }
}

/**
 * Draws the high-contrast travel limit exceeded warning banner across the screen.
 * Visually communicates that the numerical model has safely halted at its boundary without fabricating collisions.
 */
export function drawTravelLimitBanner(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number
): void {
  ctx.save();
  const bannerWidth = Math.min(740, canvasWidth - 40);
  const bannerHeight = 64;
  const bannerX = (canvasWidth - bannerWidth) / 2;
  const bannerY = 16;

  ctx.fillStyle = 'rgba(211, 47, 47, 0.95)';
  ctx.strokeStyle = '#FF8A80';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('⚠️ APPARATUS TRAVEL LIMIT EXCEEDED (x < -2.40 m or x > +3.00 m)', canvasWidth / 2, bannerY + 10);

  ctx.fillStyle = '#FFEBEE';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText('Simulation halted to protect physical apparatus. Model state preserved. Press Reset.', canvasWidth / 2, bannerY + 36);

  ctx.restore();
}

/**
 * Renders the Mode 4 Analytical Resonance Curve plot:
 * Plots steady-state amplitude A(Ω) vs driver frequency Ω with:
 * - Natural frequency marker (ω0)
 * - Resonance peak marker (Ω_res, A_max)
 * - Current driving frequency indicator (Ω)
 * - Safe asymptote gap handling when damping b = 0 and A -> Infinity (zero NaN/Infinity passed to Canvas!)
 */
export function drawResonanceCurvePlot(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  curvePoints: ResonanceCurvePoint[],
  currentOmega: number,
  naturalOmega: number,
  peakInfo: {
    hasResonancePeak: boolean;
    resonantFrequencyRad: number | null;
    peakAmplitude: number;
    qualityFactor: number;
  }
): void {
  const { x, y, width: w, height: h } = rect;

  if (!areFinite(x, y, w, h, currentOmega, naturalOmega)) return;
  if (!curvePoints || curvePoints.length === 0) return;

  const margin = { top: 32, right: 24, bottom: 36, left: 56 };
  const plotW = w - margin.left - margin.right;
  const plotH = h - margin.top - margin.bottom;

  ctx.save();

  // Background panel
  ctx.fillStyle = 'rgba(13, 17, 23, 0.92)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  // Determine plot frequency and amplitude bounds
  const omegaMin = curvePoints[0]?.drivingFrequencyRad ?? 0;
  const omegaMax = curvePoints[curvePoints.length - 1]?.drivingFrequencyRad ?? 15;

  // Max finite amplitude for scaling
  let maxFiniteAmp = 0;
  for (const p of curvePoints) {
    if (Number.isFinite(p.amplitude) && p.amplitude > maxFiniteAmp) {
      maxFiniteAmp = p.amplitude;
    }
  }
  const displayMaxAmp = Math.max(0.5, Math.min(5.0, maxFiniteAmp * 1.15));

  // Axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + margin.left, y + margin.top);
  ctx.lineTo(x + margin.left, y + h - margin.bottom);
  ctx.lineTo(x + w - margin.right, y + h - margin.bottom);
  ctx.stroke();

  // Labels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Driving Frequency Ω (rad/s)', x + margin.left + plotW / 2, y + h - 8);

  ctx.save();
  ctx.translate(x + 14, y + margin.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Steady-State Amplitude A (m)', 0, 0);
  ctx.restore();

  // Title
  ctx.fillStyle = '#64B5F6';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Frequency Response Curve A(Ω)', x + margin.left, y + 20);

  // Frequency tick marks
  ctx.font = '10px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const freqTicks = 5;
  for (let i = 0; i <= freqTicks; i++) {
    const fVal = omegaMin + ((omegaMax - omegaMin) * i) / freqTicks;
    const px = x + margin.left + (i / freqTicks) * plotW;
    ctx.fillText(fVal.toFixed(1), px, y + h - margin.bottom + 4);
  }

  // Amplitude tick marks
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const ampTicks = 4;
  for (let i = 0; i <= ampTicks; i++) {
    const aVal = (displayMaxAmp * i) / ampTicks;
    const py = y + h - margin.bottom - (i / ampTicks) * plotH;
    ctx.fillText(aVal.toFixed(2), x + margin.left - 6, py);
  }

  // Draw Natural Frequency Marker Line (dashed cyan)
  if (naturalOmega >= omegaMin && naturalOmega <= omegaMax) {
    const omegaX = x + margin.left + ((naturalOmega - omegaMin) / (omegaMax - omegaMin)) * plotW;
    ctx.strokeStyle = 'rgba(77, 208, 225, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(omegaX, y + margin.top);
    ctx.lineTo(omegaX, y + h - margin.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#4DD0E1';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ω₀ = ${naturalOmega.toFixed(2)}`, omegaX, y + margin.top - 6);
  }

  // Draw Theoretical Resonance Curve A(Ω)
  // Handles singularity cleanly: if isSingularity or !Number.isFinite, breaks path safely
  ctx.strokeStyle = '#29B6F6';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  let inSubpath = false;

  for (let i = 0; i < curvePoints.length; i++) {
    const pt = curvePoints[i]!;
    const Omega = pt.drivingFrequencyRad;
    const Amp = pt.amplitude;

    if (pt.isSingularity || !Number.isFinite(Amp) || Amp < 0) {
      // Draw asymptotic line to top of plot area and break path
      if (inSubpath) {
        const px = x + margin.left + ((Omega - omegaMin) / (omegaMax - omegaMin)) * plotW;
        ctx.lineTo(px, y + margin.top);
      }
      inSubpath = false;
      continue;
    }

    const px = x + margin.left + ((Omega - omegaMin) / (omegaMax - omegaMin)) * plotW;
    // Clamp amplitude coordinate to top of plot area
    const clampedAmp = Math.min(displayMaxAmp, Amp);
    const py = y + h - margin.bottom - (clampedAmp / displayMaxAmp) * plotH;

    if (!inSubpath) {
      ctx.moveTo(px, py);
      inSubpath = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  // Resonance Peak Marker
  if (
    peakInfo.hasResonancePeak &&
    peakInfo.resonantFrequencyRad !== null &&
    Number.isFinite(peakInfo.peakAmplitude)
  ) {
    const resOmega = peakInfo.resonantFrequencyRad;
    const resAmp = Math.min(displayMaxAmp, peakInfo.peakAmplitude);
    const rx = x + margin.left + ((resOmega - omegaMin) / (omegaMax - omegaMin)) * plotW;
    const ry = y + h - margin.bottom - (resAmp / displayMaxAmp) * plotH;

    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(rx, ry, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFE082';
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Peak (${resOmega.toFixed(2)}, ${peakInfo.peakAmplitude.toFixed(2)}m)`, rx, ry - 8);
  }

  // Live Tracking Indicator for Current Driving Frequency Ω
  if (currentOmega >= omegaMin && currentOmega <= omegaMax) {
    const liveX = x + margin.left + ((currentOmega - omegaMin) / (omegaMax - omegaMin)) * plotW;

    // Dashed tracking vertical line
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(liveX, y + margin.top);
    ctx.lineTo(liveX, y + h - margin.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Find amplitude at current frequency
    let liveAmp = 0;
    for (let i = 0; i < curvePoints.length - 1; i++) {
      const p1 = curvePoints[i]!;
      const p2 = curvePoints[i + 1]!;
      if (currentOmega >= p1.drivingFrequencyRad && currentOmega <= p2.drivingFrequencyRad) {
        if (Number.isFinite(p1.amplitude) && Number.isFinite(p2.amplitude)) {
          const frac = (currentOmega - p1.drivingFrequencyRad) / (p2.drivingFrequencyRad - p1.drivingFrequencyRad || 1);
          liveAmp = p1.amplitude + frac * (p2.amplitude - p1.amplitude);
        } else {
          liveAmp = displayMaxAmp;
        }
        break;
      }
    }

    const liveY = y + h - margin.bottom - (Math.min(displayMaxAmp, liveAmp) / displayMaxAmp) * plotH;
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.arc(liveX, liveY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FFB74D';
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Ω = ${currentOmega.toFixed(2)} rad/s`, liveX + 8, liveY);
  }

  ctx.restore();
}
