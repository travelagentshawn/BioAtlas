# Overview

BioAtlas is an open **field atlas of the plants and animals travellers actually see**. It puts molecular phylogeny (who is closest kin to whom, and when lineages split) and classical taxonomy (kingdom to species) into one structured dataset, so you can recognise ginkgo, egrets or sika deer on a trip — and know where they sit on the tree of life.

## Two primary interface views

The main interface has two peer entry points rather than combining different kinds of information into one overloaded screen:

- **Field atlas (usable workspace):** the default home for species search, seasonal discoveries, travel scenes, nature maps, seasonality, field identification, conservation notes, sounds, learning, and trip checklists.
- **Evolution tree (phylogeny view):** a dedicated view of BioAtlas's own curated tree, with expand/collapse, taxonomic outline, divergence-age annotations, and links to taxon and species records.

Tree branches can be expanded or collapsed by pointer, or by tabbing to a node and pressing Enter or Space; outline mode provides an alternative readable structure.\n\nBoth views use the same API and stable taxon/species IDs. The tree is the focused scientific-relationship view; the field atlas is the practical observation and discovery workspace. External taxonomic authorities remain source-level comparisons and never silently rewrite BioAtlas's own tree.

## What it is

- **Public structured data**: JSON files in `data/`, validated by `schema/`; readable, editable and extensible by people and AIs.
- **A static JSON API**: compiled by `tools/` into `dist/api/v1/`; it is the **only** interface between data and UI (see [API contract v1](api-contract.md)).
- **A zero-dependency web UI** in `ui/` that reads only that API.
- **Online documentation** — this page — sourced from `docs/`.
- **A trip workbench** linking the atlas to travel planning (see [Travel workbench integration](workbench-integration.md)).

## Principles

1. **Rigour over volume.** Divergence times are always ranges with sources; paraphyletic groups are flagged; every record has a review status.
2. **Decoupled.** Data, UI and docs can be developed and built by different people or different AIs, meeting only at the contract.
3. **Model-neutral.** Any AI or human can take part; conventions live in the repository, not in any model's memory (see [Multi-AI collaboration protocol](ai-collaboration.md)).
4. **Extensible.** A new species is one new JSON file; a new module is a new contract endpoint.

## Current status (please read)

> Every record in `data/` is currently **`seed`**: drafted by an AI and **not yet checked line by line against the primary literature**. DOIs, divergence-time ranges and IUCN categories must be verified by a person before a record can be promoted to `reviewed`. Every page in the UI shows this status.

This is by design: first a collaborative skeleton, then people and AIs verify and promote records one by one.

## Repository map

| Path | Contents | Owner |
| --- | --- | --- |
| `data/` | taxa, species, regions, sources | data side |
| `schema/` | JSON Schemas for records | data side |
| `contract/` | API v1 response shapes and endpoint list | both sides; change with care |
| `tools/` | validate, build, serve, tests | data side / tooling |
| `ui/` | web interface | UI side |
| `docs/` | this documentation | anyone |
| `AGENTS.md`, `llms.txt` | entry points for AIs | anyone |

Next: [Quick start](quickstart.md).
