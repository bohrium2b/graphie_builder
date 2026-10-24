// Native API factory.
//
// Selects the shell adapter at runtime:
//   Tauri   -> window.__TAURI__ is present
//   Electron-> window.electronAPI (exposed by the preload contextBridge)
//   Browser -> file-saver / navigator.clipboard fallbacks
import { NativeAPI } from "./types";
import { createBrowserAPI } from "./browser";
import { createTauriAPI } from "./tauri";
import { createElectronAPI } from "./electron";

export function createNativeAPI(): NativeAPI {
  if (
    typeof window !== "undefined" &&
    (window as any).__TAURI__
  ) {
    return createTauriAPI();
  }
  if (
    typeof window !== "undefined" &&
    (window as any).electronAPI &&
    typeof (window as any).electronAPI.invoke === "function"
  ) {
    return createElectronAPI();
  }
  return createBrowserAPI();
}
