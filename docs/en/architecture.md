# Three-layer architecture

```text
 data/ + schema/ ──(tools/build-api)──▶ dist/api/v1/*.json ◀──(fetch)── ui/
                                              ▲
                                  contract/ (shapes + endpoint list)
```

The layers meet only at the **contract**:

| Layer | Directory | Input | Output | Must not |
| --- | --- | --- | --- | --- |
| Data | `data/`, `schema/`, `tools/` | JSON written by people or AIs | `dist/api/v1/` | read `ui/` |
| Contract | `contract/` | — | response shapes (JSON Schema) + endpoint list | — |
| UI | `ui/` | HTTP responses from `api/v1` | the website | read `data/`, `schema/`, `tools/` |

## Why

- One AI can work only on the UI and another only on data without blocking each other: the UI developer can use any API that satisfies the contract; the data developer cannot break the UI as long as the contract check passes.
- The UI can be replaced wholesale (React, a mobile app…) without touching data.
- The API can live elsewhere: change `apiBase` in `ui/config.js`, or append `?api=https://example.org/api/v1`.

## Enforcement

- `tools/build-api.mjs` validates **every output file** against `contract/` and rejects files not declared in `endpoints.json`.
- `tools/check-boundaries.mjs` checks that `ui/` does not read data directories and the data side does not reference `ui/`.
- `npm run check` runs all of this in CI.

## Compatibility rules (SemVer)

- Allowed inside v1: new optional fields, new endpoints, new enum values (the UI must degrade gracefully on unknown enum values — see `ui/js/labels.js`).
- Forbidden inside v1: removing or renaming fields, changing types. That needs v2, served alongside v1 for a while.
- A contract change must update `contract/`, the builder output and `docs/*/api-contract.md` in one PR, and say what the UI side must do.
