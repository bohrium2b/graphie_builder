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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Close as CloseIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { palette, themeOrder, type Theme, type ColorKey } from "../colors/catppuccin";

interface ResourcesPanelProps {
  onClose: () => void;
}

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

function ThemePalette({ theme, themeKey }: { theme: Theme; themeKey: string }) {
  const prefix = themeKey.toUpperCase();
  const colorEntries = Object.entries(theme.colors) as [ColorKey, (typeof theme.colors)[ColorKey]][];
  const accents = colorEntries.filter(([, def]) => def.accent);
  const neutrals = colorEntries.filter(([, def]) => !def.accent);

  // When viewing Mocha, compress Frappé and Macchiato into accordions
  const isMocha = themeKey === "mocha";
  const otherThemes = isMocha
    ? themeOrder.filter((k) => k !== "mocha" && k !== "latte")
    : [];

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

      {/* Compressed accordions for other dark themes when viewing Mocha */}
      {otherThemes.map((otherKey) => (
        <Accordion key={otherKey} sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              {palette[otherKey].emoji} {palette[otherKey].name} (compressed)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <CompactThemePalette themeKey={otherKey} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

function CompactThemePalette({ themeKey }: { themeKey: string }) {
  const theme = palette[themeKey];
  const prefix = themeKey.toUpperCase();
  const entries = Object.entries(theme.colors) as [ColorKey, (typeof theme.colors)[ColorKey]][];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
          gap: 0.5,
        }}
      >
        {entries.map(([key, def]) => (
          <ColorSwatch
            key={key}
            hex={def.hex}
            name={def.name}
            constant={`${prefix}_${key.toUpperCase()}`}
          />
        ))}
      </Box>
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
          {themeOrder.map((key) => (
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
        {tab < themeOrder.length ? (
          <ThemePalette themeKey={themeOrder[tab]} theme={palette[themeOrder[tab]]} />
        ) : (
          <StyleGuide />
        )}
      </Box>
    </Box>
  );
}

function StyleGuide() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 800 }}>
      <Typography variant="h5">🖌️ Style Guide</Typography>
      <Typography variant="body2" color="text.secondary">
        A guide on how to properly use the Catppuccin palette in Graphie
        diagrams.
      </Typography>

      <Typography variant="h6">Theme Usage</Typography>
      <Typography variant="body2">
        <strong>Choose a theme based on your diagram's background:</strong>
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <GuideRow label="Light backgrounds" colors={["Latte (light theme)"]} />
        <GuideRow label="Dark backgrounds" colors={["Mocha (darkest)", "Macchiato", "Frappé"]} />
        <GuideRow label="Shading / depth" colors={["Mocha (darkest)", "Macchiato", "Frappé"]} />
        <GuideRow label="Foreground on dark" colors={["Text", "Subtext 0/1"]} />
        <GuideRow label="Foreground on light" colors={["Text", "Subtext 0/1"]} />
      </Box>

      <Typography variant="h6">General Usage</Typography>
      <Typography variant="body2">
        <strong>Text colors are guidelines</strong> — certain cases require
        deviations. An example would be <code>text</code> on colored
        backgrounds. Legibility always comes first, so use your own judgement.
      </Typography>

      <Typography variant="h6">Background Colors</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <GuideRow label="Background Pane" colors={["Base"]} />
        <GuideRow label="Secondary Panes" colors={["Crust", "Mantle"]} />
        <GuideRow label="Surface Elements" colors={["Surface 0", "Surface 1", "Surface 2"]} />
        <GuideRow label="Overlays" colors={["Overlay 0", "Overlay 1", "Overlay 2"]} />
      </Box>

      <Typography variant="h6">Typography</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <GuideRow label="Body Copy" colors={["Text"]} />
        <GuideRow label="Main Headline" colors={["Text"]} />
        <GuideRow label="Sub-Headlines, Labels" colors={["Subtext 0", "Subtext 1"]} />
        <GuideRow label="Subtle" colors={["Overlay 1"]} />
        <GuideRow label="On Accent" colors={["Base"]} />
        <GuideRow label="Links, URLs" colors={["Blue"]} />
        <GuideRow label="Success" colors={["Green"]} />
        <GuideRow label="Warnings" colors={["Yellow"]} />
        <GuideRow label="Errors" colors={["Red"]} />
        <GuideRow label="Tags, Pills" colors={["Blue"]} />
        <GuideRow label="Selection Background" colors={["Overlay 2 (20%–30% opacity)"]} />
        <GuideRow label="Cursor" colors={["Rosewater"]} />
      </Box>

      <Typography variant="h6">Syntax Colors (Code Editors)</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <GuideRow label="Keyword" colors={["Mauve"]} />
        <GuideRow label="Strings" colors={["Green"]} />
        <GuideRow label="Symbols, Atoms" colors={["Red"]} />
        <GuideRow label="Escape Sequences, Regex" colors={["Pink"]} />
        <GuideRow label="Comments" colors={["Overlay 2"]} />
        <GuideRow label="Constants, Numbers" colors={["Peach"]} />
        <GuideRow label="Operators" colors={["Sky"]} />
        <GuideRow label="Braces, Delimiters" colors={["Overlay 2"]} />
        <GuideRow label="Methods, Functions" colors={["Blue"]} />
        <GuideRow label="Parameters" colors={["Maroon"]} />
        <GuideRow label="Builtins" colors={["Red"]} />
        <GuideRow label="Classes, Interfaces, Types" colors={["Yellow"]} />
        <GuideRow label="Enum Variants" colors={["Teal"]} />
        <GuideRow label="Property (e.g. JSON keys)" colors={["Blue"]} />
        <GuideRow label="Attributes (XML-style)" colors={["Yellow"]} />
        <GuideRow label="Macros" colors={["Rosewater"]} />
      </Box>

      <Typography variant="h6">Rainbow Highlights</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <GuideRow label="Color #1" colors={["Red"]} />
        <GuideRow label="Color #2" colors={["Peach"]} />
        <GuideRow label="Color #3" colors={["Yellow"]} />
        <GuideRow label="Color #4" colors={["Green"]} />
        <GuideRow label="Color #5" colors={["Sapphire"]} />
        <GuideRow label="Color #6" colors={["Lavender"]} />
      </Box>

      <Typography variant="h6">Diff &amp; Merge</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <GuideRow label="Diff Header" colors={["Blue"]} />
        <GuideRow label="Index Metadata" colors={["Overlay 2"]} />
        <GuideRow label="File Path Markers" colors={["Pink"]} />
        <GuideRow label="Hunk Header" colors={["Peach"]} />
        <GuideRow label="Changed Text BG" colors={["Blue (10%–20% opacity)"]} />
        <GuideRow label="Inserted Text BG" colors={["Green (10%–20% opacity)"]} />
        <GuideRow label="Removed Text BG" colors={["Red (10%–20% opacity)"]} />
      </Box>

      <Typography variant="h6">Debugging</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <GuideRow label="Breakpoint Icon" colors={["Red"]} />
        <GuideRow label="Breakpoint Line" colors={["Transparent"]} />
        <GuideRow label="Breakpoint Line During Execution" colors={["Yellow (15% opacity)"]} />
      </Box>

      <Divider />

      <Typography variant="h6">Color Tokens</Typography>
      <Typography variant="body2" color="text.secondary">
        Click any token to copy it. Use these constants in your Graphie code.
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {themeOrder.map((key) => (
          <TokenSection key={key} themeKey={key} />
        ))}
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

function TokenSection({ themeKey }: { themeKey: string }) {
  const theme = palette[themeKey];
  const prefix = themeKey.toUpperCase();
  const entries = Object.entries(theme.colors) as [ColorKey, (typeof theme.colors)[ColorKey]][];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography variant="subtitle2">
        {theme.emoji} {theme.name}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {entries.map(([key, def]) => (
          <TokenChip
            key={key}
            constant={`${prefix}_${key.toUpperCase()}`}
            hex={def.hex}
          />
        ))}
      </Box>
    </Box>
  );
}

function TokenChip({ constant, hex }: { constant: string; hex: string }) {
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

function GuideRow({ label, colors }: { label: string; colors: string[] }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="body2" sx={{ minWidth: 220, fontWeight: 500 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        {colors.map((c) => (
          <Chip key={c} label={c} size="small" variant="outlined" sx={{ fontSize: 11 }} />
        ))}
      </Box>
    </Box>
  );
}
