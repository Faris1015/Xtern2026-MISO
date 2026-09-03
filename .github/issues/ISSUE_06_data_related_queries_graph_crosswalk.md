# [Issue #6] [Member 3: Data] Build Proactive Intent Graph (`related_queries.json`) & Legacy Crosswalk

## 📌 Context & Objective
Build the intelligence mapping that powers the **Proactive Follow-Up Radar** and the **Legacy-to-API Crosswalk** to directly eliminate routine data location and naming confusion inquiries.

## 🛠️ Files to Create / Modify
* `backend/data/related_queries.json`
* `backend/crosswalk.json`
* `backend/glossary.json`

## 📋 Specific Tasks
1. **`related_queries.json` (Intent Graph):**
   * Maps query keywords to the top 3–4 proactive follow-up actions:
     * *"indiana hub"* $ightarrow$ `["Compare Indiana vs. Michigan", "Show Day-Ahead Spread", "Download Hourly CSV"]`
     * *"solar peak"* $ightarrow$ `["Compare Solar vs. Wind Growth", "View Active Solar in Queue", "Download Fact Sheet"]`
     * *"mtep24"* $ightarrow$ `["View LRTP Tranche 2 Miles", "Compare Local vs. Regional Transmission", "Download MTEP Summary"]`
2. **`crosswalk.json`:**
   * Detailed mapping between legacy CSV columns (`HE`, `LMP_TOTAL`, `CONG_COMP`, `LOSS_COMP`, `NODE_NAME`) and new Data Exchange API endpoints (`/api/v1/markets/*`), JSON paths, and plain-English formula notes.
3. **`glossary.json`:**
   * 40+ MISO acronyms (*LMP, CONE, PRA, MTEP, LRTP, JTIQ, DPP, LOLE, OASIS, ARR/FTR, MCP, POI*) with ELI5 definitions and technical explanations.

## ✅ Acceptance Criteria
* [ ] Rich intent graph covering all standard search scenarios.
* [ ] 100% verified crosswalk mappings to build trust in new APIs.

---

## 🤖 Copy-Paste LLM Prompt (For Member 3)
> *"Act as a Data Architect for an electric grid operator. Generate a complete `backend/data/related_queries.json` intent graph that maps user search queries to proactive next-action pills, and verify `backend/crosswalk.json` for legacy MISO report column mappings."*
