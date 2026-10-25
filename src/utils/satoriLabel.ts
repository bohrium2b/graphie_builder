import satori from "satori";
import type { ReactNode } from "react";

const FONT_URLS = [
  { url: "/fonts/inter-latin-400-normal.woff2", weight: 400 as const },
  { url: "/fonts/inter-latin-700-normal.woff2", weight: 700 as const },
];

async function loadFontData(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return res.arrayBuffer();
}

interface SatoriFont {
  name: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
}

let FONTS: SatoriFont[] | null = null;

async function getFonts(): Promise<SatoriFont[]> {
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

type SatoriNode = {
  type: string;
  props?: {
    children?: SatoriNode | SatoriNode[] | string;
    style?: Record<string, string | number>;
    [key: string]: unknown;
  };
} | string;

export interface SatoriLabelOptions {
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

export async function htmlLabelToSvg(opts: SatoriLabelOptions): Promise<string> {
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

  const debug = (window as any).__satoriDebug;
  if (debug) console.log("[satoriLabel.htmlLabelToSvg] start", { html, x, y, width, height, fontSize, fontFamily, fill, transform });

  // Build a JSX-like element tree from the HTML string.
  // satori accepts React element-like objects: { type, props: { children, style } }
  const content = parseHtmlToSatoriNode(html);

  // Wrap content in a div with font size and color applied
  const root: SatoriNode = {
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
  const svg = await satori(root as unknown as ReactNode, {
    width: Math.ceil(width),
    height: Math.ceil(height),
    fonts,
    embedFont: true,
  });
  const t1 = performance.now();
  if (debug) console.log("[satoriLabel.htmlLabelToSvg] satori done in", (t1 - t0).toFixed(0), "ms, svg length:", svg.length);

  // satori returns an SVG string. Wrap it in a <g> with the correct transform.
  const svgEl = document.createElement("div");
  svgEl.innerHTML = svg;
  const svgNode = svgEl.querySelector("svg");
  if (!svgNode) {
    throw new Error("satori did not return an SVG element");
  }

  // Build a <g> wrapper with translation and optional rotation
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const translatePart = `translate(${x},${y})`;
  const transformPart = transform ? ` ${transform}` : "";
  g.setAttribute("transform", translatePart + transformPart);

  // Move all children of the satori svg into the group
  while (svgNode.firstChild) {
    g.appendChild(svgNode.firstChild);
  }

  return new XMLSerializer().serializeToString(g);
}

// Minimal HTML parser for satori-compatible node tree.
// Supports: text, <br>, <center>, <b>, <i>, <strong>, <em>, <span>, <div>, <p>, <ul>, <ol>, <li>
function parseHtmlToSatoriNode(html: string): SatoriNode {
  // Create a temporary DOM element to parse the HTML
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const result = domToSatoriNode(tmp);
  return result ?? "";
}

function domToSatoriNode(node: Node): SatoriNode | null {
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

  const children: SatoriNode[] = [];
  for (let i = 0; i < el.childNodes.length; i++) {
    const child = domToSatoriNode(el.childNodes[i]);
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
