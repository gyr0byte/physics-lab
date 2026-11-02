import { Vector2 } from '../core/Vector2';
import { Camera2D } from '../core/Camera2D';

/**
 * Canvas drawing helpers for simulation rendering.
 * All drawing operations take world coordinates and use Camera2D for conversion.
 */

/** Draw a grid with labeled axes */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  xRange: number,
  yRange: number,
  gridSpacing: number,
  options: {
    gridColor?: string;
    axisColor?: string;
    labelColor?: string;
    font?: string;
    xLabel?: string;
    yLabel?: string;
  } = {}
): void {
  const {
    gridColor = 'rgba(255, 255, 255, 0.08)',
    axisColor = 'rgba(255, 255, 255, 0.4)',
    labelColor = 'rgba(255, 255, 255, 0.6)',
    font = '13px system-ui, -apple-system, sans-serif',
    xLabel = 'x (m)',
    yLabel = 'y (m)',
  } = options;

  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Vertical grid lines
  for (let x = 0; x <= xRange; x += gridSpacing) {
    const screenStart = camera.worldToScreen(new Vector2(x, 0));
    const screenEnd = camera.worldToScreen(new Vector2(x, yRange));
    ctx.strokeStyle = x === 0 ? axisColor : gridColor;
    ctx.lineWidth = x === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(screenStart.x, screenStart.y);
    ctx.lineTo(screenEnd.x, screenEnd.y);
    ctx.stroke();

    // Label
    if (x % (gridSpacing * 2) === 0 || gridSpacing >= 5) {
      ctx.fillStyle = labelColor;
      ctx.fillText(`${x}`, screenStart.x, screenStart.y + 6);
    }
  }

  // Horizontal grid lines
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let y = 0; y <= yRange; y += gridSpacing) {
    const screenStart = camera.worldToScreen(new Vector2(0, y));
    const screenEnd = camera.worldToScreen(new Vector2(xRange, y));
    ctx.strokeStyle = y === 0 ? axisColor : gridColor;
    ctx.lineWidth = y === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(screenStart.x, screenStart.y);
    ctx.lineTo(screenEnd.x, screenEnd.y);
    ctx.stroke();

    if (y > 0 && (y % (gridSpacing * 2) === 0 || gridSpacing >= 5)) {
      ctx.fillStyle = labelColor;
      ctx.fillText(`${y}`, screenStart.x - 8, screenStart.y);
    }
  }

  // Axis labels
  ctx.fillStyle = labelColor;
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const xLabelPos = camera.worldToScreen(new Vector2(xRange / 2, 0));
  ctx.fillText(xLabel, xLabelPos.x, xLabelPos.y + 24);

  ctx.save();
  ctx.translate(20, camera.worldToScreen(new Vector2(0, yRange / 2)).y);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  ctx.restore();
}

/** Draw a vector arrow from a world-space origin */
export function drawVectorArrow(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  origin: Vector2,
  vector: Vector2,
  color: string,
  options: {
    label?: string;
    scale?: number;
    lineWidth?: number;
    headSize?: number;
  } = {}
): void {
  const { label, scale = 1, lineWidth = 2.5, headSize = 10 } = options;

  const screenOrigin = camera.worldToScreen(origin);
  const screenEnd = camera.worldToScreen(origin.add(vector.scale(scale)));

  const dx = screenEnd.x - screenOrigin.x;
  const dy = screenEnd.y - screenOrigin.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return; // Too small to draw

  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // Shaft
  ctx.beginPath();
  ctx.moveTo(screenOrigin.x, screenOrigin.y);
  ctx.lineTo(screenEnd.x, screenEnd.y);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(screenEnd.x, screenEnd.y);
  ctx.lineTo(
    screenEnd.x - headSize * Math.cos(angle - Math.PI / 6),
    screenEnd.y - headSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    screenEnd.x - headSize * Math.cos(angle + Math.PI / 6),
    screenEnd.y - headSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  // Label
  if (label) {
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const labelX = screenEnd.x + 14 * Math.cos(angle);
    const labelY = screenEnd.y + 14 * Math.sin(angle) - 4;
    ctx.fillText(label, labelX, labelY);
  }

  ctx.restore();
}

/** Draw a filled circle at a world position */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  worldPos: Vector2,
  radiusPx: number,
  color: string
): void {
  const screen = camera.worldToScreen(worldPos);
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, radiusPx, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Draw a trajectory path from an array of world-space points */
export function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  points: Vector2[],
  color: string,
  lineWidth: number = 2
): void {
  if (points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  const first = camera.worldToScreen(points[0]!);
  ctx.moveTo(first.x, first.y);

  for (let i = 1; i < points.length; i++) {
    const p = camera.worldToScreen(points[i]!);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();
}

/** Draw the ground line */
export function drawGround(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  xRange: number
): void {
  const start = camera.worldToScreen(new Vector2(0, 0));
  const end = camera.worldToScreen(new Vector2(xRange, 0));

  ctx.save();
  ctx.strokeStyle = 'rgba(139, 195, 74, 0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Ground hatching
  ctx.strokeStyle = 'rgba(139, 195, 74, 0.2)';
  ctx.lineWidth = 1;
  const spacing = 12;
  for (let sx = start.x; sx <= end.x; sx += spacing) {
    ctx.beginPath();
    ctx.moveTo(sx, start.y);
    ctx.lineTo(sx - 8, start.y + 10);
    ctx.stroke();
  }
  ctx.restore();
}

/** Draw a horizontal track with distance tick marks */
export function drawTrack(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  xMin: number,
  xMax: number,
  step: number = 5
): void {
  const p1 = camera.worldToScreen(new Vector2(xMin, 0));
  const p2 = camera.worldToScreen(new Vector2(xMax, 0));

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Tick marks and distance labels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) {
    const tickScreen = camera.worldToScreen(new Vector2(x, 0));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tickScreen.x, tickScreen.y);
    ctx.lineTo(tickScreen.x, tickScreen.y + 8);
    ctx.stroke();

    ctx.fillText(`${x} m`, tickScreen.x, tickScreen.y + 12);
  }

  ctx.restore();
}

/** Draw a mass block resting on a surface */
export function drawBlock(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  bottomCenterWorld: Vector2,
  widthWorld: number,
  heightWorld: number,
  options: {
    fillColor?: string;
    strokeColor?: string;
    label?: string;
    labelColor?: string;
  } = {}
): void {
  const {
    fillColor = '#2196F3',
    strokeColor = '#64B5F6',
    label = '',
    labelColor = '#ffffff',
  } = options;

  const bc = camera.worldToScreen(bottomCenterWorld);
  const wPx = Math.max(10, widthWorld * camera.scale);
  const hPx = Math.max(10, heightWorld * camera.scale);

  const left = bc.x - wPx / 2;
  const top = bc.y - hPx;

  ctx.save();

  // Block body
  ctx.fillStyle = fillColor;
  ctx.fillRect(left, top, wPx, hPx);

  // Border
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(left, top, wPx, hPx);

  // Surface texture / diagonal cross pattern for crate aesthetic
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left + wPx, top + hPx);
  ctx.moveTo(left + wPx, top);
  ctx.lineTo(left, top + hPx);
  ctx.stroke();

  // Mass label in the center
  if (label) {
    ctx.fillStyle = labelColor;
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bc.x, top + hPx / 2);
  }

  ctx.restore();
}

