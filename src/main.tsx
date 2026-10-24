import React from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { ThemeSchemeProvider } from "./theme";
import App from "./App";
import "./theme/tokens.css";

const rootEl = document.getElementById("root")!;

const tree = (
  <React.StrictMode>
    <ThemeSchemeProvider>
      <App />
    </ThemeSchemeProvider>
  </React.StrictMode>
);

if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, tree);
} else {
  createRoot(rootEl).render(tree);
}
