// Tests for the ported template gallery and the Zustand store.

import { describe, it, expect } from "vitest";
import { templates } from "./templates";
import { useGraphieStore } from "./store";

describe("templates", () => {
  it("has a blank page first", () => {
    expect(templates[0].id).toBe("blank");
    expect(templates[0].title).toBe("Blank page");
    expect(templates[0].code).toBe("");
  });

  it("every template has id, title, category, code", () => {
    for (const t of templates) {
      expect(typeof t.id).toBe("string");
      expect(typeof t.title).toBe("string");
      expect(typeof t.category).toBe("string");
      expect(typeof t.code).toBe("string");
    }
  });

  it("non-blank templates have non-empty code", () => {
    for (const t of templates.slice(1)) {
      expect(t.code.trim().length).toBeGreaterThan(0);
    }
  });

  it("ids are unique", () => {
    const ids = templates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("store", () => {
  it("updates code and title", () => {
    const s = useGraphieStore.getState();
    s.setCode("plot([0,0], [1,1]);");
    s.setTitle("My diagram");
    const state = useGraphieStore.getState();
    expect(state.code).toBe("plot([0,0], [1,1]);");
    expect(state.title).toBe("My diagram");
  });

  it("tracks filename and dirty flag", () => {
    const s = useGraphieStore.getState();
    s.setFilename("diagram.graphie");
    s.setDirty(true);
    const state = useGraphieStore.getState();
    expect(state.filename).toBe("diagram.graphie");
    expect(state.isDirty).toBe(true);
    s.setDirty(false);
    expect(useGraphieStore.getState().isDirty).toBe(false);
  });

  it("exposes undo and reducers", () => {
    const s = useGraphieStore.getState();
    expect(typeof s.undo).toBe("function");
    expect(typeof s.redo).toBe("function");
    // undo/redo should not throw even with an empty/initial history.
    expect(() => s.undo()).not.toThrow();
    expect(() => s.redo()).not.toThrow();
  });
});
