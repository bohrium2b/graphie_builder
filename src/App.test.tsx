// Visual tests for the App shell.
//
// These render the real App component in jsdom and assert
// the HIG-relevant structure: toolbar with title and actions,
// split view with editor and preview, and integrated status
// feedback.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";
import { useGraphieStore } from "./store";

// The preview iframe and Monaco are heavy; stub them so the
// shell renders in jsdom. PreviewPanel is a forwardRef
// component, so the stub must forward the ref too. We use an
// async mock factory so React is imported inside the factory
// (not hoisted above the import).
vi.mock("./components/PreviewPanel", async () => {
  const React = await import("react");
  return {
    PreviewPanel: React.forwardRef(function StubPreview(props: any, ref: any) {
      return (
        <div data-testid="preview-panel" ref={ref}>
          <span data-testid="preview-code">{props.code}</span>
        </div>
      );
    }),
  };
});

vi.mock("./components/EditorPanel", () => ({
  EditorPanel: vi.fn(function StubEditor(props: any) {
    return (
      <div data-testid="editor-panel">
        <textarea
          data-testid="editor-input"
          value={props.code}
          onChange={(e: any) => props.onChange(e.target.value)}
        />
        <button data-testid="editor-regraph" onClick={props.onRegraph}>
          regraph
        </button>
      </div>
    );
  }),
}));

vi.mock("./components/ExportMenu", () => ({
  ExportMenu: vi.fn(function StubExport() {
    return <button data-testid="export-menu">Export</button>;
  }),
}));

// Monaco is not available in jsdom; the EditorPanel mock above
// replaces it, so no further stubbing is needed.

describe("App shell", () => {
  beforeEach(() => {
    useGraphieStore.setState({
      code: "",
      isReady: false,
      title: "Untitled diagram",
      lastError: null,
    });
  });

  it("renders the toolbar with the app title", () => {
    render(<App />);
    expect(screen.getByText("Graphie Builder")).toBeTruthy();
  });

  it("renders the editor and preview panes", () => {
    render(<App />);
    expect(screen.getByTestId("editor-panel")).toBeTruthy();
    expect(screen.getByTestId("preview-panel")).toBeTruthy();
  });

  it("loads the first template into the editor and preview", () => {
    render(<App />);
    // The first template is "Blank page" with empty code.
    // The preview should render it (empty string is valid).
    const previewCode = screen.getByTestId("preview-code").textContent;
    expect(previewCode).toBe("");
    // The template title is shown in the selector.
    expect(screen.getByText("Blank page")).toBeTruthy();
  });

  it("shows the template selector with the current template title", () => {
    render(<App />);
    // The Select renders the current template title.
    expect(screen.getByText("Blank page")).toBeTruthy();
    // The selector is labelled for accessibility.
    expect(screen.getByLabelText("template")).toBeTruthy();
  });

  it("shows the template selector with template titles", () => {
    render(<App />);
    // The Select renders the current template title.
    const first = screen.getByText(/Blank page|Simple plot/i);
    expect(first).toBeTruthy();
  });

  it("renders the export menu", () => {
    render(<App />);
    expect(screen.getByTestId("export-menu")).toBeTruthy();
  });

  it("toggles the editor pane visibility", () => {
    render(<App />);
    const toggle = screen.getByLabelText("toggle editor pane");
    fireEvent.click(toggle);
    expect(screen.queryByTestId("editor-panel")).toBeNull();
    fireEvent.click(screen.getByLabelText("toggle editor pane"));
    expect(screen.getByTestId("editor-panel")).toBeTruthy();
  });

  it("propagates editor changes to the preview", () => {
    render(<App />);
    const input = screen.getByTestId("editor-input") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "plot(x, X_RANGE);" } });
    expect(screen.getByTestId("preview-code").textContent).toBe(
      "plot(x, X_RANGE);"
    );
  });

  it("shows a security error inline when forbidden code is entered", () => {
    render(<App />);
    const input = screen.getByTestId("editor-input") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "eval('1+1');" } });
    expect(screen.getByRole("alert").textContent).toMatch(/eval/);
  });

  it("clears the error when the code becomes safe again", () => {
    render(<App />);
    const input = screen.getByTestId("editor-input") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "eval('1');" } });
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.change(input, { target: { value: "plot(x, X_RANGE);" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});