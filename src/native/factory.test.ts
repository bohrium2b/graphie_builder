// Tests for the native API factory's runtime shell detection.

import { describe, beforeEach, afterEach, it, expect } from "vitest";
import { createNativeAPI } from "./factory";

function setShell(shell: "tauri" | "electron" | "browser") {
  (window as any).__TAURI__ = shell === "tauri" ? {} : undefined;
  (window as any).electronAPI =
    shell === "electron" ? { invoke: () => {} } : undefined;
}

describe("native factory", () => {
  beforeEach(() => {
    delete (window as any).__TAURI__;
    delete (window as any).electronAPI;
  });

  afterEach(() => {
    delete (window as any).__TAURI__;
    delete (window as any).electronAPI;
  });

  it("defaults to the browser adapter", () => {
    setShell("browser");
    const api = createNativeAPI();
    expect(api.shell).toBe("browser");
    expect(typeof api.saveFile).toBe("function");
    expect(typeof api.openFile).toBe("function");
    expect(typeof api.copyText).toBe("function");
    expect(typeof api.pasteText).toBe("function");
    expect(typeof api.quit).toBe("function");
  });

  it("detects Tauri via window.__TAURI__", () => {
    setShell("tauri");
    const api = createNativeAPI();
    expect(api.shell).toBe("tauri");
  });

  it("detects Electron via window.electronAPI", () => {
    setShell("electron");
    const api = createNativeAPI();
    expect(api.shell).toBe("electron");
  });
});
