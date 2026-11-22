# Nature observation platform modules

This page documents module scope, data boundaries and review requirements.

## Nature map
`#/map` plots the coordinates of travel-scene records on an equirectangular locator grid and filters by country and month. It is not a continuous species-range map and does not show coastlines or protected-area boundaries. Each point links to the full scene record and monthly species data. Map markers are keyboard-focusable with Tab and open their scene record with Enter or Space; the scene list below provides equivalent links.

## Conservation and field ethics
`#/conservation` separates IUCN Red List assessments from legal and treaty protections. Each `conservation.protections[]` entry records its instrument, jurisdiction, status, scope, source and access date; it is not an IUCN category. Missing IUCN data does not mean Least Concern, and missing legal-protection records do not imply unrestricted handling or collection. Local regulations, protected-area access and drone rules must be checked with the competent authority.

## Marine taxa and coral protections

The starter coral branch adds Cnidaria, Anthozoa, Hexacorallia, Scleractinia, Acroporidae and Acropora, plus staghorn and elkhorn coral records. NOAA legal-protection records and ITIS taxonomic records are cited independently; no unverified IUCN category or divergence date has been added.

## Nature sounds
`#/sounds` reads the optional `sounds` array on species records. Each recording must provide an HTTPS audio URL, original source, license and attribution. Recordings with unclear redistribution rights are excluded. If none qualify, the page shows contribution guidance rather than fabricated placeholder audio.

## Evolution learning
`#/evolution` generates common-ancestor exercises from parent-child relationships in the current taxonomy. The atlas samples only a subset of life; exercises are not a complete tree of life or a formal taxonomic ruling.

## Field identification
`#/identify` supports name, scientific name, kingdom, country, habitat, month, colour-tag and size-range filters. Colour tags and centimetre measurements are optional data fields. Empty fields do not generate inferred traits; size records should state what was measured.

## Offline use
The site includes a PWA manifest and Service Worker. After an online visit, the app shell and visited data can be cached. The trip workbench can request pre-download of selected regions and their associated species. Offline caching is same-origin only; an external `apiBase` needs its own offline package or same-origin proxy.

## Language and accessibility
A Japanese language option is available; untranslated UI strings currently fall back to English, so this is not complete Japanese localization. Baseline accessibility includes keyboard focus, skip navigation, chart descriptions and reduced-motion support. Map markers support Tab, Enter and Space; the complex phylogeny still needs a dedicated screen-reader audit.

## Data quality
All modules preserve each record's `review_status`. Conservation, phenology, distribution, recording and regulatory claims need traceable sources. Seed records must never be presented as verified facts.

## Scientific sources and data quality
`#/sources` indexes citations and supports search by type, author, title and DOI. `#/quality` summarizes species, taxa, scenes, references, conservation assessments, external IDs, licensed media and review status. These metrics describe repository coverage, not complete biodiversity coverage.

- **Taxonomy authority governance** — the quality dashboard reports authority coverage, record-level assertions and unassessed identifiers. Species and taxon pages show each provider's claim and its supporting citation; an accepted status is explicitly scoped to that provider.
