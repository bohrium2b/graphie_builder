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

export {};
