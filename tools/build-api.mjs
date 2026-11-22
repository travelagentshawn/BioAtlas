#!/usr/bin/env node
// DATA SIDE: compile data/ + schema/ into the static JSON API described in contract/.
// Usage: node tools/build-api.mjs [--out dist]
// This script never touches ui/. It only writes <out>/api/v1/**.
import { mkdirSync, writeFileSync, readFileSync, readdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadAll, ROOT } from "./lib/data.mjs";
import { loadSchemas, validate } from "./lib/schema.mjs";

export function buildApi(outRoot) {
  const { data, errors, warnings } = loadAll();
  if (errors.length) {
    errors.forEach((e) => console.error("ERROR " + e));
    throw new Error(`Data validation failed (${errors.length} errors). Run: node tools/validate.mjs`);
  }
  warnings.forEach((w) => console.warn("warn  " + w));

  const out = join(outRoot, "api", "v1");
  const files = new Map(); // relative path -> JSON value
  const put = (rel, value) => files.set(rel, value);

  const taxa = new Map(data.taxa.map((t) => [t.id, t]));
  const sources = new Map(data.sources.map((s) => [s.id, s]));
  const speciesById = new Map(data.species.map((s) => [s.id, s]));

  const children = new Map();
  for (const t of data.taxa) {
    if (t.parent) (children.get(t.parent) || children.set(t.parent, []).get(t.parent)).push(t.id);
  }
  const speciesByTaxon = new Map();
  for (const s of data.species) (speciesByTaxon.get(s.taxon) || speciesByTaxon.set(s.taxon, []).get(s.taxon)).push(s.id);

  const lineageIds = (taxonId) => {
    const chain = [];
    for (let t = taxa.get(taxonId); t; t = taxa.get(t.parent)) chain.unshift(t.id);
    return chain;
  };

  // species counts per taxon (recursive)
  const countMemo = new Map();
  const speciesCount = (id) => {
    if (countMemo.has(id)) return countMemo.get(id);
    let n = (speciesByTaxon.get(id) || []).length;
    for (const c of children.get(id) || []) n += speciesCount(c);
    countMemo.set(id, n);
    return n;
  };

  const taxonLite = (t) => ({
    id: t.id, rank: t.rank, scientific_name: t.scientific_name, names: t.names,
    kingdom: t.kingdom, parent: t.parent, age_mya: t.phylo?.age_mya ?? null,
    species_count: speciesCount(t.id),
  });
  const speciesLite = (s) => ({
    id: s.id, scientific_name: s.scientific_name, names: s.names, summary: s.summary,
    kingdom: s.kingdom, taxon: s.taxon, lineage: lineageIds(s.taxon),
    best_months: s.travel.best_months, habitats: s.travel.habitats, countries: s.travel.countries,
    iucn: s.conservation?.iucn ?? null, review_status: s.review_status,
  });
  const resolveSources = (ids = []) => [...new Set(ids)].filter((i) => sources.has(i)).map((i) => sources.get(i));
  const regionsOfSpecies = (sid) =>
    data.regions.flatMap((r) => r.species.filter((e) => e.species === sid).map((e) => ({
      id: r.id, kind: r.kind, names: r.names, months: e.months, likelihood: e.likelihood,
    })));

  // most recent common ancestor of two taxa
  const mrca = (a, b) => {
    const la = lineageIds(a), lb = lineageIds(b);
    let last = null;
    for (let i = 0; i < Math.min(la.length, lb.length) && la[i] === lb[i]; i++) last = la[i];
    return taxa.get(last);
  };

  // ---------- taxa ----------
  put("taxa.json", data.taxa.map(taxonLite));
  for (const t of data.taxa) {
    const srcIds = [...(t.sources || []), ...(t.phylo?.age_mya ? [t.phylo.age_mya.source] : [])];
    put(`taxa/${t.id}.json`, {
      id: t.id, rank: t.rank, scientific_name: t.scientific_name, authority: t.authority ?? null,
      names: t.names, summary: t.summary ?? t.names, kingdom: t.kingdom, parent: t.parent,
      pruned: !!t.pruned, phylo: t.phylo ?? {},
      lineage: lineageIds(t.id).map((i) => taxonLite(taxa.get(i))),
      children: (children.get(t.id) || []).map((i) => taxonLite(taxa.get(i))),
      species: (speciesByTaxon.get(t.id) || []).map((i) => speciesLite(speciesById.get(i))),
      sources_resolved: resolveSources(srcIds),
      review_status: t.review_status,
    });
  }

  // ---------- tree ----------
  const treeNode = (id) => {
    const t = taxa.get(id);
    return {
      id: t.id, rank: t.rank, scientific_name: t.scientific_name, names: t.names, kingdom: t.kingdom,
      age_mya: t.phylo?.age_mya ?? null, monophyly: t.phylo?.monophyly ?? "unknown", pruned: !!t.pruned,
      species_count: speciesCount(id),
      children: (children.get(id) || []).map(treeNode),
      species: (speciesByTaxon.get(id) || []).map((sid) => {
        const s = speciesById.get(sid);
        return { id: s.id, scientific_name: s.scientific_name, names: s.names };
      }),
    };
  };
  put("tree.json", treeNode(data.taxa.find((t) => t.parent === null).id));

  // ---------- species ----------
  put("species.json", data.species.map(speciesLite));
  for (const s of data.species) {
    const relatives = data.species
      .filter((o) => o.id !== s.id)
      .map((o) => {
        const m = mrca(s.taxon, o.taxon);
        return { o, m, depth: lineageIds(m.id).length };
      })
      .sort((x, y) => y.depth - x.depth || x.o.id.localeCompare(y.o.id))
      .slice(0, 6)
      .map(({ o, m }) => ({ species: speciesLite(o), mrca: taxonLite(m) }));

    const srcIds = [
      ...(s.sources || []),
      ...s.evolution.evidence.map((e) => e.source),
      ...(s.conservation ? [s.conservation.source] : []),
    ];
    put(`species/${s.id}.json`, {
      id: s.id, scientific_name: s.scientific_name, authority: s.authority ?? null, synonyms: s.synonyms ?? [],
      names: s.names, summary: s.summary, kingdom: s.kingdom, taxon: s.taxon,
      identification: s.identification, evolution: s.evolution, travel: s.travel, sounds: s.sounds ?? [],
      conservation: s.conservation ?? null, media: s.media ?? [], external_ids: s.external_ids ?? {},
      review_status: s.review_status,
      lineage: lineageIds(s.taxon).map((i) => taxonLite(taxa.get(i))),
      regions: regionsOfSpecies(s.id),
      relatives,
      sources_resolved: resolveSources(srcIds),
    });
  }

  // ---------- regions ----------
  put("regions.json", data.regions.map((r) => ({
    id: r.id, kind: r.kind, names: r.names, description: r.description, countries: r.countries,
    center: r.center ?? null, habitats: r.habitats ?? [], species_count: r.species.length,
    review_status: r.review_status,
  })));
  for (const r of data.regions) {
    const month_counts = Array.from({ length: 12 }, (_, i) => r.species.filter((e) => e.months.includes(i + 1)).length);
    put(`regions/${r.id}.json`, {
      id: r.id, kind: r.kind, names: r.names, description: r.description, countries: r.countries,
      center: r.center ?? null, radius_km: r.radius_km ?? null, habitats: r.habitats ?? [],
      review_status: r.review_status,
      species: r.species.map((e) => ({
        species: speciesLite(speciesById.get(e.species)), months: e.months, likelihood: e.likelihood, note: e.note ?? null,
      })),
      month_counts,
      sources_resolved: resolveSources(r.sources),
    });
  }

  // ---------- calendar / sources / search ----------
  const calendar = {};
  for (let m = 1; m <= 12; m++) calendar[m] = data.species.filter((s) => s.travel.best_months.includes(m)).map((s) => s.id);
  put("calendar.json", calendar);
  put("sources.json", data.sources.map((s) => ({
    id: s.id, kind: s.kind, title: s.title, year: s.year, citation: s.citation,
    authors: s.authors ?? null, doi: s.doi ?? null, url: s.url ?? (s.doi ? `https://doi.org/${s.doi}` : null),
  })));
  const hay = (...p) => p.filter(Boolean).join(" ").toLowerCase();
  put("search.json", [
    ...data.species.map((s) => ({ kind: "species", id: s.id, names: s.names, scientific_name: s.scientific_name,
      text: hay(s.names.zh, s.names.en, s.scientific_name, ...(s.synonyms || [])) })),
    ...data.taxa.map((t) => ({ kind: "taxon", id: t.id, names: t.names, scientific_name: t.scientific_name,
      text: hay(t.names.zh, t.names.en, t.scientific_name) })),
    ...data.regions.map((r) => ({ kind: "region", id: r.id, names: r.names, scientific_name: null,
      text: hay(r.names.zh, r.names.en) })),
  ]);

  // ---------- manifest ----------
  const hash = createHash("sha256");
  for (const [rel, v] of [...files.entries()].sort()) hash.update(rel).update(JSON.stringify(v));
  const endpointsDef = JSON.parse(readFileSync(join(ROOT, "contract", "endpoints.json"), "utf8"));
  put("manifest.json", {
    api_version: endpointsDef.api_version,
    data_hash: hash.digest("hex").slice(0, 16),
    generated_at: new Date().toISOString(),
    languages: ["zh", "en"],
    counts: { taxa: data.taxa.length, species: data.species.length, regions: data.regions.length, sources: data.sources.length },
    endpoints: Object.fromEntries(endpointsDef.endpoints.map((e) => [e.key, e.path])),
    repository: "https://github.com/travelagentshawn/BioAtlas",
    licenses: { code: "MIT", data: "CC-BY-4.0" },
  });

  // ---------- contract check ----------
  const contract = loadSchemas(join(ROOT, "contract"));
  const bad = [];
  for (const ep of endpointsDef.endpoints) {
    const re = new RegExp("^" + ep.path.replace(/[.]/g, "\\.").replace("{id}", "[^/]+") + "$");
    const matched = [...files.keys()].filter((k) => re.test(k));
    if (!matched.length) bad.push(`contract: endpoint "${ep.key}" (${ep.path}) produced no files`);
    for (const rel of matched) {
      for (const m of validate(files.get(rel), { $ref: `#/$defs/${ep.shape}` }, contract, "api-v1.schema.json"))
        bad.push(`contract: ${rel}${m}`);
    }
  }
  for (const rel of files.keys()) {
    if (!endpointsDef.endpoints.some((ep) => new RegExp("^" + ep.path.replace(/[.]/g, "\\.").replace("{id}", "[^/]+") + "$").test(rel)))
      bad.push(`contract: generated file "${rel}" is not declared in contract/endpoints.json`);
  }
  if (bad.length) { bad.forEach((b) => console.error("ERROR " + b)); throw new Error("API output violates contract/"); }

  // ---------- write ----------
  for (const [rel, v] of files) {
    const p = join(out, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, JSON.stringify(v) + "\n");
  }
  // publish schemas + contract next to the API so any client (or AI) can fetch them
  for (const [dir, sub] of [["schema", "schema"], ["contract", "contract"]]) {
    mkdirSync(join(out, sub), { recursive: true });
    for (const f of readdirSync(join(ROOT, dir))) if (f.endsWith(".json")) copyFileSync(join(ROOT, dir, f), join(out, sub, f));
  }
  console.log(`api: wrote ${files.size} files to ${out}`);
  return files.size;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--out");
  buildApi(join(ROOT, i > -1 ? process.argv[i + 1] : "dist"));
}
