#!/usr/bin/env node
// Validate every data record against schema/ and check cross-references.
// Usage: node tools/validate.mjs [--strict]    (--strict turns warnings into failures)
import { loadAll } from "./lib/data.mjs";

const strict = process.argv.includes("--strict");
const { data, errors, warnings } = loadAll();

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

const counts = Object.entries(data).map(([k, v]) => `${v.length} ${k}`).join(", ");
console.log(`\n${counts}`);
if (errors.length || (strict && warnings.length)) {
  console.error(`\nFAILED: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`OK: 0 errors, ${warnings.length} warning(s)`);
