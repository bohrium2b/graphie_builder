import { describe, it, expect } from "vitest";
import { parseGraphieToIR } from "./parse";

describe("ir/parse", () => {
  it("extracts range and scale from init", () => {
    const ir = parseGraphieToIR(
      `init({ range: [[-10, 10], [-5, 5]], scale: 40 });`
    );
    expect(ir).not.toBeNull();
    expect(ir!.range).toEqual([[-10, 10], [-5, 5]]);
    expect(ir!.scale).toBe(40);
  });

  it("returns null on unparseable code", () => {
    expect(parseGraphieToIR("not valid javascript {")).toBeNull();
  });

  it("parses circle calls", () => {
    const ir = parseGraphieToIR(`init({range:[[-10,10],[-10,10]],scale:30});circle([1, 2], 3);`);
    const circle = ir!.nodes.find((n) => n.kind === "circle");
    expect(circle).toBeDefined();
    expect(circle!.x).toBe(1);
    expect(circle!.y).toBe(2);
    expect(circle!.r).toBe(3);
  });

  it("parses ellipse calls", () => {
    const ir = parseGraphieToIR(`init({range:[[-10,10],[-10,10]],scale:30});ellipse([0, 0], [2, 1]);`);
    const e = ir!.nodes.find((n) => n.kind === "ellipse");
    expect(e).toBeDefined();
    expect(e!.rx).toBe(2);
    expect(e!.ry).toBe(1);
  });

  it("parses rect calls", () => {
    const ir = parseGraphieToIR(`init({range:[[-10,10],[-10,10]],scale:30});rect([0, 0], [4, 3]);`);
    const r = ir!.nodes.find((n) => n.kind === "rect");
    expect(r).toBeDefined();
    expect(r!.x).toBe(0);
    expect(r!.y).toBe(0);
    expect(r!.x2).toBe(4);
    expect(r!.y2).toBe(3);
  });

  it("parses line calls", () => {
    const ir = parseGraphieToIR(`init({range:[[-10,10],[-10,10]],scale:30});line([0, 0], [2, 3]);`);
    const l = ir!.nodes.find((n) => n.kind === "line");
    expect(l).toBeDefined();
    expect(l!.x2).toBe(2);
    expect(l!.y2).toBe(3);
  });

  it("parses polygon calls with points", () => {
    const ir = parseGraphieToIR(`init({range:[[-10,10],[-10,10]],scale:30});polygon([[0, 0], [1, 0], [1, 1]]);`);
    const p = ir!.nodes.find((n) => n.kind === "polygon");
    expect(p).toBeDefined();
    expect(p!.points).toEqual([[0, 0], [1, 0], [1, 1]]);
  });

  it("parses path calls into path kind", () => {
    const ir = parseGraphieToIR(`init({range:[[-10,10],[-10,10]],scale:30});path([[0, 0], [1, 1], [2, 0]]);`);
    const p = ir!.nodes.find((n) => n.kind === "path");
    expect(p).toBeDefined();
    expect(p!.points!.length).toBe(3);
  });

  it("parses labels with text", () => {
    const ir = parseGraphieToIR(`init({range:[[-10,10],[-10,10]],scale:30});label([0, 0], "hello");`);
    const l = ir!.nodes.find((n) => n.kind === "label");
    expect(l).toBeDefined();
    expect(l!.props?.text).toBe("hello");
  });

  it("parses plot calls", () => {
    const ir = parseGraphieToIR(
      `init({range:[[-10,10],[-10,10]],scale:30});plot(function(x){ return x*x; });`
    );
    const f = ir!.nodes.find((n) => n.kind === "function");
    expect(f).toBeDefined();
  });

  it("parses image calls", () => {
    const ir = parseGraphieToIR(
      `init({range:[[-10,10],[-10,10]],scale:30});image("data:image/png;base64,abc", [1, 2], [3, 4]);`
    );
    const img = ir!.nodes.find((n) => n.kind === "image");
    expect(img).toBeDefined();
    expect(img!.src).toBe("data:image/png;base64,abc");
    expect(img!.width).toBe(3);
    expect(img!.height).toBe(4);
  });

  it("parses graphInit for grid config", () => {
    const ir = parseGraphieToIR(
      `init({range:[[-10,10],[-10,10]],scale:30});graphInit({ gridStep: [1, 1], tickStep: [1, 1], axisArrows: "<->", axisLabels: ["x", "y"] });`
    );
    expect(ir!.grid?.step).toEqual([1, 1]);
    expect(ir!.axes?.axisArrows).toBe("<->");
  });

  it("round-trips a complex diagram", () => {
    const code = [
      `init({ range: [[-10, 10], [-10, 10]], scale: 30 });`,
      `graphInit({ gridStep: [1, 1], axisArrows: "<->" });`,
      `circle([2, 3], 1);`,
      `line([0, 0], [5, 5]);`,
      `polygon([[0, 0], [1, 0], [0.5, 1]]);`,
      `label([2, 3], "A");`,
    ].join("\n");
    const ir = parseGraphieToIR(code);
    expect(ir).not.toBeNull();
    expect(ir!.nodes.length).toBe(4);
    expect(ir!.nodes.some((n) => n.kind === "circle")).toBe(true);
    expect(ir!.nodes.some((n) => n.kind === "line")).toBe(true);
    expect(ir!.nodes.some((n) => n.kind === "polygon")).toBe(true);
    expect(ir!.nodes.some((n) => n.kind === "label")).toBe(true);
  });
});
