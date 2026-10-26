// Preview panel: sandboxed iframe running the vendored Graphie runtime.
//
// The iframe owns all rendering. The parent posts code and asks for the
// rendered SVG via `getSVG()`. Errors are surfaced through `onError`.
//
// iframe sandbox: `allow-scripts` is required for the runtime; `allow-same-origin`
// is required so the parent can read the iframe DOM to extract SVG. Network is
// restricted to local assets (MathJax is vendored, not remote).
//
// The URL is relative so the same build works when the app is served from a
// sub-path or from a `file://`/`tauri://` origin (packaged Electron/Tauri).

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import styled from "@emotion/styled";
import { useGraphieStore } from "../store";
import { checkJsSafety } from "../security";
import { htmlLabelToSvg } from "../utils/takumiLabel";

export interface PreviewLayout {
  range: [[number, number], [number, number]];
  scale: [number, number];
  width: number;
  height: number;
}

export interface PreviewHandle {
  /** Return the cleaned SVG string of the current render, or null on error. */
  getSVG: () => Promise<string | null>;
  /** Re-render the current code. */
  regraph: () => void;
  /** Latest layout reported by the iframe (range/scale/canvas size). */
  layout: PreviewLayout | null;
  /** Subscribe to layout updates. Returns an unsubscribe fn. */
  onLayout: (cb: (layout: PreviewLayout | null) => void) => () => void;
}

interface PreviewPanelProps {
  code: string;
  onError: (err: string | null) => void;
  /** Zoom percent (e.g. 100, 150). Applied as a CSS transform scale. */
  zoom?: number;
}

const PREVIEW_URL = "preview.html?v=3";

async function replaceTakumiLabels(svgString: string): Promise<string> {
  const debug = (window as any).__takumiDebug;
  if (debug) console.log("[replaceTakumiLabels] start, svg length:", svgString.length);
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const placeholders = doc.querySelectorAll<SVGElement>(".takumi-label");
  if (debug) console.log("[replaceTakumiLabels] found placeholders:", placeholders.length);
  if (placeholders.length === 0) return svgString;

  const totalT0 = performance.now();

  for (const placeholder of placeholders) {
    const html = placeholder.getAttribute("data-html") || "";
    const x = parseFloat(placeholder.getAttribute("data-x") || "0");
    const y = parseFloat(placeholder.getAttribute("data-y") || "0");
    const width = parseFloat(placeholder.getAttribute("data-width") || "0");
    const height = parseFloat(placeholder.getAttribute("data-height") || "0");
    const fontSize = parseFloat(placeholder.getAttribute("data-font-size") || "14");
    const fontFamily = placeholder.getAttribute("data-font-family") || "Inter, sans-serif";
    const fontWeight = placeholder.getAttribute("data-font-weight") || "";
    const fill = placeholder.getAttribute("data-fill") || "#000000";
    const transform = placeholder.getAttribute("data-transform") || undefined;

    if (debug) {
      console.log("[replaceTakumiLabels] converting label", {
        html,
        x, y, width, height, fontSize, fontFamily, fontWeight, fill, transform
      });
    }

    const t0 = performance.now();
    try {
      const groupSvg = await htmlLabelToSvg({
        html,
        x,
        y,
        width,
        height,
        fontSize,
        fontFamily,
        fontWeight,
        fill,
        transform,
      });
      const t1 = performance.now();
      if (debug) console.log("[replaceTakumiLabels] takumi done in", (t1 - t0).toFixed(0), "ms, svg length:", groupSvg.length);

      // Parse the group SVG and replace the placeholder with its children
      const groupDoc = new DOMParser().parseFromString(groupSvg, "image/svg+xml");
      const group = groupDoc.querySelector("g");
      if (group) {
        // Keep the <g> element (with its transform) so the label is placed at (x,y)
        const parent = placeholder.parentElement;
        if (parent) {
          parent.appendChild(group);
        }
      }
      placeholder.remove();
    } catch (e) {
      const t1 = performance.now();
      console.error("[replaceTakumiLabels] takumi failed in", (t1 - t0).toFixed(0), "ms:", e);
      if (debug) console.error("[replaceTakumiLabels] takumi failed in", (t1 - t0).toFixed(0), "ms:", e);
      // If takumi fails, leave the placeholder as-is (or remove it)
      placeholder.remove();
    }
  }

  const totalT1 = performance.now();
  if (debug) console.log("[replaceTakumiLabels] total done in", (totalT1 - totalT0).toFixed(0), "ms");
  return new XMLSerializer().serializeToString(doc.documentElement);
}

const Root = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--color-editor-bg);
`;

const PreviewHeader = styled("div")`
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--layout-panel-header-height);
  padding: 0 12px;
  background: var(--color-surface-level-2);
  border-bottom: 1px solid var(--color-outline-variant);
  color: var(--color-on-surface);
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
`;

// The canvas viewport scrolls when the diagram is zoomed past 100%.
const CanvasViewport = styled("div")`
  flex: 1;
  position: relative;
  display: flex;
  overflow: auto;
  min-height: 0;
  background: var(--color-canvas-workspace-bg);
`;

const StatusDot = styled("div")<{ $state: "ok" | "error" | "pending" }>`
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  flex-shrink: 0;
  background: ${(p) =>
    p.$state === "ok"
      ? "var(--color-success, var(--color-primary))"
      : p.$state === "error"
      ? "var(--color-error)"
      : "var(--color-outline)"};
`;

const EmptyState = styled("div")`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  pointer-events: none;
  color: var(--color-on-surface-variant);
  font-size: 12px;
  text-align: center;
  padding: 24px;
`;

const ErrorBanner = styled("div")`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background: var(--color-error-container);
  color: var(--color-on-error-container);
  font-size: 12px;
  border-top: 1px solid var(--color-outline-variant);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2;

  button {
    margin-left: auto;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 11px;
    text-decoration: underline;
  }
`;

/**
 * Origin to use as the postMessage target for the preview iframe.
 *
 * `location.origin` is the string "null" for opaque origins (file:// and
 * some custom schemes such as Tauri's on WebKit). Passing "null" as the
 * target origin silently drops every message, so fall back to "*" there.
 */
function frameTargetOrigin(): string {
  const origin = window.location.origin;
  if (!origin || origin === "null") return "*";
  return origin;
}

export const PreviewPanel = forwardRef<PreviewHandle, PreviewPanelProps>(
  ({ code, onError, zoom = 100 }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [ready, setReady] = useState(false);
    const [rendered, setRendered] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const codeRef = useRef(code);
    const isReady = useGraphieStore((s) => s.isReady);
    const layoutRef = useRef<PreviewLayout | null>(null);
    const layoutCallbacks = useRef<Set<(l: PreviewLayout | null) => void>>(new Set());

    function setLayout(l: PreviewLayout | null) {
      layoutRef.current = l;
      for (const cb of layoutCallbacks.current) cb(l);
    }

    // Keep codeRef in sync so the iframe's pending render uses the latest.
    useEffect(() => {
      codeRef.current = code;
    }, [code]);

    // Post code to the iframe whenever it changes. The iframe's runGraphie
    // is idempotent: it clears the canvas first.
    useEffect(() => {
      if (!iframeRef.current?.contentWindow) return;
      const safety = checkJsSafety(code);
      if (safety.ok) {
        onError(null);
        setError(null);
        iframeRef.current.contentWindow.postMessage(
          { type: "graphie:run", code },
          frameTargetOrigin()
        );
      } else {
        const msg = safety.message || "Security error";
        onError(msg);
        setError(msg);
      }
    }, [code, onError]);

    // Listen for messages from the iframe. The source window is matched
    // instead of the origin so opaque origins (file://, tauri://) still work.
    useEffect(() => {
      const onMessage = (ev: MessageEvent) => {
        const frame = iframeRef.current;
        if (!frame) return;
        if (ev.source !== frame.contentWindow) return;
        const data = ev.data;
        if (!data || typeof data.type !== "string") return;
        switch (data.type) {
          case "graphie:ready":
            setReady(true);
            useGraphieStore.getState().setIsReady(true);
            // Render any pending code.
            if (codeRef.current) {
              frame.contentWindow?.postMessage(
                { type: "graphie:run", code: codeRef.current },
                frameTargetOrigin()
              );
            }
            break;
          case "graphie:rendered":
            setRendered(true);
            break;
          case "graphie:layout":
            setLayout({
              range: data.range,
              scale: data.scale,
              width: data.width,
              height: data.height,
            });
            break;
          case "graphie:error":
            setRendered(false);
            setError(data.message || "Render error");
            onError(data.message || "Render error");
            break;
          default:
            break;
        }
      };
      window.addEventListener("message", onMessage);
      return () => window.removeEventListener("message", onMessage);
    }, [onError]);

    // Expose imperative methods to the parent.
    useImperativeHandle(
      ref,
      () => ({
        getSVG: async () => {
          const iframe = iframeRef.current;
          if (!iframe?.contentWindow) return null;
          const win = iframe.contentWindow;

          // Get the raw SVG from the iframe (bridge first, then fallbacks).
          // eslint-disable-next-line no-useless-assignment
          let rawSvg: string | null = null;

          // Bridge: graphie:getSVG -> graphie:svg
          rawSvg = await new Promise<string | null>((resolve) => {
            const handler = (ev: MessageEvent) => {
              if (ev.source !== iframe.contentWindow) return;
              if (ev.data?.type === "graphie:svg") {
                window.removeEventListener("message", handler);
                resolve(ev.data.svg ?? null);
              }
            };
            window.addEventListener("message", handler);
            setTimeout(() => {
              window.removeEventListener("message", handler);
              resolve(null);
            }, 2000);
            win.postMessage({ type: "graphie:getSVG" }, frameTargetOrigin());
          });

          if (!rawSvg) {
            // Fallback 1: iframe's own getSVG()
            try {
              const iframeSvg = (win as any).getSVG;
              if (typeof iframeSvg === "function") {
                const result = iframeSvg.call(win);
                if (result) rawSvg = result;
              }
            } catch {
              // Fall through to DOM read below.
            }
          }

          if (!rawSvg) {
            // Fallback 2: direct DOM read of .graphie > svg.
            const doc = iframe.contentDocument;
            if (!doc) return null;
            const svgNode = doc.querySelector(".graphie > svg");
            if (!svgNode) return null;
            const width = svgNode.getAttribute("width") || "";
            const height = svgNode.getAttribute("height") || "";
            if (width && height) {
              svgNode.setAttribute("viewBox", `0 0 ${width} ${height}`);
            }
            const wrapper = doc.createElement("div");
            wrapper.appendChild(svgNode.cloneNode(true));
            rawSvg = wrapper.innerHTML;
          }

          if (!rawSvg) return null;

          // Post-process: replace .takumi-label placeholders with takumi-generated SVG paths.
          return await replaceTakumiLabels(rawSvg);
        },
        regraph: () => {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "graphie:run", code: codeRef.current },
            frameTargetOrigin()
          );
        },
        layout: layoutRef.current,
        onLayout: (cb) => {
          layoutCallbacks.current.add(cb);
          return () => { layoutCallbacks.current.delete(cb); };
        },
      }),
      []
    );

    // Send zoom to preview.html so it transforms the diagram in place.
    useEffect(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "graphie:zoom", zoom },
        frameTargetOrigin()
      );
    }, [zoom, ready]);

    const hasCode = code.trim().length > 0;

    return (
      <Root>
        <PreviewHeader>
          <StatusDot
            $state={rendered ? "ok" : error ? "error" : "pending"}
            aria-hidden
          />
          <span>{rendered ? "Rendered" : error ? "Error" : "Rendering…"}</span>
          {!isReady && !rendered && (
            <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 8 }}>
              loading runtime
            </span>
          )}
        </PreviewHeader>
        <CanvasViewport>
          <iframe
            ref={iframeRef}
            src={PREVIEW_URL}
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => {
              const win = iframeRef.current?.contentWindow;
              if (win && codeRef.current) {
                win.postMessage(
                  { type: "graphie:run", code: codeRef.current },
                  frameTargetOrigin()
                );
              }
              win?.postMessage({ type: "graphie:zoom", zoom }, frameTargetOrigin());
            }}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              background: "var(--color-canvas-paper-bg)",
              opacity: ready ? 1 : 0.3,
              transition: "opacity 0.2s",
            }}
            title="Graphie preview"
          />
          {!ready && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--color-surface-level-2)",
                opacity: 0.5,
                pointerEvents: "none",
              }}
            />
          )}
          {ready && !hasCode && (
            <EmptyState>
              <strong>No diagram yet</strong>
              <span>
                Write Graphie code on the left, or pick a template from the
                sidebar.
              </span>
            </EmptyState>
          )}
          {error && (
            <ErrorBanner>
              <span>{error}</span>
              <button
                onClick={() => {
                  setError(null);
                  onError(null);
                  iframeRef.current?.contentWindow?.location.reload();
                }}
              >
                Reload preview
              </button>
            </ErrorBanner>
          )}
        </CanvasViewport>
      </Root>
    );
  }
);
