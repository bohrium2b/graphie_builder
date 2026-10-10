// Export menu: download or copy the rendered diagram as
// PNG / JPEG / SVG / PDF.
//
// The preview iframe is the source of truth for the SVG. We read
// it, optionally clean it with SVGO, then rasterize to PNG/JPEG
// via canvas, or convert to PDF via svg2pdf + jsPDF.

import { useCallback, useState } from "react";
import type { RefObject } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as SvgFileIcon,
} from "@mui/icons-material";
import { optimize } from "svgo";
import { saveAs } from "file-saver";
import { useGraphieStore } from "../store";

export interface ExportMenuProps {
  previewRef: RefObject<{ getSVG: () => string | null } | null>;
  exporting: boolean;
  onError: (err: string | null) => void;
}

// Rasterize an SVG string to a canvas at the given scale.
async function svgToCanvas(
  svg: string,
  scale: number
): Promise<HTMLCanvasElement> {
  const img = new Image();
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(new Error("Failed to rasterize SVG"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function svgToPngDataUrl(svg: string, scale: number): Promise<string> {
  return svgToCanvas(svg, scale).then((c) => c.toDataURL("image/png"));
}

function svgToJpegDataUrl(svg: string, scale: number, quality: number): Promise<string> {
  return svgToCanvas(svg, scale).then((c) => c.toDataURL("image/jpeg", quality));
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = (meta.match(/:(.*?);/) || [])[1] || "application/octet-stream";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// Clean an SVG string with SVGO (mirrors graphie-to-png's cleanup_svg).
function cleanSvg(svg: string): string {
  try {
    const result = optimize(svg, {
      multipass: true,
      plugins: [
        "preset-default",
        "removeDimensions",
        {
          name: "removeAttrs",
          params: {
            attrs: ["(stroke|fill)-opacity", "font-family"],
          },
        },
      ],
    });
    return result.data;
  } catch {
    return svg;
  }
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "diagram"
  );
}

export function ExportMenu({ previewRef, exporting, onError }: ExportMenuProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [busy, setBusy] = useState(false);
  const title = useGraphieStore((s) => s.title);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const getSvg = useCallback((): string | null => {
    if (!previewRef.current) return null;
    return previewRef.current.getSVG();
  }, [previewRef]);

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      if (busy || exporting) return;
      setBusy(true);
      onError(null);
      try {
        await fn();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        onError(msg);
      } finally {
        setBusy(false);
        handleClose();
      }
    },
    [busy, exporting, onError]
  );

  const baseName = slugify(title);

  const exportSvg = () =>
    run(async () => {
      const svg = getSvg();
      if (!svg) throw new Error("No rendered diagram to export.");
      const cleaned = cleanSvg(svg);
      const blob = new Blob([cleaned], { type: "image/svg+xml;charset=utf-8" });
      saveAs(blob, `${baseName}.svg`);
    });

  const exportPng = () =>
    run(async () => {
      const svg = getSvg();
      if (!svg) throw new Error("No rendered diagram to export.");
      const cleaned = cleanSvg(svg);
      const dataUrl = await svgToPngDataUrl(cleaned, 3);
      const blob = dataUrlToBlob(dataUrl);
      saveAs(blob, `${baseName}.png`);
    });

  const exportJpeg = () =>
    run(async () => {
      const svg = getSvg();
      if (!svg) throw new Error("No rendered diagram to export.");
      const cleaned = cleanSvg(svg);
      const dataUrl = await svgToJpegDataUrl(cleaned, 3, 0.92);
      const blob = dataUrlToBlob(dataUrl);
      saveAs(blob, `${baseName}.jpg`);
    });

  const exportPdf = () =>
    run(async () => {
      const svg = getSvg();
      if (!svg) throw new Error("No rendered diagram to export.");
      const cleaned = cleanSvg(svg);
      // Lazy-load jsPDF + svg2pdf to keep the initial bundle small.
      const [{ jsPDF }, { svg2pdf }] = await Promise.all([
        import("jspdf"),
        import("svg2pdf.js"),
      ]);
      const img = new Image();
      const svgBlob = new Blob([cleaned], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load SVG for PDF"));
        img.src = url;
      });
      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "px",
        format: [img.width, img.height],
      });
      const holder = document.createElement("div");
      holder.innerHTML = cleaned;
      const svgEl = holder.querySelector("svg");
      if (!svgEl) throw new Error("No SVG element for PDF conversion");
      await svg2pdf(svgEl, pdf, { x: 0, y: 0, width: img.width, height: img.height });
      pdf.save(`${baseName}.pdf`);
      URL.revokeObjectURL(url);
    });

  const copyPng = () =>
    run(async () => {
      const svg = getSvg();
      if (!svg) throw new Error("No rendered diagram to copy.");
      const cleaned = cleanSvg(svg);
      const dataUrl = await svgToPngDataUrl(cleaned, 3);
      const blob = dataUrlToBlob(dataUrl);
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
    });

  const copySvg = () =>
    run(async () => {
      const svg = getSvg();
      if (!svg) throw new Error("No rendered diagram to copy.");
      await navigator.clipboard.writeText(cleanSvg(svg));
    });

  return (
    <>
      <Tooltip title="Export diagram">
        <IconButton
          onClick={handleOpen}
          disabled={busy || exporting}
          aria-label="export"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <DownloadIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={exportPng}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download PNG" />
        </MenuItem>
        <MenuItem onClick={exportJpeg}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download JPEG" />
        </MenuItem>
        <MenuItem onClick={exportSvg}>
          <ListItemIcon>
            <SvgFileIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download SVG" />
        </MenuItem>
        <MenuItem onClick={exportPdf}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download PDF" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={copyPng}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Copy PNG to clipboard" />
        </MenuItem>
        <MenuItem onClick={copySvg}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Copy SVG to clipboard" />
        </MenuItem>
      </Menu>
    </>
  );
}