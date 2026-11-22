#!/usr/bin/env node
// Dependency-free tests (node:test).  node tools/test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSchemas, validate } from "./lib/schema.mjs";
import { loadAll, checkIntegrity, ROOT } from "./lib/data.mjs";
import { buildApi } from "./build-api.mjs";

const schemas = loadSchemas(join(ROOT, "schema"));

test("validator rejects bad records and accepts good ones", () => {
  const base = JSON.parse(readFileSync(join(ROOT, "data/species/ginkgo-biloba.json"), "utf8"));
  assert.deepEqual(validate(base, schemas["species.schema.json"], schemas, "species.schema.json"), []);
  const bad = structuredClone(base);
  bad.travel.best_months = [13]; delete bad.names.en; bad.extra = 1;
  assert.ok(validate(bad, schemas["species.schema.json"], schemas, "species.schema.json").length >= 3);
});

test("all data validates with no cross-reference errors", () => {
  const { errors } = loadAll();
  assert.deepEqual(errors, []);
});

test("every divergence age is a consistent range", () => {
  for (const t of loadAll().data.taxa) {
    const a = t.phylo?.age_mya;
    if (a) assert.ok(a.min <= a.estimate && a.estimate <= a.max, t.id);
  }
});

test("API build satisfies the contract and computes MRCA correctly", () => {
  const out = mkdtempSync(join(tmpdir(), "bioatlas-"));
  try {
    buildApi(out);
    const read = (p) => JSON.parse(readFileSync(join(out, "api/v1", p), "utf8"));
    const m = read("manifest.json");
    assert.equal(m.api_version, "1.0.0");
    const panda = read("species/ailuropoda-melanoleuca.json");
    const deer = panda.relatives.find((r) => r.species.id === "cervus-nippon");
    assert.equal(deer.mrca.id, "mammalia");
    const duck = panda.relatives.find((r) => r.species.id === "aix-galericulata");
    assert.equal(duck.mrca.id, "tetrapoda");
    assert.equal(read("tree.json").id, "eukaryota");
    assert.equal(read("species.json").length, m.counts.species);
  } finally { rmSync(out, { recursive: true, force: true }); }
});


test("review audit metadata is schema-validated", () => {
  const base = JSON.parse(readFileSync(join(ROOT, "data/species/ginkgo-biloba.json"), "utf8"));
  const good = structuredClone(base);
  good.review = {
    reviewed_at: "2026-11-22",
    reviewed_by: "test-reviewer",
    reviewer_role: "contributor",
    method: "literature-check",
    scope: ["taxonomy", "identification"]
  };
  assert.deepEqual(validate(good, schemas["species.schema.json"], schemas, "species.schema.json"), []);
  const bad = structuredClone(good);
  delete bad.review.reviewed_by;
  assert.ok(validate(bad, schemas["species.schema.json"], schemas, "species.schema.json").length > 0);
});

test("review status cannot be promoted without an audit or false expert sign-off", () => {
  const { data } = loadAll();
  const record = structuredClone(data.species[0]);
  const testData = { ...data, species: [record], taxa: [...data.taxa], regions: [...data.regions], sources: [...data.sources] };
  record.review_status = "reviewed";
  let errors = [];
  checkIntegrity(testData, errors, []);
  assert.ok(errors.some(e => e.includes("requires an auditable review object")));

  record.review = {
    reviewed_at: "2026-11-22",
    reviewed_by: "test-reviewer",
    reviewer_role: "contributor",
    method: "literature-check",
    scope: ["taxonomy"]
  };
  record.review_status = "expert-reviewed";
  errors = [];
  checkIntegrity(testData, errors, []);
  assert.ok(errors.some(e => e.includes("requires a specialist expert-assessment review")));
});


test("region species evidence requires a valid existing source", () => {
  const { data } = loadAll();
  const region = structuredClone(data.regions[0]);
  region.species[0].evidence = [{ type: "published-literature", source: "source-that-does-not-exist" }];
  const testData = { ...data, regions: [region] };
  const errors = [];
  checkIntegrity(testData, errors, []);
  assert.ok(errors.some(e => e.includes("unknown source \"source-that-does-not-exist\"")));
});


test("fungi and moss branches have source-backed starter records", () => {
  const { data } = loadAll();
  const taxa = new Map(data.taxa.map(t => [t.id, t]));
  const flyAgaric = data.species.find(s => s.id === "amanita-muscaria");
  const haircap = data.species.find(s => s.id === "polytrichum-commune");
  assert.equal(flyAgaric?.kingdom, "fungi");
  assert.equal(taxa.get("amanita")?.kingdom, "fungi");
  assert.equal(haircap?.kingdom, "plantae");
  assert.equal(taxa.get("polytrichum")?.parent, "polytrichaceae");
  const newScenes = data.regions.filter(r => ["eastern-us-temperate-forests", "british-irish-bogs-wet-heaths"].includes(r.id));
  assert.equal(newScenes.length, 2);
  assert.ok(newScenes.every(r => r.species.every(e => (e.evidence || []).length > 0)));
});
