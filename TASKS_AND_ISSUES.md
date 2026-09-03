# 🚀 MISO OmniSearch: Master Project Roadmap & Task Issues

Welcome to the **MISO OmniSearch** project repository! This document contains the master breakdown of all **8 core project issues** across the 5 specialized team roles.

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

## ⚡ How Teammates Should Use These Issues
1. Click on your assigned issue above.
2. Read the **Context** and **Specific Tasks**.
3. Copy the **🤖 Copy-Paste LLM Prompt** at the bottom of your issue into your AI coding assistant (ChatGPT / Claude / Cursor / Copilot / Gemini).
4. Review the generated code/documents and commit your changes!
