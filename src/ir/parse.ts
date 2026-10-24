import * as acorn from "acorn";
import type { DiagramIR, IRNode, IRNodeStyle } from "./types";

type ASTNode = { type: string; [k: string]: unknown };

function isCall(n: ASTNode): n is ASTNode & { callee: ASTNode; arguments: ASTNode[] } {
  return n.type === "CallExpression";
}

function calleeName(n: ASTNode): string | null {
  if (!isCall(n)) return null;
  const c = n.callee;
  if (c.type === "Identifier") return c.name as string;
  return null;
}

// Recursively evaluate a JS literal AST node into plain values.
function evalValue(n: ASTNode): unknown {
  if (n.type === "Literal") return n.value;
  if (n.type === "UnaryExpression" && n.operator === "-") {
    const v = evalValue(n.argument as ASTNode);
    return typeof v === "number" ? -v : undefined;
  }
  if (n.type === "ArrayExpression" && Array.isArray(n.elements)) {
    return n.elements.map((el) => (el ? evalValue(el as ASTNode) : undefined));
  }
  if (n.type === "ObjectExpression" && Array.isArray(n.properties)) {
    const out: Record<string, unknown> = {};
    for (const p of n.properties as ASTNode[]) {
      if (p.type === "Property") {
        const key = p.key as ASTNode;
        const k = key.type === "Identifier" ? (key.name as string) : str(key);
        if (k) out[k] = evalValue(p.value as ASTNode);
      }
    }
    return out;
  }
  return undefined;
}

function literalValue(n: ASTNode): unknown {
  return evalValue(n);
}

function num(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  const lit = evalValue(v as ASTNode);
  return typeof lit === "number" ? lit : undefined;
}

function numArr(v: unknown): number[] | undefined {
  if (typeof v === "number") return [v];
  if (Array.isArray(v)) {
    const out = v.map((x) => num(x)).filter((x): x is number => x !== undefined);
    if (out.length > 0) return out;
    return undefined;
  }
  const lit = evalValue(v as ASTNode);
  if (Array.isArray(lit)) {
    const out = lit.map((x) => num(x)).filter((x): x is number => x !== undefined);
    if (out.length > 0) return out;
  }
  return undefined;
}

function coordArr(v: unknown): [number, number] | undefined {
  const a = numArr(v);
  if (!a || a.length !== 2) return undefined;
  return [a[0], a[1]];
}

function str(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  const lit = evalValue(v as ASTNode);
  return typeof lit === "string" ? lit : undefined;
}

/** Recursively convert a JS AST expression node back to source text.
 *  Used to preserve plot function bodies in the IR round-trip. */
function unparseExpr(n: ASTNode): string | undefined {
  const node = n as unknown as Record<string, unknown>;
  // Leaf values
  if (n.type === "Literal" || n.type === "LiteralBigIntLiteral") {
    return JSON.stringify(node.value ?? "");
  }
  if (n.type === "Identifier") {
    return node.name as string;
  }

  // UnaryExpression: -x
  if (n.type === "UnaryExpression") {
    const arg = unparseExpr(node.argument as ASTNode);
    if (arg === undefined) return undefined;
    return `${node.operator}${arg}`;
  }

  // BinaryExpression: a + b, x * y, etc.
  if (n.type === "BinaryExpression") {
    const left = unparseExpr(node.left as ASTNode);
    const right = unparseExpr(node.right as ASTNode);
    if (left === undefined || right === undefined) return undefined;
    const op = node.operator as string;
    return `(${left} ${op} ${right})`;
  }

  // CallExpression: sin(x), cos(x), sqrt(x), etc.
  if (n.type === "CallExpression") {
    const callee = unparseExpr(node.callee as ASTNode);
    if (callee === undefined) return undefined;
    const rawArgs = node.arguments as ASTNode[];
    const args = rawArgs
      .map((a) => unparseExpr(a))
      .filter((a): a is string => a !== undefined);
    if (args.length !== rawArgs.length) return undefined;
    return `${callee}(${args.join(", ")})`;
  }

  // MemberExpression: Math.PI, Math.sqrt
  if (n.type === "MemberExpression") {
    const obj = unparseExpr(node.object as ASTNode);
    const prop = unparseExpr(node.property as ASTNode);
    if (obj === undefined || prop === undefined) return undefined;
    const opt = node.computed ? `[${prop}]` : `.${prop}`;
    return `${obj}${opt}`;
  }

  // ConditionalExpression: a ? b : c
  if (n.type === "ConditionalExpression") {
    const test = unparseExpr(node.test as ASTNode);
    const consequent = unparseExpr(node.consequent as ASTNode);
    const alternate = unparseExpr(node.alternate as ASTNode);
    if (test === undefined || consequent === undefined || alternate === undefined) return undefined;
    return `${test} ? ${consequent} : ${alternate}`;
  }

  // If we can't handle it, return undefined so the caller can fall back.
  return undefined;
}

// Extract coordinate pairs from a nested array literal like [[1,2],[3,4]].
function extractPoints(arg: ASTNode): [number, number][] | undefined {
  const lit = evalValue(arg);
  if (!Array.isArray(lit)) return undefined;
  const result: [number, number][] = [];
  for (const el of lit) {
    if (Array.isArray(el) && el.length >= 2) {
      const x = num(el[0]);
      const y = num(el[1]);
      if (x !== undefined && y !== undefined) result.push([x, y]);
    }
  }
  if (result.length > 0) return result;
  return undefined;
}

let nodeCounter = 0;
function freshId(prefix: string): string {
  return `${prefix}${++nodeCounter}`;
}

function parseArrayExpressionCoords(arg: ASTNode): [number, number] | undefined {
  const c = coordArr(arg);
  if (c) return c;
  const lit = evalValue(arg);
  if (Array.isArray(lit) && lit.length >= 2) {
    const x = num(lit[0]);
    const y = num(lit[1]);
    if (x !== undefined && y !== undefined) return [x, y];
  }
  return undefined;
}

function extractStyleObject(arg: ASTNode): Record<string, unknown> | undefined {
  const lit = evalValue(arg);
  if (lit && typeof lit === "object" && !Array.isArray(lit)) {
    return lit as Record<string, unknown>;
  }
  return undefined;
}

/** Build an IRNodeStyle from a raw style object (as emitted by irToGraphie). */
function styleFromObject(o: Record<string, unknown> | undefined): IRNodeStyle | undefined {
  if (!o) return undefined;
  const out: IRNodeStyle = {};
  if (typeof o.fill === "string") out.fill = o.fill;
  if (typeof o.stroke === "string") out.stroke = o.stroke;
  if (typeof o.strokeWidth === "number") out.strokeWidth = o.strokeWidth;
  if (typeof o.opacity === "number") out.opacity = o.opacity;
  if (typeof o.dashArray === "string") out.dashArray = o.dashArray;
  return Object.keys(out).length ? out : undefined;
}

/** The last argument to a Graphie shape call is an optional style object. */
function extractTrailingStyle(args: ASTNode[]): IRNodeStyle | undefined {
  if (args.length < 2) return undefined;
  const last = args[args.length - 1];
  const val = evalValue(last);
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return styleFromObject(val as Record<string, unknown>);
  }
  return undefined;
}

/** Number of "positional" (non-style) arguments, excluding the trailing style object. */
function positionalArgs(args: ASTNode[]): ASTNode[] {
  if (args.length >= 2) {
    const last = args[args.length - 1];
    const val = evalValue(last);
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return args.slice(0, args.length - 1);
    }
  }
  return args;
}

export function parseGraphieToIR(code: string): DiagramIR | null {
  nodeCounter = 0;
  let ast: ASTNode;
  try {
    ast = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "script",
      allowReturnOutsideFunction: true,
      allowImportExportEverywhere: true,
    }) as unknown as ASTNode;
  } catch {
    return null;
  }

  const nodes: IRNode[] = [];
  let range: [[number, number], [number, number]] = [[-10, 10], [-10, 10]];
  let scale = 30;
  let grid: DiagramIR["grid"] | undefined;
  let axes: DiagramIR["axes"] | undefined;

  const stack: ASTNode[] = [ast];
  while (stack.length) {
    const node = stack.pop()!;
    if (!node || typeof node.type !== "string") continue;

    if (isCall(node)) {
      const name = calleeName(node);
      const args = node.arguments as ASTNode[];

      if (name === "init") {
        const o = extractStyleObject(args[0] as ASTNode) ?? {};
        if (o.range) {
          const r = o.range;
          if (Array.isArray(r)) {
            const xr = coordArr(r[0]);
            const yr = coordArr(r[1]);
            if (xr && yr) range = [xr, yr];
          }
        }
        if (typeof o.scale === "number") scale = o.scale;
      }

       if (name === "graphInit") {
        const o = extractStyleObject(args[0] as ASTNode) ?? {};
        if (o.gridStep) {
          const gs = coordArr(o.gridStep);
          if (gs) grid = { step: [gs[0], gs[1]] };
        }
        if (o.tickStep) {
          const ts = coordArr(o.tickStep);
          if (ts) grid = { ...grid, tickStep: [ts[0], ts[1]] };
        }
        if (o.labelStep) {
          const ls = coordArr(o.labelStep);
          if (ls) grid = { ...grid, labelStep: [ls[0], ls[1]] };
        }
        if (o.axisArrows) axes = { ...axes, axisArrows: str(o.axisArrows) as never };
        if (o.axisLabels) {
          const al = o.axisLabels;
          if (Array.isArray(al)) {
            axes = { ...axes, axisLabels: [String(al[0] ?? ""), String(al[1] ?? "")] };
          }
        }
      }

      switch (name) {
        case "circle": {
          const pa = positionalArgs(args);
          const center = parseArrayExpressionCoords(pa[0] as ASTNode);
          const r = num(literalValue(pa[1] as ASTNode));
          if (center && r !== undefined) {
            const style = extractTrailingStyle(args);
            nodes.push({ id: freshId("circle"), kind: "circle", x: center[0], y: center[1], r, style });
          }
          break;
        }
        case "ellipse": {
          const pa = positionalArgs(args);
          const center = parseArrayExpressionCoords(pa[0] as ASTNode);
          const radii = coordArr(pa[1]);
          if (center && radii) {
            const style = extractTrailingStyle(args);
            nodes.push({ id: freshId("ellipse"), kind: "ellipse", x: center[0], y: center[1], rx: radii[0], ry: radii[1], style });
          }
          break;
        }
        case "rect": {
          const pa = positionalArgs(args);
          const origin = parseArrayExpressionCoords(pa[0] as ASTNode);
          const dims = coordArr(pa[1]);
          if (origin && dims) {
            const style = extractTrailingStyle(args);
            nodes.push({ id: freshId("rect"), kind: "rect", x: origin[0], y: origin[1], x2: dims[0], y2: dims[1], style });
          }
          break;
        }
        case "line": {
          const pa = positionalArgs(args);
          const a = parseArrayExpressionCoords(pa[0] as ASTNode);
          const b = parseArrayExpressionCoords(pa[1] as ASTNode);
          if (a && b) {
            const style = extractTrailingStyle(args);
            nodes.push({ id: freshId("line"), kind: "line", x: a[0], y: a[1], x2: b[0], y2: b[1], style });
          }
          break;
        }
        case "path":
        case "polyline":
        case "polygon": {
          const pa = positionalArgs(args);
          const pts = extractPoints(pa[0] as ASTNode);
          if (pts && pts.length > 0) {
            const style = extractTrailingStyle(args);
            nodes.push({ id: freshId(name === "path" ? "path" : name === "polygon" ? "poly" : "line"), kind: name as never, x: pts[0][0], y: pts[0][1], points: pts, style });
          }
          break;
        }
        case "label": {
          const pa = positionalArgs(args);
          const pt = parseArrayExpressionCoords(pa[0] as ASTNode);
          const t = str(pa[1]);
          if (pt && t !== undefined) {
            const style = extractTrailingStyle(args);
            const props: Record<string, unknown> = { text: t };
            if (pa.length >= 3) {
              const dir = str(pa[2]);
              if (dir !== undefined) props.position = dir;
            }
            nodes.push({ id: freshId("label"), kind: "label", x: pt[0], y: pt[1], props, style });
          }
          break;
        }
        case "point": {
          const pa = positionalArgs(args);
          const pt = parseArrayExpressionCoords(pa[0] as ASTNode);
          if (pt) {
            const style = extractTrailingStyle(args);
            nodes.push({ id: freshId("point"), kind: "point", x: pt[0], y: pt[1], style });
          }
          break;
        }
        case "image": {
          const pa = positionalArgs(args);
          const src = str(pa[0]);
          const pos = parseArrayExpressionCoords(pa[1] as ASTNode);
          const dims = coordArr(pa[2]);
          if (src && pos && dims) {
            const style = extractTrailingStyle(args);
            nodes.push({ id: freshId("img"), kind: "image", x: pos[0], y: pos[1], src, width: dims[0], height: dims[1], style });
          }
          break;
        }
        case "plot":
        case "plotParametric": {
          const style = extractTrailingStyle(args);
          const props: Record<string, unknown> = {};
          // Extract the function body from the anonymous function expression.
          if (args.length > 0) {
            const fnArg = args[0] as ASTNode;
            if (fnArg.type === "FunctionExpression" || fnArg.type === "ArrowFunctionExpression") {
              const fnNode = fnArg as unknown as Record<string, unknown>;
              const body = fnNode.body;
              if (body) {
                const bodyNode = body as ASTNode;
                // ArrowFunctionExpression with expression body: body IS the expression.
                if (fnArg.type === "ArrowFunctionExpression" && bodyNode.type !== "BlockStatement") {
                  const expr = unparseExpr(bodyNode);
                  if (expr !== undefined) props.expr = expr;
                }
                // FunctionExpression or ArrowFunctionExpression with block body.
                if (bodyNode.type === "BlockStatement") {
                  const stmts = (bodyNode as unknown as { body: ASTNode[] }).body;
                  if (stmts && stmts.length === 1 && stmts[0].type === "ReturnStatement") {
                    const retArg = (stmts[0] as unknown as { argument?: ASTNode }).argument;
                    if (retArg) {
                      const expr = unparseExpr(retArg as ASTNode);
                      if (expr !== undefined) props.expr = expr;
                    }
                  }
                }
              }
            }
          }
          if (args.length >= 2) {
            const dom = coordArr(args[1]);
            if (dom && dom.length >= 2) {
              props.domain = [dom[0], dom[1]] as [number, number];
            }
          }
          if (style) props.style = style;
          nodes.push({ id: freshId("fn"), kind: "function", x: 0, y: 0, props });
          break;
        }
        case "style": {
          // style affects subsequent nodes; we record nothing at node level here.
          break;
        }
      }
    }

    // Traverse children.
    for (const key of Object.keys(node)) {
      const val = (node as Record<string, unknown>)[key];
      if (Array.isArray(val)) {
        for (const item of val) {
          if (item && typeof item === "object" && typeof (item as { type?: unknown }).type === "string") {
            stack.push(item as ASTNode);
          }
        }
      } else if (val && typeof val === "object" && typeof (val as { type?: unknown }).type === "string") {
        stack.push(val as ASTNode);
      }
    }
  }

  return { range, scale, grid, axes, nodes };
}
