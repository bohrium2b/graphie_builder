import * as React from "react";

import {Arrowhead} from "./arrowhead";

export function AxisArrows({
    range,
    showAxisArrows,
}: {
    range: [[number, number], [number, number]];
    showAxisArrows?: {
        xMin?: boolean;
        xMax?: boolean;
        yMin?: boolean;
        yMax?: boolean;
    };
}) {
    const [[xMin, xMax], [yMin, yMax]] = range;
    const axisColor = "var(--mafs-fg)";

    const defaults = {
        xMin: true,
        xMax: true,
        yMin: true,
        yMax: true,
    };
    const arrows = {...defaults, ...(showAxisArrows ?? {})};

    // Only render the arrows if the axis is within the visible range,
    // otherwise the arrows would render outside the graph.
    return (
        <>
            {!(yMin > 0 || yMax < 0) && (
                <>
                    {arrows.xMin && (
                        <Arrowhead
                            color={axisColor}
                            tip={[xMin, 0]}
                            angle={180}
                        />
                    )}
                    {arrows.xMax && (
                        <Arrowhead
                            color={axisColor}
                            tip={[xMax, 0]}
                            angle={0}
                        />
                    )}
                </>
            )}
            {!(xMin > 0 || xMax < 0) && (
                <>
                    {arrows.yMin && (
                        <Arrowhead
                            color={axisColor}
                            tip={[0, yMin]}
                            angle={90}
                        />
                    )}
                    {arrows.yMax && (
                        <Arrowhead
                            color={axisColor}
                            tip={[0, yMax]}
                            angle={270}
                        />
                    )}
                </>
            )}
        </>
    );
}