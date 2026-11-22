# AGENTS.md — instructions for any AI coding agent

BioAtlas is model-neutral. This file is the single entry point for every agent (any vendor, any model) and for humans. Full documentation: `docs/en/` and `docs/zh/` (also served in the site under **Documentation**).

## What this repo is

An open field atlas joining molecular phylogeny and taxonomy for plants and animals seen while travelling. Three decoupled layers meet only at a contract:

```
data/ + schema/  --(tools/build-api.mjs)-->  dist/api/v1/*.json  <--(fetch)--  ui/
                                   contract/ = shapes + endpoint list
```

## Commands (Node >= 20, zero dependencies, no install)

```
npm run validate      # schema + cross-reference check of data/   (must pass)
npm run build:api     # data side only -> dist/api/v1             (never reads ui/)
npm run build:ui      # UI side only   -> dist/                   (never reads data/)
npm run build:docs    # docs -> dist/docs
npm run check         # everything CI runs
npm run dev           # build + serve on http://localhost:8080
```

## Pick a role; stay in your directories

| Role | May edit | Must not edit |
| --- | --- | --- |
| Data | `data/`, `schema/`, `tools/lib/`, `tools/build-api.mjs` | `ui/` |
| UI | `ui/` | `data/`, `schema/` |
| Docs | `docs/`, `README.md`, `AGENTS.md`, `llms.txt` | — |
| Contract | `contract/` (needs both sides; keep v1 backward compatible) | — |

## Rules that are never negotiable

1. **Never fabricate citations, DOIs, dates or IUCN categories.** If you cannot verify, leave the field out or keep `review_status: "seed"` and list it as unverified in your PR.
2. **Divergence times are ranges** (`min <= estimate <= max`) with `confidence` and a `source`.
3. **Flag paraphyletic or contested groups** (`phylo.monophyly`, `phylo.debate`).
4. **One file per record; file name = `id` + `.json`.** `zh` and `en` text are both required.
5. **The UI fetches data only through `ui/js/api.js`** and never reads `data/`, `schema/`, `tools/`.
6. **Output must satisfy `contract/`.** v1 changes are additive only.
7. **Media needs a clear licence, attribution and source URL.**
8. Run `npm run check` before you finish.

## Reading the data without building

- Records: `data/taxa/*.json`, `data/species/*.json`, `data/regions/*.json`, `data/sources/*.json`
- Schemas: `schema/*.schema.json`
- After a build: `dist/api/v1/manifest.json` lists every endpoint. A one-page map is in `llms.txt`.

## Commits and PRs

- Small, single-purpose PRs. Describe: purpose, directories changed, contract impact, how verified, what still needs human verification.
- If an AI authored the commit, add a trailer `Co-Authored-By: <model name and version> <email>`. Any model is fine.
- Do not overwrite someone else's unmerged work; pull the latest `main` first.

## Status

All records are currently `seed` (AI-drafted, not yet verified against primary literature). Promoting a record to `reviewed` means a contributor checked every citation and claim; say what you checked in the PR.
