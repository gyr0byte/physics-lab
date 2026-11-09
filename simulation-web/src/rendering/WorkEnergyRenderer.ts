import { Vector2 } from '../core/Vector2';
import { Camera2D } from '../core/Camera2D';
import {
  WORK_ENERGY_CONSTANTS,
  computeWorkEnergyForces,
  computeWorkEnergyLedger,
  type WorkEnergyParams,
  type WorkEnergyState,
  type WorkEnergyForceBreakdown,
  type WorkEnergyEnergyBreakdown,
} from '../physics/WorkEnergyPhysics';
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
 * World coordinate transformation and key geometric points for the inclined apparatus.
 */
export interface InclineWorldTransform {
  /** Origin point on track surface where displacement s = 0 (top release point) */
  p0World: Vector2;
  /** Downhill unit vector along the track surface */
  uDownhill: Vector2;
  /** Normal unit vector pointing perpendicular to track upwards */
  uNormal: Vector2;
  /** Incline angle in radians */
  thetaRad: number;
  /** Position of block downhill contact face on track surface */
  blockDownhillFaceWorld: Vector2;
  /** Position of block uphill face on track surface */
  blockUphillFaceWorld: Vector2;
  /** Center of mass of the block in world coordinates */
  blockCenterWorld: Vector2;
  /** Four corners of the rectangular block in world coordinates */
  blockCornersWorld: Vector2[];
  /** Fixed lower spring anchor bracket on track surface */
  springAnchorWorld: Vector2;
  /** Free/contact end of the spring in world coordinates */
  springTopWorld: Vector2;
  /** Contact reference position where s = 3.50 m */
  springContactPosWorld: Vector2;
  /** Solid height limit reference position where s = 4.90 m */
  solidHeightPosWorld: Vector2;
  /** Start of track rail in world coordinates (s = -0.80 m) */
  trackStartWorld: Vector2;
  /** End of track rail in world coordinates (s = 5.15 m) */
  trackEndWorld: Vector2;
}

/**
 * Compute the complete world-space geometric transformation for the inclined apparatus.
 *
 * @param params Simulation parameters
 * @param stateOrDisplacement Current physical state or displacement s in meters
 * @param originWorld Optional world position for s=0 (default: X=1.20 m, Y=3.60 m)
 */
export function computeInclineTransform(
  params: WorkEnergyParams,
  stateOrDisplacement: WorkEnergyState | number,
  originWorld: Vector2 = new Vector2(1.20, 3.60)
): InclineWorldTransform {
  const thetaRad = (params.inclineAngleDeg * Math.PI) / 180;

  // Downhill unit vector along the track (positive s)
  const uDownhill = new Vector2(Math.cos(thetaRad), -Math.sin(thetaRad));
  // Normal unit vector perpendicular to the track (pointing away from track surface)
  const uNormal = new Vector2(Math.sin(thetaRad), Math.cos(thetaRad));

  const s =
    typeof stateOrDisplacement === 'number'
      ? stateOrDisplacement
      : stateOrDisplacement.displacement;
  const blockLength = WORK_ENERGY_CONSTANTS.BLOCK_LENGTH; // 0.30 m
  const blockHeight = 0.20; // 0.20 m perpendicular to track

  // Downhill face on the track surface: P0 + s * u
  const blockDownhillFaceWorld = new Vector2(
    originWorld.x + s * uDownhill.x,
    originWorld.y + s * uDownhill.y
  );

  // Uphill face on the track surface: downhill face - blockLength * u
  const blockUphillFaceWorld = new Vector2(
    blockDownhillFaceWorld.x - blockLength * uDownhill.x,
    blockDownhillFaceWorld.y - blockLength * uDownhill.y
  );

  // Center of mass
  const blockCenterWorld = new Vector2(
    originWorld.x + (s - blockLength / 2) * uDownhill.x + (blockHeight / 2) * uNormal.x,
    originWorld.y + (s - blockLength / 2) * uDownhill.y + (blockHeight / 2) * uNormal.y
  );

  // Four corners in world space
  const blockCornersWorld: Vector2[] = [
    // 0: Downhill bottom
    new Vector2(blockDownhillFaceWorld.x, blockDownhillFaceWorld.y),
    // 1: Downhill top
    new Vector2(
      blockDownhillFaceWorld.x + blockHeight * uNormal.x,
      blockDownhillFaceWorld.y + blockHeight * uNormal.y
    ),
    // 2: Uphill top
    new Vector2(
      blockUphillFaceWorld.x + blockHeight * uNormal.x,
      blockUphillFaceWorld.y + blockHeight * uNormal.y
    ),
    // 3: Uphill bottom
    new Vector2(blockUphillFaceWorld.x, blockUphillFaceWorld.y),
  ];

  // Lower spring anchor bracket at s = 5.00 m
  const springAnchorWorld = new Vector2(
    originWorld.x + WORK_ENERGY_CONSTANTS.TRACK_LENGTH * uDownhill.x,
    originWorld.y + WORK_ENERGY_CONSTANTS.TRACK_LENGTH * uDownhill.y
  );

  // Contact reference line at s = 3.50 m
  const springContactPosWorld = new Vector2(
    originWorld.x + WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS * uDownhill.x,
    originWorld.y + WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS * uDownhill.y
  );

  // Solid height limit reference line at s = 4.90 m
  const solidHeightPosWorld = new Vector2(
    originWorld.x + WORK_ENERGY_CONSTANTS.LOWER_TRAVEL_LIMIT * uDownhill.x,
    originWorld.y + WORK_ENERGY_CONSTANTS.LOWER_TRAVEL_LIMIT * uDownhill.y
  );

  // Spring top end: attached to block downhill face when s >= 3.50 m, else at s = 3.50 m
  const springTopS = Math.min(
    WORK_ENERGY_CONSTANTS.LOWER_TRAVEL_LIMIT,
    Math.max(WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS, s)
  );
  const springTopWorld = new Vector2(
    originWorld.x + springTopS * uDownhill.x,
    originWorld.y + springTopS * uDownhill.y
  );

  // Track extents
  const trackStartWorld = new Vector2(
    originWorld.x - 0.80 * uDownhill.x,
    originWorld.y - 0.80 * uDownhill.y
  );
  const trackEndWorld = new Vector2(
    originWorld.x + 5.15 * uDownhill.x,
    originWorld.y + 5.15 * uDownhill.y
  );

  return {
    p0World: originWorld,
    uDownhill,
    uNormal,
    thetaRad,
    blockDownhillFaceWorld,
    blockUphillFaceWorld,
    blockCenterWorld,
    blockCornersWorld,
    springAnchorWorld,
    springTopWorld,
    springContactPosWorld,
    solidHeightPosWorld,
    trackStartWorld,
    trackEndWorld,
  };
}

/**
 * Draws a realistic coiled helical compression spring between two world-space points.
 */
export function drawCoiledHelicalSpring(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  pStartWorld: Vector2,
  pEndWorld: Vector2,
  options: {
    numCoils?: number;
    coilRadiusWorld?: number;
    color?: string;
    lineWidth?: number;
    isContact?: boolean;
  } = {}
): void {
  if (!areFinite(pStartWorld.x, pStartWorld.y, pEndWorld.x, pEndWorld.y)) {
    return;
  }

  const {
    numCoils = 14,
    coilRadiusWorld = 0.08,
    color = '#38BDF8',
    lineWidth = 2.5,
  } = options;

  const dx = pEndWorld.x - pStartWorld.x;
  const dy = pEndWorld.y - pStartWorld.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 0.01) return; // Degenerate length

  const ux = dx / length;
  const uy = dy / length;
  // Perpendicular normal vector
  const nx = -uy;
  const ny = ux;

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

  const totalSegments = numCoils * 2;
  const segmentLength = coilLength / totalSegments;

  for (let i = 1; i <= totalSegments; i++) {
    const s = leadLength + i * segmentLength;
    const sign = i % 2 === 1 ? 1 : -1;
    const taper = Math.sin((i / totalSegments) * Math.PI);
    const radius = coilRadiusWorld * (0.65 + 0.35 * taper);

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
 * Draws the inclined support wedge structure and ground base line.
 */
export function drawInclineWedge(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  transform: InclineWorldTransform,
  groundY: number = 0.50
): void {
  const pStart = transform.trackStartWorld;
  const pEnd = transform.trackEndWorld;

  const startScreen = camera.worldToScreen(pStart);
  const endScreen = camera.worldToScreen(pEnd);
  const baseLeftScreen = camera.worldToScreen(new Vector2(pStart.x, groundY));
  const baseRightScreen = camera.worldToScreen(new Vector2(pEnd.x + 0.30, groundY));

  ctx.save();

  // Wedge background fill with subtle gradient
  ctx.beginPath();
  ctx.moveTo(startScreen.x, startScreen.y);
  ctx.lineTo(endScreen.x, endScreen.y);
  ctx.lineTo(baseRightScreen.x, baseRightScreen.y);
  ctx.lineTo(baseLeftScreen.x, baseLeftScreen.y);
  ctx.closePath();

  ctx.fillStyle = 'rgba(30, 41, 59, 0.45)'; // Slate dark wedge
  ctx.fill();

  // Truss / cross-strut internal lines
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
  ctx.lineWidth = 1;
  const numTrusses = 6;
  const dx = (pEnd.x - pStart.x) / numTrusses;
  const dy = (pEnd.y - pStart.y) / numTrusses;

  ctx.beginPath();
  for (let i = 1; i < numTrusses; i++) {
    const ptTopWorld = new Vector2(pStart.x + i * dx, pStart.y + i * dy);
    const ptBotWorld = new Vector2(pStart.x + i * dx, groundY);
    const sTop = camera.worldToScreen(ptTopWorld);
    const sBot = camera.worldToScreen(ptBotWorld);
    ctx.moveTo(sTop.x, sTop.y);
    ctx.lineTo(sBot.x, sBot.y);
  }
  ctx.stroke();

  // Ground base line with hatching
  ctx.beginPath();
  ctx.moveTo(baseLeftScreen.x - 30, baseLeftScreen.y);
  ctx.lineTo(baseRightScreen.x + 30, baseRightScreen.y);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the inclined guide rail, tick graduations, and spring limit markers.
 */
export function drawInclineTrack(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  transform: InclineWorldTransform
): void {
  const pStart = transform.trackStartWorld;
  const pEnd = transform.trackEndWorld;
  const uD = transform.uDownhill;
  const uN = transform.uNormal;
  const p0 = transform.p0World;

  const startScreen = camera.worldToScreen(pStart);
  const endScreen = camera.worldToScreen(pEnd);

  ctx.save();

  // 1. Guide rail metallic surface
  ctx.beginPath();
  ctx.moveTo(startScreen.x, startScreen.y);
  ctx.lineTo(endScreen.x, endScreen.y);
  ctx.strokeStyle = '#94A3B8'; // Slate 400 rail
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Sub-rail plate
  const railThick = 0.05;
  const pStartSub = new Vector2(pStart.x - railThick * uN.x, pStart.y - railThick * uN.y);
  const pEndSub = new Vector2(pEnd.x - railThick * uN.x, pEnd.y - railThick * uN.y);
  const sStartSub = camera.worldToScreen(pStartSub);
  const sEndSub = camera.worldToScreen(pEndSub);

  ctx.beginPath();
  ctx.moveTo(sStartSub.x, sStartSub.y);
  ctx.lineTo(sEndSub.x, sEndSub.y);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 2. Graduations along track from s = -0.50 m to s = 5.00 m
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';

  const graduationTicks = [
    { s: 0.0, label: '0.0m (Release)' },
    { s: 1.0, label: '1.0m' },
    { s: 2.0, label: '2.0m' },
    { s: 3.0, label: '3.0m' },
    { s: 3.5, label: '3.5m (Contact)' },
    { s: 4.0, label: '4.0m' },
    { s: 4.9, label: '4.9m (Solid)' },
  ];

  for (const tick of graduationTicks) {
    const ptWorld = new Vector2(p0.x + tick.s * uD.x, p0.y + tick.s * uD.y);
    const tickTopWorld = new Vector2(ptWorld.x + 0.06 * uN.x, ptWorld.y + 0.06 * uN.y);
    const tickBotWorld = new Vector2(ptWorld.x - 0.06 * uN.x, ptWorld.y - 0.06 * uN.y);

    const sTop = camera.worldToScreen(tickTopWorld);
    const sBot = camera.worldToScreen(tickBotWorld);

    ctx.beginPath();
    ctx.moveTo(sTop.x, sTop.y);
    ctx.lineTo(sBot.x, sBot.y);
    ctx.strokeStyle = tick.s === 3.5 ? '#38BDF8' : tick.s === 4.9 ? '#F43F5E' : '#94A3B8';
    ctx.lineWidth = tick.s === 3.5 || tick.s === 4.9 ? 2 : 1;
    ctx.stroke();

    // Text label
    const labelPosWorld = new Vector2(ptWorld.x - 0.16 * uN.x, ptWorld.y - 0.16 * uN.y);
    const sLabel = camera.worldToScreen(labelPosWorld);
    ctx.fillText(tick.label, sLabel.x, sLabel.y);
  }

  // 3. Spring contact threshold dashed line (s = 3.50 m)
  const contactPt = transform.springContactPosWorld;
  const contactTop = new Vector2(contactPt.x + 0.35 * uN.x, contactPt.y + 0.35 * uN.y);
  const sContactPt = camera.worldToScreen(contactPt);
  const sContactTop = camera.worldToScreen(contactTop);

  ctx.beginPath();
  ctx.setLineDash([3, 3]);
  ctx.moveTo(sContactPt.x, sContactPt.y);
  ctx.lineTo(sContactTop.x, sContactTop.y);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'; // Cyan dashed
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. Solid height limit threshold line (s = 4.90 m)
  const solidPt = transform.solidHeightPosWorld;
  const solidTop = new Vector2(solidPt.x + 0.35 * uN.x, solidPt.y + 0.35 * uN.y);
  const sSolidPt = camera.worldToScreen(solidPt);
  const sSolidTop = camera.worldToScreen(solidTop);

  ctx.beginPath();
  ctx.setLineDash([3, 3]);
  ctx.moveTo(sSolidPt.x, sSolidPt.y);
  ctx.lineTo(sSolidTop.x, sSolidTop.y);
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)'; // Red dashed
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  // 5. Lower rigid anchor bracket at s = 5.00 m
  const anchorPt = transform.springAnchorWorld;
  const anchorTop = new Vector2(anchorPt.x + 0.28 * uN.x, anchorPt.y + 0.28 * uN.y);
  const sAnchorPt = camera.worldToScreen(anchorPt);
  const sAnchorTop = camera.worldToScreen(anchorTop);

  ctx.beginPath();
  ctx.moveTo(sAnchorPt.x, sAnchorPt.y);
  ctx.lineTo(sAnchorTop.x, sAnchorTop.y);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the sliding block on the inclined track.
 */
export function drawSlidingBlock(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  transform: InclineWorldTransform,
  mass: number,
  isStatic: boolean
): void {
  const corners = transform.blockCornersWorld;
  const corner0 = corners[0];
  if (corners.length < 4 || !corner0 || !areFinite(corner0.x, corner0.y)) {
    return;
  }

  const screenCorners = corners.map((c) => camera.worldToScreen(c));
  const c0 = screenCorners[0];
  const c1 = screenCorners[1];
  const c2 = screenCorners[2];
  const c3 = screenCorners[3];
  if (!c0 || !c1 || !c2 || !c3) return;

  ctx.save();

  // Block body polygon
  ctx.beginPath();
  ctx.moveTo(c0.x, c0.y);
  ctx.lineTo(c1.x, c1.y);
  ctx.lineTo(c2.x, c2.y);
  ctx.lineTo(c3.x, c3.y);
  ctx.closePath();

  // Gradient fill
  const grad = ctx.createLinearGradient(
    c2.x,
    c2.y,
    c0.x,
    c0.y
  );
  if (isStatic) {
    grad.addColorStop(0, '#334155');
    grad.addColorStop(1, '#1E293B');
  } else {
    grad.addColorStop(0, '#0284C7'); // Sky blue gradient
    grad.addColorStop(1, '#0369A1');
  }

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = isStatic ? '#94A3B8' : '#38BDF8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Mass text label at center of block
  const centerScreen = camera.worldToScreen(transform.blockCenterWorld);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${mass.toFixed(1)} kg`, centerScreen.x, centerScreen.y);

  ctx.restore();
}

/**
 * Draws force and velocity vectors on the block.
 */
export function drawWorkEnergyVectors(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  transform: InclineWorldTransform,
  forces: WorkEnergyForceBreakdown,
  velocity: number
): void {
  const center = transform.blockCenterWorld;
  if (!areFinite(center.x, center.y)) return;

  const uD = transform.uDownhill;
  const uN = transform.uNormal;

  // Scale: 20 N = 0.50 meters in world coordinates
  const forceScale = 0.025; // m/N
  // Velocity scale: 2.0 m/s = 0.40 meters in world coordinates
  const velScale = 0.15; // m per (m/s)

  // 1. Normal reaction vector (along +uN)
  if (Math.abs(forces.normalReaction) > 0.01) {
    const vecN = new Vector2(
      forces.normalReaction * forceScale * uN.x,
      forces.normalReaction * forceScale * uN.y
    );
    drawVectorArrow(ctx, camera, center, vecN, '#06B6D4', {
      lineWidth: 2.5,
      label: `N = ${forces.normalReaction.toFixed(1)} N`,
    });
  }

  // 2. Downhill gravity parallel component (along +uD)
  if (Math.abs(forces.gravityParallel) > 0.01) {
    const vecFg = new Vector2(
      forces.gravityParallel * forceScale * uD.x,
      forces.gravityParallel * forceScale * uD.y
    );
    drawVectorArrow(ctx, camera, center, vecFg, '#10B981', {
      lineWidth: 2.5,
      label: `F_g = ${forces.gravityParallel.toFixed(1)} N`,
    });
  }

  // 3. Friction force (along track)
  if (Math.abs(forces.frictionForce) > 0.01) {
    // Note: frictionForce in coordinate s opposes velocity or balances driving force
    const vecFric = new Vector2(
      forces.frictionForce * forceScale * uD.x,
      forces.frictionForce * forceScale * uD.y
    );
    drawVectorArrow(ctx, camera, center, vecFric, '#F43F5E', {
      lineWidth: 2.5,
      label: `f = ${Math.abs(forces.frictionForce).toFixed(1)} N`,
    });
  }

  // 4. Spring restoring force (when compressed, acts uphill)
  if (Math.abs(forces.springForce) > 0.01) {
    const vecFs = new Vector2(
      forces.springForce * forceScale * uD.x,
      forces.springForce * forceScale * uD.y
    );
    drawVectorArrow(ctx, camera, transform.blockDownhillFaceWorld, vecFs, '#F59E0B', {
      lineWidth: 2.5,
      label: `F_s = ${Math.abs(forces.springForce).toFixed(1)} N`,
    });
  }

  // 5. Velocity vector (along track)
  if (Math.abs(velocity) > 0.02) {
    const vecVel = new Vector2(
      velocity * velScale * uD.x,
      velocity * velScale * uD.y
    );
    // Position slightly above the block
    const velOrigin = new Vector2(center.x + 0.15 * uN.x, center.y + 0.15 * uN.y);
    drawVectorArrow(ctx, camera, velOrigin, vecVel, '#38BDF8', {
      lineWidth: 2.0,
      label: `v = ${velocity.toFixed(2)} m/s`,
    });
  }
}

/**
 * Draws status alerts and warning banners for travel limit exceeded and static friction.
 */
export function drawWorkEnergyStatusBanner(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  state: WorkEnergyState
): void {
  ctx.save();

  if (state.status === 'exceeded') {
    // Red-orange warning banner across the top
    ctx.fillStyle = 'rgba(239, 68, 68, 0.90)';
    ctx.fillRect(0, 0, canvasWidth, 36);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `⚠️ TRAVEL LIMIT EXCEEDED: ${state.statusMessage ?? 'Spring compressed to solid height limit'}`,
      canvasWidth / 2,
      18
    );
  } else if (state.status === 'at_rest') {
    // Cyan static friction equilibrium badge
    const badgeW = 280;
    const badgeH = 26;
    const badgeX = canvasWidth / 2 - badgeW / 2;
    const badgeY = 8;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒 STATIC FRICTION EQUILIBRIUM (At Rest)', canvasWidth / 2, badgeY + badgeH / 2);
  }

  ctx.restore();
}

/**
 * Draws an elegant, scaled live energy bar HUD overlay directly on the canvas.
 */
export function drawEnergyBarsOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  ledger: WorkEnergyEnergyBreakdown
): void {
  ctx.save();

  const height = 120;
  // Panel background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();
  ctx.stroke();

  // Header
  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LIVE ENERGY ACCOUNTING (J)', x + 10, y + 16);

  const maxE = Math.max(0.1, ledger.initialEnergy);
  const barMaxW = width - 110;
  const barH = 10;
  const startX = x + 48;

  const energyItems = [
    { label: 'K', val: ledger.kineticEnergy, color: '#38BDF8' }, // Cyan
    { label: 'Ug', val: ledger.gravitationalPE, color: '#10B981' }, // Green
    { label: 'Us', val: ledger.elasticPE, color: '#F59E0B' }, // Amber
    { label: 'Q', val: ledger.thermalEnergy, color: '#F43F5E' }, // Rose/Red
  ];

  energyItems.forEach((item, index) => {
    const rowY = y + 26 + index * 17;
    // Label
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, x + 10, rowY + 9);

    // Track background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(startX, rowY, barMaxW, barH);

    // Active bar
    const barW = Math.max(0, Math.min(barMaxW, (item.val / maxE) * barMaxW));
    if (barW > 0) {
      ctx.fillStyle = item.color;
      ctx.fillRect(startX, rowY, barW, barH);
    }

    // Value text
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${item.val.toFixed(1)} J`, x + width - 10, rowY + 9);
  });

  // Footer: Total vs E0
  const footerY = y + height - 14;
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Total: ${ledger.totalEnergy.toFixed(1)} J / E₀: ${ledger.initialEnergy.toFixed(1)} J`, x + 10, footerY);

  ctx.restore();
}

/**
 * Configure Camera2D view bounds to completely frame the inclined apparatus,
 * moving block, compression spring, and support wedge across all operating limits.
 */
export function frameWorkEnergyCamera(
  camera: Camera2D,
  params: WorkEnergyParams
): void {
  const thetaRad = (params.inclineAngleDeg * Math.PI) / 180;
  const uD = new Vector2(Math.cos(thetaRad), -Math.sin(thetaRad));
  const p0 = new Vector2(1.20, 3.60);

  // Compute extreme points
  const pUpper = new Vector2(p0.x - 0.80 * uD.x, p0.y - 0.80 * uD.y);
  const pLower = new Vector2(p0.x + 5.20 * uD.x, p0.y + 5.20 * uD.y);
  const groundY = 0.50;

  const minX = Math.min(pUpper.x, pLower.x) - 0.60;
  const maxX = Math.max(pUpper.x, pLower.x) + 0.60;
  const minY = Math.min(groundY, pLower.y) - 0.30;
  const maxY = Math.max(pUpper.y, p0.y) + 0.60;

  const worldWidth = maxX - minX;
  const worldHeight = maxY - minY;

  const marginX = 80;
  const marginY = 60;
  const availW = Math.max(100, camera.canvasWidth - 2 * marginX);
  const availH = Math.max(100, camera.canvasHeight - 2 * marginY);

  const scale = Math.min(availW / worldWidth, availH / worldHeight);
  camera.setScale(scale);

  const originX = marginX - minX * scale;
  const originY = camera.canvasHeight - marginY + minY * scale;

  camera.setOrigin(originX, originY);
}

/**
 * Top-level render pipeline for the complete Work, Energy & Power apparatus.
 */
export function renderWorkEnergyApparatus(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  params: WorkEnergyParams,
  state: WorkEnergyState,
  canvasWidth: number,
  canvasHeight: number
): void {
  // Clear canvas background
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Frame camera to apparatus bounds
  frameWorkEnergyCamera(camera, params);

  // Compute apparatus geometry
  const transform = computeInclineTransform(params, state.displacement);

  // 1. Structural wedge
  drawInclineWedge(ctx, camera, transform);

  // 2. Metallic guide rail and graduations
  drawInclineTrack(ctx, camera, transform);

  // 3. Coiled compression spring
  const isCompressed = state.displacement >= WORK_ENERGY_CONSTANTS.SPRING_CONTACT_POS;
  drawCoiledHelicalSpring(
    ctx,
    camera,
    transform.springAnchorWorld,
    transform.springTopWorld,
    {
      numCoils: 14,
      coilRadiusWorld: 0.08,
      color: isCompressed ? '#F59E0B' : '#38BDF8',
      lineWidth: 2.5,
      isContact: isCompressed,
    }
  );

  // 4. Sliding block
  drawSlidingBlock(ctx, camera, transform, params.mass, state.status === 'at_rest');

  // 5. Force and velocity vectors
  const forces = computeWorkEnergyForces(params, state);
  drawWorkEnergyVectors(ctx, camera, transform, forces, state.velocity);

  // 6. Travel limit & equilibrium banners
  drawWorkEnergyStatusBanner(ctx, canvasWidth, state);

  // 7. Live Energy Accounting HUD overlay
  const ledger = computeWorkEnergyLedger(params, state);
  drawEnergyBarsOverlay(ctx, 16, 16, 260, ledger);
}
