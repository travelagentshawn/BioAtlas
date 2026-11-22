#!/usr/bin/env node
// Zero-dependency static server for dist/.   node tools/serve.mjs [--port 8080] [--dir dist]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { ROOT } from "./lib/data.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const port = +arg("--port", 8080), dir = join(ROOT, arg("--dir", "dist"));
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml" };

createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
    let file = join(dir, p);
    if (!file.startsWith(dir)) throw new Error("forbidden");
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream", "access-control-allow-origin": "*", "cache-control": "no-cache" });
    res.end(body);
  } catch { res.writeHead(404, { "content-type": "text/plain" }); res.end("not found"); }
}).listen(port, () => console.log(`BioAtlas on http://localhost:${port}  (serving ${dir})`));
