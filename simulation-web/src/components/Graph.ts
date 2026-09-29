/**
 * Real-time data graph component rendered to a canvas element.
 * Displays one or more time-series with labeled axes.
 */
export interface GraphSeries {
  label: string;
  color: string;
  data: { t: number; v: number }[];
}

export class Graph {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private _series: GraphSeries[] = [];
  private _maxPoints: number = 500;

  /** Axis labels */
  private _xLabel: string;
  private _yLabel: string;

  constructor(
    container: HTMLElement,
    width: number,
    height: number,
    xLabel: string = 'Time (s)',
    yLabel: string = ''
  ) {
    this._canvas = document.createElement('canvas');
    this._canvas.width = width;
    this._canvas.height = height;
    this._canvas.style.borderRadius = '8px';
    this._canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    container.appendChild(this._canvas);
    this._xLabel = xLabel;
    this._yLabel = yLabel;

    const ctx = this._canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context for graph');
    this._ctx = ctx;
  }

  addSeries(label: string, color: string): number {
    const index = this._series.length;
    this._series.push({ label, color, data: [] });
    return index;
  }

  pushData(seriesIndex: number, t: number, v: number): void {
    const series = this._series[seriesIndex];
    if (!series) return;
    series.data.push({ t, v });
    // Bounded buffer
    if (series.data.length > this._maxPoints) {
      series.data.shift();
    }
  }

  clear(): void {
    for (const s of this._series) {
      s.data = [];
    }
  }

  render(): void {
    const ctx = this._ctx;
    const w = this._canvas.width;
    const h = this._canvas.height;
    const margin = { top: 12, right: 16, bottom: 32, left: 48 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    ctx.clearRect(0, 0, w, h);

    // Find data range
    let tMin = 0,
      tMax = 1,
      vMin = 0,
      vMax = 1;
    for (const s of this._series) {
      for (const d of s.data) {
        if (d.t > tMax) tMax = d.t;
        if (d.v < vMin) vMin = d.v;
        if (d.v > vMax) vMax = d.v;
      }
    }
    // Add 10% padding on Y
    const vRange = vMax - vMin || 1;
    vMin -= vRange * 0.1;
    vMax += vRange * 0.1;

    // Axes
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, h - margin.bottom);
    ctx.lineTo(w - margin.right, h - margin.bottom);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this._xLabel, margin.left + plotW / 2, h - 4);
    ctx.save();
    ctx.translate(12, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(this._yLabel, 0, 0);
    ctx.restore();

    // Tick labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const v = vMin + ((vMax - vMin) * i) / yTicks;
      const y = h - margin.bottom - (i / yTicks) * plotH;
      ctx.fillText(v.toFixed(1), margin.left - 4, y);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xTicks = 5;
    for (let i = 0; i <= xTicks; i++) {
      const t = tMin + ((tMax - tMin) * i) / xTicks;
      const x = margin.left + (i / xTicks) * plotW;
      ctx.fillText(t.toFixed(1), x, h - margin.bottom + 4);
    }

    // Plot series
    for (const s of this._series) {
      if (s.data.length < 2) continue;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let started = false;
      for (const d of s.data) {
        const x = margin.left + ((d.t - tMin) / (tMax - tMin)) * plotW;
        const y =
          h - margin.bottom - ((d.v - vMin) / (vMax - vMin)) * plotH;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Legend
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '11px "Inter", sans-serif';
    let lx = margin.left + 8;
    for (const s of this._series) {
      ctx.fillStyle = s.color;
      ctx.fillRect(lx, margin.top + 4, 12, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(s.label, lx + 16, margin.top);
      lx += ctx.measureText(s.label).width + 32;
    }

    ctx.restore();
  }

  dispose(): void {
    this._canvas.remove();
  }
}
