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
import { Box, Alert, Skeleton, Chip, Typography } from "@mui/material";
import { CheckCircle as CheckIcon, Error as ErrorIcon } from "@mui/icons-material";
import { useGraphieStore } from "../store";
import { checkJsSafety } from "../security";

export interface PreviewHandle {
  /** Return the cleaned SVG string of the current render, or null on error. */
  getSVG: () => string | null;
  /** Re-render the current code. */
  regraph: () => void;
}

interface PreviewPanelProps {
  code: string;
  onError: (err: string | null) => void;
}

export const PreviewPanel = forwardRef<PreviewHandle, PreviewPanelProps>(
  function PreviewPanel({ code, onError }, ref) {
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
        getSVG: () => {
          const iframe = iframeRef.current;
          if (!iframe?.contentDocument) return null;
          // Prefer the iframe's own getSVG() which now converts HTML labels
          // to proper SVG groups with transforms.
          try {
            const iframeSvg = iframe.contentWindow && (iframe.contentWindow as any).getSVG;
            if (typeof iframeSvg === "function") {
              const result = iframeSvg.call(iframe.contentWindow);
              if (result) return result;
            }
          } catch {
            // Fall back to direct DOM read below.
          }
          const svgNode = iframe.contentDocument.querySelector(".graphie > svg");
          if (!svgNode) return null;
          const width = svgNode.getAttribute("width") || "";
          const height = svgNode.getAttribute("height") || "";
          if (width && height) {
            svgNode.setAttribute("viewBox", `0 0 ${width} ${height}`);
          }
          const wrapper = iframe.contentDocument.createElement("div");
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
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.paper" }}>
        <Box
          className="panel-header-glass"
          sx={{
            px: 2,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
            minHeight: "var(--panel-header-height)",
          }}
        >
          <Chip
            size="small"
            icon={rendered ? <CheckIcon /> : <ErrorIcon />}
            label={rendered ? "Rendered" : error ? "Error" : "Rendering..."}
            color={error ? "error" : rendered ? "success" : "default"}
            variant={rendered ? "filled" : "outlined"}
          />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Preview
          </Typography>
        </Box>
        <Box sx={{ flex: 1, position: "relative" }}>
          {!ready && (
            <Skeleton
              variant="rectangular"
              animation="wave"
              width="100%"
              height="100%"
              sx={{ position: "absolute", inset: 0, borderRadius: 0 }}
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
              background: "var(--palette-background-paper)",
              opacity: ready ? 1 : 0.3,
              transition: "opacity 0.2s",
            }}
            title="Graphie preview"
          />
          {error && (
            <Alert
              severity="error"
              sx={{ position: "absolute", bottom: 0, left: 0, right: 0, borderRadius: 0, mx: 0 }}
              onClose={() => {
                setError(null);
                onError(null);
              }}
            >
              {error}
            </Alert>
          )}
        </Box>
      </Box>
    );
  }
);