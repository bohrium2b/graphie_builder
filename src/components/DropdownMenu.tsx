// Reusable dropdown menu primitive (Google Docs / prototype.html pattern).
//
// A trigger opens a floating panel anchored under it. The panel is rendered in
// a portal so it is never clipped by the app bar's overflow, is positioned in
// viewport coordinates, and supports:
//   - click to open / toggle, click outside or Escape to close
//   - hovering another trigger while a menu is open switches menus
//   - full keyboard navigation (Arrow keys, Home/End, Enter, Escape)

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled";
import { Check as CheckIcon } from "lucide-react";

export interface MenuItem {
  label?: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  onClick?: () => void;
  divider?: boolean;
}

interface DropdownMenuProps {
  /** Accessible name of the trigger. */
  label: string;
  items: MenuItem[];
  /** Controlled open state. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Custom trigger. Falls back to a plain text button. */
  renderTrigger?: (props: {
    ref: React.Ref<HTMLButtonElement>;
    open: boolean;
    toggle: () => void;
    onMouseEnter: () => void;
  }) => ReactNode;
  /** Align the panel with the right edge of the trigger instead of the left. */
  align?: "left" | "right";
  /** Minimum panel width in pixels. */
  minWidth?: number;
}

const Panel = styled("div")<{ $minWidth: number }>`
  position: fixed;
  z-index: 1000;
  min-width: ${(p) => p.$minWidth}px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  padding: 4px;
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  background: var(--color-surface-level-3);
  color: var(--color-on-surface);
  box-shadow: var(--elevation-level-2);
  font-size: 12px;
  user-select: none;
`;

const MenuItemEl = styled("button")<{ $checked?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: ${(p) =>
    p.$checked ? "var(--color-primary)" : "var(--color-on-surface)"};
  font-size: 12px;
  font-weight: ${(p) => (p.$checked ? 600 : 400)};
  text-align: left;
  cursor: pointer;
  outline: none;

  &:hover:not(:disabled),
  &:focus-visible {
    background: var(--color-surface-level-2);
    color: var(--color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }

  &:disabled {
    color: var(--color-outline);
    cursor: not-allowed;
  }

  .shortcut {
    margin-left: auto;
    padding-left: 16px;
    font-size: 10px;
    font-family: var(--font-mono);
    opacity: 0.55;
  }

  .check {
    width: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: ${(p) => (p.$checked ? 1 : 0)};
  }
`;

const Divider = styled("div")`
  height: 1px;
  margin: 4px 2px;
  background: var(--color-outline-variant);
`;

export function DropdownMenu({
  label,
  items,
  open,
  onOpenChange,
  renderTrigger,
  align = "left",
  minWidth = 200,
}: DropdownMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const width = panelRef.current?.offsetWidth ?? minWidth;
    const height = panelRef.current?.offsetHeight ?? 0;
    const margin = 8;
    let left = align === "right" ? r.right - width : r.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    let top = r.bottom + 4;
    // Flip above the trigger when there is not enough room below.
    if (height && top + height > window.innerHeight - margin) {
      const above = r.top - height - 4;
      if (above > margin) top = above;
    }
    setPos({ top, left });
  }, [align, minWidth]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
    const onScroll = () => place();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, place]);

  // Close when clicking outside of the trigger or the panel.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, onOpenChange]);

  // Focus the first item when the menu opens so keyboard users land inside.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLButtonElement>(
        "button:not(:disabled)"
      );
      first?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const onPanelKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const buttons = Array.from(
        panelRef.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)"
        ) ?? []
      );
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        buttons[(index + 1) % buttons.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        buttons[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        buttons[buttons.length - 1]?.focus();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onOpenChange(false);
        triggerRef.current?.focus();
      }
    },
    [onOpenChange]
  );

  const triggerProps = {
    ref: triggerRef,
    open,
    toggle: () => onOpenChange(!open),
    onMouseEnter: () => onOpenChange(true),
  };

  return (
    <>
      {renderTrigger ? (
        renderTrigger(triggerProps)
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={triggerProps.toggle}
          onMouseEnter={triggerProps.onMouseEnter}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={label}
          title={label}
        >
          {label}
        </button>
      )}
      {open &&
        createPortal(
          <Panel
            ref={panelRef}
            role="menu"
            aria-label={label}
            $minWidth={minWidth}
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              visibility: pos ? "visible" : "hidden",
            }}
            onKeyDown={onPanelKeyDown}
          >
            {items.map((item, i) =>
              item.divider ? (
                <Divider key={`divider-${i}`} />
              ) : (
                <MenuItemEl
                  key={item.label ?? `item-${i}`}
                  role="menuitem"
                  type="button"
                  $checked={item.checked}
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick?.();
                    onOpenChange(false);
                    triggerRef.current?.focus();
                  }}
                >
                  <span className="check">
                    <CheckIcon size={13} />
                  </span>
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="shortcut">{item.shortcut}</span>
                  )}
                </MenuItemEl>
              )
            )}
          </Panel>,
          document.body
        )}
    </>
  );
}

export default DropdownMenu;
