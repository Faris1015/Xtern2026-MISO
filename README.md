# ⚡ MISO OmniSearch: Predictive Context & Comparative Knowledge Engine
> **Xtern Fall 2026 Challenge Submission** | **Partner:** Midcontinent Independent System Operator (MISO)  
> **Challenge Prompt 1:** *Intelligent Navigation of MISO's Public Information*

[![Status](https://img.shields.io/badge/Status-Active%20Development-0284C7.svg)]()
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-059669.svg)]()
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind-0284C7.svg)]()
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-10B981.svg)]()

---

## 🌟 What is MISO OmniSearch?
**MISO OmniSearch** is a next-generation energy intelligence and discovery engine built to transform how **Market & Power Traders**, **Municipal Utilities and Electric Co-ops**, and the **General Public** discover, analyze, and extract MISO's public energy data.

Instead of a passive chatbot or confusing nested web pages, OmniSearch provides:
1. 🧠 **Session-Aware Journey Pre-Fetching:** Detects active browsing paths on `misoenergy.org` and pre-loads relevant metrics with **zero cold start**.
2. 🔍 **Unified OmniSearch Bar:** Single search input for plain-English questions, market hubs, acronyms, and reports with real-time auto-suggest.
3. 📊 **360° Knowledge Canvas:** Verified answers with page-level PDF citations, isolated KPI cards, and live interactive Recharts graphs.
4. ⚖️ **Side-by-Side Comparison Engine:** Point-and-click comparative matrices to compare **Hubs** (*Indiana vs. Michigan vs. Texas*), **Fuel Types** (*Wind vs. Solar vs. Gas*), and **Transmission Plans**.
5. 📄 **1-Click Branded PDF Briefing Studio:** Generates publication-ready 1-page PDF fact sheets and filtered CSV spreadsheets in 3 seconds.

---

## 🚀 Master Tasks & GitHub Issues (For the Team)
All tasks and ready-to-use LLM prompt templates are documented in:
👉 **[TASKS_AND_ISSUES.md](./TASKS_AND_ISSUES.md)**

| Issue | Role & Owner | Key Deliverable |
| :--- | :--- | :--- |
| **[Issue #1](.github/issues/ISSUE_01_backend_omnisearch_api.md)** | Member 1 (*Lead Backend & AI*) | FastAPI Search Pipeline & Comparison Endpoints |
| **[Issue #2](.github/issues/ISSUE_02_backend_pdf_briefing_generator.md)** | Member 1 (*Lead Backend & AI*) | ReportLab 1-Click PDF Briefing Generator Service |
| **[Issue #3](.github/issues/ISSUE_03_frontend_omnisearch_bar_session_radar.md)** | Member 2 (*Frontend Lead*) | OmniSearch Input Bar & Session-Aware Radar UI |
| **[Issue #4](.github/issues/ISSUE_04_frontend_360_canvas_comparison.md)** | Member 2 (*Frontend Lead*) | 360° Knowledge Canvas & Recharts Comparison Matrix |
| **[Issue #5](.github/issues/ISSUE_05_data_market_and_grid_datasets.md)** | Member 3 (*Data Lead*) | MISO Market Hubs, Fuel Mix & Peak Datasets |
| **[Issue #6](.github/issues/ISSUE_06_data_related_queries_graph_crosswalk.md)** | Member 3 (*Data Lead*) | Related-Queries Intent Graph & Legacy Crosswalk |
| **[Issue #7](.github/issues/ISSUE_07_design_wcag_a11y_voice_briefing.md)** | Member 4 (*UI/UX & A11y*) | Figma Design System, WCAG 2.1 AA Audit & Voice Briefing |
| **[Issue #8](.github/issues/ISSUE_08_pm_roi_model_pitch_deck_script.md)** | Member 5 (*PM & Pitch*) | CSR Deflection ROI Model, 10–12 Slide Deck & Demo Script |
| **[Issue #9](.github/issues/ISSUE_09_llm_grounded_persona_synthesizer.md)** | Member 1 (*Lead Backend & AI*) | Grounded LLM Persona Synthesizer & Fallback |
| **[Issue #10](.github/issues/ISSUE_10_frontend_canvas_copilot_chat.md)** | Member 2 & 1 (*Frontend & Backend*) | "Chat with this Canvas" Copilot Drawer & API |
| **[Issue #11](.github/issues/ISSUE_11_llm_intent_classifier_query_router.md)** | Member 1 & 3 (*Backend & Data*) | Semantic Intent Classifier & Entity Query Router |
| **[Issue #12](.github/issues/ISSUE_12_llm_pdf_executive_commentary.md)** | Member 1 & 5 (*Backend & PM*) | AI Executive Commentary for 1-Page PDF Generator |
| **[Issue #13](.github/issues/ISSUE_13_llm_dynamic_proactive_followups.md)** | Member 3 & 1 (*Data & Backend*) | Context-Aware Dynamic Research Follow-Up Generator |

---

## 🛠️ Repository Structure
```
Xtern2026-MISO/
├── backend/                  # FastAPI Python backend
│   ├── main.py               # REST API server
│   ├── data_manager.py       # Market & grid data query engine
│   ├── pdf_generator.py      # ReportLab 1-click PDF briefing builder
│   ├── error_doctor.py       # API error diagnostic engine
│   ├── crosswalk.json        # Legacy report ↔ API field mapping dictionary
│   ├── glossary.json         # 40+ MISO acronyms dictionary
│   └── requirements.txt
├── frontend/                 # React + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/       # OmniSearch, Canvas, Comparison, Jargon HUD
│   │   ├── api.ts            # Client API client
│   │   ├── types.ts          # TypeScript interfaces
│   │   └── App.tsx           # Main application shell
│   └── package.json
├── .github/issues/           # 8 Informative, LLM-ready task issue templates
├── TASKS_AND_ISSUES.md       # Master task tracking roadmap
└── scripts/                  # Automation & GitHub sync scripts
```

---

## ⚡ Quickstart

### 🐳 1. Docker Compose (Recommended - Fullstack in 1 Command)
```bash
# Build and run both backend and frontend
docker compose up --watch
```
- **Web Application**: `http://localhost:3000`
- **Backend API Docs**: `http://localhost:8000/docs`
- **Root Healthcheck**: `http://localhost:8000/`

To stop the containers:
```bash
docker compose down
```

---

### 💻 2. Local Development (Without Docker)

#### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # On Windows (or source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
uvicorn main:app --reload
```
API Documentation: `http://localhost:8000/docs`

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Web Application: `http://localhost:3000`

---

## 🦎 Komodo Deployment & CI/CD Pipeline

This repository includes a continuous integration and deployment workflow in `.github/workflows/ci-cd.yml` that:
1. Runs FastAPI backend unit tests & verifies 1-page PDF generation budget.
2. Lints and builds the React frontend production bundle.
3. Packages and publishes Docker images to **GitHub Container Registry (`ghcr.io`)**.
4. Automatically triggers deployment on your **Komodo** orchestrator.

### Setting Up Komodo

#### Option A: Webhook Deployment (Recommended)
1. In the **Komodo UI**, create a new Stack for `miso-omnisearch`.
2. Link it to this repository or use `docker-compose.prod.yml`.
3. In Stack Settings, enable the **Webhook** and copy the generated Webhook URL.
4. In GitHub (**Settings > Secrets and variables > Actions**), add as secrets:
   - `KOMODO_WEBHOOK_URL`: Your Komodo stack webhook URL (e.g. `https://komodo.yourdomain.com/listener/github/stack/miso-omnisearch`)
   - `KOMODO_WEBHOOK_SECRET` *(optional)*: Secret token if configured in Komodo.

#### Option B: Komodo Core API Deployment
Configure the following GitHub secrets:
- `KOMODO_HOST`: `https://komodo.yourdomain.com`
- `KOMODO_API_KEY`: Your Komodo API key
- `KOMODO_API_SECRET`: Your Komodo API secret
- `KOMODO_STACK_NAME`: `miso-omnisearch` (or your stack name)
