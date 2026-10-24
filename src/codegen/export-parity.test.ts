import { describe, it, expect } from "vitest";
import * as acorn from "acorn";
import { irToGraphie } from "./graphie";
import { parseGraphieToIR } from "../ir/parse";
import type { DiagramIR, IRNode } from "../ir/types";

function mkNode(partial: Partial<IRNode> & Pick<IRNode, "id" | "kind" | "x" | "y">): IRNode {
  const base = {
    x2: undefined, y2: undefined, r: undefined, rx: undefined, ry: undefined,
    points: undefined, props: undefined, src: undefined, width: undefined,
    height: undefined, expr: undefined, children: undefined,
    domain: undefined, style: undefined, fill: undefined, stroke: undefined,
    strokeWidth: undefined, opacity: undefined, dashArray: undefined,
  } as IRNode;
  return { ...base, ...partial };
}

describe("export parity", () => {
  it("generated code is syntactically valid JS (parseable by acorn)", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      grid: { step: [1, 1] },
      axes: { axisArrows: "<->", axisLabels: ["x", "y"] },
      nodes: [
        mkNode({ id: "c1", kind: "circle", x: 0, y: 0, r: 3, fill: "blue", stroke: "red", strokeWidth: 2 }),
        mkNode({ id: "r1", kind: "rect", x: -2, y: -2, x2: 2, y2: 2, fill: "yellow", opacity: 0.5 }),
        mkNode({ id: "l1", kind: "line", x: 0, y: 0, x2: 5, y2: 5 }),
        mkNode({ id: "e1", kind: "ellipse", x: 0, y: 0, rx: 3, ry: 1 }),
        mkNode({ id: "p1", kind: "polygon", x: 0, y: 0, points: [[0, 0], [1, 0], [0.5, 2]] }),
        mkNode({ id: "lab1", kind: "label", x: 1, y: 1, props: { text: "A" } }),
        mkNode({ id: "f1", kind: "function", x: 0, y: 0, props: { expr: "x*x" } }),
      ],
    };
    const code = irToGraphie(ir);
    expect(() => {
      acorn.parse(code, { ecmaVersion: "latest", sourceType: "script", allowReturnOutsideFunction: true });
    }).not.toThrow();
  });

  it("round-trips a full-feature diagram: IR->code->IR preserves shapes", () => {
    const ir: DiagramIR = {
      range: [[-8, 8], [-8, 8]],
      scale: 25,
      nodes: [
        mkNode({ id: "c1", kind: "circle", x: 2, y: -3, r: 1 }),
        mkNode({ id: "e1", kind: "ellipse", x: -1, y: 2, rx: 2, ry: 1 }),
        mkNode({ id: "r1", kind: "rect", x: 0, y: 0, x2: 3, y2: 4 }),
        mkNode({ id: "l1", kind: "line", x: 0, y: 0, x2: 5, y2: 5 }),
        mkNode({ id: "p1", kind: "polygon", x: 0, y: 0, points: [[0, 0], [1, 0], [1, 1]] }),
      ],
    };
    const code = irToGraphie(ir);
    const reparsed = parseGraphieToIR(code);
    expect(reparsed).not.toBeNull();
    const kinds = reparsed!.nodes.map((n) => n.kind);
    expect(kinds).toEqual(
      expect.arrayContaining(["circle", "ellipse", "rect", "line", "polygon"])
    );

    const circle = reparsed!.nodes.find((n) => n.kind === "circle");
    expect(circle).toBeDefined();
    expect(circle!.x).toBeCloseTo(2);
    expect(circle!.y).toBeCloseTo(-3);
    expect(circle!.r).toBeCloseTo(1);

    const ell = reparsed!.nodes.find((n) => n.kind === "ellipse");
    expect(ell).toBeDefined();
    expect(ell!.rx).toBeCloseTo(2);

    const poly = reparsed!.nodes.find((n) => n.kind === "polygon");
    expect(poly).toBeDefined();
    expect(poly!.points).toHaveLength(3);
  });

  it("round-trips style properties: IR->code->IR preserves fill/stroke/strokeWidth", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      nodes: [
        mkNode({ id: "c1", kind: "circle", x: 0, y: 0, r: 3, style: { fill: "blue", stroke: "red", strokeWidth: 2 } }),
        mkNode({ id: "r1", kind: "rect", x: -2, y: -2, x2: 2, y2: 2, style: { fill: "yellow", opacity: 0.5 } }),
      ],
    };
    const code = irToGraphie(ir);
    const reparsed = parseGraphieToIR(code);
    expect(reparsed).not.toBeNull();

    const circle = reparsed!.nodes.find((n) => n.kind === "circle");
    expect(circle).toBeDefined();
    expect(circle!.style?.fill).toBe("blue");
    expect(circle!.style?.stroke).toBe("red");
    expect(circle!.style?.strokeWidth).toBe(2);

    const rect = reparsed!.nodes.find((n) => n.kind === "rect");
    expect(rect).toBeDefined();
    expect(rect!.style?.fill).toBe("yellow");
    expect(rect!.style?.opacity).toBe(0.5);
  });

  it("round-trips a plot with function expression and domain", () => {
    const ir: DiagramIR = {
      range: [[-5, 5], [-5, 5]],
      scale: 30,
      nodes: [
        mkNode({ id: "f1", kind: "function", x: 0, y: 0, props: { expr: "sin(x)" } }),
      ],
    };
    const code = irToGraphie(ir);
    expect(code).toContain("plot(function(x){ return sin(x); }, [-5, 5])");
    const reparsed = parseGraphieToIR(code);
    expect(reparsed).not.toBeNull();
    const fn = reparsed!.nodes.find((n) => n.kind === "function");
    expect(fn).toBeDefined();
    expect(fn!.props?.expr).toBe("sin(x)");
    expect(fn!.props?.domain).toEqual([-5, 5]);
  });
});
