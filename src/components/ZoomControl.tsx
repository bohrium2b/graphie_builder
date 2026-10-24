// Zoom control: a "−  100%  +" group for the canvas (prototype.html / Google
// Docs pattern). The percentage itself is a button that opens a dropdown with
// the usual zoom presets.

import { useCallback, useState } from "react";
import styled from "@emotion/styled";
import { Minus as MinusIcon, Plus as PlusIcon } from "lucide-react";
import { DropdownMenu, type MenuItem } from "./DropdownMenu";

interface ZoomControlProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const Root = styled("div")`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: var(--radius-full);
  background: var(--color-surface-level-2);
`;

const RoundButton = styled("button")`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  outline: none;
  transition: background-color 0.12s ease, color 0.12s ease;

  &:hover:not(:disabled) {
    background: var(--color-surface-level-3);
    color: var(--color-on-surface);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const PercentButton = styled("button")<{ $open: boolean }>`
  min-width: 52px;
  height: 26px;
  padding: 0 8px;
  border: none;
  border-radius: var(--radius-full);
  background: ${(p) =>
    p.$open ? "var(--color-surface-level-3)" : "transparent"};
  color: var(--color-on-surface);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  outline: none;

  &:hover {
    background: var(--color-surface-level-3);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }
`;

const PRESETS = [25, 50, 75, 100, 125, 150, 200, 300, 400];

export function ZoomControl({
  zoom,
  setZoom,
  min = 10,
  max = 400,
  step = 10,
}: ZoomControlProps) {
  const [open, setOpen] = useState(false);

  const zoomBy = useCallback(
    (delta: number) => {
      const next = Math.round(zoom + delta);
      setZoom(Math.max(min, Math.min(max, next)));
    },
    [zoom, setZoom, min, max]
  );

  const items: MenuItem[] = PRESETS.map((z) => ({
    label: `${z}%`,
    checked: zoom === z,
    onClick: () => setZoom(z),
  }));
  items.push({ divider: true });
  items.push({ label: "Fit to window", onClick: () => setZoom(100) });

  return (
    <Root>
      <RoundButton
        type="button"
        title="Zoom out"
        aria-label="Zoom out"
        disabled={zoom <= min}
        onClick={() => zoomBy(-step)}
      >
        <MinusIcon />
      </RoundButton>
      <DropdownMenu
        label="Zoom"
        items={items}
        open={open}
        onOpenChange={setOpen}
        minWidth={160}
        align="right"
        renderTrigger={({ ref, open: isOpen, toggle, onMouseEnter }) => (
          <PercentButton
            ref={ref}
            type="button"
            $open={isOpen}
            onClick={toggle}
            onMouseEnter={onMouseEnter}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            title="Zoom"
          >
            {zoom}%
          </PercentButton>
        )}
      />
      <RoundButton
        type="button"
        title="Zoom in"
        aria-label="Zoom in"
        disabled={zoom >= max}
        onClick={() => zoomBy(step)}
      >
        <PlusIcon />
      </RoundButton>
    </Root>
  );
}

export default ZoomControl;
