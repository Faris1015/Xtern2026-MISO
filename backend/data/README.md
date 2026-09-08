# `backend/` Data Layer — Schema Contract

**Owner:** Member 3 (Data Lead) — Issues #5 and #6
**Consumers:** Member 1 (`data_manager.py`, `main.py`), Member 2 (frontend types)

This document is the **contract** for the six data files that power MISO OmniSearch.
Member 1 should build `data_manager.py` to load these files as-is. If a field needs to
change, raise it with Member 3 first so the schema, the frontend `types.ts`, and the
loader stay in sync.

## File locations

| File | Path | Issue | Status |
| :--- | :--- | :--- | :--- |
| Acronym glossary | `backend/glossary.json` | #6 | ✅ session 1 |
| Legacy → API crosswalk | `backend/crosswalk.json` | #6 | ✅ session 1 |
| Fuel mix + peak records | `backend/data/fuel_peaks.json` | #5 | ✅ verified vs July 2025 Fact Sheet |
| Transmission portfolios | `backend/data/mtep_projects.json` | #5 | ✅ verified vs July 2025 Fact Sheet / MTEP24 |
| Related-query intent graph | `backend/data/related_queries.json` | #6 | ⏳ session 2 |
| Hub hourly LMP dataset | `backend/data/market_hubs.json` | #5 | ✅ verified 2025-07-15 market reports |

> Path split (root vs `data/`) follows Issue #6, which names `backend/crosswalk.json`
> and `backend/glossary.json` at the package root.

## Shared conventions

- **Every file has a `meta` object** with at least: `version` (semver string),
  `last_updated` (`YYYY-MM-DD`), `source` (list of URLs), and where the data is not a
  live pull, `data_type: "representative"`.
- Money is `USD/MWh` unless a `unit` field says otherwise. Power is GW in headline
  facts, MW in hourly records.
- Timestamps in datasets are **Eastern Prevailing Time (EPT)**; the crosswalk documents
  the legacy-EPT ↔ API-UTC gotcha.
- All files must pass `python -m json.tool`. A validation script lives at
  `scripts/validate_data.py` (session 2).
- Provenance and any figure that diverges from a current MISO source is logged in
  `backend/data/NOTES_data_provenance.md`.

---

## 1. `glossary.json`

```jsonc
{
  "meta": { "version": "0.1.0", "last_updated": "2026-09-03", "term_count": 45, "source": [ "..." ] },
  "categories": ["Markets", "Planning", "Reliability", "Interconnection", "Operations", "Governance"],
  "terms": [
    {
      "acronym": "LMP",                       // primary key, uppercase, unique
      "name": "Locational Marginal Price",
      "category": "Markets",                   // one of meta.categories
      "eli5": "Plain-English, one or two sentences, no jargon.",
      "technical": "Precise definition for a power-market audience.",
      "unit": "USD/MWh",                        // optional
      "related": ["MCP", "ARR", "FTR"],         // other acronyms in this file
      "see_also": ["crosswalk:lmp_total"],      // optional cross-refs, "crosswalk:<id>"
      "source": "https://help.misoenergy.org/..."
    }
  ]
}
```

**Lookup key:** `terms[*].acronym`. Frontend Jargon HUD filters on `category`.

---

## 2. `crosswalk.json`

```jsonc
{
  "meta": { "version": "0.1.0", "last_updated": "2026-09-03", "source": [ "..." ] },
  "entries": [
    {
      "id": "lmp_total",                        // primary key, snake_case, unique
      "legacy_name": "LMP_TOTAL",               // column header or report token as it appears in legacy CSVs
      "legacy_aliases": ["LMP", "TotalLMP"],
      "legacy_report": "Real-Time Hourly LMP (rt_lmp_final.csv)",
      "legacy_description": "Total locational marginal price at a node/hub.",
      "current": {
        "api_product": "Pricing",              // MISO Data Exchange product name
        "endpoint": "/api/v1/pricing/rt-lmp-consolidated",
        "json_path": "$.data[*].lmp",          // JSONPath into the API response
        "unit": "USD/MWh",
        "cadence": "5-minute"
      },
      "formula_note": "LMP_TOTAL = energyComponent + congestionComponent + lossComponent",
      "gotchas": "Legacy 'HE' is EPT; API timestamps are ISO-8601 UTC.",
      "status": "verified"                       // verified | tentative | deprecated
    }
  ]
}
```

**Lookup keys:** `entries[*].legacy_name` and every value in `legacy_aliases` (case-insensitive).

---

## 3. `fuel_peaks.json`

```jsonc
{
  "meta": { "version": "0.1.0", "last_updated": "2026-09-03", "basis": "MISO July 2025 Fact Sheet", "data_type": "representative", "source": [ "..." ] },
  "generation_mix": {
    "as_of": "2025-07",
    "basis": "MISO July 2025 Fact Sheet",
    "shares": [
      { "fuel": "Natural Gas", "pct": 40 },
      { "fuel": "Coal", "pct": 26 }
      // ... sums to 100
    ]
  },
  "records": [
    { "metric": "Wind Peak Output", "value_gw": 25.6, "date": "2024-01-12", "source": "..." }
  ],
  "system_facts": {
    "installed_capacity_gw": 203,
    "annual_production_mwh": 638000000,
    "transmission_line_miles": 77000,
    "population_served": 45000000,
    "states_served": 15
  }
}
```

---

## 4. `mtep_projects.json`

```jsonc
{
  "meta": { "version": "0.1.0", "last_updated": "2026-09-03", "basis": "MTEP24 / LRTP Tranche 2.1", "source": [ "..." ] },
  "portfolios": [
    {
      "id": "lrtp",                             // primary key: local_mtep | lrtp | jtiq
      "name": "Long Range Transmission Planning (LRTP)",
      "project_count": 24,
      "line_miles": 3631,
      "scope": "Regional",                      // Local | Regional | Interregional
      "notes": "Tranche 2.1 — $21.8B, 765 kV backbone, in service 2032–2034."
    }
  ]
}
```

---

## 5. `related_queries.json` *(session 2 — shape for planning only)*

```jsonc
{
  "meta": { "version": "0.1.0", "last_updated": "2026-09-03" },
  "nodes": [
    {
      "id": "indiana_hub",
      "match": { "keywords": ["indiana hub", "indiana.hub", "in hub"], "entity_type": "market_hub" },
      "canonical_entity": "INDIANA.HUB",
      "follow_ups": [
        { "label": "Compare Indiana vs. Michigan", "action": "compare",
          "params": { "entities": ["INDIANA.HUB", "MICHIGAN.HUB"], "metric": "real_time_lmp" } },
        { "label": "Download hourly CSV", "action": "download",
          "params": { "dataset": "market_hubs", "entity": "INDIANA.HUB", "format": "csv" } }
      ]
    }
  ]
}
```

`action` enum (draft, confirm with Member 2): `compare` | `chart` | `download` | `define` | `open_report`.

---

## 6. `market_hubs.json`

Hourly fields use Issue #5 camelCase (`hourEnding`, `realTimeLmp`, …). Hub identity fields stay snake_case (`hub_id`) like the other datasets. Market hours are **EST year-round**, matching the MISO CSV header.

```jsonc
{
  "meta": {
    "dataset": "market_hubs",
    "version": "1.0.0",
    "as_of_date": "2025-07-15",
    "timezone": "EST",
    "data_type": "verified",
    "source": [ "https://docs.misoenergy.org/marketreports/20250715_rt_lmp_final.csv" ]
  },
  "hubs": [
    {
      "hub_id": "INDIANA.HUB",
      "display_name": "Indiana Hub",
      "region": "MISO Central",
      "state": "IN",
      "hours": [
        {
          "hourEnding": 1,
          "intervalLabel": "00:00–01:00 EST",
          "realTimeLmp": 32.17,
          "dayAheadLmp": 34.21,
          "spread": -2.04,                       // realTimeLmp - dayAheadLmp
          "energyComponent": 30.81,              // LMP - MCC - MLC
          "congestionComponent": 0.00,
          "lossComponent": 1.36,
          "volumeMwh": 10932.43                  // mapped LRZ actual load
        }
        // ... 24 rows, hourEnding 1..24
      ]
    }
    // ... 6 hubs
  ]
}
```

**Invariants** (enforced by the generator + `scripts/validate_data.py`):
- `energyComponent + congestionComponent + lossComponent` ≈ `realTimeLmp` (±0.01)
- `spread` == `realTimeLmp - dayAheadLmp` (±0.01)
- exactly 24 hourly rows per hub, `hourEnding` 1–24
- 6 hubs: `INDIANA.HUB`, `ILLINOIS.HUB`, `MICHIGAN.HUB`, `MINN.HUB`, `LOUISIANA.HUB`, `TEXAS.HUB`
  (South hub IDs confirmed as `Hub` type in `20250715_rt_lmp_final.csv`)
