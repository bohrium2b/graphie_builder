// Electron preload script.
//
// Exposes a limited `electronAPI` on `window` via contextBridge. The renderer
// can never reach ipcMain directly — only these allowlisted channels:
//   save-file, open-file, copy-text, paste-text, quit
import { contextBridge, ipcRenderer } from "electron";

const ALLOWED_CHANNELS = [
  "save-file",
  "open-file",
  "copy-text",
  "paste-text",
  "quit",
] as const;

type AllowedChannel = (typeof ALLOWED_CHANNELS)[number];

function invoke<Channel extends AllowedChannel>(
  channel: Channel,
  ...args: unknown[]
): Promise<unknown> {
  if (!ALLOWED_CHANNELS.includes(channel)) {
    throw new Error(`IPC channel not allowed: ${channel}`);
  }
  return ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld("electronAPI", {
  saveFile: (content: string, suggestedName: string) =>
    invoke("save-file", content, suggestedName),
  openFile: () => invoke("open-file"),
  copyText: (text: string) => invoke("copy-text", text),
  pasteText: () => invoke("paste-text"),
  quit: () => invoke("quit"),
});
