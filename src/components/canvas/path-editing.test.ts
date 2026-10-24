import { describe, it, expect, beforeEach } from "vitest";
import { useGraphieStore } from "../../store";
import type { DiagramIR } from "../../ir/types";

const baseIR: DiagramIR = {
  range: [[-10, 10], [-10, 10]],
  scale: 30,
  nodes: [
    { id: "p1", kind: "path", x: 0, y: 0, points: [[0, 0], [1, 1], [2, 0]] },
  ],
};

describe("path vertex editing via updateNode", () => {
  beforeEach(() => {
    useGraphieStore.setState({
      code: "",
      ir: null,
      history: [""],
      historyIndex: 0,
      __recording: false,
      isDirty: false,
      selectedIds: [],
      activeTool: "select",
      gridSize: 0,
    });
  });

  it("moving a vertex updates points and regenerates code", () => {
    useGraphieStore.getState().applyIR(baseIR);
    const n = useGraphieStore.getState().ir!.nodes[0];
    const idx = 1;
    const pts = [...n.points!];
    pts[idx] = [3, 4];
    useGraphieStore.getState().updateNode(n.id, { points: pts });
    const node = useGraphieStore.getState().ir!.nodes[0];
    expect(node.points?.[1]).toEqual([3, 4]);
    expect(useGraphieStore.getState().code).toContain("path([[0, 0], [3, 4], [2, 0]");
  });

  it("appending a vertex grows the path", () => {
    useGraphieStore.getState().applyIR(baseIR);
    const n = useGraphieStore.getState().ir!.nodes[0];
    const pts: [number, number][] = [...(n.points as [number, number][]), [3, 3]];
    useGraphieStore.getState().updateNode(n.id, { points: pts });
    expect(useGraphieStore.getState().ir!.nodes[0].points).toHaveLength(4);
  });
});
