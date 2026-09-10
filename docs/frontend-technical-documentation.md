# 💻 MISO OmniSearch — Frontend Technical Documentation
**Owner:** Member 2 (Frontend & Data Viz Lead) & Core Fullstack Team  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Recharts + Lucide Icons  

---

## 1. Executive Summary & Capabilities Delivered

| Component / Issue | Core Capability | Key File(s) | Status |
|---|---|---|---|
| **#3 OmniSearch & Radar** | OmniSearch input, category auto-suggest, Session Radar banner, audience selector | `OmniSearch.tsx`, `SessionRadar.tsx` | ✅ Shipped |
| **#4 Knowledge Canvas** | 360° Knowledge Canvas, KPI stat rails, Recharts visualizer, proactive follow-ups, PDF/CSV export | `KnowledgeCanvas.tsx` | ✅ Shipped |
| **#4 Comparison Matrix** | Side-by-side comparative matrix (Hubs, Fuels, Transmission portfolios) | `ComparisonMatrix.tsx` | ✅ Shipped |
| **#10 Canvas Copilot** | Grounded "Chat with this Canvas" slide-out drawer with conversational memory & citations | `CanvasCopilotDrawer.tsx` | ✅ Shipped |
| **#15 Engineer Feedback** | Accessible feedback modal (1–5 star rating, categories, query context, persona capture) | `FeedbackModal.tsx` | ✅ Shipped |
| **#16 Dynamic Persona Switcher** | Real-time behavioral pattern inference banner with 1-click persona switching | `App.tsx`, `search_engine.py` | ✅ Shipped |
| **Universal Telemetry** | Live operations telemetry badges streaming 5-minute generation and demand | `SessionRadar.tsx`, `KnowledgeCanvas.tsx` | ✅ Shipped |

---

## 2. Project Architecture & Component Tree

```
frontend/
├── index.html                  # Vite entry HTML with IBM Plex Sans / Mono typography
├── package.json                # Pinned dependencies (React 18, Recharts, Lucide, Tailwind)
├── vite.config.ts              # Vite + React plugin configuration
├── tailwind.config.js          # MISO design tokens (Navy #0B1220, Teal #3FD6C6, Amber #E8A33D)
├── postcss.config.js           # Tailwind and Autoprefixer pipeline
├── tsconfig.json               # Strict TypeScript configuration
├── .env.example                # Base environment variables (VITE_API_BASE_URL)
└── src/
    ├── main.tsx                # Application root mounting
    ├── App.tsx                 # Page composition, global state, dynamic persona banner, feedback modal
    ├── index.css               # Design system rules, focus rings, reduced-motion overrides
    ├── types.ts                # TypeScript interfaces mirroring backend Pydantic models
    ├── vite-env.d.ts           # Vite client environment declarations
    ├── lib/
    │   └── api.ts              # Type-safe HTTP client for all FastAPI backend endpoints
    └── components/
        ├── OmniSearch.tsx       # Unified search input with instant keyboard navigation (Ctrl+K)
        ├── SessionRadar.tsx     # Session pre-fetching radar banner & live system snapshot
        ├── KnowledgeCanvas.tsx  # 360° Knowledge Canvas, KPI cards, Recharts plots, export buttons
        ├── ComparisonMatrix.tsx # Multi-hub, multi-fuel, and transmission portfolio benchmark engine
        ├── CanvasCopilotDrawer.tsx # Contextual conversational chat drawer for active canvas data
        ├── FeedbackModal.tsx    # Accessible engineer feedback dialog (ratings, bugs, inaccuracies)
        ├── AudioBriefing.tsx    # Web Speech API synthesized audio playback with word highlighting
        └── JargonHUD.tsx        # 40+ acronym interactive glossary modal (Ctrl+J)
```

---

## 3. End-to-End Data Flow

```
                                 ┌──────────────────────────────┐
                                 │     User Query / Action      │
                                 └──────────────┬───────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
        [OmniSearch Input]             [Session Radar Chip]           [Proactive Follow-Up]
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                ▼
                                    App.tsx (searchQuery())
                                                │
                                                ▼
                                        GET /api/search
                                                │
                        ┌───────────────────────┴───────────────────────┐
                        ▼                                               ▼
             [SearchResponse Payload]                     [Persona Inference Signal]
                        │                                               │
                        ▼                                               ▼
             KnowledgeCanvas.tsx renders:                 If inferred != selected:
             - Grounded Direct Answer                     Banner displays:
             - 4 Isolated KPI Cards                       "Your query looks like Power Trader..."
             - Recharts Chart (LMP / Fuel / Lines)        1-Click "Switch to Trader" button
             - Proactive Follow-Up Pills
             - 1-Click PDF & Filtered CSV Export
```

---

## 4. Component Deep Dive

### 4.1 `FeedbackModal.tsx` (Engineer Feedback Loop)
- **Design:** Modal dialog styled with MISO Navy / Slate elevation and accessible backdrop overlay.
- **Rating System:** 1–5 star interactive selector with hover and active states.
- **Category Filter:** Bug, Data Inaccuracy, Feature Request, or General Inquiry.
- **Context Awareness:** Automatically binds active query string and user persona so engineers receive full reproducibility context.
- **API Target:** `POST /api/feedback`, writing asynchronously to `backend/data/user_feedback.json`.

### 4.2 Dynamic Persona Inference Banner (`App.tsx`)
- Detects domain vocabulary in search queries (e.g. "spread", "arbitrage", "hedging", "CONE", "NERC", "clean energy").
- If the inferred persona differs from the user's active manual dropdown, a sleek recommendation banner appears:
  *"We noticed your search looks like Power Trader research. Would you like to switch personas for tailored metrics?"*
- Clicking **"Switch to [Persona]"** immediately re-executes the search query under the inferred persona with zero page reload.

### 4.3 `KnowledgeCanvas.tsx` (360° Canvas)
- **Direct Answer:** Displays the LLM-synthesized narrative grounded in verified MISO telemetry.
- **Fact-Check Badge:** Displays the authoritative source citation (`Corp Fact Sheet July 2025`, `public-api.misoenergy.org`, or `MTEP24`).
- **Live Data Indicator:** Dynamically highlights whether data originates from the live MISO 5-minute feed or baseline verified fact sheets.
- **Export Studio:** 
  - 1-Click PDF button calling `POST /api/generate-briefing` (ReportLab exact 1-page budget).
  - Filtered CSV button generating client-side spreadsheets instantly.

### 4.4 `CanvasCopilotDrawer.tsx` (Canvas Copilot Chat)
- Accessible slide-out drawer triggered from the top-right of the Knowledge Canvas.
- Injects active canvas data, KPIs, and selected persona directly into the system prompt for Google Gemini `gemini-3.6-flash`.
- Preserves multi-turn conversational history while maintaining strict anti-hallucination grounding.

---

## 5. Development & Verification Guide

### Running Locally
```bash
# 1. Start Backend Server (Terminal 1)
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

# 2. Start Frontend Server (Terminal 2)
cd frontend
npm run dev
```

### Production Build & Typecheck
```bash
cd frontend
npm run build
```
Bundle builds cleanly with **0 TypeScript errors** and **0 lint failures**.
