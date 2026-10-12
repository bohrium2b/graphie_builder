import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import App from "./App";

const lightPalette = {
  mode: "light" as const,
  primary: { main: "#0066cc", light: "#4d9fff", dark: "#004499", contrastText: "#ffffff" },
  secondary: { main: "#d12f2f", light: "#ff6b6b", dark: "#992222", contrastText: "#ffffff" },
  error: { main: "#d32f2f", light: "#ef5350", dark: "#c62828" },
  warning: { main: "#ed6c02", light: "#ff9800", dark: "#e65100" },
  success: { main: "#2e7d32", light: "#4caf50", dark: "#1b5e20" },
  background: { default: "#f5f5f7", paper: "#ffffff" },
  text: { primary: "#1d1d1f", secondary: "#595959", disabled: "#86868b" },
  divider: "#e5e5e7",
  action: { hover: "rgba(0,0,0,0.04)", selected: "rgba(0,0,0,0.08)", disabled: "rgba(0,0,0,0.26)", disabledBackground: "rgba(0,0,0,0.12)" },
};

const darkPalette = {
  mode: "dark" as const,
  primary: { main: "#4da3ff", light: "#80bdff", dark: "#0066cc", contrastText: "#000000" },
  secondary: { main: "#ff6b6b", light: "#ff9999", dark: "#cc3333", contrastText: "#000000" },
  error: { main: "#f44336", light: "#ef5350", dark: "#d32f2f" },
  warning: { main: "#ff9800", light: "#ffb74d", dark: "#f57c00" },
  success: { main: "#4caf50", light: "#81c784", dark: "#388e3c" },
  background: { default: "#1d1d1f", paper: "#2c2c2e" },
  text: { primary: "#f5f5f7", secondary: "#98989d", disabled: "#636366" },
  divider: "#38383a",
  action: { hover: "rgba(255,255,255,0.08)", selected: "rgba(255,255,255,0.12)", disabled: "rgba(255,255,255,0.3)", disabledBackground: "rgba(255,255,255,0.12)" },
};

function createAppTheme(mode: "light" | "dark") {
  const palette = mode === "light" ? lightPalette : darkPalette;
  return createTheme({
    palette,
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 13,
      htmlFontSize: 13,
      body1: { fontSize: "0.923rem", lineHeight: 1.5, fontWeight: 400 },
      body2: { fontSize: "0.846rem", lineHeight: 1.43, fontWeight: 400 },
      caption: { fontSize: "0.769rem", lineHeight: 1.4, fontWeight: 400 },
      button: { fontSize: "0.846rem", fontWeight: 600, textTransform: "none" },
      h6: { fontSize: "1.077rem", fontWeight: 600, lineHeight: 1.3 },
      subtitle1: { fontSize: "0.923rem", fontWeight: 600, lineHeight: 1.4 },
      subtitle2: { fontSize: "0.846rem", fontWeight: 500, lineHeight: 1.4 },
      overline: { fontSize: "0.769rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" },
    },
    shape: { borderRadius: 6 },
    spacing: 4,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": {
            "--toolbar-height": "44px",
            "--toolbar-bg-light": "rgba(255,255,255,0.72)",
            "--toolbar-bg-dark": "rgba(28,28,30,0.72)",
            "--panel-header-bg-light": "rgba(255,255,255,0.8)",
            "--panel-header-bg-dark": "rgba(44,44,46,0.8)",
            "--focus-ring": "var(--palette-primary-main)",
            "--divider-color": "var(--palette-divider)",
            "--text-primary": "var(--palette-text-primary)",
            "--text-secondary": "var(--palette-text-secondary)",
            "--bg-default": "var(--palette-background-default)",
            "--bg-paper": "var(--palette-background-paper)",
          },
          "*": {
            boxSizing: "border-box",
          },
          html: {
            fontSize: "13px",
            "-webkit-font-smoothing": "antialiased",
            "-moz-osx-font-smoothing": "grayscale",
          },
          "@media (prefers-reduced-motion: reduce)": {
            "*": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important",
            },
          },
          "@media (prefers-contrast: more)": {
            ":root": {
              "--focus-ring": "#000000",
            },
            "[data-mui-color-scheme='dark']": {
              "--focus-ring": "#ffffff",
            },
          },
          ":focus-visible": {
            outline: "2px solid var(--focus-ring)",
            outlineOffset: "2px",
          },
          "::selection": {
            backgroundColor: "var(--palette-primary-light)",
            color: "var(--palette-primary-contrastText)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.846rem",
            minHeight: "28px",
            minWidth: "28px",
            borderRadius: 6,
            "&:focus-visible": {
              outline: "2px solid var(--focus-ring)",
              outlineOffset: "2px",
            },
          },
          contained: {
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
          outlined: {
            borderWidth: "1px",
            "&:hover": { borderWidth: "1px" },
          },
          sizeSmall: {
            minHeight: "24px",
            minWidth: "24px",
            fontSize: "0.769rem",
            padding: "4px 10px",
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minHeight: "28px",
            minWidth: "28px",
            borderRadius: 6,
            "&:focus-visible": {
              outline: "2px solid var(--focus-ring)",
              outlineOffset: "2px",
            },
          },
          sizeSmall: {
            minHeight: "24px",
            minWidth: "24px",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: "none",
            backgroundImage: "none",
            border: "1px solid var(--divider-color)",
            backgroundColor: "var(--bg-paper)",
          },
          elevation0: { boxShadow: "none", border: "1px solid var(--divider-color)" },
          elevation1: { boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid var(--divider-color)" },
          elevation3: { boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "1px solid var(--divider-color)" },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: "44px",
            "@media (min-width: 600px)": { minHeight: "44px" },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiInputBase-root": {
              fontSize: "0.846rem",
              minHeight: "28px",
              borderRadius: 6,
            },
            "& .MuiInputLabel-root": { fontSize: "0.846rem" },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: { fontSize: "0.846rem" },
          select: { minHeight: "28px" },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { minHeight: "28px", fontSize: "0.846rem" },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontSize: "0.769rem",
            fontWeight: 500,
            height: "24px",
            borderRadius: 4,
          },
          sizeSmall: { height: "20px", fontSize: "0.692rem" },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: "var(--divider-color)", opacity: 1 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: "0.769rem",
            borderRadius: 4,
            padding: "6px 10px",
            backgroundColor: "rgba(0,0,0,0.85)",
            "@media (prefers-color-scheme: dark)": { backgroundColor: "rgba(255,255,255,0.9)" },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: "1px solid var(--divider-color)",
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { padding: "16px 20px", fontSize: "1.077rem", fontWeight: 600 },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { padding: "0 20px 20px" },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { padding: "12px 20px", gap: 8 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontSize: "0.846rem",
            fontWeight: 500,
            minHeight: "36px",
            textTransform: "none",
            "&:focus-visible": { outline: "2px solid var(--focus-ring)", outlineOffset: "2px" },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { height: 2, borderRadius: 1 },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            fontSize: "0.846rem",
            fontWeight: 500,
            borderRadius: 6,
            minHeight: "28px",
            padding: "6px 12px",
            "&:focus-visible": { outline: "2px solid var(--focus-ring)", outlineOffset: "2px" },
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: { borderRadius: 6, backgroundColor: "transparent" },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { fontSize: "0.846rem", padding: "8px 12px" },
          head: { fontWeight: 600, fontSize: "0.769rem", color: "var(--text-secondary)" },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 6, fontSize: "0.846rem" },
          standardError: { backgroundColor: "rgba(211,47,47,0.1)", color: "var(--palette-error-main)" },
          standardSuccess: { backgroundColor: "rgba(46,125,50,0.1)", color: "var(--palette-success-main)" },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: { borderRadius: 6, border: "1px solid var(--divider-color)", "&:before": { display: "none" } },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: { minHeight: "36px", borderRadius: 6, "&:focus-visible": { outline: "2px solid var(--focus-ring)", outlineOffset: "2px" } },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: { "&:focus-visible": { outline: "2px solid var(--focus-ring)", outlineOffset: "4px" } },
          thumb: { width: 16, height: 16, "&:focus-visible": { boxShadow: "0 0 0 4px var(--palette-primary-light)" } },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: { "&:focus-visible": { outline: "2px solid var(--focus-ring)", outlineOffset: "4px", borderRadius: 16 } },
        },
      },
    },
  });
}

const theme = createAppTheme("light");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);