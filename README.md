# ⚡ MISO OmniSearch: Predictive Context & Comparative Knowledge Engine
> **Xtern Fall 2026 Challenge Submission** | **Partner:** Midcontinent Independent System Operator (MISO)  
> **Challenge Prompt 1:** *Intelligent Navigation of MISO's Public Information*

[![Status](https://img.shields.io/badge/Status-Production%20Hardened-0284C7.svg)]()
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-059669.svg)]()
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind-0284C7.svg)]()
[![Live Data](https://img.shields.io/badge/Live%20MISO%20Feed-Active%20(5--min)-10B981.svg)]()
[![AI Grounding](https://img.shields.io/badge/Gemini%203.6-Zero--Hallucination%20Firewall-7C3AED.svg)]()
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-10B981.svg)]()

---

## 🌟 What is MISO OmniSearch?

**MISO OmniSearch** is an enterprise-grade energy intelligence and discovery engine built to transform how **Market & Power Traders**, **Municipal Utilities & Electric Co-ops**, **State Regulators**, and the **Public / Media** discover, analyze, and extract MISO's public energy data.

Instead of navigating complex multi-page PDF filings or struggling with discontinued legacy CSV files, OmniSearch provides:

1. ⚡ **Real-Time Live MISO Operations Feed:** Continuously streams live 5-minute fuel generation (MW & percentage mix) directly from MISO's public operations endpoint (`public-api.misoenergy.org`) with an in-memory 60-second TTL cache to honor MISO's rate limits and provide resilient zero-downtime fallback.
2. 🧠 **Session-Aware Journey Pre-Fetching:** Detects active browsing paths on `misoenergy.org` and pre-loads relevant regional metrics with **zero cold start**.
3. 🎯 **Dynamic Persona Inference:** Passively analyzes search syntax and technical terminology (e.g., arbitrage spreads vs. retail co-op rates vs. policy compliance) to proactively recommend the ideal audience perspective with a 1-click switcher.
4. 📊 **360° Knowledge Canvas:** Verified answers backed by official corporate fact-sheet citations, isolated KPI stat cards, and interactive Recharts graphs.
5. 💬 **Canvas Copilot Chat Drawer:** An accessible slide-out AI assistant powered by Google Gemini (`gemini-3.6-flash`) with conversation memory grounded strictly in the active canvas metrics.
6. ⚖️ **Side-by-Side Comparison Engine:** Point-and-click comparative matrices benchmarking **Market Hubs** (*Indiana vs. Michigan vs. Texas*), **Fuel Types** (*Wind vs. Solar vs. Gas*), and **Transmission Portfolios** (*MTEP vs. LRTP vs. JTIQ*).
7. 📄 **1-Click Branded PDF Briefing Studio:** Generates executive, publication-ready 1-page PDF fact sheets (ReportLab with strict 0-page-spillover spatial budgets) in under 3 seconds.
8. 🛠️ **Engineer Feedback Loop:** Built-in triage modal enabling market participants to submit ratings, bug reports, and data discrepancies directly to engineers with full query context.

---

## 🏛️ System Architecture

```
                                  ┌──────────────────────────────────┐
                                  │      MISO Public Ecosystem       │
                                  │  • public-api.misoenergy.org     │
                                  │  • MISO Data Exchange (Azure)    │
                                  │  • Corp Fact Sheet & MTEP24      │
                                  └─────────────────┬────────────────┘
                                                    │ Live 5-min Polling / Baseline
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Python 3.11 Backend                                 │
│                                                                                            │
│   ┌────────────────────┐   ┌─────────────────────────┐   ┌──────────────────────────────┐  │
│   │   miso_client.py   │   │     data_manager.py     │   │      search_engine.py        │  │
│   │  60s TTL Cache     │──►│  Multi-Hubs, Fuel Peaks │──►│  Keyword Matcher, Crosswalk  │  │
│   │  APIM Header Auth  │   │  MTEP Tranches, Seams   │   │  Dynamic Persona Classifier  │  │
│   └────────────────────┘   └─────────────────────────┘   └──────────────┬───────────────┘  │
│                                                                         │                  │
│   ┌─────────────────────────────────────────────────────────────┐       │                  │
│   │                      llm_service.py                         │◄──────┘                  │
│   │  • Google Gemini 3.6 Flash Client                           │                          │
│   │  • Numerical Grounding Firewall (_verify_numerical_bounds)  │                          │
│   │  • Persona-Tailored Direct Answers & Canvas Copilot         │                          │
│   └─────────────────────────────┬───────────────────────────────┘                          │
│                                 │                                                          │
│   ┌─────────────────────────────┼───────────────────────────────┐                          │
│   │     pdf_generator.py        │       user_feedback.json      │                          │
│   │  1-Page ReportLab Briefing  │  POST /api/feedback Storage   │                          │
│   └─────────────────────────────┴───────────────────────────────┘                          │
└─────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                          │ REST API (port 8000)
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                               React 18 + Vite + Tailwind UI                                │
│                                                                                            │
│   ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│   │  App.tsx Shell — Persona Switcher Banner & Engineer Feedback Triage Modal           │   │
│   └──────┬──────────────────────┬──────────────────────┬──────────────────────┬────────┘   │
│          ▼                      ▼                      ▼                      ▼            │
│   [OmniSearch Bar]      [Session Radar]       [360° Canvas]       [Comparison Matrix]      │
│   Ctrl+K, Auto-Suggest  Zero Cold Start       KPIs, Recharts      Multi-Hub / Fuels / Plan │
│                                               Export PDF / CSV    Congestion Divergence    │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Repository Structure

```
Xtern2026-MISO/
├── backend/
│   ├── main.py                  # FastAPI server with health, search, compare, & feedback routes
│   ├── miso_client.py           # Real-time MISO operations client with 60s TTL cache
│   ├── search_engine.py         # Search routing, intent detection, & persona inference
│   ├── data_manager.py          # Ground-truth data loader, telemetry, & crosswalk lookup
│   ├── llm_service.py           # Gemini 3.6 client with numerical grounding firewall
│   ├── pdf_generator.py         # 1-Click publication-ready PDF fact sheet builder
│   ├── test_live_miso_and_hardening.py  # Unit tests for live client, feedback, & grounding
│   ├── test_api_and_pdf.py      # End-to-end API and PDF spatial budget test suite
│   ├── data/                    # Authoritative datasets & schemas
│   │   ├── fuel_peaks.json      # Fuel mix, peak records, & Manitoba Canadian province footprint
│   │   ├── market_hubs.json     # 6 regional hubs (Indiana, Michigan, Illinois, Minn, Texas, LA)
│   │   ├── mtep_projects.json   # Transmission portfolios (Local MTEP, LRTP Tranche 1 & 2, JTIQ)
│   │   ├── related_queries.json # Intent graph nodes & interactive research follow-up actions
│   │   ├── user_feedback.json   # Persisted user & engineer feedback records
│   │   ├── NOTES_data_provenance.md # Provenance notes, fact-sheet citations, & audit trails
│   │   └── README.md            # Data layer schema contracts & conventions
│   ├── crosswalk.json           # Legacy CSV report column ↔ MISO API endpoint dictionary
│   ├── glossary.json            # 45+ MISO acronyms with ELI5 and technical definitions
│   └── requirements.txt         # Pinned Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/          # OmniSearch, SessionRadar, KnowledgeCanvas, ComparisonMatrix,
│   │   │                        # CanvasCopilotDrawer, FeedbackModal, AudioBriefing, JargonHUD
│   │   ├── lib/api.ts           # Type-safe API client for all backend endpoints
│   │   ├── types.ts             # TypeScript interfaces mirroring backend Pydantic models
│   │   └── App.tsx              # Root composition, dynamic persona banner, & global modal states
│   ├── package.json             # Pinned React dependencies
│   └── vite.config.ts           # Vite development and bundle configuration
├── docs/
│   ├── MISO_OmniSearch_Executive_Showcase_Google_Doc.md # Complete executive showcase briefing
│   ├── frontend-technical-documentation.md              # Frontend architecture & component specs
│   ├── csr-deflection-roi-model.md                      # $3.01M CSR deflection financial model
│   └── accessibility-audit.md                           # WCAG 2.1 AA compliance audit report
├── presentation/
│   ├── pitch-deck-outline.md    # 12-slide executive presentation outline
│   └── demo-video-script.md     # 2-minute live demo recording storyboard & script
├── .github/issues/              # 17 Master GitHub task issues & copy-paste LLM prompts
└── TASKS_AND_ISSUES.md          # Team task roadmap & implementation tracking
```

---

## ⚡ Quickstart

### 🐳 1. Docker Compose (Full Stack in 1 Command)
```bash
# Build and run both backend and frontend containers
docker compose up --build
```
- **Web Application**: `http://localhost:3000`
- **Interactive Backend API Docs**: `http://localhost:8000/docs`
- **Root Health Gateway**: `http://localhost:8000/`

---

### 💻 2. Local Development (Without Docker)

#### Prerequisites
- **Python 3.10+** (tested on 3.11)
- **Node.js 18+** & `npm`
- **Google Gemini API Key** (optional, fallback engine active if omitted)

#### Backend Setup
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # On Windows (or source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env     # Set GEMINI_API_KEY and MISO_API_KEY (optional)

# Run server
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
Backend API will be live at `http://localhost:8000`.

#### Frontend Setup
```bash
cd frontend
npm install

# Start Vite dev server
npm run dev
```
Frontend interface will be live at `http://localhost:3000` (or `http://localhost:5173`).

---

## 🧪 Automated Testing & Verification

Run the comprehensive test suites to verify backend integrity, live MISO operations connectivity, numerical grounding, and PDF layout budgets:

```bash
# Run backend live API and technical hardening tests
cd backend
.\.venv\Scripts\python.exe -m pytest test_live_miso_and_hardening.py -v

# Run full API and PDF 1-page budget tests
.\.venv\Scripts\python.exe -m pytest test_api_and_pdf.py -v

# Run frontend TypeScript typecheck and production build
cd ../frontend
npm run build
```

---

## 📊 Provenance & Ground Truth Data

All baseline metrics, transmission projects, and acronym definitions are strictly anchored to verified MISO publications:
- **Corporate Fact Sheet (July 2025)**: Generation mix, all-time record demand (127.1 GW), wind peak (25.6 GW), solar peak (13.4 GW), and service territory (15 states + Manitoba).
- **MISO Public Operations API (`public-api.misoenergy.org`)**: Live 5-minute generation and demand telemetry.
- **MTEP24 & LRTP Filings**: Regional LRTP Tranche 1 ($10.3B) and Tranche 2 ($21.8B) project allocations, alongside the Joint Targeted Interconnection Queue (JTIQ, $1.6B).
- Detailed citations and notes are documented in [`backend/data/NOTES_data_provenance.md`](file:///c:/Users/faris/OneDrive/Documents/Xtern2026-MISO/Xtern2026-MISO/backend/data/NOTES_data_provenance.md).

---

## 👥 Team Role Allocation & Issues

Track all 17 completed project issues and LLM prompt templates in [`TASKS_AND_ISSUES.md`](file:///c:/Users/faris/OneDrive/Documents/Xtern2026-MISO/Xtern2026-MISO/TASKS_AND_ISSUES.md):
- **Member 1 (Lead Backend & AI):** Issues #1, #2, #9, #11, #12, #14, #17
- **Member 2 (Frontend & Data Viz Lead):** Issues #3, #4, #10, #15, #16
- **Member 3 (Data & Knowledge Graph Lead):** Issues #5, #6, #13
- **Member 4 (UI/UX & Accessibility Lead):** Issue #7
- **Member 5 (Product Management & Pitch Lead):** Issue #8
