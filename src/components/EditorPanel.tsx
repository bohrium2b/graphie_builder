// CodeMirror 6-backed code editor for Graphie/JS code, via @uiw/react-codemirror.
//
// The editor is the source of truth for the diagram; the preview iframe
// re-renders on debounced change. Cmd/Ctrl+R triggers a regraph.

import { useEffect, useRef, useCallback } from "react";
import styled from "@emotion/styled";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { autocompletion } from "@codemirror/autocomplete";
import {
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { useGraphieTheme } from "../theme";
import { getGraphieCompletions } from "../graphie-completions";

interface EditorPanelProps {
  code: string;
  onChange: (value: string) => void;
  onRegraph: () => void;
}

// The editor must fill the panel it lives in, otherwise the CodeMirror
// scroller has no height and the content collapses to a single line (no
// vertical or horizontal scrolling possible).
const EditorRoot = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--color-editor-bg);

  .cm-editor {
    height: 100%;
  }

  .cm-scroller {
    overflow: auto !important;
  }
`;

const editorTheme = (dark: boolean) =>
  EditorView.theme(
    {
      "&": {
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        lineHeight: "20px",
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--color-primary)",
      },
      "&.cm-focused": {
        outline: "none",
      },
      ".cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: dark
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(0, 0, 0, 0.15)",
      },
      ".cm-gutters": {
        background: dark
          ? "var(--color-surface-level-1)"
          : "var(--color-surface-level-0)",
        color: "var(--color-outline-variant)",
        border: "none",
      },
      ".cm-activeLine": {
        background: "rgba(255, 255, 255, 0.04)",
      },
      ".cm-activeLineGutter": {
        background: "var(--color-surface-level-2)",
      },
      // Ensure the scroll region owns scrolling (vertical + horizontal) and
      // fills the editor container so overflow produces scrollbars.
      ".cm-scroller": {
        overflow: "auto",
        position: "relative",
        outline: "none",
      },
    },
    { dark }
  );

// CodeMirror 6 completion source for Graphie functions, constants, and label
// formats. Triggers on typing and on Ctrl+Space via the autocompletion keymap.
function graphieCompletionSource(
  context: CompletionContext,
): CompletionResult | null {
  const word = context.matchBefore(/[\w$\u00A0-\uFFFF]/);
  const from = context.pos - (word ? word.text.length : 0);
  const options = getGraphieCompletions().map((c) => ({
    label: c.label,
    type: c.kind,
    apply: c.insertText,
    detail: c.detail,
    info: c.documentation,
  }));
  return { from, options };
}

const graphieAutocomplete = autocompletion({
  override: [graphieCompletionSource],
  activateOnTyping: true,
  closeOnBlur: false,
});

export function EditorPanel({ code, onChange, onRegraph }: EditorPanelProps) {
  const onChangeRef = useRef(onChange);
  const onRegraphRef = useRef(onRegraph);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = useGraphieTheme();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onRegraphRef.current = onRegraph;
  }, [onRegraph]);

  const extensions = [
    javascript(),
    editorTheme(theme.colorScheme === "dark"),
    graphieAutocomplete,
  ];

  const handleChange = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChangeRef.current(value);
      }, 400);
    },
    []
  );

  // Cmd/Ctrl+R regraphs from anywhere in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
        const target = e.target as HTMLElement;
        const inEditor =
          target &&
          (target.tagName === "TEXTAREA" ||
            target.isContentEditable ||
            target.closest(".cm-editor"));
        if (inEditor) {
          e.preventDefault();
          onRegraphRef.current();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <EditorRoot>
      <CodeMirror
        value={code}
        onChange={(value: string) => handleChange(value)}
        extensions={extensions}
        height="100%"
        style={{ height: "100%", flex: 1, minHeight: 0, overflow: "hidden" }}
      />
    </EditorRoot>
  );
}
