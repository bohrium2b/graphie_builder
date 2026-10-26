import { renderSvg } from "takumi-js";
import satori from "satori";

const FONT_URLS = [
  { url: "/fonts/inter-latin-400-normal.woff2", weight: 400 as const },
  { url: "/fonts/inter-latin-700-normal.woff2", weight: 700 as const },
];

async function loadFontData(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch font ${url}: ${res.status} ${res.statusText}`);
  }
  return res.arrayBuffer();
}

let FONTS_DATA: Array<{ name: string; weight: number; data: ArrayBuffer }> | null = null;
let FONTS_LOAD_ERROR: Error | null = null;

async function getFontsData(): Promise<Array<{ name: string; weight: number; data: ArrayBuffer }>> {
  if (FONTS_DATA) return FONTS_DATA;
  if (FONTS_LOAD_ERROR) throw FONTS_LOAD_ERROR;
  try {
    FONTS_DATA = await Promise.all(
      FONT_URLS.map(async ({ url, weight }) => {
        const data = await loadFontData(url);
        return { name: "Inter", weight, data };
      })
    );
    console.log("[htmlLabelToSvg] fonts loaded:", FONTS_DATA.length, "families");
    return FONTS_DATA;
  } catch (err) {
    FONTS_LOAD_ERROR = err as Error;
    console.error("[htmlLabelToSvg] failed to load fonts:", err);
    throw err;
  }
}

export interface TakumiLabelOptions {
  html: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fill: string;
  transform?: string;
}

/** Convert CSS transform string (e.g. "rotate(-90deg)") to SVG-valid transform (unitless angles). */
function cssTransformToSvg(transform: string): string {
  return transform.replace(/(rotate|skewX|skewY)\(([^)]*?)deg\)/g, '$1($2)');
}

/** Convert obsolete <center> tags to divs with text-align center. */
function normalizeHtml(html: string): string {
  return html.replace(/<center\b[^>]*>/gi, '<div style="text-align:center">').replace(/<\/center>/gi, "</div>");
}

function wrapHtml(html: string, opts: TakumiLabelOptions): string {
  const { width, height, fontSize, fontFamily, fontWeight, fill } = opts;
  return `<div style="
    width: ${Math.ceil(width)}px;
    height: ${Math.ceil(height)}px;
    font-size: ${fontSize}px;
    font-weight: ${fontWeight || "normal"};
    color: ${fill};
    font-family: ${fontFamily};
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  ">${html}</div>`;
}

function domToSatoriElement(node: Node): any {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    return text.trim() ? text : null;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as HTMLElement;
  const children = Array.from(el.childNodes)
    .map(domToSatoriElement)
    .filter((c): c is string | object => c !== null);

  const style: Record<string, string | number> = {};
  for (const prop of [
    "color",
    "fontSize",
    "fontFamily",
    "fontWeight",
    "fontStyle",
    "textAlign",
    "display",
    "width",
    "height",
  ]) {
    const val = (el.style as any)[prop];
    if (val && val !== "initial" && val !== "inherit" && val !== "unset") {
      style[prop] = val;
    }
  }

  const result: any = {
    type: el.tagName.toLowerCase(),
    props: {
      ...(Object.keys(style).length > 0 ? { style } : {}),
    },
  };

  if (children.length > 0) {
    result.props.children = children;
  } else if (el.textContent?.trim()) {
    result.props.children = el.textContent.trim();
  }

  return result;
}

function htmlToSatoriElement(html: string): any {
  const div = document.createElement("div");
  div.innerHTML = normalizeHtml(html);
  document.body.appendChild(div);
  const child = div.firstElementChild;
  document.body.removeChild(div);
  if (!child) {
    return { type: "div", props: { children: html } };
  }
  return domToSatoriElement(child);
}

function labelId(html: string, x: number, y: number): string {
  const hash = btoa(html.slice(0, 64) + "|" + x + "," + y).replace(/[+/=]/g, "_");
  return "takumi-label-" + hash;
}

/** Rewrites `<defs>` path IDs and `<use href>` references to be unique per label,
 * so multiple labels in one SVG don't collide on shared `g0`, `g1`, … IDs. */
function namespaceDefs(svgString: string, namespace: string): string {
  const doc = new DOMParser().parseFromString(svgString, "image/svg+xml");
  const defs = doc.querySelector("defs");
  if (!defs) return svgString;

  const idMap = new Map<string, string>();

  // Rename every <path id="..."> inside defs
  defs.querySelectorAll('[id]').forEach((el) => {
    const oldId = el.getAttribute("id") || "";
    const newId = namespace + "__" + oldId;
    idMap.set(oldId, newId);
    el.setAttribute("id", newId);
  });

  // Rewrite every <use href="#old"> reference
  doc.querySelectorAll('use[href]').forEach((el) => {
    const href = el.getAttribute("href") || "";
    const match = href.match(/^#(.+)$/);
    if (match && idMap.has(match[1])) {
      el.setAttribute("href", "#" + idMap.get(match[1])!);
    }
  });

  return new XMLSerializer().serializeToString(doc.documentElement);
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
    fontWeight,
    fill,
    transform,
  } = opts;

  const debug = (window as any).__takumiDebug;
  const id = labelId(html, x, y);
  console.log("[htmlLabelToSvg] start", { id, html, x, y, width, height, fontSize, fontFamily, fontWeight, fill, transform });

  let fontsData;
  try {
    fontsData = await getFontsData();
  } catch (err) {
    console.error("[htmlLabelToSvg] failed to load fonts:", err);
    throw err;
  }

  const takumiFonts = fontsData.map(({ name, weight, data }) => ({
    name,
    weight,
    data,
  }));

  const satoriFonts = fontsData.map(({ name, weight, data }) => ({
    name,
    weight: weight as any,
    data,
  }));

  const normalizedHtml = normalizeHtml(html);
  const wrappedHtml = wrapHtml(normalizedHtml, opts);

  let svgContent: string;

  try {
    console.log("[htmlLabelToSvg] calling takumi-js renderSvg", { id, width: Math.ceil(width), height: Math.ceil(height) });
    const t0 = performance.now();
    svgContent = await renderSvg(wrappedHtml, {
      width: Math.ceil(width),
      height: Math.ceil(height),
      fonts: takumiFonts,
      fontFamilies: ["Inter", "Geist"],
    });
    const t1 = performance.now();
    console.log("[htmlLabelToSvg] takumi-js done in", (t1 - t0).toFixed(0), "ms, svg length:", svgContent.length, "id:", id);
    svgContent = namespaceDefs(svgContent, id);
  } catch (err) {
    console.error("[htmlLabelToSvg] takumi-js failed:", err, "id:", id);

    try {
      console.log("[htmlLabelToSvg] falling back to satori", { id });
      const t0 = performance.now();
      const element = htmlToSatoriElement(normalizedHtml);
      svgContent = await satori(element, {
        width: Math.ceil(width),
        height: Math.ceil(height),
        fonts: satoriFonts,
      });
      const t1 = performance.now();
      console.log("[htmlLabelToSvg] satori done in", (t1 - t0).toFixed(0), "ms, svg length:", svgContent.length, "id:", id);
      svgContent = namespaceDefs(svgContent, id);
    } catch (satoriErr) {
      console.error("[htmlLabelToSvg] satori fallback also failed:", satoriErr, "id:", id);
      throw satoriErr;
    }
  }

  const svgEl = document.createElement("div");
  svgEl.innerHTML = svgContent;
  const svgNode = svgEl.querySelector("svg");
  if (!svgNode) {
    console.error("[htmlLabelToSvg] renderer did not return an SVG element", { id });
    throw new Error("Renderer did not return an SVG element");
  }

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const translatePart = `translate(${x},${y})`;
  const cx = width / 2;
  const cy = height / 2;
  // Inject cx, cy into rotate() so rotation happens around the text box center,
  // not the SVG origin (0,0).
  const centeredTransform = cssTransformToSvg(transform || '').replace(
    /rotate\s*\(([^)]*)\)/i,
    `rotate($1, ${cx}, ${cy})`
  );
  const fullTransform = transform ? `${translatePart} ${centeredTransform}` : translatePart;
  console.log("[htmlLabelToSvg] applying transform:", fullTransform, { id, x, y, transform });
  g.setAttribute("transform", fullTransform);
  g.setAttribute("id", id);
  g.setAttribute("data-label-text", html.slice(0, 128));
  g.setAttribute("data-label-x", String(x));
  g.setAttribute("data-label-y", String(y));
  g.setAttribute("data-label-width", String(width));
  g.setAttribute("data-label-height", String(height));
  g.setAttribute("data-label-font-size", String(fontSize));
  g.setAttribute("data-label-font-family", fontFamily);
  g.setAttribute("data-label-fill", fill);
  if (transform) g.setAttribute("data-label-transform", transform);

  while (svgNode.firstChild) {
    g.appendChild(svgNode.firstChild);
  }

  return new XMLSerializer().serializeToString(g);
}

export { htmlLabelToSvg as htmlLabelToSatoriSvg };
