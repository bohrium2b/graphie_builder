// Electron adapter for the native API.
//
// Calls into the preload script's `window.electronAPI` contextBridge, which
// forwards to the main process via ipcRenderer.invoke on allowlisted channels.
import { NativeAPI } from "./types";

function electronAPI(): any {
  return (window as any).electronAPI;
}

export function createElectronAPI(): NativeAPI {
  const saveFile = async (content: string, suggestedName: string) => {
    await electronAPI().saveFile(content, suggestedName);
  };

  const openFile = async () => {
    return electronAPI().openFile();
  };

  const copyText = async (text: string) => {
    await electronAPI().copyText(text);
  };

  const pasteText = async () => {
    return electronAPI().pasteText();
  };

  const quit = async () => {
    await electronAPI().quit();
  };

  return {
    shell: "electron",
    saveFile,
    openFile,
    copyText,
    pasteText,
    quit,
  };
}
