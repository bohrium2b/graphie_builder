// Monaco-backed code editor for Graphie/Typst code.
//
// The editor is the source of truth for the diagram; the preview iframe
// re-renders on change. We expose the full code surface via `onChange` and
// provide a `Regraph` action (Cmd/Ctrl+R) that forces a re-render.

import { useEffect, useRef } from "react";
import { Box, Tooltip, IconButton } from "@mui/material";
import { PlayArrow as PlayIcon, RestartAlt as RestartIcon } from "@mui/icons-material";
import * as monaco from "monaco-editor";

interface EditorPanelProps {
  code: string;
  onChange: (value: string) => void;
  onRegraph: () => void;
}

export function EditorPanel({ code, onChange, onRegraph }: EditorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const onChangeRef = useRef(onChange);
  const codeRef = useRef(code);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ed = monaco.editor.create(containerRef.current, {
      value: code,
      language: "javascript",
      automaticLayout: true,
      theme: "vs",
      minimap: { enabled: false },
      fontSize: 13,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: "on",
      scrollBeyondLastLine: false,
      mouseWheelZoom: true,
      padding: { top: 12, bottom: 12 },
    });
    editorRef.current = ed;

    // Cmd/Ctrl+R -> regraph. monaco.KeyMod.CtrlCmd is a modifier
    // bitmask; monaco.KeyCode.KeyR is the key. addCommand returns
    // the command id (a string). The command is cleaned up when
    // the editor is disposed below.
    ed.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR,
      () => onRegraph()
    );

    const sub = ed.onDidChangeModelContent(() => {
      const v = ed.getValue();
      codeRef.current = v;
      onChangeRef.current(v);
    });

    return () => {
      sub.dispose();
      ed.dispose();
    };
    // We intentionally only mount once; code prop syncs below.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external code changes (template load) into the editor.
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    if (ed.getValue() !== code) {
      const pos = ed.getPosition();
      ed.setValue(code);
      if (pos) ed.setPosition(pos);
    }
  }, [code]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: 1, py: 0.5, display: "flex", alignItems: "center", gap: 0.5, borderBottom: "1px solid #e0e0e0" }}>
        <Tooltip title="Re-render (Cmd/Ctrl+R)">
          <IconButton size="small" onClick={onRegraph} aria-label="re-render">
            <PlayIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear editor">
          <IconButton size="small" onClick={() => onChange("")} aria-label="clear">
            <RestartIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <span style={{ fontSize: 12, color: "#6e6e73", marginLeft: 8 }}>JavaScript (Graphie)</span>
      </Box>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
    </Box>
  );
}