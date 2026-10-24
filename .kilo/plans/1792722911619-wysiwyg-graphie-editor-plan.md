# Plan: WYSIWYG Drag-and-Drop Editor for Graphie Code Generation

## Goal
Build a WYSIWYG vector editor with full feature parity to Google Drawings / Inkscape / Illustrator (paths, shapes, text, images, grouping, transforms, selection, multi-select, alignment, ordering, styling) that generates and outputs Graphie code, integrated into the existing `VisualEditor` / IR / codegen pipeline in `src/`.

## Status of existing code
- `src/store.ts` — Zustand store holding `code` (Graphie string), `ir` (`DiagramIR | null`), undo/redo history.
- `src/ir/types.ts` — `IRNodeKind` = point|label|function|axis|line|circle|rect; `IRNode` has id/kind/x/y/x2/y2/r/props.
- `src/ir/parse.ts` — `parseGraphieToIR(code)`: only matches `point()` and `label()` regexes. Returns `{ nodes }`.
- `src/codegen/graphie.ts` — `irToGraphie(ir)`: emits init + a line per node. Hardcodes range `[[0, width],[0, height]]`, no scale.
- `src/components/VisualEditor.tsx` — placeholder palette (Point/Label/Line/Circle/Rect/Plot). Uses `toPercent` against a hardcoded `[-10,10]` x range. Supports drag-move only. Renders its own `PreviewPanel` (duplicate of the real one in Shell).
- `src/components/Shell.tsx` — renders `<VisualEditor />` in `mode === "visual"`, but the mode toggle only swaps the code editor for the visual editor (preview stays, but VisualEditor renders its own preview too).
- `preview.html` runtime — full Graphie API via `$.fn.graphie`: `init`, `init` (graphInit), `style`, `plot`, `label`, `point`, `line`, `circle`, `rect`, `ellipse`, `path`, `arc`, plus `add` for sets/groups.

## Design decisions (resolved)
- Target scope: core vector primitives + properties needed for Graphie parity — path (polyline/freehand/curve), rect, circle, ellipse, line, polygon, label (text), point, image. Advanced operators (boolean path ops, mesh gradient editors) are explicitly out of scope.
- Graphie is the render target (not SVG-foreign). The IR round-trips between a Graphie string and diagram IR. The IR is the editable model; Graphie code is regenerated from IR and sent to the preview iframe (which is the render authority).
- IR types extended per node kind with style props (fill, stroke, strokeWidth, opacity, dash) and transform props (rotateDeg, scaleX, scaleY relative to center) instead of freeform `props` bag.
- Coordinates in IR are in Graphie coordinate space (cartesian, matching `init` range), NOT pixels. The canvas maps canvas-mouse ↔ Graphie coords using the iframe's current `range`/`scale`.

## Stages

### Stage 0 — Foundation & tests
- Add vitest config for `src/**/*.test.{ts,tsx}` (already present via vitest.config.ts). Ensure `yarn test` runs.
- Add `src/ir/types.ts` test: round-trip types.
- Verify baseline `yarn typecheck` and `yarn lint` pass before changes.
- Outcome: green baseline + test runner confirmed.

### Stage 1 — IR model expansion
Expand `src/ir/types.ts`:
- `IRNodeStyle`: fill, stroke, strokeWidth, opacity, dashArray, shadow.
- `IRNodeTransform`: rotateDeg, scaleX, scaleY (relative to node center), locked bool.
- Extend `IRNode` with `style?: IRNodeStyle`, `transform?: IRNodeTransform`.
- Add kinds: `polyline`, `polygon`, `ellipse`, `image`, `group` (id[] children).
- Add `DiagramIR`: `range`, `scale`, `grid`, `axes` fields.

Tests:
- `src/ir/types.test.ts`: validate new fields compile + shape.

### Stage 2 — Robust Graphie parser
Replace `src/ir/parse.ts` regex-based parser with a real tokenizer/parser that extracts:
- `init({ range, scale })` → DiagramIR.range/scale
- `graphInit({ gridStep, tickStep, ... })` → grid/axes
- Per-call: `circle([x,y], r)`, `rect([x,y], w, h)`, `ellipse([cx,cy],[rx,ry])`, `line([x1,y1],[x2,y2])`, `path([...points])`, `polygon([...points])`, `label([x,y], "text")`, `point([x,y])`, `plot(fn, range)` → IR nodes with geometry + style (parse inline style object).
- Use `acorn` (already a dependency) to parse JS safely for `style({...})` blocks and `plot(function(x){...})` expressions.

Tests:
- `src/ir/parse.test.ts`: each primitive → IR node count + geometry correct.

### Stage 3 — IR→Graphie codegen
Rewrite `src/codegen/graphie.ts`:
- Emit proper `init({ range, scale })`.
- Emit `graphInit` if grid/axes IR set.
- Emit `style({ fill, stroke, strokeWidth, opacity, dashArray })` blocks.
- Emit transforms via Graphie's `map` coordinate transform where applicable.
- Emit each node kind per Graphie API signatures from Stage 2.

Tests:
- `src/codegen/graphie.test.ts`: IR → code; then parse(code) → equivalent IR (round-trip).

### Stage 4 — Coordinate system & canvas interaction
- New `src/components/canvas/` module: a `GraphieCanvas` component that:
  - Renders the live preview iframe (reuse existing `PreviewPanel`).
  - Overlays an SVG interaction layer (handles) positioned using `range`/`scale` from IR.
  - `toGraphieCoords(clientX, clientY)` and `toCanvasCoords(x, y)` helpers using the iframe-reported range/scale (extend `preview.html` to post `range`/`scale` on render).
- `addNode(kind)` places new nodes at canvas center in Graphie coords.

Tests:
- `src/components/canvas/coords.test.ts`: round-trip conversion math.

### Stage 5 — Selection & multi-select
- IR nodes gain `selected: boolean` (transient, held in a selection store slice or via node ids).
- Click handle → select single; Ctrl/Cmd-click → toggle; drag on empty → marquee box select.
- Box-render selection bounding rects on the overlay.
- Inspector reacts to current selection set.

Tests:
- `src/components/canvas/selection.test.ts`: marquee logic, toggle semantics.

### Stage 6 — Drag, resize, rotate, transform
- Drag existing shapes (move whole node) — already partially done.
- Resize handles per node kind (corners for rect/polygon/ellipse, endpoints for line/polyline).
- Rotation handle (angle slider in inspector + canvas knob).
- Scale handles (relative to center).

Tests:
- `src/components/canvas/transform.test.ts`: geometry mutation correctness.

### Stage 7 — Path / freehand / bezier editing
- Path tool: click to add vertices to a `polyline`; Enter/close converts to `polygon` or closed `path`.
- Direct node editing: vertex handles + bezier handles for curvature.
- Freehand tool: sample mouse points, simplify (Ramer–Douglas–Peucker), emit `path`.

Tests:
- `src/ir/path.test.ts`: point insertion, simplification.

### Stage 8 — Inspector panel & styling
- Replace placeholder `InspectorContent` with real controls wired to selection:
  - Text/Label editor (live).
  - Style pickers: fill color, stroke color, stroke width, opacity, dash pattern.
  - Transform inputs: x/y, rotate, scale.
  - Layer ordering: bring forward / send backward.
  - Delete via context menu or Delete key.
- All edits write back to IR → regenerate Graphie code → postMessage to iframe.

Tests:
- `src/store.test.ts`: edits propagate to code via store.

### Stage 9 — Asset / image support
- Add `image` IR node: `image([x,y], "url", { width, height })`.
- Toolbar tool to place image (file picker → data URL).
- Out of scope for this plan: remote image fetching beyond data URLs.

Tests:
- `src/codegen/graphie.test.ts`: image node round-trip.

### Stage 10 — Toolbar & tool palette
- Replace the `Palette` of `PBtn` buttons in `VisualEditor` with a proper dockable toolbar:
  - Select tool, Rectangle, Ellipse, Line, Polygon/Path, Text (Label), Image, Pen (freehand), Zoom/Pan.
  - Each tool maps to an `activeTool` in the store.
- Integrate into the Shell layout's mode toggle cleanly (visual editor replaces code editor; preview stays).

Tests:
- `src/store.test.ts`: tool state transitions.

### Stage 11 — Integration & UX polish
- Wire `VisualEditor` properly into `Shell` so preview isn't duplicated.
- Keyboard shortcuts: Delete to remove, Esc to deselect, arrow keys to nudge.
- Snapping: grid snap + snap-to-object (align guides).
- Status bar updates: show selected node count, coordinates of hover.
- Ensure `yarn dev` renders the interactive canvas end-to-end with live Graphie output.

Tests:
- `yarn test` all; `yarn typecheck`; `yarn lint`.
- Manual smoke test via `yarn dev`.

### Stage 12 — Export parity
- Confirm SVG/PNG/JPEG/PDF exports still work from the visual editor (export already goes through `previewRef.getSVG()`).
- Add test: exporting a diagram built via IR produces non-empty SVG.

## Data flow
1. User performs a tool action on `GraphieCanvas` overlay.
2. Store's IR mutates (via new `updateNode`/`setNodes` store methods).
3. `irToGraphie(ir)` regenerates Graphie code → `setCode`.
4. `PreviewPanel` (existing) postMessages code to `preview.html` iframe → Graphie runtime renders.
5. Iframe reports rendered state (and optionally range/scale for coord mapping) back to parent.
6. Export uses existing `getSVG()` bridge.

## Risks & mitigations
- **Coord mapping**: Graphie canvas size is dynamic (range×scale). Mitigation: have `preview.html` postMessage `{type:'graphie:layout', range, scale}` after render; `GraphieCanvas` reads it for accurate mapping.
- **Parser completeness vs. template variety**: Templates use `setup()`, `var X_RANGE`, complex `graphInit` options. Mitigation: parse what we own in `irToGraphie`; for arbitrary hand-written Graphie, fall back gracefully (best-effort node detection) and keep a warning.
- **Live preview performance**: Large node sets + frequent code regen. Mitigation: debouce regen (50ms), only regen when IR changes.

## Verification plan
- `yarn test` (vitest, jsdom) — unit tests per stage.
- `yarn typecheck` — TypeScript strict.
- `yarn lint` — ESLint.
- Manual: `yarn dev`, create shapes, edit in inspector, verify Graphie code updates and preview re-renders.

## Out of scope
- Boolean path operations (union/difference/intersect).
- Gradient mesh / advanced fills.
- Plugin/extensibility system beyond the toolbar.
- CeTZ/Typst path rendering integration.

## File changes summary (expected)
- `src/ir/types.ts` (extend)
- `src/ir/parse.ts` (rewrite)
- `src/codegen/graphie.ts` (rewrite)
- `src/store.ts` (add `activeTool`, node mutation helpers)
- `src/components/VisualEditor.tsx` (rewrite for tool system + overlay)
- `src/components/canvas/*` (new: GraphieCanvas, coords, handles, selection)
- `src/components/InspectorContent.tsx` (new)
- `src/components/canvas/coords.test.ts`, `selection.test.ts`, `transform.test.ts`, `path.test.ts`, `ir/types.test.ts`, `ir/parse.test.ts`, `codegen/graphie.test.ts`

This is implementation-ready. A coding-capable agent should implement stage by stage, running `yarn test` + `yarn typecheck` after each.