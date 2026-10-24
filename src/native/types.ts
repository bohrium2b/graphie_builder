// Native shell abstraction.
//
// Graphie Builder can run inside Tauri, Electron, or a plain browser. This
// module defines a single `NativeAPI` interface implemented by an adapter per
// shell, selected at runtime by `createNativeAPI()` in factory.ts.

export type NativeShell = "tauri" | "electron" | "browser";

export interface NativeAPI {
  shell: NativeShell;
  saveFile: (content: string, suggestedName: string) => Promise<void>;
  openFile: () => Promise<string | null>;
  copyText: (text: string) => Promise<void>;
  pasteText: () => Promise<string | null>;
  quit: () => Promise<void>;
}
