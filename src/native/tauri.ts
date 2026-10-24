// Tauri adapter for the native API.
//
// Uses the Tauri JS plugins (@tauri-apps/plugin-dialog, plugin-fs,
// plugin-clipboard-manager) and @tauri-apps/api. Requires the matching Rust
// plugins to be registered in src-tauri/src/lib.rs (.plugin(...) calls) plus
// the `invoke_handler` for any command-based fallbacks.
import { app } from "@tauri-apps/api";
import { save, open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager";
import { NativeAPI } from "./types";

export function createTauriAPI(): NativeAPI {
  const saveFile = async (content: string, suggestedName: string) => {
    // Ask the user where to save, then write the file.
    const path = (await save({
      defaultPath: suggestedName,
      filters: [{ name: "Graphie Diagram", extensions: ["graphie"] }],
    })) as string | null;
    if (!path) return; // user cancelled
    await writeTextFile(path, content);
  };

  const openFile = async () => {
    const paths = (await open({
      multiple: false,
      filters: [{ name: "Graphie Diagram", extensions: ["graphie"] }],
    })) as string[] | null;
    const path = paths?.[0] ?? null;
    if (!path) return null;
    return readTextFile(path);
  };

  const copyText = async (text: string) => {
    await writeText(text);
  };

  const pasteText = async () => {
    return readText();
  };

  const quit = async () => {
    await app.exit(0);
  };

  return {
    shell: "tauri",
    saveFile,
    openFile,
    copyText,
    pasteText,
    quit,
  };
}
