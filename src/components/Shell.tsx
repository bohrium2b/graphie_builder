// Graphie Builder layout shell.
//
// Implements the DESIGN.md workbench layout:
//   Top App Bar | Activity Bar + Sidebar | Split (Editor | Preview) + Inspector | Status Bar
//
// The app bar follows prototype.html: the product mark and the document title
// sit on the left, the File/Edit/View/… menus are a row of dropdowns next to
// them, and the zoom control plus global actions sit on the right.
//
// Colors come from the M3 CSS variables in theme/tokens.css (which follow the
// [data-color-scheme] attribute), so the shell re-themes automatically without
// emotion theme interpolation.

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { ReactNode, CSSProperties } from "react";
import styled from "@emotion/styled";
import {
  Settings as SettingsIcon,
  Moon as DarkModeIcon,
  Sun as LightModeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  LayoutGrid as TemplatesIcon,
  Image as AssetsIcon,
  Code as SnippetsIcon,
} from "lucide-react";
import { useGraphieTheme, useThemeScheme } from "../theme";
import { PreviewPanel, PreviewHandle } from "./PreviewPanel";
import { EditorPanel } from "./EditorPanel";
import { TemplatesPanel } from "./TemplatesPanel";
import { MenuBar, type ExportKind } from "./MenuBar";
import { ExportMenu } from "./ExportMenu";
import { exportArtifact } from "../export";
import { ZoomControl } from "./ZoomControl";
import { useGraphieStore } from "../store";
import type { IRNode } from "../ir/types";
import { createNativeAPI } from "../native/factory";
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
  height: 56px;
  padding: 0 12px;
  gap: 12px;
  background: var(--color-surface-level-1);
  border-bottom: 1px solid var(--color-outline-variant);
  color: var(--color-on-surface);
  flex-shrink: 0;
`;

const TopBarLeading = styled("div")`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const TopBarCenter = styled("div")`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
`;

const TopBarTrailing = styled("div")`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TitleGroup = styled("div")`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 0;
`;

const AppTitle = styled("div")`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-primary);
  line-height: 18px;
`;

const AppMark = styled("div")`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
`;

const DocumentTitle = styled("input")`
  max-width: 320px;
  min-width: 120px;
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-on-surface);
  font-family: var(--font-sans);
  font-size: 13px;
  text-align: center;
  text-overflow: ellipsis;
  outline: none;

  &:hover {
    background: var(--color-surface-level-2);
  }

  &:focus {
    background: var(--color-surface-level-2);
    border-color: var(--color-primary);
  }
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

const IconButton = styled("button")`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  border: none;
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
  border: none;
  background: transparent;
  color: var(--color-on-surface);
  cursor: pointer;
  outline: none;

  &:hover {
    background: var(--color-surface-level-2);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ---------------------------------------------------------------------------
// Sub-panels
// ---------------------------------------------------------------------------

type SidebarView = "templates" | "assets" | "snippets";

const VIEW_ICONS: {
  id: SidebarView;
  label: string;
  icon: typeof TemplatesIcon;
}[] = [
  { id: "templates", label: "Templates", icon: TemplatesIcon },
  { id: "assets", label: "Assets", icon: AssetsIcon },
  { id: "snippets", label: "Snippets", icon: SnippetsIcon },
];

function ActivityRail({
  view,
  onViewChange,
}: {
  view: SidebarView;
  onViewChange: (view: SidebarView) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        paddingTop: 12,
        flex: 1,
      }}
    >
      {VIEW_ICONS.map((v) => {
        const Icon = v.icon;
        const active = view === v.id;
        return (
          <IconButton
            key={v.id}
            title={v.label}
            aria-label={v.label}
            aria-pressed={active}
            onClick={() => onViewChange(v.id)}
            style={
              active
                ? {
                    background: "var(--color-primary-container)",
                    color: "var(--color-on-primary-container)",
                  }
                : undefined
            }
          >
            <Icon />
          </IconButton>
        );
      })}
    </div>
  );
}

function PlaceholderPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 16,
        color: "var(--color-on-surface-variant)",
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-outline)",
        }}
      >
        {title}
      </div>
      <div>{description}</div>
    </div>
  );
}

function InspectorContent({ getSVG }: { getSVG: () => Promise<string | null> }) {
  const theme = useGraphieTheme();
  const ir = useGraphieStore((s) => s.ir);
  const selectedIds = useGraphieStore((s) => s.selectedIds);
  const updateNode = useGraphieStore((s) => s.updateNode);
  const applyIR = useGraphieStore((s) => s.applyIR);
  const deleteNodes = useGraphieStore((s) => s.deleteNodes);

  const selected = useMemo(() => {
    if (!ir) return [] as IRNode[];
    return selectedIds
      .map((id) => ir.nodes.find((n) => n.id === id))
      .filter((n): n is IRNode => !!n);
  }, [ir, selectedIds]);

  const single = selected.length === 1 ? selected[0] : null;

  const handleChange = (field: keyof IRNode, value: unknown) => {
    if (!single) return;
    updateNode(single.id, { [field]: value } as Partial<IRNode>);
  };

  const handleStyle = (field: string, value: unknown) => {
    if (!single) return;
    const next = { ...(single.style ?? {}), [field]: value };
    updateNode(single.id, { style: next } as Partial<IRNode>);
  };

  const handleRange = (axis: 0 | 1, idx: 0 | 1, value: number) => {
    if (!ir) return;
    const nextRange: [[number, number], [number, number]] = [
      [ir.range[0][0], ir.range[0][1]],
      [ir.range[1][0], ir.range[1][1]],
    ];
    nextRange[axis][idx] = value;
    applyIR({ ...ir, range: nextRange });
  };

  const handleScale = (value: number) => {
    if (!ir) return;
    applyIR({ ...ir, scale: value });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <PanelHeader>
        <span>Inspector</span>
      </PanelHeader>
      <div style={{ flex: 1, overflow: "auto", padding: 16, color: theme.colors.onSurfaceVariant, fontSize: 12, lineHeight: "1.5" }}>
        <div style={{ marginBottom: 8, fontWeight: 600, color: theme.colors.onSurface }}>
          Canvas
        </div>
        {ir && (
          <>
            <div style={{ marginBottom: 8, opacity: 0.8 }}>
              <span style={{ display: "inline-block", width: 60 }}>Range X:</span>
              [{fmt(ir.range[0][0])}, {fmt(ir.range[0][1])}]
            </div>
            <div style={{ marginBottom: 8, opacity: 0.8 }}>
              <span style={{ display: "inline-block", width: 60 }}>Range Y:</span>
              [{fmt(ir.range[1][0])}, {fmt(ir.range[1][1])}]
            </div>
            <div style={{ marginBottom: 8, opacity: 0.8 }}>
              <span style={{ display: "inline-block", width: 60 }}>Scale:</span>
              {fmt(ir.scale)}
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Range X min</label>
              <input type="number" step={0.1} value={ir.range[0][0]} onChange={(e) => handleRange(0, 0, parseFloat(e.target.value))} style={inputStyle} />
              <label style={{ display: "block", marginTop: 4, marginBottom: 4 }}>Range X max</label>
              <input type="number" step={0.1} value={ir.range[0][1]} onChange={(e) => handleRange(0, 1, parseFloat(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Range Y min</label>
              <input type="number" step={0.1} value={ir.range[1][0]} onChange={(e) => handleRange(1, 0, parseFloat(e.target.value))} style={inputStyle} />
              <label style={{ display: "block", marginTop: 4, marginBottom: 4 }}>Range Y max</label>
              <input type="number" step={0.1} value={ir.range[1][1]} onChange={(e) => handleRange(1, 1, parseFloat(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Scale (px/unit)</label>
              <input type="number" value={ir.scale} onChange={(e) => handleScale(parseFloat(e.target.value))} style={inputStyle} />
            </div>
          </>
        )}
        {single ? (
          <>
            <div style={{ marginTop: 16, fontWeight: 600, color: theme.colors.onSurface }}>
              Element: {single.kind}
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>X</label>
              <input type="number" step={0.1} value={fmt(single.x)} onChange={(e) => handleChange("x", parseFloat(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Y</label>
              <input type="number" step={0.1} value={fmt(single.y)} onChange={(e) => handleChange("y", parseFloat(e.target.value))} style={inputStyle} />
            </div>
            {single.kind === "circle" && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 4 }}>Radius</label>
                <input type="number" step={0.1} value={fmt(single.r ?? 1)} onChange={(e) => handleChange("r", parseFloat(e.target.value))} style={inputStyle} />
              </div>
            )}
            {single.kind === "ellipse" && (
              <>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>Rx</label>
                  <input type="number" step={0.1} value={fmt(single.rx ?? 1)} onChange={(e) => handleChange("rx", parseFloat(e.target.value))} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>Ry</label>
                  <input type="number" step={0.1} value={fmt(single.ry ?? 1)} onChange={(e) => handleChange("ry", parseFloat(e.target.value))} style={inputStyle} />
                </div>
              </>
            )}
            {single.kind === "line" && (
              <>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>X2</label>
                  <input type="number" step={0.1} value={fmt(single.x2 ?? single.x)} onChange={(e) => handleChange("x2", parseFloat(e.target.value))} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>Y2</label>
                  <input type="number" step={0.1} value={fmt(single.y2 ?? single.y)} onChange={(e) => handleChange("y2", parseFloat(e.target.value))} style={inputStyle} />
                </div>
              </>
            )}
            {single.kind === "label" && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 4 }}>Text</label>
                <input type="text" value={String(single.props?.text ?? single.text ?? "")} onChange={(e) => handleChange("props", { ...single.props, text: e.target.value })} style={inputStyle} />
              </div>
            )}
            <div style={{ marginTop: 16, fontWeight: 600, color: theme.colors.onSurface }}>
              Style
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Fill</label>
              <input type="color" value={colorValue(single.style?.fill ?? single.fill ?? "#000000")} onChange={(e) => handleStyle("fill", e.target.value)} />
              <input type="text" value={String(single.style?.fill ?? single.fill ?? "")} onChange={(e) => handleStyle("fill", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Stroke</label>
              <input type="color" value={colorValue(single.style?.stroke ?? single.stroke ?? "#000000")} onChange={(e) => handleStyle("stroke", e.target.value)} />
              <input type="text" value={String(single.style?.stroke ?? single.stroke ?? "")} onChange={(e) => handleStyle("stroke", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Stroke width</label>
              <input type="number" min={0} step={0.5} value={fmt(single.style?.strokeWidth ?? single.strokeWidth ?? 2)} onChange={(e) => handleStyle("strokeWidth", parseFloat(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Opacity</label>
              <input type="number" min={0} max={1} step={0.05} value={fmt(single.style?.opacity ?? single.opacity ?? 1)} onChange={(e) => handleStyle("opacity", parseFloat(e.target.value))} style={inputStyle} />
            </div>
          </>
        ) : (
          <div style={{ opacity: 0.6 }}>
            {selectedIds.length === 0
              ? "Select an element to edit its properties."
              : `${selectedIds.length} element(s) selected. Select one to edit properties.`}
          </div>
        )}
        <div style={{ marginTop: 16, fontWeight: 600, color: theme.colors.onSurface }}>
          Export Settings
        </div>
        <ExportMenu getSVG={getSVG} />
        {selectedIds.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <button onClick={() => deleteNodes(selectedIds)} style={{ fontSize: 11, padding: "4px 8px" }}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  fontSize: 12,
  padding: "2px 4px",
  borderRadius: 4,
  border: "1px solid var(--color-outline-variant)",
  background: "var(--color-surface-level-2)",
  color: "var(--color-on-surface)",
};

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/\.?0+$/, "");
}

function colorValue(c?: string): string {
  if (!c) return "#000000";
  if (c.length === 7 && c.startsWith("#")) return c;
  return "#000000";
}

function StatusBarContent({ zoom }: { zoom: number }) {
  const theme = useGraphieTheme();
  const activeTool = useGraphieStore((s) => s.activeTool);
  const selectedIds = useGraphieStore((s) => s.selectedIds);
  const lastError = useGraphieStore((s) => s.lastError);
  const isReady = useGraphieStore((s) => s.isReady);
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
      <span>Tool: {activeTool}</span>
      <span>·</span>
      <span>Selection: {selectedIds.length}</span>
      {lastError && (
        <>
          <span>·</span>
          <span style={{ color: theme.colors.error }}>Error: {lastError}</span>
        </>
      )}
      <span style={{ marginLeft: "auto" }}>
        {isReady ? "Ready" : "Starting…"}
      </span>
      <span>·</span>
      <span>Zoom {zoom}%</span>
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
  const [sidebarView, setSidebarView] = useState<SidebarView>("templates");
  const [splitEnabled, setSplitEnabled] = useState(true);
  const [zoom, setZoom] = useState(100);
  const code = useGraphieStore((s) => s.code);
  const setCode = useGraphieStore((s) => s.setCode);
  const undo = useGraphieStore((s) => s.undo);
  const redo = useGraphieStore((s) => s.redo);
  const filename = useGraphieStore((s) => s.filename);
  const setFilename = useGraphieStore((s) => s.setFilename);
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
    (code: string, _title: string) => {
      setCode(code);
    },
    [setCode]
  );

  const native = useMemo(() => createNativeAPI(), []);

  const handleNew = useCallback(() => {
    setCode("");
    setFilename("Untitled.graphie");
    setDirty(false);
  }, [setCode, setFilename, setDirty]);

  const handleExport = useCallback(
    async (kind: ExportKind) => {
      const svg = await previewRef.current?.getSVG();
      if (!svg) return;
      await exportArtifact({
        svg,
        format: kind,
        dest: "download",
        filename: filename.replace(/\.graphie$/i, ""),
      });
    },
    [filename]
  );

  const toggleSidebar = useCallback(() => setSidebarCollapsed((p) => !p), []);

  const openTemplates = useCallback(() => {
    setSidebarCollapsed(false);
    setSidebarView("templates");
  }, []);

  // Global keyboard shortcuts (inert when focused in an editable field).
  // The store is read through getState() so the handler never works with a
  // stale document.
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
        const store = useGraphieStore.getState();
        if (e.shiftKey) {
          const next = window.prompt("Save diagram as", store.filename);
          if (next) {
            native.saveFile(store.code, next).then(() => {
              store.setFilename(next);
              store.setDirty(false);
            });
          }
        } else {
          native.saveFile(store.code, store.filename).then(() => {
            store.setDirty(false);
          });
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
  }, [native, toggleSidebar, undo, redo]);

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
          <AppMark aria-hidden>GB</AppMark>
          <TitleGroup>
            <AppTitle>Graphie Builder</AppTitle>
            <MenuBar
              onNew={handleNew}
              onUndo={undo}
              onRedo={redo}
              onToggleTheme={toggleScheme}
              onToggleSidebar={toggleSidebar}
              onRegraph={handleRegraph}
              onOpenTemplates={openTemplates}
              onExport={handleExport}
              colorScheme={colorScheme}
              sidebarCollapsed={sidebarCollapsed}
              splitEnabled={splitEnabled}
              onToggleSplit={() => setSplitEnabled((p) => !p)}
              zoom={zoom}
              setZoom={setZoom}
            />
          </TitleGroup>
        </TopBarLeading>

        <TopBarCenter>
          <DocumentTitle
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            aria-label="Document name"
            spellCheck={false}
          />
        </TopBarCenter>

        <TopBarTrailing>
          <ZoomControl zoom={zoom} setZoom={setZoom} />
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

      <Workbench>
        <ActivityBar $collapsed={false}>
          <ActivityRail
            view={sidebarView}
            onViewChange={(view) => {
              setSidebarView(view);
              setSidebarCollapsed(false);
            }}
          />
        </ActivityBar>
        <Sidebar $collapsed={sidebarCollapsed}>
          {sidebarCollapsed ? null : sidebarView === "templates" ? (
            <TemplatesPanel onLoadTemplate={handleLoadTemplate} />
          ) : sidebarView === "assets" ? (
            <PlaceholderPanel
              title="Assets"
              description="Images and reusable graphics will appear here."
            />
          ) : (
            <PlaceholderPanel
              title="Snippets"
              description="Reusable code fragments will appear here."
            />
          )}
        </Sidebar>
        <SplitArea>
          <PanelGroup direction="horizontal" style={{ height: "100%", width: "100%" }}>
            <Panel defaultSize={50} minSize={20}>
              <EditorPanel code={code} onChange={handleCodeChange} onRegraph={handleRegraph} />
            </Panel>
            {splitEnabled && (
              <>
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
                    zoom={zoom}
                  />
                </Panel>
              </>
            )}
          </PanelGroup>
        </SplitArea>
        <Inspector>
          <InspectorContent
            getSVG={() => previewRef.current?.getSVG() ?? Promise.resolve(null)}
          />
        </Inspector>
      </Workbench>

      <StatusBar>
        <StatusBarContent zoom={zoom} />
      </StatusBar>

      {children}
    </Root>
  );
}

export default Shell;
