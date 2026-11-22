# UI development

The UI lives in `ui/` and is **build-free** native ES modules: no bundler, no framework, no dependencies.

## Boundaries

- Fetch data only through `ui/js/api.js`; no other file should call `fetch` for data.
- Do not read or reference `data/`, `schema/` or `tools/` (`npm run check` enforces this).
- Depend only on fields marked `required` in the [API contract v1](api-contract.md).

## Layout

| Path | Role |
| --- | --- |
| `ui/index.html` | entry |
| `ui/config.js` | `apiBase`, `docsBase`, repository URL |
| `ui/css/bioatlas.css` | all styles; colours are CSS variables, with a dark theme |
| `ui/js/app.js` | shell, router, theme and language toggles |
| `ui/js/api.js` | the **only** data-fetching module |
| `ui/js/views/*.js` | pages: home, explore, species, taxon, tree, regions, workbench, docs |
| `ui/js/viz.js` | data-driven graphics: lineage sigil, month wheel, bar chart |
| `ui/js/tree-layout.js` | tree layout and rendering, also used by the workbench |
| `ui/js/md.js` | safe Markdown renderer (builds DOM, no innerHTML) |
| `ui/js/labels.js` | zh/en labels for enum values (unknown values fall back to the raw id) |

## Workflow

```bash
npm run build:api     # get an API first (or point ?api= elsewhere)
npm run build:ui
npm run serve
```

When working only on the UI you do not need to understand the data: point `apiBase` at any API that satisfies the contract.

## Design conventions

- **Look:** "field journal" — paper background, ink green (plants) and terracotta (animals); serif headings, sans-serif body. All colours are `:root` variables, redefined for dark.
- **Good without photos:** each species gets a "lineage sigil" (each ring = one ancestral group) and a month wheel generated from data; photos appear only when `media` exists.
- **Readability:** body ≥ 16px, line-height 1.7, WCAG AA contrast, keyboard support and `prefers-reduced-motion`.
- **Safety:** all data text goes through `h()` / `textContent`; links accept only `http(s)`.
- **New page:** add a line to `routes` in `app.js` and write a `views/xxx.js` exporting `(root, {params, query}) => Promise`.
- **New copy:** interface text uses `tr("中文", "English")`; data text uses `loc(obj)`.

## Replacing the whole UI

Anything that reads `api/v1` may replace `ui/` (React, Svelte, a native app). Keep the built-in Documentation entry and the link to `llms.txt`.
