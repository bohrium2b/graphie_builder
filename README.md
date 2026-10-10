# Graphie Builder

Graphie Builder is an open-source, cross-platform application for creating professional mathematical and scientific diagrams. It combines the simplicity of visual editing with the power of programmatic diagram generation, making it ideal for educators, students, researchers, and content creators who need precise, publication-quality graphics.

## Overview

Graphie Builder bridges the gap between intuitive drag-and-drop interfaces and code-driven diagram creation. It uses [Khan Academy's Graphie library](https://github.com/Khan/khan-exercises/tree/master/utils/graphie) for most diagramming tasks, and falls back to [Typst](https://typst.app/)'s powerful [CeTZ](https://github.com/johannes-wolf/typst-cetz) ecosystem (including `cetz-plot` and `circuiteria`) when more advanced visualizations are needed.

The application runs as a native desktop app (via [Tauri](https://tauri.app/) with a potential [Electron](https://www.electronjs.org/) fallback) while maintaining a consistent, modern user experience that follows Apple's Human Interface Guidelines (HIG).

## Features

### Diagram Creation

- **Dual Editing Modes**: Switch seamlessly between a visual drag-and-drop editor and a manual code editor for precise control
- **Graphie Support**: Full access to Khan Academy's Graphie API for creating coordinate systems, plots, geometric figures, number lines, charts, and more
- **Typst + CeTZ Support**: For complex cases where Graphie is insufficient, write or generate Typst code using CeTZ, cetz-plot, and circuiteria packages
- **Live Preview**: Real-time rendering as you edit, with synchronized highlighting between visual and code views
- **Math Typesetting**: Proper mathematical notation using MathJax's SVG renderer for clean, scalable output
- **Template Library**: Pre-built templates for common diagrams (functions, geometry, statistics, 3D nets, polar plots, etc.)

### Export Options

- **PNG**: High-quality raster images with options for download or direct clipboard copy
- **JPEG**: Compressed raster format for web use, with download or clipboard support  
- **SVG**: Vector graphics perfect for print and scaling, with download or clipboard support
- **PDF**: Publication-ready documents with precise layout and vector quality

### User Interface

- **Cross-Platform Native**: Built with Tauri for optimal performance and small binary size on macOS, Windows, and Linux
- **Apple HIG Compliance**: Clean, focused interface that respects platform conventions for layout, typography, spacing, and interactions
- **Material UI Design System**: Consistent, accessible components with a thoughtfully curated color palette
- **Responsive Layout**: Adapts gracefully to different window sizes and screen configurations
- **Dark Mode Support**: Automatic and manual theme switching for comfortable viewing in any lighting condition
- **Keyboard-First**: Comprehensive keyboard shortcuts for efficient workflow
- **Accessibility**: Built with screen reader support and keyboard navigation in mind

### Editing Experience

- **Drag-and-Drop Canvas**: Intuitive visual editing with smart guides, snap-to-grid, and precise positioning
- **Code Editor**: Syntax-highlighted editor (powered by Ace/Monaco) with auto-completion hints for Graphie and Typst APIs
- **Split View**: View canvas and code side-by-side for maximum productivity
- **Undo/Redo**: Full history stack for both visual and code editing
- **Asset Management**: Support for images and custom graphics in diagrams

## Use Cases

- **Mathematics Education**: Create function plots, geometric constructions, proofs, and interactive examples
- **Science Education**: Generate circuit diagrams, graphs, models, and visualizations
- **Assessment Creation**: Build diagrams for quizzes, exams, worksheets, and homework
- **Content Creation**: Produce graphics for textbooks, slides, videos, and online courses
- **Research & Academia**: Create publication-quality figures and technical illustrations

## Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Desktop Framework | [Tauri](https://tauri.app/) (Rust + WebView) | Native cross-platform app shell with minimal overhead |
| Alternative Framework | [Electron](https://www.electronjs.org/) | Fallback option for environments where Tauri isn't suitable |
| Frontend UI | [React](https://react.dev/) | Primary application shell, routing, state management |
| Interactive Components | [Svelte](https://svelte.dev/) | Lightweight, performant components for canvas and editors |
| UI Component Library | [Material UI (MUI)](https://mui.com/) | Consistent, accessible UI primitives |
| Diagram Engine | [Graphie](https://github.com/Khan/khan-exercises/tree/master/utils/graphie) | Core diagramming and coordinate system library |
| Advanced Typesetting | [Typst](https://typst.app/) + [CeTZ](https://github.com/johannes-wolf/typst-cetz) | Complex diagrams, plots, and circuits |
| Math Rendering | [MathJax](https://www.mathjax.org/) (SVG output) | Clean, standard SVG math typesetting |
| Code Editor | [Ace Editor](https://ace.c9.io/) | Syntax highlighting and code editing |
| Export Pipeline | Custom + Browser APIs | Raster/vector/PDF generation |

## Development

Graphie Builder uses [devenv](https://devenv.sh/) to provide a reproducible development environment with all required dependencies.

```bash
# Enter development shell
devenv shell

# Install dependencies (handled automatically by devenv)
yarn install  # or npm install

# Run in development mode
yarn dev  # Starts both frontend and Tauri dev server

# Build for production
yarn build
yarn tauri build
```

### Requirements

- Node.js (latest via devenv)
- Rust (stable via devenv, required for Tauri)
- Platform-specific build dependencies (handled by devenv.nix)

## Project Status

This is an active project under development. The core vision is to provide a unified, intuitive tool for creating mathematical and scientific diagrams with professional output quality.

## Related Projects

- [graphie-to-png](./graphie-to-png) - Legacy web service for converting Graphie code to PNG images
- [Apple HIG Reference](./extras/apple-hig) - Apple's Human Interface Guidelines for design reference
- [Apple Design Skill](./extras/apple-design-skill) - Design review tooling and guidelines

## License

[License details to be determined]

## Quick Start

### Prerequisites

- [devenv](https://devenv.sh/) installed (recommended for reproducible environment)
- Or manually: Node.js 20+, Yarn, Rust stable toolchain

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd graphie_builder

# Enter dev environment (if using devenv)
devenv shell

# Install dependencies
yarn install

# Start development server
yarn dev
```

### Building

```bash
# Build for production
yarn build
yarn tauri build
```

The built application will be available in `src-tauri/target/release/bundle/` for your platform.
