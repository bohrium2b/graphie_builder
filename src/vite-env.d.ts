// TypeScript declarations for Vite and the Graphie Builder app.
//
// Augments React's JSX namespace so custom elements used in templates
// (e.g. math fields) typecheck in TSX.

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}

interface ElectronAPI {
  saveFile: (content: string, suggestedName: string) => Promise<string | null>;
  openFile: () => Promise<string | null>;
  copyText: (text: string) => Promise<void>;
  pasteText: () => Promise<string>;
  quit: () => Promise<void>;
  openExternal?: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
