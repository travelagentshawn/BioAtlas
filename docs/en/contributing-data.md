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
