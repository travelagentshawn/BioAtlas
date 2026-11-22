# Taxonomic authority and name governance

BioAtlas uses a **layered, taxon-specific authority model**. No single database is treated as the final authority for every organism or every kind of assertion.

## Roles are not interchangeable

| Role | What it can establish | What it cannot establish by itself |
| --- | --- | --- |
| Global backbone | Broad name discovery, identifier crosswalks and a consistent entry point | Final specialist classification for every lineage |
| Nomenclatural index | Publication and nomenclatural record for a name | A universal phylogenetic classification or conservation status |
| Specialist checklist | Accepted names and classification within a specialist group | Classification outside its stated scope |
| Classification framework | Higher-level relationships within a defined group and version | Species-level nomenclatural validity outside its scope |
| Conservation assessment | A dated risk assessment | Taxonomic acceptance or a permanent conservation category |

## Authority register

The structured registry is published at `/api/v1/taxonomic-authorities.json`. The corresponding source records live in `data/sources/authority-*.json`.

| Group / purpose | Preferred authority | Governance note |
| --- | --- | --- |
| Global discovery and crosswalk | Catalogue of Life Base + eXtended Release (COL XR) | Base prioritises scrutinised global sources; XR maximises completeness through additional integrations. GBIF currently uses XR as its primary taxonomy. Pin the release and distinguish Base from XR in every import. |
| Plants: published names | International Plant Names Index (IPNI) | Nomenclatural index, not by itself an accepted-species checklist. |
| Plants: accepted names and distribution | Plants of the World Online (POWO) | Record access date and taxon page; check specialist literature when disputed. |
| Angiosperm higher classification | APG IV (and later published APG updates when available) | Explicitly versioned framework for orders and families of flowering plants. |
| Fungi: names | Index Fungorum / Species Fungorum and MycoBank | Preserve both identifiers and disagreement; resolve against current literature and nomenclatural rules. |
| Birds | IOC World Bird List | Store exact release/version. Other checklists may differ; do not silently merge concepts. |
| Reptiles | The Reptile Database | Specialist reptile checklist; retain access date. |
| Amphibians | Amphibian Species of the World | Specialist amphibian checklist; retain access date. |
| Mammals | Mammal Diversity Database | Store exact release/version. |
| Fishes | Catalog of Fishes | Specialist nomenclatural and taxonomic catalogue. |
| Marine organisms | World Register of Marine Species (WoRMS) | Preserve AphiaID and access date. |
| Broad supplementary crosswalk | ITIS and NCBI Taxonomy | Useful identifier and classification references; not a universal arbiter. |
| Conservation | IUCN Red List | Separate dated assessment record; never use as a taxonomic authority. |

The GBIF Backbone Taxonomy is retained only for legacy identifier crosswalks and compatibility. GBIF documentation states that it has been discontinued in favour of COL XR as the primary taxonomy; its identifiers remain supported. Do not use it as the default source for new accepted-name decisions.

## Record-level assertions

Taxa and species may carry `taxonomic_assertions[]`. Each assertion records:

- `authority`: authority registry ID from `data/sources/`
- `record_id`: exact identifier in that provider
- `scientific_name`: name string returned by that provider
- `name_status`: `accepted`, `synonym`, `unresolved`, or `unassessed`
- `classification_system` and `version`: optional named classification and release
- `accessed_at`: date the record was checked
- `source`: source record supporting the assertion

An identifier copied from an existing citation may be recorded as `unassessed` until the provider record is actually checked. This is deliberate: an ID is not proof that the name is accepted. Conflicting provider assertions are preserved side by side.

## Selection and conflict rules

1. Select authorities by taxonomic scope and assertion type, not by brand familiarity.
2. Distinguish nomenclatural availability, accepted-name status, taxon concept and phylogenetic classification.
3. Prefer the most recent applicable specialist treatment and primary taxonomic literature for a disputed concept.
4. Keep the provider, exact record ID, release/version and access date. Never silently rewrite or delete an older assertion.
5. If two authorities disagree, preserve both assertions, explain the conflict and leave BioAtlas status unresolved until reviewed.
6. Never infer an authority record ID from a name string. Query and verify the exact record before adding it.
7. A source becoming newer does not automatically promote a BioAtlas record from `seed` to `reviewed`.

## Update and migration policy

Authority data is imported in explicit, reviewable batches. Each batch records the provider release or access date, source snapshot, matching method, changed identifiers, accepted-name changes, synonym changes and unresolved conflicts. No bulk replacement of current BioAtlas names or parent relationships is allowed without a reviewed diff and explicit approval.

## Further reading

- [GBIF taxonomy interpretation](https://techdocs.gbif.org/en/data-processing/taxonomy-interpretation)
- [GBIF taxonomic identifier processing](https://techdocs.gbif.org/en/data-publishing/LSID-lookup)
- [NCBI taxonomy resources](https://ncbi.nlm.nih.gov/datasets/docs/v2/data-processing/taxonomy-processing/taxonomy-resources/)
- [ITIS](https://www.itis.gov/)

## Read-only audit command

Run `npm run audit:taxonomy` to emit a JSON report of registered authorities, record-level assertions, status counts and candidate disagreements. `npm run audit:taxonomy -- --strict` exits with code 2 if multiple providers mark different binomial strings as accepted for the same BioAtlas record. The comparison strips authorship only for candidate detection; it does not resolve synonymy or taxon concepts and never changes source data.
