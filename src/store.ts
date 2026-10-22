// Global application state for Graphie Builder.
//
// Only the live graphie code is held here; the preview iframe is the source
// of truth for rendering. Export artifacts are produced on demand from the
// iframe's SVG output.

import { create } from "zustand";

interface GraphieState {
  code: string;
  setCode: (code: string) => void;
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
}

const HISTORY_CAP = 100;

export const useGraphieStore = create<GraphieState>((set, get) => ({
  code: "",
  setCode: (code) => {
    const state = get();
    // When called from undo/redo, do not push to the stack.
    if (state.__recording) {
      set({ code, isDirty: true, __recording: false });
      return;
    }
    // Only record when code actually changes.
    if (state.code === code) return;
    const next = [...state.history.slice(state.historyIndex + 1), state.code];
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
  history: [""],
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
