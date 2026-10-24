// Electron main process for Graphie Builder.
//
// Creates the BrowserWindow (contextIsolation + nodeIntegration disabled,
// preload exposes a limited electronAPI via contextBridge) and registers
// allowlisted IPC handlers used by src/native/electron.ts:
//   save-file, open-file, copy-text, paste-text, quit
//
// Packaged builds serve `dist/` through a custom `app://` protocol instead of
// `file://`. ES modules and stylesheets are fetched in CORS mode, which
// `file://` (an opaque origin) rejects, so the packaged app would load
// without CSS or JS. A privileged standard scheme behaves like http(s).
const {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  net,
  protocol,
  shell,
} = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const isDev = !app.isPackaged;
const distDir = path.join(__dirname, "../dist");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
]);

function registerAppProtocol() {
  protocol.handle("app", async (request) => {
    const { pathname } = new URL(request.url);
    const relative = decodeURIComponent(pathname).replace(/^\/+/, "");
    const filePath = path.join(distDir, relative || "index.html");
    // Never serve anything outside of dist/.
    if (!filePath.startsWith(distDir)) {
      return new Response("Not found", { status: 404 });
    }
    if (!fs.existsSync(filePath)) {
      return new Response("Not found", { status: 404 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

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
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl = isDev ? "http://localhost:1420" : "app://local/index.html";
  win.loadURL(startUrl);

  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  if (!isDev) registerAppProtocol();
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

ipcMain.handle("save-file", async (_, content, suggestedName) => {
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

ipcMain.handle("copy-text", async (_, text) => {
  clipboard.writeText(text);
});

ipcMain.handle("paste-text", async () => {
  return clipboard.readText();
});

ipcMain.handle("quit", async () => {
  app.quit();
});

// Allow opening external links in the default browser.
ipcMain.handle("open-external", async (_, url) => {
  await shell.openExternal(url);
});
