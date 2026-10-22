// Menu bar: File / Edit / View / Help menus for Graphie Builder.
//
// File: New, Open, Save, Save As (.graphie via file-saver download)
// Edit: Undo, Redo, Cut, Copy, Paste (operates on editor code)
// View: Zoom, Theme toggle, Sidebar toggle
// Help: About, keyboard shortcuts

import { useCallback } from "react";
import styled from "@emotion/styled";
import {
  Menu as MenuIcon,
  File as FileIcon,
  Edit as EditIcon,
  Eye as EyeIcon,
  HelpCircle as HelpCircleIcon,
  Save as SaveIcon,
  FolderOpen as FolderOpenIcon,
  RotateCcw as UndoIcon,
  RotateCw as RedoIcon,
  Scissors as ScissorsIcon,
  Copy as CopyIcon,
  Clipboard as PasteIcon,
  Maximize as ZoomIcon,
  Sun as LightModeIcon,
  Moon as DarkModeIcon,
  Sidebar as SidebarIcon,
} from "lucide-react";
import { useGraphieTheme, useThemeScheme } from "../theme";
import { useGraphieStore } from "../store";

interface MenuBarProps {
  onSave: (code: string, filename: string) => void;
  onSaveAs: (code: string) => void;
  onOpen: (code: string) => void;
  onNew: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: (code: string) => void;
  onCopy: (code: string) => void;
  onPaste: (code: string) => void;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  colorScheme: "light" | "dark";
  sidebarCollapsed: boolean;
}

const Root = styled("nav")`
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--layout-toolbar-height);
  padding: 0 16px;
  border-bottom: 1px solid var(--color-outline-variant);
  background: var(--color-surface-level-1);
  color: var(--color-on-surface);
  font-family: var(--font-sans);
  font-size: 12px;
  flex-shrink: 0;
  overflow-x: auto;
`;

const Menu = styled("div")<{ $open?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  color: var(--color-on-surface);
  font-size: 12px;
  white-space: nowrap;
  user-select: none;

  &:hover {
    background: var(--color-surface-level-2);
    border-color: var(--color-outline-variant);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    opacity: 0.8;
  }
`;

const Separator = styled("div")`
  width: 1px;
  height: 16px;
  background: var(--color-outline-variant);
  margin: 0 4px;
`;

const Hint = styled("span")`
  margin-left: auto;
  font-size: 10px;
  opacity: 0.6;
  font-family: var(--font-mono);
`;

export function MenuBar({
  onSave,
  onSaveAs,
  onOpen,
  onNew,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onToggleTheme,
  onToggleSidebar,
  colorScheme,
  sidebarCollapsed,
}: MenuBarProps) {
  const theme = useGraphieTheme();
  const ThemeIcon = colorScheme === "dark" ? LightModeIcon : DarkModeIcon;

  const handleSave = useCallback(() => {
    onSave(useGraphieStore.getState().code, useGraphieStore.getState().filename);
  }, [onSave]);

  const handleSaveAs = useCallback(() => {
    const filename = window.prompt(
      "Save diagram as",
      useGraphieStore.getState().filename,
    );
    if (filename) {
      onSaveAs(useGraphieStore.getState().code);
      useGraphieStore.getState().setFilename(filename);
      useGraphieStore.getState().setDirty(false);
    }
  }, [onSaveAs]);

  const handleOpen = useCallback(() => {
    const code = window.prompt("Paste graphie code to open");
    if (code !== null) {
      onOpen(code);
      useGraphieStore.getState().setDirty(false);
    }
  }, [onOpen]);

  const handleNew = useCallback(() => {
    onNew();
    useGraphieStore.getState().setFilename("Untitled.graphie");
    useGraphieStore.getState().setDirty(false);
  }, [onNew]);

  const handleUndo = useCallback(() => {
    onUndo();
  }, [onUndo]);

  const handleRedo = useCallback(() => {
    onRedo();
  }, [onRedo]);

  const handleCut = useCallback(() => {
    const code = useGraphieStore.getState().code;
    onCut(code);
  }, [onCut]);

  const handleCopy = useCallback(() => {
    const code = useGraphieStore.getState().code;
    onCopy(code);
  }, [onCopy]);

  const handlePaste = useCallback(() => {
    navigator.clipboard
      .readText()
      .then((text) => {
        onPaste(text);
      })
      .catch(() => {
        // clipboard access denied
      });
  }, [onPaste]);

  return (
    <Root>
      <Menu
        onClick={handleNew}
        title="New diagram"
        aria-label="new diagram"
      >
        <FileIcon />
        <span>File</span>
      </Menu>
      <Menu
        onClick={handleOpen}
        title="Open diagram"
        aria-label="open diagram"
      >
        <FolderOpenIcon />
        <span>Open</span>
      </Menu>
      <Separator />
      <Menu
        onClick={handleSave}
        title={`Save ${useGraphieStore.getState().filename}`}
        aria-label="save diagram"
      >
        <SaveIcon />
        <span>Save</span>
        <Hint>Cmd+S</Hint>
      </Menu>
      <Menu onClick={handleSaveAs} title="Save as" aria-label="save as">
        <SaveIcon />
        <span>Save As…</span>
        <Hint>Cmd+Shift+S</Hint>
      </Menu>
      <Separator />
      <Menu
        onClick={handleCut}
        title="Cut code"
        aria-label="cut code"
      >
        <ScissorsIcon />
        <span>Cut</span>
        <Hint>Cmd+X</Hint>
      </Menu>
      <Menu
        onClick={handleCopy}
        title="Copy code"
        aria-label="copy code"
      >
        <CopyIcon />
        <span>Copy</span>
        <Hint>Cmd+C</Hint>
      </Menu>
      <Menu
        onClick={handlePaste}
        title="Paste code"
        aria-label="paste code"
      >
        <PasteIcon />
        <span>Paste</span>
        <Hint>Cmd+V</Hint>
      </Menu>
      <Separator />
      <Menu
        onClick={handleUndo}
        title="Undo"
        aria-label="undo"
      >
        <UndoIcon />
        <span>Undo</span>
        <Hint>Cmd+Z</Hint>
      </Menu>
      <Menu
        onClick={handleRedo}
        title="Redo"
        aria-label="redo"
      >
        <RedoIcon />
        <span>Redo</span>
        <Hint>Cmd+Shift+Z</Hint>
      </Menu>
      <Separator />
      <Menu
        onClick={onToggleTheme}
        title={
          colorScheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
        aria-label="toggle theme"
        aria-pressed={colorScheme === "light"}
      >
        <ThemeIcon />
        <span>Theme</span>
      </Menu>
      <Menu
        onClick={onToggleSidebar}
        title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        aria-label="toggle sidebar"
      >
        <SidebarIcon />
        <span>Sidebar</span>
        <Hint>Cmd+B</Hint>
      </Menu>
      <Separator />
      <Menu
        onClick={onToggleTheme}
        title="Zoom diagram"
        aria-label="zoom"
      >
        <ZoomIcon />
        <span>Zoom</span>
      </Menu>
      <Separator />
      <Menu onClick={() => {}} title="Help" aria-label="help">
        <HelpCircleIcon />
        <span>Help</span>
      </Menu>
    </Root>
  );
}

export default MenuBar;
