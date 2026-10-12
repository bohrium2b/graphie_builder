# Design Review: Graphie Builder

**Platform:** Desktop (macOS/Windows/Linux via Electron/Tauri-style web app)
**Framework:** React + MUI (Material UI)
**App Category:** Document-based diagram editor for educators

---

## Summary

**Overall Rating: Needs Work**

Graphie Builder has a solid structural foundation — a classic document-app split view with toolbar, resizable editor/preview panes, and integrated status feedback. However, it diverges from macOS conventions in several high-impact ways: the toolbar titles the app instead of the document, hardcoded colors break dark mode and accessibility, custom dialogs replace system sheets/popovers, and the Inter font + MUI styling gives it a generic Material Design feel rather than a native macOS feel. The design lacks a distinctive point of view — it reads as a competent template, not a purpose-built tool for educators.

**Thesis:** A distraction-free diagram authoring tool where the canvas is the hero and code/visual modes stay in sync.
**Signature element:** None identified — the split view is standard, the color palette is borrowed (Catppuccin), and the typography is Inter (a safe default).

---

## Critical (Accessibility Failures)

### 1. Insufficient Color Contrast
**What:** Multiple hardcoded colors fail WCAG 4.5:1 minimum for text up to 17pt.
- `#6e6e73` (secondary text) on `#ffffff` = 4.3:1 (below 4.5:1)
- `#e0e0e0` (borders/dividers) on `#ffffff` = 1.4:1 (not text, but affects focus visibility)
- `#f5f5f7` (background) with `#1d1d1f` (primary text) = 12.6:1 ✓

**Why:** `accessibility.md › Vision`: "Strive to meet color contrast minimum standards... Text size up to 17 pts needs 4.5:1." `color.md › Inclusive color`: "Avoid using colors that make it hard to perceive content."

**Fix:** Replace all hardcoded hex colors with semantic MUI theme colors (`text.primary`, `text.secondary`, `divider`, `background.paper`, `background.default`) and extend the theme with proper light/dark variants that meet 4.5:1. For `#6e6e73` → use `text.secondary` with adjusted value `#595959` (7.0:1 on white).

### 2. No Dynamic Type / System Font Scaling Support
**What:** Font sizes hardcoded in px/rem (12px, 13px, 14px, 16px) with no response to OS text size settings.

**Why:** `accessibility.md › Vision`: "Support larger text sizes... Ideally, give people the option to enlarge text by at least 200 percent." `typography.md › Supporting Dynamic Type`: "Make sure your app's layout adapts to all font sizes."

**Fix:** Use CSS `clamp()` with `rem` units tied to root font-size, or implement a CSS custom property system that responds to `@media (prefers-reduced-motion)` and system zoom. For web, listen to `matchMedia('(prefers-reduced-motion: reduce)')` and respect browser zoom.

### 3. Missing Visible Keyboard Focus Indicators
**What:** Custom components (resize handle, DiagramWizard type cards, ColorSwatch, ColorToken) lack `:focus-visible` styles. MUI components may have focus but custom clickable divs do not.

**Why:** `accessibility.md › Mobility`: "Offer sufficiently sized controls... Consider spacing between controls as important as size." `accessibility.md › Speech`: "Let people use the keyboard alone to navigate... evaluate your app to ensure it works well with Full Keyboard Access."

**Fix:** Add `:focus-visible { outline: 2px solid var(--focus-ring-color); outline-offset: 2px; }` to all interactive custom elements. Use semantic `focus-ring-color` (system accent).

### 4. Control Sizes Below Minimum
**What:** Toolbar IconButtons use `size="small"` (24px), DiagramWizard cards have no minimum hit target, ColorSwatch is 48px but click target unclear.

**Why:** `accessibility.md › Mobility`: "Desktop: default 28x28 pt, minimum 20x20 pt." `buttons.md › Best practices`: "A button needs a hit region of at least 44x44 pt... to ensure people can select it easily."

**Fix:** Ensure all interactive targets meet 28x28pt (37px at 1x, 28px at 0.75x CSS). Use `min-height: 28px; min-width: 28px` on clickable elements.

---

## High (Platform Convention Breaks)

### 5. Toolbar Titles App Name, Not Document
**What:** Toolbar leading shows "Graphie Builder" + icon instead of the current document title.

**Why:** `toolbars.md › Titles`: "Don't title windows with your app name. Your app's name doesn't provide useful information about your content hierarchy... Write a concise title... under 15 characters."

**Fix:** Show `title` from store (document name) in toolbar leading. Move app identity to window title bar (handled by Electron/Tauri) or About menu.

### 6. No Menu Bar — Commands Only in Toolbar
**What:** All actions (Export, Regraph, Toggle Panes, Templates) exist only in toolbar. No menu bar with File, Edit, View, Window, Help.

**Why:** `designing-for-macos.md › Best practices`: "Use the menu bar to give people easy access to all the commands they need." `toolbars.md › Platform considerations › Desktop (macOS)`: "Make every toolbar item available as a command in the menu bar."

**Fix:** Add a native menu bar (via Electron `Menu.setApplicationMenu` or Tauri equivalent) with standard macOS menus: File (New, Open, Save, Export…), Edit (Undo, Redo, Cut, Copy, Paste), View (Toggle Editor, Toggle Resources, Zoom), Window (Minimize, Zoom), Help.

### 7. DiagramWizard Uses Dialog, Not Sheet
**What:** The wizard opens as a centered `Dialog` with `maxWidth="lg"`. On macOS, multi-step tasks in a document window should use a Sheet.

**Why:** `sheets.md › Platform considerations › Desktop (macOS)`: "A sheet is a cardlike view with rounded corners that floats on top of its parent window... Present a sheet in a reasonable default size." `sheets.md › Best practices`: "For complex or prolonged user flows, consider alternatives to sheets... In a macOS experience, you might want to open a new window or let people enter full-screen mode instead of using a sheet."

**Fix:** Convert to a Sheet-style presentation: attached to toolbar/top of window, same width as parent, with grabber, dimmed parent, `Escape` to dismiss.

### 8. ExportMenu Uses MUI Menu, Not Popover
**What:** Export dropdown is an MUI `Menu` anchored to button. On macOS, toolbar dropdowns use popovers with arrows pointing to the control.

**Why:** `popovers.md › Best practices`: "Position popovers appropriately. Make sure a popover's arrow points as directly as possible to the element that revealed it." `toolbars.md › Actions`: "Prefer system-provided symbols without borders."

**Fix:** Use MUI `Popover` with `anchorOrigin`/`transformOrigin` matching macOS popover behavior (arrow pointing to toolbar button).

### 9. ResourcesPanel Uses Tabs, Not Segmented Control / Sidebar
**What:** Resources panel uses MUI `Tabs` with three tabs (Latte, Mocha, Style Guide, Quick Guide).

**Why:** `segmented-controls.md` (implied): On macOS, few top-level sections in a panel use a segmented control (NSSegmentedControl) not tabs. Tabs are for window-level navigation.

**Fix:** Replace with `ToggleButtonGroup` (segmented control style) or move to a sidebar if content warrants.

### 10. Split View Divider Not System Thin Style
**What:** Custom `.resize-handle` at 1px with hover color change to `#1a73e8`.

**Why:** `split-views.md › Platform considerations › Desktop (macOS)`: "Prefer the thin divider style. The thin divider measures one point in width... Avoid using thicker divider styles unless you have a specific need."

**Fix:** Use 1px divider with system separator color, no hover color change (system handles this). Ensure `minSize` keeps divider visible.

### 11. Hardcoded Primary Color (Not System Accent)
**What:** Theme uses `#1a73e8` as primary. MUI components tint to this blue.

**Why:** `color.md › Platform considerations › Desktop (macOS) › App accent colors`: "Beginning in macOS 11, you can specify an accent color... If people set their accent color setting to a value other than multicolor, the system applies their chosen color... replacing your accent color."

**Fix:** Use MUI's `colorScheme` with CSS custom properties for accent, or read system accent via `window.matchMedia` (not fully supported on web). At minimum, use a semantic `primary` that adapts to light/dark and document it as customizable.

### 12. No Liquid Glass / System Materials
**What:** Toolbar, panels, dialogs use solid `background.paper` / `#ffffff` / `#f5f5f7`.

**Why:** `materials.md › Liquid Glass`: "Liquid Glass forms a distinct functional layer for controls and navigation elements... that floats above the content layer." `toolbars.md › Best practices`: "Reduce the use of toolbar backgrounds and tinted controls... use the content layer to inform the color and appearance of the toolbar."

**Fix:** Apply CSS `backdrop-filter: blur(20px) saturate(180%)` with semi-transparent background to toolbar and panel headers. Use `background: rgba(255,255,255,0.72)` (light) / `rgba(28,28,30,0.72)` (dark) for toolbar. Panels use standard material (opaque).

---

## Medium (Visual Design & Craft)

### 13. Inter Font Instead of System Font Stack
**What:** `fontFamily: '"Inter", system-ui, -apple-system, sans-serif'` loads Inter from Google Fonts.

**Why:** `typography.md › Using system fonts`: "San Francisco (SF) is a sans serif typeface family... The system provides the SF and NY fonts in the variable font format... Consider using the built-in text styles." `cross-platform.md`: "SF Pro, SF Compact, New York → Platform font... System UI font stack."

**Fix:** Remove Inter Google Font. Use `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif` (already in index.html but overridden by MUI theme). Update MUI theme `typography.fontFamily` to system stack.

### 14. MUI Paper Shadows Not macOS
**What:** `MuiPaper: { styleOverrides: { root: { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } } }`

**Why:** `materials.md › Platform considerations › Desktop (macOS)`: macOS uses vibrancy/materials, not elevation shadows for cards. Shadows suggest z-depth that doesn't match system windows.

**Fix:** Remove `boxShadow` from Paper. Use borders (`1px solid var(--divider)`) for separation. For elevated sheets/popovers, use `backdrop-filter` + subtle shadow.

### 15. Border Radius 10px Not System
**What:** `shape: { borderRadius: 10 }` applied globally.

**Why:** `buttons.md › Style`: "Standard buttons... have corner radii that are concentric with bar corners." macOS standard corner radius is 6-8pt for buttons, 8-12pt for panels/sheets.

**Fix:** Use 6px for buttons/inputs, 8px for cards/sheets, 12px for top-level sheets/dialogs. Not a single global value.

### 16. Inconsistent Spacing Scale
**What:** MUI spacing units (0.5, 1, 1.5, 2, 3) used inconsistently. Some hardcoded `px: 1`, `py: 0.5`, `gap: 1`, `mb: 2`.

**Why:** `layout.md › Visual hierarchy`: "Align elements to make them easier to scan... Use progressive disclosure to make layouts cleaner."

**Fix:** Define a spacing token system (4pt base) and use consistently. MUI's 8px unit is good; map to 4pt increments.

### 17. ResourcesPanel Content Density
**What:** ColorSwatch at 48x48px with 4 text lines, tight grid. ANSI table small.

**Why:** `layout.md › Visual hierarchy`: "Group related items to clearly express related information... Use progressive disclosure."

**Fix:** Increase swatch to 56x56px, reduce text to 2 lines (name + constant), use disclosure for ANSI/hex details.

### 18. DiagramWizard Stepper Not macOS
**What:** MUI `Stepper` with `alternativeLabel` and custom StepIconComponent=null.

**Why:** `sheets.md`: Multi-step sheets on macOS use a toolbar with back/next, not a stepper bar.

**Fix:** Replace Stepper with toolbar showing step title + Back/Next buttons. Or use a single scrolling sheet with progressive disclosure (Accordion).

---

## Low (Polish)

### 19. Toolbar Divider Between Groups
**What:** `<Divider orientation="vertical" />` between app identity and mode switcher.

**Why:** `toolbars.md › Item groupings`: "Insert space between buttons or other items where appropriate." Fixed space preferred over divider.

**Fix:** Replace with `sx={{ width: 12 }}` fixed space.

### 20. Mode Switcher Labels "Code"/"Visual" Not Title Case
**What:** ToggleButton labels are "Code" and "Visual" — correct title case, but MUI default is uppercase.

**Why:** `writing.md` (implied): "Capitalization follows the platform (Apple uses title-style for buttons, menu items, and titles)."

**Fix:** Ensure all button/menu labels use title-style capitalization.

### 21. Preview Panel Status Chip Variants
**What:** Chip uses `variant={rendered ? "filled" : "outlined"}` with success/error colors.

**Why:** `feedback.md`: "Consider integrating status feedback into your interface." Chip is good but colors should be semantic.

**Fix:** Use semantic status colors, ensure contrast in both modes.

### 22. Editor Panel Header Border Color Hardcoded
**What:** `borderBottom: "1px solid #e0e0e0"`

**Why:** `color.md`: "Avoid hard-coding system color values."

**Fix:** Use `borderColor: "divider"`.

---

## What Works (Keep)

1. **Split view architecture** — Editor | Preview with resizable panels matches `split-views.md` pattern for document apps.
2. **Toolbar structure** — Leading (title), Center (mode + template), Trailing (actions) matches `toolbars.md › Item groupings`.
3. **Integrated status feedback** — Error banner in toolbar area, not modal alert, matches `feedback.md`: "Consider integrating status feedback into your interface."
4. **Template picker in toolbar center** — Good placement for frequent document-level action.
5. **Keyboard shortcut (Cmd+R)** — `toolbars.md`: "Handle keyboard shortcuts to help people accelerate actions."
6. **Pane hiding** — Editor/Resources toggles match `split-views.md`: "Consider letting people hide a pane when it makes sense."
7. **Live preview in DiagramWizard** — Side-by-side config + preview is excellent progressive disclosure.
8. **MathLive integration** — Native math input field is a strong domain-appropriate choice.

---

## Platform Notes

### macOS (Primary Target)
- Needs native menu bar (Electron/Tauri)
- Needs Sheet presentation for Wizard
- Needs Popover for Export menu
- Needs system accent color respect
- Needs Liquid Glass toolbar
- Window title should be document name

### Windows/Linux (Secondary)
- Menu bar in window frame (not system menu bar)
- Dialogs instead of Sheets acceptable
- System accent via `@media (prefers-color-scheme)` and CSS accent-color
- MUI baseline more acceptable but still prefer system fonts

### Web (Current)
- Cannot fully replicate native menu bar, sheets, popovers
- Can approximate with careful CSS: backdrop-filter, semantic colors, system font stack
- Should detect `navigator.userAgent` for macOS and enhance

---

## Recommended Implementation Sequence

1. **Accessibility first** — Semantic color tokens, contrast fixes, focus styles, Dynamic Type support
2. **Platform conventions** — Toolbar title fix, menu bar (if Electron/Tauri), Sheet/Popover conversions
3. **Visual design** — System font, remove shadows, spacing tokens, border radius scale
4. **Craft** — Define signature element (e.g., live diagram preview as hero, Catppuccin as content-layer accent only)
5. **Polish** — Micro-interactions, reduced motion, dark mode testing