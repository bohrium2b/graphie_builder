// Resources panel: displays the Catppuccin color palette and
// style guide. Triggered from the info button in the toolbar.

import { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
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
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1,
            bgcolor: hex,
            border: "1px solid",
            borderColor: "divider",
          }}
        />
        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11 }}>
          {name}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 10, color: "text.secondary" }}>
          {constant}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 10, color: "text.secondary" }}>
          {hex}
        </Typography>
        {copied && (
          <Chip size="small" label="Copied" color="success" sx={{ fontSize: 10 }} />
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
      <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 600 }}>
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
                        borderRadius: 0.5,
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
                        borderRadius: 0.5,
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
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.paper",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <InfoIcon sx={{ color: "primary.main" }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
          Resources — Catppuccin Palette
        </Typography>
        <Tooltip title="Close">
          <IconButton size="small" onClick={onClose} aria-label="close resources">
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1 }}
        >
          {UI_THEMES.map((key) => (
            <Tab
              key={key}
              label={`${palette[key].emoji} ${palette[key].name}`}
              id={`resources-tab-${key}`}
            />
          ))}
          <Tab label="Style Guide" id="resources-tab-guide" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {tab < UI_THEMES.length ? (
          <ThemePalette themeKey={UI_THEMES[tab]} theme={palette[UI_THEMES[tab]]} />
        ) : (
          <StyleGuide />
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
      <Typography variant="h5">🖌️ Style Guide</Typography>
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
      <Typography variant="body2" sx={{ minWidth: 220, fontWeight: 500 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        {colors}
      </Box>
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
        borderRadius: 1,
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
