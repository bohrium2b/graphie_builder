import { renderSvg } from "takumi-js";
import type { ReactNode } from "react";

const FONT_URLS = [
  { url: "/fonts/inter-latin-400-normal.woff2", weight: 400 as const },
  { url: "/fonts/inter-latin-700-normal.woff2", weight: 700 as const },
];

async function loadFontData(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return res.arrayBuffer();
}

interface TakumiFont {
  name: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
}

let FONTS: TakumiFont[] | null = null;

async function getFonts(): Promise<TakumiFont[]> {
  if (FONTS) return FONTS;
  const fonts = await Promise.all(
    FONT_URLS.map(async ({ url, weight }) => ({
      name: "Inter",
      data: await loadFontData(url),
      weight,
      style: "normal" as const,
    }))
  );
  FONTS = fonts;
  return fonts;
}

type TakumiNode = {
  type: string;
  props?: {
    children?: TakumiNode | TakumiNode[] | string;
    style?: Record<string, string | number>;
    [key: string]: unknown;
  };
} | string;

export interface TakumiLabelOptions {
  html: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  transform?: string;
}

export async function htmlLabelToSvg(opts: TakumiLabelOptions): Promise<string> {
  const {
    html,
    x,
    y,
    width,
    height,
    fontSize,
    fontFamily,
    fill,
    transform,
  } = opts;

  const debug = (window as any).__satoriDebug; // Keep debug flag name for compatibility
  if (debug) console.log("[takumiLabel.htmlLabelToSvg] start", { html, x, y, width, height, fontSize, fontFamily, fill, transform });

  // Build a JSX-like element tree from the HTML string.
  const content = parseHtmlToTakumiNode(html);

  // Wrap content in a div with font size and color applied
  const root: TakumiNode = {
    type: "div",
    props: {
      children: content,
      style: {
        fontSize: `${fontSize}px`,
        color: fill,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      },
    },
  };

  const fonts = await getFonts();
  const t0 = performance.now();
  const svg = await renderSvg(root as unknown as ReactNode, {
    width: Math.ceil(width),
    height: Math.ceil(height),
    fonts,
  });
  const t1 = performance.now();
  if (debug) console.log("[takumiLabel.htmlLabelToSvg] takumi done in", (t1 - t0).toFixed(0), "ms, svg length:", svg.length);

  // renderSvg returns an SVG string. Wrap it in a <g> with the correct transform.
  const svgEl = document.createElement("div");
  svgEl.innerHTML = svg;
  const svgNode = svgEl.querySelector("svg");
  if (!svgNode) {
    throw new Error("takumi did not return an SVG element");
  }

  // Build a <g> wrapper with translation and optional rotation
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const translatePart = `translate(${x},${y})`;
  const transformPart = transform ? ` ${transform}` : "";
  g.setAttribute("transform", translatePart + transformPart);

  // Move all children of the takumi svg into the group
  while (svgNode.firstChild) {
    g.appendChild(svgNode.firstChild);
  }

  return new XMLSerializer().serializeToString(g);
}

// Minimal HTML parser for takumi-compatible node tree.
function parseHtmlToTakumiNode(html: string): TakumiNode {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const result = domToTakumiNode(tmp);
  return result ?? "";
}

function domToTakumiNode(node: Node): TakumiNode | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    if (text.trim() === "") return null;
    return text;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as Element;
  const tagName = el.tagName.toLowerCase();

  const style: Record<string, string | number> = {};

  // Inline style
  const inlineStyle = el.getAttribute("style");
  if (inlineStyle) {
    inlineStyle.split(";").forEach((decl) => {
      const [prop, ...valParts] = decl.split(":");
      if (prop && valParts.length) {
        const p = prop.trim();
        const v = valParts.join(":").trim();
        if (p && v) {
          const camel = p.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          style[camel] = v;
        }
      }
    });
  }

  // Tag-specific default styles
  if (tagName === "center" || tagName === "div") {
    style.display = "flex";
    style.flexDirection = "column";
    style.alignItems = "center";
    style.justifyContent = "center";
    style.textAlign = "center";
  }
  if (tagName === "b" || tagName === "strong") {
    style.fontWeight = "bold";
  }
  if (tagName === "i" || tagName === "em") {
    style.fontStyle = "italic";
  }
  if (tagName === "p") {
    style.margin = "0";
  }

  const children: TakumiNode[] = [];
  for (let i = 0; i < el.childNodes.length; i++) {
    const child = domToTakumiNode(el.childNodes[i]);
    if (child) children.push(child);
  }

  return {
    type: tagName,
    props: {
      children: children.length === 0 ? undefined : children,
      style: Object.keys(style).length ? style : undefined,
    },
  };
}

// Keep old export name for backward compatibility during transition
export { htmlLabelToSvg as htmlLabelToSatoriSvg };
