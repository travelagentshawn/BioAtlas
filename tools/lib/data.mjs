// Loads data/ + schema/, validates every record, and checks cross-record integrity.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSchemas, validate } from "./schema.mjs";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const KINDS = {
  taxa: { schema: "taxon.schema.json", type: "taxon" },
  species: { schema: "species.schema.json", type: "species" },
  regions: { schema: "region.schema.json", type: "region" },
  sources: { schema: "source.schema.json", type: "source" },
};

export function loadAll(root = ROOT) {
  const schemas = loadSchemas(join(root, "schema"));
  const data = { taxa: [], species: [], regions: [], sources: [] };
  const errors = [];
  const warnings = [];

  for (const [dir, meta] of Object.entries(KINDS)) {
    const folder = join(root, "data", dir);
    if (!existsSync(folder)) continue;
    for (const f of readdirSync(folder).sort()) {
      if (!f.endsWith(".json")) continue;
      const rel = `data/${dir}/${f}`;
      let rec;
      try {
        rec = JSON.parse(readFileSync(join(folder, f), "utf8"));
      } catch (e) {
        errors.push(`${rel}: invalid JSON (${e.message})`);
        continue;
      }
      for (const m of validate(rec, schemas[meta.schema], schemas, meta.schema)) errors.push(`${rel}${m}`);
      if (rec.id && f !== `${rec.id}.json`) errors.push(`${rel}: file name must equal id ("${rec.id}.json")`);
      data[dir].push(rec);
    }
  }
  checkIntegrity(data, errors, warnings);
  return { data, errors, warnings, schemas };
}

function checkIntegrity(data, errors, warnings) {
  const idx = (arr) => new Map(arr.map((r) => [r.id, r]));
  const taxa = idx(data.taxa), species = idx(data.species), sources = idx(data.sources);

  for (const [name, arr] of Object.entries(data)) {
    const seen = new Set();
    for (const r of arr) {
      if (seen.has(r.id)) errors.push(`${name}: duplicate id "${r.id}"`);
      seen.add(r.id);
    }
  }
  const checkSources = (where, ids = []) => {
    for (const s of ids) if (!sources.has(s)) errors.push(`${where}: unknown source "${s}"`);
  };

  // taxa
  const roots = data.taxa.filter((t) => t.parent === null);
  if (roots.length !== 1) errors.push(`taxa: exactly one root required, found ${roots.length}`);
  for (const t of data.taxa) {
    const w = `taxon ${t.id}`;
    if (t.parent !== null && !taxa.has(t.parent)) errors.push(`${w}: unknown parent "${t.parent}"`);
    checkSources(w, t.sources);
    const age = t.phylo?.age_mya;
    if (age) {
      if (!(age.min <= age.estimate && age.estimate <= age.max)) errors.push(`${w}: age must satisfy min <= estimate <= max`);
      checkSources(w + " age", [age.source]);
    }
    if (!t.sources?.length) warnings.push(`${w}: no sources`);
    // cycle check + kingdom consistency
    const seen = new Set();
    for (let cur = t; cur; cur = taxa.get(cur.parent)) {
      if (seen.has(cur.id)) { errors.push(`${w}: cycle in parent chain`); break; }
      seen.add(cur.id);
    }
    const p = taxa.get(t.parent);
    if (p && p.kingdom !== "root" && p.kingdom !== t.kingdom) errors.push(`${w}: kingdom "${t.kingdom}" differs from parent "${p.kingdom}"`);
  }

  // species
  for (const s of data.species) {
    const w = `species ${s.id}`;
    const t = taxa.get(s.taxon);
    if (!t) errors.push(`${w}: unknown taxon "${s.taxon}"`);
    else if (t.kingdom !== s.kingdom) errors.push(`${w}: kingdom "${s.kingdom}" differs from taxon "${t.kingdom}"`);
    checkSources(w, s.sources);
    for (const ev of s.evolution?.evidence || []) checkSources(w + " evidence", [ev.source]);
    if (s.conservation) checkSources(w + " conservation", [s.conservation.source]);
    const expectedId = s.scientific_name.toLowerCase().replace(/ × /g, " x ").replace(/[^a-z0-9]+/g, "-");
    if (s.id !== expectedId) warnings.push(`${w}: id differs from scientific name slug "${expectedId}"`);
    if (!s.sources?.length) warnings.push(`${w}: no sources`);
    if (!data.regions.some((r) => r.species.some((x) => x.species === s.id))) warnings.push(`${w}: not used by any region`);
  }

  // regions
  for (const r of data.regions) {
    const w = `region ${r.id}`;
    if (r.kind === "destination" && !r.center) errors.push(`${w}: destination needs center`);
    checkSources(w, r.sources);
    const seen = new Set();
    for (const e of r.species) {
      const sp = species.get(e.species);
      if (!sp) { errors.push(`${w}: unknown species "${e.species}"`); continue; }
      if (seen.has(e.species)) errors.push(`${w}: species "${e.species}" listed twice`);
      seen.add(e.species);
      for (const c of r.countries.length ? [] : []) void c;
      if (sp.travel?.countries?.length && !r.countries.some((c) => sp.travel.countries.includes(c)))
        warnings.push(`${w}: species "${e.species}" has no overlap between region countries and species countries`);
    }
  }
}
