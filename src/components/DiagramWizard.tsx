import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Slider,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  AutoAwesome as SparkleIcon,
  Functions as PlotIcon,
  Circle as CircleIcon,
  ArrowForward as ArrowIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  Category as CategoryIcon,
  GraphicEq as GraphicEqIcon,
} from "@mui/icons-material";

// MathLive is loaded as a side-effectful ES module (see src/main.tsx).
// It registers the `<math-field>` custom element and its full API surface
// (MathfieldElement, getValue/setValue, setOptions, ...) via the bundled
// `types/mathlive.d.ts`. We use the `<math-field>` element directly in JSX.
import "mathlive";

import { latexToJsForVar, SYS_RUNTIME_SRC } from "../latex-to-js";
import { MafsPreview } from "./MafsPreview";

// Default axis ranges emitted by every generated diagram so the plot has a
// sensible grid + axes by default.
const DEFAULT_X_RANGE = [-10, 10];
const DEFAULT_Y_RANGE = [-10, 10];

/**
 * A single MathLive `<math-field>` bound to a parent-controlled LaTeX
 * string. Defined at module scope so it is a stable component type —
 * defining it inline (as a `const` inside the wizard's render) would make
 * React treat it as a new type every render and remount the custom element,
 * destroying the user's cursor/focus on every keystroke.
 */
function MathInput({
  label,
  inputId,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  inputId: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const mathFieldRef = useRef<MathfieldElement | null>(null);

  // Configure the mathfield once on mount. MathLive exposes these as
  // property setters (setOptions is private in the types).
  useEffect(() => {
    const mf = mathFieldRef.current;
    if (!mf) return;
    mf.smartFence = true;
    mf.smartMode = true;
    mf.removeExtraneousParentheses = true;
    mf.placeholder = placeholder;
    // Only set the initial value if the field is empty — never clobber
    // what the user is actively typing.
    if (!mf.getValue()) {
      mf.setValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder]);

  // Keep the displayed value in sync with the parent state, but never
  // clobber the user's cursor while they are actively typing.
  useEffect(() => {
    const mf = mathFieldRef.current;
    if (!mf) return;
    if (!mf.hasFocus() && mf.getValue() !== value) {
      mf.setValue(value);
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    onChange((e.currentTarget as unknown as MathfieldElement).value);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl fullWidth>
        <InputLabel id={`${inputId}-label`}>{label}</InputLabel>
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "var(--radius-medium)",
            px: 1,
            py: 0.5,
            backgroundColor: "background.paper",
            minHeight: 40,
            display: "flex",
            alignItems: "center",
            "& math-field": {
              width: "100%",
            },
          }}
        >
          <math-field
            ref={mathFieldRef}
            id={inputId}
            math-virtual-keyboard-policy="manual"
            onInput={handleInput}
          />
        </Box>
      </FormControl>
    </Box>
  );
}

interface DiagramWizardProps {
  open: boolean;
  onClose: () => void;
  onInsertCode: (code: string) => void;
}

type DiagramType = "plot" | "polygon" | "circle" | "parametric" | "polar" | "piecewise";

export interface PlotConfig {
  expression: string;
  xMin: number;
  xMax: number;
  color: string;
  strokeWidth: number;
}

export interface PolygonConfig {
  points: Array<[number, number]>;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  showPoints: boolean;
  vertexLabels: string[];
  ticks: number;
}

export interface CircleConfig {
  centerX: number;
  centerY: number;
  radius: number;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
}

export interface ParametricConfig {
  xExpr: string;
  yExpr: string;
  tMin: number;
  tMax: number;
  color: string;
  strokeWidth: number;
}

export interface PolarConfig {
  rExpr: string;
  thetaMin: number;
  thetaMax: number;
  color: string;
  strokeWidth: number;
}

export interface PiecewiseConfig {
  pieces: Array<{ expr: string; xMin: number; xMax: number }>;
  color: string;
  strokeWidth: number;
}

// Per the style guide, strokes/lines use LATTE accent colours and
// fills/shading uses MOCHA accent colours. These are separate lists so the
// selectors only ever offer the palette appropriate to their role.
const STROKE_COLORS = [
  { name: "Rosewater", value: "LATTE_ROSEWATER" },
  { name: "Flamingo", value: "LATTE_FLAMINGO" },
  { name: "Pink", value: "LATTE_PINK" },
  { name: "Mauve", value: "LATTE_MAUVE" },
  { name: "Red", value: "LATTE_RED" },
  { name: "Maroon", value: "LATTE_MAROON" },
  { name: "Peach", value: "LATTE_PEACH" },
  { name: "Yellow", value: "LATTE_YELLOW" },
  { name: "Green", value: "LATTE_GREEN" },
  { name: "Teal", value: "LATTE_TEAL" },
  { name: "Sky", value: "LATTE_SKY" },
  { name: "Sapphire", value: "LATTE_SAPPHIRE" },
  { name: "Blue", value: "LATTE_BLUE" },
  { name: "Lavender", value: "LATTE_LAVENDER" },
];

const FILL_COLORS = [
  { name: "Rosewater", value: "MOCHA_ROSEWATER" },
  { name: "Flamingo", value: "MOCHA_FLAMINGO" },
  { name: "Pink", value: "MOCHA_PINK" },
  { name: "Mauve", value: "MOCHA_MAUVE" },
  { name: "Red", value: "MOCHA_RED" },
  { name: "Maroon", value: "MOCHA_MAROON" },
  { name: "Peach", value: "MOCHA_PEACH" },
  { name: "Yellow", value: "MOCHA_YELLOW" },
  { name: "Green", value: "MOCHA_GREEN" },
  { name: "Teal", value: "MOCHA_TEAL" },
  { name: "Sky", value: "MOCHA_SKY" },
  { name: "Sapphire", value: "MOCHA_SAPPHIRE" },
  { name: "Blue", value: "MOCHA_BLUE" },
  { name: "Lavender", value: "MOCHA_LAVENDER" },
];

const DIAGRAM_TYPES: Array<{ type: DiagramType; label: string; icon: React.ReactNode; description: string }> = [
  { type: "plot", label: "Plot Function", icon: <PlotIcon />, description: "Plot y = f(x) over a range" },
  { type: "parametric", label: "Parametric Curve", icon: <PlotIcon />, description: "Plot x = f(t), y = g(t)" },
  { type: "polar", label: "Polar Plot", icon: <CircleIcon />, description: "Plot r = f(θ)" },
  { type: "piecewise", label: "Piecewise Function", icon: <PlotIcon />, description: "Multiple functions over different ranges" },
  { type: "polygon", label: "Polygon", icon: <CategoryIcon />, description: "Draw polygons with vertices" },
  { type: "circle", label: "Circle/Ellipse", icon: <CircleIcon />, description: "Draw circles and ellipses" },
];

export function DiagramWizard({ open, onClose, onInsertCode }: DiagramWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [diagramType, setDiagramType] = useState<DiagramType>("plot");
  const [plotConfig, setPlotConfig] = useState<PlotConfig>({
    expression: "x * x",
    xMin: -5,
    xMax: 5,
    color: "LATTE_BLUE",
    strokeWidth: 2,
  });
  const [polygonConfig, setPolygonConfig] = useState<PolygonConfig>({
    points: [[0, 0], [3, 0], [3, 2], [0, 2]],
    fill: "MOCHA_GREEN",
    fillOpacity: 0.2,
    stroke: "LATTE_GREEN",
    strokeWidth: 2,
    showPoints: true,
    vertexLabels: ["A", "B", "C", "D"],
    ticks: 1,
  });
  const [circleConfig, setCircleConfig] = useState<CircleConfig>({
    centerX: 0,
    centerY: 0,
    radius: 3,
    fill: "transparent",
    fillOpacity: 0,
    stroke: "LATTE_BLUE",
    strokeWidth: 2,
  });
  const [parametricConfig, setParametricConfig] = useState<ParametricConfig>({
    xExpr: "cos(t)",
    yExpr: "sin(t)",
    tMin: 0,
    tMax: 2 * Math.PI,
    color: "LATTE_GREEN",
    strokeWidth: 2,
  });
  const [polarConfig, setPolarConfig] = useState<PolarConfig>({
    rExpr: "5",
    thetaMin: 0,
    thetaMax: 2 * Math.PI,
    color: "LATTE_SKY",
    strokeWidth: 2,
  });
  const [piecewiseConfig, setPiecewiseConfig] = useState<PiecewiseConfig>({
    pieces: [
      { expr: "x", xMin: -5, xMax: 0 },
      { expr: "x * x", xMin: 0, xMax: 5 },
    ],
    color: "LATTE_PEACH",
    strokeWidth: 2,
  });

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
  }, [open]);

  const handleNext = useCallback(() => setActiveStep((prev) => Math.min(prev + 1, 2)), []);
  const handleBack = useCallback(() => setActiveStep((prev) => Math.max(prev - 1, 0)), []);

  const generateSetup = (): string => {
    // The graphie runtime evaluates user code via $.tmpl.getVAR(code, graphie),
    // which wraps it in `with (ctx)` where `ctx` is the graphie instance.
    // That means graphie's methods (graphInit, plot, drawPolygon, drawCircle,
    // ...) are available as BARE identifiers — `graphie.graphInit(...)` would
    // fail because `graphie` itself is not in scope.
    //
    // axisArrows only accepts "<->", "->", or "" (empty). "|->|" matches
    // neither branch in graphInit() and silently draws NO axes.
    return `graphInit({
    range: [[${DEFAULT_X_RANGE[0]}, ${DEFAULT_X_RANGE[1]}], [${DEFAULT_Y_RANGE[0]}, ${DEFAULT_Y_RANGE[1]}]],
    grid: true,
    gridStep: [1, 1],
    axes: true,
    axisArrows: "<->",
    tickStep: [1, 1],
    labelStep: [1, 1],
});`;
  };

  const generatePlotCode = (): string => {
    const { expression, xMin, xMax, color, strokeWidth } = plotConfig;
    // Use the var-aware converter so the CE's `_.x` reference is rewritten
    // to a bare `x` that works inside `function(x) { return <expr>; }`.
    const { ok, code, error } = latexToJsForVar(expression, "x");
    if (!ok || !code) {
      return `// Error: ${error || "Could not convert expression"}\nplot(function(x) {\n    return ${expression};\n}, [${xMin}, ${xMax}], {\n    stroke: ${color},\n    strokeWidth: ${strokeWidth}\n});`;
    }
    return `plot(function(x) {
    return ${code};
}, [${xMin}, ${xMax}], {
    stroke: ${color},
    strokeWidth: ${strokeWidth}
});`;
  };

  const generatePolygonCode = (): string => {
    const { points, fill, fillOpacity, stroke, strokeWidth, showPoints, vertexLabels, ticks } = polygonConfig;
    const pointsStr = points.map(([x, y]) => `    [${x}, ${y}]`).join(",\n");
    // The graphie runtime exposes `path(points)` (closed polyline) and
    // `circle(point, radius)` for vertices — there is no `drawPolygon` or
    // `drawCircle`. `fill`/`fillOpacity`/`stroke`/`strokeWidth` are applied
    // via the `style(attrs, fn)` helper wrapping the path call.
    const labelsStr = vertexLabels.length > 0
      ? `    vertexLabels: [${vertexLabels.map(l => `"${l}"`).join(", ")}],`
      : "";
    const fillStr = fill === "transparent" ? "null" : `"${fill}"`;
    return `style({
    stroke: "${stroke}",
    strokeWidth: ${strokeWidth},
    fill: ${fillStr},
    fillOpacity: ${fillOpacity},
}, function() {
    path([
${pointsStr}
    ]);
    ${showPoints ? points.map(([x, y], i) => `circle([${x}, ${y}], 0.15);`).join("\n    ") : ""}
});`;
  };

  const generateCircleCode = (): string => {
    const { centerX, centerY, radius, fill, fillOpacity, stroke, strokeWidth } = circleConfig;
    const fillStr = fill === "transparent" ? "null" : `"${fill}"`;
    return `style({
    stroke: "${stroke}",
    strokeWidth: ${strokeWidth},
    fill: ${fillStr},
    fillOpacity: ${fillOpacity},
}, function() {
    circle([${centerX}, ${centerY}], ${radius});
});`;
  };

  const generateParametricCode = (): string => {
    const { xExpr, yExpr, tMin, tMax, color, strokeWidth } = parametricConfig;
    const xRes = latexToJsForVar(xExpr, "t");
    const yRes = latexToJsForVar(yExpr, "t");
    const xCode = xRes.ok && xRes.code ? xRes.code : xExpr;
    const yCode = yRes.ok && yRes.code ? yRes.code : yExpr;
    return `plotParametric(function(t) {
    return [${xCode}, ${yCode}];
}, [${tMin.toFixed(3)}, ${tMax.toFixed(3)}], {
    stroke: ${color},
    strokeWidth: ${strokeWidth}
});`;
  };

  const generatePolarCode = (): string => {
    const { rExpr, thetaMin, thetaMax, color, strokeWidth } = polarConfig;
    const { ok, code } = latexToJsForVar(rExpr, "theta");
    const rCode = ok && code ? code : rExpr;
    return `plotPolar(function(theta) {
    return ${rCode};
}, [${thetaMin.toFixed(3)}, ${thetaMax.toFixed(3)}], {
    stroke: ${color},
    strokeWidth: ${strokeWidth}
});`;
  };

  const generatePiecewiseCode = (): string => {
    const { pieces, color, strokeWidth } = piecewiseConfig;
    const fnArray = pieces.map((p) => {
      const { ok, code } = latexToJsForVar(p.expr, "x");
      const expr = ok && code ? code : p.expr;
      return `function(x) { return ${expr}; }`;
    }).join(",\n    ");
    const rangeArray = pieces.map((p) => `[${p.xMin}, ${p.xMax}]`).join(",\n    ");
    return `plotPiecewise(
    [${fnArray}],
    [${rangeArray}]
, {
    stroke: ${color},
    strokeWidth: ${strokeWidth}
});`;
  };

  const generateCode = (): string => {
    const setup = generateSetup();
    const body = (() => {
      switch (diagramType) {
        case "plot":
          return generatePlotCode();
        case "polygon":
          return generatePolygonCode();
        case "circle":
          return generateCircleCode();
        case "parametric":
          return generateParametricCode();
        case "polar":
          return generatePolarCode();
        case "piecewise":
          return generatePiecewiseCode();
        default:
          return "";
      }
    })();
    return `${SYS_RUNTIME_SRC}\n\n${setup}\n\n${body}`;
  };

  const handleInsert = useCallback(() => {
    const code = generateCode();
    onInsertCode(code);
    onClose();
    // Include every piece of mutable state that generateCode() reads so
    // the callback always reflects the *latest* config, not the stale
    // defaults from when the wizard first opened. Without these deps the
    // Insert button would emit the initial/default expressions even after
    // the user edited them.
  }, [
    diagramType,
    plotConfig,
    polygonConfig,
    circleConfig,
    parametricConfig,
    polarConfig,
    piecewiseConfig,
    onClose,
    onInsertCode,
  ]);

  const renderStep1 = () => (
    <Box sx={{ p: 2, overflow: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Choose Diagram Type
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Select the type of diagram you want to create
      </Typography>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {DIAGRAM_TYPES.map(({ type, label, icon, description }) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={type}>
            <Paper
              sx={{
                p: 2,
                textAlign: "center",
                cursor: "pointer",
                border: diagramType === type ? "2px solid" : "1px solid",
                borderColor: diagramType === type ? "primary.main" : "divider",
                transition: "all 0.2s",
                "&:hover": { bgcolor: "action.hover" },
              }}
              onClick={() => setDiagramType(type)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDiagramType(type); }}}
              tabIndex={0}
              role="button"
              aria-pressed={diagramType === type}
            >
              <Box sx={{ fontSize: 32, mb: 1, color: diagramType === type ? "primary.main" : "text.primary" }}>
                {icon}
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderStep2 = () => {
    switch (diagramType) {
      case "plot":
        return renderPlotConfig();
      case "polygon":
        return renderPolygonConfig();
      case "circle":
        return renderCircleConfig();
      case "parametric":
        return renderParametricConfig();
      case "polar":
        return renderPolarConfig();
      case "piecewise":
        return renderPiecewiseConfig();
    }
  };

  const renderPlotConfig = () => (
    <Box sx={{ p: 2, overflow: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Configure Plot
      </Typography>
      <MathInput
        label="Function f(x)"
        inputId="plot-expr"
        value={plotConfig.expression}
        onChange={(v: string) => setPlotConfig({ ...plotConfig, expression: v })}
        placeholder="e.g., x^2, sin(x), x^3 - 2*x"
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="X Min"
            value={plotConfig.xMin}
            onChange={(e) => setPlotConfig({ ...plotConfig, xMin: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.1 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="X Max"
            value={plotConfig.xMax}
            onChange={(e) => setPlotConfig({ ...plotConfig, xMax: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.1 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel id="plot-color-label">Color</InputLabel>
            <Select
              value={plotConfig.color}
              label="Color"
              onChange={(e) => setPlotConfig({ ...plotConfig, color: e.target.value })}
            >
              {STROKE_COLORS.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="Stroke Width"
            value={plotConfig.strokeWidth}
            onChange={(e) => setPlotConfig({ ...plotConfig, strokeWidth: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.5, min: 0.5 }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPolygonConfig = () => (
    <Box sx={{ p: 2, overflow: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Configure Polygon
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Vertices (click to add/remove)
        </Typography>
        {polygonConfig.points.map((point, idx) => (
          <Grid container spacing={1} key={idx} alignItems="center" sx={{ mb: 1 }}>
            <Grid size={2}>
              <Typography variant="body2">Point {idx + 1}</Typography>
            </Grid>
            <Grid size={4}>
              <TextField
                type="number"
                size="small"
                value={point[0]}
                onChange={(e) => {
                  const newPoints = [...polygonConfig.points];
                  newPoints[idx][0] = Number(e.target.value);
                  setPolygonConfig({ ...polygonConfig, points: newPoints });
                }}
                inputProps={{ step: 0.1 }}
                placeholder="X"
              />
            </Grid>
            <Grid size={4}>
              <TextField
                type="number"
                size="small"
                value={point[1]}
                onChange={(e) => {
                  const newPoints = [...polygonConfig.points];
                  newPoints[idx][1] = Number(e.target.value);
                  setPolygonConfig({ ...polygonConfig, points: newPoints });
                }}
                inputProps={{ step: 0.1 }}
                placeholder="Y"
              />
            </Grid>
            <Grid size={1}>
              <IconButton size="small" onClick={() => {
                if (polygonConfig.points.length > 3) {
                  setPolygonConfig({
                    ...polygonConfig,
                    points: polygonConfig.points.filter((_, i) => i !== idx),
                    vertexLabels: polygonConfig.vertexLabels.filter((_, i) => i !== idx),
                  });
                }
              }} aria-label={`Delete point ${idx + 1}`}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Grid>
            <Grid size={1}>
              <Typography variant="body2">
                {polygonConfig.vertexLabels[idx] || String.fromCharCode(65 + idx)}
              </Typography>
            </Grid>
          </Grid>
        ))}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            const newIdx = polygonConfig.points.length;
            setPolygonConfig({
              ...polygonConfig,
              points: [...polygonConfig.points, [newIdx, 0]],
              vertexLabels: [...polygonConfig.vertexLabels, String.fromCharCode(65 + newIdx)],
            });
          }}
          disabled={polygonConfig.points.length >= 10}
          sx={{ mt: 1 }}
        >
          Add Vertex
        </Button>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel id="poly-fill-label">Fill Color</InputLabel>
            <Select
              value={polygonConfig.fill}
              label="Fill Color"
              onChange={(e) => setPolygonConfig({ ...polygonConfig, fill: e.target.value })}
            >
              <MenuItem value="transparent">None</MenuItem>
              {FILL_COLORS.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="Fill Opacity"
            value={polygonConfig.fillOpacity}
            onChange={(e) => setPolygonConfig({ ...polygonConfig, fillOpacity: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.1, min: 0, max: 1 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel id="poly-stroke-label">Stroke Color</InputLabel>
            <Select
              value={polygonConfig.stroke}
              label="Stroke Color"
              onChange={(e) => setPolygonConfig({ ...polygonConfig, stroke: e.target.value })}
            >
              {STROKE_COLORS.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="Stroke Width"
            value={polygonConfig.strokeWidth}
            onChange={(e) => setPolygonConfig({ ...polygonConfig, strokeWidth: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.5, min: 0.5 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControlLabel
            control={
              <Switch
                checked={polygonConfig.showPoints}
                onChange={(e) => setPolygonConfig({ ...polygonConfig, showPoints: e.target.checked })}
              />
            }
            label="Show Vertex Points"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="Side Ticks"
            value={polygonConfig.ticks}
            onChange={(e) => setPolygonConfig({ ...polygonConfig, ticks: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 1, min: 0 }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderCircleConfig = () => (
    <Box sx={{ p: 2, overflow: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Configure Circle/Ellipse
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            type="number"
            label="Center X"
            value={circleConfig.centerX}
            onChange={(e) => setCircleConfig({ ...circleConfig, centerX: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.1 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            type="number"
            label="Center Y"
            value={circleConfig.centerY}
            onChange={(e) => setCircleConfig({ ...circleConfig, centerY: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.1 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            type="number"
            label="Radius"
            value={circleConfig.radius}
            onChange={(e) => setCircleConfig({ ...circleConfig, radius: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.1, min: 0.1 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel id="circle-fill-label">Fill Color</InputLabel>
            <Select
              value={circleConfig.fill}
              label="Fill Color"
              onChange={(e) => setCircleConfig({ ...circleConfig, fill: e.target.value })}
            >
              <MenuItem value="transparent">None</MenuItem>
              {FILL_COLORS.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="Fill Opacity"
            value={circleConfig.fillOpacity}
            onChange={(e) => setCircleConfig({ ...circleConfig, fillOpacity: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.1, min: 0, max: 1 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel id="circle-stroke-label">Stroke Color</InputLabel>
            <Select
              value={circleConfig.stroke}
              label="Stroke Color"
              onChange={(e) => setCircleConfig({ ...circleConfig, stroke: e.target.value })}
            >
              {STROKE_COLORS.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="Stroke Width"
            value={circleConfig.strokeWidth}
            onChange={(e) => setCircleConfig({ ...circleConfig, strokeWidth: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.5, min: 0.5 }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderParametricConfig = () => (
    <Box sx={{ p: 2, overflow: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Configure Parametric Curve
      </Typography>
      <MathInput
        label="x(t)"
        inputId="param-x"
        value={parametricConfig.xExpr}
        onChange={(v: string) => setParametricConfig({ ...parametricConfig, xExpr: v })}
        placeholder="e.g., cos(t), t*cos(t)"
      />
      <MathInput
        label="y(t)"
        inputId="param-y"
        value={parametricConfig.yExpr}
        onChange={(v: string) => setParametricConfig({ ...parametricConfig, yExpr: v })}
        placeholder="e.g., sin(t), t*sin(t)"
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="t Min"
            value={parametricConfig.tMin}
            onChange={(e) => setParametricConfig({ ...parametricConfig, tMin: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.1 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="t Max"
            value={parametricConfig.tMax}
            onChange={(e) => setParametricConfig({ ...parametricConfig, tMax: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.1 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel id="param-color-label">Color</InputLabel>
            <Select
              value={parametricConfig.color}
              label="Color"
              onChange={(e) => setParametricConfig({ ...parametricConfig, color: e.target.value })}
            >
              {STROKE_COLORS.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="Stroke Width"
            value={parametricConfig.strokeWidth}
            onChange={(e) => setParametricConfig({ ...parametricConfig, strokeWidth: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.5, min: 0.5 }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPolarConfig = () => (
    <Box sx={{ p: 2, overflow: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Configure Polar Plot
      </Typography>
      <MathInput
        label="r(θ)"
        inputId="polar-r"
        value={polarConfig.rExpr}
        onChange={(v: string) => setPolarConfig({ ...polarConfig, rExpr: v })}
        placeholder="e.g., 5, 2+sin(3*theta), theta"
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="θ Min (radians)"
            value={polarConfig.thetaMin}
            onChange={(e) => setPolarConfig({ ...polarConfig, thetaMin: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.1 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="θ Max (radians)"
            value={polarConfig.thetaMax}
            onChange={(e) => setPolarConfig({ ...polarConfig, thetaMax: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.1 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel id="polar-color-label">Color</InputLabel>
            <Select
              value={polarConfig.color}
              label="Color"
              onChange={(e) => setPolarConfig({ ...polarConfig, color: e.target.value })}
            >
              {STROKE_COLORS.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="Stroke Width"
            value={polarConfig.strokeWidth}
            onChange={(e) => setPolarConfig({ ...polarConfig, strokeWidth: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.5, min: 0.5 }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPiecewiseConfig = () => (
    <Box sx={{ p: 2, overflow: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Configure Piecewise Function
      </Typography>
      <Box sx={{ mb: 2 }}>
        {piecewiseConfig.pieces.map((piece, idx) => (
          <Accordion key={idx} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                Piece {idx + 1}: {piece.expr} on [{piece.xMin}, {piece.xMax}]
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
<MathInput
                      label="Expression"
                      inputId={`piecewise-expr-${idx}`}
                      value={piece.expr}
                     onChange={(v: string) => {
                       const newPieces = [...piecewiseConfig.pieces];
                       newPieces[idx] = { ...newPieces[idx], expr: v };
                       setPiecewiseConfig({ ...piecewiseConfig, pieces: newPieces });
                     }}
                     placeholder="e.g., x, x^2, sin(x)"
                   />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    type="number"
                    label="X Min"
                    value={piece.xMin}
                    onChange={(e) => {
                      const newPieces = [...piecewiseConfig.pieces];
                      newPieces[idx] = { ...newPieces[idx], xMin: Number(e.target.value) };
                      setPiecewiseConfig({ ...piecewiseConfig, pieces: newPieces });
                    }}
                    fullWidth
                    inputProps={{ step: 0.1 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    type="number"
                    label="X Max"
                    value={piece.xMax}
                    onChange={(e) => {
                      const newPieces = [...piecewiseConfig.pieces];
                      newPieces[idx] = { ...newPieces[idx], xMax: Number(e.target.value) };
                      setPiecewiseConfig({ ...piecewiseConfig, pieces: newPieces });
                    }}
                    fullWidth
                    inputProps={{ step: 0.1 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            const lastPiece = piecewiseConfig.pieces[piecewiseConfig.pieces.length - 1];
            setPiecewiseConfig({
              ...piecewiseConfig,
              pieces: [
                ...piecewiseConfig.pieces,
                { expr: "x", xMin: lastPiece.xMax, xMax: lastPiece.xMax + 5 },
              ],
            });
          }}
          disabled={piecewiseConfig.pieces.length >= 5}
          sx={{ mt: 1 }}
        >
          Add Piece
        </Button>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel id="piecewise-color-label">Color</InputLabel>
            <Select
              value={piecewiseConfig.color}
              label="Color"
              onChange={(e) => setPiecewiseConfig({ ...piecewiseConfig, color: e.target.value })}
            >
              {STROKE_COLORS.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            label="Stroke Width"
            value={piecewiseConfig.strokeWidth}
            onChange={(e) => setPiecewiseConfig({ ...piecewiseConfig, strokeWidth: Number(e.target.value) })}
            fullWidth
            inputProps={{ step: 0.5, min: 0.5 }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderStep3 = () => (
    <Box sx={{ p: 2, overflow: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Preview & Insert
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Review the generated code and insert it into the editor
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: "auto", fontFamily: "monospace", fontSize: 13 }}>
        <pre>{generateCode()}</pre>
      </Paper>
    </Box>
  );

  const steps = [
    { label: "Type", content: renderStep1() },
    { label: "Configure", content: renderStep2() },
    { label: "Preview", content: renderStep3() },
  ];

  const stepLabels = steps.map(s => s.label);

  if (!open) return null;

  return (
    // Sheet-style presentation (sheets.md): attached to top, full width, grabber, dimmed parent
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        borderBottomLeftRadius: "var(--radius-xl)",
        borderBottomRightRadius: "var(--radius-xl)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
        animation: "sheetSlideDown 0.2s ease-out",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sheetSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      ` }} />

      {/* Grabber (sheets.md: "Include a grabber in a resizable sheet") */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 1,
          cursor: "grab",
          userSelect: "none",
        }}
        role="button"
        tabIndex={0}
        aria-label="Drag to resize sheet"
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      >
        <Box
          sx={{
            width: 36,
            height: 4,
            borderRadius: 2,
            bgcolor: "text.secondary",
            opacity: 0.4,
          }}
        />
      </Box>

      {/* Sheet header toolbar */}
      <Box
        className="panel-header-glass"
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 52,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SparkleIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6">Diagram Wizard</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Step indicator */}
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            {stepLabels.map((label, idx) => (
              <Box
                key={label}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: "var(--radius-small)",
                  bgcolor: activeStep >= idx ? "primary.main" : "transparent",
                  color: activeStep >= idx ? "primary.contrastText" : "text.secondary",
                  fontWeight: activeStep === idx ? 600 : 400,
                  fontSize: "0.769rem",
                  transition: "all 0.2s",
                }}
              >
                {label}
                {idx < stepLabels.length - 1 && (
                  <ArrowIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                )}
              </Box>
            ))}
          </Box>
          <IconButton onClick={onClose} aria-label="close sheet" sx={{ ml: 1 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Sheet content */}
      <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
          {/* Left column: wizard steps */}
          <Box sx={{ flex: "0 0 58%", minWidth: 0, p: 2, overflow: "auto" }}>
            {steps[activeStep].content}
          </Box>
          {/* Right column: live Mafs preview */}
          <Box
            sx={{
              flex: "0 0 42%",
              minWidth: 0,
              borderLeft: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.default",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle2">Live Preview</Typography>
              <Typography variant="caption" color="text.secondary">
                Changes update in real time
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <MafsPreview
                diagramType={diagramType}
                plotConfig={plotConfig}
                polygonConfig={polygonConfig}
                circleConfig={circleConfig}
                parametricConfig={parametricConfig}
                polarConfig={polarConfig}
                piecewiseConfig={piecewiseConfig}
              />
            </Box>
          </Box>
        </Box>

        {/* Sheet actions toolbar (sheets.md: Cancel on leading, Done on trailing) */}
        <Box
          className="panel-header-glass"
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<ArrowIcon sx={{ transform: "rotate(180deg)" }} />}
            variant="outlined"
          >
            Back
          </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={handleInsert} startIcon={<CheckIcon />}>
              Insert Code
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext} endIcon={<ArrowIcon />}>
              Next
            </Button>
          )}
        </Box>
      </Box>

      {/* Backdrop */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          backgroundColor: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
        aria-hidden="true"
      />
    </Box>
  );
}