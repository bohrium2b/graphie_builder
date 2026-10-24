import { vec, useTransformContext } from "mafs";
import * as React from "react";

import {Arrowhead} from "./arrowhead";

const X = 0;
const Y = 1;

const tickSize = 10;
const tickLabelSize = 14;

// Show the given value as a multiple of pi (already assumed to be
// a multiple of pi).
function divideByAndShowPi(value: number): string {
    const dividedValue = value / Math.PI;

    switch (dividedValue) {
        case 1:
            return "π";
        case -1:
            return "-π";
        case 0:
            return "0";
        default:
            return `${dividedValue}π`;
    }
}

// Generate tick locations between min and max at the given step, skipping
// the origin (0) so labels don't collide with the axis lines.
function generateTickLocations(
    tickStep: number,
    min: number,
    max: number,
    otherAxisMin: number,
): number[] {
    const ticks: number[] = [];

    // Positive direction
    const start = Math.max(min, 0);
    const startOffset = otherAxisMin >= 0 ? 0 : tickStep;
    for (let i = start + startOffset; i < max; i += tickStep) {
        ticks.push(i);
    }

    // Negative direction
    let i = Math.min(max, 0) - tickStep;
    for (; i > min; i -= tickStep) {
        ticks.push(i);
    }

    return ticks;
}

const YAxisTick = ({
    y,
    range,
    tickStep,
    showPi,
}: {
    y: number;
    range: [[number, number], [number, number]];
    tickStep: number;
    showPi: boolean;
}) => {
    const {viewTransform} = useTransformContext();
    const [[xMin, xMax], [yMin, yMax]] = range;

    // If the graph requires out-of-bounds labels, lock the ticks to the
    // edge of the visible range so they render inside the clip.
    let xPointOnAxis = 0;
    if (xMin > 0) {
        xPointOnAxis = xMin;
    }
    if (xMax < 0) {
        xPointOnAxis = xMax;
    }

    const pointOnAxis: vec.Vector2 = [xPointOnAxis, y];
    const [xPosition, yPosition] = vec.transform(pointOnAxis, viewTransform);

    const x1 = xPosition - tickSize / 2;
    const y1 = yPosition;
    const x2 = xPosition + tickSize / 2;
    const y2 = yPosition;

    const xAdjustment = xMax <= 0 ? tickLabelSize * 1.5 : -tickLabelSize * 1.1;
    const xPositionText = xPosition + xAdjustment;
    const yPositionText = yPosition + tickLabelSize * 0.25;

    const yLabel = showPi ? divideByAndShowPi(y) : y.toFixed(0);

    return (
        <g className="tick" aria-hidden={true}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="axis-tick" />
            <text
                className="axis-tick-label"
                style={{fontSize: tickLabelSize}}
                textAnchor={"end"}
                x={xPositionText}
                y={yPositionText}
            >
                {yLabel}
            </text>
        </g>
    );
};

const XAxisTick = ({
    x,
    range,
    tickStep,
    showPi,
}: {
    x: number;
    range: [[number, number], [number, number]];
    tickStep: number;
    showPi: boolean;
}) => {
    const {viewTransform} = useTransformContext();
    const [[xMin, xMax], [yMin, yMax]] = range;

    let yPointOnAxis = 0;
    if (yMin > 0) {
        yPointOnAxis = yMin;
    }
    if (yMax < 0) {
        yPointOnAxis = yMax;
    }

    const pointOnAxis: vec.Vector2 = [x, yPointOnAxis];
    const [xPosition, yPosition] = vec.transform(pointOnAxis, viewTransform);

    const x1 = xPosition;
    const y1 = yPosition + tickSize / 2;
    const x2 = xPosition;
    const y2 = yPosition - tickSize / 2;

    const yAdjustment = yMax < 0 ? -tickLabelSize : tickLabelSize * 1.75;
    const xAdjustment = x < 0 ? -2 : 0;

    const xPositionText = xPosition + xAdjustment;
    const yPositionText = yPosition + yAdjustment;

    const xLabel = showPi ? divideByAndShowPi(x) : x.toFixed(0);

    return (
        <g className="tick" aria-hidden={true}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="axis-tick" />
            <text
                className="axis-tick-label"
                style={{fontSize: tickLabelSize}}
                textAnchor="middle"
                x={xPositionText}
                y={yPositionText}
            >
                {xLabel}
            </text>
        </g>
    );
};

export function AxisTicks({
    range,
    tickStep,
}: {
    range: [[number, number], [number, number]];
    tickStep: [number, number];
}) {
    const [[xMin, xMax], [yMin, yMax]] = range;
    const [xTickStep, yTickStep] = tickStep;

    const yGridTicks = generateTickLocations(yTickStep, yMin, yMax, xMin);
    const xGridTicks = generateTickLocations(xTickStep, xMin, xMax, yMin);

    return (
        <g className="axis-ticks" role="presentation">
            <g className="y-axis-ticks">
                {yGridTicks.map((y) => (
                    <YAxisTick
                        y={y}
                        key={`y-grid-tick-${y}`}
                        range={range}
                        tickStep={tickStep[Y]}
                        showPi={tickStep[Y] % Math.PI === 0}
                    />
                ))}
            </g>
            <g className="x-axis-ticks">
                {xGridTicks.map((x) => (
                    <XAxisTick
                        x={x}
                        key={`x-grid-tick-${x}`}
                        range={range}
                        tickStep={tickStep[X]}
                        showPi={tickStep[X] % Math.PI === 0}
                    />
                ))}
            </g>
        </g>
    );
}