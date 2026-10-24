import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, "..", "dist");
const serverEntry = path.resolve(dist, "server", "entry-server.js");

const { render } = await import(pathToFileURL(serverEntry).href);

const html = fs.readFileSync(path.join(dist, "index.html"), "utf-8");
const appHtml = render();
const out = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
fs.writeFileSync(path.join(dist, "index.html"), out);
console.log("Prerendered index.html");
