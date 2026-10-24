// Regenerates src/templates.ts from the graphie-to-png template bank.
//
// The upstream templates are HTML fragments whose code depends on a setup
// wrapper (the editor injects `grid-setup-pre`/`-post` and friends before
// running the code). This script reproduces that composition so every
// template renders on its own.
//
// The upstream bank lives in the (git-ignored) graphie-to-png checkout:
//   git clone <graphie-to-png> graphie-to-png
// The generated src/templates.ts is committed, so this is only needed when
// the upstream templates change.
//
// Usage: node scripts/generate-templates.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tplDir = path.join(root, "graphie-to-png", "templates");
const outFile = path.join(root, "src", "templates.ts");

function readSnippets() {
  const html = fs.readFileSync(path.join(tplDir, "setup_templates.html"), "utf8");
  const snippets = {};
  const re = /<script[^>]*id="([a-z-]+)"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    snippets[m[1]] = m[2].trim();
  }
  return snippets;
}

function parseTemplate(file) {
  const html = fs.readFileSync(path.join(tplDir, file), "utf8");
  const m = html.match(
    /<script([^>]*)type="text\/graphie"([^>]*)>([\s\S]*?)<\/script>/
  );
  if (!m) return null;
  const attrs = `${m[1]} ${m[2]}`;
  const attr = (name) => {
    const a = attrs.match(new RegExp(`${name}="([^"]*)"`));
    return a ? a[1] : null;
  };
  return {
    id: file.replace(/\.html$/, ""),
    title: attr("data-title") || file.replace(/\.html$/, ""),
    code: m[3].trim(),
    useGrid: attr("data-use-grid") === "true",
    useSimple: attr("data-use-simple") === "true",
    range: attr("data-range"),
    usePolar: attr("data-use-polar") === "true",
    useSat: attr("data-use-sat") === "true",
    useNonsquare: attr("data-use-nonsquare") === "true",
  };
}

const snippets = readSnippets();

const files = fs
  .readdirSync(tplDir)
  .filter((f) => f.endsWith(".html"))
  .filter((f) => f !== "editor.html" && f !== "setup_templates.html")
  .sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );

const templates = [];
// A blank page is not part of the upstream template bank but is always
// available as the first entry in the gallery.
templates.push({ id: "blank", title: "Blank page", category: "General", code: "" });
for (const file of files) {
  const t = parseTemplate(file);
  if (!t) continue;
  let code = t.code;
  if (t.useGrid) {
    code = `${snippets["grid-setup-pre"]}\n${code}\n${snippets["grid-setup-post"]}`;
  }
  if (t.useSimple) {
    const range = t.range || "[[-10, 10], [-10, 10]]";
    code = `${snippets["simple-setup-pre"].replace("RANGE", range)}\n${code}\n${snippets["simple-setup-post"]}`;
  }
  if (t.usePolar) {
    code = `${snippets["polar-setup-pre"]}\n${code}\n${snippets["polar-setup-post"]}`;
  }
  if (t.useSat) {
    code = `${snippets["sat-grid-setup-pre"]}\n${code}\n${snippets["sat-grid-setup-post"]}`;
  }
  if (t.useNonsquare) {
    code = `${snippets["nonsquare-grid-setup-pre"]}\n${code}\n${snippets["nonsquare-grid-setup-post"]}`;
  }
  templates.push({ id: t.id, title: t.title, category: "General", code });
}

const body = templates
  .map(
    (t) => `  {
    id: ${JSON.stringify(t.id)},
    title: ${JSON.stringify(t.title)},
    category: ${JSON.stringify(t.category)},
    code: ${JSON.stringify(t.code)},
  },`
  )
  .join("\n");

const out = `// Auto-generated from graphie-to-png/templates by scripts/generate-templates.mjs.
// Do not edit by hand.
export interface Template {
  id: string;
  title: string;
  category: string;
  code: string;
}

export const templates: Template[] = [
${body}
];
`;

fs.writeFileSync(outFile, out);
console.log(`wrote ${templates.length} templates to ${outFile}`);
