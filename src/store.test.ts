import { describe, it, expect, beforeEach } from "vitest";
import { useGraphieStore, type Tool } from "./store";
import type { DiagramIR } from "./ir/types";

const baseIR: DiagramIR = {
  range: [[-10, 10], [-10, 10]],
  scale: 30,
  nodes: [
    { id: "c1", kind: "circle", x: 1, y: 2, r: 3 },
    { id: "l1", kind: "line", x: 0, y: 0, x2: 4, y2: 4 },
  ],
};

describe("store", () => {
  beforeEach(() => {
    useGraphieStore.setState({
      code: "",
      ir: null,
      history: [],
      historyIndex: -1,
      __recording: false,
      isDirty: false,
      activeTool: "select" as Tool,
      selectedIds: [],
    });
  });

  it("applyIR sets IR and regenerates code", () => {
    useGraphieStore.getState().applyIR(baseIR);
    const s = useGraphieStore.getState();
    expect(s.ir).not.toBeNull();
    expect(s.code).toContain("init({ range:");
    expect(s.code).toContain("circle([1, 2], 3");
  });

  it("updateNode patches a single node", () => {
    useGraphieStore.getState().applyIR(baseIR);
    useGraphieStore.getState().updateNode("c1", { r: 10 });
    const node = useGraphieStore.getState().ir?.nodes.find((n) => n.id === "c1");
    expect(node?.r).toBe(10);
  });

  it("deleteNodes removes selected nodes", () => {
    useGraphieStore.getState().applyIR(baseIR);
    useGraphieStore.getState().setSelectedIds(["c1"]);
    useGraphieStore.getState().deleteNodes(["c1"]);
    const s = useGraphieStore.getState();
    expect(s.ir?.nodes.find((n) => n.id === "c1")).toBeUndefined();
    expect(s.selectedIds).toEqual([]);
  });

  it("activeTool toggles via setActiveTool", () => {
    useGraphieStore.getState().setActiveTool("rect");
    expect(useGraphieStore.getState().activeTool).toBe("rect");
  });

  it("setSelectedIds supports functional update", () => {
    useGraphieStore.getState().setSelectedIds(["a"]);
    useGraphieStore.getState().setSelectedIds((prev) => [...prev, "b"]);
    expect(useGraphieStore.getState().selectedIds).toEqual(["a", "b"]);
  });

  it("undo/redo round-trips IR-derived code", () => {
    // Build depth in the history stack (store tracks previous code at idx).
    useGraphieStore.getState().setCode("// a");
    useGraphieStore.getState().setCode("// b");
    useGraphieStore.getState().applyIR(baseIR);
    // undo should restore the previous ("// b") entry.
    useGraphieStore.getState().undo();
    const before = useGraphieStore.getState();
    expect(before.code).not.toContain("circle([1, 2], 3");
    expect(before.code).toContain("// b");
    useGraphieStore.getState().redo();
    const after = useGraphieStore.getState();
    expect(after.code).toContain("circle([1, 2], 3");
  });
});
