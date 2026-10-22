// Tests for the graphie completion data module.

import { describe, it, expect } from "vitest";
import { getGraphieCompletions } from "./graphie-completions";

describe("graphie-completions", () => {
  it("returns well-shaped completion items", () => {
    const items = getGraphieCompletions();
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(typeof item.label).toBe("string");
      expect(item.label.length).toBeGreaterThan(0);
      expect(["function", "constant", "snippet"]).toContain(item.kind);
      expect(typeof item.detail).toBe("string");
      expect(typeof item.documentation).toBe("string");
      expect(typeof item.insertText).toBe("string");
    }
  });

  it("has unique labels", () => {
    const items = getGraphieCompletions();
    const labels = items.map((i) => i.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes core graphie drawing functions", () => {
    const items = getGraphieCompletions();
    const labels = new Set(items.map((i) => i.label));
    for (const name of [
      "plot",
      "drawPoint",
      "drawLine",
      "drawCircle",
      "drawPolygon",
      "label",
      "style",
      "setup",
      "init",
    ]) {
      expect(labels).toContain(name);
    }
  });

  it("includes math constants and label formats", () => {
    const items = getGraphieCompletions();
    const labels = new Set(items.map((i) => i.label));
    expect(labels).toContain("PI");
    expect(labels).toContain("$deg0");
    expect(labels).toContain("$len0");
  });

  it("includes color constants", () => {
    const items = getGraphieCompletions();
    const labels = new Set(items.map((i) => i.label));
    expect(labels).toContain("MOCHA_SKY");
    expect(labels).toContain("LATTE_TEXT");
  });
});
