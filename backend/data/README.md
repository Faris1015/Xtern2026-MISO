# `backend/` Data Layer — Schema Contract & Live Telemetry Architecture

**Owner:** Member 3 (Data Lead) & Member 1 (Lead Backend) — Issues #5, #6, #14, #15, #17  
**Consumers:** Member 1 (`data_manager.py`, `main.py`, `miso_client.py`), Member 2 (frontend types)

This document is the **authoritative contract** for the data files and live feeds that power MISO OmniSearch.

---

## File & Feed Locations

| Resource | Path / Endpoint | Issue | Type | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Live Operations Feed** | `https://public-api.misoenergy.org/api/FuelMix` | #14 | Live REST (5-min) | ✅ In-memory 60s TTL Cache |
| **Live Telemetry Client**| `backend/miso_client.py` | #14 | Python Client | ✅ Rate-limited & resilient |
| **Acronym glossary** | `backend/glossary.json` | #6 | JSON Dictionary | ✅ 45+ terms & ELI5 definitions |
| **Legacy → API crosswalk**| `backend/crosswalk.json` | #6 | JSON Crosswalk | ✅ Verified vs Report Mapping |
| **Fuel mix + peak records**| `backend/data/fuel_peaks.json` | #5, #17 | Verified Dataset | ✅ Fact Sheet + Manitoba support |
| **Transmission portfolios**| `backend/data/mtep_projects.json` | #5, #17 | Verified Dataset | ✅ MTEP24 + Tranche 1 & 2 |
| **Related-query intent graph**| `backend/data/related_queries.json` | #6, #13 | Graph Nodes | ✅ 17 interactive actions |
| **Hub hourly LMP dataset**| `backend/data/market_hubs.json` | #5 | Hourly Dataset | ✅ 6 regional market hubs |
| **User & Engineer Feedback**| `backend/data/user_feedback.json` | #15 | JSON Persistence | ✅ Ratings, bugs & query context |

---

## Shared Conventions & Architecture

- **Live MISO Operations Stream:** Real-time 5-minute fuel mix (Coal, Gas, Nuclear, Solar, Wind, Battery Storage, Imports) and total MW demand are pulled from `public-api.misoenergy.org`. Cached with a 60-second TTL to strictly comply with MISO's $\le 1$ req/min rate limit. Seamless fallback to static baseline on network failure.
- **MISO Data Exchange Azure APIM:** Ready for authenticated Day-Ahead / Real-Time pricing queries using header `Ocp-Apim-Subscription-Key` and `MISO_API_KEY`.
- **Footprint Scope:** MISO's Reliability Coordination footprint covers **15 U.S. states and 1 Canadian province (Manitoba)**, serving a population of 45 Million. Internal market dispatch covers Local Resource Zones (LRZ) 1–10.
- **Money & Power Units:** Money is in `USD/MWh`. Power is in GW in executive facts and MW in hourly telemetry.
- **Timestamps:** Hourly records reflect Eastern Prevailing Time (EPT/EST); ISO-8601 UTC mapping is handled via `crosswalk.json`.

---

## Data Model Specifications

### 1. `fuel_peaks.json` (Footprint & Generation Baseline)
```jsonc
{
  "meta": { "version": "1.1.0", "basis": "MISO July 2025 Fact Sheet", "data_type": "verified" },
  "generation_mix": {
    "as_of": "2025-07",
    "shares": [
      { "fuel": "Natural Gas", "pct": 40, "color": "#0284C7" },
      { "fuel": "Coal", "pct": 26, "color": "#64748B" },
      { "fuel": "Wind", "pct": 15, "color": "#10B981" },
      { "fuel": "Nuclear", "pct": 14, "color": "#8B5CF6" },
      { "fuel": "Solar", "pct": 3, "color": "#F59E0B" },
      { "fuel": "Hydro", "pct": 2, "color": "#06B6D4" }
    ]
  },
  "records": [
    { "metric": "Wind Peak Output", "value_gw": 25.6, "date": "2024-01-12" },
    { "metric": "Solar Peak Output", "value_gw": 13.4, "date": "2025-05-31" },
    { "metric": "All-Time Record Demand", "value_gw": 127.1, "date": "2011-07-20" }
  ],
  "system_facts": {
    "installed_capacity_gw": 203,
    "annual_production_mwh": 638000000,
    "transmission_line_miles": 77000,
    "population_served": 45000000,
    "states_served": 15,
    "provinces_served": 1,
    "canadian_provinces": ["Manitoba"],
    "service_territory": "15 U.S. states and the Canadian province of Manitoba"
  }
}
```

### 2. `mtep_projects.json` (Transmission Portfolios & LRTP Tranches)
```jsonc
{
  "meta": { "version": "1.1.0", "basis": "MTEP24 / LRTP Tranche 1 & 2.1" },
  "portfolios": [
    {
      "id": "local_mtep",
      "name": "Local MTEP Projects",
      "project_count": 459,
      "line_miles": 932,
      "scope": "Local",
      "investment": "$5.0B"
    },
    {
      "id": "lrtp",
      "name": "Long Range Transmission Planning (LRTP)",
      "project_count": 24,
      "line_miles": 3631,
      "scope": "Regional",
      "tranche1Projects": 18,
      "tranche1Investment": "$10.3B",
      "tranche2Projects": 24,
      "tranche2Investment": "$21.8B",
      "totalRegionalInvestment": "$32.1B",
      "notes": "Tranche 1 approved July 2022 ($10.3B). Tranche 2 approved December 2024 ($21.8B)."
    },
    {
      "id": "jtiq",
      "name": "Joint Targeted Interconnection Queue (JTIQ)",
      "project_count": 5,
      "line_miles": 490,
      "scope": "Interregional",
      "investment": "$1.6B",
      "notes": "Coordinated with SPP across the seam to unlock 28 GW of generation."
    }
  ]
}
```

### 3. `user_feedback.json` (Engineer Feedback Triage)
```jsonc
[
  {
    "id": "fb_1725984000123",
    "timestamp": "2026-09-10T15:20:00.000Z",
    "category": "data_inaccuracy",
    "rating": 5,
    "message": "Live wind generation matches public operations console perfectly.",
    "persona": "Power Trader",
    "queryContext": "Wind vs Solar peak",
    "userEmail": "trader@miso-participant.com"
  }
]
```
