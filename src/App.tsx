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

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Toolbar,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  Chip,
  Alert,
  Skeleton,
  Divider,
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
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
} from "@mui/icons-material";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

import { EditorPanel } from "./components/EditorPanel";
import { PreviewPanel, PreviewHandle } from "./components/PreviewPanel";
import { ExportMenu } from "./components/ExportMenu";
import { useGraphieStore } from "./store";
import { templates } from "./templates";
import { checkJsSafety } from "./security";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState<"code" | "visual">("code");
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(true);
  const previewRef = useRef<PreviewHandle>(null);

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
      {/* Toolbar: title leading, actions trailing (toolbars.md). */}
      <Toolbar
        variant="dense"
        disableGutters
        sx={{
          px: 1,
          gap: 1,
          minHeight: 48,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Leading: app identity + document title. */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 1 }}>
          <ImageIcon sx={{ color: "primary.main", fontSize: 22 }} />
          <Typography
            variant="subtitle1"
            component="span"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            Graphie Builder
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Center: mode switcher + template picker. */}
        <ToggleButtonGroup
          exclusive
          value={mode}
          onChange={(_, v) => v && setMode(v)}
          size="small"
          aria-label="editor mode"
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

        <Select
          value={selectedTemplate}
          onChange={(e) => loadTemplate(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 200 }}
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
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Re-render (Cmd/Ctrl+R in editor)">
            <IconButton color="primary" onClick={handleRegraph} aria-label="re-render">
              <PlayIcon />
            </IconButton>
          </Tooltip>

          <ExportMenu previewRef={previewRef} exporting={false} onError={setError} />

          <Tooltip title={showEditor ? "Hide editor" : "Show editor"}>
            <IconButton
              onClick={() => setShowEditor((v) => !v)}
              aria-label="toggle editor pane"
              color={showEditor ? "primary" : "default"}
            >
              <SidebarIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton aria-label="settings">
              <SettingsIcon />
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
          sx={{ borderRadius: 0, py: 0.5 }}
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
      </Box>
    </Box>
  );
}