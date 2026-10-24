# Graphie Builder — Implementation Plan

**Status:** Phases 0–7 complete & committed (`2a329cd`); Phase 8 (dual native shell: Electron + Tauri) ready to implement
**Plan file:** `.kilo/plans/1792622972594-graphie-builder-implementation-plan.md`
**Repo:** `/Users/dalton/graphie_builder`
**Timestamp prefix:** `1792622972594`

---

## Context / current state

- **Phases 0–7 complete & verified:** `yarn lint` (0 errors), `yarn typecheck` (clean), `yarn test` (24 pass), `yarn build` (succeeds), dev server on `localhost:1420`.
- **Frontend:** React 19 + Vite 7 + TS strict, builds to `dist/`, `index.html` loads `/src/main.tsx`, `#root`. `vite.config.ts`: port 1420 strict, `@tauri-apps/api` excluded from optimizeDeps.
- **`src/`:** `main.tsx`, `App.tsx`, `store.ts` (Zustand: code/title/isReady/lastError/filename/isDirty/history/undo/redo), `security.ts`, `theme/`, `graphie-completions.ts`, components (Shell, EditorPanel CodeMirror 6, PreviewPanel iframe bridge, TemplatesPanel, ExportMenu, MenuBar), `templates.ts` (51).
- **Tauri v2 shell (exists):** `src-tauri/` — `Cargo.toml` (tauri 2.8, plugins clipboard-image-png/dialog/fs), `build.rs`, `src/main.rs`, `src/lib.rs` (bare `Builder::default().run()`, no commands), `tauri.conf.json` (`frontendDist: ../dist`, `devUrl: null`, `withDevServer: false`, CSP, single window 1400x900). `@tauri-apps/api` is currently a devDependency.
- **No Electron setup exists anywhere.**
- **Phase 7 (committed):** MenuBar (File/Edit/View/Help), filename/dirty + undo/redo, CM6 graphie autocomplete, strict editor/preview scrolling, preview `getSVG` via `graphie:getSVG` postMessage with fallbacks, export clipboard fallback (image/png + text/plain), svg2pdf.js `(default ?? module)` fix.

---

## Decisions

### Resolved (all confirmed)

| Decision | Approach |
|---|---|
| Dual-shell architecture | Single shared React+Vite frontend (builds to `dist/`) loaded identically by Tauri and Electron; runtime-detected native adapter. One `yarn dev` serves both shells. |
| Native adapter | `src/native/` — `types.ts` (interface), `factory.ts` (runtime detection), `browser.ts`, `tauri.ts`, `electron.ts`. Frontend imports `createNativeAPI()` and calls `saveFile/openFile/copyText/pasteText/quit`. |
| Native API contract | `saveFile(content, suggestedName)`, `openFile()`, `copyText(text)`, `pasteText()`, `quit()`, plus `shell: 'tauri'|'electron'|'browser'`. Browser fallback: file-saver download / window.prompt / navigator.clipboard / window.close. |
| Runtime detection | `window.__TAURI__` → Tauri; `window.electronAPI` → Electron; else browser. |
| Dev workflow | `yarn dev` = Vite on localhost:1420. `tauri.conf.json`: `withDevServer: true`, `devUrl: http://localhost:1420` so `cargo tauri dev` proxies to Vite. Electron loads `localhost:1420` in dev, `dist/index.html` (file://) in prod. |
| Tauri `@tauri-apps/api` | Move from devDependencies to dependencies (needed at runtime in Tauri shell). |
| Tauri commands | Register in `src-tauri/src/lib.rs`: `save_file`, `open_file`, `copy_text`, `paste_text`, `quit_app`; enable clipboard/dialog/fs plugins. |
| Electron packaging | `electron` (runtime) + `electron-builder` (packaging, code signing, auto-updater, mac/win/linux). |
| Electron security | `contextIsolation: true`, `nodeIntegration: false`; preload exposes `electronAPI` via `contextBridge` with allowlisted IPC channels; main-process handlers validate channel names. |
| MenuBar / ExportMenu | Route Save/Save As/Open through `native.saveFile`/`native.openFile`; ExportMenu copy through `native.copyText`; keep file-saver/navigator.clipboard as browser fallback. |

---

## Scope (v1)

**In scope:**
- Graphie JS code editor with live iframe preview (debounced re-render)
- Template gallery (47 templates) + load template
- Export: download/copy PNG, JPEG, SVG, PDF (+ clipboard fallback)
- JS safety check before render/export
- Light/dark theme, keyboard shortcuts (Cmd/Ctrl+R regraph)
- Document title + error inline display
- Top panel menus (File/Edit/View/Help), file naming/saving (.graphie)
- Graphie autocompletion for all functions + arguments
- Strict editor/preview sizing + scroll for overflow
- **New:** Dual native shell (Tauri v2 + Electron) with shared frontend + native adapter for save/open/copy/paste/quit
- Tests (vitest), lint, typecheck, `yarn dev` / `yarn build`

**Out of scope v1:** Typst/CeTZ, visual drag-drop canvas, image library, 3D, Svelte, user accounts/projects, cloud, multi-page PDF, LaTeX→JS function compiler, auto-updater configuration beyond electron-builder defaults.

---

## Phases & tasks

### Phase 0–7
Complete & committed (`2a329cd`). No further work needed unless a regression appears.

### Phase 8 — Dual native shell (Electron + Tauri)

**8.1 Native API abstraction (`src/native/`)**
1. Create `src/native/types.ts`: `NativeAPI` interface (`saveFile`, `openFile`, `copyText`, `pasteText`, `quit`, `shell`).
2. Create `src/native/factory.ts`: `createNativeAPI()` — runtime detection (`window.__TAURI__` / `window.electronAPI` / browser), returns the matching adapter.
3. Create `src/native/browser.ts`: file-saver download for `saveFile`, `window.prompt` for `openFile`, `navigator.clipboard` for `copyText`/`pasteText`, `window.close` for `quit`.
4. Wire `createNativeAPI()` into `MenuBar.tsx` (Save/Save As/Open) and `ExportMenu.tsx` (copy) — use native when available, browser fallback otherwise.

**8.2 Tauri shell enhancements**
1. `package.json`: move `@tauri-apps/api` from devDependencies to dependencies.
2. `src-tauri/tauri.conf.json`: `withDevServer: true`, `devUrl: "http://localhost:1420"`.
3. `src-tauri/src/lib.rs`: register Tauri commands (`save_file`, `open_file`, `copy_text`, `paste_text`, `quit_app`); enable clipboard/dialog/fs plugins; `invoke_handler`.
4. Create `src/native/tauri.ts`: implement `NativeAPI` via `@tauri-apps/api` (`invoke` for commands; `dialog.save`/`dialog.open`/`fs.writeTextFile`/`fs.readTextFile`/`clipboard.writeText`/`clipboard.readText`/`app.exit`).

**8.3 Electron shell (new)**
1. `yarn add electron electron-builder` (+ devDeps `concurrently`, `wait-on` for `electron:dev`).
2. Create `electron/main.ts`: `app`/`BrowserWindow` (`contextIsolation: true`, `nodeIntegration: false`), loads `localhost:1420` in dev / `dist/index.html` (file://) in prod; `ipcMain` handlers with allowlisted channel names.
3. Create `electron/preload.ts`: `contextBridge.exposeInMainWorld('electronAPI', {...})` exposing `saveFile`/`openFile`/`copyText`/`pasteText`/`quit` via `ipcRenderer.invoke`.
4. Create `src/native/electron.ts`: implement `NativeAPI` via `window.electronAPI`.
5. Add `electron-builder` config (package.json `build` or `electron-builder.json`): productName, appId, mac/win/linux targets, icon.

**8.4 Scripts (`package.json`)**
1. Add `tauri:dev` = `cargo tauri dev`, `electron:dev` = `concurrently "yarn dev" "wait-on http://localhost:1420 && electron ."`, `tauri:build` = `cargo tauri build`, `electron:build` = `electron-builder`. Keep `dev` = `vite`, `build` = `tsc -b && vite build`.

**8.5 Tests + verification**
1. Add `src/native/factory.test.ts`: mock `window.__TAURI__`/`window.electronAPI`, assert correct adapter selected and browser fallback.
2. `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build` all green.
3. Manual: `yarn tauri:dev` loads app via Vite proxy; `yarn electron:dev` loads app via Vite; Save/Save As/Open use native dialog in each shell; file-saver fallback in plain browser.

---

## Risks

- **Tauri devUrl/CSP:** `withDevServer: true` + `devUrl` must align with Vite port 1420; CSP `connect-src` must allow `localhost:1420` in dev.
- **Electron `file://` prod loading:** `preview.html` iframe and runtime assets load relative to `dist/`; ensure all asset paths are root-relative (`/runtime/...`) so they resolve under `file://`.
- **Electron IPC security:** only allowlisted channel names in `ipcMain` handlers; validate payloads; `contextIsolation` + `nodeIntegration: false` to prevent remote code execution via preload.
- **`@tauri-apps/api` runtime availability:** must be in `dependencies` (not just devDependencies) for the Tauri-built app to import it.
- **Clipboard MIME in Electron:** native `clipboard.write` handles formats differently than browser `ClipboardItem`; test SVG/PDF copy in Electron shell.
- **Window close in browser:** `window.close()` only works for windows opened by script; browser fallback `quit` is best-effort.

---

## Validation plan (definition of done)

- `yarn lint` (eslint src) — clean
- `yarn typecheck` (tsc --noEmit) — clean
- `yarn test` (vitest run) — all pass, including native factory test
- `yarn build` — produces `dist/`
- `yarn tauri:dev` — app loads via Vite proxy on localhost:1420
- `yarn electron:dev` — app loads via Vite on localhost:1420 in Electron
- Manual: Save/Save As/Open use native file dialog in Tauri and Electron shells; copy uses native clipboard; browser fallback works in plain `yarn dev`/preview

---

## Notes for the implementer

- This agent cannot modify files or commit. After `plan_exit`, switch to an implementation-capable agent to execute Phase 8.
- Do not edit `public/runtime/` or `graphie-to-png/`; treat as read-only references.
- Follow existing conventions: zustand stores, forwardRef imperative handles, postMessage bridge, inline errors (not alerts), M3 design tokens from DESIGN.md.
- Commit: the implementer/user should stage and commit after Phase 8 passes validation.
