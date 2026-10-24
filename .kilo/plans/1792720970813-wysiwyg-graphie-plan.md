# WYSIWYG Drag-and-Drop Editing Mode for Graphie Builder

## Goal
Add a visual drag-and-drop editing mode on top of the existing Graphie Builder that edits Graphie diagrams, backed by a JSON internal representation deterministically code-generated into Graphie code. Also fix preview.html so large diagrams are not clipped and zoom/pan operate on the preview canvas itself.

## Scope (this phase)
- Graphie diagrams only (Typst deferred).
- JSON IR + deterministic Graphie code generator.
- Preview fixes: no clipping of oversized diagrams; zoom/pan transform applied inside preview.html.

## Decisions
1. **IR shape**: Introduce `DiagramIR` (nodes: `axis`, `function`, `point`, `label`, `shape`, `polygon`, etc.) with geometry, style, and grouping. Source of truth in React store; code is derived, not hand-edited in WYSIWYG mode.
2. **Codegen**: `irToGraphie(ir): string` deterministic, pure function in `src/codegen/graphie.ts`. Round-trip tested: parse existing Graphie -> IR (best-effort) deferred; initial scope is IR -> code only for new visual edits; manual code mode stays as-is.
3. **Editing surface**: New Svelte canvas component `VisualEditor.svelte` overlays draggable handles on top of the preview iframe (or a parallel SVG layer). Drag updates IR node transforms; on commit, regenerate code via codegen and push to store (debounced).
4. **Preview changes**:
   - `public/preview.html`: remove `overflow: hidden` clipping; set `#graphie-host` to `min-content`/scrollable container; expose `window.setZoom(z)` and `window.pan(dx,dy)` that apply CSS transform to `.graphie` container; postMessage handlers `graphie:zoom`, `graphie:pan`, `graphie:resetView`.
   - `PreviewPanel.tsx`: replace outer CSS scale hack with postMessage-driven view transform; parent zoom control calls `iframe.contentWindow.postMessage({type:'graphie:zoom',zoom})`. Viewport becomes the pan container; diagram never clipped because host sizes to content.
5. **Mode toggle**: Shell toolbar toggle between Code / Visual / Split; visual mode hides Monaco, shows canvas with overlays.

## Affected files
- `public/preview.html` (view transform + no-clip)
- `src/components/PreviewPanel.tsx` (postMessage zoom/pan, remove scale hack)
- `src/components/ZoomControl.tsx` (unchanged API, parent wires to preview)
- New: `src/ir/types.ts`, `src/codegen/graphie.ts`, `src/components/VisualEditor.svelte` (or .tsx)
- `src/store.ts` (add `ir`, `mode`, `setIR`)
- `src/components/Shell.tsx` (mode toggle)

## Data flow
Visual edit -> update IR node -> debounced codegen -> store.code -> PreviewPanel postMessage run -> render. Code mode edits bypass IR (IR stale until next parse; acceptable for phase 1).

## Risks
- Graphie code is imperative; reverse-parsing arbitrary code into IR is hard. Mitigation: IR is authoritative only in visual mode; switching modes may lose visual fidelity. Document limitation.
- MathJax labels async; overlays must recompute positions after `graphie:rendered`.
- Large diagrams: ensure host uses content size, not viewport size.

## Validation
- Unit tests for `irToGraphie` golden outputs.
- Manual: drag a point, code updates, preview re-renders, zoom/pan no clipping at 400%.
- Existing tests (`yarn test`) pass.

## Open questions
- Exact IR schema for each Graphie primitive (needs Graphie API audit).
- Selection/resize handles UX (deferred to implementation).
