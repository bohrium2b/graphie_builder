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
          // Route through the postMessage bridge (graphie:getSVG -> graphie:svg)
          // so preview.html remains the single render/getSVG authority.
          const bridgeSvg = await new Promise<string | null>((resolve) => {
            const handler = (ev: MessageEvent) => {
              if (ev.source !== iframe.contentWindow) return;
              if (ev.data?.type === "graphie:svg") {
                window.removeEventListener("message", handler);
                resolve(ev.data.svg ?? null);
              }
            };
            window.addEventListener("message", handler);
            // Timeout guard so getSVG never hangs if the iframe doesn't reply.
            setTimeout(() => {
              window.removeEventListener("message", handler);
              resolve(null);
            }, 2000);
            win.postMessage({ type: "graphie:getSVG" }, frameTargetOrigin());
          });
          if (bridgeSvg) return bridgeSvg;
          // Fallback 1: iframe's own getSVG() (converts HTML labels to SVG).
          try {
            const iframeSvg = (win as any).getSVG;
            if (typeof iframeSvg === "function") {
              const result = iframeSvg.call(win);
              if (result) return result;
            }
          } catch {
            // Fall through to DOM read below.
          }
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
          return wrapper.innerHTML;
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
