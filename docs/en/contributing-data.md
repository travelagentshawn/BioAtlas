# Contributing data & scientific rules

People and AIs are both welcome. Read the [Data model](data-model.md) first.

## Workflow

1. Branch, then edit or add JSON files under `data/`.
2. `npm run validate` (must pass).
3. `npm run check` before committing.
4. Open a PR stating: what changed, which literature supports it, and whether any review status changed.

Every species, taxon and region page has a "Suggest an edit on GitHub" link pointing at the exact file.

## Scientific rules (reviewers check these)

1. **Every non-trivial scientific claim needs a source**, and the source must be a record in `data/sources/`.
2. **Never fabricate citations.** DOI, authors, year, volume and pages must come from literature you actually checked. If unsure, **omit `doi`** and keep the record `seed`.
3. **Divergence times are ranges**, with `confidence` (`high` / `moderate` / `approximate`) and a source. If studies disagree, give a range covering the main estimates and explain in `phylo.debate`.
4. **Flag paraphyly.** When a traditional group conflicts with molecular evidence, mark `monophyly: "paraphyletic"` or `"contested"` and explain, rather than silently reusing the old idea.
5. **Separate evidence from speculation.** `evolution.story` states only what the literature supports; choose evidence types honestly (genome, molecular clock, fossil, morphology, ecology, classification).
6. **IUCN categories need an `as_of` year.** They change; if you cannot state the year, leave the block out.
7. **Only add images with clear licences.** `license`, `attribution` and `source_url` are required; if unsure, skip the image.
8. **Travel information must be specific and responsible.** Best months and scenes should come from reliable sources or first-hand experience; wildlife conduct (feeding, distance) goes in `travel.etiquette`.
9. **Write both zh and en.** Other languages are optional.

## Promoting review status

- `seed → reviewed`: check each citation (it exists, the claim matches the source, the age range is reasonable) and list what you checked in the PR.
- `reviewed → expert-reviewed`: a domain specialist confirms; name the reviewer and date in the PR.

## Tips

- A taxon needs at least one source, otherwise `validate` warns.
- Species without a suitable taxon: add the family (and a clade if needed) first.
- Only fill `external_ids` (GBIF, NCBI, Wikidata…) with values you have **verified**.


## Auditable review metadata (the optional `review` field)

When promoting a record from `seed` to `reviewed` or `expert-reviewed`, add a `review` object to that same record. A PR description alone is not a durable record-level audit trail.

```json
{
  "review": {
    "reviewed_at": "YYYY-MM-DD",
    "reviewed_by": "GitHub handle or verifiable reviewer identifier",
    "reviewer_role": "contributor",
    "method": "literature-check",
    "sources": ["existing-source-id"],
    "scope": ["taxonomy", "identification", "distribution", "phenology"],
    "notes": { "zh": "核对范围与仍存疑点", "en": "What was checked and what remains uncertain" }
  }
}
```

- Use the actual review date; never backdate or guess it.
- Identify a real reviewer. Do not present an AI model as a human reviewer.
- `expert-reviewed` requires both `reviewer_role: specialist` and `method: expert-assessment`.
- `sources` may only reference source IDs that exist in this repository. Field observation is a valid review method, but must not be misrepresented as published literature.
- Review metadata documents a process; it is not automatic certification and does not guarantee a claim is correct.
- Existing records remain unchanged. This change does not promote any `seed` record.


## Evidence requirements for regional occurrence records

When adding or editing a species/month association in `data/regions/*.json`, add link-level `evidence` whenever possible. For example:

```json
{
  "species": "acer-palmatum",
  "months": [10, 11],
  "likelihood": "common",
  "evidence": [
    { "type": "regional-checklist", "source": "existing-regional-flora-source" }
  ]
}
```

The cited source must actually support occurrence in that region and the stated months. A source showing presence somewhere in a country does not establish presence at a particular site or in a particular month. If no source is available, retain the existing association with its unverified label; never invent evidence.
