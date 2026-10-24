// Electron preload script.
//
// Exposes a limited `electronAPI` on `window` via contextBridge. The renderer
// can never reach ipcMain directly — only these allowlisted channels:
//   save-file, open-file, copy-text, paste-text, quit
const { contextBridge, ipcRenderer } = require("electron");

const ALLOWED_CHANNELS = ["save-file", "open-file", "copy-text", "paste-text", "quit"];

function invoke(channel, ...args) {
  if (!ALLOWED_CHANNELS.includes(channel)) {
    throw new Error(`IPC channel not allowed: ${channel}`);
  }
  return ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld("electronAPI", {
  saveFile: (content, suggestedName) => invoke("save-file", content, suggestedName),
  openFile: () => invoke("open-file"),
  copyText: (text) => invoke("copy-text", text),
  pasteText: () => invoke("paste-text"),
  quit: () => invoke("quit"),
});
