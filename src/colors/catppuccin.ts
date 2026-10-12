// Catppuccin color palette for Graphie Builder.
//
// These constants mirror the values in public/catppuccin.json and are
// available both as JS constants in the Graphie runtime (KhanUtil.LATTE_*)
// and as TypeScript types for editor autocomplete.

export type ColorKey =
  | "rosewater"
  | "flamingo"
  | "pink"
  | "mauve"
  | "red"
  | "maroon"
  | "peach"
  | "yellow"
  | "green"
  | "teal"
  | "sky"
  | "sapphire"
  | "blue"
  | "lavender"
  | "text"
  | "subtext1"
  | "subtext0"
  | "overlay2"
  | "overlay1"
  | "overlay0"
  | "surface2"
  | "surface1"
  | "surface0"
  | "base"
  | "mantle"
  | "crust";

export interface ColorDef {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  oklch: { l: number; c: number; h: number };
  accent: boolean;
}

export interface Theme {
  name: string;
  emoji: string;
  order: number;
  dark: boolean;
  colors: Record<ColorKey, ColorDef>;
  ansiColors: Record<string, {
    name: string;
    order: number;
    normal: { name: string; hex: string; rgb: { r: number; g: number; b: number }; hsl: { h: number; s: number; l: number }; oklch: { l: number; c: number; h: number }; code: number };
    bright: { name: string; hex: string; rgb: { r: number; g: number; b: number }; hsl: { h: number; s: number; l: number }; oklch: { l: number; c: number; h: number }; code: number };
  }>;
}

export interface CatppuccinPalette {
  version: string;
  latte: Theme;
  frappe: Theme;
  macchiato: Theme;
  mocha: Theme;
}

/** The full palette, loaded at build time from public/catppuccin.json. */
import paletteData from "../../public/catppuccin.json" with { type: "json" };

const typedPalette = paletteData as CatppuccinPalette;

export const palette: CatppuccinPalette = typedPalette;

/** Theme keys in display order. */
export const themeOrder: (keyof CatppuccinPalette)[] = [
  "latte",
  "frappe",
  "macchiato",
  "mocha",
] as const;

/** Build the set of Graphie runtime constants, e.g. LATTE_ROSEWATER -> "#dc8a78". */
export function buildRuntimeConstants(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const themeKey of themeOrder) {
    const theme = palette[themeKey] as Theme;
    const prefix = themeKey.toUpperCase();
    for (const colorKey of Object.keys(theme.colors) as ColorKey[]) {
      out[`${prefix}_${colorKey.toUpperCase()}`] = theme.colors[colorKey].hex;
    }
  }
  return out;
}

/** A flat list of completion suggestions for the Monaco editor. */
export function getColorCompletions(): {
  label: string;
  detail: string;
  insertText: string;
  documentation: string;
}[] {
  const out: {
    label: string;
    detail: string;
    insertText: string;
    documentation: string;
  }[] = [];
  for (const themeKey of themeOrder) {
    const theme = palette[themeKey] as Theme;
    const prefix = themeKey.toUpperCase();
    for (const [colorKey, def] of Object.entries(theme.colors) as [ColorKey, ColorDef][]) {
      const name = `${prefix}_${colorKey.toUpperCase()}`;
      out.push({
        label: name,
        detail: def.hex,
        insertText: name,
        documentation: `${theme.name} ${def.name} — ${def.hex}${def.accent ? " (accent)" : ""}`,
      });
    }
  }
  return out;
}