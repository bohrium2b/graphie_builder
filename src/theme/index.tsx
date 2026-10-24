// Graphie Builder Material Design 3 theme.
//
// Colors are taken directly from DESIGN.md (dark default + light variant).
// Components consume `theme.colors.*` via Emotion; raw CSS utilities consume
// the CSS variables in theme/tokens.css.

import type { Theme } from "@emotion/react";
import {
  ThemeProvider as EmotionThemeProvider,
  useTheme as useEmotionTheme,
} from "@emotion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

const dark = {
  primary: "#a8c7fa",
  onPrimary: "#063168",
  primaryContainer: "#004a98",
  onPrimaryContainer: "#d6e3ff",

  secondary: "#7fcfff",
  onSecondary: "#003548",
  secondaryContainer: "#004d67",
  onSecondaryContainer: "#c2e8ff",

  tertiary: "#61d7c6",
  onTertiary: "#003731",
  tertiaryContainer: "#005048",
  onTertiaryContainer: "#80f4e2",

  error: "#ffb4ab",
  onError: "#690005",
  errorContainer: "#93000a",
  onErrorContainer: "#ffdad6",

  background: "#121316",
  onBackground: "#e2e2e6",
  surface: "#121316",
  onSurface: "#e2e2e6",
  surfaceVariant: "#43474e",
  onSurfaceVariant: "#c3c6cf",
  outline: "#8d9199",
  outlineVariant: "#43474e",

  workbenchBg: "#1a1c1e",
  activityBarBg: "#121316",
  sidebarBg: "#1e2023",
  editorBg: "#121316",
  canvasWorkspaceBg: "#0d0e11",
  canvasPaperBg: "#ffffff",
  statusBarBg: "#004a98",
  statusBarFg: "#d6e3ff",

  surfaceLevel0: "#121316",
  surfaceLevel1: "#1c1d22",
  surfaceLevel2: "#23242a",
  surfaceLevel3: "#2a2b32",
};

const light = {
  primary: "#0041a2",
  onPrimary: "#ffffff",
  primaryContainer: "#0b57d0",
  onPrimaryContainer: "#001847",

  secondary: "#006970",
  onSecondary: "#ffffff",
  secondaryContainer: "#96f1fa",
  onSecondaryContainer: "#002022",

  tertiary: "#4b2faa",
  onTertiary: "#ffffff",
  tertiaryContainer: "#634ac3",
  onTertiaryContainer: "#1d0061",

  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",

  background: "#f7f9ff",
  onBackground: "#181c20",
  surface: "#f7f9ff",
  onSurface: "#181c20",
  surfaceVariant: "#dfe3e8",
  onSurfaceVariant: "#424654",
  outline: "#c3c6d6",
  outlineVariant: "#c3c6d6",

  workbenchBg: "#ebeef4",
  activityBarBg: "#f7f9ff",
  sidebarBg: "#f1f4fa",
  editorBg: "#ffffff",
  canvasWorkspaceBg: "#f7f9ff",
  canvasPaperBg: "#ffffff",
  statusBarBg: "#0b57d0",
  statusBarFg: "#ffffff",

  surfaceLevel0: "#ffffff",
  surfaceLevel1: "#f1f4fa",
  surfaceLevel2: "#e5e8ee",
  surfaceLevel3: "#dfe3e8",
};

export type ColorScheme = "light" | "dark";

export interface GraphieTheme {
  colorScheme: ColorScheme;
  colors: typeof dark;
  radius: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  elevation: {
    level0: string;
    level1: string;
    level2: string;
    level3: string;
  };
  layout: {
    toolbarHeight: string;
    panelHeaderHeight: string;
    sidebarWidth: string;
    statusBarHeight: string;
    activityBarWidth: string;
  };
  typography: {
    fontSans: string;
    fontMono: string;
    fontMath: string;
  };
}

const baseRadius = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "28px",
  full: "9999px",
};

const baseElevation = {
  level0: "none",
  level1: "0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)",
  level2: "0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)",
  level3: "0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)",
};

const baseLayout = {
  toolbarHeight: "48px",
  panelHeaderHeight: "32px",
  sidebarWidth: "240px",
  statusBarHeight: "24px",
  activityBarWidth: "48px",
};

const baseTypography = {
  fontSans:
    '"Roboto Flex", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontMono: '"JetBrains Mono", Fira Code, monospace',
  fontMath: '"Latin Modern Math", STIX Two Math, KaTeX_Main, serif',
};

export const darkTheme: GraphieTheme = {
  colorScheme: "dark",
  colors: dark,
  radius: baseRadius,
  elevation: baseElevation,
  layout: baseLayout,
  typography: baseTypography,
};

export const lightTheme: GraphieTheme = {
  colorScheme: "light",
  colors: light,
  radius: baseRadius,
  elevation: baseElevation,
  layout: baseLayout,
  typography: baseTypography,
};

export function themeFor(scheme: ColorScheme): GraphieTheme {
  return scheme === "light" ? lightTheme : darkTheme;
}

const STORAGE_KEY = "graphie-theme";
const DEFAULT_SCHEME: ColorScheme = "dark";

export function readStoredScheme(): ColorScheme {
  if (typeof window === "undefined") return DEFAULT_SCHEME;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return DEFAULT_SCHEME;
}

const ThemeSchemeContext = createContext<{
  colorScheme: ColorScheme;
  toggleScheme: () => void;
} | null>(null);

interface ThemeSchemeProviderProps {
  children: ReactNode;
}

export function ThemeSchemeProvider({ children }: ThemeSchemeProviderProps) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() =>
    readStoredScheme()
  );

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.colorScheme = colorScheme;
    try {
      window.localStorage.setItem(STORAGE_KEY, colorScheme);
    } catch {
      // storage unavailable
    }
  }, [colorScheme]);

  const toggleScheme = useCallback(() => {
    setColorScheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeSchemeContext.Provider value={{ colorScheme, toggleScheme }}>
      <EmotionThemeProvider theme={themeFor(colorScheme) as unknown as Theme}>
        {children}
      </EmotionThemeProvider>
    </ThemeSchemeContext.Provider>
  );
}

export function useThemeScheme() {
  const ctx = useContext(ThemeSchemeContext);
  if (!ctx) {
    throw new Error("useThemeScheme must be used within a ThemeSchemeProvider");
  }
  return ctx;
}

export function useGraphieTheme() {
  return useEmotionTheme() as unknown as GraphieTheme;
}

export default darkTheme;
