# 🚀 MISO OmniSearch: Master Project Roadmap & Task Issues

Welcome to the **MISO OmniSearch** project repository! This document contains the master breakdown of **17 project issues** (8 core foundation issues + 5 grounded AI/LLM enhancement issues + 4 live operations and engineering hardening issues) across the 5 specialized team roles.

---

## 👥 5-Person Team Role Allocation

| Role | Member | Primary Ownership |
| :--- | :--- | :--- |
| **Member 1** | Lead AI & Backend Engineer | FastAPI search API, Session Pre-fetch, ReportLab 1-Click PDF generator service, Live MISO Feed |
| **Member 2** | Frontend & Data Viz Lead | React application, OmniSearch bar, 360° Canvas, Comparison Matrix, Feedback Modal |
| **Member 3** | Data & Knowledge Graph Lead | Curate MISO market datasets, `related_queries.json` intent graph, Crosswalk JSON |
| **Member 4** | UI/UX Designer & Accessibility Lead | Figma brand design, WCAG 2.1 AA compliance audit, Web Speech audio narration |
| **Member 5** | Product Manager & Pitch Lead | CSR Ticket Deflection ROI model, 10–12 slide presentation deck, 2-minute live demo script |

---

## 📌 Master Issue List & Status

### Phase 1: Core Foundation (Issues #1–#8)
* **[Issue #1: FastAPI OmniSearch Pipeline, Session Pre-Fetching & Multi-Hub Endpoints](.github/issues/ISSUE_01_backend_omnisearch_api.md)** — ✅ **Completed**
  * *Files:* `backend/main.py`, `backend/search_engine.py`, `backend/data_manager.py`
* **[Issue #2: 1-Click Publication-Ready PDF Briefing Generator Service](.github/issues/ISSUE_02_backend_pdf_briefing_generator.md)** — ✅ **Completed**
  * *Files:* `backend/pdf_generator.py`, endpoint: `POST /api/generate-briefing`
* **[Issue #3: Unified OmniSearch Bar, Category Auto-Suggest & Session Radar UI](.github/issues/ISSUE_03_frontend_omnisearch_bar_session_radar.md)** — ✅ **Completed**
  * *Files:* `frontend/src/components/OmniSearch.tsx`, `frontend/src/components/SessionRadar.tsx`
* **[Issue #4: 360° Knowledge Canvas & Recharts Side-by-Side Comparison Engine](.github/issues/ISSUE_04_frontend_360_canvas_comparison.md)** — ✅ **Completed**
  * *Files:* `frontend/src/components/KnowledgeCanvas.tsx`, `frontend/src/components/ComparisonMatrix.tsx`
* **[Issue #5: Curate MISO Market, Fuel Mix & Transmission Planning Datasets](.github/issues/ISSUE_05_data_market_and_grid_datasets.md)** — ✅ **Completed**
  * *Files:* `backend/data/market_hubs.json`, `fuel_peaks.json`, `mtep_projects.json`
* **[Issue #6: Build Proactive Intent Graph (`related_queries.json`) & Legacy Crosswalk](.github/issues/ISSUE_06_data_related_queries_graph_crosswalk.md)** — ✅ **Completed**
  * *Files:* `backend/data/related_queries.json`, `crosswalk.json`, `glossary.json`
* **[Issue #7: Design System, WCAG 2.1 AA Audit & Web Speech Audio Briefing](.github/issues/ISSUE_07_design_wcag_a11y_voice_briefing.md)** — ✅ **Completed**
  * *Files:* `frontend/src/components/AudioBriefing.tsx`, `docs/accessibility-audit.md`
* **[Issue #8: CSR Deflection ROI Model, 10-12 Slide Pitch Deck & 2-Minute Demo Script](.github/issues/ISSUE_08_pm_roi_model_pitch_deck_script.md)** — ✅ **Completed**
  * *Files:* `docs/csr-deflection-roi-model.md`, `presentation/pitch-deck-outline.md`, `presentation/demo-video-script.md`

---

### Phase 2: Grounded AI & LLM Enhancements (Issues #9–#13)
* **[Issue #9: Grounded LLM Persona Synthesizer with Zero-Hallucination Guardrails](.github/issues/ISSUE_09_llm_grounded_persona_synthesizer.md)** — ✅ **Completed**
  * *Owner:* Member 1 (Lead Backend & AI)
  * *Files:* `backend/llm_service.py`, `backend/search_engine.py`
* **[Issue #10: "Chat with this Canvas" Interactive Copilot Drawer & API](.github/issues/ISSUE_10_frontend_canvas_copilot_chat.md)** — ✅ **Completed**
  * *Owner:* Member 2 (Frontend Lead) & Member 1 (Backend)
  * *Files:* `backend/main.py`, `backend/llm_service.py`, `frontend/src/components/CanvasCopilotDrawer.tsx`
* **[Issue #11: Semantic Intent Classifier & Entity Extraction Query Router](.github/issues/ISSUE_11_llm_intent_classifier_query_router.md)** — ✅ **Completed**
  * *Owner:* Member 1 (Backend & AI) & Member 3 (Data Lead)
  * *Files:* `backend/llm_service.py`, `backend/search_engine.py`
* **[Issue #12: AI-Generated Executive Commentary for 1-Click PDF Briefings](.github/issues/ISSUE_12_llm_pdf_executive_commentary.md)** — ✅ **Completed**
  * *Owner:* Member 1 (Backend & AI) & Member 5 (PM & Pitch)
  * *Files:* `backend/pdf_generator.py`, `backend/llm_service.py`
* **[Issue #13: Context-Aware Dynamic Research Follow-Up Generator](.github/issues/ISSUE_13_llm_dynamic_proactive_followups.md)** — ✅ **Completed**
  * *Owner:* Member 3 (Data Lead) & Member 1 (Backend & AI)
  * *Files:* `backend/llm_service.py`, `backend/search_engine.py`, `backend/data/related_queries.json`

---

### Phase 3: Live Grid Operations & Enterprise Hardening (Issues #14–#17)
* **[Issue #14: Live MISO Public Operations Feed & Azure APIM Integration](.github/issues/ISSUE_14_live_miso_operations_api_feed.md)** — ✅ **Completed**
  * *Owner:* Member 1 (Lead Backend & AI)
  * *Files:* `backend/miso_client.py`, `backend/data_manager.py`, `backend/search_engine.py`, `backend/.env`
  * *Deliverable:* Streams live 5-minute fuel mix from `https://public-api.misoenergy.org/api/FuelMix` with in-memory TTL caching and zero-downtime fallback.
* **[Issue #15: Engineer Feedback Loop & In-App Triage Modal](.github/issues/ISSUE_15_engineer_feedback_loop_and_triage_modal.md)** — ✅ **Completed**
  * *Owner:* Member 2 (Frontend Lead) & Member 1 (Backend)
  * *Files:* `frontend/src/components/FeedbackModal.tsx`, `frontend/src/App.tsx`, `backend/main.py`, `backend/data/user_feedback.json`
  * *Deliverable:* Interactive modal for market participants to submit ratings, bug reports, and data inaccuracies with query context directly to engineering.
* **[Issue #16: Dynamic Behavioral Persona Inference & Recommendation Banner](.github/issues/ISSUE_16_dynamic_behavioral_persona_inference.md)** — ✅ **Completed**
  * *Owner:* Member 1 (Backend & AI) & Member 2 (Frontend)
  * *Files:* `backend/search_engine.py`, `frontend/src/App.tsx`
  * *Deliverable:* Real-time lexical analysis detecting trader, co-op, regulator, or public query patterns with a 1-click persona recommendation switcher.
* **[Issue #17: Technical Hardening, Hallucination Firewall & Footprint Reconciliation](.github/issues/ISSUE_17_technical_hardening_and_hallucination_firewall.md)** — ✅ **Completed**
  * *Owner:* Full Team
  * *Files:* `backend/llm_service.py`, `backend/data/fuel_peaks.json`, `backend/data/mtep_projects.json`, `backend/test_live_miso_and_hardening.py`
  * *Deliverable:* Automated numerical bound validation rejecting hallucinated prices, Manitoba Hydro cross-border footprint support, and LRTP Tranche 1 vs 2 reconciliation.

---

## ⚡ How Teammates Should Use These Issues
1. Click on your assigned issue above.
2. Review the **Context**, **Specific Tasks**, and **Acceptance Criteria**.
3. Use the codebase test suites (`pytest test_live_miso_and_hardening.py`, `npm run build`) to verify regressions before submitting pull requests.
