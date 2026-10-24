import type { DiagramIR, IRNode, IRNodeStyle } from "../ir/types";

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/\.?0+$/, "");
}

function coord(x: number, y: number): string {
  return `[${fmt(x)}, ${fmt(y)}]`;
}

function styleFor(n: IRNode): string | undefined {
  const parts: string[] = [];
  const s = n.style ?? (n.props?.style as IRNodeStyle | undefined) ?? {};
  const fill = s.fill ?? n.fill;
  const stroke = s.stroke ?? n.stroke;
  const sw = s.strokeWidth ?? n.strokeWidth;
  const op = s.opacity ?? n.opacity;
  const dash = s.dashArray ?? n.dashArray;
  if (fill !== undefined && fill !== "") parts.push(`fill: "${fill}"`);
  if (stroke !== undefined && stroke !== "") parts.push(`stroke: "${stroke}"`);
  if (sw !== undefined) parts.push(`strokeWidth: ${fmt(sw)}`);
  if (op !== undefined) parts.push(`opacity: ${fmt(op)}`);
  if (dash !== undefined && dash !== "") parts.push(`dashArray: "${dash}"`);
  return parts.length ? `{ ${parts.join(", ")} }` : undefined;
}

export function irToGraphie(ir: DiagramIR): string {
  const lines: string[] = [];
  const r = ir.range;
  const s = ir.scale;
  lines.push(`init({ range: [[${fmt(r[0][0])}, ${fmt(r[0][1])}], [${fmt(r[1][0])}, ${fmt(r[1][1])}]], scale: ${fmt(s)} });`);

  if (ir.grid && ir.grid.step) {
    const g = ir.grid;
    const step = g.step;
     lines.push(`grid(${coord(step![0], step![1])});`);
  }

  if (ir.axes) {
    const opts: string[] = [];
    if (ir.axes.axisArrows) opts.push(`axisArrows: "${ir.axes.axisArrows}"`);
    if (ir.axes.axisLabels) opts.push(`axisLabels: ["${ir.axes.axisLabels[0]}", "${ir.axes.axisLabels[1]}"]`);
    if (opts.length) lines.push(`graphInit({ ${opts.join(", ")} });`);
  }

  for (const n of ir.nodes) {
    emitNode(lines, n, ir);
  }
  return lines.join("\n");
}

function emitNode(lines: string[], n: IRNode, ir: DiagramIR): void {
  const st = styleFor(n);
  const styleArg = st ? `, ${st}` : "";
  let line: string | null = null;

  switch (n.kind) {
    case "point":
      line = `point(${coord(n.x, n.y)}${styleArg});`;
      break;
    case "label":
      line = `label(${coord(n.x, n.y)}, "${escapeStr(String(n.props?.text ?? n.text ?? ""))}"${labelPosition(n)}${styleArg});`;
      break;
    case "function": {
      const expr = String(n.props?.expr ?? n.expr ?? "x");
      const domain = (n.props?.domain as [number, number] | undefined) ?? [ir.range[0][0], ir.range[0][1]];
      line = `plot(function(x){ return ${expr}; }, [${fmt(domain[0])}, ${fmt(domain[1])}]${styleArg});`;
      break;
    }
    case "axis":
      line = `// axis`;
      break;
    case "line":
      line = `line(${coord(n.x, n.y)}, ${coord(n.x2 ?? n.x, n.y2 ?? n.y)}${styleArg});`;
      break;
    case "circle":
      line = `circle(${coord(n.x, n.y)}, ${fmt(n.r ?? 1)}${styleArg});`;
      break;
    case "rect":
      line = `rect(${coord(n.x, n.y)}, ${coord(n.x2 ?? n.x + 1, n.y2 ?? n.y - 1)}${styleArg});`;
      break;
    case "ellipse":
      line = `ellipse(${coord(n.x, n.y)}, ${coord(n.rx ?? 1, n.ry ?? 1)}${styleArg});`;
      break;
    case "polygon":
    case "polyline": {
      const pts = n.points ?? [[n.x, n.y], [n.x2 ?? n.x, n.y2 ?? n.y]];
      const ptsStr = pts.map((p) => coord(p[0], p[1])).join(", ");
      line = `${n.kind}([${ptsStr}]${styleArg});`;
      break;
    }
    case "path": {
      const pts = n.points ?? [[n.x, n.y], [n.x2 ?? n.x, n.y2 ?? n.y]];
      const ptsStr = pts.map((p) => coord(p[0], p[1])).join(", ");
      line = `path([${ptsStr}]${styleArg});`;
      break;
    }
    case "image":
      line = `image("${escapeStr(n.src ?? "")}", ${coord(n.x, n.y)}, ${coord(n.width ?? 1, n.height ?? 1)}${styleArg});`;
      break;
    case "group":
      line = `// group ${n.id}`;
      for (const cid of n.children ?? []) {
        line += `\n//   child: ${cid}`;
      }
      break;
  }
  if (line !== null) lines.push(line);
  if (n.label) lines.push(`label(${coord(n.x, n.y)}, "${escapeStr(n.label)}");`);
}

function escapeStr(s: string): string {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function labelPosition(n: IRNode): string {
  const pos = n.props?.position;
  if (pos !== undefined && pos !== null) {
    return `, "${escapeStr(String(pos))}"`;
  }
  return "";
}
