# Data Provenance & Open Questions

**Owner:** Member 3 (Data Lead) — Issues #5, #6
**Purpose:** Record where each number comes from, and every place our data diverges
from (or is not yet confirmed against) a current MISO source. Anything a judge or
teammate might challenge should be answerable from this file.

Decision on record (team, 2026-09-03): **Issue #5 figures are canonical.** Where a
current MISO source disagrees, we keep the Issue #5 number in the JSON and note the
discrepancy here.

---

## `fuel_peaks.json`

**Verified 2026-09-04** against [Corp Fact Sheet July 2025](https://cdn.misoenergy.org/Corp%20Fact%20Sheet%20July%202025706040.pdf). `meta.data_type` is `"verified"`.

| Item | Value used | Source | Confidence | Note |
| :--- | :--- | :--- | :--- | :--- |
| Generation mix (Gas 40 / Coal 26 / Wind 15 / Nuclear 14 / Solar 3 / Hydro 2) | Fact Sheet energy-production pie | July 2025 Fact Sheet | High | This is **Energy Production, Jan–Dec 2024**, not a live RT mix and not the Installed Capacity pie (June 2025: gas ~42%, coal ~23%, wind ~16%, nuclear ~7%, solar ~8–9%, hydro ~4%, other ~2%). Issue #5 labeled it "real-time"; we keep the numbers and correct the basis. |
| Wind peak 25.6 GW on 2024-01-12 | Fact Sheet KEY FACTS | July 2025 Fact Sheet | High | Printed as "Wind Peak 25.6 GW 1/12/2024". |
| Solar peak 13.4 GW on 2025-05-31 | Fact Sheet KEY FACTS | July 2025 Fact Sheet | High | Printed as "Solar Peak 13.4 GW 5/31/2025". Later 2025 IMM notes cite a higher summer solar peak; we freeze the July 2025 sheet as the baseline. |
| All-time demand peak 127.1 GW on 2011-07-20 | Fact Sheet KEY FACTS | July 2025 Fact Sheet | High | Printed as "Record Demand 127.1 GW 7/20/2011". |
| 203 GW installed capacity | Fact Sheet (June 2025) | July 2025 Fact Sheet | High | Headline next to the Installed Capacity pie. |
| 638M MWh annual production | Fact Sheet (2024) | July 2025 Fact Sheet | High | "638 Million MWh" under Energy Production January–December 2024. |
| 77,000 transmission line-miles | Fact Sheet KEY FACTS | July 2025 Fact Sheet | High | Printed as "Transmission Line 77,000 Miles". |
| 45M population served | Fact Sheet KEY FACTS | July 2025 Fact Sheet | High | Printed as "Population Served 45 Million". |
| 15 states served | `glossary.json` MISO entry | glossary.json | High | `states_served` counts U.S. states only; MISO's footprint also includes the Canadian province of Manitoba, which has no field of its own in this schema. |
| 15 states & 1 Canadian province (Manitoba) | `glossary.json` & July 2025 Fact Sheet | High | Resolved: Added `provinces_served: 1`, `canadian_provinces: ["Manitoba"]`, and `service_territory` to `fuel_peaks.json`. **Footprint Distinction:** MISO's Reliability Coordination footprint and population (45M) cover 15 U.S. states and Manitoba. However, the Installed Capacity (203 GW) and Generation Mix (638M MWh, with Hydro at only 2%) represent MISO Market-Dispatched resources (LRZ 1–10). Manitoba Hydro operates as its own Balancing Authority connected via external interchange/seams (e.g. Dorsey-Forbes, GNTL) and reliability coordination, not internal market dispatch. |

---

## `mtep_projects.json`

**Verified 2026-09-04** against the July 2025 Fact Sheet **MTEP24** table (Local MTEP / Regional LRTP / Interregional JTIQ) and the [Dec 2024 board-approval release](https://www.misoenergy.org/meet-miso/media-center/2024/miso-board-approves-historic-transmission-plan-to-strengthen-grid-reliability/). `meta.data_type` is `"verified"`.

| Item | Value used | Source | Confidence | Note |
| :--- | :--- | :--- | :--- | :--- |
| Local MTEP: 459 projects / 932 miles | Fact Sheet MTEP24 table | July 2025 Fact Sheet | High | Printed as "Local MTEP — Approved New Projects 459 — Miles 932". |
| LRTP: 24 projects / 3,631 miles | Fact Sheet + board release | July 2025 Fact Sheet; Dec 2024 board approval | High | Fact Sheet: 24 / 3,631. Board release: Tranche 2.1, $21.8B, 765 kV backbone, B/C 1.8–3.5. |
| JTIQ: 5 projects / 490 miles | Fact Sheet + board release | July 2025 Fact Sheet; Dec 2024 board approval | High | Fact Sheet: 5 / 490. Board release: $1.6B, 28 GW enabled on the MISO/SPP seam. |
| Portfolio total 488 / 5,053 miles | sum of the three rows | arithmetic; board release "488 / more than 5,000 miles" | High | 459+24+5 = 488; 932+3631+490 = 5053. |

**Taxonomy:** The Fact Sheet itself frames MTEP24 as Local MTEP + Regional LRTP + Interregional JTIQ, so Issue #5's three-way split matches MISO's published table.

**✅ Conflict Resolved (2026-09-10):** The discrepancy was between two separate LRTP tranches:
- **LRTP Tranche 1 ($10.3B)**: 18 projects approved by the MISO Board in July 2022.
- **LRTP Tranche 2 ($21.8B)**: Regional Midwest backbone portfolio approved in December 2024.
- **JTIQ ($1.2B vs $1.6B)**: Initial 5-project seam baseline was $1.2B; updated portfolio estimates reached $1.6B.
Both Tranche 1 ($10.3B) and Tranche 2 ($21.8B) are now explicitly documented in `mtep_projects.json` with field `tranche1Investment: "$10.3B"` and `tranche2Investment: "$21.8B"`, establishing total regional LRTP investment at $32.1B.

---

## `crosswalk.json`

- **2026-09-04 update:** pulled MISO's own **Report to Endpoint Mapping** PDF
  (saved at `backend/data/references/miso_data_exchange_report_to_endpoint_mapping.pdf`,
  sourced from the notice box on the live Market Reports page) and folded its
  legacy-report -> API-product -> endpoint-name table into `crosswalk.json` as the
  `current.official_endpoint_name` field. This moved 4 entries from `tentative` to
  `verified` (`da_lmp`, `asm_mcp`, `net_sched_interchange`, `binding_constraint`) and
  added endpoint names to `lmp_total`/`rt_lmp`/`fuel_mix`/`total_load`. It also caught
  a real error: `binding_constraint` was originally guessed under the "Pricing" API;
  the official doc puts it under "Load, Generation, and Interchange API" instead —
  corrected.
- Also caught and fixed a **stale retirement date**: the crosswalk previously said
  2025-12-12 (from an initial web search). The live notice on
  misoenergy.org/.../market-reports/ as of 2026-09-04 says **September 30, 2026**.
  Re-check this date if picking the project back up much later — MISO could push it
  again.
- **RTWD Data Broker** messageType values marked `verified` were confirmed from the
  public endpoint index at `https://api.misoenergy.org/MISORTWDDataBroker/`
  (`getfuelmix`, `getlmpconsolidatedtable`, `getexantelmp`, `gettotalload`,
  `getWindForecast`, `getSolarForecast`, `getWindActual`, `getSolarActual`).
- **Data Exchange REST paths** (`/pricing/...`, `/lgi/...`) are still marked
  `tentative` even on `verified` rows — `official_endpoint_name` (the descriptive name
  MISO uses) is confirmed, but the literal REST path/slug and JSON key still need the
  developer portal. **Action: register a Data Exchange account, then replace every
  `(path tentative)` string.**
- Message names with "(message name tentative)" — `getancillaryservicesmcp`,
  `getNetScheduledInterchange`, `getBindingConstraints` — are still guessed; the
  official PDF covers Data Exchange only, not the RTWD broker's message names.
- `energy_component` / `cong_comp` / `loss_comp` remain `tentative`: the official PDF
  confirms the parent LMP endpoint but doesn't break out component-level sub-fields.
  Legacy column headers also vary by report vintage, and some files require deriving
  the split (`total - other two`).
- `wind_actual` / `wind_forecast` remain sourced only from the RTWD broker (verified
  live) — they don't appear as their own row in the official Data Exchange mapping
  PDF, so the Data Exchange side is still unconfirmed.

---

## `glossary.json`

- Definitions cross-checked against MISO Business Practice Manuals, the MISO knowledge
  base, and the EIA glossary. No figures, so low risk.
- Terms to double-check for current accuracy:
  - **STR (Short-Term Reserve):** implemented 2022 — confirm it's still a 4-product
    ASM (Reg / Spin / Supp / STR).
  - **PRA:** now a **seasonal** construct (4 seasons) — the definition says so; confirm
    no further change for the current planning year.
  - **RDT (Regional Directional Transfer):** the MW cap value changes; the definition
    avoids quoting a number on purpose.
  - **ELCC accreditation:** confirm which resource classes are on ELCC for the current
    planning year (wind, solar, storage at minimum).

---

## Data-access checklist (unblocks session 2)

- [ ] Create MISO website account
- [ ] Register at data-exchange.misoenergy.org, subscribe to **Pricing** + **LGI**
- [ ] Generate subscription key(s), store in `backend/.env` (gitignored)
- [ ] Confirm the 6 hub tokens against a live `getlmpconsolidatedtable` pull
      (esp. MISO South: LOUISIANA / TEXAS / ARKANSAS / MS hub spellings)
- [x] Pick a finalized historical trading day (>= 1 week old) for `market_hubs.json`
      — **2025-07-15** (RT final + DA expost CSVs; Actual Load from `20250716_df_al.xls`)

## `market_hubs.json`

**Verified 2026-09-04** from public Market Reports (no Data Exchange key required).

| Item | Value used | Source | Confidence | Note |
| :--- | :--- | :--- | :--- | :--- |
| Trading day | 2025-07-15 | RT final + DA expost file headers | High | Aligns with the July 2025 Fact Sheet vintage. |
| Hub CPNode names | INDIANA / ILLINOIS / MICHIGAN / MINN / LOUISIANA / TEXAS `.HUB` | `Type=Hub` rows in `20250715_rt_lmp_final.csv` | High | South spellings confirmed; ARKANSAS.HUB and MS.HUB exist but are out of Issue #5 scope. |
| realTimeLmp / MCC / MLC | hourly HE 1–24 | `20250715_rt_lmp_final.csv` | High | Hours-ending are EST (file header). |
| energyComponent | LMP − MCC − MLC | derived identity | High | These CSVs do not publish a separate MEC row for hubs. |
| dayAheadLmp | hourly HE 1–24 | `20250715_da_expost_lmp.csv` | High | |
| spread | RT LMP − DA LMP | derived | High | |
| volumeMwh | LRZ actual load | `20250716_df_al.xls` (2025-07-15 actuals) | Medium | Hubs are pricing aggregations, not load zones. Mapped: IN→LRZ6, IL→LRZ4, MN→LRZ1, MI→LRZ2_7 (WI+MI combined), LA and TX→LRZ8_9_10 (South combined). July 15 actuals first appear in the July 16 `df_al` publication. |
