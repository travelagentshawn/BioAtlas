# Travel workbench integration

The atlas and trip planning connect through three channels, none needing a backend.

## 1. The built-in trip workbench (`#/planner`)

Pick a month and destinations/scenes to get a tick-off checklist (in-season first), summary counts and a **phylogeny of this trip**. State is kept locally in the browser (`localStorage`).

## 2. Deep links

An external page can open the workbench with parameters:

```text
#/planner?regions=nara-park-japan,urban-park-ponds-east-asia&month=11
#/planner?lat=34.69&lng=135.84&r=30&month=11
```

| Parameter | Meaning |
| --- | --- |
| `regions` | comma-separated region ids |
| `month` | 1–12 |
| `lat`, `lng`, `r` | coordinates and radius in km: adds destinations whose centre lies within range (plus the region's own radius) |

## 3. Interchange file (`bioatlas-trip`)

The workbench exports and imports JSON, defined in [`schema/trip.schema.json`](repo:schema/trip.schema.json):

```json
{
  "type": "bioatlas-trip",
  "format_version": 1,
  "name": "Kyoto · autumn colour",
  "month": 11,
  "regions": ["temple-garden-east-asia"],
  "destinations": [{ "name": "Nara", "lat": 34.685, "lng": 135.843, "radius_km": 20 }],
  "checked": []
}
```

Any external planner (or AI) that produces this file can open it via Workbench → Import. A Markdown checklist export is also available for note apps.

## Advice for workbench developers

- Convert each stop to `destinations[]` (coordinates + radius + dates); BioAtlas matches nearby regions on import.
- Do not cache the data yourself: read `data_hash` from `api/v1/manifest.json` and refresh when it changes.
- Need a new interface (say, species by coordinates)? Propose a contract change; see [API contract](api-contract.md).
- Your destination is missing? Add `data/regions/<id>.json`; see [Contributing data](contributing-data.md).
