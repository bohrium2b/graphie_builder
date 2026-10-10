# Graphie Implementation Plan

Based on reading through the graphie-to-png codebase and templates, here's a concrete plan for implementing Graphie Builder using graphie.

## 1) Graphie runtime structure (what we must reproduce)

From `khan-exercises/utils/graphie*.js`:

- **Module system**: AMD via `require.js`/`define()`. Modules depend on each other (`graphie-drawing.js` requires `./math.js`, `./graphie.js`; `graphie.js` requires `./kpoint.js`, `./kvector.js`, `./tex.js`, `./tmpl.js`, etc.). We need to either bundle with require.js in an iframe, or convert the minimal subset to ES modules in Vite. For fidelity with graphie-to-png's behavior, bundling the same AMD modules (or loading them via require.js) is safest.
- **Entry point**: `KhanUtil.createGraphie(el)` returns a `Graphie` instance bound to a Raphael paper. It stores `range`, `scale`, `dimensions`, `xpixels/ypixels`, `raphael`, and methods like `line`, `circle`, `path`, `ellipse`, `arc`, `polygon`, `grid`, `label`, `plot`, `plotParametric`, `init`, `graphInit`, `style`, plus movable-element helpers (`addMovablePoint/LineSegment/Polygon`, etc.) used by the drawing API.
- **Coordinate system**: `init({range, scale})` sets x/y ranges and scale (pixels per unit). `scalePoint/scaleVector` convert math coords to pixels; `unscalePoint/unscaleVector` the reverse. SVG y is flipped in some helpers (e.g. `scaledPolarRad` uses `radius*sin*radians*-1`). The drawing layer works in math coordinates and graphie converts to SVG.
- **Setup variants**: templates define a `setup()` function. 
  - Simple: computes scales via `Perseus.Util.scaleFromExtent(extent,size)`, calls `init({range,scale: min(scales)})`
  - Grid: computes tick/grid configs via `Perseus.Util.tickStepFromExtent`, `Perseus.Util.gridDimensionConfig`, builds `gridRange/range/scale/axisArrows/labelFormat/gridStep/tickStep/unityLabels`, calls `graphInit({...})`. Also sets `xScale/yScale` globals.
- **Plotting**: `graphie.plot(fn, range, options)` draws function curves; `plotParametric` and asymptote detection exist. Style is controlled via `style({...})` which sets `currentStyle` and can wrap drawing calls.
- **Drawing API** (`graphie-drawing.js`): adds `drawPoint`, `drawSegment`/`drawLine`/`drawRay`, `drawPolygon`, `drawArc`/`drawSector`, `drawCircle`/`drawEllipse`, `drawAngleLabel`, `drawLabel`. These normalize options (expand per-point/per-side arrays), compute styles via `getStyles()` (merges color→stroke/fill, dashed/dotted→strokeDasharray), and call underlying graphie primitives (often `addMovable*` with `fixed:true` for static drawings). They also auto-draw points when `showPoints` is true.
- **Helpers** (`graphie-helpers*.js`): global helper functions used by templates (`numberLine`, `piechart`, `rectchart`, `shadeRect`, `barChart` variants, fraction helpers, etc.). These operate on `KhanUtil.currentGraph`/current graphie instance.
- **Math/labels**: `label()` uses `KhanUtil.processMath` (from `tex.js`) which prefers KaTeX if available, else MathJax. In graphie-to-png they shim `katex = { render(tex, container){... uses mathjax-renderer ...} }` so labels render as clean SVG. Colors/constants come from `math.js` (`BLUE_D`, `RED_D`, `GREEN_D`, `PURPLE_C`, `GOLD_D`, `BLACK`, etc.).
- **Geometry/polygon/3d**: provide additional shape helpers (`graphie-geometry.js`, `graphie-polygon.js`, `graphie-3d.js`) used in more complex templates.

## 2) Runtime bundle for preview

We need an isolated execution environment that mirrors graphie-to-png's page context:

- **Load order / shims**: define `KhanUtil = { debugLog: $.noop }`, `Khan = { Util: KhanUtil, query:{debug:""}, scratchpad:{disable:$.noop}, error:$.noop }`, `Perseus = {}` before loading graphie modules (as in `plain_graph.html`).
- **Dependencies to vendor**: `jquery.js`, `underscore.js`, `raphael.js` (transitive via graphie), `require.js`. Also `kpoint.js`, `kvector.js`, `kline.js`, `kmatrix.js`, `knumber.js`, `math.js`, `angles.js`, `tex.js`, `tmpl.js`, `math-format.js`, `time.js`, `expressions.js`, `word-problems.js`, `interactive.js` + wrapped-*.js (if used), plus `graphie.js`, `graphie-drawing.js`, `graphie-geometry.js`, `graphie-polygon.js`, `graphie-helpers.js`, `graphie-helpers-arithmetic.js`, `graphie-drawing.js`, `graphie-3d.js`. Also `perseus/util.js` (for `Perseus.Util.*`).
- **MathJax SVG renderer**: include `mathjax-renderer` assets (CSS + dist JS) and `mathjax-adapter.js` to expose `katex.render`-compatible API (graphie-to-png does this). This is required for "clean/standard SVG" output per README.
- **Preview execution**: run user graphie JS inside an iframe (stronger isolation). The iframe needs the full runtime loaded. Execution model matches templates: user code defines `range`, `size`, `setup()` (or relies on template setup injected), calls drawing functions/`plot`/`style`/`label` in global scope. After code runs, we need the graphie initialized on a `.graphie` container. 
  - Option A: inject setup templates (grid/simple/polar/SAT/nonsquare) same as editor.html (wrap user code with pre/post based on `data-use-*` attributes). 
  - Option B: allow user to write full graphie including setup; also provide helpers.
- **jQuery.graphie()**: call `$(".graphie").graphie()` after executing user code to initialize graphie on the container (creates Graphie via `KhanUtil.createGraphie`, runs code again in wrapped form as Khan Exercises does, or just ensure initialization). In graphie-to-png, `$.fn.graphie()` finds `.graphie`/`script[type='text/graphie']`, empties, creates Graphie, attaches data, sets up `graphie.graph`, wraps code as `(function(){ code \n})()` and executes. We should replicate this behavior for compatibility with all template patterns.

## 3) UI (Tauri + React + Material UI + Apple design)

- **Layout**: split-pane (resizable). Left: code editor panel + template selector + drag-drop palette toggle. Right: live preview panel with "Regraph", export buttons (PNG/JPEG/SVG/PDF download/copy), size indicator.
- **Code editor**: Monaco Editor for JavaScript. Features: syntax highlighting, bracket matching, line numbers, Ctrl/Cmd+R to regraph (mirror graphie-to-png), optional basic autocomplete for graphie API (`drawLine`, `drawPoint`, `drawPolygon`, `drawCircle`, `drawArc`, `drawEllipse`, `drawRay`, `drawSegment`, `plot`, `style`, `label`, `init`, `graphInit`, `setup`, color names). Load template catalog from graphie-to-png/templates (parse each `<script type="text/graphie" ...>` to extract `data-title`, `data-use-*`, and inner JS).
- **Drag & Drop mode**: visual builder with shape tools (Point, Line/Segment/Ray, Polygon, Circle/Ellipse/Arc, Axis/Grid, Label, Plot). Canvas (SVG) for interaction; selecting/dragging creates/modifies graphie code (source of truth remains the code text). For v1, generate code mutations at insertion point (append or replace selected block); bidirectional sync: code changes update preview, UI edits update code. Avoid maintaining parallel state that drifts.
- **Template selector**: dropdown populated from all example templates (0-47 in graphie-to-png) including blank page and setup variants. Selecting loads code into editor and regraphs.
- **Preview**: render in sandboxed iframe. Debounce editor changes (150-300ms). Show errors from graphie execution in preview area (catch exceptions and display). 

## 4) Rendering, SVG extraction & export

- **Live preview**: iframe loads runtime HTML (includes require.js, shims, graphie modules, MathJax renderer, mathjax-adapter). We post user code to iframe or inject via `srcdoc` + script execution. On change, call `updateGraphie()` equivalent: clear `.graphie`, set editor code into execution context, call `$(".graphie").graphie()`. 
- **SVG extraction**: mirror `plain_graph.html`’s `window.getSVG()`:
  - find `$(".graphie > svg")[0]`
  - get `width`/`height`, set `viewBox="0 0 width height"`
  - clone to wrapper div, return `wrapper.innerHTML`
Also consider label tracking if needed later, but not required for pure export. 
- **SVG cleanup**: port `cleanup_svg.py` logic to JS. Options: use `svgo` (already in graphie-to-png deps) in the browser/Tauri via node-side or vendored; also implement clip-path deduplication and extreme coordinate clipping (`_cleanup_clip_paths`, `_clip_paths`). `svgo` is easy to run in Node (Tauri side) or via web worker; for simplicity run `svgo` on extracted SVG string (config similar to defaults). The Python also does lxml parsing + svg.path for clipping - can be reimplemented with DOMParser + a small path parser or approximate by svgo + post-processing.
- **Rasterization (PNG/JPEG)**: create `<img>` with SVG data URL (`data:image/svg+xml;charset=utf-8,...`), draw to `<canvas>` (scale as needed), then export `canvas.toDataURL('image/png'| 'image/jpeg', quality)`. Need to wait for fonts/images to load (graphie-to-png has `waitForImages` for AWS-hosted images; for local preview less critical). Also handle tainted canvas if external images appear (but we’re generating local SVG).
- **Clipboard**: 
  - SVG: `navigator.clipboard.writeText(svgString)` 
  - PNG/JPEG: convert to blob via `canvas.toBlob`, write with `ClipboardItem({ 'image/png': blob })` (or appropriate type)
- **PDF**: generate via `svg2pdf.js` + `jspdf`. Feed cleaned SVG to svg2pdf, save as PDF. Alternatively rasterize to image and embed in PDF, but SVG→PDF is better quality.

## 5) Security

- **JS safety**: port `contains_forbidden_js` (AST parse with `esprima` or `acorn` in frontend/TS, check for `CallExpression` with callee `Identifier` named `eval` or `alert`). Reject or warn before executing/exporting if found. Also consider blocking `Function` constructor, `setTimeout` with strings, `document.write`, but graphie-to-png only blocks eval/alert; templates don’t use them.
- **Iframe sandboxing**: run preview in `<iframe sandbox="allow-scripts allow-same-origin">` (need same-origin to access DOM for SVG extraction). Avoid `allow-popups`/`allow-forms`. If we want stronger isolation, we can also disallow network requests except for MathJax fonts/CDN assets we load; but graphie assets are local.
- **Content security**: in Tauri CSP, allow loading local JS/CSS and MathJax font CDN if used (mathjax-renderer may reference CDN; can also vendor fonts).

## 6) Implementation steps (concrete)

1. **Bootstrap Tauri app**: `cargo tauri init` with React + Vite + TypeScript. Add Material UI (`@mui/material`, `@emotion/react`, `@emotion/styled`), icons, react-split-pane or `react-resizable-panels`. 
2. **Vendor graphie runtime**: copy khan-exercises utils (graphie*.js, kpoint/kvector/kline/kmatrix/knumber, math.js, angles.js, tex.js, tmpl.js, math-format.js, time.js, expressions.js, word-problems.js, interactive.js + wrapped-*.js), Perseus `util.js`, jQuery/underscore/require.js, Raphael if needed. Also mathjax-renderer assets and mathjax-adapter.js, image-library.js, css. Keep AMD structure or create Vite-compatible bundles; easier to serve as-is in iframe.
3. **Build preview iframe HTML**: create `preview.html` that loads all runtime in correct order (shims → libs → require.js modules → mathjax). Expose `window.getSVG()`, `window.runGraphie(code, containerId)` helpers callable from parent via `postMessage` or direct access (same-origin). 
4. **Editor + templates**: Monaco setup. Parse graphie-to-png templates into array of {title, code, flags}. Wire selector to load code. Add keyboard shortcut (Cmd/Ctrl+R) to trigger regraph.
5. **Graphie engine bridge**: in React, maintain editor code state. Debounce updates, post to iframe to render. On export, call iframe’s `getSVG()` (or read `contentDocument.querySelector('.graphie>svg')`), run svgo cleanup, then rasterize/PDF. 
6. **Drag-drop UI**: add palette (MUI drawer/list). For each shape, insert boilerplate graphie code at cursor (Monaco API). Initial implementation: code-generation only (no live canvas dragging) — keeps complexity manageable and stays source-of-truth. Can extend to visual dragging later.
7. **Export UI**: buttons for Download/Copy as PNG/JPEG/SVG/PDF. Use `file-saver` for downloads, `html-to-image` not necessary (we rasterize from SVG ourselves). 
8. **Typst mode scaffolding**: separate editor tab + preview (Typst web or Tauri-side renderer via typst/cetz). Same export surface. Defer full implementation until graphie path works.
9. **Security**: run `contains_forbidden_js` (use `acorn` or `esprima`) on code before sending to iframe/export; show error if forbidden constructs found.

## Key compatibility notes

- **Globals expected by templates**: `range`, `size`, `setup()`, `X_RANGE/Y_RANGE`, `xScale/yScale`, color constants (`BLUE_D`, `RED_D`, `GREEN_D`, `PURPLE_C`, `GOLD_D`, `MAROON_D`, `TEAL_D`, `BLACK`, etc.), `plot`, `style`, `label`, `graphInit`, `init`. All must be defined in the execution scope (expose on `window`).
- **Perseus.Util**: templates with grid setup call `Perseus.Util.tickStepFromExtent`, `Perseus.Util.gridDimensionConfig`, `Perseus.Util.scaleFromExtent`. We must include `perseus/util.js`.
- **Raphael/RequireJS compatibility**: khan-exercises expects old-style AMD and global jQuery/_. Loading in modern Vite is fine if we serve files as-is in iframe.
- **MathJax renderer assets**: graphie-to-png references `static/js/mathjax-renderer/dist/mathjax-renderer.min.js` and CSS under `static/css/mathjax-renderer/`. We need to vendor those files (they exist in the repo tree references; if missing locally in some copies, we should vendor compatible versions). The mathjax-adapter bridges to katex-like API consumed by `tex.js`.
- **SVG viewBox**: always set from SVG width/height when extracting (graphie-to-png does this) to ensure correct scaling in rasterization.

This matches the README requirements (graphie default, MathJax SVG renderer for clean SVG, multiple export modes, drag-drop + code editor, React/Svelte + Material UI + Apple design). Starting from the graphie-to-png templates and runtime gives us high fidelity to existing graphie diagrams with minimal reverse-engineering.
