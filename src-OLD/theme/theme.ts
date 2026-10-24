import { createTheme, type ThemeOptions } from "@mui/material/styles";
import "./tokens.css";

const RADIUS_NONE = 0;
const RADIUS_SM = "var(--radius-sm)";
const RADIUS_MD = "var(--radius-md)";
const RADIUS_LG = "var(--radius-lg)";
const RADIUS_XL = "var(--radius-xl)";
const RADIUS_FULL = "var(--radius-full)";

const FONT_SIZE = {
  XS: "var(--text-xs)",
  SM: "var(--text-sm)",
  BASE: "var(--text-base)",
  MD: "var(--text-md)",
  LG: "var(--text-lg)",
  XL: "var(--text-xl)",
  XL2: "var(--text-2xl)",
  XL3: "var(--text-3xl)",
  XL4: "var(--text-4xl)",
} as const;

const baseComponents = {
  MuiCssBaseline: {
    styleOverrides: {
      ":root": {
        "--focus-ring-color": "var(--color-primary)",
      },
      html: {
        fontSize: "var(--text-base-size)",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
      },
      body: {
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-base)",
        lineHeight: "var(--line-height-base)",
        fontWeight: "var(--font-weight-normal)",
        color: "var(--color-on-background)",
        backgroundColor: "var(--color-background)",
      },
      "code, pre": {
        fontFamily: "var(--font-mono)",
      },
      "code": {
        padding: "2px 6px",
        borderRadius: "var(--radius-sm)",
        backgroundColor: "rgba(0, 0, 0, 0.06)",
        fontSize: "0.85em",
      },
      "[data-mui-color-scheme='dark'] code": {
        backgroundColor: "rgba(255, 255, 255, 0.12)",
      },
      "kbd": {
        fontFamily: "var(--font-mono)",
        padding: "3px 6px",
        borderRadius: "var(--radius-sm)",
        backgroundColor: "rgba(0, 0, 0, 0.06)",
        fontSize: "0.85em",
        verticalAlign: "middle",
      },
      "ul, ol": {
        paddingLeft: "1.25em",
      },
      "li > p": {
        margin: 0,
      },
      "::-webkit-scrollbar": {
        width: "var(--scrollbar-width)",
        height: "var(--scrollbar-width)",
      },
      "::-webkit-scrollbar-track": {
        background: "transparent",
      },
      "::-webkit-scrollbar-thumb": {
        background: "var(--scrollbar-thumb-color)",
        borderRadius: "var(--scrollbar-thumb-radius)",
        border: "2px solid transparent",
        backgroundClip: "content-box",
      },
      "::-webkit-scrollbar-thumb:hover": {
        background: "var(--scrollbar-thumb-hover-color)",
        border: "2px solid transparent",
        backgroundClip: "content-box",
      },
    },
    "*, *::before, *::after": {
      boxSizing: "border-box",
    },
    "*": {
      scrollbarWidth: "thin",
      scrollbarColor: "var(--scrollbar-thumb-color) transparent",
    },
    "@media (prefers-reduced-motion: reduce)": {
      "*": {
        animationDuration: "0.01ms !important",
        animationIterationCount: "1 !important",
        transitionDuration: "0.01ms !important",
        scrollBehavior: "auto !important",
      },
    },
    "@media (prefers-reduced-transparency: reduce)": {
      ":root": {
        "--material-toolbar-bg": "var(--color-surface)",
        "--material-panel-header-bg": "var(--color-surface)",
        "--material-sheet-bg": "var(--color-surface)",
        "--material-popover-bg": "var(--color-surface)",
        "--material-backdrop-blur": "none",
      },
    },
    "@media (prefers-contrast: more)": {
      ":root": {
        "--color-outline": "var(--color-on-background)",
        "--color-outline-variant": "var(--color-on-background)",
        "--focus-ring-width": "3px",
        "--focus-ring-color": "CanvasText" in window.getComputedStyle(document.documentElement)
          ? "CanvasText"
          : "var(--color-on-background)",
      },
    },
    "@media (forced-colors: active)": {
      ":root": {
        "--color-primary": "CanvasText",
        "--color-on-primary": "Canvas",
        "--color-surface": "Canvas",
        "--color-on-surface": "CanvasText",
        "--color-background": "Canvas",
        "--color-on-background": "CanvasText",
        "--color-outline": "CanvasText",
        "--color-outline-variant": "CanvasText",
        "--material-border": "CanvasText",
        "--focus-ring-color": "Highlight",
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none",
        fontWeight: "var(--font-weight-semibold)",
        fontSize: FONT_SIZE.SM,
        minHeight: "var(--button-height-md)",
        minWidth: "var(--button-height-md)",
        borderRadius: RADIUS_MD,
        padding: "6px 16px",
        letterSpacing: "var(--tracking-normal)",
        boxShadow: "none",
        border: "1px solid transparent",
        transition: "background-color var(--duration-normal) var(--easing-standard), color var(--duration-normal) var(--easing-standard), border-color var(--duration-normal) var(--easing-standard), box-shadow var(--duration-normal) var(--easing-standard), transform var(--duration-fast) var(--easing-standard)",
        "&:hover": {
          boxShadow: "none",
          transform: "translateY(-1px)",
        },
        "&:active": {
          boxShadow: "none",
          transform: "translateY(0)",
        },
        "&:focus-visible": {
          outline: "var(--focus-ring-width) solid var(--focus-ring-color)",
          outlineOffset: "var(--focus-ring-offset)",
        },
        "&.Mui-disabled": {
          opacity: "var(--state-disabled-opacity)",
        },
      },
      contained: {
        boxShadow: "none",
        "&:hover": {
          boxShadow: "none",
        },
        "&:active": {
          boxShadow: "none",
        },
      },
      outlined: {
        borderWidth: "1px",
        "&:hover": {
          borderWidth: "1px",
        },
      },
      sizeSmall: {
        minHeight: "var(--button-height-sm)",
        minWidth: "var(--button-height-sm)",
        fontSize: FONT_SIZE.XS,
        padding: "4px 10px",
      },
      sizeLarge: {
        minHeight: "var(--button-height-lg)",
        minWidth: "var(--button-height-lg)",
        fontSize: FONT_SIZE.MD,
        padding: "8px 22px",
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        minHeight: "var(--icon-button-size-md)",
        minWidth: "var(--icon-button-size-md)",
        borderRadius: RADIUS_MD,
        transition: "background-color var(--duration-normal) var(--easing-standard), color var(--duration-normal) var(--easing-standard)",
        "&:focus-visible": {
          outline: "var(--focus-ring-width) solid var(--focus-ring-color)",
          outlineOffset: "var(--focus-ring-offset)",
        },
      },
      sizeSmall: {
        minHeight: "var(--icon-button-size-sm)",
        minWidth: "var(--icon-button-size-sm)",
      },
      sizeLarge: {
        minHeight: "var(--icon-button-size-lg)",
        minWidth: "var(--icon-button-size-lg)",
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: RADIUS_SM,
        minHeight: "var(--menu-item-height)",
        padding: "0 var(--space-3)",
        "&:focus-visible": {
          outline: "var(--focus-ring-width) solid var(--focus-ring-color)",
          outlineOffset: "var(--focus-ring-offset)",
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        boxShadow: "none",
        backgroundImage: "none",
        border: "var(--card-border-width) solid var(--color-outline-variant)",
        backgroundColor: "var(--color-surface)",
        borderRadius: RADIUS_LG,
      },
      elevation0: {
        boxShadow: "none",
        border: "var(--card-border-width) solid var(--color-outline-variant)",
      },
      elevation1: {
        boxShadow: "var(--shadow-xs)",
        border: "var(--card-border-width) solid var(--color-outline-variant)",
      },
      elevation2: {
        boxShadow: "var(--shadow-sm)",
        border: "var(--card-border-width) solid var(--color-outline-variant)",
      },
      elevation3: {
        boxShadow: "var(--shadow-md)",
        border: "var(--card-border-width) solid var(--color-outline-variant)",
      },
      elevation4: {
        boxShadow: "var(--shadow-lg)",
        border: "var(--card-border-width) solid var(--color-outline-variant)",
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: "var(--toolbar-height)",
        "@media (min-width: 600px)": {
          minHeight: "var(--toolbar-height)",
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        "& .MuiInputBase-root": {
          fontSize: FONT_SIZE.SM,
          minHeight: "var(--input-height-md)",
          borderRadius: RADIUS_MD,
        },
        "& .MuiInputLabel-root": {
          fontSize: FONT_SIZE.SM,
        },
        "& .MuiInputBase-input": {
          padding: "calc(var(--space-1) + 1px) var(--input-padding-inline)",
        },
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: {
        fontSize: FONT_SIZE.SM,
      },
      select: {
        minHeight: "var(--input-height-md)",
        padding: "calc(var(--space-1) + 1px) var(--input-padding-inline)",
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        minHeight: "var(--menu-item-height)",
        fontSize: FONT_SIZE.SM,
        borderRadius: RADIUS_SM,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontSize: FONT_SIZE.XS,
        fontWeight: "var(--font-weight-medium)",
        height: "var(--chip-height-md)",
        borderRadius: "var(--chip-radius)",
        transition: "background-color var(--duration-fast) var(--easing-standard), color var(--duration-fast) var(--easing-standard)",
      },
      sizeSmall: {
        height: "var(--chip-height-sm)",
        fontSize: FONT_SIZE.XS,
      },
      sizeMedium: {
        height: "var(--chip-height-md)",
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: "var(--divider-color)",
        opacity: 1,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        fontSize: FONT_SIZE.XS,
        borderRadius: "var(--tooltip-radius)",
        padding: "var(--tooltip-padding-block) var(--tooltip-padding-inline)",
        backgroundColor: "var(--tooltip-bg-light)",
        "@media (prefers-color-scheme: dark)": {
          backgroundColor: "var(--tooltip-bg-dark)",
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: RADIUS_XL,
        border: "var(--card-border-width) solid var(--color-outline-variant)",
        backgroundColor: "var(--color-surface)",
        boxShadow: "var(--shadow-lg)",
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        padding: "var(--space-4) var(--space-5)",
        fontSize: FONT_SIZE.LG,
        fontWeight: "var(--font-weight-semibold)",
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: "0 var(--space-5) var(--space-5)",
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: "var(--space-3) var(--space-5)",
        gap: "var(--space-2)",
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        fontSize: FONT_SIZE.SM,
        fontWeight: "var(--font-weight-medium)",
        minHeight: "var(--tab-height)",
        minWidth: "var(--tab-min-width)",
        textTransform: "none",
        padding: "0 var(--space-3)",
        "&:focus-visible": {
          outline: "var(--focus-ring-width) solid var(--focus-ring-color)",
          outlineOffset: "var(--focus-ring-offset)",
        },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: "var(--tab-indicator-height)",
        borderRadius: "var(--tab-indicator-radius)",
        backgroundColor: "var(--color-primary)",
      },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: {
        fontSize: FONT_SIZE.SM,
        fontWeight: "var(--font-weight-medium)",
        borderRadius: "var(--toggle-button-radius)",
        minHeight: "var(--toggle-button-height)",
        padding: "6px 12px",
        textTransform: "none",
        border: "1px solid var(--color-outline-variant)",
        backgroundColor: "transparent",
        color: "var(--color-on-surface-variant)",
        transition: "background-color var(--duration-normal) var(--easing-standard), color var(--duration-normal) var(--easing-standard), border-color var(--duration-normal) var(--easing-standard)",
        "&.Mui-selected": {
          backgroundColor: "var(--color-primary-container)",
          color: "var(--color-on-primary-container)",
          borderColor: "var(--color-primary)",
        },
        "&:focus-visible": {
          outline: "var(--focus-ring-width) solid var(--focus-ring-color)",
          outlineOffset: "var(--focus-ring-offset)",
        },
        "&:hover": {
          backgroundColor: "rgba(0, 0, 0, 0.04)",
        },
      },
    },
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: {
        borderRadius: "var(--toggle-button-radius)",
        backgroundColor: "transparent",
        gap: "var(--toggle-button-group-gap)",
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        fontSize: FONT_SIZE.SM,
        padding: "var(--table-cell-padding)",
      },
      head: {
        fontWeight: "var(--table-head-font-weight)",
        fontSize: FONT_SIZE.XS,
        color: "var(--table-head-color)",
        backgroundColor: "var(--color-surface-variant)",
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: RADIUS_MD,
        fontSize: FONT_SIZE.SM,
        padding: "var(--alert-padding)",
      },
      standardError: {
        backgroundColor: "var(--color-error-container)",
        color: "var(--color-on-error-container)",
      },
      standardSuccess: {
        backgroundColor: "var(--color-success-container)",
        color: "var(--color-on-success-container)",
      },
      standardWarning: {
        backgroundColor: "var(--color-warning-container)",
        color: "var(--color-on-warning-container)",
      },
      standardInfo: {
        backgroundColor: "var(--color-primary-container)",
        color: "var(--color-on-primary-container)",
      },
    },
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        borderRadius: RADIUS_MD,
        border: "1px solid var(--color-outline-variant)",
        boxShadow: "none",
        backgroundImage: "none",
        backgroundColor: "var(--color-surface)",
        "&:before": {
          display: "none",
        },
        "&.Mui-expanded": {
          margin: "0 0 8px 0",
        },
      },
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        minHeight: "var(--accordion-summary-height)",
        borderRadius: RADIUS_MD,
        padding: "0 var(--space-3)",
        "&:focus-visible": {
          outline: "var(--focus-ring-width) solid var(--focus-ring-color)",
          outlineOffset: "var(--focus-ring-offset)",
        },
      },
      content: {
        margin: "8px 0",
        "&.Mui-expanded": {
          margin: "8px 0",
        },
      },
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: {
        padding: "var(--space-3) var(--space-4) var(--space-4)",
      },
    },
  },
  MuiSlider: {
    styleOverrides: {
      root: {
        color: "var(--color-primary)",
        "&:focus-visible": {
          outline: "var(--focus-ring-width) solid var(--focus-ring-color)",
          outlineOffset: "var(--focus-ring-offset)",
        },
      },
      thumb: {
        width: "var(--slider-thumb-size)",
        height: "var(--slider-thumb-size)",
        borderRadius: "var(--slider-thumb-radius)",
        backgroundColor: "var(--color-primary)",
        boxShadow: "var(--shadow-sm)",
        "&:focus-visible": {
          boxShadow: "0 0 0 4px color-mix(in srgb, var(--color-primary) 24%, transparent)",
        },
        "&:hover": {
          boxShadow: "0 0 0 6px color-mix(in srgb, var(--color-primary) 12%, transparent)",
        },
      },
      track: {
        height: "var(--slider-track-height)",
        borderRadius: "var(--progress-radius)",
      },
      rail: {
        height: "var(--slider-track-height)",
        borderRadius: "var(--progress-radius)",
        backgroundColor: "var(--color-surface-variant)",
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: {
        "&:focus-visible": {
          outline: "var(--focus-ring-width) solid var(--focus-ring-color)",
          outlineOffset: "var(--focus-ring-offset)",
          borderRadius: RADIUS_FULL,
        },
      },
      track: {
        width: "var(--switch-track-width)",
        height: "var(--switch-track-height)",
        borderRadius: RADIUS_FULL,
        backgroundColor: "var(--color-surface-variant)",
        border: "1px solid var(--color-outline-variant)",
      },
      thumb: {
        width: "var(--switch-thumb-size)",
        height: "var(--switch-thumb-size)",
        backgroundColor: "var(--color-on-surface-variant)",
        boxShadow: "var(--shadow-xs)",
      },
      switchBase: {
        padding: 2,
        "&.Mui-checked": {
          transform: "translateX(16px)",
          "& .MuiSwitch-thumb": {
            backgroundColor: "var(--color-on-primary)",
          },
          "& + .MuiSwitch-track": {
            backgroundColor: "var(--color-primary)",
            borderColor: "var(--color-primary)",
          },
        },
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        height: "var(--progress-height)",
        borderRadius: "var(--progress-radius)",
        backgroundColor: "var(--color-surface-variant)",
      },
      bar: {
        borderRadius: "var(--progress-radius)",
        backgroundColor: "var(--color-primary)",
      },
    },
  },
  MuiCircularProgress: {
    styleOverrides: {
      root: {
        color: "var(--color-primary)",
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: "var(--menu-radius)",
        border: "var(--card-border-width) solid var(--color-outline-variant)",
        backgroundColor: "var(--color-surface)",
        boxShadow: "var(--menu-shadow)",
        backdropFilter: "var(--material-backdrop-blur)",
        WebkitBackdropFilter: "var(--material-backdrop-blur)",
        marginTop: "var(--space-1)",
      },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        borderRadius: "var(--popover-radius)",
        border: "var(--card-border-width) solid var(--color-outline-variant)",
        backgroundColor: "var(--color-surface)",
        boxShadow: "var(--popover-shadow)",
        backdropFilter: "var(--material-backdrop-blur)",
        WebkitBackdropFilter: "var(--material-backdrop-blur)",
      },
    },
  },
  MuiList: {
    styleOverrides: {
      root: {
        padding: "var(--space-1)",
      },
    },
  },
} as const;

const typography = {
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  htmlFontSize: 13,
  body1: {
    fontSize: "var(--text-base)",
    lineHeight: "var(--line-height-base)",
    fontWeight: "var(--font-weight-normal)",
  },
  body2: {
    fontSize: "var(--text-sm)",
    lineHeight: "var(--line-height-base)",
    fontWeight: "var(--font-weight-normal)",
  },
  caption: {
    fontSize: FONT_SIZE.XS,
    lineHeight: "var(--line-height-loose)",
    fontWeight: "var(--font-weight-normal)",
    letterSpacing: "var(--tracking-caption)",
  },
  button: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "var(--font-weight-semibold)",
    textTransform: "var(--button-text-transform)",
    letterSpacing: "var(--tracking-normal)",
  },
  h6: {
    fontSize: FONT_SIZE.LG,
    fontWeight: "var(--font-weight-semibold)",
    lineHeight: "var(--line-height-tight)",
    letterSpacing: "var(--tracking-tight)",
  },
  subtitle1: {
    fontSize: FONT_SIZE.BASE,
    fontWeight: "var(--font-weight-semibold)",
    lineHeight: "var(--line-height-tight)",
  },
  subtitle2: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "var(--font-weight-medium)",
    lineHeight: "var(--line-height-tight)",
  },
  overline: {
    fontSize: FONT_SIZE.XS,
    fontWeight: "var(--font-weight-semibold)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-wider)",
  },
  h5: {
    fontSize: FONT_SIZE.XL,
    fontWeight: "var(--font-weight-semibold)",
    lineHeight: "var(--line-height-tight)",
    letterSpacing: "var(--tracking-tight)",
  },
  h4: {
    fontSize: FONT_SIZE.XL2,
    fontWeight: "var(--font-weight-semibold)",
    lineHeight: "var(--line-height-tight)",
    letterSpacing: "var(--tracking-tight)",
  },
  h3: {
    fontSize: FONT_SIZE.XL3,
    fontWeight: "var(--font-weight-semibold)",
    lineHeight: "var(--line-height-tight)",
    letterSpacing: "var(--tracking-tight)",
  },
  h2: {
    fontSize: FONT_SIZE.XL4,
    fontWeight: "var(--font-weight-bold)",
    lineHeight: "var(--line-height-tight)",
    letterSpacing: "var(--tracking-tight)",
  },
  h1: {
    fontSize: "clamp(2rem, 5vw, 4rem)",
    fontWeight: "var(--font-weight-bold)",
    lineHeight: "var(--line-height-tight)",
    letterSpacing: "var(--tracking-tight)",
  },
} as const;

const themeOptions: ThemeOptions = {
  cssVariables: {
    colorSchemeSelector: "data-mui-color-scheme",
  },
  colorSchemes: {
    light: {
      palette: {
        mode: "light",
        primary: { main: "#0066cc", contrastText: "#ffffff" },
        secondary: { main: "#d12f2f", contrastText: "#ffffff" },
        error: { main: "#d32f2f", contrastText: "#ffffff" },
        warning: { main: "#ed6c02", contrastText: "#000000" },
        success: { main: "#2e7d32", contrastText: "#ffffff" },
        info: { main: "#0066cc", contrastText: "#ffffff" },
        background: {
          default: "#f5f5f7",
          paper: "#ffffff",
        },
        text: {
          primary: "#1d1d1f",
          secondary: "#595959",
          disabled: "#86868b",
        },
        divider: "#d1d1d6",
        action: {
          hover: "rgba(0, 0, 0, 0.04)",
          selected: "rgba(0, 0, 0, 0.08)",
          disabled: "rgba(0, 0, 0, 0.26)",
          disabledBackground: "rgba(0, 0, 0, 0.12)",
        },
      },
    },
    dark: {
      palette: {
        mode: "dark",
        primary: { main: "#4da3ff", contrastText: "#001d35" },
        secondary: { main: "#ff6b6b", contrastText: "#000000" },
        error: { main: "#f44336", contrastText: "#ffffff" },
        warning: { main: "#ff9800", contrastText: "#000000" },
        success: { main: "#4caf50", contrastText: "#000000" },
        info: { main: "#4da3ff", contrastText: "#001d35" },
        background: {
          default: "#1d1d1f",
          paper: "#2c2c2e",
        },
        text: {
          primary: "#f5f5f7",
          secondary: "#98989d",
          disabled: "#636366",
        },
        divider: "#38383a",
        action: {
          hover: "rgba(255, 255, 255, 0.08)",
          selected: "rgba(255, 255, 255, 0.12)",
          disabled: "rgba(255, 255, 255, 0.3)",
          disabledBackground: "rgba(255, 255, 255, 0.12)",
        },
      },
    },
  },
  typography,
  shape: {
    borderRadius: RADIUS_MD,
  },
  spacing: 4,
  components: baseComponents,
};

export const theme = createTheme(themeOptions);
export type AppTheme = typeof theme;
export default theme;
