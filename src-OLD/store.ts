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
}

export const useGraphieStore = create<GraphieState>((set) => ({
  code: "",
  setCode: (code) => set({ code }),
  isReady: false,
  setIsReady: (ready) => set({ isReady: ready }),
  title: "Untitled diagram",
  setTitle: (title) => set({ title }),
  lastError: null,
  setLastError: (err) => set({ lastError: err }),
}));