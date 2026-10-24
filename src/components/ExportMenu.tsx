// Export menu: download/copy the current graphie render as PNG, JPEG, SVG, or
// PDF. Pulls the SVG string from the preview iframe via `PreviewHandle.getSVG()`.

import React, { Fragment } from "react";
import { useCallback } from "react";
import styled from "@emotion/styled";
import {
  Download as DownloadIcon,
  Copy as CopyIcon,
  FileImage as ImageIcon,
  FileText as TextIcon,
} from "lucide-react";
import { exportArtifact, type ExportFormat } from "../export";

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
      await exportArtifact({ svg: svg ?? "", format, dest, filename });
    },
    [getSVG, filename]
  );

  return (
    <Root>
      <Title>Export</Title>
      {formats.map((f) => (
        <Fragment key={f.id}>
          <Row
            $dest="download"
            onClick={() => exportFormat(f.id, "download")}
            aria-label={`Download ${f.label}`}
          >
            {React.createElement(f.icon as any)}
            <span className="label">{f.label}</span>
            <span className="hint">Download {f.hint}</span>
          </Row>
          <Row
            $dest="copy"
            onClick={() => exportFormat(f.id, "copy")}
            aria-label={`Copy ${f.label} to clipboard`}
          >
            {React.createElement(CopyIcon)}
            <span className="label">Copy {f.label}</span>
            <span className="hint">Clipboard</span>
          </Row>
          {f.id !== "jpeg" && <Divider />}
        </Fragment>
      ))}
      <Hint>
        PNG/JPEG render at 3× scale. PDF size matches the SVG canvas. Copy to
        clipboard requires a secure context (localhost/HTTPS).
      </Hint>
    </Root>
  );
}

export default ExportMenu;
