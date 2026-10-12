// Augment React's JSX namespace so the MathLive `<math-field>` custom
// element can be used in TSX. MathLive registers this element at runtime
// when its module is imported (see src/main.tsx).
//
// The full MathLive API surface lives in `mathlive`'s bundled
// `types/mathlive.d.ts` (re-exported via `import "mathlive"`). We declare a
// minimal local `MathfieldElement` interface matching only the members we
// actually use in DiagramWizard.tsx so the component typechecks without
// depending on the exact internal layout of MathLive's type bundle.

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

declare global {
  interface MathfieldElement extends HTMLElement {
    getValue(): string;
    setValue(value?: string): void;
    hasFocus(): boolean;
    smartFence: boolean;
    smartMode: boolean;
    removeExtraneousParentheses: boolean;
    placeholder: string;
    value: string;
  }
}

export {};