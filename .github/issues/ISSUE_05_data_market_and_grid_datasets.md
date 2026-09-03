# [Issue #5] [Member 3: Data] Curate MISO Market, Fuel Mix & Transmission Planning Datasets

## 📌 Context & Objective
Prepare and structure MISO's verified public domain data into clean, normalized JSON/CSV datasets so the backend can deliver instantaneous, 100% grounded responses without scraping or server load.

## 🛠️ Files to Create / Modify
* `backend/data/market_hubs.json`
* `backend/data/fuel_peaks.json`
* `backend/data/mtep_projects.json`

## 📋 Specific Tasks
1. **`market_hubs.json`:**
   * 24-Hour hourly records for 6 primary commercial hubs:
     * `INDIANA.HUB` (IN - Central)
     * `ILLINOIS.HUB` (IL - Central)
     * `MICHIGAN.HUB` (MI - North)
     * `MINN.HUB` (MN - North)
     * `LOUISIANA.HUB` (LA - South)
     * `TEXAS.HUB` (TX - South)
   * Fields per hour: `hourEnding`, `intervalLabel`, `realTimeLmp`, `dayAheadLmp`, `spread`, `energyComponent`, `congestionComponent`, `lossComponent`, `volumeMwh`.
2. **`fuel_peaks.json` (July 2025 Fact Sheet Baseline):**
   * Real-time generation mix: Gas (40%), Coal (26%), Wind (15%), Nuclear (14%), Solar (3%), Hydro (2%).
   * Record Peaks:
     * Wind Peak: **25.6 GW** (January 12, 2024)
     * Solar Peak: **13.4 GW** (May 31, 2025)
     * All-Time Demand Record: **127.1 GW** (July 20, 2011)
   * Key Facts: 203 GW installed capacity, 638M MWh production, 77,000 miles line, 45M population.
3. **`mtep_projects.json`:**
   * Local MTEP: 459 projects, 932 miles.
   * Regional LRTP: 24 projects, 3,631 miles.
   * Interregional JTIQ: 5 projects, 490 miles.

## ✅ Acceptance Criteria
* [ ] 100% accurate data matching official MISO public filings.
* [ ] Clean, valid JSON syntax ready for direct backend consumption.

---

## 🤖 Copy-Paste LLM Prompt (For Member 3)
> *"Act as an Energy Data Engineer. Create valid, clean JSON files for `backend/data/market_hubs.json`, `backend/data/fuel_peaks.json`, and `backend/data/mtep_projects.json` matching official MISO fact sheets and market data specifications detailed in this task."*
