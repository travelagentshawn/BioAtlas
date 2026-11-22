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
import { auditTaxonomy } from "./audit-taxonomy.mjs";

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
    sources: ["apg-iv-2016"],
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
    sources: ["apg-iv-2016"],
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


test("Japanese documentation navigation resolves every page", () => {
  const index = JSON.parse(readFileSync(join(ROOT, "docs/index.json"), "utf8"));
  assert.ok(index.ja?.length >= 5);
  for (const lang of ["zh", "en", "ja"]) {
    for (const page of index[lang]) {
      assert.ok(readFileSync(join(ROOT, "docs", page.file), "utf8").length > 0, `${lang}/${page.file} is empty`);
    }
  }
});


test("authority registry and taxonomic assertions preserve independent sources", () => {
  const { data } = loadAll();
  const authorities = data.sources.filter(s => s.authority_role);
  assert.ok(authorities.length >= 15);
  assert.ok(authorities.every(s => s.taxonomic_scope?.length && s.identifier_scheme && s.update_policy && s.accessed_at));
  assert.ok(authorities.some(s => s.id === "authority-catalogue-of-life-xr" && s.authority_role === "global-backbone"));
  assert.ok(authorities.some(s => s.id === "authority-ipni" && s.authority_role === "nomenclatural-index"));
  assert.ok(authorities.some(s => s.id === "authority-apg" && s.authority_role === "classification-framework"));
  assert.ok(authorities.some(s => s.id === "authority-gbif-backbone-legacy" && s.legacy === true));
  assert.equal(authorities.find(s => s.id === "authority-catalogue-of-life-xr")?.current_version, "2026-10-16 XR");
  assert.equal(authorities.find(s => s.id === "authority-catalogue-of-life-base")?.current_version, "2026-10-14 Base");
  const ginkgo = data.species.find(s => s.id === "ginkgo-biloba");
  assert.equal(ginkgo.taxonomic_assertions.find(a => a.authority === "authority-powo")?.name_status, "accepted");
  assert.equal(ginkgo.taxonomic_assertions.find(a => a.authority === "authority-ipni")?.name_status, "unassessed");
  const flyAgaric = data.species.find(s => s.id === "amanita-muscaria");
  assert.equal(flyAgaric.taxonomic_assertions.length, 2);
  assert.ok(flyAgaric.taxonomic_assertions.every(a => a.name_status === "unassessed"));
  const record = structuredClone(flyAgaric);
  record.taxonomic_assertions[0].authority = "missing-authority";
  const errors = [];
  checkIntegrity({ ...data, species: [record] }, errors, []);
  assert.ok(errors.some(e => e.includes('unknown authority "missing-authority"')));
});

test("API publishes authority registry and taxonomic assertions", () => {
  const out = mkdtempSync(join(tmpdir(), "bioatlas-authorities-"));
  try {
    buildApi(out);
    const read = (p) => JSON.parse(readFileSync(join(out, "api/v1", p), "utf8"));
    const manifest = read("manifest.json");
    const authorities = read("taxonomic-authorities.json");
    const flyAgaric = read("species/amanita-muscaria.json");
    assert.equal(authorities.length, manifest.counts.authorities);
    assert.ok(authorities.some(a => a.id === "authority-catalogue-of-life-xr" && a.current_version === "2026-10-16 XR"));
    assert.ok(authorities.some(a => a.id === "authority-catalogue-of-life-base" && a.current_version === "2026-10-14 Base"));
    const sourceIndex = read("sources.json");
    assert.ok(sourceIndex.some(source => source.id === "authority-catalogue-of-life-xr" && source.accessed_at === "2026-11-22" && source.year === 2026 && source.current_version === "2026-10-16 XR"));
    assert.equal(flyAgaric.taxonomic_assertions.length, 2);
    assert.ok(flyAgaric.sources_resolved.some(s => s.id === "authority-index-fungorum"));
    assert.ok(manifest.languages.includes("ja"));
  } finally { rmSync(out, { recursive: true, force: true }); }
});



test("coral taxonomy and legal protections remain source-backed and distinct from IUCN", () => {
  const { data } = loadAll();
  const taxa = new Map(data.taxa.map(t => [t.id, t]));
  const staghorn = data.species.find(s => s.id === "acropora-cervicornis");
  const elkhorn = data.species.find(s => s.id === "acropora-palmata");
  assert.equal(taxa.get("cnidaria")?.parent, "animalia");
  assert.equal(taxa.get("anthozoa")?.parent, "cnidaria");
  assert.equal(taxa.get("hexacorallia")?.rank, "subclass");
  assert.equal(taxa.get("scleractinia")?.parent, "hexacorallia");
  assert.equal(taxa.get("acropora")?.parent, "acroporidae");
  for (const record of [staghorn, elkhorn]) {
    assert.ok(record);
    assert.equal(record.conservation.iucn, undefined);
    assert.equal(record.conservation.protections.length, 4);
    assert.ok(record.conservation.protections.every(p => data.sources.some(source => source.id === p.source)));
    assert.equal(validate(record, schemas["species.schema.json"], schemas, "species.schema.json").length, 0);
  }
  assert.equal(staghorn.external_ids.itis, "52862");
  assert.equal(elkhorn.external_ids.itis, "52861");
  const coralScene = data.regions.find(r => r.id === "caribbean-coral-reefs");
  assert.ok(coralScene?.species.some(entry => entry.species === staghorn.id && entry.evidence?.length));
  assert.ok(coralScene?.species.some(entry => entry.species === elkhorn.id && entry.evidence?.length));
  const bad = structuredClone(staghorn);
  bad.conservation.protections[0].source = "missing-protection-source";
  const errors = [];
  checkIntegrity({ ...data, species: [bad] }, errors, []);
  assert.ok(errors.some(e => e.includes('unknown source "missing-protection-source"')));
});

test("read-only taxonomy audit summarizes authority assertions without rewriting them", () => {
  const { data } = loadAll();
  const report = auditTaxonomy(data);
  assert.ok(report.summary.registered_authorities >= 17);
  assert.ok(report.summary.records_with_assertions >= 3);
  assert.equal(report.summary.potential_conflicts, 0);
  const ginkgo = report.records.find(record => record.record === "species:ginkgo-biloba");
  assert.equal(ginkgo.assertions.length, 2);
  assert.ok(ginkgo.assertions.some(assertion => assertion.authority === "authority-powo" && assertion.name_status === "accepted"));
  assert.ok(ginkgo.assertions.some(assertion => assertion.authority === "authority-ipni" && assertion.name_status === "unassessed"));
  const synthetic = structuredClone(data);
  synthetic.species.find(record => record.id === "ginkgo-biloba").taxonomic_assertions.push({
    authority: "authority-catalogue-of-life-base",
    record_id: "synthetic-test-only",
    scientific_name: "Ginkgo testname",
    name_status: "accepted",
    accessed_at: "2026-11-22",
    source: "powo-ginkgo-biloba"
  });
  assert.equal(auditTaxonomy(synthetic).summary.potential_conflicts, 1);
  assert.equal(data.species.find(record => record.id === "ginkgo-biloba").taxonomic_assertions.length, 2);
});
