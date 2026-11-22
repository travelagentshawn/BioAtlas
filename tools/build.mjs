#!/usr/bin/env node
// Assemble the deployable site into dist/.
//   node tools/build.mjs                 build everything
//   node tools/build.mjs --only api      data side only  (writes dist/api/v1)
//   node tools/build.mjs --only ui       UI side only    (copies ui/ -> dist/)
//   node tools/build.mjs --only docs     docs only       (copies docs/ -> dist/docs, checks nav)
//   node tools/build.mjs --out some/dir  choose output directory
// The three parts are independent: the UI build never reads data/, the API build never reads ui/.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/data.mjs";
import { buildApi } from "./build-api.mjs";

const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null; };
const only = arg("--only");
const out = join(ROOT, arg("--out") || "dist");
const want = (part) => !only || only === part;
if (only && !["api", "ui", "docs"].includes(only)) { console.error('--only must be "api", "ui" or "docs"'); process.exit(2); }

mkdirSync(out, { recursive: true });

if (want("api")) buildApi(out);

if (want("ui")) {
  for (const f of ["index.html", "config.js", "css", "js"]) {
    const dst = join(out, f);
    rmSync(dst, { recursive: true, force: true });
    cpSync(join(ROOT, "ui", f), dst, { recursive: true });
  }
  writeFileSync(join(out, ".nojekyll"), "");
  console.log("ui: copied to " + out);
}

if (want("docs")) {
  const idx = JSON.parse(readFileSync(join(ROOT, "docs", "index.json"), "utf8"));
  const missing = [];
  for (const [lang, pages] of Object.entries(idx)) for (const p of pages) if (!existsSync(join(ROOT, "docs", p.file))) missing.push(`${lang}/${p.slug} -> docs/${p.file}`);
  if (missing.length) { console.error("docs/index.json references missing files:\n  " + missing.join("\n  ")); process.exit(1); }
  rmSync(join(out, "docs"), { recursive: true, force: true });
  cpSync(join(ROOT, "docs"), join(out, "docs"), { recursive: true });
  for (const f of ["llms.txt"]) if (existsSync(join(ROOT, f))) cpSync(join(ROOT, f), join(out, f));
  console.log("docs: copied to " + out);
}
