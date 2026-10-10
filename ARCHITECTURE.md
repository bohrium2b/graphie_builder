# Graphie Builder - Architecture Document

## Architecture Overview

Graphie Builder is a hybrid desktop application that combines a Rust-based native shell (Tauri) with a modern web-based UI, orchestrating multiple rendering engines to produce professional mathematical diagrams. The architecture is modular, extensible, and designed for both performance and maintainability, with a focus on being teacher-friendly and classroom-ready.

## High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Tauri Shell (Rust)                      │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Window Manager │  │ File System  │  │ Clipboard/OS    │ │
│  │ & IPC Bridge   │  │ Access       │  │ Integration     │ │
│  └────────┬────────┘  └──────┬───────┘  └────────┬────────┘ │
└───────────┼─────────────────┼─────────────────────┼────────┘
            │ Tauri IPC       │                     │
            ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Web Frontend (TS/React/Svelte)          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                State Management (Zustand)             ││
│  └─────────────┬─────────────────────┬───────────────────┘│
│                │                     │                     │
│                ▼                     ▼                     ▼
│  ┌─────────────────────┐ ┌─────────────────┐ ┌─────────────┐│
│  │  Visual Canvas     │ │ Code Editor     │ │ Export      ││
│  │  (Drag & Drop)     │ │ (Ace/Monaco)    │ │ Pipeline    ││
│  └────────┬──────────┘ └────────┬────────┘ └─────┬───────┘│
└───────────┼─────────────────────┼────────────────┼────────┘
            │                     │                │
            ▼                     ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Rendering Engines                        │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐│
│  │ Graphie Engine  │  │ Typst + CeTZ     │  │ MathJax SVG ││
│  │ (Khan JS)       │  │ (via WASM)       │  │ Renderer    ││
│  └────────┬────────┘  └────────┬─────────┘  └─────────────┘│
└───────────┼───────────────────┼────────────────────────────┘
            │                   │
            ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Output Pipeline                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐│
│  │ SVG     │  │ PNG     │  │ JPEG    │  │ PDF            ││
│  │ Export  │  │ Export  │  │ Export  │  │ Export          ││
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```
- **Pre-Algebra**: Number lines, fractions (pie charts, fraction bars), decimals, integers
- **Statistics**: Bar graphs, histograms, box plots, dot plots, scatter plots, Venn diagrams
- **Calculus**: Riemann sums, slope fields, tangent lines, area between curves
- **Science/Other**: Tape diagrams, area models, clock diagrams, nets (3D), circuits (via CeTZ)

**Template Management:**
- Bundled templates ship with app
- Teachers can save custom diagrams as templates for reuse
- Template gallery with search/filter by category/subject/grade
- Load template to canvas for immediate editing
6. Quick copy-to-clipboard (PNG) for instant pasting into documents
7. Download with sensible filenames based on diagram title/timestamp

#### PDF Export (Worksheet-Optimized)
- **For Graphie diagrams**: Convert SVG → PDF using `svg2pdf.js` (preserves vectors, math, crisp lines)
- **For Typst diagrams**: Direct PDF generation from Typst compiler (highest fidelity, exact layout)
- **Print presets**: Common paper sizes (Letter 8.5×11", A4) with fit-to-page or original size
- **Margins**: Configurable or auto (minimal for embedding in worksheets)
- **Multi-page support**: Future enhancement for multi-diagram worksheets
- **High-DPI output**: Vector-based PDF ensures crisp printing at any scale
| **Export Formats** | PNG/SVG via server upload to S3 | PNG, JPEG, SVG, PDF locally with clipboard support (no cloud dependency) |
| **UX Polish** | Functional but utilitarian | Teacher-focused: intuitive, fast, with tooltips, onboarding, smart guides |
| **State Management** | No persistent project files | Save/load projects (.gb format), undo/redo, recent files |
| **Rendering Engines** | Graphie + MathJax (web) | Graphie + MathJax SVG + Typst/CeTZ (WASM) for advanced cases |
| **Performance** | Server round-trips for rendering/export | Local, instant rendering with live preview |
| **Security & Privacy** | Uploads diagrams to S3 | Everything runs locally - no data leaves user's machine |
| **Accessibility** | Basic | Full keyboard nav, screen reader support, WCAG compliant |
| **Extensibility** | Hardcoded | Modular, template system, future plugin support |

This evolution from a utility converter to a polished, teacher-ready desktop app is the core goal of Graphie Builder.
