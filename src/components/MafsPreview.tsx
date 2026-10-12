// Live preview of a DiagramWizard configuration rendered with Mafs.
//
// Rather than parsing the generated Graphie code back out, this component
// renders the wizard's *config* directly using Mafs components. That keeps
// the preview in lock-step with what the user typed and avoids a fragile
// code-parsing step.
//
// Mafs is an SVG-based math visualization library that plays nicely with
// React; it exposes Plot.OfX / Plot.Parametric / Polygon / Circle etc.

import { Mafs, Coordinates, Plot, Polygon, Circle, Point, Text } from "mafs";
import "mafs/core.css";
import "mafs/font.css";

import { compileLatexFunction } from "../latex-to-js";
import type {
  PlotConfig,
  PolygonConfig,
  CircleConfig,
  ParametricConfig,
  PolarConfig,
  PiecewiseConfig,
} from "./DiagramWizard";

const X_RANGE: [number, number] = [-10, 10];
const Y_RANGE: [number, number] = [-10, 10];

// Per the style guide, strokes/lines use LATTE accent colours and
// fills/shading uses MOCHA accent colours.
const STROKE_COLORS: Record<string, string> = {
  LATTE_ROSEWATER: "#dc8a78",
  LATTE_FLAMINGO: "#dd7878",
  LATTE_PINK: "#ea76cb",
  LATTE_MAUVE: "#8839ef",
  LATTE_RED: "#d20f39",
  LATTE_MAROON: "#e64553",
  LATTE_PEACH: "#fe640b",
  LATTE_YELLOW: "#df8e1d",
  LATTE_GREEN: "#40a02b",
  LATTE_TEAL: "#179299",
  LATTE_SKY: "#04a5e5",
  LATTE_SAPPHIRE: "#209fb5",
  LATTE_BLUE: "#1e66f5",
  LATTE_LAVENDER: "#7287fd",
};

const FILL_COLORS: Record<string, string> = {
  MOCHA_ROSEWATER: "#f5e0dc",
  MOCHA_FLAMINGO: "#f2cdcd",
  MOCHA_PINK: "#f5c2e7",
  MOCHA_MAUVE: "#cba6f7",
  MOCHA_RED: "#f38ba8",
  MOCHA_MAROON: "#eba0ac",
  MOCHA_PEACH: "#fab387",
  MOCHA_YELLOW: "#f9e2af",
  MOCHA_GREEN: "#a6e3a1",
  MOCHA_TEAL: "#94e2d5",
  MOCHA_SKY: "#89dceb",
  MOCHA_SAPPHIRE: "#74c7ec",
  MOCHA_BLUE: "#89b4fa",
  MOCHA_LAVENDER: "#b4befe",
};

function toMafsStrokeColor(color: string): string {
  return STROKE_COLORS[color] ?? color;
}

function toMafsFillColor(color: string): string {
  return FILL_COLORS[color] ?? color;
}

interface MafsPreviewProps {
  diagramType: string;
  plotConfig: PlotConfig;
  polygonConfig: PolygonConfig;
  circleConfig: CircleConfig;
  parametricConfig: ParametricConfig;
  polarConfig: PolarConfig;
  piecewiseConfig: PiecewiseConfig;
}

export function MafsPreview({
  diagramType,
  plotConfig,
  polygonConfig,
  circleConfig,
  parametricConfig,
  polarConfig,
  piecewiseConfig,
}: MafsPreviewProps) {
  const renderDiagram = () => {
    switch (diagramType) {
      case "plot":
        return renderPlot();
      case "polygon":
        return renderPolygon();
      case "circle":
        return renderCircle();
      case "parametric":
        return renderParametric();
      case "polar":
        return renderPolar();
      case "piecewise":
        return renderPiecewise();
      default:
        return null;
    }
  };

  const renderPlot = () => {
    const { expression, xMin, xMax, color, strokeWidth } = plotConfig;
    const { ok, fn } = compileLatexFunction(expression, "x");
    if (!ok || !fn) {
      return (
        <Text x={0} y={0} color="#d32f2f" size={16}>
          Could not compile expression
        </Text>
      );
    }
    return (
      <Plot.OfX
        y={fn}
        domain={[xMin, xMax]}
        color={toMafsStrokeColor(color)}
        weight={strokeWidth}
      />
    );
  };

  const renderPolygon = () => {
    const { points, fill, fillOpacity, stroke, strokeWidth, showPoints } = polygonConfig;
    return (
      <>
        {/* Fill layer: MOCHA colour under the LATTE stroke layer so the
        style guide's "strokes LATTE, fills MOCHA" rule is honored even
        though Mafs Polygon/Circle use a single `color` prop. */}
        {fill !== "transparent" && (
          <Polygon
            points={points as [number, number][]}
            color={toMafsFillColor(fill)}
            weight={strokeWidth}
            fillOpacity={fillOpacity}
            strokeOpacity={0}
            strokeStyle="solid"
          />
        )}
        <Polygon
          points={points as [number, number][]}
          color={toMafsStrokeColor(stroke)}
          weight={strokeWidth}
          fillOpacity={0}
          strokeOpacity={1}
          strokeStyle="solid"
        />
        {showPoints &&
          points.map(([x, y], i) => (
            <Point key={i} x={x} y={y} color={toMafsStrokeColor(stroke)} />
          ))}
      </>
    );
  };

  const renderCircle = () => {
    const { centerX, centerY, radius, fill, fillOpacity, stroke, strokeWidth } = circleConfig;
    return (
      <>
        {fill !== "transparent" && (
          <Circle
            center={[centerX, centerY]}
            radius={radius}
            color={toMafsFillColor(fill)}
            weight={strokeWidth}
            fillOpacity={fillOpacity}
            strokeOpacity={0}
            strokeStyle="solid"
          />
        )}
        <Circle
          center={[centerX, centerY]}
          radius={radius}
          color={toMafsStrokeColor(stroke)}
          weight={strokeWidth}
          fillOpacity={0}
          strokeOpacity={1}
          strokeStyle="solid"
        />
      </>
    );
  };

  const renderParametric = () => {
    const { xExpr, yExpr, tMin, tMax, color, strokeWidth } = parametricConfig;
    const xRes = compileLatexFunction(xExpr, "t");
    const yRes = compileLatexFunction(yExpr, "t");
    if (!xRes.ok || !xRes.fn || !yRes.ok || !yRes.fn) {
      return (
        <Text x={0} y={0} color="#d32f2f" size={16}>
          Could not compile expression
        </Text>
      );
    }
    return (
      <Plot.Parametric
        xy={(t) => [xRes.fn!(t), yRes.fn!(t)] as [number, number]}
        domain={[tMin, tMax]}
        color={toMafsStrokeColor(color)}
        weight={strokeWidth}
      />
    );
  };

  const renderPolar = () => {
    const { rExpr, thetaMin, thetaMax, color, strokeWidth } = polarConfig;
    const rRes = compileLatexFunction(rExpr, "theta");
    if (!rRes.ok || !rRes.fn) {
      return (
        <Text x={0} y={0} color="#d32f2f" size={16}>
          Could not compile expression
        </Text>
      );
    }
    // Convert polar r(theta) to Cartesian parametric: (r*cos(theta), r*sin(theta))
    return (
      <Plot.Parametric
        xy={(theta) => {
          const r = rRes.fn!(theta);
          return [r * Math.cos(theta), r * Math.sin(theta)] as [number, number];
        }}
        domain={[thetaMin, thetaMax]}
        color={toMafsStrokeColor(color)}
        weight={strokeWidth}
      />
    );
  };

  const renderPiecewise = () => {
    const { pieces, color, strokeWidth } = piecewiseConfig;
    return (
      <>
        {pieces.map((piece, i) => {
          const { ok, fn } = compileLatexFunction(piece.expr, "x");
          if (!ok || !fn) return null;
          return (
            <Plot.OfX
              key={i}
              y={fn}
              domain={[piece.xMin, piece.xMax]}
              color={toMafsStrokeColor(color)}
              weight={strokeWidth}
            />
          );
        })}
      </>
    );
  };

  return (
    <Mafs
      viewBox={{ x: X_RANGE, y: Y_RANGE }}
      preserveAspectRatio={false}
      width="auto"
      height={320}
    >
      <Coordinates.Cartesian subdivisions={4} />
      {renderDiagram()}
    </Mafs>
  );
}