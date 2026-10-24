// Global application state for Graphie Builder.
//
// Only the live graphie code is held here; the preview iframe is the source
// of truth for rendering. Export artifacts are produced on demand from the
// iframe's SVG output.

import { create } from "zustand";
import type { DiagramIR, IRNode } from "./ir/types";
import { irToGraphie } from "./codegen/graphie";

export type Tool =
  | "select"
  | "rect"
  | "ellipse"
  | "circle"
  | "line"
  | "polygon"
  | "pen"
  | "text"
  | "label"
  | "function"
  | "image"
  | "pan";

interface GraphieState {
  code: string;
  setCode: (code: string) => void;
  ir: DiagramIR | null;
  setIR: (ir: DiagramIR | null) => void;
  isReady: boolean;
  setIsReady: (ready: boolean) => void;
  title: string;
  setTitle: (title: string) => void;
  lastError: string | null;
  setLastError: (err: string | null) => void;
  filename: string;
  setFilename: (filename: string) => void;
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  /** Bounded undo/redo stack of past code states. */
  history: string[];
  /** Index into `history` of the current code state. */
  historyIndex: number;
  /** Internal: set while undo/redo applies code (skip history push). */
  __recording: boolean;
  /** Revert to the previous code state. */
  undo: () => void;
  /** Re-apply the next code state after an undo. */
  redo: () => void;
  /** Currently active canvas tool. */
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  /** Selected element ids. */
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  /** Grid snap size (graphie units), 0 to disable. */
  gridSize: number;
  setGridSize: (size: number) => void;
  /** Replace the IR and sync generated code. */
  applyIR: (ir: DiagramIR) => void;
  /** Update a single node by id. */
  updateNode: (id: string, patch: Partial<IRNode>) => void;
  /** Remove selected nodes. */
  deleteNodes: (ids: string[]) => void;
}

const HISTORY_CAP = 100;

/**
 * Document a fresh session starts with. An empty document renders an empty
 * canvas, which reads as a broken preview — a small working example makes
 * the preview meaningful on launch.
 */
export const DEFAULT_DOCUMENT = `// Graphie Builder — edit this code, or load a template from the sidebar.
init({
    range: [[-10, 10], [-10, 10]],
    scale: 30
});

style({
    stroke: BLUE_D,
    fill: "none",
    strokeWidth: 3
});

plot(function(x) {
    return -0.5 * x * x + 2 * x + 3.0;
}, [-10, 10]);
`;

export const useGraphieStore = create<GraphieState>((set, get) => ({
  code: DEFAULT_DOCUMENT,
  ir: null,
  setIR: (ir) => set({ ir }),
  setCode: (code) => {
    const state = get();
    // When called from undo/redo, do not push to the stack.
    if (state.__recording) {
      set({ code, isDirty: true, __recording: false });
      return;
    }
    // Only record when code actually changes.
    if (state.code === code) return;
    // history[0..historyIndex] are the recorded past states; the entry at
    // historyIndex is the current state. Push the new state, truncating redo.
    const next = [...state.history.slice(0, state.historyIndex + 1), code];
    if (next.length > HISTORY_CAP) next.shift();
    set({
      code,
      history: next,
      historyIndex: next.length - 1,
      isDirty: true,
    });
  },
  isReady: false,
  setIsReady: (ready) => set({ isReady: ready }),
  title: "Untitled diagram",
  setTitle: (title) => set({ title }),
  lastError: null,
  setLastError: (err) => set({ lastError: err }),
  filename: "Untitled.graphie",
  setFilename: (filename) => set({ filename }),
  isDirty: false,
  setDirty: (dirty) => set({ isDirty: dirty }),
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),
  selectedIds: [],
  setSelectedIds: (ids) =>
    set((s) => ({ selectedIds: typeof ids === "function" ? ids(s.selectedIds) : ids })),
  gridSize: 1,
  setGridSize: (size) => set({ gridSize: size }),
  /** Replace the IR and sync generated code; records in history. */
  applyIR: (ir) => {
    const state = get();
    const code = irToGraphie(ir);
    if (state.__recording) {
      set({ ir, code, __recording: false });
      return;
    }
     if (state.code === code) {
      set({ ir });
      return;
    }
    const next = [...state.history.slice(0, state.historyIndex + 1), code];
    if (next.length > HISTORY_CAP) next.shift();
    set({
      ir,
      code,
      history: next,
      historyIndex: next.length - 1,
      isDirty: true,
    });
  },
  updateNode: (id, patch) => {
    const state = get();
    if (!state.ir) return;
    const nodes = state.ir.nodes.map((n) =>
      n.id === id ? { ...n, ...patch } : n
    );
    state.applyIR({ ...state.ir, nodes });
  },
  deleteNodes: (ids) => {
    const state = get();
    if (!state.ir) return;
    const remove = new Set(ids);
    const nodes = state.ir.nodes.filter((n) => !remove.has(n.id));
    state.applyIR({ ...state.ir, nodes });
    set({ selectedIds: state.selectedIds.filter((s) => !remove.has(s)) });
  },
  history: [DEFAULT_DOCUMENT],
  historyIndex: 0,
  __recording: false,
  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;
    const next = state.historyIndex - 1;
    set({
      __recording: true,
      code: state.history[next],
      historyIndex: next,
      isDirty: true,
    });
  },
  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    const next = state.historyIndex + 1;
    set({
      __recording: true,
      code: state.history[next],
      historyIndex: next,
      isDirty: true,
    });
  },
}));
