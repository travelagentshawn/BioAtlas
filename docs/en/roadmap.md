# Roadmap

A public to-do list. Open an issue or say so in a PR before claiming an item.

## Data (top priority: verification)

- [ ] Verify every `seed` record: that citations exist, DOIs, age ranges, IUCN categories.\n- [x] Add record-level review audit metadata and specialist sign-off constraints; actual scientific review remains outstanding.
- [ ] Add `external_ids` (GBIF, NCBI Taxonomy, Open Tree, Wikidata) per group — verified values only.
- [ ] Broaden coverage: rainforest, reefs and coasts, alpine meadows, African savanna, European gardens.
- [ ] Add fungi and bryophytes — just as common on trips.
- [ ] Add clearly licensed photographs (`media`).

## Modules

- [x] Nature locator map for documented scenes, with monthly filtering.
- [x] Scientific source search and data quality dashboard for citations, review status and missing fields.

- [x] Phenology calendar view per species and per destination (first pass; based on recorded months).
- [x] Identification search by name, colour tags, size range, habitat, country and month (optional colour/size data still needs population).
- [x] Sound library UI and licensing fields; recordings await licensed contributions.
- [x] Conservation assessment and species field-etiquette index; current local regulations still need jurisdiction-by-jurisdiction verification.
- [x] Species recognition and common-ancestor learning modes (first pass).

## Technical

- [x] API v1 schemas and endpoint contract are published alongside the generated API.
- [ ] Full Japanese localization (language selector scaffold is present; untranslated strings currently fall back to English).
- [ ] Dedicated accessibility audit (keyboard focus, skip navigation, reduced motion and chart descriptions added; screen-reader review of the tree remains).
- [x] PWA shell caching and per-trip pre-download for same-origin API data.
