// Monaco-backed code editor for Graphie/Typst code.
//
// The editor is the source of truth for the diagram; the preview iframe
// re-renders on change. We expose the full code surface via `onChange` and
// provide a `Regraph` action (Cmd/Ctrl+R) that forces a re-render.

import { useEffect, useRef, useCallback, useState } from "react";
import { Box, Tooltip, IconButton, Typography } from "@mui/material";
import { PlayArrow as PlayIcon, RestartAlt as RestartIcon, AutoAwesome as SparkleIcon } from "@mui/icons-material";
import * as monaco from "monaco-editor";
import { getColorCompletions } from "../colors/catppuccin";
import { getGraphieCompletions } from "../graphie-completions";
import { DiagramWizard } from "./DiagramWizard";

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
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Debounced onChange: wait until the user stops typing before
  // propagating the value (and triggering safety checks / re-render).
  const emitChange = useCallback((value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChangeRef.current(value);
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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

    // Register Catppuccin color completion providers so users get
    // autocomplete for LATTE_ROSEWATER, MOCHA_BLUE, etc.
    const colorCompletions = getColorCompletions();
    const colorDisposable = monaco.languages.registerCompletionItemProvider(
      "javascript",
      {
        provideCompletionItems: (_model, position) => {
          const suggestions: monaco.languages.CompletionItem[] = colorCompletions.map(
            (c) => ({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Variable,
              detail: c.detail,
              documentation: c.documentation,
              insertText: c.insertText,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
            })
          );
          return { suggestions };
        },
      }
    );

    // Register Graphie function completions so users get
    // autocomplete for drawPoint, drawLine, plot, etc.
    const graphieCompletions = getGraphieCompletions();
    const graphieDisposable = monaco.languages.registerCompletionItemProvider(
      "javascript",
      {
        provideCompletionItems: (_model, position) => {
          const suggestions: monaco.languages.CompletionItem[] =
            graphieCompletions.map((c) => ({
              label: c.label,
              kind: c.kind,
              detail: c.detail,
              documentation: c.documentation,
              insertText: c.insertText,
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
            }));
          return { suggestions };
        },
      }
    );

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
      emitChange(v);
    });

    return () => {
      sub.dispose();
      colorDisposable.dispose();
      graphieDisposable.dispose();
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

  const handleInsertCode = useCallback((newCode: string) => {
    const ed = editorRef.current;
    if (!ed) return;
    const model = ed.getModel();
    if (!model) return;

    let position = ed.getPosition();
    // If the editor has never been focused, getPosition() returns null.
    // Fall back to the end of the document so the insert still happens
    // instead of silently doing nothing.
    if (!position) {
      const lineCount = model.getLineCount();
      position = {
        lineNumber: lineCount,
        column: model.getLineLength(lineCount) + 1,
      } as monaco.Position;
    }

    const range = {
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    };
    ed.executeEdits("diagram-wizard", [{
      range,
      text: newCode,
      forceMoveMarkers: true,
    }]);
    // Move the cursor to the end of the inserted text so the user can
    // keep typing.
    ed.setPosition({
      lineNumber: position.lineNumber,
      column: position.column + newCode.length,
    });
    ed.focus();
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <Box
        className="panel-header-glass"
        sx={{
          px: 2,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          minHeight: "var(--panel-header-height)",
        }}
      >
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
        <Typography variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
          JavaScript (Graphie)
        </Typography>
      </Box>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
      <Tooltip title="Diagram Wizard">
        <IconButton
          color="primary"
          onClick={() => setWizardOpen(true)}
          aria-label="diagram wizard"
          sx={{
            position: "absolute",
            bottom: 16,
            right: 16,
            zIndex: 100,
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          }}
        >
          <SparkleIcon sx={{ fontSize: 22 }} />
        </IconButton>
      </Tooltip>
      <DiagramWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onInsertCode={handleInsertCode}
      />
    </Box>
  );
}