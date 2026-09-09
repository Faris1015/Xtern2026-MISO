# 🚀 MISO OmniSearch: Master Project Roadmap & Task Issues

Welcome to the **MISO OmniSearch** project repository! This document contains the master breakdown of **13 project issues** (8 core foundation issues + 5 grounded AI/LLM enhancement issues) across the 5 specialized team roles.

Each issue contains detailed technical requirements, file paths, acceptance criteria, and a **pre-crafted LLM Prompt Template** that you can copy and paste directly into your AI assistant (ChatGPT, Claude, Cursor, Copilot, Gemini) to generate your deliverables!

---

## 👥 5-Person Team Role Allocation

| Role | Member | Primary Ownership |
| :--- | :--- | :--- |
| **Member 1** | Lead AI & Backend Engineer | FastAPI search API, Session Pre-fetch, ReportLab 1-Click PDF generator service |
| **Member 2** | Frontend & Data Viz Lead | Next.js / React application, OmniSearch bar, 360° Canvas & Recharts comparison graphs |
| **Member 3** | Data & Knowledge Graph Lead | Curate MISO market datasets, `related_queries.json` intent graph, Crosswalk JSON |
| **Member 4** | UI/UX Designer & Accessibility Lead | Figma brand design, WCAG 2.1 AA compliance audit, Web Speech audio narration |
| **Member 5** | Product Manager & Pitch Lead | CSR Ticket Deflection ROI model, 10–12 slide presentation deck, 2-minute live demo script |

---

## 📌 Issue List & Direct Links

### [Backend Engineering (Member 1)]
* **[Issue #1: FastAPI OmniSearch Pipeline, Session Pre-Fetching & Multi-Hub Endpoints](.github/issues/ISSUE_01_backend_omnisearch_api.md)**
  * *Files:* `backend/main.py`, `backend/search_engine.py`, `backend/data_manager.py`
* **[Issue #2: 1-Click Publication-Ready PDF Briefing Generator Service](.github/issues/ISSUE_02_backend_pdf_briefing_generator.md)**
  * *Files:* `backend/pdf_generator.py`, endpoint: `POST /api/generate-briefing`

### [Frontend Engineering & Data Viz (Member 2)]
* **[Issue #3: Unified OmniSearch Bar, Category Auto-Suggest & Session Radar UI](.github/issues/ISSUE_03_frontend_omnisearch_bar_session_radar.md)**
  * *Files:* `frontend/src/components/OmniSearch.tsx`, `frontend/src/components/SessionRadar.tsx`
* **[Issue #4: 360° Knowledge Canvas & Recharts Side-by-Side Comparison Engine](.github/issues/ISSUE_04_frontend_360_canvas_comparison.md)**
  * *Files:* `frontend/src/components/KnowledgeCanvas.tsx`, `frontend/src/components/ComparisonMatrix.tsx`

### [Data Engineering & Knowledge Graph (Member 3)]
* **[Issue #5: Curate MISO Market, Fuel Mix & Transmission Planning Datasets](.github/issues/ISSUE_05_data_market_and_grid_datasets.md)**
  * *Files:* `backend/data/market_hubs.json`, `fuel_peaks.json`, `mtep_projects.json`
* **[Issue #6: Build Proactive Intent Graph (`related_queries.json`) & Legacy Crosswalk](.github/issues/ISSUE_06_data_related_queries_graph_crosswalk.md)**
  * *Files:* `backend/data/related_queries.json`, `crosswalk.json`, `glossary.json`

### [UI/UX Design & Accessibility (Member 4)]
* **[Issue #7: Design System, WCAG 2.1 AA Audit & Web Speech Audio Briefing](.github/issues/ISSUE_07_design_wcag_a11y_voice_briefing.md)**
  * *Files:* `frontend/src/components/AudioBriefing.tsx`, `docs/accessibility-audit.md`

### [Product Management & Pitch Showcase (Member 5)]
* **[Issue #8: CSR Deflection ROI Model, 10-12 Slide Pitch Deck & 2-Minute Demo Script](.github/issues/ISSUE_08_pm_roi_model_pitch_deck_script.md)**
  * *Files:* `docs/csr-deflection-roi-model.md`, `presentation/pitch-deck-outline.md`, `presentation/demo-video-script.md`

---

## 🤖 AI & LLM Enhancement Roadmap (Issues #9–#13)
*Grounded intelligence layers that elevate MISO OmniSearch from a deterministic data engine into an enterprise AI platform—with zero hallucinations and graceful fallback.*

* **[Issue #9: Grounded LLM Persona Synthesizer with Zero-Hallucination Guardrails](.github/issues/ISSUE_09_llm_grounded_persona_synthesizer.md)**
  * *Owner:* Member 1 (Lead Backend & AI)
  * *Files:* `backend/llm_service.py`, `backend/search_engine.py`, `backend/requirements.txt`, `.env.example`
  * *Deliverable:* Synthesizes executive direct answers for 4 personas (Trader, Co-op, Regulator, Public) grounded strictly in verified MISO telemetry.

* **[Issue #10: "Chat with this Canvas" Interactive Copilot Drawer & API](.github/issues/ISSUE_10_frontend_canvas_copilot_chat.md)**
  * *Owner:* Member 2 (Frontend Lead) & Member 1 (Backend)
  * *Files:* `backend/main.py`, `backend/llm_service.py`, `frontend/src/components/CanvasCopilotDrawer.tsx`, `frontend/src/components/KnowledgeCanvas.tsx`
  * *Deliverable:* Accessible slide-out chat drawer allowing users to ask spontaneous conversational follow-ups about the active chart.

* **[Issue #11: Semantic Intent Classifier & Entity Extraction Query Router](.github/issues/ISSUE_11_llm_intent_classifier_query_router.md)**
  * *Owner:* Member 1 (Backend & AI) & Member 3 (Data Lead)
  * *Files:* `backend/llm_service.py`, `backend/search_engine.py`
  * *Deliverable:* Extracts target hubs, metrics, and time ranges from complex conversational queries before routing into `data_manager.py`.

* **[Issue #12: AI-Generated Executive Commentary for 1-Click PDF Briefings](.github/issues/ISSUE_12_llm_pdf_executive_commentary.md)**
  * *Owner:* Member 1 (Backend & AI) & Member 5 (PM & Pitch)
  * *Files:* `backend/pdf_generator.py`, `backend/llm_service.py`
  * *Deliverable:* Generates a 55-word executive market commentary paragraph in the 1-page PDF fact sheet with strict spatial budgeting.

* **[Issue #13: Context-Aware Dynamic Research Follow-Up Generator](.github/issues/ISSUE_13_llm_dynamic_proactive_followups.md)**
  * *Owner:* Member 3 (Data Lead) & Member 1 (Backend & AI)
  * *Files:* `backend/llm_service.py`, `backend/search_engine.py`, `backend/data/related_queries.json`
  * *Deliverable:* Produces 3 smart, executable follow-up research chips based on the specific query and data returned.

---

## ⚡ How Teammates Should Use These Issues
1. Click on your assigned issue above.
2. Read the **Context** and **Specific Tasks**.
3. Copy the **🤖 Copy-Paste LLM Prompt** at the bottom of your issue into your AI coding assistant (ChatGPT / Claude / Cursor / Copilot / Gemini).
4. Review the generated code/documents and commit your changes!

