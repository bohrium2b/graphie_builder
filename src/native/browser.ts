// Browser fallback adapter for the native API.
//
// Used when running in a plain browser (no Tauri/Electron). Save writes a
// `.graphie` download via file-saver; Open prompts for raw graphie text;
// copy/paste use navigator.clipboard; quit is a best-effort window.close.

import { saveAs } from "file-saver";
import { NativeAPI } from "./types";

export function createBrowserAPI(): NativeAPI {
  const saveFile = (content: string, suggestedName: string) => {
    const blob = new Blob([content], { type: "application/graphie+json" });
    saveAs(blob, suggestedName);
    return Promise.resolve();
  };

  const openFile = () => {
    const code = window.prompt("Paste graphie code to open");
    return Promise.resolve(code !== null ? code : null);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard access denied
    }
  };

  const pasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch {
      return null;
    }
  };

  const quit = async () => {
    // window.close() only works for windows opened by script; best effort.
    try {
      window.close();
    } catch {
      // not closable
    }
  };

  return {
    shell: "browser",
    saveFile,
    openFile,
    copyText,
    pasteText,
    quit,
  };
}
