// Electron main process for Graphie Builder.
//
// Creates the BrowserWindow (contextIsolation + nodeIntegration disabled,
// preload exposes a limited electronAPI via contextBridge) and registers
// allowlisted IPC handlers used by src/native/electron.ts:
//   save-file, open-file, copy-text, paste-text, quit
import { app, BrowserWindow, clipboard, dialog, ipcMain, shell } from "electron";
import fs from "node:fs";
import path from "node:path";

const isDev = !app.isPackaged;

function createWindow() {
  const iconPath = path.join(__dirname, "../build/icon.png");
  const win = new BrowserWindow({
    title: "Graphie Builder",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl = isDev
    ? "http://localhost:1420"
    : `file://${path.join(__dirname, "../dist/index.html")}`;
  win.loadURL(startUrl);

  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ---------------------------------------------------------------------------
// IPC handlers (allowlisted channels only)
// ---------------------------------------------------------------------------

ipcMain.handle("save-file", async (_, content: string, suggestedName: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: suggestedName,
    filters: [{ name: "Graphie Diagram", extensions: ["graphie"] }],
  });
  if (canceled || !filePath) return null;
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
});

ipcMain.handle("open-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Graphie Diagram", extensions: ["graphie"] }],
  });
  if (canceled || filePaths.length === 0) return null;
  return fs.readFileSync(filePaths[0], "utf8");
});

ipcMain.handle("copy-text", async (_, text: string) => {
  clipboard.writeText(text);
});

ipcMain.handle("paste-text", async () => {
  return clipboard.readText();
});

ipcMain.handle("quit", async () => {
  app.quit();
});

// Allow opening external links in the default browser.
ipcMain.handle("open-external", async (_, url: string) => {
  await shell.openExternal(url);
});
