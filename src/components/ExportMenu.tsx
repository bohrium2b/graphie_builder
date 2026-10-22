// Export menu: download/copy the current graphie render as PNG, JPEG, SVG, or
// PDF. Pulls the SVG string from the preview iframe via `PreviewHandle.getSVG()`.

import React from "react";
import { useCallback } from "react";
import styled from "@emotion/styled";
import {
  Download as DownloadIcon,
  Copy as CopyIcon,
  FileImage as ImageIcon,
  FileText as TextIcon,
} from "lucide-react";
import { saveAs } from "file-saver";
import { optimize } from "svgo";

type ExportFormat = "svg" | "png" | "jpeg" | "pdf";

interface ExportMenuProps {
  getSVG: () => Promise<string | null>;
  filename?: string;
}

const Root = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--color-surface-level-1);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  color: var(--color-on-surface);
  font-family: var(--font-sans);
`;

const Title = styled("div")`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: 4px;
`;

const Row = styled("button")<{ $dest: "download" | "copy" }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  background: var(--color-surface-level-2);
  color: var(--color-on-surface);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-surface-level-3);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .label {
    font-weight: 500;
  }

  .hint {
    margin-left: auto;
    font-size: 10px;
    opacity: 0.6;
    font-family: var(--font-mono);
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    margin-right: 8px;
    opacity: 0.8;
  }
`;

const Divider = styled("div")`
  height: 1px;
  background: var(--color-outline-variant);
  margin: 4px 0;
`;

const Hint = styled("div")`
  font-size: 10px;
  color: var(--color-outline);
  line-height: 1.4;
`;

const formats: { id: ExportFormat; label: string; hint: string; icon: React.ElementType }[] = [
  { id: "svg", label: "SVG (vector)", hint: "*.svg", icon: ImageIcon },
  { id: "png", label: "PNG (3× scale)", hint: "*.png", icon: DownloadIcon },
  { id: "jpeg", label: "JPEG (3× scale)", hint: "*.jpg", icon: DownloadIcon },
  { id: "pdf", label: "PDF (vector)", hint: "*.pdf", icon: TextIcon },
];

export function ExportMenu({ getSVG, filename = "graphie" }: ExportMenuProps) {
  const exportFormat = useCallback(
    async (format: ExportFormat, dest: "download" | "copy") => {
      const svg = await getSVG();
      if (!svg) return;

      const downloadBlob = (blob: Blob, name: string) => {
        saveAs(blob, name);
      };

      const copyClipboard = async (items: Record<string, Blob>) => {
        try {
          await navigator.clipboard.write([new ClipboardItem(items)]);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Clipboard write failed:", err);
          throw err;
        }
      };

      const fallbackCopy = async (pngBlob: Blob) => {
        await copyClipboard({
          "image/png": pngBlob,
          "text/plain": new Blob([svg], { type: "text/plain" }),
        });
      };

      try {
        if (format === "svg") {
          const cleaned = optimize(svg, {
            plugins: ["preset-default"],
          }).data as string;
          const blob = new Blob([cleaned], { type: "image/svg+xml" });
          if (dest === "download") {
            downloadBlob(blob, `${filename}.svg`);
          } else {
            try {
              await copyClipboard({ "image/svg+xml": blob });
            } catch {
              const png = await svgToPng(svg, 3);
              await fallbackCopy(png);
            }
          }
          return;
        }

        if (format === "png" || format === "jpeg") {
          const png = await svgToPng(svg, 3);
          if (dest === "download") {
            downloadBlob(png, `${filename}.${format === "jpeg" ? "jpg" : "png"}`);
          } else {
            await copyClipboard({
              [format === "jpeg" ? "image/jpeg" : "image/png"]: png,
            });
          }
          return;
        }

        if (format === "pdf") {
          const { default: jsPDF } = await import("jspdf");
          // svg2pdf.js is CJS (`module.exports = fn`); dynamic import may expose
          // it as `default` or as the module object itself. Resolve robustly.
          const svg2pdfMod = (await import("svg2pdf.js")) as {
            default?: unknown;
          };
          const svg2pdf =
            (svg2pdfMod.default ?? svg2pdfMod) as
              | ((svg: SVGElement, pdf: any) => void)
              | undefined;
          if (typeof svg2pdf !== "function") {
            throw new Error("svg2pdf.js export is not a function");
          }
          const parser = new DOMParser();
          const doc = parser.parseFromString(svg, "image/svg+xml");
          const svgEl = doc.documentElement as unknown as SVGElement;
          const width = +(svgEl.getAttribute("width") || "400");
          const height = +(svgEl.getAttribute("height") || "300");
          const pdf = new jsPDF({ unit: "pt", format: [width, height] });
          svg2pdf(svgEl, pdf);
          const blob = pdf.output("blob");
          if (dest === "download") {
            downloadBlob(blob, `${filename}.pdf`);
          } else {
            try {
              await copyClipboard({ "application/pdf": blob });
            } catch {
              const png = await svgToPng(svg, 3);
              await fallbackCopy(png);
            }
          }
          return;
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Export failed:", err);
      }
    },
    [getSVG, filename],
  );

  return (
    <Root>
      <Title>Export</Title>
      {formats.map((f) => (
        <>
          <Row
            key={`${f.id}-download`}
            $dest="download"
            onClick={() => exportFormat(f.id, "download")}
            aria-label={`Download ${f.label}`}
          >
            {React.createElement(f.icon as any)}
            <span className="label">{f.label}</span>
            <span className="hint">Download {f.hint}</span>
          </Row>
          <Row
            key={`${f.id}-copy`}
            $dest="copy"
            onClick={() => exportFormat(f.id, "copy")}
            aria-label={`Copy ${f.label} to clipboard`}
          >
            {React.createElement(CopyIcon)}
            <span className="label">Copy {f.label}</span>
            <span className="hint">Clipboard</span>
          </Row>
          {f.id !== "jpeg" && <Divider key={`${f.id}-divider`} />}
        </>
      ))}
      <Hint>
        PNG/JPEG render at 3× scale. PDF size matches the SVG canvas. Copy to
        clipboard requires a secure context (localhost/HTTPS).
      </Hint>
    </Root>
  );
}

function svgToPng(svg: string, scale: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
        "image/png",
      );
    };
    img.onerror = () => reject(new Error("Failed to load SVG image"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

export default ExportMenu;
