// LaTeX → JavaScript helper using the Cortex Compute Engine.
//
// The wizard collects math expressions as LaTeX (via MathLive's
// `<math-field>`). Graphie's `plot(function(x) { ... })` expects a plain
// JavaScript function of `x`, so we compile the LaTeX to JS at insert time.
//
// We use the Compute Engine's `compile()` with target `javascript`, which
// returns a `CompilationResult` with a `run({ x })` method and a `code`
// string. The compiled code references the input variable as `_.x` (or
// `_.theta` for polar), so we rewrite `_.x` → `x` to drop it into a
// `function(x) { return <expr>; }` body.
//
// The CE emits a handful of `_SYS.*` helpers and constant symbols (`_.I *
// _.P` for π, `_.E` for e). We rewrite those to their JS equivalents and
// provide a small `_SYS` runtime object with the helpers we actually use.

import { compile } from "@cortex-js/compute-engine";

// Minimal runtime for the helpers the CE lowers to. Real-valued plotting
// only needs these; anything else falls back to the interpreter.
const _SYS = {
  csqrt: (z: any) =>
    typeof z === "number" ? Math.sqrt(z) : Math.sqrt(z.re),
  clog10: (z: any) =>
    typeof z === "number" ? Math.log10(z) : Math.log10(z.re),
  clog2: (z: any) =>
    typeof z === "number" ? Math.log2(z) : Math.log2(z.re),
  tan: Math.tan,
  cot: (x: number) => 1 / Math.tan(x),
  sec: (x: number) => 1 / Math.cos(x),
  csc: (x: number) => 1 / Math.sin(x),
  pow: Math.pow,
  pow3: (x: number) => x * x * x,
  pow4: (x: number) => {
    const n = x * x;
    return n * n;
  },
  pow5: (x: number) => {
    const n = x * x;
    return n * n * x;
  },
};

/** The `_SYS` runtime as a JS object literal, emitted into generated code. */
export const SYS_RUNTIME_SRC = `var _SYS = {
  csqrt: function(z) { return typeof z === 'number' ? Math.sqrt(z) : Math.sqrt(z.re); },
  clog10: function(z) { return typeof z === 'number' ? Math.log10(z) : Math.log10(z.re); },
  clog2: function(z) { return typeof z === 'number' ? Math.log2(z) : Math.log2(z.re); },
  tan: Math.tan,
  cot: function(x) { return 1 / Math.tan(x); },
  sec: function(x) { return 1 / Math.cos(x); },
  csc: function(x) { return 1 / Math.sin(x); },
  pow: Math.pow,
  pow3: function(x) { return x * x * x; },
  pow4: function(x) { var n = x * x; return n * n; },
  pow5: function(x) { var n = x * x; return n * n * x; }
};`;

export interface LatexToJsResult {
  ok: boolean;
  code?: string;
  error?: string;
  isConstant?: boolean;
}

/**
 * Convert a LaTeX expression into a Graphie-compatible JS expression string.
 *
 * Returns `{ ok: true, code }` where `code` is a JS expression that can be
 * dropped into `return <code>;` inside a `function(x) { ... }`.
 *
 * Returns `{ ok: false, error }` if the expression can't be compiled.
 */
export function latexToJs(latex: string): LatexToJsResult {
  const trimmed = (latex || "").trim();
  if (!trimmed) {
    return { ok: false, error: "Empty expression" };
  }

  try {
    const result = compile(trimmed, {
      to: "javascript",
      constantFold: false,
    });
    if (!result || !result.success) {
      return {
        ok: false,
        error: `Could not compile expression: ${trimmed}`,
      };
    }

    let code = result.code || "";

    // The compiled output may be wrapped in an IIFE:
    //   (() => { const _tv1 = ...; return ({ re: ..., im: ... }); })()
    // Strip that wrapper and keep only the returned expression.
    const iifeMatch = code.match(
      /^\(\s*\(\)\s*=>\s*\{[\s\S]*?\breturn\s+(\{[\s\S]*?\}|[^;]+)\s*;\s*\}\s*\)\s*\(\)\s*$/
    );
    if (iifeMatch) {
      code = iifeMatch[1].trim();
    }

    // If the returned value is a complex-number object `{ re: X, im: Y }`,
    // extract the real part (im should be 0 for real input).
    const objMatch = code.match(/^\{\s*re:\s*(.+?),\s*im:\s*(.+?)\s*\}$/);
    if (objMatch) {
      code = objMatch[1].trim();
    }

    // Rewrite CE constants to their JS equivalents.
    code = code.replace(/_\.\s*I\s*\*\s*_\.\s*P/g, "Math.PI");
    code = code.replace(/_\.\s*E\b/g, "Math.E");
    code = code.replace(/_\.\s*tau\b/g, "(Math.PI * 2)");

    // A constant expression doesn't reference any input variable.
    const isConstant = !/\b_\.\w/.test(code);

    return { ok: true, code, isConstant };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Compile error: ${msg}` };
  }
}

/**
 * Convert a LaTeX expression into a Graphie-compatible JS expression string,
 * rewriting the CE's `_.varName` reference to the bare variable name so it
 * works inside `function(varName) { return <expr>; }`.
 *
 * Any remaining `_.something` (e.g. an undeclared symbol) is replaced with
 * `0` so the plot doesn't blow up — this is a degraded fallback, not a
 * success, and `ok` stays `true` only if the expression compiled.
 */
export function latexToJsForVar(latex: string, varName: string): LatexToJsResult {
  const base = latexToJs(latex);
  if (!base.ok || !base.code) return base;

  let code = base.code;
  code = code.replace(new RegExp("_\\." + varName + "\\b", "g"), varName);
  // Any remaining _.something (e.g. an undeclared symbol) → 0.
  code = code.replace(/_\.\w+/g, "0");

  return { ok: true, code, isConstant: base.isConstant };
}

/**
 * Compile a LaTeX expression into a Graphie-compatible JS function body.
 *
 * `varName` is the name of the independent variable (`x`, `t`, `theta`, ...).
 * Returns `{ ok: true, fn }` where `fn(value)` evaluates the expression, or
 * `{ ok: false, error }` on failure.
 */
export function compileLatexFunction(
  latex: string,
  varName: string
): { ok: boolean; fn?: (v: number) => number; error?: string } {
  const { ok, code, error } = latexToJs(latex);
  if (!ok || !code) return { ok: false, error };

  try {
    // Rewrite the CE's `_.varName` reference to the bare variable name so
    // the expression works inside `function(varName) { return <expr>; }`.
    let body = code.replace(
      new RegExp("_\\." + varName + "\\b", "g"),
      varName
    );
    // Any remaining _.something (e.g. an undeclared symbol) → 0 so the
    // plot doesn't blow up; this is a degraded fallback, not a success.
    body = body.replace(/_\.\w+/g, "0");

    const fn = new Function("_SYS", `return function(${varName}) { return ${body}; }`)(
      _SYS
    ) as (v: number) => number;
    return { ok: true, fn };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Function build error: ${msg}` };
  }
}

export { _SYS };