# Roadmap

A public to-do list. Open an issue or say so in a PR before claiming an item.

## Data (top priority: verification)

- [x] Add per-association evidence references and missing-evidence warnings for region–species–month links; existing month ranges still require individual verification.

- [ ] Verify every `seed` record: that citations exist, DOIs, age ranges, IUCN categories.
- [x] Add record-level review audit metadata and specialist sign-off constraints; actual scientific review remains outstanding.
- [x] Add a layered, taxon-specific authority register and record-level taxonomic assertions; IDs remain `unassessed` until the provider record is checked.
- [ ] Populate verified external IDs and accepted-name crosswalks for each group.
- [ ] Broaden coverage: rainforest, reefs and coasts, alpine meadows, African savanna, European gardens.
- [x] Add first fungal and bryophyte starter branches and species; continue broadening taxonomic and geographic coverage.
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
- [ ] Full Japanese localization (core UI and documentation groundwork exists; untranslated strings and older records still fall back to English).
- [ ] Dedicated accessibility audit (keyboard focus, skip navigation, reduced motion and chart descriptions added; screen-reader review of the tree remains).
- [x] PWA shell caching and per-trip pre-download for same-origin API data.
