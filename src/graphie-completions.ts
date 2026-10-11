// Graphie function completions for Monaco editor.
//
// Provides autocomplete for all Graphie drawing functions
// with their argument signatures and documentation.

import type * as monaco from "monaco-editor";

export interface FunctionCompletion {
  label: string;
  kind: monaco.languages.CompletionItemKind;
  detail: string;
  documentation: string;
  insertText: string;
}

// Graphie drawing functions with their signatures and docs.
// Each entry: [name, signature, doc, insertText]
const GRAPHIE_FUNCTIONS: Array<{
  name: string;
  signature: string;
  doc: string;
  insertText: string;
}> = [
  // === Setup ===
  {
    name: "init",
    signature: "init({range, scale})",
    doc: "Initialize the graphie canvas with range and scale.\n\n" +
         "range: [[xMin, xMax], [yMin, yMax]]\n" +
         "scale: pixels per unit (or min of x/y scales)",
    insertText: "init({\n    range: [[-10, 10], [-5, 5]],\n    scale: 30\n});",
  },
  {
    name: "setup",
    signature: "setup()",
    doc: "Standard setup function. Configures canvas range and scale.\n\n" +
         "Call this at the top of your graph, then define your drawing code.",
    insertText: "setup();",
  },
  {
    name: "style",
    signature: "style({stroke, fill, ...}, fn)",
    doc: "Set default style for subsequent drawing operations.\n\n" +
         "Common properties:\n" +
         "  stroke: line color\n" +
         "  fill: fill color\n" +
         "  strokeWidth: line width\n" +
         "  strokeOpacity: line opacity (0-1)\n" +
         "  fillOpacity: fill opacity (0-1)\n" +
         "  opacity: overall opacity",
    insertText: "style({\n    stroke: LATTE_TEXT,\n    strokeWidth: 2\n});",
  },

  // === Points ===
  {
    name: "drawPoint",
    signature: "drawPoint({point, label, color, ...})",
    doc: "Draw a single point.\n\n" +
         "Options:\n" +
         "  point: [x, y] coordinates\n" +
         "  label: text label for the point\n" +
         "  color: point color\n" +
         "  stroke: point border color\n" +
         "  fill: point fill color\n" +
         "  strokeWidth: border width\n" +
         "  fillOpacity: fill opacity",
    insertText: "drawPoint({\n    point: [2, 3],\n    color: MOCHA_SKY\n});",
  },
  {
    name: "drawPoints",
    signature: "drawPoints({points, ...})",
    doc: "Draw multiple points.\n\n" +
         "Options:\n" +
         "  points: array of [x, y] coordinates\n" +
         "  color: point color\n" +
         "  labels: array of labels for each point",
    insertText: "drawPoints({\n    points: [[1, 1], [2, 2], [3, 3]],\n    color: MOCHA_GREEN\n});",
  },

  // === Lines ===
  {
    name: "drawLine",
    signature: "drawLine({points, stroke, strokeWidth, ...})",
    doc: "Draw an infinite line through two points.\n\n" +
         "Options:\n" +
         "  points: [[x1, y1], [x2, y2]]\n" +
         "  stroke: line color\n" +
         "  strokeWidth: line width\n" +
         "  strokeOpacity: line opacity\n" +
         "  dashed: true for dashed line\n" +
         "  dotted: true for dotted line",
    insertText: "drawLine({\n    points: [[-3, 0], [3, 0]],\n    stroke: LATTE_TEXT,\n    strokeWidth: 2\n});",
  },
  {
    name: "drawRay",
    signature: "drawRay({points, stroke, ...})",
    doc: "Draw a ray from one point through another.\n\n" +
         "Options:\n" +
         "  points: [[x1, y1], [x2, y2]] - ray starts at first point\n" +
         "  stroke: line color\n" +
         "  strokeWidth: line width\n" +
         "  dashed: true for dashed line\n" +
         "  dotted: true for dotted line",
    insertText: "drawRay({\n    points: [[0, 0], [3, 2]],\n    stroke: MOCHA_GREEN\n});",
  },
  {
    name: "drawSegment",
    signature: "drawSegment({points, sideLabel, ticks, ...})",
    doc: "Draw a line segment between two points.\n\n" +
         "Options:\n" +
         "  points: [[x1, y1], [x2, y2]]\n" +
         "  sideLabel: label for the segment (e.g., \"$len0\")\n" +
         "  vertexLabels: labels for endpoints\n" +
         "  showPoints: true to show endpoint dots\n" +
         "  ticks: number of tick marks\n" +
         "  stroke: line color\n" +
         "  strokeWidth: line width\n" +
         "  dashed: true for dashed line\n" +
         "  dotted: true for dotted line",
    insertText: "drawSegment({\n    points: [[0, 0], [4, 0]],\n    sideLabel: \"$len0\",\n    ticks: 1,\n    stroke: MOCHA_PEACH\n});",
  },
  {
    name: "line",
    signature: "line([x1, y1], [x2, y2])",
    doc: "Low-level line drawing. Draws a line segment between two points.\n\n" +
         "Use drawLine/drawSegment for more features.",
    insertText: "line([0, 0], [1, 1]);",
  },

  // === Polygons ===
  {
    name: "drawPolygon",
    signature: "drawPolygon({points, fill, stroke, ...})",
    doc: "Draw a polygon with optional fills, labels, and ticks.\n\n" +
         "Options:\n" +
         "  points: array of [x, y] vertices\n" +
         "  fill: fill color\n" +
         "  fillOpacity: fill opacity (0-1)\n" +
         "  stroke: border color\n" +
         "  strokeWidth: border width\n" +
         "  showPoints: true to show vertex dots\n" +
         "  vertexLabels: array of vertex labels\n" +
         "  angleLabels: array of angle labels\n" +
         "  sideLabels: array of side labels\n" +
         "  arcs: number of angle arcs\n" +
         "  arrows: number of side arrows\n" +
         "  ticks: number of side ticks",
    insertText: "drawPolygon({\n    points: [[0, 0], [3, 4], [8, 4], [5, 0]],\n    fill: MOCHA_GREEN,\n    fillOpacity: 0.2,\n    stroke: MOCHA_GREEN,\n    showPoints: true,\n    vertexLabels: [\"A\", \"B\", \"C\", \"D\"],\n    ticks: 1\n});",
  },

  // === Circles & Arcs ===
  {
    name: "circle",
    signature: "circle([x, y], radius, {stroke, ...})",
    doc: "Draw a circle.\n\n" +
         "Parameters:\n" +
         "  center: [x, y] center point\n" +
         "  radius: circle radius\n" +
         "  options: {stroke, strokeWidth, fill, fillOpacity, opacity}",
    insertText: "circle([0, 0], 3, {\n    stroke: MOCHA_MAROON,\n    strokeWidth: 2\n});",
  },
  {
    name: "drawCircle",
    signature: "drawCircle({center, radius, ...})",
    doc: "Draw a circle with options object.\n\n" +
         "Options:\n" +
         "  center: [x, y] center point\n" +
         "  radius: circle radius\n" +
         "  stroke: border color\n" +
         "  fill: fill color\n" +
         "  fillOpacity: fill opacity",
    insertText: "drawCircle({\n    center: [0, 0],\n    radius: 3,\n    stroke: MOCHA_MAROON\n});",
  },
  {
    name: "drawArc",
    signature: "drawArc({center, radii, start, end, ...})",
    doc: "Draw an arc.\n\n" +
         "Options:\n" +
         "  center: [x, y] center point\n" +
         "  radii: radius (or [rx, ry] for ellipse)\n" +
         "  start: start angle in degrees\n" +
         "  end: end angle in degrees\n" +
         "  sector: true to draw a sector (filled pie slice)\n" +
         "  stroke: border color\n" +
         "  fill: fill color\n" +
         "  fillOpacity: fill opacity",
    insertText: "drawArc({\n    center: [0, 0],\n    radius: 3,\n    start: 0,\n    end: 90,\n    stroke: MOCHA_MAUVE\n});",
  },
  {
    name: "drawSector",
    signature: "drawSector({center, radii, start, end, ...})",
    doc: "Draw a sector (filled pie slice).\n\n" +
         "Same options as drawArc, but always filled.",
    insertText: "drawSector({\n    center: [0, 0],\n    radius: 3,\n    start: 0,\n    end: 90,\n    fill: MOCHA_MAUVE,\n    fillOpacity: 0.3\n});",
  },
  {
    name: "drawEllipse",
    signature: "drawEllipse({center, radii, ...})",
    doc: "Draw an ellipse.\n\n" +
         "Options:\n" +
         "  center: [x, y] center point\n" +
         "  radii: [rx, ry] or single radius\n" +
         "  stroke: border color\n" +
         "  fill: fill color\n" +
         "  fillOpacity: fill opacity",
    insertText: "drawEllipse({\n    center: [0, 0],\n    radii: [3, 2],\n    stroke: MOCHA_PINK\n});",
  },

  // === Angles ===
  {
    name: "drawAngleLabel",
    signature: "drawAngleLabel({points, label, distance, arcs, ...})",
    doc: "Draw an angle label with optional arc.\n\n" +
         "Options:\n" +
         "  points: [point1, vertex, point2] - three points defining the angle\n" +
         "  label: text label (use \"$deg0\" for angle in degrees)\n" +
         "  distance: distance from vertex to label\n" +
         "  arcs: number of arc marks (1, 2, or 3)\n" +
         "  showRightAngleMarker: true to show right angle box\n" +
         "  color: label color",
    insertText: "drawAngleLabel({\n    points: [[1, 0], [0, 0], [0, 1]],\n    label: \"90^\\\\circ\",\n    distance: 4,\n    arcs: 1,\n    color: MOCHA_PINK\n});",
  },

  // === Plots ===
  {
    name: "plot",
    signature: "plot(fn, range, {stroke, ...})",
    doc: "Plot a function y = f(x) over a range.\n\n" +
         "Parameters:\n" +
         "  fn: function(x) returning y\n" +
         "  range: [xMin, xMax]\n" +
         "  options: {stroke, strokeWidth, strokeOpacity, fill, fillOpacity}",
    insertText: "plot(function(x) {\n    return x * x;\n}, [-5, 5], {\n    stroke: MOCHA_SKY,\n    strokeWidth: 2\n});",
  },
  {
    name: "plotPolar",
    signature: "plotPolar(fn, range, {stroke, ...})",
    doc: "Plot a polar function r = f(theta).\n\n" +
         "Parameters:\n" +
         "  fn: function(theta) returning radius\n" +
         "  range: [thetaMin, thetaMax] in radians\n" +
         "  options: {stroke, strokeWidth, strokeOpacity}",
    insertText: "plotPolar(function(theta) {\n    return 5 * cos(10 * cos(theta));\n}, [0, 2*PI], {\n    stroke: MOCHA_SKY,\n    strokeWidth: 2\n});",
  },
  {
    name: "plotParametric",
    signature: "plotParametric(fn, range, {stroke, ...})",
    doc: "Plot a parametric curve.\n\n" +
         "Parameters:\n" +
         "  fn: function(t) returning [x, y]\n" +
         "  range: [tMin, tMax]\n" +
         "  options: {stroke, strokeWidth, strokeOpacity}",
    insertText: "plotParametric(function(t) {\n    return [cos(t), sin(t)];\n}, [0, 2*PI], {\n    stroke: MOCHA_GREEN\n});",
  },
  {
    name: "plotPiecewise",
    signature: "plotPiecewise(fnArray, rangeArray)",
    doc: "Plot a piecewise function.\n\n" +
         "Parameters:\n" +
         "  fnArray: array of functions\n" +
         "  rangeArray: array of [min, max] ranges for each function",
    insertText: "plotPiecewise(\n    [function(x) { return x; },\n     function(x) { return x * x; }],\n    [[-5, 0], [0, 5]]\n);",
  },

  // === Labels ===
  {
    name: "label",
    signature: "label([x, y], text, direction, latex)",
    doc: "Add a text label at a point.\n\n" +
         "Parameters:\n" +
         "  point: [x, y] position\n" +
         "  text: label text (LaTeX supported)\n" +
         "  direction: \"above\", \"below\", \"left\", \"right\", \"center\"\n" +
         "  latex: true (default) to render as LaTeX",
    insertText: "label([2, 3], \"\\\\small{Hello}\", \"above\");",
  },

  // === Utility ===
  {
    name: "polar",
    signature: "polar(radius, angle)",
    doc: "Convert polar coordinates to Cartesian.\n\n" +
         "Parameters:\n" +
         "  radius: distance from origin\n" +
         "  angle: angle in degrees",
    insertText: "polar(5, 45)",
  },
  {
    name: "addPoints",
    signature: "addPoints([x1, y1], [x2, y2])",
    doc: "Add two points component-wise.\n\n" +
         "Returns [x1+x2, y1+y2].",
    insertText: "addPoints([1, 2], [3, 4])",
  },
  {
    name: "rotatePoint",
    signature: "rotatePoint([x, y], angle, [cx, cy])",
    doc: "Rotate a point around a center.\n\n" +
         "Parameters:\n" +
         "  point: [x, y] to rotate\n" +
         "  angle: rotation in degrees\n" +
         "  center: [cx, cy] center of rotation (default origin)",
    insertText: "rotatePoint([1, 0], 90, [0, 0])",
  },
  {
    name: "make3dObject",
    signature: "make3dObject(vertices, {scale})",
    doc: "Create a 3D object for 3D diagrams.\n\n" +
         "Parameters:\n" +
         "  vertices: array of [x, y, z] points\n" +
         "  options: {scale: scale factor}",
    insertText: "var obj = make3dObject(vertices, {scale: 5});",
  },
];

// Helper functions from templates
const HELPER_FUNCTIONS: Array<{
  name: string;
  signature: string;
  doc: string;
  insertText: string;
}> = [
  {
    name: "drawSimpleRectangle",
    signature: "drawSimpleRectangle({x, y, width, height, ...})",
    doc: "Draw a simple rectangle (helper function).\n\n" +
         "Options:\n" +
         "  x, y: center position\n" +
         "  width, height: dimensions\n" +
         "  rotate: rotation in degrees\n" +
         "  showLabels: true to show dimension labels\n" +
         "  ticks: array of tick counts per side",
    insertText: "drawSimpleRectangle({\n    x: 5,\n    y: 5,\n    width: 3,\n    height: 4,\n    showLabels: true\n});",
  },
  {
    name: "drawSimpleTriangle",
    signature: "drawSimpleTriangle({x, y, base, height, ...})",
    doc: "Draw a simple triangle (helper function).\n\n" +
         "Options:\n" +
         "  x, y: center position\n" +
         "  base, height: dimensions\n" +
         "  rotate: rotation in degrees\n" +
         "  showLabels: true to show dimension labels\n" +
         "  ticks: array of tick counts per side",
    insertText: "drawSimpleTriangle({\n    x: 5,\n    y: 5,\n    base: 3,\n    height: 4,\n    rotate: 0,\n    showLabels: true\n});",
  },
];

// Math constants
const MATH_CONSTANTS: Array<{
  name: string;
  value: string;
  doc: string;
}> = [
  { name: "PI", value: "PI", doc: "π ≈ 3.14159" },
  { name: "E", value: "E", doc: "e ≈ 2.71828" },
  { name: "SQRT2", value: "SQRT2", doc: "√2 ≈ 1.41421" },
  { name: "LN2", value: "LN2", doc: "ln(2) ≈ 0.69315" },
  { name: "LN10", value: "LN10", doc: "ln(10) ≈ 2.30259" },
  { name: "LOG2E", value: "LOG2E", doc: "log₂(e) ≈ 1.44270" },
  { name: "LOG10E", value: "LOG10E", doc: "log₁₀(e) ≈ 0.43429" },
  { name: "TAU", value: "TAU", doc: "τ = 2π ≈ 6.28318" },
];

// Math functions
const MATH_FUNCTIONS: Array<{
  name: string;
  signature: string;
  doc: string;
  insertText: string;
}> = [
  { name: "sin", signature: "sin(x)", doc: "Sine of x (radians)", insertText: "sin(x)" },
  { name: "cos", signature: "cos(x)", doc: "Cosine of x (radians)", insertText: "cos(x)" },
  { name: "tan", signature: "tan(x)", doc: "Tangent of x (radians)", insertText: "tan(x)" },
  { name: "asin", signature: "asin(x)", doc: "Arcsine of x", insertText: "asin(x)" },
  { name: "acos", signature: "acos(x)", doc: "Arccosine of x", insertText: "acos(x)" },
  { name: "atan", signature: "atan(x)", doc: "Arctangent of x", insertText: "atan(x)" },
  { name: "sqrt", signature: "sqrt(x)", doc: "Square root of x", insertText: "sqrt(x)" },
  { name: "abs", signature: "abs(x)", doc: "Absolute value of x", insertText: "abs(x)" },
  { name: "pow", signature: "pow(x, y)", doc: "x raised to the power y", insertText: "pow(x, y)" },
  { name: "exp", signature: "exp(x)", doc: "e^x", insertText: "exp(x)" },
  { name: "log", signature: "log(x)", doc: "Natural logarithm of x", insertText: "log(x)" },
  { name: "floor", signature: "floor(x)", doc: "Round down to integer", insertText: "floor(x)" },
  { name: "ceil", signature: "ceil(x)", doc: "Round up to integer", insertText: "ceil(x)" },
  { name: "round", signature: "round(x)", doc: "Round to nearest integer", insertText: "round(x)" },
  { name: "min", signature: "min(a, b)", doc: "Minimum of a and b", insertText: "min(a, b)" },
  { name: "max", signature: "max(a, b)", doc: "Maximum of a and b", insertText: "max(a, b)" },
  { name: "random", signature: "random()", doc: "Random number in [0, 1)", insertText: "random()" },
  { name: "randRange", signature: "randRange(min, max)", doc: "Random integer in [min, max]", insertText: "randRange(min, max)" },
  { name: "randFromArray", signature: "randFromArray(arr)", doc: "Random element from array", insertText: "randFromArray(arr)" },
  { name: "shuffle", signature: "shuffle(arr, count)", doc: "Shuffle array (optionally take count elements)", insertText: "shuffle(arr, count)" },
];

// Label format strings
const LABEL_FORMATS: Array<{
  name: string;
  doc: string;
  insertText: string;
}> = [
  { name: "$deg0", doc: "Angle in degrees, 0 decimal places", insertText: "$deg0" },
  { name: "$deg1", doc: "Angle in degrees, 1 decimal place", insertText: "$deg1" },
  { name: "$deg2", doc: "Angle in degrees, 2 decimal places", insertText: "$deg2" },
  { name: "$len0", doc: "Length in units, 0 decimal places", insertText: "$len0" },
  { name: "$len1", doc: "Length in units, 1 decimal place", insertText: "$len1" },
  { name: "$len2", doc: "Length in units, 2 decimal places", insertText: "$len2" },
];

export function getGraphieCompletions(): FunctionCompletion[] {
  const suggestions: FunctionCompletion[] = [];

  // Graphie drawing functions
  for (const fn of GRAPHIE_FUNCTIONS) {
    suggestions.push({
      label: fn.name,
      kind: monaco.languages.CompletionItemKind.Function,
      detail: fn.signature,
      documentation: fn.doc,
      insertText: fn.insertText,
    });
  }

  // Helper functions
  for (const fn of HELPER_FUNCTIONS) {
    suggestions.push({
      label: fn.name,
      kind: monaco.languages.CompletionItemKind.Function,
      detail: fn.signature,
      documentation: fn.doc,
      insertText: fn.insertText,
    });
  }

  // Math constants
  for (const c of MATH_CONSTANTS) {
    suggestions.push({
      label: c.name,
      kind: monaco.languages.CompletionItemKind.Constant,
      detail: c.value,
      documentation: c.doc,
      insertText: c.value,
    });
  }

  // Math functions
  for (const fn of MATH_FUNCTIONS) {
    suggestions.push({
      label: fn.name,
      kind: monaco.languages.CompletionItemKind.Function,
      detail: fn.signature,
      documentation: fn.doc,
      insertText: fn.insertText,
    });
  }

  // Label formats
  for (const fmt of LABEL_FORMATS) {
    suggestions.push({
      label: fmt.name,
      kind: monaco.languages.CompletionItemKind.Snippet,
      detail: "Label format",
      documentation: fmt.doc,
      insertText: fmt.insertText,
    });
  }

  return suggestions;
}
