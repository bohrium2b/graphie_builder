import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import App from "./App";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1a73e8" },
    secondary: { main: "#ea4335" },
    background: { default: "#f5f5f7", paper: "#ffffff" },
    text: { primary: "#1d1d1f", secondary: "#6e6e73" },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    body1: { fontSize: 14 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
    MuiPaper: { styleOverrides: { root: { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } } },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);