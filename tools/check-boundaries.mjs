#!/usr/bin/env node
// Enforce the decoupling: ui/ never reads data-side files; the data side never reads ui/.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT } from "./lib/data.mjs";

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const problems = [];

// 1) UI must not import/fetch/read anything that climbs out of ui/ into data-side dirs, nor use Node fs.
const uiBad = [
  [/(?:from|import\(|fetch\()\s*["'`](?:\.\.\/)+(?:data|schema|tools|contract)\b/, "UI file reaches into a data-side directory"],
  [/["'`](?:\/|\.\/)?(?:data|schema)\/(?:taxa|species|regions|sources)\/[^"'`]*\.json["'`]/, "UI file hard-codes a data/ file path as a data source"],
  [/node:fs|require\(["']fs["']\)/, "UI file uses Node fs"],
];
for (const f of walk(join(ROOT, "ui")).filter((x) => /\.(m?js|html|css)$/.test(x))) {
  const src = readFileSync(f, "utf8");
  src.split("\n").forEach((line, i) => {
    if (/GitHub|edit\/|REPO\.url|\$\{REPO/.test(line)) return; // links to the repository web page are fine
    for (const [re, msg] of uiBad) if (re.test(line)) problems.push(`${relative(ROOT, f)}:${i + 1}: ${msg}`);
  });
}

// 2) fetch() in UI is allowed only in ui/js/api.js (single data-access module).
for (const f of walk(join(ROOT, "ui", "js")).filter((x) => x.endsWith(".js"))) {
  if (f.endsWith("api.js")) continue;
  if (/\bfetch\s*\(/.test(readFileSync(f, "utf8"))) problems.push(`${relative(ROOT, f)}: fetch() outside ui/js/api.js`);
}

// 3) Data-side tools must not read ui/.
for (const f of [...walk(join(ROOT, "tools", "lib")), join(ROOT, "tools", "build-api.mjs"), join(ROOT, "tools", "validate.mjs")]) {
  if (/["'`](?:\.\.\/)*ui\//.test(readFileSync(f, "utf8"))) problems.push(`${relative(ROOT, f)}: data-side tool references ui/`);
}

if (problems.length) { problems.forEach((p) => console.error("BOUNDARY " + p)); process.exit(1); }
console.log("boundaries OK: ui/ and the data side are decoupled");
