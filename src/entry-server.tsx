import React from "react";
import { renderToString } from "react-dom/server";
import { ThemeSchemeProvider } from "./theme";
import App from "./App";
import "./theme/tokens.css";

export function render() {
  return renderToString(
    <React.StrictMode>
      <ThemeSchemeProvider>
        <App />
      </ThemeSchemeProvider>
    </React.StrictMode>
  );
}
