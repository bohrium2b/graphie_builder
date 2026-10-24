import { describe, it, expect } from "vitest";
import { boundingBox, marqueeSelect, nodePoints } from "./selection";
import type { IRNode } from "../../ir/types";

function mk(nodes: Partial<IRNode>[]): IRNode[] {
  return nodes.map((p, i) => ({ id: `n${i}`, kind: "rect", x: 0, y: 0, ...p } as IRNode));
}

describe("canvas/selection", () => {
  it("nodePoints returns center + corner for rect", () => {
    const [n] = mk([{ x: 0, y: 0, x2: 3, y2: 4 }]);
    const pts = nodePoints(n);
    expect(pts).toEqual([{ x: 0, y: 0 }, { x: 3, y: 4 }]);
  });

  it("nodePoints includes polygon points", () => {
    const [n] = mk([{ x: 0, y: 0, points: [[0, 0], [1, 1], [2, 0]] }]);
    const pts = nodePoints(n);
    expect(pts.length).toBe(3);
    expect(pts).toContainEqual({ x: 1, y: 1 });
  });

  it("boundingBox of empty returns null", () => {
    expect(boundingBox([])).toBeNull();
  });

  it("boundingBox wraps a single rect", () => {
    const [n] = mk([{ x: 1, y: 2, x2: 4, y2: 6 }]);
    const bb = boundingBox([n]);
    expect(bb).toEqual({ x: 1, y: 2, w: 3, h: 4 });
  });

  it("boundingBox wraps multiple nodes", () => {
    const nodes = mk([
      { x: 0, y: 0, x2: 1, y2: 1 },
      { x: -2, y: 5, r: 1 },
    ]);
    const bb = boundingBox(nodes);
    expect(bb).toEqual({ x: -2, y: 0, w: 3, h: 5 });
  });

  it("marqueeSelect picks nodes inside the box", () => {
    const nodes = mk([
      { x: 0, y: 0, x2: 1, y2: 1 },
      { x: 5, y: 5, x2: 6, y2: 6 },
    ]);
    const selected = marqueeSelect(nodes, { x: -1, y: -1 }, { x: 2, y: 2 });
    expect(selected).toEqual(["n0"]);
  });

  it("marqueeSelect returns none outside", () => {
    const nodes = mk([{ x: 10, y: 10, x2: 11, y2: 11 }]);
    const selected = marqueeSelect(nodes, { x: 0, y: 0 }, { x: 5, y: 5 });
    expect(selected).toEqual([]);
  });

  it("marqueeSelect handles reversed drag (end before start)", () => {
    const nodes = mk([{ x: 0, y: 0, r: 1 }]);
    const selected = marqueeSelect(nodes, { x: 2, y: 2 }, { x: -1, y: -1 });
    expect(selected).toEqual(["n0"]);
  });
});
