import { describe, it, expect } from "vitest";
import {
  DEFAULT_COORDS,
  layoutToCoords,
  toCanvasCoords,
  toGraphieCoords,
  toPercent,
} from "./coords";

describe("canvas/coords", () => {
  const coords = DEFAULT_COORDS;
  const rect = new DOMRect(0, 0, 600, 600);

  it("layoutToCoords returns DEFAULT_COORDS when null", () => {
    expect(layoutToCoords(null)).toEqual(coords);
  });

  it("layoutToCoords copies range/scale/width/height", () => {
    const l = {
      range: [[-5, 5], [-2, 2]] as [[number, number], [number, number]],
      scale: [20, 20] as [number, number],
      width: 200,
      height: 200,
    };
    const c = layoutToCoords(l);
    expect(c.range).toEqual([[-5, 5], [-2, 2]]);
    expect(c.scale).toEqual([20, 20]);
    expect(c.width).toBe(200);
  });

  it("toGraphieCoords maps center to range center", () => {
    const p = toGraphieCoords(300, 300, rect, coords);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it("toGraphieCoords maps top-left to yMax", () => {
    const p = toGraphieCoords(0, 0, rect, coords);
    expect(p.x).toBeCloseTo(-10);
    expect(p.y).toBeCloseTo(10);
  });

  it("toGraphieCoords maps bottom-right to xMax,yMin", () => {
    const p = toGraphieCoords(600, 600, rect, coords);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(-10);
  });

  it("round-trips toCanvasCoords <-> toGraphieCoords", () => {
    const orig = { x: 3, y: -4 };
    const canvas = toCanvasCoords(orig, rect, coords);
    const back = toGraphieCoords(canvas.x, canvas.y, rect, coords);
    expect(back.x).toBeCloseTo(3);
    expect(back.y).toBeCloseTo(-4);
  });

  it("toPercent maps center to 50/50", () => {
    const { left, top } = toPercent(0, 0, coords);
    expect(left).toBeCloseTo(50);
    expect(top).toBeCloseTo(50);
  });

  it("toPercent maps xMin to 0 and xMax to 100", () => {
    const l = toPercent(-10, 0, coords);
    const r = toPercent(10, 0, coords);
    expect(l.left).toBeCloseTo(0);
    expect(r.left).toBeCloseTo(100);
  });
});
