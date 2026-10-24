---
name: Graphie Builder M3 Design System
version: "1.0.0"
colors:
  # Base Material 3 Dynamic Color Tokens (Default Dark Theme - Charcoal & Science Slate)
  primary: "#a8c7fa"
  on-primary: "#063168"
  primary-container: "#004a98"
  on-primary-container: "#d6e3ff"
  
  secondary: "#7fcfff"
  on-secondary: "#003548"
  secondary-container: "#004d67"
  on-secondary-container: "#c2e8ff"
  
  tertiary: "#61d7c6"
  on-tertiary: "#003731"
  tertiary-container: "#005048"
  on-tertiary-container: "#80f4e2"
  
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  
  background: "#121316"
  on-background: "#e2e2e6"
  
  surface: "#121316"
  on-surface: "#e2e2e6"
  surface-variant: "#43474e"
  on-surface-variant: "#c3c6cf"
  outline: "#8d9199"
  outline-variant: "#43474e"
  
  # Workspace & Workbench Shell Tokens (VS Code / Google Docs Hybrid)
  workbench-bg: "#1a1c1e"
  activity-bar-bg: "#121316"
  sidebar-bg: "#1e2023"
  editor-bg: "#121316"
  canvas-workspace-bg: "#0d0e11"
  canvas-paper-bg: "#ffffff"
  status-bar-bg: "#004a98"
  status-bar-fg: "#d6e3ff"

typography:
  fontFamilySans: "Roboto Flex, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  fontFamilyMono: "JetBrains Mono, Fira Code, monospace"
  fontFamilyMath: "Latin Modern Math, STIX Two Math, KaTeX_Main, serif"
  
  display-md:
    fontFamily: Roboto Flex
    fontSize: 45px
    fontWeight: 400
    lineHeight: 52px
  title-lg:
    fontFamily: Roboto Flex
    fontSize: 22px
    fontWeight: 500
    lineHeight: 28px
  body-md:
    fontFamily: Roboto Flex
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px

rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 28px
  full: 9999px

elevation:
  level0: "none"
  level1: "0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)"
  level2: "0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)"
  level3: "0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)"
---

# Graphie Builder Design System

## Overview

Graphie Builder is a high-precision diagramming environment for science and mathematics. Its interface blends two core paradigms:

1. **VS Code Workbench Layout**: Dockable panels, collapsible sidebars, activity bar navigation, code editors, and real-time live preview splits.
2. **Google Docs Visual Document Shell**: Floating context-sensitive toolbars, document title controls, export bar, canvas pagination, and a clean, accessible layout.

The visual style is built upon **Google Material Design 3 (Material You)**, featuring dynamic color capabilities, surface container elevation tokens, and variable typography.

---

## Layout Architecture


```

+-----------------------------------------------------------------------------------+
| Top App Bar: (GB) Graphie Builder | File Edit View Insert Format Tools Help |    |
|                     [Document Title]                    [− 100% +] ☾ ⚙        |
+---+-------------------+------------------------------------+----------------------+
| A | Sidebar           | Split Editor Workbench             | Inspector Panel      |
| c |                   +-----------------+------------------+                      |
| t | - File Explorer   | Code Editor     | Canvas Preview   | - Graphie Properties |
| i | - Asset Manager   | (CodeMirror 6)  | (SVG / MathJax / | - Math Variables     |
| v | - Template Lib    |                 |  Interactive)    | - Export Settings    |
| i | - Typst/CeTZ      |                 |                  |                      |
| t |   Snippets        |                 | [Paper Grid]     |                      |
| y |                   |                 |                  |                      |
+---+-------------------+-----------------+------------------+----------------------+
| Status Bar (Engine State, MathJax Status, Zoom Level, Coordinates X:Y)            |
+-----------------------------------------------------------------------------------+

```

### Layout Elements
- **Top App Bar (56px)**: Product mark and title on the left, followed by a row
  of dropdown menus (File, Edit, View, Insert, Format, Tools, Help) that open
  floating panels anchored under their trigger — click to open, hover to switch
  between menus, full arrow-key navigation, Escape to close. The document title
  sits in the centre; the zoom control (`− 100% +`, percentage opens a preset
  dropdown), theme switch and settings sit on the right.
- **Activity Bar (Far Left)**: 48px slim rail containing primary mode triggers (Editor, Templates, Assets, Settings) using standard Material 3 navigation icons.
- **Collapsible Sidebar**: Resizable panel (240px default) for navigation and document structure.
- **Central Split View**: Adjustable pane separating the code editor from the live visual rendered output. Supports vertical and horizontal split modes.
- **Inspector Panel (Far Right)**: Contextual dynamic panel showing attributes of selected diagram elements, visual controls, and export parameters.
- **Status Bar (Bottom)**: 24px operational band providing real-time engine state, renderer health, line indicators, and zoom controls.

---

## UI Components & Recommended Libraries

To achieve a performant, maintainable, and fully customisable Material Design 3 layout across Rust/Tauri/Web environments, the following library ecosystem is recommended:

### Recommended Technology Stack
1. **Primary Component Library**: [Base UI](https://base-ui.com/) (by the creators of MUI, fully unstyled, accessible, performance-optimized) or [Radix Primitives](https://www.radix-ui.com/). [Emotion (`@emotion/react`, `@emotion/styled`)](https://emotion.sh/). Provides flexible runtime dynamic CSS-in-JS that dynamically maps M3 Design Tokens to components. 
2. **Dynamic Material You Theme Generation**: [@material/material-color-utilities](https://www.npmjs.com/package/@material/material-color-utilities)
   - Official Google library for generating complete M3 color schemes dynamically from user accent colors or source wallpapers.
3. **Resizable Dockable Layouts**: [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)
   - Highly performant, smooth, keyboard-accessible split views (identical to VS Code paning) without layout thrashing.
4. **Code Editor Environment**: [CodeMirror 6](https://codemirror.net/)
   - Lightweight, modular code editor with native support for dark modes, custom tokens, auto-completion, and high performance with large document streams.
5. **Canvas Pan & Zoom**: [react-zoom-pan-pinch](https://github.com/prcweb/react-zoom-pan-pinch)
   - Canvas wrapper providing hardware-accelerated pan, tilt, zoom, and fit-to-screen controls.
6. **Icons System**: [@mui/icons-material](https://mui.com/material-ui/material-icons/) or `lucide-react`
   - Comprehensive Material Design 3 iconography set.

---

## Color & Material 3 Theming Strategy

### Dynamic Seed Palette
Graphie Builder adopts M3 tonal palettes generated from a base seed color. Users can customize the accent color, which updates all operational surface levels, primary container tints, and highlight states automatically.

#### Dark Mode Palette Map (Default)
- **Primary Tint**: `#a8c7fa` — Used for active tab indicators, key action buttons, and primary selections.
- **Surface Elevation Containers**:
  - `Surface Level 0` (`#121316`): Base workspace background.
  - `Surface Level 1` (`#1c1d22`): Sidebar and panel backgrounds.
  - `Surface Level 2` (`#23242a`): Floating toolbars and active cards.
  - `Surface Level 3` (`#2a2b32`): Dialogs and elevated menus.
- **Canvas Paper Surface**: Light background (`#ffffff` or soft neutral `#f8f9fa`) embedded within the dark workspace to mirror publication outputs accurately.

---

## Typography & Typesetting Hierarchy

The typography structure combines clean UI sans-serif types with dedicated monospace and mathematical typefaces.

| Purpose | Font Family | Size / Weight | Usage |
|---|---|---|---|
| **UI Headings** | Roboto Flex / Inter | 18px–22px, Medium (500) | Panel Headers, Dialog Titles |
| **UI Body** | Roboto Flex / Inter | 13px–14px, Regular (400) | Labels, Buttons, Sidebar Items |
| **Code Editor** | JetBrains Mono | 13px, Regular (400) | Graphie, JavaScript, and Typst code |
| **Math Overlays** | Latin Modern / STIX Two | Dynamic (SVG render) | MathJax rendering & CeTZ text tags |

---

## Interactive Component Behaviors

### 1. Split Panel Handles
- Border width: 1px (`outline-variant`).
- Hover state: Accent glow (`primary`, 2px width) with 150ms ease transition.
- Dragging: Cursor changes to `col-resize` or `row-resize`.

### 2. Floating Canvas Controls (Google Docs Style)
- Pinned at the top or bottom center of the visual canvas.
- Surface: Material 3 `Surface Container High` (`#282a2f`) with `level2` elevation.
- Rounded corners: `full` pill style (28px radius).
- Actions: Quick grid toggles, axis overlays, zoom percentages, re-center canvas button, export trigger.

### 3. Editor Tabs (VS Code Style)
- Non-active tab: Transparent background, muted text (`on-surface-variant`).
- Active tab: Surface background with a top or bottom 2px primary accent bar (`primary-container`).
- Close button: Appears on hover, Material ripple effect on click.

---

## Do's and Don'ts

### Do
- **Maintain clear separation between workspace and canvas**: The app workspace should match the dark/light theme, while the document canvas stays faithfully rendered in publication format (white/transparent background).
- **Use Material 3 Surface Containers for elevation**: Depend on color tonal shifts rather than heavy drop shadows to distinguish UI panels.
- **Keep keyboard accessibility intact**: Ensure every panel, editor split, and floating tool can be navigated via standard hotkeys (`Ctrl/Cmd + B` for sidebar, `Ctrl/Cmd + \` for split).

### Don't
- **Don't mix sharp and rounded corners**: Stick strictly to M3 tokens (4px for small items, 8px–12px for cards/inputs, 28px for floating pills).
- **Don't clutter the editor viewport**: Keep visual editing overlays minimalist so the focus remains on the diagram canvas.
- **Don't force pure pitch black (`#000000`) backgrounds**: Use M3 dark surface tones (`#121316`) to reduce visual strain during long editing sessions.
