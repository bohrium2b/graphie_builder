// Code tests for the Graphie JS safety check.
//
// The check ports graphie-to-png's `contains_forbidden_js`: it
// parses the code with an AST walker and rejects direct calls to
// eval/alert and the Function constructor, because graphie code
// runs inside a sandboxed iframe with DOM access.

import { describe, it, expect } from "vitest";
import { checkJsSafety } from "./security";

describe("checkJsSafety", () => {
  it("allows empty and whitespace-only code", () => {
    expect(checkJsSafety("").ok).toBe(true);
    expect(checkJsSafety("   \n  ").ok).toBe(true);
  });

  it("allows ordinary graphie code", () => {
    const code = `
      style({ stroke: BLUE_D, fill: "none", strokeWidth: 3 });
      plot(function(x) { return -0.5 * x * x + 2 * x + 3.0; }, X_RANGE);
      label([0, 1], "y", "above");
    `;
    const result = checkJsSafety(code);
    expect(result.ok).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("allows syntax errors (surfaced by the preview, not blocked)", () => {
    const result = checkJsSafety("function( {");
    expect(result.ok).toBe(true);
  });

  it("blocks a direct eval() call", () => {
    const result = checkJsSafety('eval("alert(1)");');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/eval/);
  });

  it("blocks a direct alert() call", () => {
    const result = checkJsSafety('alert("hi");');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/alert/);
  });

  it("blocks the Function constructor", () => {
    const result = checkJsSafety('new Function("return 1")();');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Function/);
  });

  it("blocks indirect eval via a member expression", () => {
    const result = checkJsSafety("window.eval('1+1');");
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/eval/);
  });

  it("blocks setTimeout with a string (eval-equivalent)", () => {
    const result = checkJsSafety('setTimeout("alert(1)", 100);');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/setTimeout/);
  });

  it("allows setTimeout with a function (safe)", () => {
    const result = checkJsSafety("setTimeout(function() {}, 100);");
    expect(result.ok).toBe(true);
  });

  it("blocks eval nested inside a function body", () => {
    const code = `
      function setup() {
        var x = 1;
        eval("x + 1");
      }
    `;
    const result = checkJsSafety(code);
    expect(result.ok).toBe(false);
  });

  it("allows a variable named eval (not a call)", () => {
    const result = checkJsSafety("var eval = 1;");
    expect(result.ok).toBe(true);
  });

  it("blocks alert inside a nested closure", () => {
    const code = `
      plot(function(x) {
        if (x > 0) { alert("x"); }
        return x;
      }, X_RANGE);
    `;
    const result = checkJsSafety(code);
    expect(result.ok).toBe(false);
  });
});