/**
 * generate-installer-bitmaps.mjs
 *
 * Pipeline: design → PNG (jimp) → BMP (jimp).
 *
 * NSIS natively requires 24-bit RGB .bmp assets. jimp has no SVG renderer, so
 * we draw the installer branding programmatically in PNG (gradients, rounded
 * rects, spinner rings), save PNG, then re-read and write as 24-bit BMP.
 *
 * Usage: node scripts/generate-installer-bitmaps.mjs
 */

import { Jimp } from "jimp";
import "@jimp/js-png";
import "@jimp/js-bmp";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const __dirname = new URL(".", import.meta.url).pathname;
const ROOT = join(__dirname, "..");
const OUT_PNG = join(ROOT, "build", "installer-assets", "png");
const OUT_BMP = join(ROOT, "build", "installer-assets", "bmp");
mkdirSync(OUT_PNG, { recursive: true });
mkdirSync(OUT_BMP, { recursive: true });

// ---- Design tokens (M3 dark, per DESIGN.md) ----
const PRIMARY = 0xa8c7faff;      // #a8c7fa
const SECONDARY = 0x7fcfffff;    // #7fcfff
const BG = 0x0f1115ff;           // #0f1115
const SURFACE = 0x121316ff;      // #121316
const TEXT = 0xe2e2e6ff;         // #e2e2e6
const MUTED = 0xa1a5adff;        // #a1a5ad
const ON_PRIMARY = 0x063168ff;   // #063168
const TERTIARY = 0x61d7c6ff;     // #61d7c6
const OUTLINE = 0x8d9199ff;      // #8d9199

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function colorParts(c) {
  return [(c >> 24) & 0xff, (c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff];
}

function rgbaToInt(r, g, b, a = 255) {
  return (r << 24) | (g << 16) | (b << 8) | a;
}

function verticalGradient(img, top, bottom) {
  const [tr, tg, tb] = colorParts(top);
  const [br, bg_, bb] = colorParts(bottom);
  const h = img.bitmap.height;
  const w = img.bitmap.width;
  for (let y = 0; y < h; y++) {
    const t = y / Math.max(h - 1, 1);
    const r = lerp(tr, br, t);
    const g = lerp(tg, bg_, t);
    const b = lerp(tb, bb, t);
    for (let x = 0; x < w; x++) {
      img.setPixelColor(rgbaToInt(r, g, b), x, y);
    }
  }
}

function diagonalGradient(img, c1, c2) {
  const [r1, g1, b1] = colorParts(c1);
  const [r2, g2, b2] = colorParts(c2);
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = (x + y) / (w + h);
      const r = lerp(r1, r2, t);
      const g = lerp(g1, g2, t);
      const b = lerp(b1, b2, t);
      img.setPixelColor(rgbaToInt(r, g, b), x, y);
    }
  }
}

function roundedRect(img, x, y, w, h, r, fill, stroke = null) {
  for (let cy = y; cy < y + h; cy++) {
    for (let cx = x; cx < x + w; cx++) {
      let inRect = true;
      // corner TL
      if (cx < x + r && cy < y + r) {
        const dx = cx - (x + r - 1), dy = cy - (y + r - 1);
        inRect = dx * dx + dy * dy <= (r - 1) * (r - 1);
      }
      // corner TR
      else if (cx >= x + w - r && cy < y + r) {
        const dx = cx - (x + w - r), dy = cy - (y + r - 1);
        inRect = dx * dx + dy * dy <= (r - 1) * (r - 1);
      }
      // corner BL
      else if (cx < x + r && cy >= y + h - r) {
        const dx = cx - (x + r - 1), dy = cy - (y + h - r);
        inRect = dx * dx + dy * dy <= (r - 1) * (r - 1);
      }
      // corner BR
      else if (cx >= x + w - r && cy >= y + h - r) {
        const dx = cx - (x + w - r), dy = cy - (y + h - r);
        inRect = dx * dx + dy * dy <= (r - 1) * (r - 1);
      }

      if (inRect) {
        if (fill !== null) img.setPixelColor(fill, cx, cy);
      } else if (stroke !== null) {
        const nearEdge =
          cx < x || cx >= x + w || cy < y || cy >= y + h;
        if (nearEdge) img.setPixelColor(stroke, cx, cy);
      }
    }
  }
}

function circle(img, cx, cy, radius, fill) {
  const r2 = radius * radius;
  for (let yy = cy - radius; yy <= cy + radius; yy++) {
    for (let xx = cx - radius; xx <= cx + radius; xx++) {
      const dx = xx - cx, dy = yy - cy;
      if (dx * dx + dy * dy <= r2) {
        img.setPixelColor(fill, xx, yy);
      }
    }
  }
}

function drawSpinner(img, cx, cy, outerR, innerR, color, progress) {
  const segments = 64;
  for (let i = 0; i < segments * progress; i++) {
    const angle = (i / segments) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + Math.cos(angle) * outerR;
    const y1 = cy + Math.sin(angle) * outerR;
    const x2 = cx + Math.cos(angle) * innerR;
    const y2 = cy + Math.sin(angle) * innerR;
    const th = 3;
    for (let dy2 = -th; dy2 <= th; dy2++) {
      for (let dx2 = -th; dx2 <= th; dx2++) {
        img.setPixelColor(color, Math.round(x1 + dx2), Math.round(y1 + dy2));
        img.setPixelColor(color, Math.round(x2 + dx2), Math.round(y2 + dy2));
      }
    }
  }
}

// ---- Save helpers ----
async function savePng(img, name) {
  const path = join(OUT_PNG, name);
  const buf = await new Promise((res, rej) => {
    img.getBuffer("image/png", (err, data) => (err ? rej(err) : res(data)));
  });
  writeFileSync(path, buf);
  console.log(`wrote ${path} (${img.bitmap.width}x${img.bitmap.height})`);
  return path;
}

async function pngToBmp(pngPath, bmpName) {
  const img = await Jimp.read(pngPath);
  const path = join(OUT_BMP, bmpName);
  const buf = await new Promise((res, rej) => {
    img.getBuffer("image/bmp", (err, data) => (err ? rej(err) : res(data)));
  });
  writeFileSync(path, buf);
  console.log(`wrote ${path} (BMP, ${img.bitmap.width}x${img.bitmap.height})`);
}

async function main() {
  // ========================================================================
  // 1. NSIS header banner (150x57 recommended; we make 1000x200 for scaling)
  // ========================================================================
  {
    const img = new Jimp({ width: 1000, height: 200, color: BG });
    diagonalGradient(img, 0x004a98, BG);
    await savePng(img, "installer-header.png");
    await pngToBmp(join(OUT_PNG, "installer-header.png"), "installer-header.bmp");
  }

  // ========================================================================
  // 2. NSIS sidebar / welcome-finish bitmap (164x314 recommended)
  // ========================================================================
  {
    const img = new Jimp({ width: 164, height: 314, color: SURFACE });
    verticalGradient(img, SURFACE, BG);
    // border
    const w = img.bitmap.width;
    const h = img.bitmap.height;
    for (let y = 0; y < h; y++) {
      img.setPixelColor(OUTLINE, 0, y);
      img.setPixelColor(OUTLINE, w - 1, y);
    }
    for (let x = 0; x < w; x++) {
      img.setPixelColor(OUTLINE, x, 0);
      img.setPixelColor(OUTLINE, x, h - 1);
    }
    // logo mark area
    roundedRect(img, 58, 24, 48, 48, 12, PRIMARY);
    circle(img, 82, 48, 13, ON_PRIMARY);
    circle(img, 82, 68, 7, ON_PRIMARY);
    circle(img, 82, 84, 4, ON_PRIMARY);
    drawSpinner(img, 82, 130, 20, 14, PRIMARY, 0.6);
    await savePng(img, "installer-sidebar.png");
    await pngToBmp(join(OUT_PNG, "installer-sidebar.png"), "installer-sidebar.bmp");
  }

  // ========================================================================
  // 3. Welcome/finish page bitmap (reuses sidebar design)
  // ========================================================================
  {
    const img = new Jimp({ width: 164, height: 314, color: SURFACE });
    verticalGradient(img, SURFACE, BG);
    const w = img.bitmap.width;
    const h = img.bitmap.height;
    for (let y = 0; y < h; y++) {
      img.setPixelColor(OUTLINE, 0, y);
      img.setPixelColor(OUTLINE, w - 1, y);
    }
    for (let x = 0; x < w; x++) {
      img.setPixelColor(OUTLINE, x, 0);
      img.setPixelColor(OUTLINE, x, h - 1);
    }
    roundedRect(img, 58, 24, 48, 48, 12, PRIMARY);
    circle(img, 82, 48, 13, ON_PRIMARY);
    circle(img, 82, 68, 7, ON_PRIMARY);
    circle(img, 82, 84, 4, ON_PRIMARY);
    drawSpinner(img, 82, 130, 20, 14, PRIMARY, 0.6);
    await savePng(img, "installer-complete.png");
    await pngToBmp(join(OUT_PNG, "installer-complete.png"), "installer-complete.bmp");
  }

  // ========================================================================
  // 4. Logo icon (256x256)
  // ========================================================================
  {
    const img = new Jimp({ width: 256, height: 256, color: PRIMARY });
    roundedRect(img, 16, 16, 224, 224, 40, PRIMARY);
    circle(img, 128, 128, 26, 0xffffffff);
    circle(img, 128, 168, 16, 0xffffffff);
    circle(img, 128, 198, 10, 0xffffffff);
    await savePng(img, "logo.png");
    await pngToBmp(join(OUT_PNG, "logo.png"), "logo.bmp");
  }

  console.log("\nPNG + BMP installer assets generated.");
}

main().catch((err) => {
  console.error("generate-installer-bitmaps failed:", err);
  process.exit(1);
});
