# Graphie Builder - Design Document

## Design Philosophy

Graphie Builder is designed to strike a balance between power and simplicity. The core principle is: **provide the right level of abstraction for each task**. Visual editing should feel natural and immediate for beginners, while code editing should offer the full expressive power needed for complex diagrams.

Our design follows Apple's Human Interface Guidelines (HIG) with a focus on clarity, depth, and restraint. Every interface element exists to serve the user's goal of creating diagrams efficiently, without unnecessary decoration or cognitive overhead.

## Target Users

- **K-12 Teachers**: Creating worksheets, quizzes, exams, and instructional materials with mathematical diagrams
- **Higher Education Instructors**: Developing lecture slides, problem sets, and assessments
- **Students**: Learning to visualize and create mathematical concepts
- **Content Creators**: Producing educational resources for textbooks, videos, and online platforms
- **Researchers**: Creating publication-quality figures and technical illustrations

## Core Design Principles

### 1. Progressive Disclosure

- **Start simple**: New users (especially new teachers with limited technical experience) see a clean canvas with obvious tools, not an overwhelming feature set
- **Grow with expertise**: Advanced features reveal themselves contextually as users need them
- **Dual modes coexist**: Drag-and-drop and code editing aren't separate experiences - they're synchronized views of the same diagram
- **Low barrier to entry**: Teachers can create diagrams in minutes without learning Graphie/Typst syntax

### 2. Teacher-Centric Workflow

- **Worksheet-ready**: Exported diagrams are optimized for print (high-DPI, vector-first) and digital distribution
- **Batch-friendly**: Common diagram patterns are available as one-click templates for frequently used worksheet elements
- **Time-saving templates**: Curated template library organized by grade level and subject (functions, geometry, statistics, fractions, number lines, etc.)
- **Consistent styling**: Default styles are classroom-appropriate and print-friendly (high contrast, clean lines)
- **Shareable outputs**: Multiple export formats (PNG/JPEG for slides, SVG/PDF for print) with simple copy-to-clipboard for quick insertion into documents

### 3. Direct Manipulation

Following Apple's fluid interface principles:
- **1:1 tracking**: When dragging elements on canvas, they move precisely with the cursor/finger with no lag
- **Instant feedback**: Visual elements respond immediately to user input (hover, press, drag)
- **Interruptible interactions**: Dragging, resizing, or animating can be interrupted mid-action without breaking state
- **Velocity-aware**: Momentum and spring physics create natural-feeling interactions (especially important for touch interfaces)

### 4. Clarity & Focus

- **Minimal chrome**: The canvas takes precedence - UI chrome recedes when not needed
- **Purposeful spacing**: Consistent 8pt grid system for all padding, margins, and element spacing
- **Hierarchy through restraint**: Use color, weight, and spacing to establish hierarchy, not shadows or decoration
- **Content-first**: The diagram being created is always the focal point
- **Reduced cognitive load**: Labels and controls use clear, non-technical language for educators

### 5. Consistency Across Platforms

- **Platform-native feel**: Adhere to macOS, Windows, and Linux conventions while maintaining a unified brand identity
- **Respect system UI**: Follow system behaviors for windows, menus, keyboard shortcuts, and accessibility
- **Adapt to context**: Layouts respond appropriately to window size, DPI scaling, and light/dark modes

### 6. Precision & Professionalism

- **Mathematical correctness**: The rendering pipeline must produce clean, accurate mathematical notation
- **Publication quality**: All export formats (SVG, PDF, PNG) should meet professional publishing standards
- **Non-destructive workflows**: All edits are reversible; code and visual state remain synchronized and lossless
- **Print-ready**: SVG/PDF exports maintain crisp lines at any scale for printing on worksheets

## User Experience Design

### Information Architecture

The application is organized around a single primary workspace with main regions:

1. **Toolbar** (Top) - Primary actions, mode switcher, export options, and global tools
2. **Editor Panel** (Left/Right, resizable) - Code editor or component library depending on mode
3. **Canvas/Preview** (Main) - Live rendered diagram with pan/zoom controls
4. **Properties Panel** (Right, collapsible) - Element properties, styling, and configuration
5. **Status Bar** (Bottom) - Rendering status, errors, zoom level, and coordinates
- **Example gallery**: Curated examples by subject and grade level teachers can load and modify
- **Zero-setup**: Runs as a native desktop app - no account, no cloud required, works offline for classroom use

## Design References

- [Apple Human Interface Guidelines](../extras/apple-hig) - Core platform design guidance
- [Apple Design Skill](../extras/apple-design-skill) - Advanced fluid interface patterns
- [Material Design 3](https://m3.material.io/) - Component patterns and accessibility
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) - Accessibility standards
- [graphie-to-png](../graphie-to-png) - Reference implementation for Graphie integration patterns
