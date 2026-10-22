// Preview panel: sandboxed iframe running the vendored Graphie runtime.
//
// The iframe owns all rendering. The parent posts code and asks for the
// rendered SVG via `getSVG()`. Errors are surfaced through `onError`.
//
// iframe sandbox: `allow-scripts` is required for the runtime; `allow-same-origin`
// is required so the parent can read the iframe DOM to extract SVG. Network is
// restricted to local assets (MathJax is vendored, not remote).

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useGraphieStore } from "../store";
import { checkJsSafety } from "../security";

export interface PreviewHandle {
  /** Return the cleaned SVG string of the current render, or null on error. */
  getSVG: () => Promise<string | null>;
  /** Re-render the current code. */
  regraph: () => void;
}

interface PreviewPanelProps {
  code: string;
  onError: (err: string | null) => void;
}

export const PreviewPanel = forwardRef<PreviewHandle, PreviewPanelProps>(
  ({ code, onError }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [ready, setReady] = useState(false);
    const [rendered, setRendered] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const codeRef = useRef(code);
    const isReady = useGraphieStore((s) => s.isReady);

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
          window.location.origin as string
        );
      } else {
        const msg = safety.message || "Security error";
        onError(msg);
        setError(msg);
      }
    }, [code, onError]);

    // Listen for messages from the iframe.
    useEffect(() => {
      const onMessage = (ev: MessageEvent) => {
        if (ev.origin !== window.location.origin) return;
        const data = ev.data;
        if (!data || typeof data.type !== "string") return;
        switch (data.type) {
          case "graphie:ready":
            setReady(true);
            useGraphieStore.getState().setIsReady(true);
            // Render any pending code.
            if (codeRef.current) {
              const source = ev.source as Window | null;
              source?.postMessage(
                { type: "graphie:run", code: codeRef.current },
                ev.origin
              );
            }
            break;
          case "graphie:rendered":
            setRendered(true);
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
              if (ev.origin !== window.location.origin) return;
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
            win.postMessage({ type: "graphie:getSVG" }, window.location.origin);
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
            window.location.origin as string
          );
        },
      }),
      []
    );

    return (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "var(--color-surface-level-2)",
            borderBottom: "1px solid var(--color-outline-variant)",
            color: "var(--color-on-surface)",
            fontSize: "11px",
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "9999px",
              background:
                rendered
                  ? "var(--color-success, var(--color-primary))"
                  : error
                  ? "var(--color-error)"
                  : "var(--color-outline)",
              animation:
                !ready && !rendered
                  ? "pulse 1.5s ease-in-out infinite"
                  : undefined,
            }}
          />
          <span>{rendered ? "Rendered" : error ? "Error" : "Rendering…"}</span>
          {!isReady && !rendered && (
            <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 8 }}>loading runtime</span>
          )}
        </div>
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {!ready && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--color-surface-level-2)",
                opacity: 0.5,
              }}
            />
          )}
          <iframe
            ref={iframeRef}
            src="/preview.html?v=2"
            sandbox="allow-scripts allow-same-origin"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: "none",
              background: "var(--color-canvas-paper-bg)",
              opacity: ready ? 1 : 0.3,
              transition: "opacity 0.2s",
            }}
            title="Graphie preview"
          />
          {error && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: 8,
                background: "var(--color-error-container)",
                color: "var(--color-on-error-container)",
                fontSize: 12,
                borderTop: "1px solid var(--color-outline-variant)",
              }}
            >
              {error}
              <button
                style={{
                  marginLeft: 12,
                  background: "transparent",
                  border: "none",
                  color: "var(--color-on-error-container)",
                  cursor: "pointer",
                  fontSize: 11,
                  textDecoration: "underline",
                }}
                onClick={() => {
                  setError(null);
                  onError(null);
                  iframeRef.current?.contentWindow?.location.reload();
                }}
              >
                Reload preview
              </button>
            </div>
          )}
        </div>
      </>
    );
  }
);
