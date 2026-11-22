#!/usr/bin/env node
// Read-only taxonomy assertion audit. Never edits source records or chooses an accepted name.
import { loadAll } from "./lib/data.mjs";

export function auditTaxonomy(data) {
  const authorities = data.sources.filter((source) => source.authority_role);
  const records = [
    ...data.taxa.map((record) => ({ kind: "taxon", ...record })),
    ...data.species.map((record) => ({ kind: "species", ...record })),
  ];
  const assertions = records.flatMap((record) =>
    (record.taxonomic_assertions || []).map((assertion) => ({ record, assertion }))
  );
  const byRecord = new Map();
  for (const item of assertions) {
    const key = `${item.record.kind}:${item.record.id}`;
    if (!byRecord.has(key)) byRecord.set(key, []);
    byRecord.get(key).push(item.assertion);
  }

  // Strip authorship for a cautious binomial comparison only. This is a
  // candidate-conflict signal, not synonymy resolution or taxon-concept matching.
  const comparableName = (name) => String(name || "").trim().split(/\\s+/).slice(0, 2).join(" ").toLowerCase();
  const potentialConflicts = [];
  for (const [recordKey, items] of byRecord) {
    const accepted = items.filter((item) => item.name_status === "accepted");
    const acceptedNames = [...new Set(accepted.map((item) => comparableName(item.scientific_name)))];
    if (acceptedNames.length > 1) {
      potentialConflicts.push({
        record: recordKey,
        kind: "multiple-accepted-name-strings",
        accepted: accepted.map(({ authority, scientific_name, record_id, source }) => ({ authority, scientific_name, record_id, source })),
        note: "Candidate conflict only; compare provider scope, taxon concepts, releases and primary literature before deciding."
      });
    }
  }

  const statusCounts = Object.fromEntries(["accepted", "synonym", "unresolved", "unassessed"].map((status) => [
    status, assertions.filter(({ assertion }) => assertion.name_status === status).length
  ]));
  const roleCounts = Object.fromEntries([...new Set(authorities.map((authority) => authority.authority_role))].sort().map((role) => [
    role, authorities.filter((authority) => authority.authority_role === role).length
  ]));

  return {
    generated_at: new Date().toISOString(),
    policy: "Read-only audit; never merges providers, resolves synonyms or changes BioAtlas scientific_name / parent fields.",
    summary: {
      registered_authorities: authorities.length,
      records_with_assertions: byRecord.size,
      records_without_assertions: records.length - byRecord.size,
      assertions: assertions.length,
      assertions_by_status: statusCounts,
      authority_roles: roleCounts,
      potential_conflicts: potentialConflicts.length
    },
    potential_conflicts: potentialConflicts,
    records: [...byRecord.entries()].map(([record, items]) => ({
      record,
      assertions: items.map(({ authority, record_id, scientific_name, name_status, version, accessed_at, source }) =>
        ({ authority, record_id, scientific_name, name_status, version: version ?? null, accessed_at, source }))
    }))
  };
}

if (process.argv[1] && process.argv[1].endsWith("audit-taxonomy.mjs")) {
  const { data, errors } = loadAll();
  if (errors.length) {
    console.error(errors.join("\\n"));
    process.exit(1);
  }
  const report = auditTaxonomy(data);
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes("--strict") && report.summary.potential_conflicts > 0) process.exit(2);
}
