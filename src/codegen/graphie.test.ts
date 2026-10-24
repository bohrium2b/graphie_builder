import { describe, it, expect } from "vitest";
import { irToGraphie } from "./graphie";
import { parseGraphieToIR } from "../ir/parse";
import type { DiagramIR, IRNode } from "../ir/types";

function mkNode(partial: Partial<IRNode> & Pick<IRNode, "id" | "kind" | "x" | "y">): IRNode {
  const base = { x2: undefined, y2: undefined, r: undefined, rx: undefined, ry: undefined, points: undefined, props: undefined, src: undefined, width: undefined, height: undefined, expr: undefined, children: undefined } as IRNode;
  return { ...base, ...partial };
}

describe("irToGraphie", () => {
  it("emits init with range and scale", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-5, 5]],
      scale: 40,
      nodes: [],
    };
    const out = irToGraphie(ir);
    expect(out).toContain("init({");
    expect(out).toContain("[[-10, 10], [-5, 5]]");
    expect(out).toContain("scale: 40");
  });

  it("emits a point node", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      nodes: [mkNode({ id: "p1", kind: "point", x: 3, y: -2 })],
    };
    const out = irToGraphie(ir);
    expect(out).toContain("point([3, -2]");
  });

  it("emits a circle node with radius", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      nodes: [mkNode({ id: "c1", kind: "circle", x: 1, y: 2, r: 3 })],
    };
    const out = irToGraphie(ir);
    expect(out).toContain("circle([1, 2], 3");
  });

  it("emits an ellipse node with radii", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      nodes: [mkNode({ id: "e1", kind: "ellipse", x: 1, y: 2, rx: 3, ry: 1.5 })],
    };
    const out = irToGraphie(ir);
    expect(out).toContain("ellipse([1, 2], [3, 1.5]");
  });

  it("emits a rect node", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      nodes: [mkNode({ id: "r1", kind: "rect", x: 0, y: 0, x2: 4, y2: 3 })],
    };
    const out = irToGraphie(ir);
    expect(out).toContain("rect([0, 0], [4, 3]");
  });

  it("emits a line node", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      nodes: [mkNode({ id: "l1", kind: "line", x: 0, y: 0, x2: 2, y2: 3 })],
    };
    const out = irToGraphie(ir);
    expect(out).toContain("line([0, 0], [2, 3]");
  });

  it("emits a polygon node with points", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      nodes: [
        mkNode({
          id: "pg1",
          kind: "polygon",
          x: 0,
          y: 0,
          points: [[0, 0], [1, 0], [1, 1]],
        }),
      ],
    };
    const out = irToGraphie(ir);
    expect(out).toContain("polygon([[0, 0], [1, 0], [1, 1]]");
  });

  it("emits a label node", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      nodes: [mkNode({ id: "lab1", kind: "label", x: 0, y: 0, props: { text: "hello" } })],
    };
    const out = irToGraphie(ir);
    expect(out).toContain(`label([0, 0], "hello"`);
  });

  it("emits a function/plot node with domain", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      nodes: [mkNode({ id: "f1", kind: "function", x: 0, y: 0, props: { expr: "x * x" } })],
    };
    const out = irToGraphie(ir);
    expect(out).toContain("plot(function(x){ return x * x; }, [-10, 10])");
  });

  it("emits an image node", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      nodes: [
        mkNode({ id: "img1", kind: "image", x: 0, y: 0, src: "data:image/png;base64,abc", width: 2, height: 2 }),
      ],
    };
    const out = irToGraphie(ir);
    expect(out).toContain('image("data:image/png;base64,abc", [0, 0], [2, 2]);');
  });

  it("emits a path node with points", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      nodes: [
        mkNode({
          id: "pth1",
          kind: "path",
          x: 0,
          y: 0,
          points: [[0, 0], [1, 1], [2, 0]],
        }),
      ],
    };
    const out = irToGraphie(ir);
    expect(out).toContain("path([[0, 0], [1, 1], [2, 0]]");
  });

  it("round-trips via parse: IR->code->IR preserves circle/line/label", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 30,
      nodes: [
        mkNode({ id: "c1", kind: "circle", x: 2, y: -3, r: 1 }),
        mkNode({ id: "l1", kind: "line", x: 0, y: 0, x2: 5, y2: 5 }),
        mkNode({ id: "lab1", kind: "label", x: 1, y: 1, props: { text: "A" } }),
      ],
    };
    const code = irToGraphie(ir);
    const reparsed = parseGraphieToIR(code);
    expect(reparsed).not.toBeNull();
    const kinds = reparsed!.nodes.map((n) => n.kind);
    expect(kinds).toContain("circle");
    expect(kinds).toContain("line");
    expect(kinds).toContain("label");
    const circle = reparsed!.nodes.find((n) => n.kind === "circle");
    expect(circle).toBeDefined();
    expect(circle!.x).toBeCloseTo(2);
    expect(circle!.y).toBeCloseTo(-3);
    expect(circle!.r).toBeCloseTo(1);
    const label = reparsed!.nodes.find((n) => n.kind === "label");
    expect(label).toBeDefined();
    expect(label!.props?.text).toBe("A");
  });
});
