# Multi-AI collaboration protocol

BioAtlas is not tied to any single model or platform. Conventions live in the repository, so any AI (or person) can take over after reading these pages.

## Entry points

| File | For |
| --- | --- |
| [`AGENTS.md`](repo:AGENTS.md) | General AI coding agents (most tools read it automatically) |
| [`llms.txt`](repo:llms.txt) | An AI that only wants to read the data: a one-page map |
| [`manifest.json`](api:manifest.json) | Machine-readable entry with every endpoint |
| This documentation | Details |

## Roles and ownership

| Role | May change | Must not change | Done when |
| --- | --- | --- | --- |
| **Data agent** | `data/`, `schema/`, `tools/lib`, `tools/build-api.mjs` | `ui/` | `npm run validate` and `npm run build:api` pass |
| **UI agent** | `ui/` | `data/`, `schema/` | `npm run build:ui` passes and the pages work against any conforming API via `?api=` |
| **Docs agent** | `docs/`, `README.md`, `AGENTS.md`, `llms.txt` | — | `npm run build:docs` passes, links valid |
| **Contract change** | `contract/` | — | Both data and UI sides agree; see [API contract](api-contract.md) |

Agents can work **in parallel in different directories** and meet at the contract; no shared conversation context is needed.

## Hand-off rules

1. **The repository is the single source of truth.** Do not rely on "as I said earlier"; put decisions in PR descriptions, docs, or the roadmap.
2. **Small, complete PRs.** One concern per PR, passing `npm run check`.
3. **PR description template:** purpose; directories changed; contract impact; how verified; what still needs human verification.
4. **Commit attribution:** if an AI wrote it, end the commit with `Co-Authored-By: <model name and version> <email>`. Any model is fine.
5. **Do not overwrite others' unmerged work.** Pull the latest `main`; on conflict keep both intents and explain.
6. **When unsure, flag it; never invent.** Unverifiable citations, ages or categories stay `seed` and are listed in the PR as to-check.

## Checklist for an AI starting work

1. Read `AGENTS.md`, then the [Data model](data-model.md).
2. Run `npm run validate` to confirm a green baseline.
3. Change only what is in your role.
4. Run `npm run check` when done.
5. State in the PR what you verified and what you did not.

## Why this way

Different models are good at different things: some at searching and verifying literature, some at front-end work, some at writing. Decoupled directories, a machine-checkable contract and explicit review statuses let them review each other without having to trust each other.
