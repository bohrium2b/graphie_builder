// Security: port graphie-to-png's `contains_forbidden_js` AST check.
//
// Graphie code runs inside a sandboxed iframe with access to the DOM, so we
// reject obviously dangerous constructs (eval/alert) before rendering or
// exporting. This mirrors the server-side protection in graphie-to-png.

import * as acorn from "acorn";

export interface SafetyResult {
  ok: boolean;
  message?: string;
}

export function checkJsSafety(code: string): SafetyResult {
  if (typeof code !== "string" || code.trim().length === 0) {
    return { ok: true };
  }

  let ast: acorn.Node;
  try {
    ast = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "script",
      allowReturnOutsideFunction: true,
      allowImportExportEverywhere: true,
    }) as acorn.Node;
  } catch (err) {
    // Syntax errors are surfaced by the preview, not treated as a security
    // block. Return ok so the editor can keep the invalid code for fixing.
    return { ok: true };
  }

  const forbidden = new Set(["eval", "alert"]);

  // Walk the AST looking for direct forbidden identifier calls. We do NOT
  // walk into nested FunctionExpressions/ArrowFunctions for eval/alert
  // detection purposes, but we do flag the Function constructor.
  const stack: acorn.Node[] = [ast];

  while (stack.length) {
    const node = stack.pop() as any;
    if (!node || typeof node.type !== "string") continue;

    // CallExpression: callee Identifier -> eval(...), alert(...)
    if (node.type === "CallExpression" && node.callee) {
      const callee = node.callee;
      if (
        callee.type === "Identifier" &&
        forbidden.has(callee.name)
      ) {
        return {
          ok: false,
          message: `Security: forbidden function '${callee.name}' is not allowed.`,
        };
      }
      // setTimeout/setInterval are only dangerous when the first
      // argument is a string (which is evaluated as code). A function
      // argument is safe.
      if (
        callee.type === "Identifier" &&
        (callee.name === "setTimeout" || callee.name === "setInterval")
      ) {
        const firstArg = node.arguments && node.arguments[0];
        if (firstArg && firstArg.type === "Literal" && typeof firstArg.value === "string") {
          return {
            ok: false,
            message: `Security: ${callee.name} with a string argument is not allowed.`,
          };
        }
      }
      // Function constructor: new Function(...) or Function(...)
      if (
        callee.type === "Identifier" &&
        callee.name === "Function"
      ) {
        return {
          ok: false,
          message: "Security: the Function constructor is not allowed.",
        };
      }
      // Indirect eval: window.eval(...) / obj.eval(...)
      if (
        callee.type === "MemberExpression" &&
        callee.property &&
        callee.property.name === "eval"
      ) {
        return {
          ok: false,
          message: "Security: indirect eval (window.eval / obj.eval) is not allowed.",
        };
      }
    }

    // NewExpression: new Function(...)
    if (node.type === "NewExpression" && node.callee) {
      const callee = node.callee;
      if (callee.type === "Identifier" && callee.name === "Function") {
        return {
          ok: false,
          message: "Security: the Function constructor is not allowed.",
        };
      }
    }

    // Direct reference to the Function identifier (not a call) is allowed;
    // only its invocation is blocked above.

    for (const key of Object.keys(node)) {
      const value = (node as any)[key];
      if (value && typeof value === "object") {
        if (Array.isArray(value)) {
          for (const child of value) {
            if (child && typeof child === "object") {
              stack.push(child);
            }
          }
        } else {
          stack.push(value);
        }
      }
    }
  }

  return { ok: true };
}