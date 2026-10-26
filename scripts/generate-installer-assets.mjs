/**
 * generate-installer-assets.mjs
 *
 * Renders React-based installer graphics to SVG/PNG using takumi-js (with
 * satori fallback) so they can be embedded in the NSIS Windows installer.
 *
 * Runs under Node with jsdom providing the DOM that takumi-js / satori need.
 *
 * Usage:
 *   node scripts/generate-installer-assets.mjs
 *   # or via devenv / nix-shell:
 *   devenv exec node scripts/generate-installer-assets.mjs
 */

import { createReadStream, writeFileSync, mkdirSync, existsSync, promises as fsPromises } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { renderSvg } from "takumi-js";
import satori from "satori";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const ASSETS_DIR = join(ROOT, "build", "installer-assets");
const FONTS_DIR = join(ROOT, "public", "fonts");

mkdirSync(ASSETS_DIR, { recursive: true });

/** Load a font file as ArrayBuffer. */
async function loadFont(path) {
  const buf = await fsPromises.readFile(path);
  return buf;
}

/** Build a jsdom window with the Inter fonts loaded via data URLs. */
async function createWindow() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const { document } = window;

  // Preload fonts into the document so takumi / satori can reference them.
  const fontData = {};
  for (const weight of [400, 700]) {
    const url = join(FONTS_DIR, `inter-latin-${weight}-normal.woff2`);
    const buf = await loadFont(url);
    fontData[weight] = buf;
  }

  // Inject @font-face CSS so takumi can resolve "Inter".
  const style = document.createElement("style");
  for (const [weight, buf] of Object.entries(fontData)) {
    const base64 = Buffer.from(buf).toString("base64");
    style.textContent += `
      @font-face {
        font-family: "Inter";
        font-weight: ${weight};
        src: url(data:font/woff2;base64,${base64}) format("woff2");
      }
    `;
  }
  document.head.appendChild(style);

  return { window, document };
}

/** Render an HTML string to SVG via takumi-js (satori fallback). */
async function htmlToSvg({ window, document }, html, { width, height }) {
  const el = document.createElement("div");
  el.innerHTML = html;
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  el.style.fontFamily = "Inter, sans-serif";
  document.body.appendChild(el);

  let svg;
  try {
    svg = await renderSvg(el.outerHTML, {
      width, height,
      fonts: [
        { name: "Inter", weight: 400, data: await loadFont(join(FONTS_DIR, "inter-latin-400-normal.woff2")) },
        { name: "Inter", weight: 700, data: await loadFont(join(FONTS_DIR, "inter-latin-700-normal.woff2")) },
      ],
      fontFamilies: ["Inter"],
    });
  } catch (err) {
    console.warn("takumi-js failed, falling back to satori:", err.message);
    const node = {
      type: "div",
      props: {
        style: { width, height, fontFamily: "Inter", color: "#e2e2e6" },
        children: el.textContent || html,
      },
    };
    svg = await satori(node, {
      width, height,
      fonts: [
        { name: "Inter", weight: 400, data: await loadFont(join(FONTS_DIR, "inter-latin-400-normal.woff2")) },
        { name: "Inter", weight: 700, data: await loadFont(join(FONTS_DIR, "inter-latin-700-normal.woff2")) },
      ],
    });
  }

  document.body.removeChild(el);
  return svg;
}

function writeSvg(name, svg) {
  const path = join(ASSETS_DIR, name);
  writeFileSync(path, svg);
  console.log(`wrote ${path} (${svg.length} bytes)`);
}

async function main() {
  const { window, document } = await createWindow();

  const primary = "#a8c7fa";
  const secondary = "#7fcfff";
  const bg = "#0f1115";
  const surface = "#121316";
  const text = "#e2e2e6";
  const muted = "#a1a5ad";

  // ------------------------------------------------------------------
  // 1. NSIS header banner (150x480 typical, but we go wider for scaling)
  // ------------------------------------------------------------------
  const bannerHtml = `
    <div style="width:1000px;height:200px;background:linear-gradient(135deg, #004a98 0%, #0f1115 100%);
      display:flex;align-items:center;justify-content:center;border-radius:0;">
      <div style="text-align:center;color:#e2e2e6;font-family:Inter,sans-serif;">
        <div style="font-size:32px;font-weight:800;letter-spacing:-0.5px;">Graphie Builder</div>
        <div style="font-size:14px;color:#7fcfff;margin-top:6px;">Mathematical &amp; Scientific Diagramming</div>
      </div>
    </div>
  `;
  const bannerSvg = await htmlToSvg({ window, document }, bannerHtml, { width: 1000, height: 200 });
  writeSvg("installer-header.svg", bannerSvg);

  // ------------------------------------------------------------------
  // 2. NSIS sidebar / watermark (150x400)
  // ------------------------------------------------------------------
  const sidebarHtml = `
    <div style="width:160px;height:420px;background:${surface};
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      border-right:1px solid rgba(141,145,153,0.2);font-family:Inter,sans-serif;">
      <div style="width:48px;height:48px;background:linear-gradient(135deg,${primary},${secondary});
        border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;
        box-shadow:0 0 20px rgba(168,199,250,0.35);">
        <svg width="26" height="26" fill="#063168" viewBox="0 0 24 24">
          <path d="M12 2L4.5 20.29l0.71 0.71L12 18l6.79 3 -1.42 -6.36z"/>
          <path d="M12 12.5L12 15M12 8.5L12 11M12 4.5L12 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div style="font-size:18px;font-weight:700;color:#e2e2e6;">Graphie Builder</div>
      <div style="font-size:11px;color:#7fcfff;margin-top:4px;text-align:center;line-height:1.4;">
        Installing&hellip;
      </div>
      <div style="margin-top:24px;display:flex;flex-direction:column;gap:10px;align-items:center;">
        <div style="width:34px;height:34px;border:2px solid ${primary};border-radius:50%;
          border-top-color:transparent;animation:spin 0.8s linear infinite;"></div>
        <div style="font-size:11px;color:#a1a5ad;">Preparing files</div>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    </div>
  `;
  const sidebarSvg = await htmlToSvg({ window, document }, sidebarHtml, { width: 160, height: 420 });
  writeSvg("installer-sidebar.svg", sidebarSvg);

  // ------------------------------------------------------------------
  // 3. Logo mark (standalone SVG for window icon)
  // ------------------------------------------------------------------
  const logoSvg = `<svg width="256" height="256" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#004a98"/>
    <path d="M12 2L4.5 20.29l0.71 0.71L12 18l6.79 3 -1.42 -6.36z" fill="white"/>
    <path d="M12 12.5L12 15M12 8.5L12 11M12 4.5L12 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>`;
  writeSvg("logo.svg", logoSvg);

  // ------------------------------------------------------------------
  // 4. Carousel step icons (individual SVGs)
  // ------------------------------------------------------------------
  const steps = [
    { id: "welcome", icon: `<circle cx="12" cy="12" r="8" fill="none" stroke="#e2e2e6" strokeWidth="2"/><path d="M16 12a4 4 0 11-8 0 4 4 0 018 0z" fill="#e2e2e6"/>` },
    { id: "preparing", icon: `<rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="#e2e2e6" strokeWidth="2"/><path d="M7 10L12 13L17 7" fill="none" stroke="#e2e2e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>` },
    { id: "installing", icon: `<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2V4" fill="none" stroke="#e2e2e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="7 10 12 15 17 10" fill="none" stroke="#e2e2e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="15" x2="12" y2="3" fill="none" stroke="#e2e2e6" strokeWidth="2"/>` },
    { id: "configuring", icon: `<circle cx="12" cy="12" r="3" fill="#e2e2e6"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2h-2a2 2 0 01-2-2v-3a1.65 1.65 0 00-1.82-1 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2h-2a2 2 0 01-2-2v-3a1.65 1.65 0 00-1-1 1.65 1.65 0 00-1.82 1.1l.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00-.33-1.82 1.65 1.65 0 00-.33-1 1.65 1.65 0 00-1-1.51V12a2 2 0 012-2h3a2 2 0 012-2v-1a1.65 1.65 0 001-1.82 1.65 1.65 0 00-1-1.51l-.06-.06a2 2 0 01-2.83 0 2 2 0 010-2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V12a2 2 0 01-2 2H5a2 2 0 01-2 2v3a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 001.82 1 1.65 1.65 0 001.51 1V21a2 2 0 012 2h2a2 2 0 012-2v-3a1.65 1.65 0 001-1.51 1.65 1.65 0 001.82.33l.06.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 001.82-1 1.65 1.65 0 001-1.51V12a2 2 0 012-2h2a2 2 0 012 2v3a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 001.82-1 1.65 1.65 0 001-1.51z" fill="#e2e2e6"/>` },
    { id: "complete", icon: `<path d="M22 11.08V12a10 10 0 11-5.93-9.14" fill="none" stroke="#e2e2e6" strokeWidth="2" strokeLinecap="round"/><polyline points="22 4 12 14.01 9 11.01" fill="none" stroke="#e2e2e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>` },
  ];

  for (const { id, icon } of steps) {
    const stepHtml = `
      <div style="width:320px;height:200px;background:${surface};border-radius:16px;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        border:1px solid rgba(141,145,153,0.2);font-family:Inter,sans-serif;">
        <div style="width:56px;height:56px;background:linear-gradient(135deg,${primary},${secondary});
          border-radius:14px;display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 24px rgba(168,199,250,0.35);margin-bottom:16px;">
          <svg width="28" height="28" fill="#063168" viewBox="0 0 24 24">${icon}</svg>
        </div>
        <div style="font-size:16px;font-weight:600;color:#e2e2e6;">${id}</div>
      </div>
    `;
    const stepSvg = await htmlToSvg({ window, document }, stepHtml, { width: 320, height: 200 });
    writeSvg(`step-${id}.svg`, stepSvg);
  }

  // ------------------------------------------------------------------
  // 5. Finish / success state image
  // ------------------------------------------------------------------
  const finishHtml = `
    <div style="width:640px;height:400px;background:${surface};border-radius:24px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      border:1px solid rgba(141,145,153,0.2);font-family:Inter,sans-serif;text-align:center;color:${text};">
      <div style="width:72px;height:72px;background:linear-gradient(135deg,#61d7c6,#a8c7fa);
        border-radius:18px;display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 32px rgba(97,215,198,0.45);margin-bottom:24px;">
        <svg width="36" height="36" fill="#003731" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" fill="none" stroke="#003731" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style="font-size:24px;font-weight:700;margin-bottom:8px;">Installation Complete</div>
      <div style="font-size:14px;color:#a1a5ad;margin-bottom:32px;">Graphie Builder is ready to use.</div>
      <button style="background:linear-gradient(135deg,${primary},${secondary});color:#063168;border:none;
        border-radius:12px;padding:12px 28px;font-size:14px;font-weight:700;cursor:pointer;">
        Launch Graphie Builder
      </button>
    </div>
  `;
  const finishSvg = await htmlToSvg({ window, document }, finishHtml, { width: 640, height: 400 });
  writeSvg("installer-complete.svg", finishSvg);

  console.log("\nAll installer assets generated in:", ASSETS_DIR);
}

main().catch((err) => {
  console.error("generate-installer-assets failed:", err);
  process.exit(1);
});
