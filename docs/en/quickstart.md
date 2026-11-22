# Quick start

You only need **Node.js 20 or newer**. There are no third-party dependencies and no `npm install`.

## Run locally

```bash
git clone https://github.com/travelagentshawn/BioAtlas.git
cd BioAtlas
npm run dev        # validate + build + serve on http://localhost:8080
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run validate` | Validate all data against `schema/` and check cross-references |
| `npm run build:api` | **Data side**: build only `dist/api/v1`; never touches `ui/` |
| `npm run build:ui` | **UI side**: copy `ui/` to `dist/`; never reads `data/` |
| `npm run build:docs` | Copy the docs and check the nav file |
| `npm run build` | All of the above |
| `npm run serve` | Serve `dist/` statically |
| `npm run check` | Used by CI: validate + boundary check + build + tests |

## Read the data without running anything

The data is just files:

```bash
cat data/species/ginkgo-biloba.json
```

After a build, read the API:

- [`manifest.json`](api:manifest.json) — entry point listing every endpoint and the counts
- [`species.json`](api:species.json) — lightweight list of all species
- [`tree.json`](api:tree.json) — the whole tree

## Add a species (five minutes)

1. Copy `data/species/ginkgo-biloba.json` to `data/species/<scientific-name-hyphenated>.json`.
2. Edit it; `id` must equal the file name and `taxon` must be an existing taxon id.
3. Every cited source must exist in `data/sources/`.
4. Add the species to at least one `data/regions/*.json`.
5. Run `npm run validate`, then commit.

Full rules: [Contributing data & scientific rules](contributing-data.md).
