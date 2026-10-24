import type { PreviewLayout } from "../PreviewPanel";

export interface GraphieCoords {
  /** Graphie cartesian range [[xMin,xMax],[yMin,yMax]]. */
  range: [[number, number], [number, number]];
  /** Pixel scale per axis [sx, sy]. */
  scale: [number, number];
  /** Rendered canvas (graphie-host) pixel width/height. */
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

// Default coordinate space matching store.DEFAULT_DOCUMENT.
export const DEFAULT_COORDS: GraphieCoords = {
  range: [[-10, 10], [-10, 10]],
  scale: [30, 30],
  width: 600,
  height: 600,
};

export function layoutToCoords(l: PreviewLayout | null): GraphieCoords {
  if (!l) return DEFAULT_COORDS;
  return {
    range: [
      [l.range[0][0], l.range[0][1]],
      [l.range[1][0], l.range[1][1]],
    ],
    scale: [l.scale[0], l.scale[1]],
    width: l.width,
    height: l.height,
  };
}

export function toGraphieCoords(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  c: GraphieCoords,
  gridSize?: number
): Point {
  const nx = (clientX - rect.left) / rect.width;
  const ny = (clientY - rect.top) / rect.height;
  const xRange = c.range[0][1] - c.range[0][0];
  const yRange = c.range[1][1] - c.range[1][0];
  const x = c.range[0][0] + nx * xRange;
  const y = c.range[1][1] - ny * yRange;
  if (gridSize && gridSize > 0) {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }
  return { x, y };
}

/** Snap a single value to the nearest multiple of gridSize. */
export function snap(value: number, gridSize?: number): number {
  if (!gridSize || gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

export function toCanvasCoords(p: Point, rect: DOMRect, c: GraphieCoords): Point {
  const xRange = c.range[0][1] - c.range[0][0];
  const yRange = c.range[1][1] - c.range[1][0];
  const nx = (p.x - c.range[0][0]) / xRange;
  const ny = (c.range[1][1] - p.y) / yRange;
  return {
    x: rect.left + nx * rect.width,
    y: rect.top + ny * rect.height,
  };
}

/** Convert a graphie cartesian point to a percentage of the canvas rect. */
export function toPercent(x: number, y: number, c: GraphieCoords): { left: number; top: number } {
  const xRange = c.range[0][1] - c.range[0][0];
  const yRange = c.range[1][1] - c.range[1][0];
  const px = ((x - c.range[0][0]) / xRange) * 100;
  const py = ((c.range[1][1] - y) / yRange) * 100;
  return { left: px, top: py };
}
