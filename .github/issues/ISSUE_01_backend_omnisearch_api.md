# [Issue #1] [Member 1: Backend] Build FastAPI OmniSearch Pipeline, Session Pre-Fetching & Multi-Hub Endpoints

## 📌 Context & Objective
MISO OmniSearch requires high-speed, asynchronous REST API endpoints that power the **360° Knowledge Canvas**, deliver **Session-Aware Pre-Fetching** (so users have zero cold-start delay), and provide **Multi-Hub / Multi-Fuel comparison data**.

## 🛠️ Files to Create / Modify
* `backend/main.py`
* `backend/search_engine.py`
* `backend/data_manager.py`

## 📋 Specific Tasks
1. **Implement `GET /api/search?q={query}&persona={persona}`:**
   * Accepts natural language queries (e.g., `"Indiana Hub LMP"`, `"Wind vs Solar peak"`, `"What is LRTP?"`).
   * Searches the structured knowledge graph and market datasets.
   * Returns structured JSON:
     ```json
     {
       "query": "Indiana Hub LMP",
       "directAnswer": "Indiana Hub Real-Time LMP average is $38.45/MWh...",
       "sourceCitation": "MISO Data Exchange API (GET /api/v1/markets/realtime/lmp)",
       "kpis": [
         {"label": "Real-Time Avg", "value": "$38.45/MWh", "color": "sky"},
         {"label": "Day-Ahead Avg", "value": "$37.20/MWh", "color": "slate"},
         {"label": "Peak Hour", "value": "HE 18 ($48.20)", "color": "red"},
         {"label": "Volume", "value": "350 GWh", "color": "emerald"}
       ],
       "chartType": "lmp_series",
       "hubId": "INDIANA.HUB",
       "proactiveFollowUps": [
         {"label": "Compare Indiana vs. Michigan Hub", "action": "compare_hubs", "params": {"hubs": ["INDIANA.HUB", "MICHIGAN.HUB"]}},
         {"label": "Show Day-Ahead Price Spread", "action": "show_spread", "params": {"hub": "INDIANA.HUB"}},
         {"label": "Download Hourly CSV Dataset", "action": "download_csv", "params": {"hub": "INDIANA.HUB"}}
       ]
     }
     ```
2. **Implement `GET /api/session-prefetch`:**
   * Returns a pre-computed intelligence payload based on active browsing context (e.g. Indiana clean energy & transmission overview) with zero latency.
3. **Implement `GET /api/compare?type={hubs|fuels|plans}&items={id1,id2}`:**
   * Returns aligned multi-series records for synchronized Recharts graphing.

## ✅ Acceptance Criteria
* [ ] Fast response time (< 50ms) using asynchronous FastAPI routes.
* [ ] CORS enabled for `http://localhost:3000` and production domains.
* [ ] Complete OpenAPI/Swagger documentation accessible at `http://localhost:8000/docs`.

---

## 🤖 Copy-Paste LLM Prompt (For Member 1)
> *"Act as a Senior Python Backend Engineer. We are building the backend for MISO OmniSearch using FastAPI. Write a complete, production-ready `backend/search_engine.py` and update `backend/main.py` that implements `/api/search`, `/api/session-prefetch`, and `/api/compare` with full Pydantic response models, mock MISO market data integration, and structured JSON output matching the specification above."*
