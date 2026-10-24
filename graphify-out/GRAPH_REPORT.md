# Graph Report - src  (2026-10-13)

## Corpus Check
- Corpus is ~10,769 words - fits in a single context window. You may not need a graph.

## Summary
- 270 nodes · 488 edges · 12 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App Shell & Layout
- Theme System
- Form Controls
- Interactive Controls
- App Bar & Menu
- Panels & Gallery
- Diagram Canvas
- Color Palette Generation
- Canvas & Svelte
- Status Bar
- Properties Panel
- Tabs

## God Nodes (most connected - your core abstractions)
1. `alpha()` - 22 edges
2. `AppBar()` - 17 edges
3. `App()` - 10 edges
4. `AppSeparator()` - 9 edges
5. `shape` - 9 edges
6. `AppTabs()` - 7 edges
7. `glass()` - 7 edges
8. `generateTonalPalette()` - 7 edges
9. `AppMenu()` - 6 edges
10. `IconButton()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `Canvas()`  [EXTRACTED]
  App.tsx → components/canvas/Canvas.tsx
- `App()` --calls--> `AppBar()`  [EXTRACTED]
  App.tsx → components/layout/AppBar.tsx
- `App()` --calls--> `StatusBar()`  [EXTRACTED]
  App.tsx → components/layout/StatusBar.tsx
- `App()` --calls--> `PropertiesPanel()`  [EXTRACTED]
  App.tsx → components/panels/PropertiesPanel.tsx
- `App()` --calls--> `ToolPanel()`  [EXTRACTED]
  App.tsx → components/panels/ToolPanel.tsx

## Import Cycles
- None detected.

## Communities (12 total, 0 thin omitted)

### Community 0 - "App Shell & Layout"
Cohesion: 0.05
Nodes (22): App(), appContainerCss, canvasAreaCss, canvasWrapperCss, codeEditorWrapperCss, CodeEditor(), CodeEditorProps, editorContainerCss (+14 more)

### Community 1 - "Theme System"
Cohesion: 0.08
Nodes (24): COLOR_KEYS, ELEVATION_KEYS, injectThemeVars(), SHAPE_KEYS, ThemeContext, ThemeProvider(), ThemeProviderProps, themeToCssVars() (+16 more)

### Community 2 - "Form Controls"
Cohesion: 0.10
Nodes (25): Button(), ButtonColor, ButtonProps, ButtonSize, ButtonVariant, colorVars, sizeVars, StyledButton (+17 more)

### Community 3 - "Interactive Controls"
Cohesion: 0.11
Nodes (21): AppSlider(), AppSliderProps, StyledSliderRoot, StyledSliderThumb, StyledSliderTrack, AppSwitch(), StyledSwitchRoot, StyledSwitchThumb (+13 more)

### Community 4 - "App Bar & Menu"
Cohesion: 0.12
Nodes (24): IconButton(), AppMenu(), AppMenuProps, MenuItem, StyledMenuItem, StyledMenuPopup, StyledMenuSeparator, StyledMenuTrigger (+16 more)

### Community 5 - "Panels & Gallery"
Cohesion: 0.10
Nodes (22): AppSeparator(), AppSeparatorProps, StyledSeparator, gridCss, panelCss, panelHeaderCss, Template, templateCardCss (+14 more)

### Community 6 - "Diagram Canvas"
Cohesion: 0.12
Nodes (17): clear(), dispatch(), draw(), drawElements(), drawGrid(), drawMouseCoords(), elements, gridSize (+9 more)

### Community 7 - "Color Palette Generation"
Cohesion: 0.20
Nodes (12): generateTonalPalette(), getTone(), hexToOklch(), hexToRgb(), linearRgbChannel(), Oklch, oklchToCss(), oklchToRgb() (+4 more)

### Community 8 - "Canvas & Svelte"
Cohesion: 0.15
Nodes (11): Canvas(), CanvasProps, DiagramCanvasSvelte, SvelteComponent, SvelteInstance, SvelteWrapper(), SvelteWrapperProps, *.svelte (+3 more)

### Community 9 - "Status Bar"
Cohesion: 0.22
Nodes (10): centerStatusCss, coordinateCss, ExportButton(), leftInfoCss, rightControlsCss, StatusBar(), statusBarCss, StatusBarProps (+2 more)

### Community 10 - "Properties Panel"
Cohesion: 0.20
Nodes (10): contentCss, fieldGroupCss, FieldInput(), fieldLabelCss, inputCss, panelCss, panelHeaderCss, PropertiesPanel() (+2 more)

### Community 11 - "Tabs"
Cohesion: 0.48
Nodes (6): AppTabs(), AppTabsProps, StyledTabsList, StyledTabsPanel, StyledTabsRoot, StyledTabsTab

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `alpha()` connect `Form Controls` to `App Shell & Layout`, `Theme System`, `Interactive Controls`, `App Bar & Menu`, `Panels & Gallery`, `Status Bar`, `Properties Panel`, `Tabs`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `App Shell & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.0545790934320074 - nodes in this community are weakly interconnected._
- **Why does `AppBar()` connect `App Bar & Menu` to `App Shell & Layout`, `Form Controls`, `Interactive Controls`, `Panels & Gallery`, `Tabs`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `Theme System` be split into smaller, more focused modules?**
  _Cohesion score 0.0846774193548387 - nodes in this community are weakly interconnected._
- **Why does `shape` connect `Form Controls` to `App Shell & Layout`, `Theme System`, `Panels & Gallery`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `Form Controls` be split into smaller, more focused modules?**
  _Cohesion score 0.0989247311827957 - nodes in this community are weakly interconnected._
- **Should `Interactive Controls` be split into smaller, more focused modules?**
  _Cohesion score 0.10541310541310542 - nodes in this community are weakly interconnected._