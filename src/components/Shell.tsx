// Graphie Builder layout shell.
//
// Implements the DESIGN.md workbench layout:
//   Top App Bar | Activity Bar + Sidebar | Split (Editor | Preview) + Inspector | Status Bar
//
// Colors come from the M3 CSS variables in theme/tokens.css (which follow the
// [data-color-scheme] attribute), so the shell re-themes automatically without
// emotion theme interpolation. Panels are placeholders in Phase 1; Phases 2-3
// wire the real editor and preview into the central split.

import { useState, useCallback, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import styled from "@emotion/styled";
import {
  Code as CodeIcon,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Moon as DarkModeIcon,
  Sun as LightModeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { useGraphieTheme, useThemeScheme } from "../theme";
import { PreviewPanel, PreviewHandle } from "./PreviewPanel";
import { EditorPanel } from "./EditorPanel";
import { TemplatesPanel } from "./TemplatesPanel";
import { MenuBar } from "./MenuBar";
import { ExportMenu } from "./ExportMenu";
import { useGraphieStore } from "../store";
import { saveAs } from "file-saver";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";

// ---------------------------------------------------------------------------
// Styled primitives (color values reference M3 CSS vars)
// ---------------------------------------------------------------------------

const Root = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--color-workbench-bg);
  color: var(--color-on-background);
  font-family: var(--font-sans);
`;

const TopBar = styled("header")`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--layout-toolbar-height);
  padding: 0 16px;
  gap: 8px;
  background: var(--color-surface-level-1);
  border-bottom: 1px solid var(--color-outline-variant);
  color: var(--color-on-surface);
  flex-shrink: 0;
`;

const TopBarLeading = styled("div")`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
`;

const TopBarCenter = styled("div")`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const TopBarTrailing = styled("div")`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Workbench = styled("main")`
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--color-workbench-bg);
`;

const ActivityBar = styled("aside")<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48px;
  min-width: ${(p: { $collapsed: boolean }) => (p.$collapsed ? 0 : 48)}px;
  max-width: ${(p: { $collapsed: boolean }) => (p.$collapsed ? 48 : 240)}px;
  background: var(--color-activity-bar-bg);
  border-right: 1px solid var(--color-outline-variant);
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.2s ease;
`;

const Sidebar = styled("aside")<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  width: ${(p: { $collapsed: boolean }) => (p.$collapsed ? 0 : 240)}px;
  min-width: ${(p: { $collapsed: boolean }) => (p.$collapsed ? 0 : 240)}px;
  background: var(--color-sidebar-bg);
  border-right: 1px solid var(--color-outline-variant);
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.2s ease;
`;

const SplitArea = styled("section")`
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--color-editor-bg);
`;

const Inspector = styled("aside")`
  display: flex;
  flex-direction: column;
  width: 300px;
  min-width: 200px;
  background: var(--color-surface-level-1);
  border-left: 1px solid var(--color-outline-variant);
  flex-shrink: 0;
  overflow: hidden;
`;

const StatusBar = styled("footer")`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--layout-status-bar-height);
  padding: 0 16px;
  background: var(--color-status-bar-bg);
  color: var(--color-status-bar-fg);
  border-top: 1px solid var(--color-outline-variant);
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 11px;
`;

const PanelFrame = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--color-editor-bg);
`;

const PanelHeader = styled("div")`
  display: flex;
  align-items: center;
  gap: 4px;
  height: var(--layout-panel-header-height);
  padding: 0 12px;
  background: var(--color-surface-level-2);
  border-bottom: 1px solid var(--color-outline-variant);
  color: var(--color-on-surface-variant);
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
`;

const PanelBody = styled("div")`
  flex: 1;
  overflow: auto;
  background: var(--color-editor-bg);
  color: var(--color-on-background);
  padding: 16px;
`;

const IconButton = styled("button")`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline-variant);
  background: transparent;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  outline: none;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--color-surface-level-2);
    color: var(--color-on-surface);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ThemeToggle = styled(IconButton)`
  &:hover {
    background: var(--color-primary-container);
    color: var(--color-on-primary-container);
  }
`;

const ChevronButton = styled("button")<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-outline-variant);
  background: var(--color-surface-level-1);
  color: var(--color-on-surface);
  cursor: pointer;
  outline: none;

  &:hover {
    background: var(--color-surface-level-2);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ---------------------------------------------------------------------------
// Sub-panels (placeholders)
// ---------------------------------------------------------------------------

function ActivityRail() {
  const { toggleScheme, colorScheme } = useThemeScheme();
  const ThemeIcon = colorScheme === "dark" ? LightModeIcon : DarkModeIcon;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        paddingTop: 16,
        flex: 1,
      }}
    >
      <IconButton title="Toggle theme" onClick={toggleScheme} aria-label="toggle theme">
        <ThemeIcon />
      </IconButton>
      <span style={{ fontSize: 10, opacity: 0.6 }}>GB</span>
    </div>
  );
}

function SidebarContent({ onTemplates }: { onTemplates: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: 8,
        flex: 1,
        overflow: "auto",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-outline)",
          marginBottom: 8,
          paddingLeft: 4,
        }}
      >
        Library
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          key="Templates"
          style={{
            padding: "6px 8px",
            color: "var(--color-primary)",
            fontSize: 12,
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 500,
          }}
          onClick={onTemplates}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onTemplates();
            }
          }}
        >
          Templates
        </div>
        {["Assets", "Snippets"].map((label) => (
          <div
            key={label}
            style={{
              padding: "6px 8px",
              color: "var(--color-on-surface)",
              fontSize: 12,
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function InspectorContent({ getSVG }: { getSVG: () => Promise<string | null> }) {
  const theme = useGraphieTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <PanelHeader>
        <span>Inspector</span>
      </PanelHeader>
      <div style={{ flex: 1, overflow: "auto", padding: 16, color: theme.colors.onSurfaceVariant, fontSize: 12, lineHeight: "1.5" }}>
        <div style={{ marginBottom: 8, fontWeight: 600, color: theme.colors.onSurface }}>
          Graphie Properties
        </div>
        <div style={{ opacity: 0.6 }}>Select an element to inspect.</div>
        <div style={{ marginTop: 16, fontWeight: 600, color: theme.colors.onSurface }}>
          Export Settings
        </div>
        <ExportMenu getSVG={getSVG} />
      </div>
    </div>
  );
}

function StatusBarContent() {
  const theme = useGraphieTheme();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        fontFamily: theme.typography.fontMono,
      }}
    >
      <span>Engine: Graphie</span>
      <span>·</span>
      <span>Ready</span>
      <span>·</span>
      <span>Zoom 100%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

interface ShellProps {
  children?: ReactNode;
}

export function Shell({ children }: ShellProps) {
  const { colorScheme, toggleScheme } = useThemeScheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const code = useGraphieStore((s) => s.code);
  const setCode = useGraphieStore((s) => s.setCode);
  const { undo, redo } = useGraphieStore((s) => ({ undo: s.undo, redo: s.redo }));
  const filename = useGraphieStore((s) => s.filename);
  const setFilename = useGraphieStore((s) => s.setFilename);
  const isDirty = useGraphieStore((s) => s.isDirty);
  const setDirty = useGraphieStore((s) => s.setDirty);
  const setError = useGraphieStore((s) => s.setLastError);
  const previewRef = useRef<PreviewHandle | null>(null);

  const handleRegraph = useCallback(() => {
    previewRef.current?.regraph();
  }, []);

  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
    },
    [setCode]
  );

  const handleLoadTemplate = useCallback(
    (code: string, title: string) => {
      setCode(code);
      setShowTemplates(false);
    },
    [setCode]
  );

  const handleSave = useCallback(() => {
    const blob = new Blob([code], { type: "application/graphie+json" });
    saveAs(blob, filename);
    setDirty(false);
  }, [code, filename, setDirty]);

  const handleSaveAs = useCallback(() => {
    const next = window.prompt("Save diagram as", filename);
    if (next) {
      setFilename(next);
      const blob = new Blob([code], { type: "application/graphie+json" });
      saveAs(blob, next);
      setDirty(false);
    }
  }, [code, filename, setFilename, setDirty]);

  const handleOpen = useCallback(() => {
    const next = window.prompt("Paste graphie code to open");
    if (next !== null) {
      setCode(next);
      setDirty(false);
    }
  }, [setCode, setDirty]);

  const handleNew = useCallback(() => {
    setCode("");
    setFilename("Untitled.graphie");
    setDirty(false);
  }, [setCode, setFilename, setDirty]);

  const handleCut = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCode("");
    setDirty(true);
  }, [code, setCode, setDirty]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
  }, [code]);

  const handlePaste = useCallback(() => {
    navigator.clipboard
      .readText()
      .then((next) => {
        setCode(next);
        setDirty(true);
      })
      .catch(() => {
        // clipboard access denied
      });
  }, [setCode, setDirty]);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((p) => !p), []);

  // Global keyboard shortcuts (inert when focused in an editable field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const editable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (editable) return;
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAs();
        } else {
          handleSave();
        }
      } else if (key === "b") {
        e.preventDefault();
        toggleSidebar();
      } else if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Root>
      <TopBar>
        <TopBarLeading>
          <ChevronButton
            $collapsed={sidebarCollapsed}
            onClick={toggleSidebar}
            title="Toggle sidebar"
            aria-label="toggle sidebar"
          >
            {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </ChevronButton>
          <div style={{ fontWeight: 600, letterSpacing: -0.02, fontSize: 16 }}>
            Graphie Builder
          </div>
        </TopBarLeading>

        <TopBarCenter>
          <IconButton title="Code editor" aria-label="code editor">
            <CodeIcon />
          </IconButton>
          <IconButton title="Visual preview" aria-label="visual preview">
            <ImageIcon />
          </IconButton>
        </TopBarCenter>

        <TopBarTrailing>
          <ThemeToggle
            onClick={toggleScheme}
            title={
              colorScheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            aria-pressed={colorScheme === "light"}
          >
            {colorScheme === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </ThemeToggle>
          <IconButton title="Settings" aria-label="settings">
            <SettingsIcon />
          </IconButton>
        </TopBarTrailing>
      </TopBar>

      <MenuBar
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onOpen={handleOpen}
        onNew={handleNew}
        onUndo={undo}
        onRedo={redo}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onToggleTheme={toggleScheme}
        onToggleSidebar={toggleSidebar}
        colorScheme={colorScheme}
        sidebarCollapsed={sidebarCollapsed}
      />

      <Workbench>
        <ActivityBar $collapsed={true}>
          <ActivityRail />
        </ActivityBar>
        <Sidebar $collapsed={sidebarCollapsed}>
          {sidebarCollapsed ? null : showTemplates ? (
            <TemplatesPanel onLoadTemplate={handleLoadTemplate} />
          ) : (
            <SidebarContent onTemplates={() => setShowTemplates(true)} />
          )}
        </Sidebar>
        <SplitArea>
          <PanelGroup direction="horizontal" style={{ height: "100%", width: "100%" }}>
            <Panel defaultSize={50} minSize={20}>
              <EditorPanel
                code={code}
                onChange={handleCodeChange}
                onRegraph={handleRegraph}
              />
            </Panel>
            <PanelResizeHandle
              style={{
                background: "var(--color-outline-variant)",
                width: 1,
              }}
            />
            <Panel defaultSize={50} minSize={20}>
              <PreviewPanel
                ref={previewRef}
                code={code}
                onError={setError}
              />
            </Panel>
          </PanelGroup>
        </SplitArea>
        <Inspector>
          <InspectorContent
            getSVG={() => previewRef.current?.getSVG() ?? Promise.resolve(null)}
          />
        </Inspector>
      </Workbench>

      <StatusBar>
        <StatusBarContent />
      </StatusBar>

      {children}
    </Root>
  );
}

export default Shell;
