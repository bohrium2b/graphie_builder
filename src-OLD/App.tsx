// Graphie Builder application shell.
//
// Layout follows Apple HIG for a desktop (macOS) document app:
//   - A toolbar with the document title at the leading edge and
//     actions grouped at the trailing edge (toolbars.md).
//   - A split view with a thin divider between the code editor and
//     the live preview; panes are resizable and can be hidden
//     (split-views.md).
//   - Status feedback is integrated into the interface (a status
//     chip in the preview header), not delivered as alerts
//     (feedback.md).
//   - The appearance follows the system; there is no app-specific
//     appearance switch (dark-mode.md).
//   - Toolbar uses Liquid Glass material (materials.md, toolbars.md).

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Toolbar,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  ViewSidebar as SidebarIcon,
  Palette as ContrastIcon,
} from "@mui/icons-material";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { useColorScheme } from "@mui/material/styles";

import { EditorPanel } from "./components/EditorPanel";
import { PreviewPanel, PreviewHandle } from "./components/PreviewPanel";
import { ExportMenu } from "./components/ExportMenu";
import { ResourcesPanel } from "./components/ResourcesPanel";
import { useGraphieStore } from "./store";
import { templates } from "./templates";
import { checkJsSafety } from "./security";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState<"code" | "visual">("code");
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(true);
  const [showResources, setShowResources] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportAnchorRef = useRef<HTMLButtonElement>(null);
  const previewRef = useRef<PreviewHandle>(null);
  const { mode: colorScheme, systemMode } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Detect system accent color and apply to CSS custom property.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(color-display: dynamic-color)");
    const updateAccent = () => {
      if (mediaQuery.matches && CSS.supports("accent-color", "red")) {
        const computed = getComputedStyle(root);
        const accent = computed.accentColor || "";
        if (accent) {
          root.style.setProperty("--system-accent", accent);
        }
      }
    };
    updateAccent();
    mediaQuery.addEventListener("change", updateAccent);
    return () => mediaQuery.removeEventListener("change", updateAccent);
  }, []);

  const code = useGraphieStore((s) => s.code);
  const setCode = useGraphieStore((s) => s.setCode);
  const title = useGraphieStore((s) => s.title);
  const setTitle = useGraphieStore((s) => s.setTitle);
  const isReady = useGraphieStore((s) => s.isReady);

  // Load the first template on mount.
  useEffect(() => {
    setCode(templates[0].code);
    setTitle(templates[0].title);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function loadTemplate(index: number) {
    const t = templates[index];
    if (!t) return;
    setSelectedTemplate(index);
    setCode(t.code);
    setTitle(t.title);
    setError(null);
  }

  function handleRegraph() {
    setError(null);
    previewRef.current?.regraph();
  }

  function toggleColorScheme() {
    if (systemMode === "light") {
      document.body.setAttribute("data-mui-color-scheme", "dark");
      document.documentElement.setAttribute("data-mui-color-scheme", "dark");
    } else {
      document.body.setAttribute("data-mui-color-scheme", "light");
      document.documentElement.setAttribute("data-mui-color-scheme", "light");
    }
  }

  // Cmd/Ctrl+R regraphs from anywhere in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
        // Don't hijack the browser reload when the editor isn't focused.
        const target = e.target as HTMLElement;
        const inEditor =
          target && (target.tagName === "TEXTAREA" || target.isContentEditable);
        if (inEditor) {
          e.preventDefault();
          handleRegraph();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Toolbar: document title leading, actions trailing (toolbars.md).
          Uses Liquid Glass material (materials.md). */}
      <Toolbar
        variant="dense"
        disableGutters
        className="toolbar-glass"
        sx={{
          px: 2,
          gap: 2,
          minHeight: "var(--toolbar-height)",
        }}
      >
        {/* Leading: document title (toolbars.md: "Don't title windows with your app name"). */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            component="span"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 300,
            }}
            title={title}
          >
            {title || "Untitled"}
          </Typography>
        </Box>

        {/* Fixed space between leading and center groups (toolbars.md: "insert space between buttons"). */}
        <Box sx={{ width: 16 }} />

        {/* Center: mode switcher + template picker. */}
        <ToggleButtonGroup
          exclusive
          value={mode}
          onChange={(_, v) => v && setMode(v)}
          size="small"
          aria-label="editor mode"
          sx={{ borderRadius: "var(--radius-medium)" }}
        >
          <ToggleButton value="code" aria-label="Code editor">
            <CodeIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Code
          </ToggleButton>
          <ToggleButton value="visual" aria-label="Visual builder" disabled>
            <ImageIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Visual
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ width: 12 }} />

        <Select
          value={selectedTemplate}
          onChange={(e) => loadTemplate(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 220 }}
          aria-label="template"
          renderValue={() => templates[selectedTemplate]?.title ?? ""}
        >
          {templates.map((t, i) => (
            <MenuItem key={t.id} value={i}>
              {t.title}
            </MenuItem>
          ))}
        </Select>

        {/* Trailing: primary actions. */}
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
          {/* Color scheme toggle (respects system preference by default). */}
          <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton
              size="small"
              onClick={toggleColorScheme}
              aria-label={isDark ? "switch to light mode" : "switch to dark mode"}
              aria-pressed={isDark}
              sx={{ minWidth: 36, minHeight: 36 }}
            >
              <ContrastIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Primary action: Re-render (prominent style per toolbars.md) */}
          <Tooltip title="Re-render (Cmd/Ctrl+R in editor)">
            <IconButton
              color="primary"
              onClick={handleRegraph}
              aria-label="re-render"
              disabled={!isReady}
              sx={{ minWidth: 36, minHeight: 36 }}
            >
              <PlayIcon fontSize="large" />
            </IconButton>
          </Tooltip>

          <ExportMenu
            previewRef={previewRef}
            exporting={false}
            onError={setError}
            anchorRef={exportAnchorRef}
            open={showExportMenu}
            onClose={() => setShowExportMenu(false)}
            onOpen={() => setShowExportMenu(true)}
          />

          <Tooltip title="Resources (Catppuccin palette)">
            <IconButton
              onClick={() => setShowResources((v) => !v)}
              aria-label="resources"
              color={showResources ? "primary" : "default"}
              sx={{ minWidth: 36, minHeight: 36 }}
            >
              <SettingsIcon fontSize="large" />
            </IconButton>
          </Tooltip>

          <Tooltip title={showEditor ? "Hide editor" : "Show editor"}>
            <IconButton
              onClick={() => setShowEditor((v) => !v)}
              aria-label="toggle editor pane"
              color={showEditor ? "primary" : "default"}
              sx={{ minWidth: 36, minHeight: 36 }}
            >
              <SidebarIcon fontSize="large" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Integrated status feedback (feedback.md): errors render inline,
          not as modal alerts. */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ borderRadius: 0, py: 1, px: 2, mx: 0 }}
        >
          {error}
        </Alert>
      )}

      {/* Split view: editor | preview, thin divider (split-views.md). */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {showEditor && (
          <PanelGroup direction="horizontal" style={{ height: "100%", width: "100%" }}>
            <Panel defaultSize={40} minSize={15}>
              <EditorPanel
                code={code}
                onChange={(v) => {
                  const safety = checkJsSafety(v);
                  if (safety.ok) {
                    setError(null);
                  } else {
                    setError(safety.message ?? "Security error");
                  }
                  setCode(v);
                }}
                onRegraph={handleRegraph}
              />
            </Panel>
            <PanelResizeHandle className="resize-handle" />
            <Panel defaultSize={60} minSize={20}>
              <PreviewPanel ref={previewRef} code={code} onError={setError} />
            </Panel>
          </PanelGroup>
        )}
        {!showEditor && (
          <Box sx={{ flex: 1 }}>
            <PreviewPanel ref={previewRef} code={code} onError={setError} />
          </Box>
        )}
        {showResources && (
          <Box
            sx={{
              width: 360,
              borderLeft: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <ResourcesPanel onClose={() => setShowResources(false)} />
          </Box>
        )}
      </Box>
    </Box>
  );
}