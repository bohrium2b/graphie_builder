// Export helpers: turn the rendered SVG into a downloadable file or a
// clipboard payload. Shared by the inspector panel and the Tools menu.

import { saveAs } from "file-saver";
import { optimize } from "svgo";
import { createNativeAPI } from "./native/factory";

export type ExportFormat = "svg" | "png" | "jpeg" | "pdf";

export interface ExportOptions {
  /** SVG markup of the current render. */
  svg: string;
  format: ExportFormat;
  /** "download" saves a file, "copy" puts it on the clipboard. */
  dest: "download" | "copy";
  filename?: string;
}

export async function exportArtifact({
  svg,
  format,
  dest,
  filename = "graphie",
}: ExportOptions): Promise<void> {
  if (!svg) return;

  const downloadBlob = (blob: Blob, name: string) => {
    saveAs(blob, name);
  };

  const native = createNativeAPI();

const showToast = (message: string) => {
  try {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText =
      "position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 16px;border-radius:8px;background:#2e7d32;color:#fff;font:500 13px system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.2);";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  } catch {
    // ignore
  }
};

  const copyClipboard = async (items: Record<string, Blob>) => {
    // 1) Native MIME ClipboardItem (browser secure context).
    try {
      await navigator.clipboard.write([new ClipboardItem(items)]);
      showToast("Copied to clipboard");
      return;
    } catch {
      // fall through to layered fallbacks
    }
    // 2) PNG (3x) + raw SVG source text together in one ClipboardItem.
    try {
      const png = await svgToPng(svg, 3);
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": png,
          "text/plain": new Blob([svg], { type: "text/plain" }),
        }),
      ]);
      showToast("Copied to clipboard");
      return;
    } catch {
      // fall through to native adapter plain-text copy
    }
    // 3) Native shell clipboard (Tauri/Electron) plain-text fallback.
    await native.copyText(svg);
    showToast("Copied to clipboard");
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
          await copyClipboard({
            "image/svg+xml": blob,
            "text/plain": new Blob([cleaned], { type: "text/plain" }),
          });
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
    svg2pdf?: unknown;
  };
  const svg2pdf =
    ((svg2pdfMod as any).svg2pdf ??
      svg2pdfMod.default ??
      (svg2pdfMod as any)) as
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
    console.error("Export failed:", err);
  }
}

export function svgToPng(svg: string, scale: number): Promise<Blob> {
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
