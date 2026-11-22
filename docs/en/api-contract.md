# API contract v1

The API is a set of **static JSON files** with no server logic. The base URL defaults to `api/v1/` on the site. Shapes live in [`contract/api-v1.schema.json`](repo:contract/api-v1.schema.json), the endpoint list in [`contract/endpoints.json`](repo:contract/endpoints.json); the builder validates its output against both on every run.

## Endpoints

| Path | Shape | Description |
| --- | --- | --- |
| `manifest.json` | Manifest | Entry point: version, data hash, counts, endpoint map |
| `tree.json` | TreeNode | The whole tree (nested), species attached to their taxon |
| `taxa.json` | TaxonLite[] | All taxa (flat) |
| `taxa/{id}.json` | Taxon | One taxon: lineage, children, species, sources |
| `species.json` | SpeciesLite[] | All species (lightweight) |
| `species/{id}.json` | Species | Full species: lineage, regions, closest relatives, sources |
| `regions.json` | RegionLite[] | All regions (lightweight) |
| `regions/{id}.json` | Region | One region: species, per-month counts |
| `calendar.json` | Calendar | Month → species ids (by best months) |
| `sources.json` | Source[] | All citations |
| `search.json` | SearchIndex | Client-side search index |

The builder also copies `schema/` and `contract/` to `api/v1/schema/` and `api/v1/contract/`, so any client or AI can fetch them.

## Conventions

- **Localised text** is `{ "zh": "...", "en": "..." }`; both are always present; clients may fall back.
- **Months** are integers 1–12.
- **Ages** are `{ estimate, min, max, confidence, source }` in millions of years.
- `*_resolved` arrays already expand ids into full objects; clients need no extra requests.
- `relatives`: species ordered by **youngest most-recent-common-ancestor first**, each with its `mrca` taxon.
- Extra fields beyond the contract may appear; clients must ignore unknown fields.

## Examples

```bash
curl -s https://<site>/api/v1/manifest.json
curl -s https://<site>/api/v1/species/ginkgo-biloba.json
```

## Changing the contract

1. Read the compatibility rules in [Three-layer architecture](architecture.md).
2. In one PR update `contract/api-v1.schema.json` (and `endpoints.json` if needed), `tools/build-api.mjs` and this page.
3. State in the PR description what the UI side must do. Adding optional fields requires no immediate UI action.
4. Run `npm run check`.
