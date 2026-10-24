// Resources panel: displays the Catppuccin color palette and
// style guide. Triggered from the info button in the toolbar.

import { useState } from "react";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Tooltip,
  IconButton,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Close as CloseIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { palette, type Theme, type ColorKey } from "../colors/catppuccin";

interface ResourcesPanelProps {
  onClose: () => void;
}

/** Themes we actually expose in the UI. Frappé and Macchiato are
 *  intentionally omitted — the style guide says never use them. */
const UI_THEMES = ["latte", "mocha"] as const;
type UIThemeKey = (typeof UI_THEMES)[number];

/** Recommended accent color order for diagrams. */
const ACCENT_ORDER: ColorKey[] = [
  "sky",
  "green",
  "peach",
  "maroon",
  "mauve",
  "pink",
];

function ColorSwatch({
  hex,
  name,
  constant,
}: {
  hex: string;
  name: string;
  constant: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(constant);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <Tooltip title={`Copy ${constant}`}>
      <Paper
        onClick={copy}
        sx={{
          p: 1,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "var(--radius-medium)",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-sm)",
            bgcolor: hex,
            border: "1px solid",
            borderColor: "divider",
          }}
        />
        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.769rem" }}>
          {name}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: "0.692rem", color: "text.secondary" }}>
          {constant}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: "0.692rem", color: "text.secondary" }}>
          {hex}
        </Typography>
        {copied && (
          <Chip size="small" label="Copied" color="success" sx={{ fontSize: "0.692rem" }} />
        )}
      </Paper>
    </Tooltip>
  );
}

/** A clickable color token chip with a color swatch icon. */
function ColorToken({ constant, hex }: { constant: string; hex: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(constant);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <Tooltip title={`Copy ${constant}`}>
      <Chip
        label={constant}
        size="small"
        variant="outlined"
        onClick={copy}
        sx={{
          fontSize: 10,
          cursor: "pointer",
          borderColor: hex,
          "&:hover": { bgcolor: "action.hover" },
        }}
        icon={
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: 0.5,
              bgcolor: hex,
              border: "1px solid",
              borderColor: "divider",
            }}
          />
        }
      />
    </Tooltip>
  );
}

function ThemePalette({ theme, themeKey }: { theme: Theme; themeKey: string }) {
  const prefix = themeKey.toUpperCase();
  const colorEntries = Object.entries(theme.colors) as [ColorKey, (typeof theme.colors)[ColorKey]][];
  const accents = colorEntries.filter(([, def]) => def.accent);
  const neutrals = colorEntries.filter(([, def]) => !def.accent);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6">
        {theme.emoji} {theme.name}
        <Typography
          component="span"
          variant="body2"
          sx={{ ml: 1, color: "text.secondary" }}
        >
          {theme.dark ? "Dark" : "Light"} theme
        </Typography>
      </Typography>

      <Typography variant="subtitle2" color="text.secondary">
        Accent Colors
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
          gap: 1,
        }}
      >
        {accents.map(([key, def]) => (
          <ColorSwatch
            key={key}
            hex={def.hex}
            name={def.name}
            constant={`${prefix}_${key.toUpperCase()}`}
          />
        ))}
      </Box>

      <Divider />

      <Typography variant="subtitle2" color="text.secondary">
        Neutral Colors
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
          gap: 1,
        }}
      >
        {neutrals.map(([key, def]) => (
          <ColorSwatch
            key={key}
            hex={def.hex}
            name={def.name}
            constant={`${prefix}_${key.toUpperCase()}`}
          />
        ))}
      </Box>

      <Divider />

      <Typography variant="subtitle2" color="text.secondary">
        ANSI Terminal Colors
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 600, mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Color</TableCell>
              <TableCell>Normal</TableCell>
              <TableCell>Bright</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(theme.ansiColors).map(([key, ansi]) => (
              <TableRow key={key}>
                <TableCell sx={{ textTransform: "capitalize" }}>{key}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "var(--radius-small)",
                        bgcolor: ansi.normal.hex,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                    <Typography variant="caption">{ansi.normal.hex}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "var(--radius-small)",
                        bgcolor: ansi.bright.hex,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                    <Typography variant="caption">{ansi.bright.hex}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export function ResourcesPanel({ onClose }: ResourcesPanelProps) {
  const [tab, setTab] = useState(0);

  return (
    <Box
      className="sheet-glass"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <Box
        className="panel-header-glass"
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          minHeight: "var(--panel-header-height)",
        }}
      >
        <InfoIcon sx={{ color: "primary.main" }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
          Resources — Catppuccin Palette
        </Typography>
        <Tooltip title="Close">
          <IconButton size="small" onClick={onClose} aria-label="close resources" sx={{ minWidth: 36, minHeight: 36 }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Segmented control (segmented-controls.md) instead of Tabs for macOS panels */}
      <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
        <ToggleButtonGroup
          exclusive
          value={tab}
          onChange={(_, v) => v !== null && setTab(v)}
          size="small"
          aria-label="resources section"
          sx={{ gap: 0.5, flexWrap: "wrap" }}
        >
          {UI_THEMES.map((key) => (
            <ToggleButton
              key={key}
              value={UI_THEMES.indexOf(key)}
              aria-label={`${palette[key].name} palette`}
              sx={{ px: 1.5, py: 0.5, fontSize: "0.769rem" }}
            >
              {palette[key].emoji} {palette[key].name}
            </ToggleButton>
          ))}
          <ToggleButton
            value={UI_THEMES.length}
            aria-label="Style Guide"
            sx={{ px: 1.5, py: 0.5, fontSize: "0.769rem" }}
          >
            Style Guide
          </ToggleButton>
          <ToggleButton
            value={UI_THEMES.length + 1}
            aria-label="Quick Guide"
            sx={{ px: 1.5, py: 0.5, fontSize: "0.769rem" }}
          >
            Quick Guide
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {tab < UI_THEMES.length ? (
          <ThemePalette themeKey={UI_THEMES[tab]} theme={palette[UI_THEMES[tab]]} />
        ) : tab === UI_THEMES.length ? (
          <StyleGuide />
        ) : (
          <QuickGuide />
        )}
      </Box>
    </Box>
  );
}

function StyleGuide() {
  const latte = palette.latte;
  const mocha = palette.mocha;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 800 }}>
      <Typography variant="h5">Style Guide</Typography>
      <Typography variant="body2" color="text.secondary">
        When to use which Catppuccin colors in Graphie diagrams.
      </Typography>

      <Typography variant="h6">When to Use Which Theme</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <GuideRow
          label="Foreground text, arrows, lines"
          colors={[
            <ColorToken key="latte_text" constant="LATTE_TEXT" hex={latte.colors.text.hex} />,
          ]}
        />
        <GuideRow
          label="Shading, fills, backgrounds"
          colors={[
            <ColorToken key="mocha_base" constant="MOCHA_BASE" hex={mocha.colors.base.hex} />,
          ]}
        />
        <GuideRow
          label="Accent colors (in order)"
          colors={ACCENT_ORDER.map((key) => (
            <ColorToken
              key={key}
              constant={`MOCHA_${key.toUpperCase()}`}
              hex={mocha.colors[key].hex}
            />
          ))}
        />
      </Box>

      <Typography variant="h6">Rules</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <RuleRow
          rule="Use Latte colors for foreground elements (text, arrows, lines)."
        />
        <RuleRow
          rule="Use Mocha colors any time there needs to be shading or fill."
        />
        <RuleRow
          rule="Use accent colors in this order: sky, green, peach, maroon, mauve, pink."
        />
        <RuleRow
          rule="Never use Frappé or Macchiato colors."
          highlight
        />
      </Box>

      <Divider />

      <Typography variant="body2" color="text.secondary">
        Palette version: {palette.version}. Colors are available in the
        Graphie editor as constants like <code>LATTE_ROSEWATER</code>,{" "}
        <code>MOCHA_BLUE</code>, etc. Type a constant name in the editor to
        see autocomplete suggestions.
      </Typography>
    </Box>
  );
}

function GuideRow({ label, colors }: { label: string; colors: React.ReactNode[] }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="body2" sx={{ minWidth: 200, fontWeight: 500 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        {colors}
      </Box>
    </Box>
  );
}

function QuickGuide() {
  const latte = palette.latte;
  const mocha = palette.mocha;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 800 }}>
      <Typography variant="h5">Quick Guide</Typography>
      <Typography variant="body2" color="text.secondary">
        How to draw points, lines, plots, and more in Graphie.
      </Typography>

      <Typography variant="h6">Setup</Typography>
      <Typography variant="body2">
        Every graph starts with a <code>setup()</code> function that configures
        the canvas range and scale:
      </Typography>
      <CodeBlock
        code={`var range = [[-10, 10], [-5, 5]];
var size = 320;

setup();

function setup() {
    var scales = _.map(range, function(extent) {
        return Perseus.Util.scaleFromExtent(extent, size);
    });
    init({range: range, scale: _.min(scales)});
}`}
      />

      <Typography variant="h6">Drawing Primitives</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <DrawingExample
          title="Points"
          description="Draw a single point or multiple points."
          code={`// Single point
drawPoint({
    point: [2, 3],
    color: LATTE_TEXT
});

// Multiple points
drawPoint({
    points: [[1, 1], [2, 2], [3, 3]],
    color: MOCHA_SKY
});`}
        />
        <DrawingExample
          title="Lines"
          description="Draw a line segment between two points."
          code={`drawLine({
    points: [[-3, 0], [3, 0]],
    stroke: LATTE_TEXT,
    strokeWidth: 2
});`}
        />
        <DrawingExample
          title="Rays"
          description="Draw a ray from one point through another."
          code={`drawRay({
    points: [[0, 0], [3, 2]],
    stroke: MOCHA_GREEN
});`}
        />
        <DrawingExample
          title="Segments"
          description="Draw a line segment with optional ticks and labels."
          code={`drawSegment({
    points: [[0, 0], [4, 0]],
    sideLabel: "$len0",
    ticks: 1,
    stroke: MOCHA_PEACH
});`}
        />
        <DrawingExample
          title="Polygons"
          description="Draw a polygon with optional fills, labels, and ticks."
          code={`drawPolygon({
    points: [[0, 0], [3, 4], [8, 4], [5, 0]],
    fill: MOCHA_GREEN,
    fillOpacity: 0.2,
    stroke: MOCHA_GREEN,
    showPoints: true,
    vertexLabels: ["A", "B", "C", "D"],
    ticks: 1
});`}
        />
        <DrawingExample
          title="Circles"
          description="Draw a circle with center and radius."
          code={`circle([0, 0], 3, {
    stroke: MOCHA_MAROON,
    strokeWidth: 2
});`}
        />
        <DrawingExample
          title="Arcs"
          description="Draw an arc with center, radius, and angle range."
          code={`drawArc({
    center: [0, 0],
    radius: 3,
    start: 0,
    end: 90,
    stroke: MOCHA_MAUVE
});`}
        />
        <DrawingExample
          title="Plots"
          description="Plot a function over a range."
          code={`plot(function(x) {
    return x * x;
}, [-5, 5], {
    stroke: MOCHA_SKY,
    strokeWidth: 2
});`}
        />
        <DrawingExample
          title="Labels"
          description="Add text labels at any point."
          code={`label([2, 3], "\\\\small{Hello}", "above");

// Angle label
drawAngleLabel({
    points: [[1, 0], [0, 0], [0, 1]],
    label: "90^\\\\circ",
    color: MOCHA_PINK
});`}
        />
      </Box>

      <Typography variant="h6">Color Tokens</Typography>
      <Typography variant="body2">
        Use these tokens in your drawing code. Click to copy:
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        <ColorToken constant="LATTE_TEXT" hex={latte.colors.text.hex} />
        <ColorToken constant="MOCHA_SKY" hex={mocha.colors.sky.hex} />
        <ColorToken constant="MOCHA_GREEN" hex={mocha.colors.green.hex} />
        <ColorToken constant="MOCHA_PEACH" hex={mocha.colors.peach.hex} />
        <ColorToken constant="MOCHA_MAROON" hex={mocha.colors.maroon.hex} />
        <ColorToken constant="MOCHA_MAUVE" hex={mocha.colors.mauve.hex} />
        <ColorToken constant="MOCHA_PINK" hex={mocha.colors.pink.hex} />
      </Box>

      <Divider />

      <Typography variant="body2" color="text.secondary">
        For more examples, see the templates in the editor dropdown.
        Each template shows a complete working example.
      </Typography>
    </Box>
  );
}

function DrawingExample({
  title,
  description,
  code,
}: {
  title: string;
  description: string;
  code: string;
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: "var(--radius-medium)",
        bgcolor: "action.hover",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {description}
      </Typography>
      <CodeBlock code={code} />
    </Box>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1.5,
        borderRadius: "var(--radius-medium)",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        overflow: "auto",
        fontSize: "0.769rem",
        fontFamily: "monospace",
        whiteSpace: "pre",
      }}
    >
      <code>{code}</code>
    </Box>
  );
}

function RuleRow({ rule, highlight }: { rule: string; highlight?: boolean }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        borderRadius: "var(--radius-medium)",
        bgcolor: highlight ? "error.light" : "action.hover",
        opacity: highlight ? 0.9 : 1,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: highlight ? 600 : 400 }}>
        {rule}
      </Typography>
    </Box>
  );
}
