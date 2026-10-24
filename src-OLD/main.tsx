import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline, CssVarsProvider } from "@mui/material";
  import theme from "./theme/theme";
import "./components/mafs-preview.css";
import "./theme/modern-tokens.css";

function Root() {
  // const [useModern, setUseModern] = useState(() => {
  //   if (typeof window !== "undefined") {
  //     return localStorage.getItem("graphie-theme") === "modern";
  //   }
  //   return false;
  // });
  const [useModern, setUseModern] = useState(true);
  useEffect(() => {
    localStorage.setItem("graphie-theme", useModern ? "modern" : "classic");
  }, [useModern]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b" && e.shiftKey) {
        setUseModern((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
