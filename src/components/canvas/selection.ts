import type { IRNode } from "../../ir/types";
import type { Point } from "./coords";

export type Rect2 = { x: number; y: number; w: number; h: number };

export function nodePoints(n: IRNode): Point[] {
  if (n.points && n.points.length > 0) {
    return n.points.map((p) => ({ x: p[0], y: p[1] }));
  }
  const pts: Point[] = [{ x: n.x, y: n.y }];
  if (n.x2 !== undefined && n.y2 !== undefined) pts.push({ x: n.x2, y: n.y2 });
  return pts;
}

export function boundingBox(nodes: IRNode[]): Rect2 | null {
  if (nodes.length === 0) return null;
  const pts = nodes.flatMap(nodePoints);
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function marqueeSelect(nodes: IRNode[], start: Point, end: Point): string[] {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  return nodes
    .filter((n) => {
      const pts = nodePoints(n);
      return pts.some((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY);
    })
    .map((n) => n.id);
}
