import { describe, it, expect } from "vitest";
import type {
  DiagramIR,
  IRNode,
  IRNodeKind,
  IRNodeStyle,
  IRNodeTransform,
} from "./types";

describe("ir/types", () => {
  it("supports a rect node with style and fill", () => {
    const node: IRNode = {
      id: "r1",
      kind: "rect",
      x: 0,
      y: 0,
      x2: 4,
      y2: 3,
      style: { fill: "blue", stroke: "red", strokeWidth: 2, opacity: 0.5, dashArray: "5,5" },
    };
    expect(node.kind).toBe("rect");
    expect(node.x2).toBe(4);
    expect((node.style as IRNodeStyle).fill).toBe("blue");
  });

  it("supports an ellipse node with radii", () => {
    const node: IRNode = {
      id: "e1",
      kind: "ellipse",
      x: 1,
      y: 2,
      rx: 3,
      ry: 1.5,
    };
    expect(node.rx).toBe(3);
    expect(node.ry).toBe(1.5);
  });

  it("supports a polygon node with points", () => {
    const node: IRNode = {
      id: "p1",
      kind: "polygon",
      x: 0,
      y: 0,
      points: [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
    };
    expect(node.points?.length).toBe(3);
  });

  it("supports an image node", () => {
    const node: IRNode = {
      id: "img1",
      kind: "image",
      x: 0,
      y: 0,
      src: "data:image/png;base64,abc",
      width: 2,
      height: 2,
    };
    expect(node.src).toMatch(/^data:/);
  });

  it("supports a group node with transform", () => {
    const transform: IRNodeTransform = { rotateDeg: 45, scaleX: 2, scaleY: 1 };
    const node: IRNode = {
      id: "g1",
      kind: "group",
      x: 0,
      y: 0,
      transform,
      children: ["c1", "c2"],
    };
    expect(node.transform?.rotateDeg).toBe(45);
    expect(node.children).toEqual(["c1", "c2"]);
  });

  it("validates IRNodeKind union members", () => {
    const kinds: IRNodeKind[] = [
      "point",
      "label",
      "function",
      "axis",
      "line",
      "rect",
      "circle",
      "ellipse",
      "path",
      "polygon",
      "polyline",
      "image",
      "group",
    ];
    expect(kinds).toHaveLength(13);
  });

  it("DiagramIR has range/scale defaults", () => {
    const ir: DiagramIR = {
      range: [[-10, 10], [-10, 10]],
      scale: 40,
      nodes: [],
    };
    expect(ir.range).toEqual([[-10, 10], [-10, 10]]);
    expect(ir.scale).toBe(40);
    expect(ir.nodes).toEqual([]);
  });
});
