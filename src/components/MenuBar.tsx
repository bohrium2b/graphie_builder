// Menu bar: File / Edit / View / Insert / Format / Tools / Help dropdowns.
//
// The menus live inside the app bar (prototype.html / Google Docs) and open a
// floating panel anchored under the trigger. File and Edit route through the
// native adapter (Tauri dialogs/fs, Electron file dialogs, or file-saver /
// clipboard in a plain browser); the rest are delegated to props owned by
// Shell.

import { useCallback, useMemo, useState } from "react";
import styled from "@emotion/styled";
import {
  File as FileIcon,
  Edit as EditIcon,
  Eye as EyeIcon,
  HelpCircle as HelpCircleIcon,
  Sparkles as InsertIcon,
  Wand2 as FormatIcon,
  Wrench as ToolsIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useGraphieStore } from "../store";
import { createNativeAPI } from "../native/factory";
import { DropdownMenu, type MenuItem } from "./DropdownMenu";

export type ExportKind = "svg" | "png" | "jpeg" | "pdf";

interface MenuBarProps {
  onNew: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  onRegraph: () => void;
  onOpenTemplates: () => void;
  onExport: (kind: ExportKind) => void;
  colorScheme: "light" | "dark";
  sidebarCollapsed: boolean;
  splitEnabled: boolean;
  onToggleSplit: () => void;
  zoom: number;
  setZoom: (zoom: number) => void;
}

const Root = styled("nav")`
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
`;

const NavButton = styled("button")<{ $open: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  background: ${(p) =>
    p.$open ? "var(--color-surface-level-2)" : "transparent"};
  color: ${(p) =>
    p.$open ? "var(--color-on-surface)" : "var(--color-on-surface-variant)"};
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  user-select: none;
  cursor: pointer;
  outline: none;
  transition: background-color 0.12s ease, color 0.12s ease;

  &:hover {
    background: var(--color-surface-level-2);
    color: var(--color-on-surface);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    opacity: 0.85;
  }
`;

export function MenuBar({
  onNew,
  onUndo,
  onRedo,
  onToggleTheme,
  onToggleSidebar,
  onRegraph,
  onOpenTemplates,
  onExport,
  colorScheme,
  sidebarCollapsed,
  splitEnabled,
  onToggleSplit,
  zoom,
  setZoom,
}: MenuBarProps) {
  const native = useMemo(() => createNativeAPI(), []);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleOpen = useCallback(async () => {
    const code = await native.openFile();
    if (code !== null && code !== undefined) {
      const store = useGraphieStore.getState();
      store.setCode(code);
      store.setDirty(false);
    }
  }, [native]);

  const handleSave = useCallback(async () => {
    const store = useGraphieStore.getState();
    await native.saveFile(store.code, store.filename);
    store.setDirty(false);
  }, [native]);

  const handleSaveAs = useCallback(async () => {
    const store = useGraphieStore.getState();
    const filename = window.prompt("Save diagram as", store.filename);
    if (filename) {
      await native.saveFile(store.code, filename);
      store.setFilename(filename);
      store.setDirty(false);
    }
  }, [native]);

  const handleCut = useCallback(async () => {
    const store = useGraphieStore.getState();
    await native.copyText(store.code);
    store.setCode("");
    store.setDirty(true);
  }, [native]);

  const handleCopy = useCallback(async () => {
    await native.copyText(useGraphieStore.getState().code);
  }, [native]);

  const handlePaste = useCallback(async () => {
    const text = await native.pasteText();
    if (text !== null && text !== undefined) {
      const store = useGraphieStore.getState();
      store.setCode(text);
      store.setDirty(true);
    }
  }, [native]);

  const fileItems: MenuItem[] = [
    { label: "New", shortcut: "Cmd+N", onClick: onNew },
    { label: "Open…", shortcut: "Cmd+O", onClick: handleOpen },
    { label: "Save", shortcut: "Cmd+S", onClick: handleSave },
    { label: "Save As…", shortcut: "Cmd+Shift+S", onClick: handleSaveAs },
    { divider: true },
    { label: "Quit", shortcut: "Cmd+Q", onClick: () => native.quit() },
  ];

  const editItems: MenuItem[] = [
    { label: "Undo", shortcut: "Cmd+Z", onClick: onUndo },
    { label: "Redo", shortcut: "Cmd+Shift+Z", onClick: onRedo },
    { divider: true },
    { label: "Cut", shortcut: "Cmd+X", onClick: handleCut },
    { label: "Copy", shortcut: "Cmd+C", onClick: handleCopy },
    { label: "Paste", shortcut: "Cmd+V", onClick: handlePaste },
  ];

  const viewItems: MenuItem[] = [
    {
      label: "Dark theme",
      checked: colorScheme === "dark",
      onClick: onToggleTheme,
    },
    {
      label: sidebarCollapsed ? "Show sidebar" : "Hide sidebar",
      shortcut: "Cmd+B",
      onClick: onToggleSidebar,
    },
    {
      label: "Editor and preview",
      checked: splitEnabled,
      onClick: onToggleSplit,
    },
    { divider: true },
    ...[50, 75, 100, 125, 150, 200].map((z) => ({
      label: `Zoom ${z}%`,
      checked: zoom === z,
      onClick: () => setZoom(z),
    })),
  ];

  const insertItems: MenuItem[] = [
    { label: "Templates…", onClick: onOpenTemplates },
    { divider: true },
    {
      label: "Function plot",
      onClick: () =>
        useGraphieStore.getState().setCode(
          `style({\n    stroke: BLUE_D,\n    fill: "none",\n    strokeWidth: 3\n});\n\nplot(function(x) {\n    return sin(x);\n}, X_RANGE);\n`
        ),
    },
    {
      label: "Polygon",
      onClick: () =>
        useGraphieStore.getState().setCode(
          `drawPolygon({\n    points: [[0, 0], [3, 4], [8, 4], [5, 0]],\n    showPoints: true,\n    angleLabels: "$deg0",\n    sideLabels: "$len0",\n    vertexLabels: ["A", "B", "C", "D"]\n});\n`
        ),
    },
    {
      label: "Number line",
      onClick: () =>
        useGraphieStore.getState().setCode(
          `var RANGE = [-5, 10];\nvar SCALE = 320 / (RANGE[1] - RANGE[0]);\n\ninit({\n    range: [[RANGE[0] - 30 / SCALE, RANGE[1] + 30 / SCALE], [-1, 1]],\n    scale: [SCALE, 40]\n});\n\nline([RANGE[0] - 25 / SCALE, 0], [RANGE[1] + 25 / SCALE, 0], { arrows: "<->" });\n`
        ),
    },
  ];

  const formatItems: MenuItem[] = [
    { label: "Re-render diagram", shortcut: "Cmd+R", onClick: onRegraph },
    { divider: true },
    { label: "Pretty print code", onClick: () => {} },
  ];

  const toolsItems: MenuItem[] = [
    { label: "Export SVG", onClick: () => onExport("svg") },
    { label: "Export PNG", onClick: () => onExport("png") },
    { label: "Export PDF", onClick: () => onExport("pdf") },
    { divider: true },
    { label: "Copy SVG to clipboard", onClick: () => onExport("svg") },
  ];

  const helpItems: MenuItem[] = [
    { label: "Keyboard shortcuts", onClick: () => {} },
    { label: "About Graphie Builder", onClick: () => {} },
  ];

  const menus: {
    id: string;
    label: string;
    icon: LucideIcon;
    items: MenuItem[];
  }[] = [
    { id: "file", label: "File", icon: FileIcon, items: fileItems },
    { id: "edit", label: "Edit", icon: EditIcon, items: editItems },
    { id: "view", label: "View", icon: EyeIcon, items: viewItems },
    { id: "insert", label: "Insert", icon: InsertIcon, items: insertItems },
    { id: "format", label: "Format", icon: FormatIcon, items: formatItems },
    { id: "tools", label: "Tools", icon: ToolsIcon, items: toolsItems },
    { id: "help", label: "Help", icon: HelpCircleIcon, items: helpItems },
  ];

  return (
    <Root aria-label="Main menu">
      {menus.map((menu) => (
        <DropdownMenu
          key={menu.id}
          label={menu.label}
          items={menu.items}
          open={openMenu === menu.id}
          onOpenChange={(open) => setOpenMenu(open ? menu.id : null)}
          renderTrigger={({ ref, open, toggle, onMouseEnter }) => (
            <NavButton
              ref={ref}
              type="button"
              $open={open}
              onClick={toggle}
              onMouseEnter={onMouseEnter}
              aria-haspopup="menu"
              aria-expanded={open}
              title={menu.label}
            >
              <menu.icon />
              {menu.label}
            </NavButton>
          )}
        />
      ))}
    </Root>
  );
}

export default MenuBar;
