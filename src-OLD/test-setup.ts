Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

if (typeof (window as any).CSS === "undefined") {
  (window as any).CSS = { supports: () => false };
} else {
  (window as any).CSS.supports = () => false;
}
