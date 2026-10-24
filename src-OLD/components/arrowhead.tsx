import { vec, useTransformContext } from "mafs";
import * as React from "react";

const X = 0;
const Y = 1;

type Props = {
    tip: vec.Vector2;
    angle: number; // degrees counterclockwise from the positive x-axis
    color?: string;
    strokeWidth?: number;
};

// We build the path with a small builder here instead of pulling in
// Perseus' svg pathBuilder utility — the preview only needs this one
// shape. We scale in the path itself (not via CSS transform) so the
// stroke weight is not scaled up along with the arrow.
const arrowPath = (() => {
    const cmds: string[] = [];
    const scale = 1.4;
    const M = (x: number, y: number) => cmds.push(`M${x * scale} ${y * scale}`);
    const C = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x: number,
        y: number,
    ) =>
        cmds.push(
            `C${x1 * scale} ${y1 * scale} ${x2 * scale} ${y2 * scale} ${x * scale} ${y * scale}`,
        );
    M(-3, 4);
    C(-2.75, 2.5, 0, 0.25, 0.75, 0);
    C(0, -0.25, -2.75, -2.5, -3, -4);
    return cmds.join("");
})();

export function Arrowhead(props: Props) {
    const {viewTransform} = useTransformContext();
    const [x, y] = vec.transform(props.tip, viewTransform);

    return (
        <g
            aria-hidden={true}
            className="axis-arrowhead"
            transform={`translate(${x} ${y}) rotate(${props.angle})`}
        >
            <g transform="translate(-1.5)">
                <path
                    d={arrowPath}
                    fill="none"
                    style={{stroke: props.color ?? "inherit"}}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth={`${props.strokeWidth ?? 2}px`}
                />
            </g>
        </g>
    );
}