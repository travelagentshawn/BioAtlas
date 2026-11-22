# BioAtlas · 旅途生物图鉴

An open **field atlas of the plants, animals and fungi travellers actually see**, joining molecular phylogeny with classical taxonomy. 把分子系统发育与传统分类学放进同一套公开数据，认识旅途中遇到的植物、动物与真菌。

- 🌳 **Tree of life** built on molecular phylogeny — divergence times as ranges with sources, paraphyletic groups flagged
- 🧭 **Travel scenes & trip workbench** — what you may meet, where and in which month; export a checklist and a phylogeny of your trip
- 📖 **Documentation built into the site** (中文 / English)
- 🤖 **Model-neutral AI collaboration** — see [`AGENTS.md`](AGENTS.md) and [`llms.txt`](llms.txt)
- 🔌 **UI and data fully decoupled** — they meet only at the [API contract](contract/)

> **Status:** every record is currently `seed` (AI-drafted, **not yet verified** against primary literature). Please help verify — see [docs/en/contributing-data.md](docs/en/contributing-data.md).

## Quick start

Node.js ≥ 20, no dependencies, no install.

```bash
npm run dev     # validate + build + serve at http://localhost:8080
```

| Command | Purpose |
| --- | --- |
| `npm run validate` | validate `data/` against `schema/` + cross-references |
| `npm run build:api` | data side only → `dist/api/v1` |
| `npm run build:ui` | UI side only → `dist/` |
| `npm run check` | everything CI runs |

## Layout

```
data/      taxa, species, regions, sources  (one JSON file per record)  — CC BY 4.0
schema/    JSON Schemas for every record kind and the trip interchange format
contract/  API v1: response shapes + endpoint list (the only link between data and UI)
tools/     validate, build-api, build, serve, tests (zero dependencies)
ui/        web interface (native ES modules, no build step)                — MIT
docs/      documentation, zh + en, rendered inside the site
```

## Read or extend the data

Everything is plain JSON: open `data/species/ginkgo-biloba.json`, or after a build fetch `dist/api/v1/manifest.json`. To add a species, copy an existing file, edit it, run `npm run validate`. See the [documentation](docs/en/overview.md) ([中文](docs/zh/overview.md)).

## Licences

Code: MIT ([`LICENSE`](LICENSE)). Data and docs: CC BY 4.0 ([`data/LICENSE.md`](data/LICENSE.md)).
