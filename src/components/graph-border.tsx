import * as React from "react";

interface Props {
    range: [[number, number], [number, number]];
}

/**
 * Draws a 1px border at the exact graph bounds to match the design.
 *
 * A dedicated rect is needed because the outermost grid line is clipped to
 * the bounds, losing the outer half of its stroke (~0.5px). Kept on top of
 * the grid so the full stroke renders crisply. `vector-effect:
 * non-scaling-stroke` keeps the 1px stroke crisp under viewBox scaling.
 *
 * The rect is expressed in math coordinates: (xMin, yMax) is the top-left
 * corner (SVG y is flipped by Mafs' view transform so yMax is the top), and
 * the size spans the full range.
 */
export function GraphBorder({range}: Props) {
    const [[xMin, xMax], [yMin, yMax]] = range;

    return (
        <rect
            className="mafs-graph-border"
            x={xMin}
            y={yMax}
            width={xMax - xMin}
            height={yMax - yMin}
        />
    );
}