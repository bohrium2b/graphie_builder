export type IRNodeKind =
  | "point"
  | "label"
  | "function"
  | "axis"
  | "line"
  | "rect"
  | "circle"
  | "ellipse"
  | "path"
  | "polygon"
  | "polyline"
  | "image"
  | "group";

export interface IRNodeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  dashArray?: string;
  shadow?: boolean;
}

export interface IRNodeTransform {
  rotateDeg?: number;
  scaleX?: number;
  scaleY?: number;
  locked?: boolean;
}

export interface IRNode {
  id: string;
  kind: IRNodeKind;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  r?: number;
  rx?: number;
  ry?: number;
  points?: [number, number][];
  text?: string;
  src?: string;
  width?: number;
  height?: number;
  expr?: string;
  domain?: [number, number];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  dashArray?: string;
  style?: IRNodeStyle;
  transform?: IRNodeTransform;
  children?: string[];
  label?: string;
  angle?: number;
  snap?: { grid?: number; neighbors?: boolean };
  /** Legacy bag used by VisualEditor/parse until fully migrated. */
  props?: Record<string, unknown>;
}

export interface DiagramIR {
  range: [[number, number], [number, number]];
  scale: number;
  grid?: {
    step?: [number, number];
    tickStep?: [number, number];
    labelStep?: [number, number];
    opacity?: number;
  };
  axes?: {
    axisArrows?: "<->" | "<-" | "->" | string;
    axisLabels?: [string, string];
  };
  width?: number;
  height?: number;
  nodes: IRNode[];
}
